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

const VERSION = "20260605-dashboard-v6";

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
    other: "其他",
    fullYear: "全年",
    annualSummaryEmpty: "导入4+8预测后生成全年总结。",
    monthlySummaryEmpty: "导入SAP实际后生成月度总结。",
    allIndicators: "全部指标",
    allScenarios: "全部口径",
    allStatus: "全部状态",
    monthlyMfgVarianceTitle: "到月制造费差异",
    yoyVariance: "同比差异",
    budgetVariance: "预算差异",
    annualCategoryDivergence: "全年大科目同比差异",
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
    other: "Other",
    fullYear: "Full year",
    annualSummaryEmpty: "Import the 4+8 forecast to generate the annual summary.",
    monthlySummaryEmpty: "Import SAP actuals to generate the monthly summary.",
    allIndicators: "All metrics",
    allScenarios: "All bases",
    allStatus: "All status",
    monthlyMfgVarianceTitle: "Monthly MFG variance",
    yoyVariance: "YoY variance",
    budgetVariance: "Budget variance",
    annualCategoryDivergence: "Annual category YoY variance",
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
    other: "Diğer",
    fullYear: "Yıl",
    annualSummaryEmpty: "Yıllık özet için 4+8 tahminini yükleyin.",
    monthlySummaryEmpty: "Aylık özet için SAP gerçekleşeni yükleyin.",
    allIndicators: "Tüm göstergeler",
    allScenarios: "Tüm bazlar",
    allStatus: "Tüm durumlar",
    monthlyMfgVarianceTitle: "Aylık üretim gideri farkı",
    yoyVariance: "YoY fark",
    budgetVariance: "Bütçe farkı",
    annualCategoryDivergence: "Yıllık kategori YoY farkı",
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
  dashboardBasis: "same",
  metricScenario: "all",
  metricMonth: "all",
  metricStatus: "all",
  metricIndicator: "all",
  dashboardTableOpen: true,
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
  annualSummary: document.getElementById("annualSummary"),
  monthlySummary: document.getElementById("monthlySummary"),
  projectSummary: document.getElementById("projectSummary"),
  monthlyKpiGrid: document.getElementById("monthlyKpiGrid"),
  dashboardStatus: document.getElementById("dashboardStatus"),
  dashboardGroupSelect: document.getElementById("dashboardGroupSelect"),
  dashboardBasisSelect: document.getElementById("dashboardBasisSelect"),
  metricFilterBar: document.getElementById("metricFilterBar"),
  trendChart: document.getElementById("trendChart"),
  waterfallChart: document.getElementById("waterfallChart"),
  heatmapGrid: document.getElementById("heatmapGrid"),
  dashboardTableWrap: document.getElementById("dashboardTableWrap"),
  toggleDashboardTable: document.getElementById("toggleDashboardTable"),
  summaryText: document.getElementById("summaryText"),
  analysisList: document.getElementById("analysisList"),
  categoryChart: document.getElementById("categoryChart"),
  categoryDiagnostics: document.getElementById("categoryDiagnostics"),
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
    if (!state.factors.length) state.factors = seedOriginalFactors();
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
  els.dashboardGroupSelect?.addEventListener("change", () => {
    state.dashboardGroup = els.dashboardGroupSelect.value;
    renderDashboard();
  });
  els.dashboardBasisSelect?.addEventListener("change", () => {
    state.dashboardBasis = els.dashboardBasisSelect.value;
    renderDashboard();
  });
  els.metricFilterBar?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-metric-group]");
    if (!button) return;
    state.dashboardGroup = button.dataset.metricGroup;
    renderDashboard();
  });
  els.metricFilterBar?.addEventListener("change", (event) => {
    const target = event.target;
    if (target.id === "metricScenarioFilter") state.metricScenario = target.value;
    if (target.id === "metricMonthFilter") state.metricMonth = target.value;
    if (target.id === "metricStatusFilter") state.metricStatus = target.value;
    if (target.id === "metricIndicatorFilter") state.metricIndicator = target.value;
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
  if (els.monthlyKpiGrid) {
    els.monthlyKpiGrid.innerHTML = buildFiveKpiCards("month").map((card) => kpiCardHtml(card, "metric")).join("");
  }
  if (els.monthlySummary) els.monthlySummary.innerHTML = buildMonthlySummaryText();
  if (els.factorNet) {
    els.factorNet.textContent = formatMoney(state.factorSummary?.netCumulative);
    els.factorNet.className = valueClass(state.factorSummary?.netCumulative);
  }
  if (els.heroUnitCost && state.result) {
    const summary = state.result.summary || {};
    els.heroUnitCost.textContent = formatUnit(summary.totalUnit26);
    els.heroUnitDiff.textContent = formatUnit(summary.totalUnitDiff);
    els.heroUnitDiff.className = valueClass(summary.totalUnitDiff);
    els.heroAmountDiff.textContent = formatMoney(summary.manufacturingDiff);
    els.heroAmountDiff.className = valueClass(summary.manufacturingDiff);
    els.openItems.textContent = String(countOpenHighRows());
  }
}

function renderDashboard() {
  const months = Array.from({ length: 12 }, (_, index) => localizeMonthLabel(index, state.language));
  els.dashboardHead.innerHTML = `<tr><th>${escapeHtml(t("group"))}</th><th>${escapeHtml(t("indicator"))}</th><th>${escapeHtml(t("scenario"))}</th><th>${escapeHtml(t("unit"))}</th>${months.map((month) => `<th>${escapeHtml(month)}</th>`).join("")}<th>${escapeHtml(t("fullYear"))}</th></tr>`;
  els.dashboardTableWrap.classList.toggle("collapsed", !state.dashboardTableOpen);
  els.toggleDashboardTable.textContent = t(state.dashboardTableOpen ? "hideDetail" : "showDetail");
  renderMetricFilters();
  if (!state.forecast || !state.dashboardRows.length) {
    els.dashboardStatus.textContent = t("waitingForecast");
    els.dashboardCards.innerHTML = "";
    if (els.annualSummary) els.annualSummary.textContent = t("annualSummaryEmpty");
    els.trendChart.innerHTML = "";
    els.waterfallChart.innerHTML = "";
    els.heatmapGrid.innerHTML = `<div class="empty-cell">${t("emptyForecast")}</div>`;
    els.dashboardBody.innerHTML = `<tr><td colspan="17" class="empty-cell">${t("emptyForecast")}</td></tr>`;
    return;
  }
  els.dashboardStatus.textContent = t("loadedYearModel");
  const rowBy = (label, scenario) => state.dashboardRows.find((row) => row.label === label && row.scenario === scenario);
  if (els.annualSummary) els.annualSummary.innerHTML = buildAnnualSummaryText();
  els.dashboardCards.innerHTML = buildFiveKpiCards("annual").map((card) => kpiCardHtml(card, "dashboard-card")).join("");

  renderTrendSvg([], rowBy);
  renderWaterfallSvg(rowBy);
  renderHeatmap(["单台制造费", "制造费用金额", "产量"], rowBy);

  const rows = visibleDashboardRows();
  let lastLabel = "";
  els.dashboardBody.innerHTML = rows.map((row) => {
    const localized = localizeDashboardRow(row, state.language);
    const family = metricFamily(row.label);
    const showLabel = row.label !== lastLabel;
    lastLabel = row.label;
    return `
      <tr class="dashboard-row family-${family}">
        <td><span class="group-chip">${escapeHtml(metricFamilyLabel(family))}</span></td>
        <td class="merged-label">${showLabel ? escapeHtml(localized.label) : ""}</td>
        <td><span class="scenario-chip ${scenarioClass(row.scenario)}">${escapeHtml(localized.scenario)}</span></td>
        <td>${escapeHtml(localized.unit)}</td>
        ${row.values.map((value, index) => `<td class="month-cell ${heatClass(row, index)}">${formatDashboardValue(value, row.unit)}</td>`).join("")}
        <td class="month-cell full-year-cell">${formatDashboardValue(annualMetricValue(row), row.unit)}</td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="17" class="empty-cell">${t("noMatchingAccounts")}</td></tr>`;
}

function dashboardMetricsForGroup() {
  const map = {
    all: ["单台制造费", "制造费用金额", "产量", "用人"],
    unit: ["产量", "标准台"],
    time: ["标准台"],
    people: ["用人", "直接用人", "间接用人", "固定用人"],
    efficiency: ["用人"],
    cost: ["单台制造费", "制造费用金额"]
  };
  return map[state.dashboardGroup] || map.all;
}

function renderMetricFilters() {
  if (!els.metricFilterBar) return;
  const groups = [
    ["all", t("all")],
    ["unit", t("groupUnit")],
    ["time", t("groupTime")],
    ["people", t("groupPeople")],
    ["efficiency", t("groupEfficiency")],
    ["cost", t("groupCost")]
  ];
  const indicators = [...new Set(state.dashboardRows.map((row) => row.label))]
    .filter((labelText) => state.dashboardGroup === "all" || metricFamily(labelText) === state.dashboardGroup);
  const months = Array.from({ length: 12 }, (_, index) => `<option value="${index}" ${state.metricMonth === String(index) ? "selected" : ""}>${escapeHtml(localizeMonthLabel(index, state.language))}</option>`).join("");
  els.metricFilterBar.innerHTML = `
    <div class="segment-control">${groups.map(([value, labelText]) => `<button type="button" class="${state.dashboardGroup === value ? "active" : ""}" data-metric-group="${value}">${escapeHtml(labelText)}</button>`).join("")}</div>
    <select id="metricIndicatorFilter"><option value="all">${escapeHtml(t("allIndicators"))}</option>${indicators.map((item) => `<option value="${escapeHtml(item)}" ${state.metricIndicator === item ? "selected" : ""}>${escapeHtml(localizeDashboardText("labels", item, state.language))}</option>`).join("")}</select>
    <select id="metricScenarioFilter">
      <option value="all" ${state.metricScenario === "all" ? "selected" : ""}>${escapeHtml(t("allScenarios"))}</option>
      <option value="同期" ${state.metricScenario === "同期" ? "selected" : ""}>${escapeHtml(t("same25"))}</option>
      <option value="预算" ${state.metricScenario === "预算" ? "selected" : ""}>${escapeHtml(t("budget26"))}</option>
      <option value="26年" ${state.metricScenario === "26年" ? "selected" : ""}>${escapeHtml(t("actual26"))}</option>
      <option value="差额" ${state.metricScenario === "差额" ? "selected" : ""}>${escapeHtml(t("varianceValue"))}</option>
    </select>
    <select id="metricMonthFilter"><option value="all" ${state.metricMonth === "all" ? "selected" : ""}>${escapeHtml(t("fullYear"))}</option>${months}</select>
    <select id="metricStatusFilter">
      <option value="all" ${state.metricStatus === "all" ? "selected" : ""}>${escapeHtml(t("allStatus"))}</option>
      <option value="bad" ${state.metricStatus === "bad" ? "selected" : ""}>${escapeHtml(t("worse"))}</option>
      <option value="good" ${state.metricStatus === "good" ? "selected" : ""}>${escapeHtml(t("better"))}</option>
    </select>
  `;
}

function visibleDashboardRows() {
  const monthIndex = state.metricMonth === "all" ? null : Number(state.metricMonth);
  return state.dashboardRows.filter((row) => {
    if (state.dashboardGroup !== "all" && metricFamily(row.label) !== state.dashboardGroup) return false;
    if (state.metricIndicator !== "all" && row.label !== state.metricIndicator) return false;
    if (state.metricScenario !== "all" && row.scenario !== state.metricScenario) return false;
    if (state.metricStatus !== "all") {
      const status = metricRowStatus(row, monthIndex);
      if (status !== state.metricStatus) return false;
    }
    return true;
  });
}

function metricFamily(labelText) {
  if (/单台/.test(labelText)) return "unit";
  if (/工时|出勤|标准工时/.test(labelText)) return "time";
  if (/用人|人数/.test(labelText)) return "people";
  if (/UPPH|效率|标准台|产量/.test(labelText)) return "efficiency";
  return "cost";
}

function metricFamilyLabel(family) {
  const map = {
    unit: t("groupUnit"),
    time: t("groupTime"),
    people: t("groupPeople"),
    efficiency: t("groupEfficiency"),
    cost: t("groupCost"),
    all: t("all")
  };
  return map[family] || family;
}

function metricRowStatus(row, monthIndex = null) {
  const value = monthIndex === null ? annualMetricValue(row) : row.values[monthIndex];
  if (!Number.isFinite(value)) return "neutral";
  let diff = value;
  if (row.scenario === "26年") {
    const same = state.dashboardRows.find((item) => item.label === row.label && item.scenario === "同期");
    const sameValue = monthIndex === null ? annualMetricValue(same) : same?.values?.[monthIndex];
    diff = diffNullableLocal(value, sameValue);
  }
  if (!Number.isFinite(diff) || Math.abs(diff) < 0.0001) return "neutral";
  const higherGood = row.direction === "higher";
  return higherGood ? (diff > 0 ? "good" : "bad") : (diff < 0 ? "good" : "bad");
}

function annualMetricValue(row) {
  if (!row) return null;
  if (row.label?.includes("累计") || ["€/台", "台/人"].includes(row.unit)) return lastFinite(row.values);
  return sum(row.values);
}

function buildFiveKpiCards(scope) {
  const stats = scope === "annual" ? annualStats() : monthStats();
  return [
    ratioCard("单", stats.unit26, stats.unit25, "€/台", "lower", "26单台 / 25单台"),
    ratioCard("时", stats.days26, stats.days25, "天", "lower", "26出勤天数 / 25出勤天数"),
    ratioCard("人", stats.people26, stats.people25, "人", "lower", "26总用人 / 25总用人"),
    ratioCard("效", stats.upph26, stats.upph25, "UPPH", "higher", "26 UPPH / 25 UPPH"),
    ratioCard("费", stats.rate26, stats.rate25, "%", "lower", "26制造费率 / 25制造费率")
  ];
}

function ratioCard(title, actual, same, unit, direction, formula) {
  const diff = diffNullableLocal(actual, same);
  const ratio = Number.isFinite(diff) && Number.isFinite(same) && same !== 0 ? diff / same : null;
  const good = ratio === null ? null : direction === "higher" ? ratio > 0 : ratio < 0;
  return {
    title,
    value: ratio,
    className: good === null ? "" : good ? "positive" : "negative",
    note: `${formatPlain(actual)}${unit} / ${formatPlain(same)}${unit}`,
    formula
  };
}

function annualStats() {
  const rowBy = (labelText, scenario) => state.dashboardRows.find((row) => row.label === labelText && row.scenario === scenario);
  const amount26 = rowBy("制造费用金额", "26年");
  const amount25 = rowBy("制造费用金额", "同期");
  const volume26 = rowBy("产量", "26年");
  const volume25 = rowBy("产量", "同期");
  return {
    unit26: annualUnitCost(amount26, volume26),
    unit25: annualUnitCost(amount25, volume25),
    days26: null,
    days25: null,
    people26: annualMetricValue(rowBy("用人", "26年")),
    people25: annualMetricValue(rowBy("用人", "同期")),
    upph26: null,
    upph25: null,
    rate26: null,
    rate25: null
  };
}

function monthStats() {
  const summary = state.result?.summary || {};
  return {
    unit26: summary.totalUnit26,
    unit25: summary.totalUnit25,
    days26: null,
    days25: null,
    people26: null,
    people25: null,
    upph26: null,
    upph25: null,
    rate26: null,
    rate25: null
  };
}

function kpiCardHtml(card, className) {
  return `
    <article class="${className} kpi-card ${card.className}">
      <span>${escapeHtml(card.title)}</span>
      <strong>${formatPercent(card.value)}</strong>
      <small>${escapeHtml(card.note)}</small>
      <em>${escapeHtml(card.formula)}</em>
    </article>
  `;
}

function buildAnnualSummaryText() {
  const stats = annualStats();
  if (!Number.isFinite(stats.unit26) || !Number.isFinite(stats.unit25)) return t("annualSummaryEmpty");
  const unitDiff = stats.unit26 - stats.unit25;
  const ratio = stats.unit25 ? unitDiff / stats.unit25 : null;
  const volume26 = annualMetricValue(state.dashboardRows.find((row) => row.label === "产量" && row.scenario === "26年"));
  const impact = Number.isFinite(unitDiff) && Number.isFinite(volume26) ? unitDiff * volume26 / 1000 : null;
  const topCats = annualCategoryDiffs().slice(0, 3).map((item) => localizeCategory(item.label, state.language)).join("、");
  return `2026年洗碗机全年滚动预测单台制造费为 ${formatUnit(stats.unit26)} €/台，较同期${unitDiff <= 0 ? "优化" : "恶化"} ${formatPercent(Math.abs(ratio))}，对应制造费影响 ${formatMoney(impact)} K€。主要差异集中在 ${topCats || "重点大科目"}，请结合下方到月差异和大科目中轴图跟踪。`;
}

function buildMonthlySummaryText() {
  if (!state.result) return t("monthlySummaryEmpty");
  const summary = state.result.summary || {};
  const topCategories = monthlyCategoryDiagnostics().slice(0, 3).map((item) => localizeCategory(item.category, state.language)).join("、");
  const topRows = state.result.rows.slice().sort((a, b) => Math.abs(b.manufacturingDiff || 0) - Math.abs(a.manufacturingDiff || 0)).slice(0, 3).map((row) => row.code).join("、");
  return `${state.result.month}月洗碗机单台制造费为 ${formatUnit(summary.totalUnit26)} €/台，较同期${(summary.totalUnitDiff || 0) <= 0 ? "优化" : "恶化"} ${formatUnit(Math.abs(summary.totalUnitDiff || 0))} €/台，对应制造费影响 ${formatMoney(summary.manufacturingDiff)} K€。差异主要来自 ${topCategories || "重点大科目"}，重点小科目为 ${topRows || "待导入科目"}，原因可在下方科目明细补充。`;
}

function annualCategoryDiffs() {
  return state.dashboardRows
    .filter((row) => row.group === "大科目" && row.scenario === "26年")
    .map((row) => {
      const same = state.dashboardRows.find((item) => item.group === "大科目" && item.label === row.label && item.scenario === "同期");
      return { label: row.label, diff: sum(row.values) - sum(same?.values || []) };
    })
    .filter((item) => Number.isFinite(item.diff) && Math.abs(item.diff) > 0.01)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}

function monthlyCategoryDiagnostics() {
  if (!state.result) return [];
  const volume = state.result.volume26 || 0;
  return (state.result.categories || [])
    .map((item) => {
      const unitDiff = item.unitDiff ?? (volume ? (item.amountDiff / volume) * 1000 : null);
      return {
        ...item,
        unitDiff,
        manufacturingDiff: Number.isFinite(unitDiff) && volume ? unitDiff * volume / 1000 : item.manufacturingDiff,
        yoyRate: item.amount25 ? item.amountDiff / item.amount25 : null
      };
    })
    .sort((a, b) => Math.abs(b.manufacturingDiff || b.amountDiff || 0) - Math.abs(a.manufacturingDiff || a.amountDiff || 0));
}

function diffNullableLocal(left, right) {
  return Number.isFinite(left) && Number.isFinite(right) ? left - right : null;
}

function lastFinite(values = []) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (Number.isFinite(values[index])) return values[index];
  }
  return null;
}

function annualUnitCost(amountRow, volumeRow) {
  const amount = sum(amountRow?.values || []);
  const volume = sum(volumeRow?.values || []);
  return amount && volume ? (amount / volume) * 1000 : null;
}

function renderTrendSvg(metrics, rowBy) {
  const actual = rowBy("制造费用金额", "26年");
  const same = rowBy("制造费用金额", "同期");
  const budget = rowBy("制造费用金额", "预算");
  if (!actual || !same || !budget) {
    els.trendChart.innerHTML = emptySvgMessage(t("emptyForecast"));
    return;
  }
  const width = 980;
  const height = 310;
  const left = 54;
  const right = 24;
  const top = 34;
  const bottom = 50;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const yoy = actual.values.map((value, index) => diffNullableLocal(value, same.values[index]));
  const budgetDiff = actual.values.map((value, index) => diffNullableLocal(value, budget.values[index]));
  const values = [...yoy, ...budgetDiff].filter(Number.isFinite);
  const maxAbs = Math.max(1, ...values.map((value) => Math.abs(value)));
  const zeroY = top + plotH / 2;
  const barW = Math.max(16, plotW / 12 / 3.2);
  const x = (index) => left + (plotW / 12) * index + plotW / 24;
  const bar = (value, index, offset, cls) => {
    if (!Number.isFinite(value)) return "";
    const h = Math.max(3, Math.abs(value) / maxAbs * (plotH / 2 - 14));
    const y = value >= 0 ? zeroY - h : zeroY;
    return `<rect x="${x(index) + offset}" y="${y}" width="${barW}" height="${h}" rx="4" class="${cls} animated-bar" />
      <text x="${x(index) + offset + barW / 2}" y="${value >= 0 ? y - 7 : y + h + 13}" class="bar-value ${value > 0 ? "bad" : "good"}">${formatMoney(value)}</text>`;
  };
  const grid = Array.from({ length: 12 }, (_, index) => `
    <g>
      <line x1="${x(index)}" y1="${top}" x2="${x(index)}" y2="${top + plotH}" class="grid-line" />
      <text x="${x(index)}" y="${height - 16}" class="axis-label">${escapeSvg(localizeMonthLabel(index, state.language))}</text>
    </g>
  `).join("");
  els.trendChart.innerHTML = `
    <rect x="0" y="0" width="${width}" height="${height}" class="chart-bg" />
    ${grid}
    <line x1="${left}" y1="${zeroY}" x2="${width - right}" y2="${zeroY}" class="axis-line zero-line" />
    ${yoy.map((value, index) => bar(value, index, -barW - 3, value > 0 ? "wf-bad" : "wf-good")).join("")}
    ${budgetDiff.map((value, index) => bar(value, index, 3, value > 0 ? "budget-bad" : "budget-good")).join("")}
    <text x="${left}" y="22" class="legend" style="fill:#48d6c1">${escapeSvg(t("monthlyMfgVarianceTitle"))}</text>
    <text x="${left + 260}" y="22" class="legend" style="fill:#49d9a4">${escapeSvg(t("yoyVariance"))}</text>
    <text x="${left + 390}" y="22" class="legend" style="fill:#f6c85f">${escapeSvg(t("budgetVariance"))}</text>
  `;
}

function renderWaterfallSvg(rowBy) {
  const categoryRows = annualCategoryDiffs().slice(0, 14);
  if (!categoryRows.length) {
    els.waterfallChart.innerHTML = emptySvgMessage(t("emptyForecast"));
    return;
  }
  const width = 980;
  const rowHeight = 24;
  const height = Math.max(340, 74 + categoryRows.length * rowHeight);
  const left = 250;
  const right = 110;
  const center = left + (width - left - right) / 2;
  const maxAbs = Math.max(1, ...categoryRows.map((item) => Math.abs(item.diff)));
  const scale = (width - left - right) / 2 / maxAbs;
  const bars = categoryRows.map((item, index) => {
    const y = 52 + index * rowHeight;
    const w = Math.max(4, Math.abs(item.diff) * scale);
    const isBad = item.diff > 0;
    const x = isBad ? center : center - w;
    return `
      <text x="24" y="${y + 8}" class="wf-axis-label">${escapeSvg(shortText(localizeCategory(item.label, state.language), 24))}</text>
      <rect x="${x}" y="${y}" width="${w}" height="14" rx="7" class="${isBad ? "wf-bad" : "wf-good"} animated-bar" />
      <text x="${isBad ? x + w + 8 : x - 8}" y="${y + 8}" class="wf-side-value ${isBad ? "bad" : "good"}" text-anchor="${isBad ? "start" : "end"}">${formatMoney(item.diff)} K€</text>
    `;
  }).join("");
  els.waterfallChart.setAttribute("viewBox", `0 0 ${width} ${height}`);
  els.waterfallChart.innerHTML = `
    <rect x="0" y="0" width="${width}" height="${height}" class="chart-bg" />
    <line x1="${center}" y1="42" x2="${center}" y2="${height - 22}" class="axis-line center-axis" />
    <text x="24" y="26" class="waterfall-total">${escapeSvg(t("annualCategoryDivergence"))}</text>
    <text x="${center - 10}" y="26" class="phase-label" text-anchor="end">${escapeSvg(t("better"))}</text>
    <text x="${center + 10}" y="26" class="phase-label" text-anchor="start">${escapeSvg(t("worse"))}</text>
    ${bars}
  `;
}

function totalBar(x, value, cls, label, displayValue, y, plotH, top, barW) {
  const barTop = y(value);
  const h = top + plotH - barTop;
  return `
    <rect x="${x}" y="${barTop}" width="${barW}" height="${Math.max(8, h)}" rx="5" class="${cls}" />
    <text x="${x + barW / 2}" y="${barTop - 9}" class="wf-value">${formatMoney(displayValue)}</text>
    <text x="${x + barW / 2}" y="316" class="wf-label">${escapeSvg(label)}</text>
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
        return `<div class="heat-cell ${value === null ? "missing" : good ? "good" : "bad"}" style="--a:${0.18 + intensity * 0.62}" title="${escapeHtml(monthLabels[index])} ${formatDashboardValue(value, row.actual.unit)}">${value === null ? "" : formatDashboardValue(value, row.actual.unit)}</div>`;
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

function dashboardCard(title, value, unit, className = "", note = "") {
  return `<div class="dashboard-card"><span>${escapeHtml(title)}</span><strong class="${className}">${value}</strong><small>${escapeHtml(unit)}</small>${note ? `<em>${escapeHtml(note)}</em>` : ""}</div>`;
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
  state.chartHitZones = [];
  if (!state.result) {
    if (els.emptyChart) els.emptyChart.style.display = "grid";
    if (els.categoryDiagnostics) els.categoryDiagnostics.innerHTML = "";
    return;
  }
  if (els.emptyChart) els.emptyChart.style.display = "none";
  if (els.categoryChart) els.categoryChart.style.display = "none";
  const rows = monthlyCategoryDiagnostics();
  if (els.categoryDiagnostics) {
    els.categoryDiagnostics.innerHTML = rows.map((item) => `
      <button class="category-diagnostic ${item.amountDiff > 0 ? "bad" : "good"}" type="button" data-category="${escapeHtml(item.category)}">
        <span>${escapeHtml(localizeCategory(item.category, state.language))}</span>
        <strong>${formatUnit(item.unitDiff)} €/台</strong>
        <em>${formatMoney(item.amountDiff)} K€</em>
        <em>${formatMoney(item.manufacturingDiff)} K€</em>
        <em>${formatPercent(item.yoyRate)}</em>
      </button>
    `).join("");
    for (const button of els.categoryDiagnostics.querySelectorAll("[data-category]")) {
      button.addEventListener("click", () => {
        els.categoryFilter.value = button.dataset.category;
        renderTable();
      });
    }
  }
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
  if (els.projectSummary) els.projectSummary.innerHTML = buildProjectSummaryText();
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

function seedOriginalFactors() {
  return [
    {
      id: "seed-inventory-release",
      type: "decrease",
      category: "存货跌价准备",
      strategy: "存货跌价准备释放预提",
      project: "超期库存钢卷加工成本成品",
      owner: "",
      timing: "4月",
      actualCumulative: 180,
      progress: "三张表原始因素"
    },
    {
      id: "seed-fixed-labor-release",
      type: "decrease",
      category: "固定人工",
      strategy: "同期释放预提",
      project: "固定人工预提释放",
      owner: "",
      timing: "4月",
      actualCumulative: 41.9,
      progress: "三张表原始因素"
    },
    {
      id: "seed-steel-scrap",
      type: "increase",
      category: "物耗",
      strategy: "钢卷制成半成品料废",
      project: "钢卷半成品料废",
      owner: "",
      timing: "4月",
      actualCumulative: 26,
      progress: "三张表原始因素"
    },
    {
      id: "seed-stale-wip",
      type: "increase",
      category: "生产耗用",
      strategy: "钢卷半成品呆滞",
      project: "呆滞半成品消耗",
      owner: "",
      timing: "4月",
      actualCumulative: 66,
      progress: "三张表原始因素"
    },
    {
      id: "seed-oil-purchase",
      type: "increase",
      category: "生产耗用",
      strategy: "一次性购买5/6/7月oil预防涨价",
      project: "Oil提前采购",
      owner: "",
      timing: "4月",
      actualCumulative: 40,
      progress: "三张表原始因素"
    }
  ];
}

function buildProjectSummaryText() {
  const increaseCount = state.factors.filter((item) => item.type === "increase").length;
  const decreaseCount = state.factors.filter((item) => item.type !== "increase").length;
  const top = state.factors
    .slice()
    .sort((a, b) => Math.abs(b.actualCumulative || 0) - Math.abs(a.actualCumulative || 0))
    .slice(0, 3)
    .map((item) => item.project || item.strategy || item.category)
    .join("、");
  return `当前项目库共沉淀上涨因素 ${increaseCount} 项、下降因素 ${decreaseCount} 项；上涨累计 ${formatMoney(state.factorSummary?.increaseCumulative)} K€，下降累计 ${formatMoney(state.factorSummary?.decreaseCumulative)} K€，净影响 ${formatMoney(state.factorSummary?.netCumulative)} K€。重点项目为 ${top || "待补充"}。`;
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

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${(Number(value) * 100).toLocaleString("zh-CN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function formatPlain(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
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
