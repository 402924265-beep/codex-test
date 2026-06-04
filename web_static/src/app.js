import {
  BASELINE_25_BY_MONTH,
  BUDGET_26_BY_MONTH,
  CATEGORY_ORDER,
  FORECAST_4PLUS8_BY_MONTH
} from "./baseline-data.js";
import { DASHBOARD_SOURCE, FACTOR_PROJECTS_26 } from "./report-data.js";
import { MONTHS, extractActualFromWorkbook } from "./parser.js";
import { buildReconciliation } from "./reconcile.js";
import { exportAnalysisWorkbook } from "./export.js";
import { loadXlsx } from "./xlsx-loader.js";
import { createStore } from "./store.js";
import {
  analysisKey,
  buildAutoSummary,
  buildDashboardRows,
  buildFactorSummary,
  parseEditableNumber
} from "./workbench.js";

const VERSION = "20260604-three-table-v1";

const i18n = {
  zh: {
    appTitle: "洗碗机制造费三表工作台",
    appSubtitle: "全年驾驶舱 · 月度差异 · 项目因素",
    language: "语言",
    author: "填写人",
    importSap: "导入SAP报表",
    exportAnalysis: "导出分析表",
    tabDashboard: "全年驾驶舱",
    tabVariance: "月度差异",
    tabProjects: "项目因素"
  },
  en: {
    appTitle: "Dishwasher MFG Cost Workbench",
    appSubtitle: "Year dashboard · Monthly variance · Project factors",
    language: "Language",
    author: "Author",
    importSap: "Import SAP report",
    exportAnalysis: "Export analysis",
    tabDashboard: "Year dashboard",
    tabVariance: "Monthly variance",
    tabProjects: "Projects"
  },
  tr: {
    appTitle: "Bulaşık Makinesi Üretim Gideri",
    appSubtitle: "Yıllık pano · Aylık fark · Proje etkileri",
    language: "Dil",
    author: "Yazan",
    importSap: "SAP raporu yükle",
    exportAnalysis: "Analizi dışa aktar",
    tabDashboard: "Yıllık pano",
    tabVariance: "Aylık fark",
    tabProjects: "Projeler"
  }
};

const store = createStore();
const state = {
  workbook: null,
  resultByMonth: new Map(),
  result: null,
  analyses: {},
  factors: normalizeFactorsForUi(FACTOR_PROJECTS_26),
  factorSummary: null,
  chartHitZones: []
};

const els = {
  sapFile: document.getElementById("sapFile"),
  exportBtn: document.getElementById("exportBtn"),
  monthSelect: document.getElementById("monthSelect"),
  searchInput: document.getElementById("searchInput"),
  analysisFilter: document.getElementById("analysisFilter"),
  categoryFilter: document.getElementById("categoryFilter"),
  sortBy: document.getElementById("sortBy"),
  languageSelect: document.getElementById("languageSelect"),
  userName: document.getElementById("userName"),
  saveMode: document.getElementById("saveMode"),
  fileStatus: document.getElementById("fileStatus"),
  total26: document.getElementById("total26"),
  total25: document.getElementById("total25"),
  budget26: document.getElementById("budget26"),
  diffAmount: document.getElementById("diffAmount"),
  diffUnit: document.getElementById("diffUnit"),
  manufacturingDiff: document.getElementById("manufacturingDiff"),
  factorNet: document.getElementById("factorNet"),
  openItems: document.getElementById("openItems"),
  dashboardBody: document.getElementById("dashboardBody"),
  dashboardMonthLabel: document.getElementById("dashboardMonthLabel"),
  summaryText: document.getElementById("summaryText"),
  analysisList: document.getElementById("analysisList"),
  categoryChart: document.getElementById("categoryChart"),
  emptyChart: document.getElementById("emptyChart"),
  detailBody: document.getElementById("detailBody"),
  rowCount: document.getElementById("rowCount"),
  factorBody: document.getElementById("factorBody"),
  increaseTotal: document.getElementById("increaseTotal"),
  decreaseTotal: document.getElementById("decreaseTotal"),
  factorNetDetail: document.getElementById("factorNetDetail"),
  addIncreaseBtn: document.getElementById("addIncreaseBtn"),
  addDecreaseBtn: document.getElementById("addDecreaseBtn"),
  saveFactorsBtn: document.getElementById("saveFactorsBtn"),
  toast: document.getElementById("toast")
};

