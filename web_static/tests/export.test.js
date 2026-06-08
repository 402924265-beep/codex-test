import test from "node:test";
import assert from "node:assert/strict";

import { buildAnalysisWorkbookSheets } from "../src/export.js";

test("export workbook uses three-sheet style names and core Chinese columns", () => {
  const sheets = buildAnalysisWorkbookSheets({
    dashboardRows: [
      { group: "核心", label: "单台制造费", scenario: "同期", unit: "€/台", values: [35, 36] },
      { group: "核心", label: "单台制造费", scenario: "预算", unit: "€/台", values: [34, 35] },
      { group: "核心", label: "单台制造费", scenario: "26年", unit: "€/台", values: [33, 34] },
      { group: "差异", label: "制造费差额", scenario: "差额", unit: "K€", values: [-100, -200] }
    ],
    result: {
      month: 4,
      volume26: 40893,
      summary: {
        totalAmount25: 1592.67,
        totalAmountBudget: 1684.58,
        totalAmount26: 901.67,
        totalAmountDiff: -691,
        manufacturingDiff: -417.72,
        totalUnit25: 32.24,
        totalUnitBudget: 38.49,
        totalUnit26: 22.05,
        totalUnitDiff: -10.19
      },
      rows: [
        {
          code: "6666010188",
          descEn: "Salary - Blue collar direct employees",
          category: "直接人工",
          amount25: 342.66,
          amountBudget: 423.94,
          amount26: 277.01,
          amountDiff: -65.65,
          unit25: 6.94,
          unitBudget: 10.37,
          unit26: 6.77,
          unitDiff: -0.17,
          manufacturingDiff: -6.95
        }
      ],
      summaryCategories: [
        { label: "直接人工", amount25: 342.66, amount26: 277.01, amountBudget: 423.94, amountDiff: -65.65 }
      ]
    },
    analyses: { "4:6666010188": "工资释放预提" },
    factors: [{ type: "decrease", category: "人工", project: "释放预提", actualCumulative: 41.9, budgetMonths: [10], actualMonths: [8] }],
    factorSummary: { increaseCumulative: 0, decreaseCumulative: 41.9, netCumulative: -41.9 }
  });

  assert.deepEqual(
    sheets.map((sheet) => sheet.name),
    ["洗碗机成本数据", "费用指标到月测算汇总表", "月度差异明细", "26年降费项目-洗碗机", "口径说明"]
  );
  assert.equal(sheets[0].rows[0]["指标"], "单台制造费");
  assert.equal(sheets[0].rows[0]["口径"], "同期");
  assert.equal(sheets[0].rows[0]["1月"], 35);
  assert.equal(sheets[0].rows[2]["口径"], "26年");
  assert.equal(sheets[0].rows[2]["1月"], 33);
  assert.match(sheets[2].rows[0]["差异分析"], /6666010188.*工资释放预提/);
  assert.equal(sheets[2].rows.some((row) => row["差异分析"] === "工资释放预提"), true);
  assert.equal(sheets[3].rows[1]["1月预算K€"], 10);
  assert.equal(sheets[3].rows[1]["1月实际K€"], 8);
  assert.ok(sheets.every((sheet) => sheet.autofilter));
});

test("export cost sheet includes full-year columns and merge metadata", () => {
  const sheets = buildAnalysisWorkbookSheets({
    dashboardRows: [
      { group: "核心", label: "单台制造费", scenario: "同期", unit: "€/台", values: Array(12).fill(30) },
      { group: "核心", label: "单台制造费", scenario: "预算", unit: "€/台", values: Array(12).fill(28) },
      { group: "核心", label: "单台制造费", scenario: "26年", unit: "€/台", values: Array(12).fill(26) }
    ]
  });
  const costSheet = sheets.find((sheet) => sheet.name === "洗碗机成本数据");

  assert.ok(costSheet.rows[0].hasOwnProperty("年度"));
  assert.equal(costSheet.rows[0]["口径"], "同期");
  assert.equal(costSheet.rows[2]["口径"], "26年");
  assert.ok(Array.isArray(costSheet.merges));
  assert.ok(costSheet.freeze);
});
