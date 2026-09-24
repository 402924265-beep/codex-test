const { createHash, randomUUID, timingSafeEqual } = require("node:crypto");
const { getStore } = require("@netlify/blobs");

const STORE = "mfg-assistant-learning";
const normalize = (value) => String(value || "").normalize("NFKC").toLowerCase().replace(/[\s，。！？；：、,.!?;:]/g, "");
const keyFor = (question, scope) => `approved/${createHash("sha256").update(`${scope}|${normalize(question)}`).digest("hex")}`;
const reply = (statusCode, body) => ({ statusCode, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }, body: JSON.stringify(body) });
const clean = (value, limit) => typeof value === "string" ? value.trim().slice(0, limit + 1) : "";

function authorized(event) {
  const expected = process.env.COST_LEARNING_ADMIN_TOKEN || "";
  const supplied = event.headers?.["x-learning-admin-token"] || event.headers?.["X-Learning-Admin-Token"] || "";
  const providedBytes = Buffer.from(supplied), expectedBytes = Buffer.from(expected);
  if (expectedBytes.length < 24 || providedBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(providedBytes, expectedBytes);
}

async function appendExample(store, record) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const previous = await store.getWithMetadata("approved-examples", { type: "json" });
    const examples = Array.isArray(previous?.data) ? previous.data : [];
    const next = [...examples.filter((item) => item.scope !== record.scope || normalize(item.question) !== normalize(record.question)), { question: record.question, scope: record.scope, correctedQuestion: record.correctedQuestion }].slice(-40);
    const condition = previous ? { onlyIfMatch: previous.etag } : { onlyIfNew: true };
    if ((await store.setJSON("approved-examples", next, condition)).modified) return;
  }
  throw Error("审核示例并发更新失败，请重试");
}

function createHandler(openStore = () => getStore({ name: STORE, consistency: "strong" })) {
  return async function handler(event) {
    if (event.httpMethod !== "POST") return reply(405, { error: "仅支持 POST" });
    if (!event.body || Buffer.byteLength(event.body) > 4_000) return reply(400, { error: "请求内容无效" });
    let input;
    try { input = JSON.parse(event.body); } catch { return reply(400, { error: "请求格式无效" }); }
    const action = input?.action;
    if (!["resolve", "submit", "pending", "approve", "reject"].includes(action)) return reply(400, { error: "未知操作" });
    if (["pending", "approve", "reject"].includes(action) && !authorized(event)) return reply(403, { error: "审核口令无效或尚未配置" });
    try {
      const store = openStore();
      const scope = clean(input.scope, 50);
      if (["resolve", "submit"].includes(action) && !/^(?:dw|ck|combined):(25|26):(?:[1-9]|1[0-2]):(?:monthly|cumulative)$/.test(scope)) return reply(400, { error: "查询范围无效" });
      if (action === "resolve") {
        const question = clean(input.question, 500);
        if (!normalize(question) || question.length > 500) return reply(400, { error: "问题格式无效" });
        const approved = await store.get(keyFor(question, scope), { type: "json" });
        return reply(200, { correctedQuestion: approved?.correctedQuestion || null, approvedAt: approved?.approvedAt || null });
      }
      if (action === "submit") {
        const question = clean(input.question, 500), correctedQuestion = clean(input.correctedQuestion, 500), note = clean(input.note, 1_000);
        const kind = input.kind;
        if (!normalize(question) || question.length > 500 || !["intent", "data"].includes(kind) || note.length > 1_000 || kind === "intent" && (!normalize(correctedQuestion) || correctedQuestion.length > 500 || normalize(question) === normalize(correctedQuestion)) || kind === "data" && !note) return reply(400, { error: "请填写原问题，以及有效的纠正说法或数字问题说明" });
        const record = { id: randomUUID(), kind, question, scope, correctedQuestion: kind === "intent" ? correctedQuestion : "", note, submittedAt: new Date().toISOString() };
        await store.setJSON(`pending/${record.id}`, record);
        return reply(202, { id: record.id, status: "pending", message: "已提交审核；通过后全站生效，金额和公式不会自动更改" });
      }
      if (action === "pending") {
        const items = await store.list({ prefix: "pending/" });
        const records = await Promise.all(items.blobs.slice(0, 100).map((item) => store.get(item.key, { type: "json" })));
        return reply(200, { items: records.filter(Boolean).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)) });
      }
      const id = String(input.id || "");
      if (!/^[0-9a-f-]{36}$/.test(id)) return reply(400, { error: "记录编号无效" });
      const record = await store.get(`pending/${id}`, { type: "json" });
      if (!record) return reply(404, { error: "待审核记录不存在" });
      if (action === "approve") {
        if (record.kind !== "intent") return reply(400, { error: "数字问题只能核查，不能自动训练或修改财务数据" });
        const approved = { ...record, approvedAt: new Date().toISOString() };
        await appendExample(store, approved);
        await store.setJSON(keyFor(record.question, record.scope), approved);
      }
      await store.setJSON(`reviewed/${id}`, { ...record, decision: action, reviewedAt: new Date().toISOString() });
      await store.delete(`pending/${id}`);
      return reply(200, { status: action === "approve" ? "approved" : "rejected" });
    } catch (error) {
      console.error("Learning store operation failed:", error);
      return reply(503, { error: "共享纠错服务暂不可用，请稍后重试" });
    }
  };
}

exports.handler = createHandler();
exports.createHandler = createHandler;
exports.normalize = normalize;
