import {
  BASELINE_25_BY_MONTH,
  BUDGET_26_BY_MONTH,
  CATEGORY_ORDER
} from "./baseline-data.js";
import { MONTHS, extractActualFromWorkbook } from "./parser.js";
import { buildReconciliation } from "./reconcile.js";
import { exportAnalysisWorkbook } from "./export.js";
import { loadXlsx } from "./xlsx-loader.js";
import { createStore } from "./store.js";
import { extractForecastWorkbook, buildAnnualDashboardRows, monthSnapshot } from "./forecast-parser.js";
import {
  analysisKey,
  buildAutoSummary,
  buildFactorSummary,
  parseEditableNumber
} from "./workbench.js";

const VERSION = "20260605-dashboard-v3";

const i18n = {
  zh: {
    appTitle: "洗碗机制造费三张表工作台",
    appSubtitle: "导入财务数据，输出全年驾驶舱、月度差异、项目因素",
    language: "语言",
    author: "填写人",
    importForecast: "导入4+8预测",
    importSap: "导入SAP实际",
    exportAnalysis: "导出三张表",
    tabDashboard: "全年驾驶舱",
    tabVariance: "月度差异",
    tabProjects: "项目因素",
    month: "月份",
    accountSearch: "科目搜索",
    analysisFilter: "差异筛选",
    category: "大科目",
    sort: "排序",
    unitCost26: "26单台制造费",
    actual26: "26实际",
    same25: "25同期",
    budget26: "26预算",
    actualVsSame: "实际-同期",
    unitDiff: "单台差异",
    manufacturingDiff: "制造费差额",
    factorNet: "因素净影响",
    dashboardTitle: "全年数据驾驶舱",
    dashboardHint: "上传 4+8 预测后，一屏查看 1-12 月产量、单台制造费、金额和关键大科目。",
    monthSummary: "月度总结与原因分析",
    summaryHint: "围绕单台制造费、制造费差额和重点科目自动汇总。",
    autoFromSite: "由网站填写内容自动汇总",
    heroUnit: "单台制造费",
    heroUnitDiff: "单台同比差",
    heroAmountDiff: "制造费差额",
    heroOpen: "待解释重点",
    categoryCompare: "大科目对比",
    redBadGreenGood: "红色为同比恶化，绿色为同比优化",
    accountDetail: "科目明细",
    account: "账户",
    analysis: "差异分析",
    factorProjects: "上涨因素 / 下降因素",
    factorHint: "用于沉淀项目原因，后续自动进入月度总结和导出三张表。",
    addIncrease: "添加上涨因素",
    addDecrease: "添加下降因素",
    saveProjects: "保存项目",
    increaseTotal: "上涨累计",
    decreaseTotal: "下降累计",
    netImpact: "净影响",
    type: "类型",
    path: "原因/路径",
    project: "关键项目",
    owner: "责任人",
    timing: "到位时间",
    impact: "影响 K€",
    progress: "进展",
    action: "操作",
    all: "全部",
    unitOver: "单台差≥0.5",
    blankReason: "待填写原因",
    sortUnit: "按单台差异",
    sortAmount: "按额差异",
    sortCode: "按账户编码",
    increase: "上涨因素",
    decrease: "下降因素",
    delete: "删",
    emptyForecast: "导入4+8预测文件后显示1-12月全年驾驶舱",
    emptySap: "导入SAP报表后显示科目明细",
    waitingForecast: "等待4+8预测文件",
    waitingSap: "待导入 SAP 实际",
    waitingForecastPill: "待导入 4+8 预测",
    placeholderMajor: "重点差异：填写原因、责任、行动和预计影响",
    placeholderSmall: "简要原因"
  },
  en: {
    appTitle: "Dishwasher MFG Cost Workbench",
    appSubtitle: "Import finance data and export the three-table analysis",
    language: "Language",
    author: "Author",
    importForecast: "Import 4+8 forecast",
    importSap: "Import SAP actuals",
    exportAnalysis: "Export workbook",
    tabDashboard: "Year dashboard",
    tabVariance: "Monthly variance",
    tabProjects: "Project factors",
    month: "Month",
    accountSearch: "Account search",
    analysisFilter: "Variance filter",
    category: "Category",
    sort: "Sort",
    unitCost26: "2026 unit cost",
    actual26: "2026 actual",
    same25: "2025 same period",
    budget26: "2026 budget",
    actualVsSame: "Actual vs same",
    unitDiff: "Unit variance",
    manufacturingDiff: "MFG variance",
    factorNet: "Net factor impact",
    dashboardTitle: "Year Dashboard",
    dashboardHint: "Upload the 4+8 forecast to view all 12 months in one screen.",
    monthSummary: "Monthly Summary & Root Causes",
    summaryHint: "Auto summary around unit cost, value variance, and key accounts.",
    autoFromSite: "Generated from website inputs",
    heroUnit: "Unit cost",
    heroUnitDiff: "Unit YoY",
    heroAmountDiff: "MFG variance",
    heroOpen: "Open items",
    categoryCompare: "Category Comparison",
    redBadGreenGood: "Red means worse, green means better",
    accountDetail: "Account Detail",
    account: "Account",
    analysis: "Analysis",
    factorProjects: "Increase / Decrease Factors",
    factorHint: "Keep project causes here, then roll them into summaries and export.",
    addIncrease: "Add increase",
    addDecrease: "Add decrease",
    saveProjects: "Save projects",
    increaseTotal: "Increase total",
    decreaseTotal: "Decrease total",
    netImpact: "Net impact",
    type: "Type",
    path: "Cause / path",
    project: "Project",
    owner: "Owner",
    timing: "Timing",
    impact: "Impact K€",
    progress: "Progress",
    action: "Action",
    all: "All",
    unitOver: "Unit gap ≥0.5",
    blankReason: "Missing reason",
    sortUnit: "By unit variance",
    sortAmount: "By amount variance",
    sortCode: "By account code",
    increase: "Increase",
    decrease: "Decrease",
    delete: "Del",
    emptyForecast: "Import a 4+8 forecast file to show the 12-month dashboard",
    emptySap: "Import SAP actuals to show account details",
    waitingForecast: "Waiting for 4+8 forecast",
    waitingSap: "SAP actuals not imported",
    waitingForecastPill: "4+8 forecast not imported",
    placeholderMajor: "Key variance: cause, owner, action, expected impact",
    placeholderSmall: "Short reason"
  },
  tr: {
    appTitle: "Bulaşık Makinesi Üretim Gideri",
    appSubtitle: "Finans verisini yükle, üç analiz tablosunu üret",
    language: "Dil",
    author: "Yazan",
    importForecast: "4+8 tahmin yükle",
    importSap: "SAP gerçekleşen yükle",
    exportAnalysis: "Çalışma kitabı indir",
    tabDashboard: "Yıllık pano",
    tabVariance: "Aylık fark",
    tabProjects: "Proje faktörleri",
    month: "Ay",
    accountSearch: "Hesap ara",
    analysisFilter: "Fark filtresi",
    category: "Kategori",
    sort: "Sırala",
    unitCost26: "2026 birim maliyet",
    actual26: "2026 gerçekleşen",
    same25: "2025 aynı dönem",
    budget26: "2026 bütçe",
    actualVsSame: "Gerçekleşen - dönem",
    unitDiff: "Birim fark",
    manufacturingDiff: "Üretim farkı",
    factorNet: "Net faktör etkisi",
    dashboardTitle: "Yıllık Veri Panosu",
    dashboardHint: "4+8 tahmini yükleyince 12 ay tek ekranda görünür.",
    monthSummary: "Aylık Özet ve Nedenler",
    summaryHint: "Birim maliyet, tutar farkı ve önemli hesaplardan otomatik özet.",
    autoFromSite: "Site girişlerinden üretildi",
    heroUnit: "Birim maliyet",
    heroUnitDiff: "Birim YoY",
    heroAmountDiff: "Üretim farkı",
    heroOpen: "Açık konu",
    categoryCompare: "Kategori Karşılaştırma",
    redBadGreenGood: "Kırmızı kötüleşme, yeşil iyileşme",
    accountDetail: "Hesap Detayı",
    account: "Hesap",
    analysis: "Analiz",
    factorProjects: "Artış / Azalış Faktörleri",
    factorHint: "Proje nedenlerini burada tut, özet ve çıktıya aktar.",
    addIncrease: "Artış ekle",
    addDecrease: "Azalış ekle",
    saveProjects: "Projeleri kaydet",
    increaseTotal: "Artış toplamı",
    decreaseTotal: "Azalış toplamı",
    netImpact: "Net etki",
    type: "Tip",
    path: "Neden / yol",
    project: "Proje",
    owner: "Sorumlu",
    timing: "Zaman",
    impact: "Etki K€",
    progress: "İlerleme",
    action: "İşlem",
    all: "Tümü",
    unitOver: "Birim fark ≥0.5",
    blankReason: "Neden eksik",
    sortUnit: "Birim farka göre",
    sortAmount: "Tutar farkına göre",
    sortCode: "Hesap koduna göre",
    increase: "Artış",
    decrease: "Azalış",
    delete: "Sil",
    emptyForecast: "12 aylık pano için 4+8 tahmin dosyasını yükleyin",
    emptySap: "Hesap detayları için SAP gerçekleşen dosyasını yükleyin",
    waitingForecast: "4+8 tahmin bekleniyor",
    waitingSap: "SAP gerçekleşen yüklenmedi",
    waitingForecastPill: "4+8 tahmin yüklenmedi",
    placeholderMajor: "Önemli fark: neden, sorumlu, aksiyon, beklenen etki",
    placeholderSmall: "Kısa neden"
  }
};

