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
      volume25: 49000,
      previousVolume26: 23002,
      volume26: 40893,
      summary: {
        totalAmount25: 1592.67,
        previousTotalAmount26: 1712.89,
        totalAmount26: 901.67,
        totalAmountDiff: -691,
        totalMomAmountDiff: -811.22,
        manufacturingDiff: -417.72,
        momManufacturingDiff: -213.5,
        totalUnit25: 32.24,
        previousTotalUnit26: 74.47,
        totalUnit26: 22.05,
        totalUnitDiff: -10.19,
        totalMomUnitDiff: -52.42
      },
      rows: [
        {
          code: "6666010188",
          descEn: "Salary - Blue collar direct employees",
          category: "直接人工",
          amount25: 342.66,
          previousAmount26: 350,
          amount26: 277.01,
          amountDiff: -65.65,
          momAmountDiff: -72.99,
          unit25: 6.94,
          previousUnit26: 15.22,
          unit26: 6.77,
          unitDiff: -0.17,
          momUnitDiff: -8.45,
          manufacturingDiff: -6.95
        }
      ],
      categories: [
        { category: "直接人工", amount25: 342.66, previousAmount26: 350, amount26: 277.01, amountDiff: -65.65, momAmountDiff: -72.99, unitDiff: -0.17, momUnitDiff: -8.45 }
      ]
    },
    analyses: { "4:6666010188": JSON.stringify({ description: "单价 * 数量", yoy: "工资释放预提", mom: "较上月产量变化" }) },
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
  assert.match(sheets[2].rows[0]["同比差异原因"], /6666010188.*工资释放预提/);
  assert.match(sheets[2].rows[0]["环比差异原因"], /6666010188.*较上月产量变化/);
  assert.equal(sheets[2].rows.some((row) => row["同比差异原因"] === "工资释放预提"), true);
  assert.equal(sheets[2].rows.some((row) => row["环比差异原因"] === "较上月产量变化"), true);
  assert.equal(sheets[2].rows.some((row) => row["科目描述"] === "单价 * 数量"), true);
  assert.equal(sheets[2].rows.some((row) => Object.hasOwn(row, "26预算K€")), false);
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

test("export annual unit cost, output value, rate and UPPH use weighted formulas", () => {
  const scenario = "26年";
  const dashboardRows = [
    { group: "单", label: "产量", scenario, unit: "台", values: [10000, 5000] },
    { group: "时", label: "工作日", scenario, unit: "天", values: [20, 18] },
    { group: "人", label: "直接员工", scenario, unit: "人", values: [10, 12] },
    { group: "人", label: "间接员工", scenario, unit: "人", values: [5, 6] },
    { group: "效", label: "UPPH", scenario, unit: "UPPH", values: [1, 2] },
    { group: "费", label: "产值", scenario, unit: "K€", values: [1000, 1500] },
    { group: "费", label: "制造费用金额", scenario, unit: "K€", values: [100, 200] },
    { group: "费", label: "单台制造费", scenario, unit: "€/台", values: [10, 40] },
    { group: "费", label: "单台制造费累计", scenario, unit: "€/台", values: [10, 20] },
    { group: "费", label: "制造费率", scenario, unit: "%", values: [0.1, 0.2] },
    { group: "费", label: "制造费率累计", scenario, unit: "%", values: [0.1, 0.12] }
  ];
  const costRows = buildAnalysisWorkbookSheets({ dashboardRows })[0].rows;
  const annual = (label) => costRows.find((row) => row["指标"] === label)["年度"];

  assert.equal(annual("产量"), 15000);
  assert.equal(annual("产值"), 2500);
  assert.equal(annual("单台制造费"), 20);
  assert.equal(annual("单台制造费累计"), 20);
  assert.equal(annual("制造费率"), 0.12);
  assert.equal(annual("制造费率累计"), 0.12);
  assert.equal(annual("UPPH"), 3.20513);
});
