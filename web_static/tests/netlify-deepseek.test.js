import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

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

test("comparison questions use verified YoY and MoM business rules", () => {
  const functionSource = readFileSync(new URL("../../netlify/functions/deepseek.cjs", import.meta.url), "utf8");
  const knowledge = readFileSync(new URL("../../netlify/functions/deepseek-cost-knowledge.md", import.meta.url), "utf8");
  assert.match(functionSource, /为什么高\/低、怎么这么高\/低/);
  assert.match(functionSource, /single-month-no-sum-required/);
  assert.match(knowledge, /单月问题没有指定基准时，必须同时回答同比和环比/);
  assert.match(knowledge, /主要观察因素/);
});
