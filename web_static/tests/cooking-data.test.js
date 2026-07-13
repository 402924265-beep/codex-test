import test from "node:test";
import assert from "node:assert/strict";

import { COOKING_UNIT } from "../src/cooking-data.js";

test("CK built-in headcount rows carry full same, budget and actual months", () => {
  const humanUnit = "\u4eba";
  const rows = COOKING_UNIT.dashboardRows.filter((row) => row.unit === humanUnit);

  assert.equal(rows.length, 9);
  assert.deepEqual(rows.map((row) => row.values), [
    [279, 296, 293, 296, 293, 260, 247, 239, 248, 310, 310, 280],
    [286, 317, 317, 258, 258, 258, 258, 258, 295, 295, 343, 343],
    [294, 300, 325, 265, 258, 258, 258, 258, 295, 295, 343, 343],
    [170, 181, 180, 182, 178, 148, 126, 127, 120, 132, 134, 133],
    [133, 136, 136, 127, 127, 127, 127, 127, 133, 133, 142, 142],
    [127, 126, 125, 113, 127, 127, 127, 127, 133, 133, 142, 142],
    [58, 58, 56, 55, 53, 38, 35, 38, 33, 31, 31, 31],
    [34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34],
    [30, 31, 30, 28, 34, 34, 34, 34, 34, 34, 34, 34]
  ]);
});

test("CK built-in derived operating metrics cover forecast months", () => {
  const outputLabel = "\u4ea7\u503c";
  const rateLabel = "\u5236\u9020\u8d39\u7387";
  const workdayLabel = "\u5de5\u4f5c\u65e5";
  const actualScenario = "26\u5e74";
  const output = COOKING_UNIT.dashboardRows.find((row) => row.label === outputLabel && row.scenario === actualScenario);
  const rate = COOKING_UNIT.dashboardRows.find((row) => row.label === rateLabel && row.scenario === actualScenario);
  const workday = COOKING_UNIT.dashboardRows.find((row) => row.label === workdayLabel && row.scenario === actualScenario);

  assert.ok(output);
  assert.ok(rate);
  assert.ok(workday);
  assert.equal(output.values.length, 12);
  assert.equal(rate.values.length, 12);
  assert.equal(workday.values.length, 12);
  assert.equal(output.values.slice(4).every(Number.isFinite), true);
  assert.equal(rate.values.slice(4).every(Number.isFinite), true);
  assert.deepEqual(workday.values, [20, 20, 23, 21, 14, 22, 17, 16, 22, 20, 21, 14]);
  assert.deepEqual(rate.values.slice(4, 8).map((value) => Number(value.toFixed(4))), [0.2536, 0.2004, 0.2447, 0.2634]);
});
