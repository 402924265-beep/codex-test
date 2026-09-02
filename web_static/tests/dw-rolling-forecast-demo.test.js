import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ADMIN_BUDGET_DATA } from "../hr-budget-preview/src/admin-budget-data.js";
import { FACTORY_WORKBENCH_DATA } from "../hr-budget-preview/src/factory-workbench-data.js";
import { ACCOUNT_FORECAST_DW_BY_MONTH } from "../hr-budget-preview/src/account-plan-data.js";
import { BASELINE_25_BY_MONTH } from "../hr-budget-preview/src/baseline-data.js";
import { DW_ROLLING_VINTAGES } from "../hr-budget-preview/src/dw-rolling-vintage-data.js";

const account = {
  canteen: { code: "6666020502", actual: "meal" },
  shuttle: { code: "6666020401", actual: "shuttle" },
  uniforms: { code: "6666010314", actual: "workwear" }
};

function functionSource(source, name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) return "";
  const next = source.indexOf("\nfunction ", start + 1);
  return source.slice(start, next < 0 ? source.length : next);
}

test("DW rolling forecast separates Jan–Jul actual, administration forecast and prior forecast", async () => {
  const expected = {
    canteen: [22.04347, 33.45617, 17.30111, 42.3881, 35.37475, 37.6714, 34.57257],
    shuttle: [31.34574, 36.94771, 25.87161, 40.55119, 35.94637, 38.19261, 37.50955],
    uniforms: [5.27735, 50.44541, 0.11913, 0.35103, 6.25963, 0, -0.96969]
  };
  for (const [id, meta] of Object.entries(account)) {
    assert.deepEqual(FACTORY_WORKBENCH_DATA.units.dishwasher.months.slice(0, 7).map((month) => month.semiFixed[meta.actual]), expected[id]);
    assert.ok(ADMIN_BUDGET_DATA.categories.find((item) => item.id === id)?.monthlyTry[6] > 0);
    assert.ok(ACCOUNT_FORECAST_DW_BY_MONTH["7"].accounts.filter((item) => item.code === meta.code).reduce((total, item) => total + item.amount, 0) > 0);
  }
  const app = await readFile(new URL("../hr-budget-preview/src/erpnext-budget-demo.js", import.meta.url), "utf8");
  assert.match(app, /const ACTUAL_CUTOFF = 7/);
  assert.match(app, /view:"forecast"/);
  assert.match(app, /1—7月实际/);
  assert.match(app, /function renderR2Baseline\(\)/);
  assert.match(app, /function bridgeFor\(id,index\)/);
  assert.match(app, /peopleImpact:"人数影响"/);
  assert.match(app, /t\("workdays"\),row\.workdays/);
  assert.match(app, /aria-current=/);
  assert.match(app, /dwRollingForecastWorkflow\.v2/);
  assert.match(app, /function rollingVarianceMatrixMarkup\(\)/);
  assert.match(app, /data-variance-tip=/);
  assert.match(app, /const showBaseline=state\.version==="r2"&&state\.view==="forecast"/);
  assert.doesNotMatch(app, /const varianceCell=event\.target\.closest/);
  assert.match(app, /actualVarianceTitle:"实际较滚动预测"/);
  assert.doesNotMatch(app, /actualVarianceTitle:"1—7月执行差异"/);
  assert.match(app, /const query = new URLSearchParams/);
  assert.match(app, /const accessRole = query\.get\("role"\)/);
  assert.match(app, /const canApprove=accessRole==="finance"/);
  assert.match(app, /if\(accessRole!=="finance"\)/);
  assert.match(app, /data-save-drivers/);
  assert.match(app, /data-driver-input=/);
  assert.match(app, /localStorage\.setItem\(STORAGE\.rules/);
  assert.match(app, /localStorage\.setItem\(STORAGE\.procurement/);
  assert.doesNotMatch(app, /Budget R3|R3 Approved|替代R2/);
});

test("DW realization matrix compares 3+9 through 6+6 with the corresponding actual month", async () => {
  assert.deepEqual(DW_ROLLING_VINTAGES.map(({ version, actualMonthIndex }) => [version, actualMonthIndex]), [
    ["3+9", 3],
    ["4+8", 4],
    ["5+7", 5],
    ["6+6", 6]
  ]);
  const expectedTotals = [1.88825774268353, 17.9392357034823, -6.36874783378792, 0.23414316429172];
  DW_ROLLING_VINTAGES.forEach((vintage, index) => {
    const totalVariance = Object.entries(account).reduce((total, [id, meta]) => {
      const actual = FACTORY_WORKBENCH_DATA.units.dishwasher.months[vintage.actualMonthIndex].semiFixed[meta.actual];
      return total + actual - vintage.forecast[id];
    }, 0);
    assert.equal(Number(totalVariance.toFixed(5)), Number(expectedTotals[index].toFixed(5)));
  });
  const app = await readFile(new URL("../hr-budget-preview/src/erpnext-budget-demo.js", import.meta.url), "utf8");
  assert.match(app, /function rollingVarianceFor\(id,vintage\)/);
  assert.match(app, /actualKEur\(id,vintage\.actualMonthIndex\)-n\(vintage\.forecast\[id\]\)/);
  assert.match(app, /DW_ROLLING_VINTAGES\.map/);
  assert.match(DW_ROLLING_VINTAGES[0].source, /Renta DW/);
  assert.doesNotMatch(DW_ROLLING_VINTAGES.map((item) => item.source).join(" "), /Cooking|CK/);
  assert.doesNotMatch(app, /COMPARISON_COPY/);
});

test("DW workflow gates on the production save and keeps approval concise and reversible", async () => {
  const app = await readFile(new URL("../hr-budget-preview/src/erpnext-budget-demo.js", import.meta.url), "utf8");
  const readWorkflow = functionSource(app, "readWorkflow");
  const resetWorkflow = functionSource(app, "resetWorkflow");
  const addWorkflowEvent = functionSource(app, "addWorkflowEvent");
  const saveEditableDrivers = functionSource(app, "saveEditableDrivers");
  const productionSubmission = functionSource(app, "productionSubmission");
  const renderApproval = functionSource(app, "renderApproval");

  assert.match(app, /workflow:"dwRollingForecastWorkflow\.v3"/);
  assert.match(app, /workflowLegacy:"dwRollingForecastWorkflow\.v2"/);
  assert.match(readWorkflow, /readJson\(STORAGE\.workflow,null\)/);
  assert.match(readWorkflow, /readJson\(STORAGE\.workflowLegacy,null\)/);
  assert.match(readWorkflow, /localStorage\.setItem\(STORAGE\.workflow,JSON\.stringify\(migrated\)\)/);

  assert.match(app, /function submissionReady\(\)\{ return Boolean\(productionSubmission\(\)\); \}/);
  assert.match(productionSubmission, /readJson\(STORAGE\.employee,null\)/);
  assert.match(productionSubmission, /saved\?\.timestamp\?saved:null/);
  assert.match(renderApproval, /displayStatus=current==="draft"\?"pending":current/);
  assert.doesNotMatch(renderApproval, /departmentSubmissionCard|department-records|productionWait|approvalHint/);
  assert.doesNotMatch(app, /function (administrationSubmission|procurementSubmission|departmentSubmissionCard|submissionItems)\(/);
  assert.doesNotMatch(app, /data-confirm=/);
  assert.match(app, /if\(state\.workflow\.status!=="draft"\|\|!submissionReady\(\)\)/);
  assert.match(app, /if\(accessRole!=="adminThree"\)\{ toast\(t\("adminOnly"\)\)/);
  assert.match(app, /if\(accessRole!=="finance"\)\{ toast\(t\("financeOnly"\)\)/);
  assert.match(app, /data-action="withdraw"/);
  assert.match(app, /data-action="revokeApproval"/);

  assert.match(resetWorkflow, /state\.workflow\.status="draft"/);
  assert.match(resetWorkflow, /confirmed=\{production:false,administration:false,procurement:false\}/);
  assert.match(resetWorkflow, /addWorkflowEvent\(action,from,"draft",details\)/);
  assert.doesNotMatch(resetWorkflow, /STORAGE\.(rules|procurement|employee|attendance)/);
  assert.doesNotMatch(resetWorkflow, /removeItem|clear\(/);

  assert.match(addWorkflowEvent, /action,from,to/);
  assert.match(addWorkflowEvent, /actor:accessRole,role:accessRole/);
  assert.match(addWorkflowEvent, /at:new Date\(\)\.toISOString\(\)/);
  assert.match(app, /resetWorkflow\("withdraw"\)/);
  assert.match(app, /resetWorkflow\("return"\)/);
  assert.match(app, /resetWorkflow\("revokeApproval"\)/);

  assert.match(saveEditableDrivers, /const previous=/);
  assert.match(saveEditableDrivers, /Math\.abs\(previous-value\)<1e-9/);
  assert.match(saveEditableDrivers, /if\(!changed\) return/);
});

test("DW redesign keeps one unit note, three complete locales and variance-first affordances", async () => {
  const app = await readFile(new URL("../hr-budget-preview/src/erpnext-budget-demo.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../hr-budget-preview/src/erpnext-budget-demo.css", import.meta.url), "utf8");
  const html = await readFile(new URL("../hr-budget-preview/erpnext-dw-budget-demo.html", import.meta.url), "utf8");

  assert.match(app, /function keur\(value\)\{ return money\(value\); \}/);
  assert.match(app, /zh:\{ varianceOverview:/);
  assert.match(app, /en:\{ varianceOverview:/);
  assert.match(app, /tr:\{ varianceOverview:/);
  assert.match(app, /function compactVarianceOverviewMarkup\(\)/);
  assert.match(app, /rollingVarianceMatrixMarkup\(\).*compactVarianceOverviewMarkup\(\)/s);
  assert.match(app, /data-tooltip=/);
  assert.doesNotMatch(app, /data-impact-account=/);
  assert.match(app, /executionFirstPeriod/);
  assert.match(css, /\.variance-kpis/);
  assert.doesNotMatch(css, /\.variance-marker|\.department-records|\.department-submission/);
  assert.match(css, /\.actual-variance-table\{table-layout:fixed\}/);
  assert.match(css, /\.forecast-ledger\{table-layout:fixed/);
  assert.match(css, /\.variance-hover\{position:fixed/);
  assert.match(css, /font-family:"Noto Sans SC"/);
  assert.match(css, /NotoSansSC-Variable\.ttf/);
  assert.match(css, /html\[lang="zh-CN"\] \.rail button span/);
  assert.match(css, /html\.embedded \.rail\{display:none\}/);
  assert.doesNotMatch(css, /html\.embedded \.tabs\{[^}]*display:flex/);
  assert.match(app, /const VIEW_IDS = \["forecast", "inputs", "variance", "approval", "execution"\]/);
  assert.match(app, /type:"dw-three-state"/);
  assert.match(app, /type==="dw-three-view"/);
  assert.match(html, /THESIS: A factory SPC control room for cost variance/);
  assert.match(html, /id="varianceHover"/);
});

test("DW execution tooltip reuses three-sheet YoY rows and sums duplicate account entries", () => {
  const januaryMeals = BASELINE_25_BY_MONTH["1"].accounts
    .filter(([code, amount]) => code === "6666020502" && Number.isFinite(Number(amount)))
    .map(([, amount]) => Number(amount));
  assert.ok(januaryMeals.length > 1);
  assert.equal(Number(januaryMeals.reduce((total, value) => total + value, 0).toFixed(5)), 34.23865);
});
