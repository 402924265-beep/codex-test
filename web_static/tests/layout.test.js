import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { calculateDwHeadcountBudget } from "../hr-budget-preview/src/admin-headcount-linkage.js";

function functionSource(source, name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) return "";
  const next = source.indexOf("\nfunction ", start + 1);
  return source.slice(start, next < 0 ? source.length : next);
}

test("monthly variance keeps one reason summary above account-level inputs", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  const varianceView = html.match(/<section id="varianceView"[\s\S]*?<section id="projectsView"/)?.[0] || "";

  assert.equal((varianceView.match(/id="summaryText"/g) || []).length, 1);
  assert.equal((varianceView.match(/id="monthlySummary"/g) || []).length, 0);
  assert.equal((varianceView.match(/class="variance-hero"/g) || []).length, 0);
  assert.ok(varianceView.indexOf('id="summaryText"') < varianceView.indexOf('id="detailBody"'));
  assert.doesNotMatch(css, /\.narrative-panel\s*\{\s*display:\s*none/);
  assert.match(varianceView, /id="previousCostHeader"/);
  assert.match(varianceView, /科目描述/);
  assert.match(css, /editable-cell/);
  assert.match(css, /#varianceView \.table-wrap\s*\{[\s\S]*height:\s*clamp\(560px,\s*68vh,\s*760px\)/);
  assert.match(css, /#varianceView \.table-wrap thead th\s*\{[\s\S]*position:\s*sticky[\s\S]*z-index:\s*10/);
  assert.match(varianceView, /id="sameCostHeader"[^>]*>同期费用 K€/);
  assert.match(css, /#varianceView \.table-wrap th:nth-child\(6\),[\s\S]*text-align:\s*center/);
  assert.match(css, /#varianceView \.table-wrap td:nth-child\(6\) textarea\s*\{[\s\S]*text-align:\s*center/);
  assert.match(css, /\.attachment-row/);
  assert.match(css, /\.attachment-button input\s*\{[\s\S]*display:\s*none/);
  assert.match(css, /\.category-diagnostics\s*\{[\s\S]*max-height:\s*360px/);
});

test("project page points monthly reasons back to the second table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const projectsView = html.match(/<section id="projectsView"[\s\S]*?<\/main>/)?.[0] || "";

  assert.match(projectsView, /月度差异原因请在第二张表的小科目明细中填写/);
  assert.doesNotMatch(projectsView, /添加上涨因素|添加下降因素/);
});

test("trend charts render visible value labels and detail cells expose rich hover data", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(app, /chart-value-label/);
  assert.match(app, /data-metric-tooltip/);
  assert.match(app, /costVarianceTooltip/);
  assert.match(app, /费用同比/);
  assert.match(app, /单台环比/);
  assert.match(app, /metric-hover-tooltip/);
  assert.match(css, /\.chart-value-label/);
  assert.match(css, /\.metric-hover-tooltip/);
});

test("dashboard charts avoid label overlap and heatmap includes annual column", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(app, /placeChartLabels/);
  assert.match(app, /rateAxisBounds/);
  assert.match(app, /annualMetricValue/);
  assert.match(css, /repeat\(13/);
});

test("cooking and factory dashboards share real merged metric cells", async () => {
  const app = await readFile(new URL("../hr-budget-preview/src/app.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../hr-budget-preview/src/styles.css", import.meta.url), "utf8");

  assert.match(app, /function renderStandardMetricRows/);
  assert.match(app, /rowspan="\$\{rowSpan\}"/);
  assert.match(app, /factoryDashboardRows\(\)/);
  assert.match(app, /renderStandardMetricRows\(factoryDashboardVisibleRows\(dashboardRows\)/);
  assert.match(css, /\.dashboard-merged-cell/);
  assert.match(css, /\.dashboard-table td\s*\{[\s\S]*text-align:\s*right/);
  assert.match(app, /await load\("actual", handleSapFileChange\)/);
  assert.doesNotMatch(app, /await load\("sap", handleSapFileChange\)/);
  assert.doesNotMatch(app, /dashboardHint: "The 6\+6 forecast shows Jan-Jun actuals/);
  assert.match(app, /dashboardHint: "The current view shows Jan-Jul actuals/);
});

test("factory workbench matches the unit dashboard filters and shows all three scenarios by default", async () => {
  const app = await readFile(new URL("../hr-budget-preview/src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../hr-budget-preview/index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../hr-budget-preview/src/styles.css", import.meta.url), "utf8");

  assert.match(app, /workbenchScenario: "all"/);
  assert.match(app, /function renderFactoryMetricFilters/);
  assert.match(app, /class="metric-filter-bar"/);
  assert.match(app, /id="fwbIndicatorFilter"/);
  assert.match(app, /id="fwbScenarioFilter"/);
  assert.match(app, /id="fwbMonthFilter"/);
  assert.match(app, /id="fwbStatusFilter"/);
  assert.match(app, /class="cockpit-card detail-card fwb-detail-card"/);
  assert.match(app, /class="dashboard-table-wrap fwb-table-wrap"/);
  assert.match(app, /state\.workbenchScenario !== "all" && row\.scenario !== state\.workbenchScenario/);
  assert.match(app, /const scenarios = \["同期", "预算", "26年"\]/);
  assert.match(html, /class="dashboard-table metric-highlight-table"/);
  assert.match(app, /function installMetricTableHighlight/);
  assert.match(app, /data-highlight-cell/);
  assert.match(app, /data-highlight-metric-trigger/);
  assert.match(app, /data-highlight-period-trigger/);
  assert.match(app, /scenario-row-\$\{scenarioClass\(row\.scenario\)\}/);
  assert.match(app, /targetCompletionRate\(actual, budget, row\.direction\)/);
  assert.match(css, /\.scenario-row-same\.is-highlighted-group/);
  assert.match(css, /\.scenario-row-budget\.is-highlighted-group/);
  assert.match(css, /\.scenario-row-actual\.is-highlighted-group/);
  assert.match(css, /\.metric-selection-card/);
});

test("unit navigation exits the factory workbench even when the selected unit is unchanged", async () => {
  const app = await readFile(new URL("../hr-budget-preview/src/app.js", import.meta.url), "utf8");

  assert.match(app, /function switchBusinessUnit\(unitId, \{ force = false \} = \{\}\) \{[\s\S]*?if \(!unitId\) return;[\s\S]*?if \(isScopedBudgetRole\(\) && !force\) return;[\s\S]*?managementViewOpen[\s\S]*?switchTab\("dashboard"\);[\s\S]*?if \(unitId === state\.activeUnit\) return;/);
});

test("role login requires independent passwords and exposes both attendance workspaces", async () => {
  const html = await readFile(new URL("../hr-budget-preview/index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../hr-budget-preview/src/app.js", import.meta.url), "utf8");

  assert.match(html, /data-login-role="attendance"/);
  assert.match(html, /data-login-role="employeeAttendance"/);
  assert.match(html, /id="rolePassword" type="password"/);
  assert.match(html, /data-login-role="procurementPrice"/);
  assert.match(html, /data-login-role="adminThree"/);
  assert.match(html, /window\.DW_ROLE_GATE_BOUND = true/);
  assert.match(html, /aria-busy="true" disabled>正在加载工作台/);
  assert.match(app, /if \(!window\.DW_ROLE_GATE_BOUND\)/);
  assert.match(app, /els\.enterWorkspace\.disabled = false/);
  assert.match(app, /ROLE_PASSWORDS = Object\.freeze\(\{ finance: "111", hr: "222", admin: "333", attendance: "444", employeeAttendance: "555", procurementPrice: "66", adminThree: "777" \}\)/);
  assert.match(html, /id="adminThreeView"[\s\S]*id="adminThreeFrame"/);
  assert.match(app, /erpnext-dw-budget-demo\.html\?embedded=1&role=/);
  assert.doesNotMatch(app, /window\.location\.assign\("\.\/erpnext-dw-budget-demo\.html/);
  assert.match(app, /setSidebarCollapsed\(true\)/);
  assert.match(app, /switchTab\("adminThree"\)/);
  assert.match(app, /state\.rollingRole === "attendance"[\s\S]*?renderAttendanceWorkspace\(\)/);
  assert.match(app, /state\.rollingRole === "employeeAttendance"[\s\S]*?renderEmployeeAttendanceWorkspace\(\)/);
});

test("role entry and workspace default to Chinese and keep both language selectors synchronized", async () => {
  const html = await readFile(new URL("../hr-budget-preview/index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../hr-budget-preview/src/app.js", import.meta.url), "utf8");

  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<select id="roleLanguageSelect">\s*<option value="zh" selected>/);
  assert.match(html, /<select id="languageSelect">\s*<option value="zh" selected>/);
  assert.match(app, /language: "zh"/);
  assert.match(app, /roleLanguageSelect\?\.addEventListener\("change"/);
  assert.match(app, /document\.documentElement\.lang = language === "zh" \? "zh-CN" : language/);
});

test("scoped budget roles cannot navigate into CK or DW cost workspaces", async () => {
  const app = await readFile(new URL("../hr-budget-preview/src/app.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../hr-budget-preview/src/styles.css", import.meta.url), "utf8");

  assert.match(app, /function isScopedBudgetRole\(role = state\.rollingRole\)/);
  assert.match(app, /if \(isScopedBudgetRole\(\) && !force\) return;/);
  assert.match(app, /if \(isScopedBudgetRole\(\) && name !== "variance"\) name = "variance";/);
  assert.match(app, /if \(isScopedBudgetRole\(\)\) \{[\s\S]*?renderRollingForecastWorkspace\(rows\)/);
  assert.match(css, /\.demo-role-attendance \.unit-nav-item\[data-unit="cooking"\][\s\S]*display: none/);
  assert.match(css, /\.demo-role-employee-attendance \.unit-nav-item\[data-unit="cooking"\][\s\S]*display: none/);
});

test("employee attendance forecasts current-month DW and CK headcount from the supplied Excel baselines", async () => {
  const app = await readFile(new URL("../hr-budget-preview/src/app.js", import.meta.url), "utf8");
  const data = await readFile(new URL("../hr-budget-preview/src/employee-attendance-data.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../hr-budget-preview/src/styles.css", import.meta.url), "utf8");

  assert.match(app, /function employeeAttendanceMonthIndex\(\) \{\s*return new Date\(\)\.getMonth\(\);\s*\}/);
  assert.match(app, /data-employee-attendance-factory=/);
  assert.match(app, /data-employee-attendance-department=/);
  assert.match(app, /data-employee-attendance-input=/);
  assert.match(app, /field === "shared" \? "0\.001" : "1"/);
  assert.match(app, /field === "shared" \? Math\.max\(0, Math\.round\(rawValue \* 1000\) \/ 1000\) : Math\.max\(0, Math\.round\(rawValue\)\)/);
  assert.match(data, /sourceSheet: "Candy-DW-TR"/);
  assert.match(data, /sourceSheet: "Candy-Cooking \+ Production Analysis"/);
  assert.match(data, /row\("line-1"[\s\S]*?direct: 47, indirect: 3, white: 1/);
  assert.match(data, /row\("powder-paint"[\s\S]*?direct: 5/);
  assert.match(data, /row\("enamel-paint-support"[\s\S]*?indirect: 7/);
  assert.match(css, /\.eat-factory-tabs/);
  assert.match(css, /\.eat-department-nav button\.active/);
});

test("attendance workspace selects one cost center and reports service categories only", async () => {
  const app = await readFile(new URL("../hr-budget-preview/src/app.js", import.meta.url), "utf8");
  const data = await readFile(new URL("../hr-budget-preview/src/admin-attendance-data.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../hr-budget-preview/src/styles.css", import.meta.url), "utf8");

  assert.match(app, /function editableForecastMonths\(\) \{/);
  assert.match(app, /attendanceInputKey\(unit\.id, categoryKey, monthIndex\)/);
  assert.match(app, /attendanceT\("reasonRequired"\)/);
  assert.match(app, /attendanceUnit: "dw"/);
  assert.match(app, /data-attendance-unit=/);
  assert.match(app, /type="number" min="0" step="1" data-attendance-input=/);
  assert.match(app, /Math\.max\(0, Math\.round\(rawValue\)\)/);
  assert.match(app, /function attendanceEditableCategories\(\)[\s\S]*?\["direct", "indirect", "whiteCollar"\]\.includes\(categoryKey\)/);
  assert.doesNotMatch(app, /data-attendance-group=/);
  assert.match(app, /"td": "TD \(Tumble Dryer\)"/);
  assert.match(app, /"td": "TD \(Kurutma Makinesi\)"/);
  assert.match(app, /waste: "Atık yönetimi personeli"/);
  assert.match(app, /suppliers: "Tedarikçi personeli"/);
  assert.match(css, /\.aat-workbench \{ display: grid; grid-template-columns: 270px minmax\(0, 1fr\)/);
  assert.match(css, /\.aat-center-nav button\.active/);
  assert.match(data, /row\("dw", "DW"/);
  assert.match(data, /row\("dw-rd", "DW R&D"/);
  assert.match(data, /row\("procurement-dw", "PROCUREMENT DW"/);
  assert.match(data, /row\("ck2", "CK2"/);
  assert.match(data, /row\("ck-rd", "CK R&D"/);
  assert.match(data, /row\("td", "TD（干衣机）"/);
  assert.match(data, /row\("td-rd", "TUMBLE DRYER R&D"/);
  assert.match(data, /row\("procurement-ck", "PROCUREMENT CK"/);
  assert.match(data, /row\("procurement-td", "PROCUREMENT TD"/);
});

test("both headcount workspaces wire separate templates, preview-before-apply, monthly totals and compact periods", async () => {
  const app = await readFile(new URL("../hr-budget-preview/src/app.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../hr-budget-preview/src/styles.css", import.meta.url), "utf8");

  assert.match(app, /from "\.\/headcount-import\.js\?v=/);
  assert.match(app, /downloadHeadcountTemplate\("employee"\)/);
  assert.match(app, /downloadHeadcountTemplate\("attendance"\)/);
  assert.match(app, /data-employee-attendance-import/);
  assert.match(app, /data-attendance-import/);
  assert.match(app, /headcountImportPreviewMarkup\(employeeAttendanceImportPreview/);
  assert.match(app, /headcountImportPreviewMarkup\(attendanceImportPreview/);
  assert.match(app, /employeeAttendanceImportPreview\?\.changes\?\.length/);
  assert.match(app, /attendanceImportPreview\?\.changes\?\.length/);

  assert.equal((app.match(/const monthlyTotals = months\.map/g) || []).length, 2);
  assert.equal((app.match(/<tfoot><tr><th>\$\{escapeHtml\([^)]*T\("total"\)\)\}<\/th>\$\{monthlyTotals\.map/g) || []).length, 2);
  const period = functionSource(app, "headcountPeriodMarkup");
  assert.match(period, /class="headcount-period"/);
  assert.match(period, /<b>\$\{escapeHtml\(yearLabel\)\}<\/b><small>\$\{escapeHtml\(rangeLabel\)\}<\/small>/);

  assert.match(css, /\.aat-table-wrap \{[^}]*overflow: auto/);
  assert.match(css, /\.eat-table-wrap \{[^}]*overflow: auto/);
  assert.match(css, /\.aat-table \{[^}]*table-layout: fixed/);
  assert.match(css, /\.eat-table \{[^}]*table-layout: fixed/);
  assert.match(css, /\.aat-table tfoot th \{ position: sticky/);
  assert.match(css, /\.eat-table tfoot th \{ position: sticky/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /\.aat-workbench \{ grid-template-columns: 1fr; \}/);
  assert.match(css, /\.eat-body \{ grid-template-columns: 1fr; \}/);
});

test("administration, HR and generic rolling submissions expose withdrawal without deleting drafts", async () => {
  const app = await readFile(new URL("../hr-budget-preview/src/app.js", import.meta.url), "utf8");
  const adminWithdraw = functionSource(app, "withdrawAdminBudgetSubmission");
  const hrWithdraw = functionSource(app, "withdrawHrBudgetSubmission");
  const rollingClick = functionSource(app, "handleRollingForecastClick");

  for (const source of [adminWithdraw, hrWithdraw]) {
    assert.match(source, /delete state\.rollingForecastSubmitted\[code\]/);
    assert.match(source, /ROLLING_FORECAST_SUBMIT_KEY/);
    assert.doesNotMatch(source, /delete state\.rollingForecastDrafts/);
  }
  assert.match(app, /data-admin-action="withdraw"/);
  assert.match(app, /data-hr-action="withdraw"/);
  assert.match(app, /data-rf-action="withdraw-current"/);
  assert.match(app, /data-rf-action="withdraw-all"/);
  assert.match(app, /action === "withdraw-current"[\s\S]{0,240}delete state\.rollingForecastSubmitted/);
  assert.match(app, /action === "withdraw-all"[\s\S]{0,300}delete state\.rollingForecastSubmitted/);
  assert.doesNotMatch(rollingClick, /delete state\.rollingForecastDrafts/);
});

test("administration and HR workflow actions always leave a localized audit trail", async () => {
  const html = await readFile(new URL("../hr-budget-preview/index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../hr-budget-preview/src/app.js", import.meta.url), "utf8");
  const rollingClick = functionSource(app, "handleRollingForecastClick");
  const adminAudit = functionSource(app, "adminAuditFact");
  const hrAudit = functionSource(app, "hrBudgetAuditView");

  assert.match(rollingClick, /else if \(adminAction === "submit"\) adminBudgetAudit\.unshift/);
  assert.match(rollingClick, /reasonKey: "noBusinessChanges"/);
  assert.match(rollingClick, /if \(changes\.length \|\| hrAction === "submit"\)/);
  assert.match(rollingClick, /actionKey: hrAction === "submit" \? "submit" : "save"/);
  assert.match(rollingClick, /actionKey: "withdraw", changes: \[\]/);
  assert.match(adminAudit, /meta\?\.kind === "workflow"/);
  assert.match(hrAudit, /changes\.length \? changes\.map/);
  assert.match(hrAudit, /workflow: true/);
  assert.match(app, /function hrAuditActionLabel\(record\)/);
  assert.match(app, /function adminAuditPeriodLabel\(item\)/);
  assert.match(html, /id="analysisSaveStatus"[^>]*data-i18n="unsavedChanges"/);
  assert.match(html, /id="factorSaveStatus"[^>]*data-i18n="unsavedChanges"/);
});

test("budget workspaces keep source labels auxiliary and localize HR and admin presentation text", async () => {
  const app = await readFile(new URL("../hr-budget-preview/src/app.js", import.meta.url), "utf8");
  const procurement = functionSource(app, "renderProcurementPriceWorkspace");
  const adminPanel = functionSource(app, "adminSelectedPanel");
  const hrResults = functionSource(app, "hrBudgetResultTable");

  assert.match(procurement, /title="\$\{escapeHtml\(`\$\{category\.accountCode\} · \$\{category\.sourceLabel\}`\)\}"/);
  assert.doesNotMatch(procurement, /<span>\$\{escapeHtml\(category\.sourceLabel\)\}<\/span>/);
  assert.match(adminPanel, /title="\$\{escapeHtml\(category\.sourceLabel\)\}"/);
  assert.match(app, /function adminStandardValue\(item\)/);
  assert.match(app, /Kaydedilmiş DW çalışan tahmini/);
  assert.match(app, /inputEyebrow: "人力填报"/);
  assert.match(app, /parameterReal: "Parametreler · Gerçek saat"/);
  assert.match(hrResults, /title="\$\{escapeHtml\(account\.sourceLabel\)\}"/);
  assert.doesNotMatch(hrResults, /<small>\$\{escapeHtml\(account\.sourceLabel\)\}<\/small>/);
  assert.match(app, /function localeForLanguage\(language = state\.language\)/);
});

test("2030 forecast keeps wide tables scrollable, adapts at three widths and localizes apply-current-scenario", async () => {
  const forecast = await readFile(new URL("../hr-budget-preview/src/forecast-2030.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../hr-budget-preview/src/styles.css", import.meta.url), "utf8");

  assert.match(forecast, /save: "保存情景"/);
  assert.match(forecast, /save: "Save scenario"/);
  assert.match(forecast, /save: "Senaryoyu kaydet"/);
  assert.match(forecast, /Object\.assign\(COPY\.zh, \{[^}]*apply: "应用当前情景"/);
  assert.match(forecast, /Object\.assign\(COPY\.en, \{[^}]*apply: "Apply current scenario"/);
  assert.match(forecast, /Object\.assign\(COPY\.tr, \{[^}]*apply: "Mevcut senaryoyu uygula"/);
  assert.match(forecast, /longRangePlan: "长期规划"/);
  assert.match(forecast, /longRangePlan: "Long-range plan"/);
  assert.match(forecast, /longRangePlan: "Uzun vadeli plan"/);
  assert.match(forecast, /const COST_LABELS = \{/);
  assert.match(forecast, /function numberLocale\(language = getLanguage\(\)\)/);
  assert.match(forecast, /\(\?:产量\|\\bvolume\\b\|production\\s\+volume\|\\bhacim\\b/);
  assert.match(forecast, /placeholder="\$\{safe\(copy\.aiExample\)\}"/);
  assert.match(forecast, /<th>\$\{copy\.category\}<\/th><th>\$\{copy\.type\}<\/th>/);
  assert.match(css, /\.f30-table-wrap \{[^}]*overflow: auto/);
  assert.match(css, /\.f30-input-table \{[^}]*min-width: 920px/);
  assert.match(css, /\.f30-year-strip \{[^}]*overflow-x: auto/);
  assert.match(css, /@media \(max-width: 1100px\)/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(max-width: 600px\)/);
  assert.match(css, /\.f30-top-grid, \.f30-results \{ grid-template-columns: 1fr; \}/);
  assert.match(css, /\.f30-phase-track \{ grid-template-columns: 1fr; \}/);
  assert.match(css, /\.f30-head > div:last-child \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/);
});

test("DW saved headcount linkage keeps the confirmed eligibility and Excel workwear formula", () => {
  const result = calculateDwHeadcountBudget({
    monthIndex: 7,
    employee: { direct: 100, indirect: 20, white: 10, shared: 0.33 },
    service: { waste: 2, canteen: 3, cleaning: 4, security: 5, drivers: 6, suppliers: 7, trainees: 8, visitors: 9 }
  });

  assert.equal(result.workdays, 19);
  assert.equal(result.mealPrice, 214.44);
  assert.equal(result.overtime, 1.74);
  assert.equal(result.canteenHeadcount, 175.74);
  assert.equal(result.shuttleHeadcount, 153.74);
  assert.equal(result.uniform.sharedStatus, "pending");
  assert.equal(result.uniform.blue, 120);
  assert.equal(result.uniform.white, 10);
  assert.equal(result.uniform.sub, 14);
  assert.equal(Number(result.amounts.uniformsTry.toFixed(2)), 140867.33);
  assert.equal(Number(result.amounts.canteenTry.toFixed(2)), 716028.03);

  const customized = calculateDwHeadcountBudget({
    monthIndex: 7,
    employee: { direct: 100, indirect: 20, white: 10 },
    service: { waste: 2, canteen: 3, cleaning: 4, security: 5, drivers: 6, suppliers: 7, trainees: 8, visitors: 9 },
    adminParameters: {
      overtimeRate: 0.02,
      shuttleTargetOccupancy: 0.8,
      shuttleCapacity: 20,
      shuttleRoundTripFactor: 2,
      summerTshirtIssueQty: 3,
      uniformAllocationDivisor: 10
    }
  });
  assert.equal(customized.overtime, 3.48);
  assert.equal(Number(customized.shuttleRate.toFixed(4)), 180.625);
  assert.equal(customized.parameters.summerTshirtIssueQty, 3);
  assert.equal(customized.parameters.uniformAllocationDivisor, 10);
});

test("administration budget conditions show the DW annual baseline and use saved operations for later linkage", async () => {
  const app = await readFile(new URL("../hr-budget-preview/src/app.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../hr-budget-preview/src/styles.css", import.meta.url), "utf8");
  const baseline = calculateDwHeadcountBudget({
    monthIndex: 7,
    employee: { direct: 218, indirect: 85, white: 23, shared: 2.98 },
    service: { waste: 10, canteen: 0, cleaning: 5, security: 1, drivers: 2, suppliers: 2, trainees: 10, visitors: 10 }
  });

  assert.equal(baseline.canteenHeadcount, 369.66);
  assert.equal(Number(baseline.amounts.canteenTry.toFixed(2)), 1506127.92);
  assert.match(app, /function ensureDwHeadcountBudgetBaseline\(\)/);
  assert.match(app, /mode: "baseline"/);
  assert.match(app, /mode: "saved"/);
  assert.match(app, /function adminHeadcountConditions\(category\)/);
  assert.match(app, /生产计划部门/);
  assert.match(app, /行政部门/);
  assert.match(app, /copy\.eligible/);
  assert.match(app, /adminBudgetInputs\.months\?\.\[category\.id\]/);
  assert.match(app, /DIR BC（直接蓝领）/);
  assert.match(app, /Shared（共享人员）/);
  assert.match(app, /IND BC（间接蓝领）/);
  assert.match(app, /WC（白领）/);
  assert.match(app, /function adminRuleEditor\(category\)/);
  assert.match(app, /data-admin-rule-input=/);
  assert.match(app, /function applyAdminRuleBudgetChanges\(ruleChanges\)/);
  assert.match(app, /kind: "adminRule"/);
  assert.match(css, /\.adb-linked-driver-table/);
  assert.match(css, /\.adb-parameter-card/);
});

test("administration change records localize generated labels, periods and linkage traces", async () => {
  const app = await readFile(new URL("../hr-budget-preview/src/app.js", import.meta.url), "utf8");

  assert.match(app, /function adminAuditCategoryId\(item\)/);
  assert.match(app, /function adminAuditPeriodIndex\(item\)/);
  assert.match(app, /function adminAuditTrace\(item\)/);
  assert.match(app, /function adminAuditReason\(item\)/);
  assert.match(app, /sourceKind: "employee"/);
  assert.match(app, /sourceKind: "attendance"/);
  assert.match(app, /categoryId: change\.category\.id, periodIndex: change\.index/);
  assert.match(app, /toLocaleString\(locale\)/);
  assert.match(app, /adminLinkedTrace\(categoryId, item\.inputTraceMeta, state\.language\)/);
  assert.match(app, /function adminAuditGroupedRows\(\)/);
  assert.match(app, /function adminAuditFact\(item\)/);
  assert.match(app, /factMeta: employeeAuditFactMeta\(changes\)/);
  assert.match(app, /factMeta: attendanceAuditFactMeta\(changes\)/);
  assert.match(app, /id: `linked-fact-/);
  assert.doesNotMatch(app, /<td>\$\{formatMoney\(item\.before \/ ADMIN_BUDGET_DATA\.eurTry \/ 1000\)\}/);
});

test("procurement price validation keeps each current-month price reversible and links only saved checks", async () => {
  const app = await readFile(new URL("../hr-budget-preview/src/app.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../hr-budget-preview/src/styles.css", import.meta.url), "utf8");
  const linkage = await readFile(new URL("../hr-budget-preview/src/admin-headcount-linkage.js", import.meta.url), "utf8");
  const procurement = functionSource(app, "renderProcurementPriceWorkspace");

  assert.match(app, /procurementPrice: "66"/);
  assert.match(app, /function renderProcurementPriceWorkspace\(\)/);
  assert.match(app, /data-procurement-revoke=/);
  assert.match(app, /attachmentRequired/);
  assert.match(app, /deleteProcurementAttachment/);
  assert.match(app, /sourceKind: "procurementRevoke"/);
  assert.match(app, /procurementPricesForMonth\(monthIndex\)/);
  assert.match(app, /headcountPeriodMarkup\(2026, \[monthIndex\]\)/);
  assert.match(procurement, /class="ppv-guide"/);
  assert.match(procurement, /class="ppv-file-row"/);
  assert.match(procurement, /const changeGate = changes\.length/);
  assert.doesNotMatch(procurement, /<small>\$\{escapeHtml\(procurementT\("attachmentRequired"\)\)\}<\/small>/);
  assert.doesNotMatch(procurement, /<b>\$\{escapeHtml\(category\.accountCode\)\}<\/b>/);
  assert.match(css, /\.demo-role-procurement-price \.top-strip, \.demo-role-procurement-price \.tabbar \{ display: none; \}/);
  assert.match(css, /body\.demo-role-procurement-price #varianceView > #monthlyKpiGrid/);
  assert.match(css, /\.demo-role-procurement-price \.business-sidebar \.sidebar-section \{ display: none; \}/);
  assert.match(linkage, /DW_PROCUREMENT_PRICE_LINES/);
  assert.match(linkage, /safetyVest.*baseline: 250, quantity: 12/);
  assert.match(linkage, /procurementPrices = \{\}/);
});
