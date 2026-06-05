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
import {
  extractForecastWorkbook,
  buildAnnualDashboardRows,
  monthSnapshot,
  localizeCategory,
  localizeDashboardRow,
  localizeDashboardText,
  localizeMonthLabel
} from "./forecast-parser.js";
import {
  analysisKey,
  buildAutoSummary,
  buildFactorSummary,
  parseEditableNumber
} from "./workbench.js";

const VERSION = "20260605-dashboard-v4";

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
    placeholderSmall: "简要原因",
    dashboardGroup: "指标组",
    dashboardBasis: "对比基准",
    groupUnit: "单",
    groupTime: "时",
    groupPeople: "人",
    groupEfficiency: "效",
    groupCost: "费",
    trendTitle: "趋势轨道",
    trendHint: "实线为已发生，虚线为预测段",
    waterfallTitle: "全年差异瀑布",
    waterfallHint: "红色恶化，绿色优化",
    heatmapTitle: "月度异常热力",
    heatmapHint: "颜色越深差异越大",
    detailTitle: "指标明细",
    showDetail: "展开明细",
    hideDetail: "收起明细",
    loadedYearModel: "全年模型已加载",
    readingFile: "正在读取",
    importedForecast: "已导入4+8",
    importedSap: "已导入SAP",
    loadedForecast: "已读取4+8预测",
    loadedSap: "已读取SAP实际",
    noTimeData: "工时/工作日数据待接入",
    actualLine: "26年",
    budgetLine: "预算",
    sameLine: "同期",
    actualMonths: "已发生",
    forecastMonths: "预测",
    annualValue: "全年值",
    varianceValue: "差异",
    indicator: "指标",
    unit: "单位",
    scenario: "口径",
    group: "分组",
    searchPlaceholder: "账户编码 / 英文描述 / 原因",
    namePlaceholder: "姓名",
    rowCountSuffix: "项"
    ,summaryEmpty: "导入 SAP 报表后，本月摘要会根据下方科目原因自动汇总。",
    better: "优化",
    worse: "恶化",
    forecastUnitLine: "；4+8本月单台 {unit} €/台",
    compactSummary: "{month}单台同比{direction} {unitDiff} €/台，制造费差额 {mfgDiff} K€；重点原因 {filled}/{total} 已填写；上涨因素 {increase} K€，下降因素 {decrease} K€{forecast}",
    noMatchingAccounts: "没有符合条件的科目",
    analysisSaved: "原因已保存",
    projectsSaved: "项目已保存",
    emptyFactors: "添加上涨因素或下降因素后，这里会形成项目原因库。",
    localStore: "本机保存"
    ,mfgDiffFormula: "单台差 × 26产量",
    keurYtd: "K€累计",
    unit25: "25单台",
    unit26: "26单台"
    ,unitEuroPc: "€/台",
    emptyCategoryChart: "导入SAP报表后显示大科目对比"
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
    placeholderSmall: "Short reason",
    dashboardGroup: "Metric group",
    dashboardBasis: "Comparison basis",
    groupUnit: "Unit",
    groupTime: "Time",
    groupPeople: "People",
    groupEfficiency: "Efficiency",
    groupCost: "Cost",
    trendTitle: "Trend Track",
    trendHint: "Solid line is actual period; dashed line is forecast period",
    waterfallTitle: "Full-Year Variance Waterfall",
    waterfallHint: "Red is worse, green is better",
    heatmapTitle: "Monthly Exception Heatmap",
    heatmapHint: "Darker color means larger variance",
    detailTitle: "Metric Detail",
    showDetail: "Show detail",
    hideDetail: "Hide detail",
    loadedYearModel: "Year model loaded",
    readingFile: "Reading",
    importedForecast: "Imported 4+8",
    importedSap: "Imported SAP",
    loadedForecast: "Loaded 4+8 forecast",
    loadedSap: "Loaded SAP actuals",
    noTimeData: "Work-hour / workday data pending",
    actualLine: "2026",
    budgetLine: "Budget",
    sameLine: "Same period",
    actualMonths: "Actual",
    forecastMonths: "Forecast",
    annualValue: "Full-year value",
    varianceValue: "Variance",
    indicator: "Indicator",
    unit: "Unit",
    scenario: "Basis",
    group: "Group",
    searchPlaceholder: "Account code / English description / reason",
    namePlaceholder: "Name",
    rowCountSuffix: "items"
    ,summaryEmpty: "After importing SAP actuals, this month summary will be generated from account-level reasons below.",
    better: "better",
    worse: "worse",
    forecastUnitLine: "; 4+8 unit cost {unit} €/pc",
    compactSummary: "{month} unit cost is {direction} by {unitDiff} €/pc YoY; MFG variance {mfgDiff} K€; key reasons completed {filled}/{total}; increases {increase} K€, decreases {decrease} K€{forecast}",
    noMatchingAccounts: "No matching accounts",
    analysisSaved: "Reason saved",
    projectsSaved: "Projects saved",
    emptyFactors: "Add increase or decrease factors to build the project reason library.",
    localStore: "Local save"
    ,mfgDiffFormula: "Unit gap × 2026 volume",
    keurYtd: "K€ YTD",
    unit25: "2025 unit",
    unit26: "2026 unit"
    ,unitEuroPc: "€/pc",
    emptyCategoryChart: "Import SAP actuals to show category comparison"
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
    placeholderSmall: "Kısa neden",
    dashboardGroup: "Gösterge grubu",
    dashboardBasis: "Karşılaştırma bazı",
    groupUnit: "Birim",
    groupTime: "Zaman",
    groupPeople: "Kişi",
    groupEfficiency: "Verim",
    groupCost: "Gider",
    trendTitle: "Trend İzleme",
    trendHint: "Düz çizgi gerçekleşen, kesikli çizgi tahmin dönemidir",
    waterfallTitle: "Yıllık Fark Şelalesi",
    waterfallHint: "Kırmızı kötüleşme, yeşil iyileşme",
    heatmapTitle: "Aylık İstisna Isı Haritası",
    heatmapHint: "Renk koyulaştıkça fark büyür",
    detailTitle: "Gösterge Detayı",
    showDetail: "Detayı göster",
    hideDetail: "Detayı gizle",
    loadedYearModel: "Yıllık model yüklendi",
    readingFile: "Okunuyor",
    importedForecast: "4+8 içe aktarıldı",
    importedSap: "SAP içe aktarıldı",
    loadedForecast: "4+8 tahmin yüklendi",
    loadedSap: "SAP gerçekleşen yüklendi",
    noTimeData: "İş saati / iş günü verisi bekleniyor",
    actualLine: "2026",
    budgetLine: "Bütçe",
    sameLine: "Aynı dönem",
    actualMonths: "Gerçekleşen",
    forecastMonths: "Tahmin",
    annualValue: "Yıllık değer",
    varianceValue: "Fark",
    indicator: "Gösterge",
    unit: "Birim",
    scenario: "Baz",
    group: "Grup",
    searchPlaceholder: "Hesap kodu / İngilizce açıklama / neden",
    namePlaceholder: "Ad",
    rowCountSuffix: "satır"
    ,summaryEmpty: "SAP gerçekleşen yüklendikten sonra aylık özet aşağıdaki hesap nedenlerinden üretilecek.",
    better: "iyileşti",
    worse: "kötüleşti",
    forecastUnitLine: "; 4+8 birim maliyet {unit} €/adet",
    compactSummary: "{month} birim maliyet YoY {direction}: {unitDiff} €/adet; üretim farkı {mfgDiff} K€; ana nedenler {filled}/{total}; artış {increase} K€, azalış {decrease} K€{forecast}",
    noMatchingAccounts: "Eşleşen hesap yok",
    analysisSaved: "Neden kaydedildi",
    projectsSaved: "Projeler kaydedildi",
    emptyFactors: "Proje neden kitaplığı için artış veya azalış faktörleri ekleyin.",
    localStore: "Yerel kayıt"
    ,mfgDiffFormula: "Birim fark × 2026 hacim",
    keurYtd: "K€ YTD",
    unit25: "2025 birim",
    unit26: "2026 birim"
    ,unitEuroPc: "€/adet",
    emptyCategoryChart: "Kategori karşılaştırması için SAP gerçekleşen yükleyin"
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
  language: "zh",
  dashboardGroup: "all",
  dashboardBasis: "budget",
  dashboardTableOpen: false,
  sapFileName: "",
  forecastFileName: ""
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
  dashboardGroupSelect: document.getElementById("dashboardGroupSelect"),
  dashboardBasisSelect: document.getElementById("dashboardBasisSelect"),
  trendChart: document.getElementById("trendChart"),
  waterfallChart: document.getElementById("waterfallChart"),
  heatmapGrid: document.getElementById("heatmapGrid"),
  dashboardTableWrap: document.getElementById("dashboardTableWrap"),
  toggleDashboardTable: document.getElementById("toggleDashboardTable"),
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
  els.dashboardGroupSelect.addEventListener("change", () => {
    state.dashboardGroup = els.dashboardGroupSelect.value;
    renderDashboard();
  });
  els.dashboardBasisSelect.addEventListener("change", () => {
    state.dashboardBasis = els.dashboardBasisSelect.value;
    renderDashboard();
  });
  els.toggleDashboardTable.addEventListener("click", () => {
    state.dashboardTableOpen = !state.dashboardTableOpen;
    renderDashboard();
  });
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
    toast(`${t("readingFile")} ${file.name}`);
    const XLSX = await loadXlsx();
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
    state.forecast = extractForecastWorkbook(workbook, XLSX);
    state.forecastFileName = file.name;
    state.dashboardRows = buildDashboardRows();
    els.forecastStatus.textContent = `${t("importedForecast")}: ${file.name}`;
    els.forecastStatus.classList.remove("muted", "warning");
    els.exportBtn.disabled = false;
    renderAll();
    toast(`${t("loadedForecast")}: ${file.name}`);
  } catch (error) {
    toast(error.message || String(error), true);
  }
}

