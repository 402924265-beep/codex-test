import {
  BASELINE_25_BY_MONTH,
  BUDGET_26_BY_MONTH,
  CATEGORY_ORDER,
  FORECAST_4PLUS8_BY_MONTH,
  MONTH_NARRATIVES
} from "./baseline-data.js";
import { MONTHS, extractActualFromWorkbook } from "./parser.js";
import { buildReconciliation } from "./reconcile.js";
import { exportAnalysisWorkbook } from "./export.js";
import { loadXlsx } from "./xlsx-loader.js";

const state = {
  workbook: null,
  actualByMonth: new Map(),
  resultByMonth: new Map(),
  result: null,
  analysisByCode: loadAnalysis(),
  chartHitZones: []
};

const els = {
  sapFile: document.getElementById("sapFile"),
  exportBtn: document.getElementById("exportBtn"),
  monthSelect: document.getElementById("monthSelect"),
  searchInput: document.getElementById("searchInput"),
  statusFilter: document.getElementById("statusFilter"),
  categoryFilter: document.getElementById("categoryFilter"),
  sortBy: document.getElementById("sortBy"),
  total26: document.getElementById("total26"),
  total25: document.getElementById("total25"),
  diffAmount: document.getElementById("diffAmount"),
  diffUnit: document.getElementById("diffUnit"),
  budget26: document.getElementById("budget26"),
  forecast26: document.getElementById("forecast26"),
  manufacturingDiff: document.getElementById("manufacturingDiff"),
  statusCount: document.getElementById("statusCount"),
  referenceStatus: document.getElementById("referenceStatus"),
  referenceNote: document.getElementById("referenceNote"),
  narrativeText: document.getElementById("narrativeText"),
  sharedAnalysis: document.getElementById("sharedAnalysis"),
  validationChips: document.getElementById("validationChips"),
  categoryChart: document.getElementById("categoryChart"),
  emptyChart: document.getElementById("emptyChart"),
  detailBody: document.getElementById("detailBody"),
  rowCount: document.getElementById("rowCount"),
  toast: document.getElementById("toast")
};

els.sapFile.addEventListener("change", handleFileChange);
els.monthSelect.addEventListener("change", selectCurrentMonth);
els.searchInput.addEventListener("input", renderTable);
els.statusFilter.addEventListener("change", renderTable);
els.categoryFilter.addEventListener("change", renderTable);
els.sortBy.addEventListener("change", renderTable);
els.exportBtn.addEventListener("click", async () => {
  try {
    await exportAnalysisWorkbook(state.result, state.analysisByCode);
  } catch (error) {
    toast(error.message || String(error), true);
  }
});
els.categoryChart.addEventListener("click", handleChartClick);
window.addEventListener("resize", () => {
  if (state.result) renderChart();
});

renderEmpty();

async function handleFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    toast(`正在读取 ${file.name}`);
    const XLSX = await loadXlsx();
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
    state.workbook = workbook;
    state.actualByMonth.clear();
    state.resultByMonth.clear();

    for (const item of MONTHS) {
      try {
        const actual26 = extractActualFromWorkbook(workbook, item.month, XLSX);
        const result = buildReconciliation({
          baseline25: BASELINE_25_BY_MONTH[item.month],
          budget26: BUDGET_26_BY_MONTH[item.month],
          actual26,
          forecast4plus8: FORECAST_4PLUS8_BY_MONTH[item.month],
          month: item.month,
          categoryOrder: CATEGORY_ORDER,
          narrative: MONTH_NARRATIVES[item.month]
        });
        state.actualByMonth.set(item.month, actual26);
        state.resultByMonth.set(item.month, result);
      } catch (error) {
        console.warn(error);
      }
    }

    if (!state.resultByMonth.has(1)) throw new Error("没有解析到1月SAP实际数");
    selectCurrentMonth();
    els.exportBtn.disabled = false;
    toast(`已读取 ${file.name}`);
  } catch (error) {
    toast(error.message || String(error), true);
  }
}

function selectCurrentMonth() {
  const month = Number(els.monthSelect.value);
  state.result = state.resultByMonth.get(month) || null;
  if (!state.result) {
    renderEmpty();
    toast(`${month}月没有可用SAP实际数`, true);
    return;
  }
  renderAll();
}

function renderAll() {
  renderSummary();
  renderCategoryFilter();
  renderValidationChips();
  renderNarrative();
  renderChart();
  renderTable();
}

