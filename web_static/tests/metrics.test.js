import test from "node:test";
import assert from "node:assert/strict";

import {
  annualManufacturingRate,
  annualUnitCost,
  annualUpph,
  combineHeadcount,
  manufacturingRate,
  monthlyUpph,
  targetCompletionRate
} from "../src/metrics.js";

test("monthly UPPH uses volume, direct plus indirect headcount, workdays and 7.5 hours", () => {
  assert.equal(monthlyUpph(44096, 222, 79, 21), 44096 / 301 / 21 / 7.5);
});

test("annual UPPH uses total volume divided by monthly labor-hour capacity", () => {
  const result = annualUpph([1000, 1200], [10, 12], [5, 6], [20, 18]);
  assert.equal(result, 2200 / ((15 * 20 * 7.5) + (18 * 18 * 7.5)));
});

test("headcount includes direct and indirect only", () => {
  assert.deepEqual(combineHeadcount([237, 215], [85, 82]), [322, 297]);
});

test("manufacturing rate is manufacturing cost divided by output value", () => {
  assert.equal(manufacturingRate(901.67, 216.654673560447, 40890), 901.67 / (216.654673560447 * 40890 / 1000));
  assert.equal(annualManufacturingRate([100, 200], [1000, 1500]), 300 / 2500);
});

test("annual unit cost uses total cost divided by total volume instead of December value", () => {
  assert.equal(annualUnitCost([100, 200], [10000, 5000]), 300 * 1000 / 15000);
});

test("target completion follows the three-sheet formula 2 minus actual over budget", () => {
  assert.equal(targetCompletionRate(22.05, 30.27), 2 - 22.05 / 30.27);
});