async function handleSapFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    toast(`${t("readingFile")} ${file.name}`);
    const XLSX = await loadXlsx();
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
    state.workbook = workbook;
    state.sapFileName = file.name;
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
    els.sapStatus.textContent = `${t("importedSap")}: ${file.name}`;
    els.sapStatus.classList.remove("muted", "warning");
    renderAll();
    toast(`${t("loadedSap")}: ${file.name}`);
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
  const months = Array.from({ length: 12 }, (_, index) => localizeMonthLabel(index, state.language));
  els.dashboardHead.innerHTML = `<tr><th>${escapeHtml(t("group"))}</th><th>${escapeHtml(t("indicator"))}</th><th>${escapeHtml(t("scenario"))}</th><th>${escapeHtml(t("unit"))}</th>${months.map((month) => `<th>${escapeHtml(month)}</th>`).join("")}</tr>`;
  els.dashboardTableWrap.classList.toggle("collapsed", !state.dashboardTableOpen);
  els.toggleDashboardTable.textContent = t(state.dashboardTableOpen ? "hideDetail" : "showDetail");
  if (!state.forecast || !state.dashboardRows.length) {
    els.dashboardStatus.textContent = t("waitingForecast");
    els.dashboardCards.innerHTML = "";
    els.trendChart.innerHTML = "";
    els.waterfallChart.innerHTML = "";
    els.heatmapGrid.innerHTML = `<div class="empty-cell">${t("emptyForecast")}</div>`;
    els.dashboardBody.innerHTML = `<tr><td colspan="16" class="empty-cell">${t("emptyForecast")}</td></tr>`;
    return;
  }
  els.dashboardStatus.textContent = t("loadedYearModel");
  const rowBy = (label, scenario) => state.dashboardRows.find((row) => row.label === label && row.scenario === scenario);
  const volumeTotal = valueAtYear(rowBy("产量", "26年"));
  const amountTotal = valueAtYear(rowBy("制造费用金额", "26年"));
  const budgetAmountTotal = valueAtYear(rowBy("制造费用金额", "预算"));
  const sameAmountTotal = valueAtYear(rowBy("制造费用金额", "同期"));
  const annualUnit = annualUnitCost(rowBy("制造费用金额", "26年"), rowBy("产量", "26年"));
  const annualBudgetUnit = annualUnitCost(rowBy("制造费用金额", "预算"), rowBy("产量", "预算"));
  const unitGap = annualUnit === null || annualBudgetUnit === null ? null : annualUnit - annualBudgetUnit;
  const productivity = valueAtYear(rowBy("累计人均产量", "26年"));
  els.dashboardCards.innerHTML = [
    dashboardCard(localizeDashboardText("labels", "产量", state.language), formatNumber(volumeTotal), localizeDashboardText("units", "台", state.language)),
    dashboardCard(localizeDashboardText("labels", "制造费用金额", state.language), formatMoney(amountTotal), "K€"),
    dashboardCard(t("budget26"), formatMoney(budgetAmountTotal), "K€"),
    dashboardCard(t("same25"), formatMoney(sameAmountTotal), "K€"),
    dashboardCard(localizeDashboardText("labels", "单台制造费", state.language), formatUnit(annualUnit), localizeDashboardText("units", "€/台", state.language), valueClass(unitGap)),
    dashboardCard(t("unitDiff"), formatUnit(unitGap), localizeDashboardText("units", "€/台", state.language), valueClass(unitGap)),
    dashboardCard(localizeDashboardText("labels", "人均产量", state.language), formatUnit(productivity), localizeDashboardText("units", "台/人", state.language))
  ].join("");

  const metrics = dashboardMetricsForGroup();
  renderTrendSvg(metrics, rowBy);
  renderWaterfallSvg(rowBy);
  renderHeatmap(metrics, rowBy);

  els.dashboardBody.innerHTML = state.dashboardRows.map((row) => `
    <tr class="dashboard-row group-${escapeHtml(row.group)}">
      <td><span class="group-chip">${escapeHtml(localizeDashboardRow(row, state.language).group)}</span></td>
      <td>${escapeHtml(localizeDashboardRow(row, state.language).label)}</td>
      <td><span class="scenario-chip ${scenarioClass(row.scenario)}">${escapeHtml(localizeDashboardRow(row, state.language).scenario)}</span></td>
      <td>${escapeHtml(localizeDashboardRow(row, state.language).unit)}</td>
      ${row.values.map((value, index) => `<td class="month-cell ${heatClass(row, index)}">${formatDashboardValue(value, row.unit)}</td>`).join("")}
    </tr>
  `).join("");
}

