import test from "node:test";
import assert from "node:assert/strict";

import { buildKpiDefinitions, categoryComparisonHeaders } from "../src/presentation.js";

test("dynamic KPI definitions are fully localized", () => {
  const en = buildKpiDefinitions("en");
  const tr = buildKpiDefinitions("tr");

  assert.deepEqual(en.map((item) => item.title), ["Orders", "Time", "People", "Efficiency", "MFG rate", "Unit cost"]);
  assert.equal(en[0].formula, "2026 orders / 2025 orders");
  assert.equal(en[1].unit, "days");
  assert.equal(en[2].formula, "2026 avg. direct + indirect / 2025");
  assert.equal(en[5].formula, "2026 unit cost / 2025 unit cost");
  assert.equal(tr[4].formula, "2026 üretim gider oranı / 2025");
  assert.doesNotMatch(JSON.stringify(en), /[\u4e00-\u9fff]/);
});

test("monthly category comparison headers are localized", () => {
  assert.deepEqual(categoryComparisonHeaders("en"), [
    "Category",
    "2025 unit €/pc",
    "2026 target unit €/pc",
    "2026 actual unit €/pc",
    "YoY unit gap €/pc",
    "Target unit gap €/pc",
    "YoY impact K€",
    "Target impact K€",
    "YoY %"
  ]);
});
