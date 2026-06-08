import assert from "node:assert/strict";
import XLSX from "xlsx";

import {
  BASELINE_25_BY_MONTH,
  BUDGET_26_BY_MONTH,
  CATEGORY_ORDER
} from "../src/baseline-data.js";
import { extractActualFromWorkbook } from "../src/parser.js";
import { buildReconciliation } from "../src/reconcile.js";

const rentaPath = "E:\\桌面\\李想\\财务报表\\副本2026 monthly Renta DW _APRIL ACT.xlsx";
const workbook = XLSX.readFile(rentaPath, { cellDates: false });
const actual26 = extractActualFromWorkbook(workbook, 4, XLSX);
const result = buildReconciliation({
  baseline25: BASELINE_25_BY_MONTH[4],
  budget26: BUDGET_26_BY_MONTH[4],
  actual26,
  month: 4,
  categoryOrder: CATEGORY_ORDER
});

const salary = result.rows.find((row) => row.code === "6666010188");
const depreciation = result.categories.find((row) => row.category.includes("FC"));

assert.equal(actual26.sheetName, "Renta DW _2026");
assert.equal(actual26.volume, 40893);
assert.ok(actual26.accounts.length > 80);
assert.ok(salary.amount26 !== null);
assert.ok(salary.amount25 !== null);
assert.ok(salary.amountBudget !== null);
assert.ok(depreciation.amount26 !== 0);
assert.ok(result.summary.totalAmountBudget > 0);

console.log({
  sheetName: actual26.sheetName,
  volume: actual26.volume,
  accountCount: actual26.accounts.length,
  salaryAmount26: salary.amount26,
  salaryAmount25: salary.amount25,
  salaryBudget: salary.amountBudget,
  totalAmount26: result.summary.totalAmount26,
  totalBudget: result.summary.totalAmountBudget,
  manufacturingDiff: result.summary.manufacturingDiff
});