function dashboardMetricsForGroup() {
  const map = {
    all: ["产量", "单台制造费", "用人", "人均产量", "制造费用金额"],
    unit: ["产量", "标准台"],
    time: ["标准台"],
    people: ["用人", "直接用人", "间接用人", "固定用人"],
    efficiency: ["人均产量"],
    cost: ["单台制造费", "制造费用金额"]
  };
  return map[state.dashboardGroup] || map.all;
}

function annualUnitCost(amountRow, volumeRow) {
  const amount = sum(amountRow?.values || []);
  const volume = sum(volumeRow?.values || []);
  return amount && volume ? (amount / volume) * 1000 : null;
}

function renderTrendSvg(metrics, rowBy) {
  const width = 980;
  const height = 310;
  const left = 54;
  const right = 24;
  const top = 28;
  const bottom = 44;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const actualMonths = countActualMonths();
  const rows = metrics.map((labelText) => ({
    label: labelText,
    actual: rowBy(labelText, "26年"),
    compare: rowBy(labelText, state.dashboardBasis === "same" ? "同期" : "预算")
  })).filter((item) => item.actual);
  if (!rows.length) {
    els.trendChart.innerHTML = emptySvgMessage(t(state.dashboardGroup === "time" ? "noTimeData" : "emptyForecast"));
    return;
  }
  const values = rows.flatMap((item) => [...item.actual.values, ...(item.compare?.values || [])]).filter(Number.isFinite);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (index) => left + (plotW / 11) * index;
  const y = (value) => top + plotH - ((value - min) / span) * plotH;
  const grid = Array.from({ length: 12 }, (_, index) => `
    <g>
      <line x1="${x(index)}" y1="${top}" x2="${x(index)}" y2="${top + plotH}" class="grid-line" />
      <text x="${x(index)}" y="${height - 16}" class="axis-label">${escapeSvg(localizeMonthLabel(index, state.language))}</text>
    </g>
  `).join("");
  const palette = ["#48d6c1", "#5aa4ff", "#f6c85f", "#9d7dff", "#ff8a65"];
  const lines = rows.map((item, index) => {
    const color = palette[index % palette.length];
    const actualPoints = item.actual.values.map((value, month) => Number.isFinite(value) ? `${x(month)},${y(value)}` : null).filter(Boolean).join(" ");
    const comparePoints = item.compare?.values.map((value, month) => Number.isFinite(value) ? `${x(month)},${y(value)}` : null).filter(Boolean).join(" ") || "";
    const localized = localizeDashboardText("labels", item.label, state.language);
    const last = item.actual.values.findLast?.(Number.isFinite) ?? [...item.actual.values].reverse().find(Number.isFinite);
    return `
      ${comparePoints ? `<polyline class="trend-line compare" points="${comparePoints}" />` : ""}
      <polyline class="trend-line" style="stroke:${color}" points="${actualPoints}" />
      ${item.actual.values.map((value, month) => Number.isFinite(value) ? `<circle cx="${x(month)}" cy="${y(value)}" r="${month < actualMonths ? 4.5 : 3.5}" class="${month < actualMonths ? "dot actual" : "dot forecast"}" style="fill:${color}" />` : "").join("")}
      <text x="${left + 10}" y="${24 + index * 18}" class="legend" style="fill:${color}">${escapeSvg(localized)} ${formatDashboardValue(last, item.actual.unit)}</text>
    `;
  }).join("");
  els.trendChart.innerHTML = `
    <rect x="0" y="0" width="${width}" height="${height}" class="chart-bg" />
    ${grid}
    <line x1="${left}" y1="${top + plotH}" x2="${width - right}" y2="${top + plotH}" class="axis-line" />
    <rect x="${x(actualMonths - 0.5)}" y="${top}" width="${Math.max(0, width - right - x(actualMonths - 0.5))}" height="${plotH}" class="forecast-zone" />
    ${lines}
    <text x="${width - 180}" y="24" class="phase-label">${escapeSvg(t("actualMonths"))} / ${escapeSvg(t("forecastMonths"))}</text>
  `;
}

