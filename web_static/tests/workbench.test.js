import test from "node:test";
import assert from "node:assert/strict";

import { buildFactorSummary, buildAutoSummary, analysisKey } from "../src/workbench.js";
import { createStore, supabaseSchemaSql } from "../src/store.js";
import { PROJECT_SEEDS, projectImpactSummary } from "../src/project-data.js";

test("summarizes increase and decrease factors as positive impacts", () => {
  const summary = buildFactorSummary(
    [
      { id: "1", type: "increase", actualCumulative: 25 },
      { id: "2", type: "decrease", actualCumulative: 59 }
    ],
    4
  );

  assert.equal(summary.increaseCumulative, 25);
  assert.equal(summary.decreaseCumulative, 59);
  assert.equal(summary.netCumulative, -34);
});

test("auto summary uses saved account reasons and excludes project factors", () => {
  const result = {
    month: 4,
    summary: { totalUnitDiff: -10.19, manufacturingDiff: -416.6 },
    rows: [
      { code: "6666010188", descEn: "Salary", unitDiff: -1, isHighImpact: true }
    ]
  };
  const text = buildAutoSummary(
    result,
    { [analysisKey(4, "6666010188")]: "工资释放预提" },
    { increaseCumulative: 25, decreaseCumulative: 59, netCumulative: -34 },
    { unitCost: 22.05, amount: 901.67 }
  );
  assert.match(text, /工资释放预提/);
  assert.match(text, /4月洗碗机/);
  assert.match(text, /4\+8预测口径/);
  assert.doesNotMatch(text, /上涨因素累计/);
});

test("local store saves analyses and exposes Supabase schema", async () => {
  const memory = new Map();
  globalThis.localStorage = {
    getItem: (key) => memory.get(key) || null,
    setItem: (key, value) => memory.set(key, value)
  };
  const store = createStore(null);
  assert.equal(store.mode, "local");
  await store.saveAnalysis({ key: "4:6666010188", month: 4, code: "6666010188", text: "原因" });
  assert.deepEqual(await store.loadAnalyses(), { "4:6666010188": "原因" });
  assert.match(supabaseSchemaSql(), /dw_account_analyses/);
  assert.match(supabaseSchemaSql(), /dw_factor_projects/);
});

test("seed project library carries all three-sheet projects and key impact buckets", () => {
  const summary = projectImpactSummary(PROJECT_SEEDS);

  assert.equal(PROJECT_SEEDS.length, 23);
  assert.ok(summary.inflation.actual < 0);
  assert.ok(summary.wage.actual < 0);
  assert.ok(summary.scale.actual < 0);
});