bootstrap();

async function bootstrap() {
  bindEvents();
  els.saveMode.textContent = store.label;
  els.userName.value = store.getUser();
  try {
    state.analyses = await store.loadAnalyses();
    state.factors = normalizeFactorsForUi(await store.loadFactors(state.factors));
  } catch (error) {
    toast(error.message || String(error), true);
  }
  recalcFactors();
  renderAll();
}

function bindEvents() {
  els.sapFile.addEventListener("change", handleFileChange);
  els.monthSelect.addEventListener("change", () => {
    selectCurrentMonth();
    renderAll();
  });
  els.searchInput.addEventListener("input", renderTable);
  els.analysisFilter.addEventListener("change", renderTable);
  els.categoryFilter.addEventListener("change", renderTable);
  els.sortBy.addEventListener("change", renderTable);
  els.languageSelect.addEventListener("change", () => applyLanguage(els.languageSelect.value));
  els.userName.addEventListener("input", () => store.setUser(els.userName.value.trim()));
  els.exportBtn.addEventListener("click", async () => {
    try {
      await exportAnalysisWorkbook(state.result, state.analyses);
    } catch (error) {
      toast(error.message || String(error), true);
    }
  });
  els.categoryChart.addEventListener("click", handleChartClick);
  els.addIncreaseBtn.addEventListener("click", () => addFactor("increase"));
  els.addDecreaseBtn.addEventListener("click", () => addFactor("decrease"));
  els.saveFactorsBtn.addEventListener("click", saveFactorsFromTable);
  for (const tab of document.querySelectorAll(".tab")) {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  }
  window.addEventListener("resize", () => {
    if (state.result) renderChart();
  });
}

async function handleFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    toast(`正在读取 ${file.name}`);
    const XLSX = await loadXlsx();
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
    state.workbook = workbook;
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
          categoryOrder: CATEGORY_ORDER
        });
        state.resultByMonth.set(item.month, result);
      } catch (error) {
        console.warn(error);
      }
    }

    if (!state.resultByMonth.size) throw new Error("没有解析到可用SAP实际数");
    if (!state.resultByMonth.has(Number(els.monthSelect.value))) {
      els.monthSelect.value = String([...state.resultByMonth.keys()][0]);
    }
    selectCurrentMonth();
    els.exportBtn.disabled = false;
    els.fileStatus.textContent = `已导入 ${file.name}`;
    renderAll();
    toast(`已读取 ${file.name}`);
  } catch (error) {
    toast(error.message || String(error), true);
  }
}

function selectCurrentMonth() {
  const month = Number(els.monthSelect.value);
  state.result = state.resultByMonth.get(month) || null;
  recalcFactors();
}

function renderAll() {
  renderSummaryCards();
  renderDashboard();
  renderCategoryFilter();
  renderNarrative();
  renderChart();
  renderTable();
  renderFactors();
}

function renderSummaryCards() {
  const summary = state.result?.summary || {};
  els.total26.textContent = formatMoney(summary.totalAmount26);
  els.total25.textContent = formatMoney(summary.totalAmount25);
  els.budget26.textContent = formatMoney(summary.totalAmountBudget);
  els.diffAmount.textContent = formatMoney(summary.totalAmountDiff);
  els.diffAmount.className = valueClass(summary.totalAmountDiff);
  els.diffUnit.textContent = formatUnit(summary.totalUnitDiff);
  els.diffUnit.className = valueClass(summary.totalUnitDiff);
  els.manufacturingDiff.textContent = formatMoney(summary.manufacturingDiff);
  els.manufacturingDiff.className = valueClass(summary.manufacturingDiff);
  els.factorNet.textContent = formatMoney(state.factorSummary?.netCumulative);
  els.factorNet.className = valueClass(state.factorSummary?.netCumulative);
  els.openItems.textContent = state.result ? String(countOpenHighRows()) : "--";
}

function renderDashboard() {
  const monthIndex = Number(els.monthSelect.value) - 1;
  els.dashboardMonthLabel.textContent = `${monthIndex + 1}月实际`;
  const rows = buildDashboardRows(DASHBOARD_SOURCE, monthIndex);
  els.dashboardBody.innerHTML = rows.map((row) => `
    <tr class="${row.status}">
      <td>${escapeHtml(cleanMetric(row.metric))}</td>
      <td>${formatDashboard(row.same)}</td>
      <td>${formatDashboard(row.budget)}</td>
      <td>${formatDashboard(row.actual)}</td>
      <td><span class="signal ${row.status}">${signalIcon(row.status)} ${formatDashboard(row.diff)}</span></td>
      <td>${formatPercent(row.rate)}</td>
    </tr>
  `).join("");
}

