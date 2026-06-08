import test from "node:test";
import assert from "node:assert/strict";
import XLSX from "xlsx";

import { BASELINE_25_BY_MONTH } from "../src/baseline-data.js";
import { extractForecastWorkbook, buildAnnualDashboardRows, monthSnapshot, localizeDashboardRow } from "../src/forecast-parser.js";

test("extracts 4+8 forecast volume, amount, unit, and budget variance", () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Total"],
    ["Budget Volume", 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 780],
    [],
    ["STD Volume", 11, 21, 31, 41, 51, 61, 71, 81, 91, 101, 111, 121, 792],
    [],
    ["Actual Volume", 12, 22, 32, 42, 52, 62, 72, 82, 92, 102, 112, 122, 804]
  ]), "VOLUME");
  const cpuRows = Array.from({ length: 36 }, () => []);
  cpuRows[34] = ["TOTAL ALL", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 78, "", 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2];
  cpuRows[6] = ["Direct Labor", 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 12, "", 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cpuRows), "FCST CPU");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    [],
    [],
    ["K€", "Jan", "Feb", "Mar", "Apr"],
    ["TOTAL ALL", -1, -2, -3, -4]
  ]), "FCST 26");

  const forecast = extractForecastWorkbook(wb, XLSX);
  const snapshot = monthSnapshot(forecast, 4);
  const rows = buildAnnualDashboardRows(forecast);

  assert.equal(forecast.volume.actual[3], 42);
  assert.equal(snapshot.amount, 4);
  assert.equal(snapshot.unitCost, 0.4);
  assert.equal(snapshot.budgetDelta, -4);
  assert.ok(rows.some((row) => row.label === "单台制造费"));
  assert.deepEqual(rows.find((row) => row.label === "产量" && row.scenario === "预算").values.slice(0, 4), [10, 20, 30, 40]);
  assert.deepEqual(rows.find((row) => row.label === "制造费用金额" && row.scenario === "预算").values.slice(0, 4), [2, 4, 6, 8]);
  assert.ok(rows.some((row) => row.label === "工作日"));
});

test("annual dashboard puts unit manufacturing cost before aggregate cards", () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["Budget Volume", 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
    [],
    ["STD Volume", 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
    [],
    ["Actual Volume", 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
  ]), "VOLUME");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["TOTAL ALL", 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 240, "", 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2]
  ]), "FCST CPU");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["TOTAL ALL", 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20]
  ]), "FCST 26");

  const rows = buildAnnualDashboardRows(extractForecastWorkbook(wb, XLSX));
  assert.equal(localizeDashboardRow(rows[0], "en").label, "Unit manufacturing cost");
});

test("annual indicator detail excludes category costs and keeps business KPI groups", () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["Budget Volume", 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
    [],
    ["STD Volume", 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
    [],
    ["Actual Volume", 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]
  ]), "VOLUME");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["Direct Labor", 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    ["TOTAL ALL", 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
  ]), "FCST CPU");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["Direct Labor", 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ["TOTAL ALL", 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ]), "FCST 26");
  const forecast = extractForecastWorkbook(wb, XLSX);
  const rows = buildAnnualDashboardRows(forecast);
  assert.equal(rows.some((row) => row.group === "大科目"), false);
  assert.equal(rows.some((row) => row.label === "直接人工"), false);
  assert.ok(rows.some((row) => row.label === "单台制造费"));
});

test("public 2025 baseline covers all 12 same-period months", () => {
  assert.deepEqual(Object.keys(BASELINE_25_BY_MONTH).map(Number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.ok(BASELINE_25_BY_MONTH[12].volume > 0);
  assert.ok(BASELINE_25_BY_MONTH[12].accounts.length > 50);
});

test("dashboard rows expose complete English labels", () => {
  const row = {
    group: "核心",
    label: "单台制造费",
    scenario: "同期",
    unit: "€/台"
  };
  assert.deepEqual(localizeDashboardRow(row, "en"), {
    group: "Core",
    label: "Unit manufacturing cost",
    scenario: "Same period",
    unit: "€/pc"
  });
});

test("zero SAP future months do not overwrite forecast actuals", () => {
  const forecast = {
    volume: {
      actual: [10, 20, 30, 40, null, null, null, null, null, null, null, null],
      budget: Array(12).fill(100),
      std: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]
    },
    hc: { actualTotal: Array(12).fill(10), budgetTotal: Array(12).fill(10) },
    totalAll: {
      amountMonths: [1, 2, 3, 4, null, null, null, null, null, null, null, null],
      budgetMonths: [20, 20, 20, 20, 5, 6, 7, 8, 9, 10, 11, 12],
      unitMonths: Array(12).fill(100)
    }
  };
  const resultByMonth = new Map([
    [4, { volume26: 40, summary: { totalAmount26: 400 } }],
    [5, { volume26: null, summary: { totalAmount26: 0 } }]
  ]);
  const jiangyue = {
    amount: { actual: [null, null, null, null, 15, 16] },
    volume: { actual: [null, null, null, null, 150, 160] },
    unit: { actual: [null, null, null, null, 100, 100] }
  };

  const rows = buildAnnualDashboardRows(forecast, { resultByMonth, jiangyue });
  const amount = rows.find((row) => row.label === "制造费用金额" && row.scenario === "26年");
  const volume = rows.find((row) => row.label === "产量" && row.scenario === "26年");

  assert.equal(amount.values[3], 400);
  assert.equal(amount.values[4], 15);
  assert.equal(volume.values[4], 150);
});

test("UPPH uses realized direct plus indirect headcount for actual months", () => {
  const months = Array(12).fill(1000);
  const forecast = {
    volume: {
      actual: [...months],
      budget: [...months],
      std: [...months]
    },
    hc: {
      actualTotal: Array(12).fill(330),
      budgetTotal: Array(12).fill(330)
    },
    categories: [],
    totalAll: {
      amountMonths: Array(12).fill(100),
      budgetMonths: Array(12).fill(100),
      unitMonths: Array(12).fill(100)
    }
  };
  const resultByMonth = new Map([
    [1, { volume26: 47357, summary: { totalAmount26: 100 } }],
    [2, { volume26: 42593, summary: { totalAmount26: 100 } }],
    [3, { volume26: 23002, summary: { totalAmount26: 100 } }],
    [4, { volume26: 40893, summary: { totalAmount26: 100 } }]
  ]);

  const rows = buildAnnualDashboardRows(forecast, { resultByMonth });
  const actualUpph = rows.find((row) => row.label === "UPPH" && row.scenario === "26年");

  assert.ok(actualUpph);
  assert.equal(actualUpph.values[3], 40893 / 301 / 21 / 7.5);
  assert.ok(actualUpph.values[3] < 2);
});