function renderEmpty() {
  state.result = null;
  els.total26.textContent = "--";
  els.total25.textContent = "--";
  els.diffAmount.textContent = "--";
  els.diffUnit.textContent = "--";
  els.budget26.textContent = "--";
  els.forecast26.textContent = "--";
  els.manufacturingDiff.textContent = "--";
  els.statusCount.textContent = "--";
  els.referenceStatus.textContent = "--";
  els.referenceNote.textContent = "待导入";
  els.validationChips.innerHTML = "";
  els.narrativeText.textContent = "导入SAP报表后显示本月总结和原因分析";
  els.sharedAnalysis.innerHTML = "";
  els.emptyChart.style.display = "grid";
  els.rowCount.textContent = "0 项";
  els.detailBody.innerHTML = '<tr><td colspan="12" class="empty-cell">导入SAP报表后显示科目明细</td></tr>';
}

function renderSummary() {
  const { summary, referenceChecks } = state.result;
  els.total26.textContent = formatMoney(summary.totalAmount26);
  els.total25.textContent = formatMoney(summary.totalAmount25);
  els.budget26.textContent = formatMoney(summary.totalAmountBudget);
  els.forecast26.textContent = formatMoney(summary.totalAmountForecast);
  els.diffAmount.textContent = formatMoney(summary.totalAmountDiff);
  els.diffAmount.className = valueClass(summary.totalAmountDiff);
  els.diffUnit.textContent = formatUnit(summary.totalUnitDiff);
  els.diffUnit.className = valueClass(summary.totalUnitDiff);
  els.manufacturingDiff.textContent = formatMoney(summary.manufacturingDiff);
  els.manufacturingDiff.className = valueClass(summary.manufacturingDiff);
  els.statusCount.textContent = `${summary.highImpactCount} / ${summary.budgetMissingCount}`;
  if (referenceChecks.available) {
    els.referenceStatus.textContent = formatMoney(referenceChecks.totalReference);
    els.referenceNote.textContent = `4+8预测口径，和SAP差 ${formatMoney(referenceChecks.totalDiff)} K€`;
  } else {
    els.referenceStatus.textContent = "--";
    els.referenceNote.textContent = "无4+8预测";
  }
}

function renderValidationChips() {
  els.validationChips.innerHTML = MONTHS.map((item) => {
    const result = state.resultByMonth.get(item.month);
    if (!result) return `<span class="chip">${item.label}无数据</span>`;
    const status = result.referenceChecks?.totalStatus || "missing";
    return `<span class="chip ${status}">${item.label} 4+8${status === "ok" ? "对上" : "有差异"}</span>`;
  }).join("");
}

function renderNarrative() {
  const blocks = state.result.narrative?.blocks || [];
  els.narrativeText.textContent = blocks.join("\n\n") || "暂无三张表总结";
  const rows = state.result.rows
    .filter((row) => row.isHighImpact)
    .slice(0, 8)
    .map((row) => {
      const analysis = state.analysisByCode[row.code] || "";
      return `<li><strong>${escapeHtml(row.code)}</strong> ${escapeHtml(row.descEn)}：${escapeHtml(analysis || "待填写原因")}</li>`;
    });
  els.sharedAnalysis.innerHTML = rows.length ? rows.join("") : "<li>暂无重点差异科目</li>";
}

function renderCategoryFilter() {
  const current = els.categoryFilter.value;
  els.categoryFilter.innerHTML = '<option value="all">全部</option>';
  for (const item of state.result.categories) {
    const option = document.createElement("option");
    option.value = item.category;
    option.textContent = item.category;
    els.categoryFilter.appendChild(option);
  }
  els.categoryFilter.value = [...els.categoryFilter.options].some((option) => option.value === current) ? current : "all";
}

function renderTable() {
  if (!state.result) return;
  const rows = visibleRows();
  els.rowCount.textContent = `${rows.length} 项`;
  els.detailBody.innerHTML =
    rows.map(rowToHtml).join("") || '<tr><td colspan="12" class="empty-cell">没有符合条件的科目</td></tr>';
  for (const textarea of els.detailBody.querySelectorAll("textarea")) {
    textarea.addEventListener("input", (event) => {
      state.analysisByCode[event.target.dataset.code] = event.target.value;
      saveAnalysis();
      renderNarrative();
    });
  }
}

function visibleRows() {
  const search = els.searchInput.value.trim().toLowerCase();
  const status = els.statusFilter.value;
  const category = els.categoryFilter.value;
  const sortBy = els.sortBy.value;
  const rows = state.result.rows.filter((row) => {
    if (category !== "all" && row.category !== category) return false;
    if (status === "high" && !row.isHighImpact) return false;
    if (!["all", "high"].includes(status) && row.status !== status) return false;
    if (!search) return true;
    return `${row.code} ${row.descEn} ${row.category}`.toLowerCase().includes(search);
  });
  rows.sort((a, b) => {
    if (sortBy === "code") return a.code.localeCompare(b.code, "zh-Hans-CN", { numeric: true });
    const key = sortBy === "unit" ? "unitDiff" : "amountDiff";
    return Math.abs(b[key] || 0) - Math.abs(a[key] || 0);
  });
  return rows;
}

