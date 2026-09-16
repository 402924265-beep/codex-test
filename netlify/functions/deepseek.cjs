const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-flash";
const BASE_URL = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
const API_KEY = (process.env.DEEPSEEK_API_KEY || "").trim();
const MAX_BODY = 900_000;
const NUMERIC_CLAIM = /[+-]?\d[\d,.]*\s*(?:K€|k€|€\/台|€\/人|€|%|万欧元?|人月|台|人)/i;
const SYSTEM_PROMPT = `你是制造费用工作台内的指标分析助手。用户问题会附带由本地确定性引擎生成的数据证据。
必须遵守：
1. 只使用证据里的范围和已计算事实，不猜测或补造数据。
2. 页面确定的工厂、年份和期间是唯一查询范围。
3. 金额为K€，单台为€/台，人均为€/人。比率必须说明比较基准。
4. 页面已展示本地确定性数值。你只补充主要变化和待核实事项，不重复、改写或重新计算数字。
5. 人工优先看公司人工成本人均和工资人均；工资科目零/非零切换先视为重分类线索。
6. 产量相关费用优先看单台或产量调整后差异；固定费用单台变化只表示分摊变化。
7. 不向用户显示SAP编码，不输出长篇说明。
8. 只有evidence.consistency.status为mismatch时才禁止结论；single-month-no-sum-required表示单月无需累计勾稽，不是数据不足。
9. “为什么高/低、怎么这么高/低、异常、变化”等问法属于比较意图。用户未指定基准时，先分别说明同比和环比方向，再结合费用与产量方向判断更接近费用变化还是产量分摊变化；业务根因证据不足时只列待核实项。
10. 只返回JSON对象：{"answer":"中文回答","followups":["最多三个追问"]}。`;

let knowledge = "";
try {
  knowledge = readFileSync(join(__dirname, "deepseek-cost-knowledge.md"), "utf8").trim().slice(0, 50_000);
} catch {}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    },
    body: JSON.stringify(body)
  };
}

function parseModelContent(content) {
  if (content && typeof content === "object") return content;
  const text = String(content || "").trim();
  if (!text) throw new Error("DeepSeek未返回有效回答");
  const candidates = [text];
  if (text.startsWith("```")) candidates.push(text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start >= 0 && end > start) candidates.push(text.slice(start, end + 1));
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {}
  }
  return { answer: text, followups: [] };
}

function validateAnswer(answer, evidence) {
  if (evidence?.consistency?.status === "mismatch") throw new Error("本地逐月表与累计金额不一致，已禁止输出结论");
  if (evidence?.narrativeOnly && NUMERIC_CLAIM.test(answer)) throw new Error("DeepSeek重复或改写了本地数值，已禁止输出该结论");
}

exports.handler = async function handler(event) {
  if (event.httpMethod === "GET" && (event.queryStringParameters?.status === "1" || event.path?.endsWith("/status"))) {
    return json(200, { configured: Boolean(API_KEY), model: MODEL, knowledgeLoaded: Boolean(knowledge) });
  }
  if (event.httpMethod !== "POST") return json(405, { error: "仅支持POST请求" });
  if (!API_KEY) return json(503, { error: "DeepSeek API Key尚未配置" });
  if (!event.body || Buffer.byteLength(event.body) > MAX_BODY) return json(400, { error: "请求内容过大或为空" });

  try {
    const incoming = JSON.parse(event.body);
    const question = String(incoming.question || "").trim();
    const evidence = incoming.evidence;
    if (!question || question.length > 1_000 || !evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
      return json(400, { error: "问题或数据格式无效" });
    }

    const messages = [{
      role: "system",
      content: SYSTEM_PROMPT + (knowledge ? `\n\n以下是制造费计算知识库。只用于解释公式、分类和边界；数值以本次证据JSON为准：\n${knowledge}` : "")
    }];
    for (const item of Array.isArray(incoming.history) ? incoming.history.slice(-4) : []) {
      const role = item?.role, content = String(item?.content || "").slice(0, 2_000);
      if (["user", "assistant"].includes(role) && content) messages.push({ role, content });
    }
    messages.push({ role: "user", content: `用户问题：${question}\n本地数据证据JSON：${JSON.stringify(evidence)}\n请严格输出JSON。` });

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages, response_format: { type: "json_object" }, temperature: 0.1, max_tokens: 1_200, stream: false })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = String(result?.error?.message || "").slice(0, 240);
      return json(502, { error: `DeepSeek请求失败（${response.status}）${detail ? `：${detail}` : ""}` });
    }

    const parsed = parseModelContent(result?.choices?.[0]?.message?.content);
    const answer = String(parsed.answer || "").trim();
    if (!answer) throw new Error("DeepSeek未返回有效回答");
    validateAnswer(answer, evidence);
    const followups = (Array.isArray(parsed.followups) ? parsed.followups : []).map(String).filter(Boolean).map(value => value.slice(0, 120)).slice(0, 3);
    return json(200, { answer, followups, model: result.model || MODEL, knowledgeLoaded: Boolean(knowledge) });
  } catch (error) {
    return json(400, { error: error instanceof SyntaxError ? "问题或数据格式无效" : String(error.message || "DeepSeek暂时无法连接") });
  }
};
