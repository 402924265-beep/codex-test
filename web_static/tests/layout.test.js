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