function renderWaterfallSvg(rowBy) {
  const actual = rowBy("制造费用金额", "26年");
  const compare = rowBy("制造费用金额", state.dashboardBasis === "same" ? "同期" : "预算");
  if (!actual || !compare) {
    els.waterfallChart.innerHTML = emptySvgMessage(t("emptyForecast"));
    return;
  }
  const categoryRows = state.dashboardRows
    .filter((row) => row.group === "大科目" && row.scenario === "26年")
    .map((row) => ({
      label: row.label,
      diff: sum(row.values) - sum(state.dashboardRows.find((item) => item.label === row.label && item.scenario === (state.dashboardBasis === "same" ? "同期" : "预算"))?.values || [])
    }))
    .filter((item) => Number.isFinite(item.diff) && Math.abs(item.diff) > 0.01)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 7);
  const maxAbs = Math.max(1, ...categoryRows.map((item) => Math.abs(item.diff)));
  const baseY = 258;
  const barW = 44;
  const gap = 18;
  const startX = 34;
  const bars = categoryRows.map((item, index) => {
    const h = Math.max(6, Math.abs(item.diff) / maxAbs * 170);
    const x = startX + index * (barW + gap);
    const y = item.diff > 0 ? baseY - h : baseY;
    const cls = item.diff > 0 ? "wf-bad" : "wf-good";
    return `
      <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="6" class="${cls}" />
      <text x="${x + barW / 2}" y="${y - 8}" class="wf-value">${formatMoney(item.diff)}</text>
      <text x="${x + barW / 2}" y="288" class="wf-label">${escapeSvg(shortText(localizeCategory(item.label, state.language), 10))}</text>
    `;
  }).join("");
  const totalDiff = sum(actual.values) - sum(compare.values);
  els.waterfallChart.innerHTML = `
    <rect x="0" y="0" width="520" height="310" class="chart-bg" />
    <line x1="24" y1="${baseY}" x2="496" y2="${baseY}" class="axis-line" />
    ${bars}
    <text x="26" y="28" class="waterfall-total">${escapeSvg(t("varianceValue"))}: ${formatMoney(totalDiff)} K€</text>
  `;
}

