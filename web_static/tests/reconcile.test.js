import test from "node:test";
import assert from "node:assert/strict";

import {
  accountCode,
  detectSapMonthColumn,
  detectRentaMonthColumns,
  extractActualFromWorkbook,
  extractRentaActualFromRows,
  extractSapActualFromRows,
  inferActualMonthCountFromFileName,
  normalizeNumber
} from "../src/parser.js";
import {
  buildReconciliation,
  categoryForAccount,
  detectUnsplitAccountCategories,
  summarizeForHiddenReference
} from "../src/reconcile.js";

test("extracts and sums SAP rows for a selected month", () => {
  const rows = [
    ["Account", "Description", "Jan", "Feb"],
    ["* CS_DIRECT LABOUR", "", 2000, 3000],
    [6666010188, "Salary - Blue collar direct employees", 1000, 2500],
    ["6666010188", "Salary - Blue collar direct employees", 500, 500],
    ["Over/Under", "", 1500, 3000]
  ];

  assert.equal(accountCode("cost 6666021500 Repairs cost"), "6666021500");
  assert.equal(normalizeNumber("1,234.50"), 1234.5);
  assert.equal(detectSapMonthColumn(rows, 1), 2);

  const result = extractSapActualFromRows(rows, { month: 1, volume: 47357 });
  assert.equal(result.accounts.length, 1);
  assert.equal(result.accounts[0].code, "6666010188");
  assert.equal(result.accounts[0].amount, 1.5);
  assert.equal(result.accounts[0].duplicateCount, 2);
});

test("extracts Renta DW rows where amounts are already K EUR", () => {
  const rows = [
    [null, "Renta DW Cost Evolution", null, "Volume", 47357, null, null, 42593, null, null, 23002, null, null, 40893, null],
    [],
    [],
    [],
    ["HQD PERIMETER", null, null, null, "Jan K€ ", "Jan CPU € / pcs", null, "Feb K€ ", "Feb CPU € / pcs", null, "Mar K€ ", "Mar CPU € / pcs", null, "Apr K€ ", "Apr CPU € / pcs"],
    ["YES", 6666010188, "6666010188  Salary - Blue collar direct employees", "*   CS_DIRECT LABOUR", 357.71936, 7.55367, null, 1, 0.02, null, 2, 0.09, null, 363.73443, 8.895],
    ["YES", 6666021500, "6666021500  Repairs cost", "*   CS_FIX COST", null, "#DIV/0!", null, null, "#DIV/0!", null, null, "#DIV/0!", null, 5.5, 0.1345]
  ];

  assert.deepEqual(detectRentaMonthColumns(rows, 4), { headerRow: 4, valueCol: 13, cpuCol: 14 });

  const result = extractRentaActualFromRows(rows, { month: 4 });
  const salary = result.accounts.find((row) => row.code === "6666010188");
  const repairs = result.accounts.find((row) => row.code === "6666021500");

  assert.equal(result.volume, 40893);
  assert.equal(salary.amount, 363.73443);
  assert.equal(salary.unit.toFixed(5), "8.89478");
  assert.equal(repairs.amount, 5.5);
  assert.equal(result.summaryCategories.find((item) => item.label === "直接人工").amount26, 363.73443);
});

test("Renta volume follows the selected month column when months are adjacent", () => {
  const rows = [
    [null, "Renta DW Cost Evolution", null, "Volume", 47357, 42000, 23500, 38000, 33000],
    [],
    [],
    [],
    ["HQD PERIMETER", null, null, null, "Jan K€ ", "Feb K€ ", "Mar K€ ", "Apr K€ ", "May K€ ", "May CPU"],
    ["YES", 6666010188, "Salary", "* CS_DIRECT LABOUR", 100, 110, 120, 130, 140, 4.24]
  ];

  const result = extractRentaActualFromRows(rows, { month: 5 });
  assert.equal(result.volume, 33000);
  assert.equal(result.accounts[0].amount, 140);
  assert.equal(result.accounts[0].unit, 140 / 33000 * 1000);
});