function renderCategoryFilter() {
  const current = els.categoryFilter.value;
  els.categoryFilter.innerHTML = '<option value="all">全部</option>';
  const categories = state.result?.categories?.length ? state.result.categories : CATEGORY_ORDER.map((category) => ({ category }));
  for (const item of categories) {
    const option = document.createElement("option");
    option.value = item.category;
    option.textContent = item.category;
    els.categoryFilter.appendChild(option);
  }
  els.categoryFilter.value = [...els.categoryFilter.options].some((option) => option.value === current) ? current : "all";
}

function renderNarrative() {
  els.summaryText.textContent = buildAutoSummary(state.result, state.analyses, state.factorSummary);
  const rows = state.result?.rows?.filter((row) => row.isHighImpact).slice(0, 8) || [];
  els.analysisList.innerHTML = rows.length
    ? rows.map((row) => {
        const key = analysisKey(state.result.month, row.code);
        const text = state.analyses[key] || "待填写原因";
        return `<li><strong>${escapeHtml(row.code)}</strong> ${escapeHtml(row.descEn)}：${escapeHtml(text)}</li>`;
      }).join("")
    : "<li>导入SAP报表后显示重点差异科目。</li>";
}

function renderTable() {
  if (!state.result) {
    els.rowCount.textContent = "0 项";
    els.detailBody.innerHTML = '<tr><td colspan="11" class="empty-cell">导入SAP报表后显示科目明细</td></tr>';
    return;
  }
  const rows = visibleRows();
  els.rowCount.textContent = `${rows.length} 项`;
  els.detailBody.innerHTML =
    rows.map(rowToHtml).join("") || '<tr><td colspan="11" class="empty-cell">没有符合条件的科目</td></tr>';
  for (const textarea of els.detailBody.querySelectorAll("textarea")) {
    textarea.addEventListener("change", async (event) => {
      const key = event.target.dataset.key;
      state.analyses[key] = event.target.value;
      await store.saveAnalysis({
        key,
        month: Number(event.target.dataset.month),
        code: event.target.dataset.code,
        text: event.target.value,
        author: els.userName.value.trim()
      });
      renderNarrative();
      renderSummaryCards();
      toast(`${store.label}：原因已保存`);
    });
    textarea.addEventListener("input", (event) => {
      state.analyses[event.target.dataset.key] = event.target.value;
      renderNarrative();
    });
  }
}

function visibleRows() {
  const search = els.searchInput.value.trim().toLowerCase();
  const filter = els.analysisFilter.value;
  const category = els.categoryFilter.value;
  const sortBy = els.sortBy.value;
  const rows = state.result.rows.filter((row) => {
    const key = analysisKey(state.result.month, row.code);
    const analysis = state.analyses[key] || "";
    if (category !== "all" && row.category !== category) return false;
    if (filter === "high" && Math.abs(row.unitDiff || 0) < 0.5) return false;
    if (filter === "blank" && (Math.abs(row.unitDiff || 0) < 0.5 || analysis.trim())) return false;
    if (!search) return true;
    return `${row.code} ${row.descEn} ${row.category} ${analysis}`.toLowerCase().includes(search);
  });
  rows.sort((a, b) => {
    if (sortBy === "code") return a.code.localeCompare(b.code, "zh-Hans-CN", { numeric: true });
    const key = sortBy === "unit" ? "unitDiff" : "amountDiff";
    return Math.abs(b[key] || 0) - Math.abs(a[key] || 0);
  });
  return rows;
}