function renderHeatmap(metrics, rowBy) {
  const monthLabels = Array.from({ length: 12 }, (_, index) => localizeMonthLabel(index, state.language));
  const rows = metrics.map((labelText) => {
    const actual = rowBy(labelText, "26年");
    const compare = rowBy(labelText, state.dashboardBasis === "same" ? "同期" : "预算");
    if (!actual || !compare) return null;
    const diffs = actual.values.map((value, index) => Number.isFinite(value) && Number.isFinite(compare.values[index]) ? value - compare.values[index] : null);
    const max = Math.max(1, ...diffs.map((value) => Math.abs(value || 0)));
    return { label: labelText, actual, diffs, max };
  }).filter(Boolean);
  if (!rows.length) {
    els.heatmapGrid.innerHTML = `<div class="empty-cell">${t(state.dashboardGroup === "time" ? "noTimeData" : "emptyForecast")}</div>`;
    return;
  }
  els.heatmapGrid.innerHTML = `
    <div></div>${monthLabels.map((month) => `<div class="heat-head">${escapeHtml(month)}</div>`).join("")}
    ${rows.map((row) => `
      <div class="heat-label">${escapeHtml(localizeDashboardText("labels", row.label, state.language))}</div>
      ${row.diffs.map((value, index) => {
        const good = row.actual.direction === "higher" ? value > 0 : value < 0;
        const intensity = Math.min(1, Math.abs(value || 0) / row.max);
        return `<div class="heat-cell ${value === null ? "missing" : good ? "good" : "bad"}" style="--a:${0.18 + intensity * 0.62}" title="${escapeHtml(monthLabels[index])} ${formatDashboardValue(value, row.actual.unit)}"></div>`;
      }).join("")}
    `).join("")}
  `;
}