test("Renta account detail reconciles exactly to the reported TOTAL row", () => {
  const rows = [
    [null, "Renta DW Cost Evolution", null, "Volume", 33000],
    [],
    [],
    [],
    ["HQD PERIMETER", null, null, null, "May K€", "May CPU"],
    ["YES", 6666010188, "Salary", "* CS_DIRECT LABOUR", 140, 4.24],
    [null, null, null, "TOTAL", 150]
  ];

  const result = extractRentaActualFromRows(rows, { month: 5 });
  const total = result.accounts.reduce((sum, row) => sum + (row.amount || 0), 0);
  const adjustment = result.accounts.find((row) => row.code === "REPORT_TOTAL_ADJUSTMENT");

  assert.equal(result.reportedTotal, 150);
  assert.equal(result.detailTotal, 140);
  assert.equal(result.totalAdjustment, 10);
  assert.equal(adjustment.amount, 10);
  assert.equal(total, 150);
});

test("actual workbook prefers the current 4+8 sheet over the stale 1+11 sheet", () => {
  const makeRows = (volume, amount) => [
    [null, "Renta DW Cost Evolution", null, "Volume", volume],
    [],
    [],
    [],
    ["HQD PERIMETER", null, null, null, "May K€", "May CPU"],
    ["YES", 6666010188, "Salary", "* CS_DIRECT LABOUR", amount, amount * 1000 / volume],
    [null, null, null, "TOTAL", amount]
  ];
  const workbook = {
    SheetNames: ["1+11 Renta DW _2026", "4+8 DW 2026"],
    Sheets: {
      "1+11 Renta DW _2026": { rows: makeRows(33000, 1892.85) },
      "4+8 DW 2026": { rows: makeRows(33043, 1826.69) }
    }
  };
  const xlsx = {
    utils: {
      sheet_to_json(sheet) {
        return sheet.rows;
      }
    }
  };

  const result = extractActualFromWorkbook(workbook, 5, xlsx);
  assert.equal(result.sheetName, "4+8 DW 2026");
  assert.equal(result.volume, 33043);
  assert.equal(result.reportedTotal, 1826.69);
});

test("reconciles account-level 26 actual minus 25 same period and preserves missing accounts", () => {
  const baseline25 = [
    {
      code: "6666010188",
      descEn: "Salary - Blue collar direct employees",
      category: "直接人工",
      amount25: 362.36537,
      unit25: 7.4605056482
    },
    {
      code: "6666021500",
      descEn: "Repairs cost",
      category: "其他制造费",
      amount25: 0.34316,
      unit25: 0.0070649143
    }
  ];
  const actual26 = {
    accounts: [
      {
        code: "6666010188",
        descEn: "Salary - Blue collar direct employees",
        amount: 357.71936,
        unit: 7.5536506899
      }
    ],
    volume: 47357,
    summaryCategories: []
  };

  const result = buildReconciliation({ baseline25, actual26, month: 1 });
  const salary = result.rows.find((row) => row.code === "6666010188");
  const repairs = result.rows.find((row) => row.code === "6666021500");

  assert.equal(salary.amountDiff.toFixed(5), "-4.64601");
  assert.equal(salary.unitDiff.toFixed(5), "0.09317");
  assert.equal(repairs.status, "only_25");
  assert.equal(repairs.amountDiff.toFixed(5), "-0.34316");
  assert.equal(salary.momUnitDiff, null);
});

test("reconciliation calculates month-over-month account, category, and total differences", () => {
  const result = buildReconciliation({
    baseline25: {
      volume: 100,
      accounts: [
        { code: "1", descEn: "Salary", category: "直接人工", amount25: 12, unit25: 120 }
      ]
    },
    actual26: {
      volume: 200,
      accounts: [
        { code: "1", descEn: "Salary", category: "直接人工", amount: 30 },
        { code: "3", descEn: "New cost", category: "其他制造费", amount: 5 }
      ]
    },
    previousActual26: {
      volume: 100,
      accounts: [
        { code: "1", descEn: "Salary", category: "直接人工", amount: 10 },
        { code: "2", descEn: "Stopped cost", category: "折旧（含FC）", amount: 4 }
      ]
    },
    month: 2
  });

  const salary = result.rows.find((row) => row.code === "1");
  const stopped = result.rows.find((row) => row.code === "2");
  const labour = result.categories.find((row) => row.category === "直接人工");

  assert.equal(salary.previousAmount26, 10);
  assert.equal(salary.previousUnit26, 100);
  assert.equal(salary.momAmountDiff, 20);
  assert.equal(salary.momUnitDiff, 50);
  assert.equal(stopped.momAmountDiff, -4);
  assert.equal(stopped.momUnitDiff, -40);
  assert.equal(labour.momUnitDiff, 50);
  assert.equal(result.summary.previousTotalAmount26, 14);
  assert.equal(result.summary.totalMomAmountDiff, 21);
  assert.equal(result.summary.previousTotalUnit26, 140);
  assert.equal(result.summary.totalMomUnitDiff, 35);
});

