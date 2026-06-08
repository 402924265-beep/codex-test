import assert from "node:assert/strict";
import XLSX from "xlsx";

import {
  BASELINE_25_BY_MONTH,
  BUDGET_26_BY_MONTH,
  CATEGORY_ORDER
} from "../src/baseline-data.js";
import { MONTHS, extractActualFromWorkbook } from "../src/parser.js";
import { buildReconciliation } from "../src/reconcile.js";

const sapPath = "E:\\桌面\\李想\\财务报表\\2026 MFG Variance Reporting_ DW_04.2026 v1.xlsx";
const workbook = XLSX.readFile(sapPath, { cellDates: false });

const results = new Map();
for (const item of MONTHS) {
  const actual26 = extractActualFromWorkbook(workbook, item.month, XLSX);
  const result = buildReconciliation({
    baseline25: BASELINE_25_BY_MONTH[item.month],
    budget26: BUDGET_26_BY_MONTH[item.month],
    actual26,
    month: item.month,
    categoryOrder: CATEGORY_ORDER
  });
  results.set(item.month, result);
}

const january = results.get(1);
const salary = january.rows.find((row) => row.code === "6666010188");
const repairs = january.rows.find((row) => row.code === "6666021500");

assert.equal(january.summary.totalAmount26.toFixed(5), "1779.70594");
assert.equal(salary.amountDiff.toFixed(5), "-4.64601");
assert.equal(salary.unitDiff.toFixed(5), "0.09315");
assert.equal(repairs.status, "only_25");
assert.equal(january.rows.some((row) => row.code === "__FC__"), false);

const actualMonthsInAprilFile = new Set([1, 2, 3, 4]);
const budgetMonthsInPublicBaseline = new Set([1, 2, 3, 4]);
for (const [month, result] of results) {
  if (actualMonthsInAprilFile.has(month)) {
    assert.ok(result.summary.totalAmount26 !== 0, `${month}月26实际不应为0`);
  } else {
    assert.equal(result.summary.totalAmount26, 0, `${month}月在4月实际文件中应为空`);
  }
  if (budgetMonthsInPublicBaseline.has(month)) {
    assert.ok(result.summary.totalAmountBudget > 0, `${month}月应有预算`);
  } else {
    assert.equal(result.summary.totalAmountBudget, 0, `${month}月公开预算基线尚未覆盖`);
  }
}

console.log({
  januaryTotal26: january.summary.totalAmount26,
  januaryBudget: january.summary.totalAmountBudget,
  salaryAmountDiff: salary.amountDiff,
  salaryUnitDiff: salary.unitDiff,
  repairsStatus: repairs.status,
  parsedMonths: [...results.keys()]
});