function countActualMonths() {
  return state.resultByMonth.size || 4;
}

function emptySvgMessage(message) {
  return `<rect x="0" y="0" width="100%" height="100%" class="chart-bg" /><text x="50%" y="50%" text-anchor="middle" class="empty-svg">${escapeSvg(message)}</text>`;
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
    option.textContent = localizeCategory(item.category, state.language);
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
  if (!result) return t("summaryEmpty");
  const highRows = result.rows.filter((row) => row.isHighImpact || Math.abs(row.unitDiff || 0) >= 0.5);
  const filled = highRows.filter((row) => (analyses[analysisKey(result.month, row.code)] || "").trim()).length;
  const direction = (result.summary.totalUnitDiff || 0) <= 0 ? t("better") : t("worse");
  const forecastText = forecast?.unitCost ? t("forecastUnitLine").replace("{unit}", formatUnit(forecast.unitCost)) : "";
  return t("compactSummary")
    .replace("{month}", localizeMonthLabel(result.month - 1, state.language))
    .replace("{direction}", direction)
    .replace("{unitDiff}", formatUnit(Math.abs(result.summary.totalUnitDiff || 0)))
    .replace("{mfgDiff}", formatMoney(result.summary.manufacturingDiff))
    .replace("{filled}", filled)
    .replace("{total}", highRows.length)
    .replace("{increase}", formatMoney(factorSummary?.increaseCumulative))
    .replace("{decrease}", formatMoney(factorSummary?.decreaseCumulative))
    .replace("{forecast}", forecastText);
}