function rowToHtml(row) {
  const key = analysisKey(state.result.month, row.code);
  const analysis = state.analyses[key] || "";
  const major = Math.abs(row.unitDiff || 0) >= 0.5;
  return `
    <tr class="${major ? "high" : ""}">
      <td><div class="account-code">${escapeHtml(row.code)}</div><div class="desc">${escapeHtml(row.descEn)}</div></td>
      <td>${escapeHtml(row.category)}</td>
      <td>${formatMoney(row.amount25)}</td>
      <td>${formatMoney(row.amountBudget)}</td>
      <td>${formatMoney(row.amount26)}</td>
      <td class="${valueClass(row.amountDiff)}">${formatMoney(row.amountDiff)}</td>
      <td class="${valueClass(row.manufacturingDiff)}">${formatMoney(row.manufacturingDiff)}</td>
      <td>${formatUnit(row.unit25)}</td>
      <td>${formatUnit(row.unit26)}</td>
      <td class="${valueClass(row.unitDiff)}">${formatUnit(row.unitDiff)}</td>
      <td><textarea class="${major ? "major" : ""}" data-key="${escapeHtml(key)}" data-month="${state.result.month}" data-code="${escapeHtml(row.code)}" placeholder="${major ? "重点差异，请填写原因、责任和行动" : "简要原因"}">${escapeHtml(analysis)}</textarea></td>
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
  state.chartHitZones = [];
  if (!state.result) {
    els.emptyChart.style.display = "grid";
    return;
  }
  els.emptyChart.style.display = "none";
  const categories = state.result.categories
    .slice()
    .sort((a, b) => Math.abs(b.unitDiff || 0) - Math.abs(a.unitDiff || 0))
    .slice(0, 10);
  const padding = { left: 150, right: 56, top: 18, bottom: 30 };
  const chartWidth = rect.width - padding.left - padding.right;
  const rowHeight = (rect.height - padding.top - padding.bottom) / Math.max(categories.length, 1);
  const maxValue = Math.max(1, ...categories.flatMap((item) => [Math.abs(item.amount25 || 0), Math.abs(item.amount26 || 0)]));
  ctx.font = "12px Microsoft YaHei, Segoe UI, Arial";
  ctx.textBaseline = "middle";
  categories.forEach((item, index) => {
    const y = padding.top + index * rowHeight;
    const y25 = y + rowHeight * 0.35;
    const y26 = y + rowHeight * 0.67;
    const w25 = (Math.abs(item.amount25 || 0) / maxValue) * chartWidth;
    const w26 = (Math.abs(item.amount26 || 0) / maxValue) * chartWidth;
    ctx.fillStyle = "#263545";
    ctx.fillText(item.category, 12, y + rowHeight * 0.5);
    ctx.fillStyle = "#dbe5ec";
    ctx.fillRect(padding.left, y25 - 5, chartWidth, 8);
    ctx.fillRect(padding.left, y26 - 5, chartWidth, 8);
    ctx.fillStyle = "#225c9d";
    ctx.fillRect(padding.left, y25 - 5, w25, 8);
    ctx.fillStyle = item.amountDiff > 0 ? "#b42318" : "#08775d";
    ctx.fillRect(padding.left, y26 - 5, w26, 8);
    ctx.fillStyle = "#607080";
    ctx.fillText(`25 ${formatMoney(item.amount25)}`, padding.left + Math.min(w25 + 6, chartWidth - 86), y25);
    ctx.fillText(`26 ${formatMoney(item.amount26)}`, padding.left + Math.min(w26 + 6, chartWidth - 86), y26);
    state.chartHitZones.push({ category: item.category, y, height: rowHeight });
  });
}

function handleChartClick(event) {
  if (!state.result) return;
  const rect = els.categoryChart.getBoundingClientRect();
  const y = event.clientY - rect.top;
  const hit = state.chartHitZones.find((zone) => y >= zone.y && y <= zone.y + zone.height);
  if (!hit) return;
  els.categoryFilter.value = hit.category;
  switchTab("variance");
  renderTable();
}

function renderFactors() {
  recalcFactors();
  els.increaseTotal.textContent = formatMoney(state.factorSummary.increaseCumulative);
  els.decreaseTotal.textContent = formatMoney(state.factorSummary.decreaseCumulative);
  els.factorNetDetail.textContent = formatMoney(state.factorSummary.netCumulative);
  els.factorBody.innerHTML = state.factors.map((item, index) => factorRowHtml(item, index)).join("");
}

function factorRowHtml(item, index) {
  return `
    <tr data-index="${index}">
      <td>
        <select data-field="type">
          <option value="increase" ${item.type === "increase" ? "selected" : ""}>上涨因素</option>
          <option value="decrease" ${item.type !== "increase" ? "selected" : ""}>下降因素</option>
        </select>
      </td>
      <td><input data-field="category" value="${escapeHtml(item.category || "")}" /></td>
      <td><textarea data-field="strategy">${escapeHtml(item.strategy || "")}</textarea></td>
      <td><textarea data-field="project">${escapeHtml(item.project || "")}</textarea></td>
      <td><input data-field="owner" value="${escapeHtml(item.owner || "")}" /></td>
      <td><input data-field="timing" value="${escapeHtml(item.timing || "")}" /></td>
      <td><input data-field="expectedImpact" value="${formatEditable(item.expectedImpact)}" /></td>
      <td><input data-field="actualCumulative" value="${formatEditable(item.actualCumulative)}" /></td>
      <td><textarea data-field="progress">${escapeHtml(item.progress || "")}</textarea></td>
    </tr>
  `;
}

async function saveFactorsFromTable() {
  const rows = [...els.factorBody.querySelectorAll("tr")];
  state.factors = rows.map((row, index) => {
    const existing = state.factors[Number(row.dataset.index)] || {};
    const get = (field) => row.querySelector(`[data-field="${field}"]`)?.value || "";
    return {
      ...existing,
      id: existing.id || String(index + 1),
      type: get("type"),
      category: get("category"),
      strategy: get("strategy"),
      project: get("project"),
      owner: get("owner"),
      timing: get("timing"),
      expectedImpact: parseEditableNumber(get("expectedImpact")),
      actualCumulative: parseEditableNumber(get("actualCumulative")),
      progress: get("progress")
    };
  });
  await store.saveFactors(state.factors);
  renderFactors();
  renderNarrative();
  renderSummaryCards();
  toast(`${store.label}：项目已保存`);
}

function addFactor(type) {
  state.factors.unshift({
    id: `new-${Date.now()}`,
    type,
    category: type === "increase" ? "上涨因素" : "下降因素",
    strategy: "",
    project: "",
    owner: els.userName.value.trim(),
    timing: "",
    expectedImpact: 0,
    actualCumulative: 0,
    progress: "",
    budgetMonths: Array(12).fill(0),
    actualMonths: Array(12).fill(0)
  });
  renderFactors();
}

function recalcFactors() {
  state.factorSummary = buildFactorSummary(state.factors, Number(els.monthSelect.value));
}

function switchTab(name) {
  for (const tab of document.querySelectorAll(".tab")) tab.classList.toggle("active", tab.dataset.tab === name);
  document.getElementById("dashboardView").classList.toggle("active", name === "dashboard");
  document.getElementById("varianceView").classList.toggle("active", name === "variance");
  document.getElementById("projectsView").classList.toggle("active", name === "projects");
}

function applyLanguage(language) {
  const labels = i18n[language] || i18n.zh;
  document.documentElement.lang = language === "zh" ? "zh-CN" : language;
  for (const node of document.querySelectorAll("[data-i18n]")) {
    const key = node.dataset.i18n;
    if (labels[key]) node.textContent = labels[key];
  }
}

function countOpenHighRows() {
  return state.result.rows.filter((row) => {
    const key = analysisKey(state.result.month, row.code);
    return Math.abs(row.unitDiff || 0) >= 0.5 && !(state.analyses[key] || "").trim();
  }).length;
}

function normalizeFactorsForUi(items) {
  return (items || []).map((item) => ({
    ...item,
    expectedImpact: normalizeImpact(item.expectedImpact),
    actualCumulative: normalizeImpact(item.actualCumulative),
    budgetMonths: (item.budgetMonths || []).map(normalizeImpact),
    actualMonths: (item.actualMonths || []).map(normalizeImpact)
  }));
}

function normalizeImpact(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  return Math.abs(number) > 1000 ? number / 1000 : number;
}

function cleanMetric(metric) {
  return String(metric || "").replace(/^洗碗机/, "");
}

function formatMoney(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return Number(value).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatUnit(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return Number(value).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDashboard(value) {
  if (value === null || value === undefined || value === "") return "--";
  if (typeof value === "number") return value.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  return escapeHtml(value);
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${(value * 100).toFixed(1)}%`;
}

function formatEditable(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return Number(value).toFixed(1);
}

function valueClass(value) {
  if (!value) return "";
  return value > 0 ? "negative" : "positive";
}

function signalIcon(status) {
  return status === "bad" ? "▲" : status === "good" ? "▼" : "•";
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

console.info(`DW workbench ${VERSION}`);
