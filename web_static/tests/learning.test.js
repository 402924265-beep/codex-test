import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createHandler } = require("../../netlify/functions/learning.cjs");

function memoryStore() {
  const entries = new Map();
  let version = 0;
  return {
    async get(key) { return entries.get(key)?.data ?? null; },
    async getWithMetadata(key) { const item = entries.get(key); return item ? { data: item.data, etag: item.etag } : null; },
    async setJSON(key, data, options = {}) {
      const current = entries.get(key);
      if (options.onlyIfNew && current || options.onlyIfMatch && current?.etag !== options.onlyIfMatch) return { modified: false };
      const etag = `v${++version}`;
      entries.set(key, { data: structuredClone(data), etag });
      return { modified: true, etag };
    },
    async list({ prefix }) { return { blobs: [...entries.keys()].filter((key) => key.startsWith(prefix)).map((key) => ({ key })) }; },
    async delete(key) { entries.delete(key); }
  };
}

test("correction is shared only after authenticated approval; data issues never rewrite it", async () => {
  const previous = process.env.COST_LEARNING_ADMIN_TOKEN;
  process.env.COST_LEARNING_ADMIN_TOKEN = "test-only-admin-token-123456789";
  try {
    const handler = createHandler(() => memory);
    const call = async (action, data = {}, token = "") => {
      const response = await handler({ httpMethod: "POST", headers: token ? { "x-learning-admin-token": token } : {}, body: JSON.stringify({ action, ...data }) });
      return { httpStatus: response.statusCode, ...JSON.parse(response.body) };
    };
    const memory = memoryStore();
    const question = "2026年8月两个工厂加起来制造费是多少？";
    const scope = "combined:26:8:cumulative";
    const correctedQuestion = "2026年8月两个工厂合计制造费用当月金额是多少？";
    const initial = await call("resolve", { question, scope });
    assert.equal(initial.correctedQuestion, null);
    const proposed = await call("submit", { kind: "intent", question, scope, correctedQuestion });
    assert.equal(proposed.httpStatus, 202);
    assert.equal((await call("resolve", { question, scope })).correctedQuestion, null);
    assert.equal((await call("approve", { id: proposed.id })).httpStatus, 403);
    assert.equal((await call("approve", { id: proposed.id }, "wrong-token")).httpStatus, 403);
    const pending = await call("pending", {}, process.env.COST_LEARNING_ADMIN_TOKEN);
    assert.equal(pending.items.length, 1);
    assert.equal((await call("approve", { id: proposed.id }, process.env.COST_LEARNING_ADMIN_TOKEN)).status, "approved");
    assert.equal((await call("resolve", { question: " ２０２６年８月两个工厂加起来制造费是多少？ ", scope })).correctedQuestion, correctedQuestion);
    assert.equal((await call("resolve", { question, scope: "combined:26:7:cumulative" })).correctedQuestion, null);
    assert.equal((await memory.get("approved-examples"))[0].correctedQuestion, correctedQuestion);
    const issue = await call("submit", { kind: "data", question, scope, note: "原表金额需要人工核查" });
    assert.equal((await call("approve", { id: issue.id }, process.env.COST_LEARNING_ADMIN_TOKEN)).httpStatus, 400);
    assert.equal((await call("reject", { id: issue.id }, process.env.COST_LEARNING_ADMIN_TOKEN)).status, "rejected");
    assert.equal((await call("resolve", { question, scope })).correctedQuestion, correctedQuestion);
    assert.equal((await call("submit", { kind: "intent", question, scope, correctedQuestion: question })).httpStatus, 400);
  } finally {
    if (previous === undefined) delete process.env.COST_LEARNING_ADMIN_TOKEN;
    else process.env.COST_LEARNING_ADMIN_TOKEN = previous;
  }
});
