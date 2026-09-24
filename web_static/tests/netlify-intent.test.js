import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

process.env.DEEPSEEK_API_KEY = "test-only";
const { handler } = createRequire(import.meta.url)("../../netlify/functions/deepseek.cjs");

test("semantic fallback returns only validated query intent", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    assert.match(request.messages[0].content, /不计算/);
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ metric: "制造费用", factory: "combined", separate: true, year: "26", month: 8, periods: ["monthly", "cumulative", "invalid"] }) } }] }) };
  };
  try {
    const response = await handler({ httpMethod: "POST", path: "/api/deepseek", body: JSON.stringify({ mode: "intent", question: "8月两个工厂分别单台制造费，当月和累计" }) });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(response.body).intent, { metric: "制造费用", factory: "combined", separate: true, year: "26", month: 8, periods: ["monthly", "cumulative"] });
    assert.equal("answer" in JSON.parse(response.body), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