test("forecast categories with one populated account collapse to category comparison", () => {
  const forecastAccounts = [
    { code: "1", descEn: "Salary", category: "直接人工", amount: 100 },
    { code: "2", descEn: "Payroll tax", category: "直接人工", amount: 0 },
    { code: "3", descEn: "Overtime", category: "直接人工", amount: 0 },
    { code: "4", descEn: "Travel", category: "运营费", amount: 10 },
    { code: "5", descEn: "Entertainment", category: "运营费", amount: 5 }
  ];
  assert.deepEqual(detectUnsplitAccountCategories(forecastAccounts), ["直接人工"]);

  const result = buildReconciliation({
    baseline25: {
      volume: 100,
      accounts: [
        { code: "1", category: "直接人工", amount25: 30, unit25: 300 },
        { code: "2", category: "直接人工", amount25: 20, unit25: 200 },
        { code: "3", category: "直接人工", amount25: 10, unit25: 100 },
        { code: "4", category: "运营费", amount25: 8, unit25: 80 },
        { code: "5", category: "运营费", amount25: 4, unit25: 40 }
      ]
    },
    actual26: {
      isForecast: true,
      volume: 100,
      accounts: forecastAccounts
    },
    previousActual26: {
      volume: 100,
      accounts: [
        { code: "1", category: "直接人工", amount: 40 },
        { code: "2", category: "直接人工", amount: 20 },
        { code: "3", category: "直接人工", amount: 10 },
        { code: "4", category: "运营费", amount: 9 },
        { code: "5", category: "运营费", amount: 4 }
      ]
    },
    month: 6
  });

  assert.deepEqual(result.unsplitCategories, ["直接人工"]);
  assert.equal(result.rows.some((row) => row.code === "1"), false);
  const categoryRow = result.rows.find((row) => row.code === "CATEGORY::直接人工");
  assert.ok(categoryRow);
  assert.equal(categoryRow.amount25, 60);
  assert.equal(categoryRow.previousAmount26, 70);
  assert.equal(categoryRow.amount26, 100);
  assert.equal(result.rows.filter((row) => row.category === "运营费").length, 2);
});

test("keeps FC inside depreciation and does not add a separate FC row", () => {
  assert.equal(
    categoryForAccount({
      code: "6666030000",
      descEn: "Functional Currency Impact",
      summaryKey: "CS_DEPRECIATION"
    }),
    "折旧（含FC）"
  );

  const checks = summarizeForHiddenReference(
    [
      { label: "折旧（含FC）", amount26: 564.25121 },
      { label: "直接人工", amount26: 451.11424 }
    ],
    {
      1: {
        total: 1778.33998,
        categories: [
          { label: "折旧（含FC）", amount26: 564.25121 },
          { label: "直接人工", amount26: 451.11424 }
        ]
      }
    },
    1,
    1778.33998
  );

  assert.equal(checks.totalStatus, "ok");
  assert.equal(checks.items.find((item) => item.label === "折旧（含FC）").status, "ok");
});

test("reconciliation sums duplicate 2026 account rows instead of overwriting them", () => {
  const result = buildReconciliation({
    baseline25: { volume: 100, accounts: [] },
    budget26: { volume: 100, accounts: [] },
    actual26: {
      volume: 100,
      accounts: [
        { code: "6666010188", descEn: "Salary", amount: 10, unit: 100, sourceRows: [5] },
        { code: "6666010188", descEn: "Salary", amount: 20, unit: 200, sourceRows: [6] }
      ],
      summaryCategories: []
    },
    month: 5
  });

  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].amount26, 30);
  assert.equal(result.rows[0].unit26, 300);
  assert.deepEqual(result.rows[0].sourceRows26, [5, 6]);
  assert.equal(result.summary.totalAmount26, 30);
});

test("actual report filename determines the realized month cutoff", () => {
  assert.equal(inferActualMonthCountFromFileName("洗碗机5月实际制造费报表.xlsx"), 5);
  assert.equal(inferActualMonthCountFromFileName("2026 monthly Renta DW _APRIL ACT.xlsx"), 4);
  assert.equal(inferActualMonthCountFromFileName("2026 MFG Actual_05.2026.xlsx"), 5);
  assert.equal(inferActualMonthCountFromFileName("actual.xlsx", 4), 4);
});