function renderTable() {
  if (!state.result) {
    els.rowCount.textContent = `0 ${t("rowCountSuffix")}`;
    els.detailBody.innerHTML = `<tr><td colspan="11" class="empty-cell">${t("emptySap")}</td></tr>`;
    return;
  }
  const rows = visibleRows();
  els.rowCount.textContent = `${rows.length} ${t("rowCountSuffix")}`;
  els.detailBody.innerHTML =
    rows.map(rowToHtml).join("") || `<tr><td colspan="11" class="empty-cell">${t("noMatchingAccounts")}</td></tr>`;
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
      toast(`${storeLabel()}: ${t("analysisSaved")}`);
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
      <td>${escapeHtml(localizeCategory(row.category, state.language))}</td>
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
    ctx.fillText(localizeCategory(item.category, state.language), 12, y + rowHeight * 0.5);
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
    : `<tr><td colspan="9" class="empty-cell">${t("emptyFactors")}</td></tr>`;
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
  toast(`${storeLabel()}: ${t("projectsSaved")}`);
}

function addFactor(type) {
  state.factors.unshift({
    id: `new-${Date.now()}`,
    type,
    category: t(type === "increase" ? "increase" : "decrease"),
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
  updateLanguageOptions();
  updatePlaceholders();
  updateMonthOptions();
  els.saveMode.textContent = storeLabel();
  els.sapStatus.textContent = state.resultByMonth.size ? `${t("importedSap")}: ${state.sapFileName}` : t("waitingSap");
  els.forecastStatus.textContent = state.forecast ? `${t("importedForecast")}: ${state.forecastFileName}` : t("waitingForecastPill");
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

function escapeSvg(value) {
  return escapeHtml(value).replace(/'/g, "&apos;");
}

function shortText(value, maxLength) {
  const textValue = String(value ?? "");
  return textValue.length > maxLength ? `${textValue.slice(0, maxLength - 1)}…` : textValue;
}

function updatePlaceholders() {
  els.searchInput.placeholder = t("searchPlaceholder");
  els.userName.placeholder = t("namePlaceholder");
}

function updateMonthOptions() {
  for (const option of els.monthSelect.options) {
    option.textContent = localizeMonthLabel(Number(option.value) - 1, state.language);
  }
}

function updateLanguageOptions() {
  const labels = {
    zh: { zh: "中文", en: "英语", tr: "土耳其语" },
    en: { zh: "Chinese", en: "English", tr: "Turkish" },
    tr: { zh: "Çince", en: "İngilizce", tr: "Türkçe" }
  };
  for (const option of els.languageSelect.options) {
    option.textContent = labels[state.language]?.[option.value] || option.textContent;
  }
}

function storeLabel() {
  return store.label === "本机保存" ? t("localStore") : store.label;
}

function toast(message, isError = false) {
  els.toast.textContent = message;
  els.toast.style.background = isError ? "#b42318" : "#102033";
  els.toast.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 2600);
}

console.info(`DW workbench ${VERSION}`);
