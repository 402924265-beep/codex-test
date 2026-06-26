# DW January Reconciliation Web Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local LAN-accessible web app that reconciles dishwasher January account-level `26 actual - 25 same-period actual` differences.

**Architecture:** A small Python standard-library HTTP server serves static HTML/JS and JSON APIs. Excel parsing and reconciliation live in focused Python modules, with workbook-cleaning support for finance files that contain invalid Excel defined names. The first version handles DW January only, while keeping source adapters and category mapping configurable for later months/projects.

**Tech Stack:** Python 3.12, openpyxl, stdlib `http.server`, vanilla HTML/CSS/JavaScript, unittest.

---

### Task 1: File Layout And Configuration

**Files:**
- Create: `dw_reconcile_app/__init__.py`
- Create: `dw_reconcile_app/config.py`
- Create: `dw_reconcile_app/static/index.html`
- Create: `dw_reconcile_app/static/styles.css`
- Create: `dw_reconcile_app/static/app.js`
- Create: `run_dw_reconcile_app.ps1`

- [ ] **Step 1: Create configuration constants**

Add default source paths, project/month defaults, and big-category keyword mapping in `dw_reconcile_app/config.py`.

- [ ] **Step 2: Create the static page shell**

Add the initial HTML structure: source path input, load button, summary cards, chart area, filters, detail table, and export button.

- [ ] **Step 3: Add startup script**

Create `run_dw_reconcile_app.ps1` that runs the bundled Python app on `0.0.0.0:8765`.

### Task 2: Excel Loading And Source Extraction

**Files:**
- Create: `dw_reconcile_app/excel_io.py`
- Create: `tests/test_excel_io.py`

- [ ] **Step 1: Implement account-code extraction**

Support 10-digit account codes plus `FIX`/`VAR` summary rows.

- [ ] **Step 2: Implement safe workbook loading**

Try openpyxl first. If loading fails because of invalid defined names such as `#N/A`, create a temporary cleaned workbook copy that removes invalid defined names from `xl/workbook.xml`, then load that copy. Never modify the original workbook.

- [ ] **Step 3: Implement Renta sheet extraction**

Extract one month of K€ and CPU from `Renta DW _2025 ` and `Renta DW _2026` style sheets. Duplicate account codes are summed; CPU is recalculated as `sum(K€) / volume * 1000`.

- [ ] **Step 4: Test parsing helpers**

Use unittest with small synthetic workbooks or pure helper tests for account-code extraction and duplicate aggregation.

### Task 3: Reconciliation Core

**Files:**
- Create: `dw_reconcile_app/reconcile.py`
- Create: `tests/test_reconcile.py`

- [ ] **Step 1: Define data structures**

Use dataclasses for source rows, reconciled rows, category summaries, and the full result payload.

- [ ] **Step 2: Implement account matching**

Merge 25/26 rows by account code and classify each as `both`, `only_25`, or `only_26`.

- [ ] **Step 3: Implement difference calculations**

Compute `unit_diff = actual_26_unit - actual_25_unit` and `amount_diff = actual_26_amount - actual_25_amount`.

- [ ] **Step 4: Implement big-category summaries**

Map accounts to categories using configurable keywords. Depreciation category includes Depreciation plus Functional Currency Impact.

- [ ] **Step 5: Test matching and summary behavior**

Verify `6666010188` style rows calculate actual-vs-same-period differences and unmatched accounts are preserved.

### Task 4: HTTP API And Excel Export

**Files:**
- Create: `dw_reconcile_app/exporter.py`
- Create: `dw_reconcile_app/server.py`
- Create: `tests/test_exporter.py`

- [ ] **Step 1: Implement `/api/reconcile`**

Accept a JSON body with optional actual-2026 path and return the reconciliation payload.

- [ ] **Step 2: Implement `/api/export`**

Accept current rows including user-entered analysis text and return an `.xlsx` workbook.

- [ ] **Step 3: Implement static file serving**

Serve `/` and static assets from `dw_reconcile_app/static`.

- [ ] **Step 4: Test exporter**

Verify exported workbook has detail rows, unmatched status, category summary, and analysis column.

### Task 5: Frontend Interaction

**Files:**
- Modify: `dw_reconcile_app/static/index.html`
- Modify: `dw_reconcile_app/static/styles.css`
- Modify: `dw_reconcile_app/static/app.js`

- [ ] **Step 1: Implement data loading**

Call `/api/reconcile`, display errors clearly, and render summary cards.

- [ ] **Step 2: Implement filters and sorting**

Support all/both/only_25/only_26/high-impact filters and sorting by amount or unit difference.

- [ ] **Step 3: Implement editable analysis**

Allow users to type analysis per row and keep it in browser state until export.

- [ ] **Step 4: Implement big-category chart**

Render 25 vs 26 bar comparisons by category and allow clicking a category to filter detail rows.

- [ ] **Step 5: Implement export**

Send current rows plus analysis to `/api/export` and download the result.

### Task 6: End-To-End Verification

**Files:**
- Create: `tools/verify_dw_reconcile_app.py`

- [ ] **Step 1: Run unit tests**

Run: `python -m unittest discover -s tests -v`

- [ ] **Step 2: Verify real DW January data**

Run the verification script against:

`E:\桌面\李想\财务报表\2025 monthly Renta DW _ NOV_ACT.xlsx`

and

`E:\桌面\李想\财务报表\2026 MFG Variance Reporting_ DW_04.2026 v1.xlsx`

Expected: successful payload, nonzero account rows, unmatched rows preserved, category summaries present, and `6666010188` present.

- [ ] **Step 3: Start the local server**

Run `.\run_dw_reconcile_app.ps1`, then open `http://127.0.0.1:8765`.

- [ ] **Step 4: Report LAN URL**

Print the machine IPv4 addresses so the user can share `http://<ip>:8765` with colleagues on the same network.

## Self-Review

Spec coverage:

- Actual vs same-period account-level difference: Task 3.
- Input finance report path: Task 4 and Task 5.
- Editable analysis: Task 5 and Task 4 export.
- Big-category chart: Task 3 summary and Task 5 chart.
- Depreciation plus Functional Currency Impact: Task 3.
- Dirty Excel handling: Task 2.
- Local LAN use: Task 4, Task 6.

Placeholder scan: no TBD/TODO placeholders.

Type consistency: modules pass account records through dataclasses and JSON dictionaries with stable field names.