function rowToHtml(row) {
  const analysis = state.analysisByCode[row.code] || "";
  return `
    <tr class="${row.isHighImpact ? "high" : ""}">
      <td><div class="account-code">${escapeHtml(row.code)}</div><div class="desc">${escapeHtml(row.descEn)}</div></td>
      <td>${escapeHtml(row.category)}</td>
      <td>${formatMoney(row.amount25)}</td>
      <td>${formatMoney(row.amountBudget)}</td>
      <td>${formatMoney(row.amount26)}</td>
      <td class="${valueClass(row.amountDiff)}">${formatMoney(row.amountDiff)}</td>
      <td class="${valueClass(row.manufacturingDiff)}">${formatMoney(row.manufacturingDiff)}</td>
      <td>${formatUnit(row.unit25)}</td>
      <td>${formatUnit(row.unitBudget)}</td>
      <td>${formatUnit(row.unit26)}</td>
      <td class="${valueClass(row.unitDiff)}">${formatUnit(row.unitDiff)}</td>
      <td><textarea data-code="${escapeHtml(row.code)}">${escapeHtml(analysis)}</textarea></td>
    </tr>
  `;
}

function renderChart() {
  const canvas = els.categoryChart;
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * ratio);
  canvas.height = Math.floor(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  els.emptyChart.style.display = "none";

  const categories = state.result.categories.slice(0, 8);
  const padding = { left: 126, right: 48, top: 18, bottom: 28 };
  const chartWidth = rect.width - padding.left - padding.right;
  const rowHeight = (rect.height - padding.top - padding.bottom) / Math.max(categories.length, 1);
  const maxValue = Math.max(1, ...categories.flatMap((item) => [Math.abs(item.amount25 || 0), Math.abs(item.amount26 || 0)]));
  state.chartHitZones = [];

  ctx.font = "12px Microsoft YaHei, Segoe UI, Arial";
  ctx.textBaseline = "middle";
  categories.forEach((item, index) => {
    const y = padding.top + index * rowHeight;
    const y25 = y + rowHeight * 0.32;
    const y26 = y + rowHeight * 0.66;
    const w25 = (Math.abs(item.amount25 || 0) / maxValue) * chartWidth;
    const w26 = (Math.abs(item.amount26 || 0) / maxValue) * chartWidth;
    ctx.fillStyle = "#263545";
    ctx.fillText(item.category, 12, y + rowHeight * 0.5);
    ctx.fillStyle = "#dbe5ec";
    ctx.fillRect(padding.left, y25 - 5, chartWidth, 8);
    ctx.fillRect(padding.left, y26 - 5, chartWidth, 8);
    ctx.fillStyle = "#2364aa";
    ctx.fillRect(padding.left, y25 - 5, w25, 8);
    ctx.fillStyle = "#2a8c73";
    ctx.fillRect(padding.left, y26 - 5, w26, 8);
    ctx.fillStyle = "#607080";
    ctx.fillText(`25 ${formatMoney(item.amount25)}`, padding.left + Math.min(w25 + 6, chartWidth - 84), y25);
    ctx.fillText(`26 ${formatMoney(item.amount26)}`, padding.left + Math.min(w26 + 6, chartWidth - 84), y26);
    state.chartHitZones.push({ category: item.category, y, height: rowHeight });
  });

  ctx.fillStyle = "#2364aa";
  ctx.fillRect(padding.left, rect.height - 18, 14, 8);
  ctx.fillStyle = "#607080";
  ctx.fillText("25同期", padding.left + 20, rect.height - 14);
  ctx.fillStyle = "#2a8c73";
  ctx.fillRect(padding.left + 82, rect.height - 18, 14, 8);
  ctx.fillStyle = "#607080";
  ctx.fillText("26实际", padding.left + 102, rect.height - 14);
}

function handleChartClick(event) {
  if (!state.result) return;
  const rect = els.categoryChart.getBoundingClientRect();
  const y = event.clientY - rect.top;
  const hit = state.chartHitZones.find((zone) => y >= zone.y && y <= zone.y + zone.height);
  if (!hit) return;
  els.categoryFilter.value = hit.category;
  renderTable();
}

function formatMoney(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatUnit(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function valueClass(value) {
  if (!value) return "";
  return value > 0 ? "positive" : "negative";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toast(message, isError = false) {
  els.toast.textContent = message;
  els.toast.style.background = isError ? "#b42318" : "#102033";
  els.toast.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 2600);
}

function loadAnalysis() {
  try {
    return JSON.parse(localStorage.getItem("dw-analysis-by-code") || "{}");
  } catch {
    return {};
  }
}

function saveAnalysis() {
  localStorage.setItem("dw-analysis-by-code", JSON.stringify(state.analysisByCode));
}