const store = createStore();
const state = {
  workbook: null,
  forecast: null,
  dashboardRows: [],
  resultByMonth: new Map(),
  result: null,
  analyses: {},
  factors: [],
  factorSummary: null,
  chartHitZones: [],
  language: "zh"
};

const els = {
  sapFile: document.getElementById("sapFile"),
  forecastFile: document.getElementById("forecastFile"),
  exportBtn: document.getElementById("exportBtn"),
  monthSelect: document.getElementById("monthSelect"),
  searchInput: document.getElementById("searchInput"),
  analysisFilter: document.getElementById("analysisFilter"),
  categoryFilter: document.getElementById("categoryFilter"),
  sortBy: document.getElementById("sortBy"),
  languageSelect: document.getElementById("languageSelect"),
  userName: document.getElementById("userName"),
  saveMode: document.getElementById("saveMode"),
  sapStatus: document.getElementById("sapStatus"),
  forecastStatus: document.getElementById("forecastStatus"),
  total26: document.getElementById("total26"),
  total25: document.getElementById("total25"),
  budget26: document.getElementById("budget26"),
  unitCost26: document.getElementById("unitCost26"),
  diffAmount: document.getElementById("diffAmount"),
  diffUnit: document.getElementById("diffUnit"),
  manufacturingDiff: document.getElementById("manufacturingDiff"),
  factorNet: document.getElementById("factorNet"),
  heroUnitCost: document.getElementById("heroUnitCost"),
  heroUnitDiff: document.getElementById("heroUnitDiff"),
  heroAmountDiff: document.getElementById("heroAmountDiff"),
  openItems: document.getElementById("openItems"),
  dashboardHead: document.getElementById("dashboardHead"),
  dashboardBody: document.getElementById("dashboardBody"),
  dashboardCards: document.getElementById("dashboardCards"),
  dashboardStatus: document.getElementById("dashboardStatus"),
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
    state.factors = normalizeFactorsForUi(await store.loadFactors([]));
  } catch (error) {
    toast(error.message || String(error), true);
  }
  applyLanguage(els.languageSelect.value);
  recalcFactors();
  renderAll();
}

