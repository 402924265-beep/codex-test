import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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

test("role shell and HR budget workspace expose Chinese English and Turkish copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(html, /data-i18n="roleSelectTitle"/);
  assert.match(html, /data-i18n-option="financeAdmin"/);
  assert.match(html, /data-i18n="cookingFactory"/);
  assert.match(app, /DW HR Budget Workspace/);
  assert.match(app, /DW İK Bütçe Çalışma Alanı/);
  assert.match(app, /HR Owner Input/);
  assert.match(app, /İK Sorumlusu Girişi/);
  assert.match(app, /function hrAccountLabel/);
  assert.match(app, /function hrChangePeriod/);
});
