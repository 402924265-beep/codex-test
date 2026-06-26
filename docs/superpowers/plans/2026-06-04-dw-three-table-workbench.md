# DW Three Table Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the dishwasher variance site into a three-part workbench that replaces the current three Excel tables: yearly dashboard, month variance analysis, and project/factor tracking.

**Architecture:** Keep the site as a static GitHub Pages frontend that parses Excel locally in the browser. Add a persistence adapter that can save shared analysis and project data to Supabase when configured, with localStorage fallback until credentials are available.

**Tech Stack:** Vanilla HTML/CSS/JS modules, SheetJS `xlsx`, GitHub Pages, optional Supabase REST API.

---

### Task 1: Data Model

**Files:**
- Modify: `web_static/src/reconcile.js`
- Modify: `web_static/src/baseline-data.js`
- Create: `web_static/src/workbench.js`
- Test: `web_static/tests/workbench.test.js`

- [ ] Add a `buildDashboardMetrics(resultByMonth)` helper that returns monthly and cumulative rows for volume, manufacturing cost, unit cost, cumulative unit cost, and manufacturing rate.
- [ ] Add a `buildFactorSummary(items, month)` helper that separates increase and decrease factors and returns monthly, cumulative, and full-year impact.
- [ ] Add tests for monthly dashboard rows, cumulative unit cost, and factor summaries.

### Task 2: Shared Persistence Adapter

**Files:**
- Create: `web_static/src/store.js`
- Modify: `web_static/src/app.js`
- Test: `web_static/tests/store.test.js`

- [ ] Implement localStorage fallback for account analyses and project factors.
- [ ] Implement Supabase REST calls when `window.DW_SUPABASE_CONFIG` contains `url` and `anonKey`.
- [ ] Add clear UI status text for `本机保存` versus `后台共享`.
- [ ] Add tests for local fallback serialization and Supabase payload shape.

### Task 3: Three-Part UI

**Files:**
- Modify: `web_static/index.html`
- Modify: `web_static/src/styles.css`
- Modify: `web_static/src/app.js`

- [ ] Replace the current card grid with top tabs: `全年驾驶舱`, `月度差异`, `项目因素`.
- [ ] Build the dashboard table with 同期/预算/实际/差异/幅度 columns and red-green variance markers.
- [ ] Move account-level variance to the month tab with adaptive textarea sizes.
- [ ] Add the project/factor table with type, category, strategy, owner, timing, impact, progress, and monthly amount fields.

### Task 4: Category and Language Controls

**Files:**
- Modify: `web_static/src/reconcile.js`
- Modify: `web_static/src/app.js`
- Modify: `web_static/index.html`

- [ ] Remove visible 4+8 total cards and reference chips.
- [ ] Keep the full 4+8/forecast category set, including scrap, reselling, allocation, IT, association dues, and G&A.
- [ ] Add language selector for Chinese, English, and Turkish UI labels.
- [ ] Add tests or smoke checks that the page includes all expected controls.

### Task 5: Verify and Publish

**Files:**
- Modify: `package.json`
- Modify: `web_static/tests/verify-real-renta.mjs`

- [ ] Run `npm.cmd run test:web`.
- [ ] Run real workbook verification against the April Renta file.
- [ ] Open the public URL in the browser and confirm the empty state, tab structure, and imported data path.
- [ ] Publish to `gh-pages` with a new cache-busting version query.
