import test from "node:test";
import assert from "node:assert/strict";
import { buildHrBudgetAccountSync, hrBudgetSyncTotal } from "../src/hr-budget-sync.js";

const sample = {
  accounts: [
    {
      key: "wages",
      sourceLabel: "Wages",
      monthly: Array(12).fill(3000),
      breakdown: [
        { type: "BC", position: "Direct", monthly: Array(12).fill(1000) },
        { type: "BC", position: "Indirect", monthly: Array(12).fill(800) },
        { type: "WC", position: "Indirect", monthly: Array(12).fill(1200) }
      ]
    },
    {
      key: "cashAid",
      sourceLabel: "Aid In Cash",
      monthly: Array(12).fill(500),
      breakdown: []
    },
    {
      key: "bonus",
      sourceLabel: "Bonus",
      monthly: Array(12).fill(300),
      breakdown: [
        { type: "BC", position: "Direct", monthly: Array(12).fill(100) },
        { type: "BC", position: "Indirect", monthly: Array(12).fill(80) },
        { type: "WC", position: "Indirect", monthly: Array(12).fill(120) }
      ]
    }
  ]
};

test("maps HR budget output to the matching DW account codes in K EUR", () => {
  const output = buildHrBudgetAccountSync(sample, [6]);
  assert.equal(output["6666010188"].months["6"], 1);
  assert.equal(output["6666010102"].months["6"], 0.8);
  assert.equal(output["6666010101"].months["6"], 1.2);
  assert.equal(output["6666010315"].months["6"], 0.5);
  assert.equal(output["6666010380"].months["6"], 0.1);
  assert.ok(Math.abs(hrBudgetSyncTotal(output, 6) - 3.8) < 1e-9);
});

test("keeps source account names for traceability", () => {
  const output = buildHrBudgetAccountSync(sample, [6]);
  assert.deepEqual(output["6666010380"].accountKeys, ["bonus"]);
  assert.deepEqual(output["6666010380"].sourceLabels, ["Bonus"]);
});