function bindEvents() {
  els.sapFile.addEventListener("change", handleSapFileChange);
  els.forecastFile.addEventListener("change", handleForecastFileChange);
  els.monthSelect.addEventListener("change", () => {
    selectCurrentMonth();
    renderAll();
  });
  els.searchInput.addEventListener("input", renderTable);
  els.analysisFilter.addEventListener("change", renderTable);
  els.categoryFilter.addEventListener("change", renderTable);
  els.sortBy.addEventListener("change", renderTable);
  els.languageSelect.addEventListener("change", () => {
    applyLanguage(els.languageSelect.value);
    renderAll();
  });
  els.userName.addEventListener("input", () => store.setUser(els.userName.value.trim()));
  els.exportBtn.addEventListener("click", async () => {
    try {
      await exportAnalysisWorkbook({
        result: state.result,
        analyses: state.analyses,
        dashboardRows: state.dashboardRows,
        factors: state.factors,
        factorSummary: state.factorSummary,
        forecast: state.forecast,
        language: state.language
      });
    } catch (error) {
      toast(error.message || String(error), true);
    }
  });
  els.categoryChart.addEventListener("click", handleChartClick);
  els.addIncreaseBtn.addEventListener("click", () => addFactor("increase"));
  els.addDecreaseBtn.addEventListener("click", () => addFactor("decrease"));
  els.saveFactorsBtn.addEventListener("click", saveFactorsFromTable);
  els.factorBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-index]");
    if (!button) return;
    state.factors.splice(Number(button.dataset.deleteIndex), 1);
    renderFactors();
  });
  for (const tab of document.querySelectorAll(".tab")) {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  }
  window.addEventListener("resize", () => {
    if (state.result) renderChart();
  });
}

