# V7 Metric Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a traceable annual and monthly dishwasher cost cockpit whose calculations and exported sheets match the confirmed three-table definitions.

**Architecture:** Add focused metric and Jiang Yue workbook parsers, then feed normalized monthly series into the existing dashboard and reconciliation renderer. Keep account-level reasons in the monthly variance state and formal cost-reduction projects in a separate project model.

**Tech Stack:** Static HTML/CSS, browser JavaScript modules, SheetJS, Node test runner, localStorage.

---

### Task 1: Metric formulas

**Files:**
- Create: `web_static/src/metrics.js`
- Create: `web_static/tests/metrics.test.js`

- [ ] Write failing tests for UPPH, manufacturing rate, annual weighted formulas, target completion and direct-plus-indirect headcount.
- [ ] Run `npm.cmd run test:web` and confirm the new tests fail because the module is missing.
- [ ] Implement the formulas without UI dependencies.
- [ ] Run the complete web test suite.

### Task 2: Jiang Yue workbook parser

**Files:**
- Create: `web_static/src/jiangyue-parser.js`
- Create: `web_static/tests/jiangyue-parser.test.js`
- Modify: `web_static/index.html`
- Modify: `web_static/src/app.js`

- [ ] Write a synthetic workbook test for same-period, budget and 2026 monthly price, volume, cost, rate, workdays, headcount and UPPH.
- [ ] Verify the parser test fails.
- [ ] Implement label-based sheet and row parsing.
- [ ] Add a browser-local Jiang Yue upload control and status.

### Task 3: Annual cockpit

**Files:**
- Modify: `web_static/src/forecast-parser.js`
- Modify: `web_static/src/app.js`
- Modify: `web_static/src/styles.css`
- Modify: `web_static/tests/forecast-parser.test.js`

- [ ] Write tests for the five business groups and removal of category-cost rows from indicator detail.
- [ ] Build the normalized rows for 单、时、人、效、费.
- [ ] Replace the charts with three-series unit-cost and manufacturing-rate charts.
- [ ] Add cell tooltips for YoY, optimization/worsening, budget variance and completion.

### Task 4: Monthly variance and reason summary

**Files:**
- Modify: `web_static/src/workbench.js`
- Modify: `web_static/src/app.js`
- Modify: `web_static/src/reconcile.js`
- Modify: `web_static/index.html`
- Modify: `web_static/tests/workbench.test.js`

- [ ] Write a test proving project data is absent from the monthly reason summary.
- [ ] Make month selection reflect only successfully parsed SAP months.
- [ ] Render monthly 单时人效费 and the expanded category comparison columns.
- [ ] Keep account reason inputs as the only source for the automatic monthly cause summary.

### Task 5: Formal cost-reduction projects

**Files:**
- Modify: `web_static/src/app.js`
- Modify: `web_static/index.html`
- Modify: `web_static/src/styles.css`
- Modify: `web_static/src/export.js`

- [ ] Replace increase/decrease cause terminology with the project tracker fields.
- [ ] Seed the current three-table project structure and preserve editable local storage.
- [ ] Export the project fields and monthly benefit columns.

### Task 6: Verification and release

**Files:**
- Verify: `web_static/tests/verify-real-sap.mjs`
- Verify: `web_static/tests/verify-real-renta.mjs`

- [ ] Run all unit tests and both real-file verifiers.
- [ ] Open the local site and test forecast, Jiang Yue and SAP imports.
- [ ] Check desktop layout, tooltips, month switching, reason summary and project page.
- [ ] Publish the verified static files to GitHub Pages with a new version query.
