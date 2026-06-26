import test from "node:test";
import assert from "node:assert/strict";
import XLSX from "xlsx";

import { extractJiangYueWorkbook } from "../src/jiangyue-parser.js";

test("extracts the Jiang Yue monthly same, budget and 2026 metric series", () => {
  const wb = XLSX.utils.book_new();
  const rows = Array.from({ length: 125 }, () => []);
  rows[29] = ["", "", "平均单价（同期）", 200, 210];
  rows[30] = ["", "", "产量（同期）", 1000, 1100];
  rows[47] = ["", "", "制造费用合计（同期）", 30, 33];
  rows[48] = ["", "", "单台制造费（同期）", 30, 30];
  rows[77] = ["", "", "平均单价（26年）", 220, 225];
  rows[78] = ["", "", "产量（26年）", 900, 1000];
  rows[95] = ["", "", "制造费用合计（26年）", 27, 32];
  rows[96] = ["", "", "单台制造费（26年）", 30, 32];
  rows[102] = ["", "", "平均单价（预算）", 215, 215];
  rows[103] = ["", "", "产量（预算）", 950, 1050];
  rows[120] = ["", "", "制造费用合计（预算）", 28.5, 31.5];
  rows[121] = ["", "", "单台制造费（预算）", 30, 30];
  rows[122] = ["工作日", "", "同期", 22, 20];
  rows[123] = ["", "", "26年", 20, 20];
  rows[124] = ["用人", "", "26年", 322, 297];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "洗碗机");

  const parsed = extractJiangYueWorkbook(wb, XLSX);

  assert.deepEqual(parsed.price.same.slice(0, 2), [200, 210]);
  assert.deepEqual(parsed.price.actual.slice(0, 2), [220, 225]);
  assert.deepEqual(parsed.price.budget.slice(0, 2), [215, 215]);
  assert.deepEqual(parsed.volume.actual.slice(0, 2), [900, 1000]);
  assert.deepEqual(parsed.amount.budget.slice(0, 2), [28.5, 31.5]);
  assert.deepEqual(parsed.unit.actual.slice(0, 2), [30, 32]);
  assert.equal(parsed.rate.actual[0], 27 / (220 * 900 / 1000));
  assert.deepEqual(parsed.workdays.same.slice(0, 2), [22, 20]);
});

test("does not let the 2025 budget block overwrite the 2025 actual baseline", () => {
  const wb = XLSX.utils.book_new();
  const rows = [
    ["洗碗机25年实际"],
    ["", "平均单价", null, 238],
    ["", null, "产量", 1000],
    ["", "合计", null, 35],
    ["", "单台", null, 35],
    ["洗碗机25年预算"],
    ["", "平均单价", null, 220],
    ["", null, "产量", 1200],
    ["", "合计", null, 29],
    ["", "单台", null, 24],
    ["洗碗机26年实际"],
    ["", "平均单价", null, 230],
    ["", null, "产量", 900],
    ["", "合计", null, 27],
    ["", "单台", null, 30],
    ["洗碗机26年预算"],
    ["", "平均单价", null, 222],
    ["", null, "产量", 950],
    ["", "合计", null, 28.5],
    ["", "单台", null, 30]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "洗碗机");

  const parsed = extractJiangYueWorkbook(wb, XLSX);

  assert.equal(parsed.unit.same[0], 35);
  assert.equal(parsed.unit.budget[0], 30);
});