async function handleForecastFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    toast(`正在读取 ${file.name}`);
    const XLSX = await loadXlsx();
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
    state.forecast = extractForecastWorkbook(workbook, XLSX);
    state.dashboardRows = buildDashboardRows();
    els.forecastStatus.textContent = `已导入4+8：${file.name}`;
    els.forecastStatus.classList.remove("muted", "warning");
    els.exportBtn.disabled = false;
    renderAll();
    toast(`已读取4+8预测：${file.name}`);
  } catch (error) {
    toast(error.message || String(error), true);
  }
}

async function handleSapFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    toast(`正在读取 ${file.name}`);
    const XLSX = await loadXlsx();
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
    state.workbook = workbook;
    state.resultByMonth.clear();

    for (const item of MONTHS) {
      try {
        const actual26 = extractActualFromWorkbook(workbook, item.month, XLSX);
        const result = buildReconciliation({
          baseline25: BASELINE_25_BY_MONTH[item.month],
          budget26: BUDGET_26_BY_MONTH[item.month],
          actual26,
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
    state.dashboardRows = buildDashboardRows();
    els.exportBtn.disabled = false;
    els.sapStatus.textContent = `已导入SAP：${file.name}`;
    els.sapStatus.classList.remove("muted", "warning");
    renderAll();
    toast(`已读取SAP实际：${file.name}`);
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

function buildDashboardRows() {
  return buildAnnualDashboardRows(state.forecast, {
    baseline25ByMonth: BASELINE_25_BY_MONTH,
    budget26ByMonth: BUDGET_26_BY_MONTH,
    resultByMonth: state.resultByMonth
  });
}

function renderSummaryCards() {
  const summary = state.result?.summary || {};
  const forecast = monthSnapshot(state.forecast, Number(els.monthSelect.value));
  const unit26 = summary.totalUnit26 ?? forecast.unitCost;
  els.unitCost26.textContent = formatUnit(unit26);
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
  els.heroUnitCost.textContent = formatUnit(unit26);
  els.heroUnitDiff.textContent = formatUnit(summary.totalUnitDiff);
  els.heroUnitDiff.className = valueClass(summary.totalUnitDiff);
  els.heroAmountDiff.textContent = formatMoney(summary.manufacturingDiff);
  els.heroAmountDiff.className = valueClass(summary.manufacturingDiff);
  els.openItems.textContent = state.result ? String(countOpenHighRows()) : "--";
}

function renderDashboard() {
  els.dashboardHead.innerHTML = `<tr><th>分组</th><th>${escapeHtml(label("indicator", "指标"))}</th><th>口径</th><th>${escapeHtml(label("unit", "单位"))}</th>${state.forecast?.months?.map((month) => `<th>${month}</th>`).join("") || Array.from({ length: 12 }, (_, index) => `<th>${index + 1}月</th>`).join("")}</tr>`;
  if (!state.forecast || !state.dashboardRows.length) {
    els.dashboardStatus.textContent = t("waitingForecast");
    els.dashboardCards.innerHTML = "";
    els.dashboardBody.innerHTML = `<tr><td colspan="16" class="empty-cell">${t("emptyForecast")}</td></tr>`;
    return;
  }
  els.dashboardStatus.textContent = "全年模型已加载";
  const rowBy = (label, scenario) => state.dashboardRows.find((row) => row.label === label && row.scenario === scenario);
  const volumeTotal = valueAtYear(rowBy("产量", "26年"));
  const amountTotal = valueAtYear(rowBy("制造费用金额", "26年"));
  const budgetAmountTotal = valueAtYear(rowBy("制造费用金额", "预算"));
  const averageUnit = valueAtYear(rowBy("单台制造费累计", "26年"));
  const sameUnitGap = valueAtYear(rowBy("单台制造费累计", "26年")) - valueAtYear(rowBy("单台制造费累计", "同期"));
  const budgetGapTotal = valueAtYear(rowBy("累计预算制造费差额", "累计差额"));
  const mfgDiffTotal = valueAtYear(rowBy("累计制造费差额", "累计差额"));
  const productivity = valueAtYear(rowBy("累计人均产量", "26年"));
  els.dashboardCards.innerHTML = [
    dashboardCard("全年产量", formatNumber(volumeTotal), "台"),
    dashboardCard("全年制造费", formatMoney(amountTotal), "K€"),
    dashboardCard("全年预算", formatMoney(budgetAmountTotal), "K€"),
    dashboardCard("累计单台", formatUnit(averageUnit), "€/台"),
    dashboardCard("单台同比差", formatUnit(sameUnitGap), "€/台", valueClass(sameUnitGap)),
    dashboardCard("累计制造费差额", formatMoney(mfgDiffTotal), "K€", valueClass(mfgDiffTotal)),
    dashboardCard("累计预算差额", formatMoney(budgetGapTotal), "K€", valueClass(budgetGapTotal)),
    dashboardCard("累计人均产量", formatUnit(productivity), "台/人")
  ].join("");
  els.dashboardBody.innerHTML = state.dashboardRows.map((row) => `
    <tr class="dashboard-row group-${escapeHtml(row.group)}">
      <td><span class="group-chip">${escapeHtml(row.group)}</span></td>
      <td>${escapeHtml(row.label)}</td>
      <td><span class="scenario-chip ${scenarioClass(row.scenario)}">${escapeHtml(row.scenario)}</span></td>
      <td>${escapeHtml(row.unit)}</td>
      ${row.values.map((value, index) => `<td class="month-cell ${heatClass(row, index)}">${formatDashboardValue(value, row.unit)}</td>`).join("")}
    </tr>
  `).join("");
}

function dashboardCard(title, value, unit, className = "") {
  return `<div class="dashboard-card"><span>${escapeHtml(title)}</span><strong class="${className}">${value}</strong><small>${escapeHtml(unit)}</small></div>`;
}

function valueAtYear(row) {
  if (!row) return null;
  if (["€/台", "台/人"].includes(row.unit)) {
    const last = [...row.values].reverse().find((value) => Number.isFinite(value));
    return last ?? null;
  }
  return sum(row.values);
}

function scenarioClass(scenario) {
  if (scenario === "26年") return "actual";
  if (scenario === "预算" || scenario === "目标") return "budget";
  if (scenario === "同期") return "same";
  return "diff";
}

function heatClass(row, index) {
  if (!["26年", "差额", "累计差额"].includes(row.scenario)) return "heat-neutral";
  const value = row.diffs?.[index];
  if (value === null || value === undefined || Math.abs(value) < 0.0001) return "heat-neutral";
  const good = row.direction === "higher" ? value > 0 : value < 0;
  return good ? "heat-good" : "heat-bad";
}

function renderCategoryFilter() {
  const current = els.categoryFilter.value;
  els.categoryFilter.innerHTML = `<option value="all">${t("all")}</option>`;
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
  const forecast = monthSnapshot(state.forecast, Number(els.monthSelect.value));
  els.summaryText.textContent = buildCompactSummary(state.result, state.analyses, state.factorSummary, forecast);
  if (els.analysisList) els.analysisList.innerHTML = "";
}

function buildCompactSummary(result, analyses, factorSummary, forecast) {
  if (!result) return "导入 SAP 报表后，本月摘要会根据下方科目原因自动汇总。";
  const highRows = result.rows.filter((row) => row.isHighImpact || Math.abs(row.unitDiff || 0) >= 0.5);
  const filled = highRows.filter((row) => (analyses[analysisKey(result.month, row.code)] || "").trim()).length;
  const direction = (result.summary.totalUnitDiff || 0) <= 0 ? "优化" : "恶化";
  const forecastText = forecast?.unitCost ? `；4+8本月单台 ${formatUnit(forecast.unitCost)} €/台` : "";
  return `${result.month}月单台同比${direction} ${formatUnit(Math.abs(result.summary.totalUnitDiff || 0))} €/台，制造费差额 ${formatMoney(result.summary.manufacturingDiff)} K€；重点原因 ${filled}/${highRows.length} 已填写；上涨因素 ${formatMoney(factorSummary?.increaseCumulative)} K€，下降因素 ${formatMoney(factorSummary?.decreaseCumulative)} K€${forecastText}`;
}

function renderTable() {
  if (!state.result) {
    els.rowCount.textContent = "0 项";
    els.detailBody.innerHTML = `<tr><td colspan="11" class="empty-cell">${t("emptySap")}</td></tr>`;
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
      <td><textarea class="${major ? "major" : ""}" data-key="${escapeHtml(key)}" data-month="${state.result.month}" data-code="${escapeHtml(row.code)}" placeholder="${major ? t("placeholderMajor") : t("placeholderSmall")}">${escapeHtml(analysis)}</textarea></td>
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
    .slice(0, 12);
  const padding = { left: 170, right: 58, top: 18, bottom: 28 };
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
    ctx.fillStyle = "#245b93";
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
  els.factorBody.innerHTML = state.factors.length
    ? state.factors.map((item, index) => factorRowHtml(item, index)).join("")
    : `<tr><td colspan="9" class="empty-cell">添加上涨因素或下降因素后，这里会形成项目原因库。</td></tr>`;
}

function factorRowHtml(item, index) {
  return `
    <tr data-index="${index}">
      <td>
        <select data-field="type">
          <option value="increase" ${item.type === "increase" ? "selected" : ""}>${t("increase")}</option>
          <option value="decrease" ${item.type !== "increase" ? "selected" : ""}>${t("decrease")}</option>
        </select>
      </td>
      <td><input data-field="category" value="${escapeHtml(item.category || "")}" /></td>
      <td><textarea data-field="strategy">${escapeHtml(item.strategy || "")}</textarea></td>
      <td><textarea data-field="project">${escapeHtml(item.project || "")}</textarea></td>
      <td><input data-field="owner" value="${escapeHtml(item.owner || "")}" /></td>
      <td><input data-field="timing" value="${escapeHtml(item.timing || "")}" /></td>
      <td><input data-field="actualCumulative" value="${formatEditable(item.actualCumulative)}" /></td>
      <td><textarea data-field="progress">${escapeHtml(item.progress || "")}</textarea></td>
      <td><button class="delete-btn" type="button" data-delete-index="${index}" title="${t("delete")}">×</button></td>
    </tr>
  `;
}

async function saveFactorsFromTable() {
  const rows = [...els.factorBody.querySelectorAll("tr[data-index]")];
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
      actualCumulative: parseEditableNumber(get("actualCumulative")),
      progress: get("progress")
    };
  });
  await store.saveFactors(state.factors);
  renderFactors();
  renderNarrative();
  renderSummaryCards();
  els.exportBtn.disabled = false;
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
    actualCumulative: 0,
    progress: "",
    budgetMonths: Array(12).fill(0),
    actualMonths: Array(12).fill(0)
  });
  els.exportBtn.disabled = false;
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
  state.language = language;
  document.documentElement.lang = language === "zh" ? "zh-CN" : language;
  for (const node of document.querySelectorAll("[data-i18n]")) {
    const key = node.dataset.i18n;
    node.textContent = t(key);
  }
  for (const node of document.querySelectorAll("[data-i18n-option]")) {
    const key = node.dataset.i18nOption;
    node.textContent = t(key);
  }
  els.sapStatus.textContent = state.resultByMonth.size ? els.sapStatus.textContent : t("waitingSap");
  els.forecastStatus.textContent = state.forecast ? els.forecastStatus.textContent : t("waitingForecastPill");
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
    type: item.type === "increase" ? "increase" : "decrease",
    actualCumulative: normalizeImpact(item.actualCumulative),
    budgetMonths: (item.budgetMonths || []).map(normalizeImpact),
    actualMonths: (item.actualMonths || []).map(normalizeImpact)
  }));
}

function normalizeImpact(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  return Math.abs(number) > 1000 ? Math.abs(number / 1000) : Math.abs(number);
}

function formatMoney(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return Number(value).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatUnit(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return Number(value).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 0 });
}

function formatDashboardValue(value, unit) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  const digits = unit === "台" || unit === "人" ? 0 : 2;
  return Number(value).toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function formatEditable(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return Number(value).toFixed(1);
}

function valueClass(value) {
  if (!value) return "";
  return value > 0 ? "negative" : "positive";
}

function sum(values) {
  return (values || []).reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

function label(key, fallback) {
  return t(key) === key ? fallback : t(key);
}

function t(key) {
  return i18n[state.language]?.[key] || i18n.zh[key] || key;
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
