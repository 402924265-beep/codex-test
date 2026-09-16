import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { handler } = require("../../netlify/functions/deepseek.cjs");

test("Netlify DeepSeek status never exposes the API key", async () => {
  const response = await handler({ httpMethod: "GET", path: "/api/deepseek/status", queryStringParameters: { status: "1" } });
  const body = JSON.parse(response.body);
  assert.equal(response.statusCode, 200);
  assert.equal(typeof body.configured, "boolean");
  assert.equal("apiKey" in body, false);
});

test("Netlify DeepSeek proxy refuses calls without a configured key", async () => {
  const previous = process.env.DEEPSEEK_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;
  const response = await handler({ httpMethod: "POST", path: "/api/deepseek", body: JSON.stringify({ question: "折旧费用是多少", evidence: {} }) });
  if (previous) process.env.DEEPSEEK_API_KEY = previous;
  assert.equal(response.statusCode, 503);
  assert.match(JSON.parse(response.body).error, /API Key/);
});
