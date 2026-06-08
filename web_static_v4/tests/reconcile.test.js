import test from "node:test";
import assert from "node:assert/strict";

import {
  accountCode,
  detectSapMonthColumn,
  detectRentaMonthColumns,
  extractActualFromWorkbook,
  extractRentaActualFromRows,
  extractSapActualFromRows,
  normalizeNumber
} from "../src/parser.js";
import {
  buildReconciliation,
  categoryForAccount,
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
  assert.equal(salary.unitDiff.toFixed(5), "0.09315");
  assert.equal(repairs.status, "only_25");
  assert.equal(repairs.amountDiff.toFixed(5), "-0.34316");
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
