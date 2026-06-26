# V6 Three-Table Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current V5 prototype into a more usable three-table workbench with fixed 单/时/人/效/费 summary cards, clearer monthly and annual variance visuals, filtered metric detail, seeded project factors, and a more three-table-like export.

**Architecture:** Keep the static browser app and existing Excel parsers. Add focused data helpers for KPI cards, monthly variance series, category diagnostics, summary sentences, metric filtering, and export sheet layout; render these in the existing `app.js`/`index.html` structure without adding a backend.

**Tech Stack:** Vanilla ES modules, browser `xlsx`, SVG/canvas charts, Node test runner.

---

### Task 1: Data Helpers And Tests

**Files:**
- Modify: `web_static/src/app.js`
- Modify: `web_static/tests/forecast-parser.test.js`
- Modify: `web_static/tests/export.test.js`

- [ ] Add tests for annual rows including an `全年` column source and export sheet names/columns.
- [ ] Add helpers for KPI rate cards, annual/month summaries, monthly variance rows, category diagnostics, and seeded factors.
- [ ] Run `npm.cmd run test:web`.

### Task 2: Dashboard UI

**Files:**
- Modify: `web_static/index.html`
- Modify: `web_static/src/app.js`
- Modify: `web_static/src/styles.css`

- [ ] Move metric group selector above the metric detail table and make it a segmented control.
- [ ] Replace top dashboard cards with fixed 单/时/人/效/费 YoY cards.
- [ ] Add annual two-sentence summary.
- [ ] Replace trend line with monthly manufacturing variance bars: YoY variance and budget variance.
- [ ] Replace waterfall with centered annual category divergence chart.
- [ ] Add filter controls and `全年` column to metric detail.

### Task 3: Monthly Variance And Project Pages

**Files:**
- Modify: `web_static/index.html`
- Modify: `web_static/src/app.js`
- Modify: `web_static/src/styles.css`

- [ ] Replace monthly top cards with monthly 单/时/人/效/费 YoY cards.
- [ ] Add monthly two-sentence summary.
- [ ] Rebuild category comparison as diagnostic rows with unit diff, amount diff, manufacturing impact, and YoY %.
- [ ] Seed project factors from the original three-table examples and add project summary.

### Task 4: Export Workbook

**Files:**
- Modify: `web_static/src/export.js`

- [ ] Build sheets corresponding to the three-table format: cost data, monthly metric summary, month sheet, project sheet, formulas.
- [ ] Add column widths, merges, freeze panes, and number-friendly structures.
- [ ] Run `npm.cmd run test:web`.

### Task 5: Verify And Publish

**Files:**
- Modify: `web_static/index.html`
- Modify: `web_static/src/app.js`

- [ ] Update version to `20260605-dashboard-v6`.
- [ ] Run `npm.cmd run test:web`, `npm.cmd run verify:real-sap`, and `npm.cmd run verify:real-renta`.
- [ ] Verify local browser layout.
- [ ] Sync and push `web_static` to `gh-pages`.
