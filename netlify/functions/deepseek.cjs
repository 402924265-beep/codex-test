const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { getStore } = require("@netlify/blobs");

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
10. 只返回JSON对象：{"answer":"回答","followups":["最多三个追问"]}。
11. 必须使用请求指定的语言回答；zh为中文、en为英文、tr为土耳其语。`;
const INTENT_PROMPT = `你只负责把制造费用口语问题解析为查询条件，不计算、不回答、不猜数字。只输出JSON对象，字段为metric（指标或科目名称，不明确时空字符串）、factory（dw、ck、combined或null）、separate（布尔值）、year（25、26或null）、month（1到12或null）、periods（monthly、cumulative组成的数组）。洗碗机=DW，厨电=CK；“两厂分别”用combined且separate=true，“两厂合计”用combined且separate=false。制造费、单台制造费均对应“制造费用”；工资和人工不能擅自合并成一个科目。用户没说出的条件用null或空数组，不要从示例臆造。只解析用户本轮问题；上一轮上下文可用于“那同比呢”等追问。`;

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

function overlap(question, example) {
  const pairs = (value) => new Set([...String(value || "").replace(/\s/g, "")].slice(0, 120).map((char, index, chars) => char + (chars[index + 1] || "")).filter((pair) => pair.length > 1));
  const a = pairs(question), b = pairs(example);
  return [...a].filter((pair) => b.has(pair)).length;
}

async function learningExamples(question) {
  try {
    const examples = await getStore({ name: "mfg-assistant-learning", consistency: "strong" }).get("approved-examples", { type: "json" });
    return (Array.isArray(examples) ? examples : []).map((item) => ({ ...item, score: overlap(question, item.question) })).filter((item) => item.score >= 2).sort((a, b) => b.score - a.score).slice(0, 3).map(({ question: original, correctedQuestion }) => ({ original, correctedQuestion }));
  } catch {
    return [];
  }
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
    const language = ["zh", "en", "tr"].includes(incoming.language) ? incoming.language : "zh";
    if (incoming.mode === "intent") {
      if (!question || question.length > 1_000) return json(400, { error: "问题格式无效" });
      const examples = await learningExamples(question);
      const previous = incoming.context && typeof incoming.context === "object" ? {
        subject: String(incoming.context.subject || "").slice(0, 100),
        factory: ["dw", "ck", "combined"].includes(incoming.context.factory) ? incoming.context.factory : null,
        year: ["25", "26"].includes(incoming.context.year) ? incoming.context.year : null,
        month: Number.isInteger(incoming.context.month) && incoming.context.month >= 1 && incoming.context.month <= 12 ? incoming.context.month : null,
        dual: incoming.context.dual === true
      } : null;
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST", headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, messages: [{ role: "system", content: INTENT_PROMPT + (examples.length ? `\n以下是人工审核通过的口语纠错示例，只学习表达方式，不照搬示例里的月份、工厂或指标：${JSON.stringify(examples)}` : "") }, { role: "user", content: `上一轮已确认条件：${JSON.stringify(previous)}\n本轮问题：${question}\n请严格输出JSON。` }], response_format: { type: "json_object" }, temperature: 0, max_tokens: 300, stream: false })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return json(502, { error: `DeepSeek语义识别失败（${response.status}）` });
      const parsed = parseModelContent(result?.choices?.[0]?.message?.content);
      const intent = {
        metric: String(parsed.metric || "").slice(0, 100),
        factory: ["dw", "ck", "combined"].includes(parsed.factory) ? parsed.factory : null,
        separate: parsed.separate === true,
        year: ["25", "26"].includes(String(parsed.year)) ? String(parsed.year) : null,
        month: Number.isInteger(parsed.month) && parsed.month >= 1 && parsed.month <= 12 ? parsed.month : null,
        periods: Array.isArray(parsed.periods) ? parsed.periods.filter((item) => ["monthly", "cumulative"].includes(item)).slice(0, 2) : []
      };
      return json(200, { intent, model: result.model || MODEL });
    }
    if (!question || question.length > 1_000 || !evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
      return json(400, { error: "问题或数据格式无效" });
    }

    const messages = [{
      role: "system",
      content: SYSTEM_PROMPT + `\n本次回答语言：${language}。` + (knowledge ? `\n\n以下是制造费计算知识库。只用于解释公式、分类和边界；数值以本次证据JSON为准：\n${knowledge}` : "")
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
