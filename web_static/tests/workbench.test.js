import test from "node:test";
import assert from "node:assert/strict";

import {
  analysisKey,
  analysisReason,
  analysisReasons,
  buildAutoSummary,
  buildFactorSummary,
  serializeAnalysisReasons
} from "../src/workbench.js";
import { createStore, supabaseSchemaSql } from "../src/store.js";
import { PROJECT_SEEDS, localizeProjectField, localizeProjectText, projectImpactSummary } from "../src/project-data.js";

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
    summary: { totalUnitDiff: -10.19, totalMomUnitDiff: 2.5, manufacturingDiff: -416.6 },
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
  assert.match(text, /环比上升2.50欧/);
});

test("analysis reasons preserve legacy YoY text and serialize YoY plus MoM", () => {
  assert.deepEqual(analysisReasons("旧同比原因"), { description: "", yoy: "旧同比原因", mom: "" });
  const serialized = serializeAnalysisReasons({ description: "单价上涨 * 数量", yoy: "同比原因", mom: "环比原因" });
  assert.equal(analysisReason({ "5:1": serialized }, 5, "1", "description"), "单价上涨 * 数量");
  assert.equal(analysisReason({ "5:1": serialized }, 5, "1", "yoy"), "同比原因");
  assert.equal(analysisReason({ "5:1": serialized }, 5, "1", "mom"), "环比原因");
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

test("project library text follows selected language", () => {
  assert.equal(localizeProjectField(PROJECT_SEEDS[0], "category", "en"), "Cost increase factor");
  assert.match(localizeProjectField(PROJECT_SEEDS[8], "project", "en"), /Increase UPH/);
  assert.match(localizeProjectText("新增降费项目：备件费用", "en"), /Spare parts cost/);
  assert.match(localizeProjectText("新增降费项目：备件费用", "tr"), /Yedek parça maliyeti/);
});
