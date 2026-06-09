import {
  BASELINE_25_BY_MONTH,
  BUDGET_26_BY_MONTH,
  CATEGORY_ORDER
} from "./baseline-data.js?v=20260610-shared-submit-v14";
import { MONTHS, extractActualFromWorkbook } from "./parser.js?v=20260610-shared-submit-v14";
import { buildReconciliation } from "./reconcile.js?v=20260610-shared-submit-v14";
import { exportAnalysisWorkbook } from "./export.js?v=20260610-shared-submit-v14";
import { loadXlsx } from "./xlsx-loader.js?v=20260610-shared-submit-v14";
import { createStore } from "./store.js?v=20260610-shared-submit-v14";
import {
  extractForecastWorkbook,
  buildAnnualDashboardRows,
  monthSnapshot,
  localizeCategory,
  localizeDashboardRow,
  localizeDashboardText,
  localizeMonthLabel
} from "./forecast-parser.js?v=20260610-shared-submit-v14";
import {
  analysisKey,
  buildAutoSummary,
  buildFactorSummary,
  parseEditableNumber
} from "./workbench.js?v=20260610-shared-submit-v14";
import { extractJiangYueWorkbook } from "./jiangyue-parser.js?v=20260610-shared-submit-v14";
import {
  annualManufacturingRate,
  annualUnitCost,
  annualUpph,
  averageFinite,
  targetCompletionRate
} from "./metrics.js?v=20260610-shared-submit-v14";
import { buildKpiDefinitions, categoryComparisonHeaders } from "./presentation.js?v=20260610-shared-submit-v14";
import { PROJECT_SEEDS, projectImpactSummary } from "./project-data.js?v=20260610-shared-submit-v14";
import { categoryAlias } from "./category-alias.js?v=20260610-shared-submit-v14";

const VERSION = "20260610-shared-submit-v14";

const i18n = {
  zh: {
    appTitle: "洗碗机制造费三张表工作台",
    appSubtitle: "导入财务数据，输出全年驾驶舱、月度差异、项目因素",
    language: "语言",
    author: "填写人",
    importForecast: "导入预测表",
    importJiang: "导入国内财务表",
    importSap: "导入4月实际表",
    exportAnalysis: "导出三张表",
    tabDashboard: "全年驾驶舱",
    tabVariance: "月度差异",
    tabProjects: "降费项目",
    actualMonth: "实际月份",
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
    dashboardHint: "上传 预测表后，一屏查看 1-12 月产量、单台制造费、金额和关键大科目。",
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
    analysis: "同比差异分析",
    targetVarianceAnalysis: "目标差异分析",
    yoyVarianceAnalysis: "同比差异分析",
    yoyPercent: "同比%",
    submitAnalyses: "提交原因",
    submitProjects: "提交项目",
    analysisSubmitted: "原因已提交到后台共享",
    projectsSubmitted: "项目已提交到后台共享",
    saving: "正在提交...",
    submitFailed: "提交失败",
    unsavedChanges: "未提交",
    factorProjects: "26年降费项目",
    factorHint: "管理正式降费项目；月度差异原因在第二张表的小科目明细中填写。",
    factorMonth: "发生月份",
    addIncrease: "添加项目",
    addDecrease: "添加项目",
    saveProjects: "保存项目",
    increaseTotal: "预计收益",
    decreaseTotal: "实际收益",
    netImpact: "达成差额",
    type: "主导方",
    path: "核心策略/路径",
    project: "关键项目",
    owner: "责任人",
    timing: "到位时间",
    impact: "实际月累差额 K€",
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
    emptyForecast: "导入预测表文件后显示1-12月全年驾驶舱",
    emptySap: "导入SAP报表后显示科目明细",
    waitingForecast: "等待预测表文件",
    waitingSap: "待导入4月实际表",
    waitingForecastPill: "待导入预测表",
    placeholderMajor: "重点差异：填写原因、责任、行动和预计影响",
    placeholderSmall: "简要原因",
    dashboardGroup: "指标组",
    dashboardBasis: "对比基准",
    groupUnit: "单",
    groupTime: "时",
    groupPeople: "人",
    groupEfficiency: "效",
    groupCost: "费",
    trendTitle: "单台制造费趋势",
    trendHint: "月度单台：与下方“单台制造费”明细行一致",
    waterfallTitle: "制造费率趋势",
    waterfallHint: "制造费 ÷ 产值",
    other: "其他",
    fullYear: "全年",
    annualSummaryEmpty: "导入预测表后生成全年总结。",
    monthlySummaryEmpty: "导入4月实际表后生成月度总结。",
    allIndicators: "全部指标",
    allScenarios: "全部口径",
    allStatus: "全部状态",
    monthlyMfgVarianceTitle: "到月制造费差异",
    yoyVariance: "同比差异",
    budgetVariance: "预算差异",
    targetCompletion: "目标完成率",
    inflationImpact: "通胀影响",
    wageImpact: "工资上涨影响",
    scaleImpact: "规模变化影响",
    plannedShort: "预计",
    actualShort: "实际",
    annualCategoryDivergence: "全年大科目同比差异",
    heatmapTitle: "月度异常热力",
    heatmapHint: "颜色越深差异越大",
    detailTitle: "指标明细",
    showDetail: "展开明细",
    hideDetail: "收起明细",
    loadedYearModel: "全年模型已加载",
    readingFile: "正在读取",
    importedForecast: "已导入预测表",
    importedSap: "已导入SAP",
    loadedForecast: "已读取预测表",
    loadedSap: "已读取4月实际表",
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
    emptyFactors: "添加正式降费项目后，这里会形成项目库。",
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
    importForecast: "Import forecast table",
    importJiang: "Import domestic finance table",
    importSap: "Import April actual table",
    exportAnalysis: "Export workbook",
    tabDashboard: "Year dashboard",
    tabVariance: "Monthly variance",
    tabProjects: "Cost reduction projects",
    actualMonth: "Actual month",
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
    analysis: "YoY variance",
    targetVarianceAnalysis: "Target variance",
    yoyVarianceAnalysis: "YoY variance",
    yoyPercent: "YoY %",
    submitAnalyses: "Submit reasons",
    submitProjects: "Submit projects",
    analysisSubmitted: "Reasons submitted to shared backend",
    projectsSubmitted: "Projects submitted to shared backend",
    saving: "Submitting...",
    submitFailed: "Submit failed",
    unsavedChanges: "Not submitted",
    factorProjects: "2026 Cost Reduction Projects",
    factorHint: "Manage formal projects here. Enter monthly variance reasons in Account Detail.",
    factorMonth: "Impact month",
    addIncrease: "Add project",
    addDecrease: "Add project",
    saveProjects: "Save projects",
    increaseTotal: "Planned benefit",
    decreaseTotal: "Actual benefit",
    netImpact: "Achievement gap",
    type: "Lead party",
    path: "Core strategy / path",
    project: "Project",
    owner: "Owner",
    timing: "Timing",
    impact: "Actual YTD impact K€",
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
    emptySap: "Import April actual table to show account details",
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
    trendTitle: "Unit Cost Trend",
    trendHint: "2026 rolling forecast / budget / same period",
    waterfallTitle: "Manufacturing Rate Trend",
    waterfallHint: "Manufacturing cost / output value",
    other: "Other",
    fullYear: "Full year",
    annualSummaryEmpty: "Import the 4+8 forecast to generate the annual summary.",
    monthlySummaryEmpty: "Import April actual table to generate the monthly summary.",
    allIndicators: "All metrics",
    allScenarios: "All bases",
    allStatus: "All status",
    monthlyMfgVarianceTitle: "Monthly MFG variance",
    yoyVariance: "YoY variance",
    budgetVariance: "Budget variance",
    targetCompletion: "Target completion",
    inflationImpact: "Inflation impact",
    wageImpact: "Wage increase impact",
    scaleImpact: "Scale impact",
    plannedShort: "Plan",
    actualShort: "Actual",
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
    emptyFactors: "Add formal cost reduction projects to build the project library.",
    localStore: "Local save"
    ,mfgDiffFormula: "Unit gap × 2026 volume",
    keurYtd: "K€ YTD",
    unit25: "2025 unit",
    unit26: "2026 unit"
    ,unitEuroPc: "€/pc",
    emptyCategoryChart: "Import April actual table to show category comparison"
  },
  tr: {
    appTitle: "Bulaşık Makinesi Üretim Gideri",
    appSubtitle: "Finans verisini yükle, üç analiz tablosunu üret",
    language: "Dil",
    author: "Yazan",
    importForecast: "4+8 tahmin yükle",
    importJiang: "Jiang Yue tablosunu yükle",
    importSap: "SAP gerçekleşen yükle",
    exportAnalysis: "Çalışma kitabı indir",
    tabDashboard: "Yıllık pano",
    tabVariance: "Aylık fark",
    tabProjects: "Maliyet düşürme projeleri",
    actualMonth: "Gerçekleşen ay",
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
    analysis: "Yıllık fark",
    targetVarianceAnalysis: "Hedef fark",
    yoyVarianceAnalysis: "Yıllık fark",
    yoyPercent: "YoY %",
    submitAnalyses: "Nedenleri gönder",
    submitProjects: "Projeleri gönder",
    analysisSubmitted: "Nedenler paylaşılan arka uca gönderildi",
    projectsSubmitted: "Projeler paylaşılan arka uca gönderildi",
    saving: "Gönderiliyor...",
    submitFailed: "Gönderme başarısız",
    unsavedChanges: "Gönderilmedi",
    factorProjects: "2026 Maliyet Düşürme Projeleri",
    factorHint: "Resmi maliyet düşürme projelerini burada yönetin. Aylık fark nedenlerini hesap detayında girin.",
    factorMonth: "Etki ayı",
    addIncrease: "Artış ekle",
    addDecrease: "Azalış ekle",
    saveProjects: "Projeleri kaydet",
    increaseTotal: "Planlanan fayda",
    decreaseTotal: "Gerçekleşen fayda",
    netImpact: "Gerçekleşme farkı",
    type: "Lider taraf",
    path: "Ana strateji / yol",
    project: "Proje",
    owner: "Sorumlu",
    timing: "Zaman",
    impact: "Gerçekleşen YTD etki K€",
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
    trendTitle: "Birim Maliyet Trendi",
    trendHint: "Düz çizgi gerçekleşen, kesikli çizgi tahmin dönemidir",
    waterfallTitle: "Üretim Gider Oranı Trendi",
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
    targetCompletion: "Hedef gerçekleşme",
    inflationImpact: "Enflasyon etkisi",
    wageImpact: "Ücret artışı etkisi",
    scaleImpact: "Ölçek etkisi",
    plannedShort: "Plan",
    actualShort: "Gerçek",
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
    emptyFactors: "Resmi maliyet düşürme projesi ekleyin.",
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
  jiangyue: null,
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
  factorMonth: 4,
  sapFileName: "",
  forecastFileName: "",
  jiangFileName: ""
};

const els = {
  sapFile: document.getElementById("sapFile"),
  forecastFile: document.getElementById("forecastFile"),
  jiangFile: document.getElementById("jiangFile"),
  exportBtn: document.getElementById("exportBtn"),
  monthSelect: document.getElementById("monthSelect"),
  searchInput: document.getElementById("searchInput"),
  analysisFilter: document.getElementById("analysisFilter"),
  categoryFilter: document.getElementById("categoryFilter"),
  sortBy: document.getElementById("sortBy"),
  languageSelect: document.getElementById("languageSelect"),
  userName: document.getElementById("userName"),
  saveMode: document.getElementById("saveMode"),
  analysisAuthor: document.getElementById("analysisAuthor"),
  submitAnalysesBtn: document.getElementById("submitAnalysesBtn"),
  analysisSaveStatus: document.getElementById("analysisSaveStatus"),
  factorSaveStatus: document.getElementById("factorSaveStatus"),
  sapStatus: document.getElementById("sapStatus"),
  forecastStatus: document.getElementById("forecastStatus"),
  jiangStatus: document.getElementById("jiangStatus"),
  monthButtons: document.getElementById("monthButtons"),
  dashboardHead: document.getElementById("dashboardHead"),
  dashboardBody: document.getElementById("dashboardBody"),
  dashboardCards: document.getElementById("dashboardCards"),
  annualSummary: document.getElementById("annualSummary"),
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
  projectImpactCards: document.getElementById("projectImpactCards"),
  increaseTotal: document.getElementById("increaseTotal"),
  decreaseTotal: document.getElementById("decreaseTotal"),
  factorNetDetail: document.getElementById("factorNetDetail"),
  addIncreaseBtn: document.getElementById("addIncreaseBtn"),
  addDecreaseBtn: document.getElementById("addDecreaseBtn"),
  factorMonthSelect: document.getElementById("factorMonthSelect"),
  saveFactorsBtn: document.getElementById("saveFactorsBtn"),
  toast: document.getElementById("toast")
};

bootstrap();

async function bootstrap() {
  bindEvents();
  installMetricHoverTooltip();
  els.saveMode.textContent = store.label;
  els.userName.value = store.getUser();
  if (els.analysisAuthor) els.analysisAuthor.value = els.userName.value;
  try {
    state.analyses = await store.loadAnalyses();
    const storedFactors = normalizeFactorsForUi(await store.loadFactors([]));
    const legacySeedData = storedFactors.length > 0
      && storedFactors.length <= 6
      && storedFactors.every((item) => String(item.id || "").startsWith("project-"));
    state.factors = (!storedFactors.length || legacySeedData)
      ? seedCostReductionProjects()
      : mergeMissingProjectSeeds(storedFactors);
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
  els.jiangFile?.addEventListener("change", handleJiangFileChange);
  els.monthSelect.addEventListener("change", () => {
    selectCurrentMonth();
    renderAll();
  });
  els.monthButtons?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-month]");
    if (!button) return;
    els.monthSelect.value = button.dataset.month;
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
  els.userName.addEventListener("input", () => {
    store.setUser(els.userName.value.trim());
    if (els.analysisAuthor) els.analysisAuthor.value = els.userName.value.trim();
  });
  if (els.submitAnalysesBtn) els.submitAnalysesBtn.addEventListener("click", submitCurrentMonthAnalyses);
  if (els.saveFactorsBtn) els.saveFactorsBtn.addEventListener("click", submitProjects);
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
  els.addDecreaseBtn?.addEventListener("click", () => addFactor("decrease"));
  els.factorMonthSelect?.addEventListener("change", () => {
    state.factorMonth = Number(els.factorMonthSelect.value) || 4;
    renderFactors();
  });
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

async function handleJiangFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    toast(`${t("readingFile")} ${file.name}`);
    const XLSX = await loadXlsx();
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
    state.jiangyue = extractJiangYueWorkbook(workbook, XLSX);
    state.jiangFileName = file.name;
    state.dashboardRows = buildDashboardRows();
    els.jiangStatus.textContent = `${t("importJiang")}: ${file.name}`;
    els.jiangStatus.classList.remove("muted", "warning");
    renderAll();
    toast(`国内财务表已读取: ${file.name}`);
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

    if (!state.resultByMonth.size) throw new Error("没有解析到可用4月实际表数");
    const importedMonths = [...state.resultByMonth.keys()].sort((a, b) => a - b);
    els.monthSelect.innerHTML = importedMonths.map((month) => `<option value="${month}">${month}月</option>`).join("");
    els.monthSelect.value = String(importedMonths.at(-1));
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
  renderMonthButtons();
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
    resultByMonth: state.resultByMonth,
    jiangyue: state.jiangyue
  });
}

function renderMonthButtons() {
  if (!els.monthButtons) return;
  const months = [...state.resultByMonth.keys()].sort((a, b) => a - b);
  els.monthButtons.innerHTML = months.length
    ? months.map((month) => `<button type="button" data-month="${month}" class="${Number(els.monthSelect.value) === month ? "active" : ""}">${month}月</button>`).join("")
    : `<span class="muted">${t("waitingSap")}</span>`;
}

function renderSummaryCards() {
  if (els.monthlyKpiGrid) {
    els.monthlyKpiGrid.innerHTML = buildFiveKpiCards("month").map((card) => kpiCardHtml(card, "metric")).join("");
  }
}

function renderDashboard() {
  const months = Array.from({ length: 12 }, (_, index) => localizeMonthLabel(index, state.language));
  els.dashboardHead.innerHTML = `<tr><th class="sticky-col sticky-col-1">${escapeHtml(t("group"))}</th><th class="sticky-col sticky-col-2">${escapeHtml(t("indicator"))}</th><th class="sticky-col sticky-col-3">${escapeHtml(t("scenario"))}</th><th class="sticky-col sticky-col-4">${escapeHtml(t("unit"))}</th>${months.map((month, index) => `<th class="${index < 3 ? `sticky-col sticky-col-${index + 5}` : ""}">${escapeHtml(month)}</th>`).join("")}<th>${escapeHtml(t("fullYear"))}</th></tr>`;
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
  renderHeatmap(["单台制造费", "UPPH", "制造费率"], rowBy);

  const rows = visibleDashboardRows();
  let lastLabel = "";
  els.dashboardBody.innerHTML = rows.map((row) => {
    const localized = localizeDashboardRow(row, state.language);
    const family = metricFamily(row.label);
    const showLabel = row.label !== lastLabel;
    lastLabel = row.label;
    return `
      <tr class="dashboard-row family-${family}">
        <td class="sticky-col sticky-col-1"><span class="group-chip">${escapeHtml(metricFamilyLabel(family))}</span></td>
        <td class="merged-label sticky-col sticky-col-2">${showLabel ? escapeHtml(localized.label) : ""}</td>
        <td class="sticky-col sticky-col-3"><span class="scenario-chip ${scenarioClass(row.scenario)}">${escapeHtml(localized.scenario)}</span></td>
        <td class="sticky-col sticky-col-4">${escapeHtml(localized.unit)}</td>
        ${row.values.map((value, index) => {
          const tooltip = metricTooltip(row, index);
          const stickyClass = index < 3 ? ` sticky-col sticky-col-${index + 5}` : "";
          return `<td class="month-cell ${heatClass(row, index)}${stickyClass}" tabindex="0" data-metric-tooltip="${escapeHtml(tooltip)}">${formatDashboardValue(value, row.unit)}</td>`;
        }).join("")}
        <td class="month-cell full-year-cell" tabindex="0" data-metric-tooltip="${escapeHtml(metricTooltip(row, null))}">${formatDashboardValue(annualMetricValue(row), row.unit)}</td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="17" class="empty-cell">${t("noMatchingAccounts")}</td></tr>`;
}

function dashboardMetricsForGroup() {
  const map = {
    all: ["产量", "工作日", "用人", "UPPH", "制造费率", "单台制造费"],
    unit: ["产量", "产量累计"],
    time: ["工作日"],
    people: ["用人", "直接用人", "间接用人", "固定用人"],
    efficiency: ["UPPH", "产值", "产值累计"],
    cost: ["制造费率", "制造费率累计", "单台制造费", "单台制造费累计", "制造费用金额", "制造费用金额累计"]
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
  if (/产量/.test(labelText)) return "unit";
  if (/工作日|工时|出勤|标准工时/.test(labelText)) return "time";
  if (/用人|人数/.test(labelText)) return "people";
  if (/UPPH|效率|标准台|产值/.test(labelText)) return "efficiency";
  if (/单台|制造费率|制造费用/.test(labelText)) return "cost";
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
  if (row.label === "单台制造费") {
    const amount = state.dashboardRows.find((item) => item.label === "制造费用金额" && item.scenario === row.scenario);
    const volume = state.dashboardRows.find((item) => item.label === "产量" && item.scenario === row.scenario);
    return annualUnitCost(amount?.values || [], volume?.values || []);
  }
  if (row.label === "制造费率") {
    const cumulativeRow = state.dashboardRows.find((item) => item.label === "制造费率累计" && item.scenario === row.scenario);
    return lastFinite(cumulativeRow?.values || row.values);
  }
  if (row.label === "UPPH") {
    const stats = annualStats();
    return row.scenario === "同期" ? stats.upph25 : row.scenario === "26年" ? stats.upph26 : averageFinite(row.values);
  }
  if (row.label === "用人") return averageFinite(row.values);
  if (row.label?.includes("累计") || ["€/台", "%"].includes(row.unit)) return lastFinite(row.values);
  return sum(row.values);
}

function buildFiveKpiCards(scope) {
  const stats = scope === "annual" ? annualStats() : monthStats();
  const definitions = buildKpiDefinitions(state.language);
  const cards = definitions
    .filter((definition) => !["rate", "unit"].includes(definition.key))
    .map((definition) => ratioCard(
      definition.title,
      stats[`${definition.key}26`],
      stats[`${definition.key}25`],
      definition.unit,
      definition.direction,
      definition.formula
    ));
  const rate = definitions.find((definition) => definition.key === "rate");
  const unit = definitions.find((definition) => definition.key === "unit");
  cards.push({
    title: state.language === "zh" ? "费" : state.language === "tr" ? "Maliyet" : "Cost",
    type: "cost-combo",
    items: [
      ratioCard(rate?.title || "制造费率", stats.rate26, stats.rate25, rate?.unit || "%", rate?.direction || "lower", rate?.formula || ""),
      ratioCard(unit?.title || "单台制造费", stats.unit26, stats.unit25, unit?.unit || "€/台", unit?.direction || "lower", unit?.formula || "")
    ]
  });
  return cards;
}

function ratioCard(title, actual, same, unit, direction, formula) {
  const diff = diffNullableLocal(actual, same);
  const ratio = Number.isFinite(diff) && Number.isFinite(same) && same !== 0 ? diff / same : null;
  const good = ratio === null ? null : direction === "higher" ? ratio > 0 : ratio < 0;
  return {
    title,
    value: ratio,
    className: good === null ? "" : good ? "positive" : "negative",
    note: `${formatKpiRaw(actual, unit)} / ${formatKpiRaw(same, unit)}`,
    formula
  };
}

function formatKpiRaw(value, unit) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  if (unit === "%") return formatDashboardValue(value, unit);
  return `${formatPlain(value)}${unit}`;
}

function annualStats() {
  const rowBy = (labelText, scenario) => state.dashboardRows.find((row) => row.label === labelText && row.scenario === scenario);
  const amount26 = rowBy("制造费用金额", "26年");
  const amount25 = rowBy("制造费用金额", "同期");
  const volume26 = rowBy("产量", "26年");
  const volume25 = rowBy("产量", "同期");
  const days26 = rowBy("工作日", "26年");
  const days25 = rowBy("工作日", "同期");
  const people26 = rowBy("用人", "26年");
  const people25 = rowBy("用人", "同期");
  const output26 = rowBy("产值", "26年");
  const output25 = rowBy("产值", "同期");
  return {
    volume26: annualMetricValue(volume26),
    volume25: annualMetricValue(volume25),
    unit26: annualUnitCostFromRows(amount26, volume26),
    unit25: annualUnitCostFromRows(amount25, volume25),
    days26: sum(days26?.values || []),
    days25: sum(days25?.values || []),
    people26: averageFinite(people26?.values || []),
    people25: averageFinite(people25?.values || []),
    upph26: annualUpph(volume26?.values || [], people26?.values || [], [], days26?.values || []),
    upph25: annualUpph(volume25?.values || [], people25?.values || [], [], days25?.values || []),
    rate26: annualManufacturingRate(amount26?.values || [], output26?.values || []),
    rate25: annualManufacturingRate(amount25?.values || [], output25?.values || [])
  };
}

function monthStats() {
  const monthIndex = Math.max(0, Number(els.monthSelect.value || 1) - 1);
  const rowValue = (labelText, scenario) => state.dashboardRows.find((row) => row.label === labelText && row.scenario === scenario)?.values?.[monthIndex];
  const summary = state.result?.summary || {};
  return {
    volume26: rowValue("产量", "26年"),
    volume25: rowValue("产量", "同期"),
    unit26: summary.totalUnit26,
    unit25: summary.totalUnit25,
    days26: rowValue("工作日", "26年"),
    days25: rowValue("工作日", "同期"),
    people26: rowValue("用人", "26年"),
    people25: rowValue("用人", "同期"),
    upph26: rowValue("UPPH", "26年"),
    upph25: rowValue("UPPH", "同期"),
    rate26: rowValue("制造费率", "26年"),
    rate25: rowValue("制造费率", "同期")
  };
}

function kpiCardHtml(card, className) {
  if (card.type === "cost-combo") {
    return `
      <article class="${className} kpi-card cost-combo-card">
        <span>${escapeHtml(card.title)}</span>
        <div class="cost-combo-items">
          ${card.items.map((item) => `
            <div class="cost-combo-item ${item.className}">
              <b>${escapeHtml(item.title)}</b>
              <strong>${formatPercent(item.value)}</strong>
              <small>${escapeHtml(item.note)}</small>
            </div>
          `).join("")}
        </div>
      </article>
    `;
  }
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
  const monthIndex = Math.max(0, Number(state.result.month || 1) - 1);
  const volume = dashboardMonthValue("产量", "26年", monthIndex) || state.result.volume26 || 0;
  const volumeBudget = dashboardMonthValue("产量", "预算", monthIndex);
  const rows = (state.result.categories || [])
    .map((item) => enrichCategoryDiagnostic(item, monthIndex, volume, volumeBudget))
    .sort((a, b) => {
      const absA = Math.abs(a.unitDiff || 0);
      const absB = Math.abs(b.unitDiff || 0);
      if (absB !== absA) return absB - absA;
      return (b.unitDiff || 0) - (a.unitDiff || 0);
    });
  const total = totalCategoryDiagnostic(monthIndex, volume, volumeBudget);
  return total ? [total, ...rows] : rows;
}

function enrichCategoryDiagnostic(item, monthIndex, volume, volumeBudget) {
  const forecast = forecastCategoryForMonth(item.category, monthIndex);
  const amountBudget = chooseCategoryValue(item.amountBudget, forecast?.budgetAmount);
  const amount26 = chooseCategoryValue(item.amount26, forecast?.actualAmount);
  const unit25 = item.unit25;
  const unitBudget = unitFromAmount(amountBudget, volumeBudget) ?? item.unitBudget;
  const unit26 = unitFromAmount(amount26, volume) ?? item.unit26;
  const amount25 = item.amount25;
  const amountDiff = diffNullableLocal(amount26, amount25) ?? item.amountDiff;
  const unitDiff = diffNullableLocal(unit26, unit25) ?? item.unitDiff ?? (volume ? (amountDiff / volume) * 1000 : null);
  const unitBudgetDiff = diffNullableLocal(unit26, unitBudget) ?? item.unitBudgetDiff;
  return {
    ...item,
    amount26,
    amountBudget,
    amountDiff,
    budgetDiff: diffNullableLocal(amount26, amountBudget) ?? item.budgetDiff,
    unit26,
    unitBudget,
    unitDiff,
    unitBudgetDiff,
    manufacturingDiff: Number.isFinite(unitDiff) && volume ? unitDiff * volume / 1000 : item.manufacturingDiff,
    targetImpact: Number.isFinite(unitBudgetDiff) && volume ? unitBudgetDiff * volume / 1000 : null,
    yoyRate: unit25 ? unitDiff / unit25 : null,
    targetCompletion: targetCompletionRate(unit26, unitBudget)
  };
}

function buildCategoryReasonText(item, mode) {
  if (!state.result) return "";
  const category = item.category;
  const reasons = state.result.rows
    .filter((row) => row.category === category && state.analyses[analysisKey(state.result.month, row.code)]?.trim())
    .map((row) => state.analyses[analysisKey(state.result.month, row.code)].trim());
  if (!reasons.length && !item.isTotal) return "";
  if (item.isTotal) {
    const allReasons = state.result.rows
      .filter((row) => state.analyses[analysisKey(state.result.month, row.code)]?.trim())
      .map((row) => state.analyses[analysisKey(state.result.month, row.code)].trim());
    return allReasons.join("；");
  }
  return reasons.join("；");
}

function totalCategoryDiagnostic(monthIndex, volume, volumeBudget) {
  const unit25 = dashboardMonthValue("单台制造费", "同期", monthIndex);
  const unitBudget = dashboardMonthValue("单台制造费", "预算", monthIndex);
  const unit26 = dashboardMonthValue("单台制造费", "26年", monthIndex);
  if (![unit25, unitBudget, unit26].some(Number.isFinite)) return null;
  const unitDiff = diffNullableLocal(unit26, unit25);
  const unitBudgetDiff = diffNullableLocal(unit26, unitBudget);
  return {
    category: "总单台",
    unit25,
    unitBudget,
    unit26,
    unitDiff,
    unitBudgetDiff,
    manufacturingDiff: Number.isFinite(unitDiff) && volume ? unitDiff * volume / 1000 : null,
    targetImpact: Number.isFinite(unitBudgetDiff) && volume ? unitBudgetDiff * volume / 1000 : null,
    yoyRate: unit25 ? unitDiff / unit25 : null,
    targetCompletion: targetCompletionRate(unit26, unitBudget),
    isTotal: true
  };
}

function chooseCategoryValue(primary, fallback) {
  if (Number.isFinite(primary) && Math.abs(primary) > 0.0001) return primary;
  return Number.isFinite(fallback) ? fallback : primary;
}

function unitFromAmount(amount, volume) {
  return Number.isFinite(amount) && Number.isFinite(volume) && volume ? amount * 1000 / volume : null;
}

function dashboardMonthValue(labelText, scenario, monthIndex) {
  return state.dashboardRows.find((row) => row.label === labelText && row.scenario === scenario)?.values?.[monthIndex] ?? null;
}

function forecastCategoryForMonth(category, monthIndex) {
  const normalized = categoryAlias(category);
  const item = state.forecast?.categories?.find((row) => categoryAlias(row.labelZh || row.label) === normalized);
  if (!item) return null;
  return {
    actualAmount: item.amountMonths?.[monthIndex],
    budgetAmount: item.budgetMonths?.[monthIndex]
  };
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

function annualUnitCostFromRows(amountRow, volumeRow) {
  const amount = sum(amountRow?.values || []);
  const volume = sum(volumeRow?.values || []);
  return amount && volume ? (amount / volume) * 1000 : null;
}

function withFullYearValue(row, unitLabel) {
  return [...(row.values || []), annualMetricValue(row)];
}

function renderTrendSvg(metrics, rowBy) {
  renderTripleSeriesChart(els.trendChart, rowBy, "单台制造费", "€/台");
}

function renderWaterfallSvg(rowBy) {
  renderTripleSeriesChart(els.waterfallChart, rowBy, "制造费率", "%");
}

function renderTripleSeriesChart(svg, rowBy, labelText, unitLabel) {
  const actual = rowBy(labelText, "26年");
  const budget = rowBy(labelText, "预算");
  const same = rowBy(labelText, "同期");
  if (!actual || !budget || !same) {
    svg.innerHTML = emptySvgMessage(t("emptyForecast"));
    return;
  }
  const width = 980;
  const height = 310;
  const left = 54;
  const right = 24;
  const top = 44;
  const bottom = 46;
  const actualValues = withFullYearValue(actual, unitLabel);
  const budgetValues = withFullYearValue(budget, unitLabel);
  const sameValues = withFullYearValue(same, unitLabel);
  const labels = [...Array.from({ length: 12 }, (_, index) => localizeMonthLabel(index, state.language)), t("fullYear")];
  const all = [...actualValues, ...budgetValues, ...sameValues].filter(Number.isFinite);
  const bounds = unitLabel === "%" ? rateAxisBounds(all) : valueAxisBounds(all);
  const min = bounds.min;
  const max = bounds.max;
  const span = Math.max(max - min, 1e-9);
  const x = (index) => left + index * ((width - left - right) / 12);
  const y = (value) => top + (max - value) / span * (height - top - bottom);
  const series = [
    { row: actual, values: actualValues, color: "#42e0cd", name: t("actual26") },
    { row: budget, values: budgetValues, color: "#f6c85f", name: t("budget26") },
    { row: same, values: sameValues, color: "#91a7bd", name: t("same25") }
  ];
  const labelItems = [];
  const paths = series.map((item, seriesIndex) => {
    const points = item.values.map((value, index) => Number.isFinite(value) ? `${x(index)},${y(value)}` : null).filter(Boolean).join(" ");
    const dots = item.values.map((value, index) => {
      if (!Number.isFinite(value)) return "";
      labelItems.push({
        x: x(index),
        y: y(value),
        seriesIndex,
        color: item.color,
        text: formatDashboardValue(value, unitLabel)
      });
      return `
      <circle cx="${x(index)}" cy="${y(value)}" r="${item.row === actual ? 5 : 3.5}" fill="${item.color}" class="chart-dot">
        <title>${labels[index]} ${item.name}: ${formatDashboardValue(value, unitLabel)}</title>
      </circle>`;
    }).join("");
    return `<polyline points="${points}" fill="none" stroke="${item.color}" stroke-width="${item.row === actual ? 4 : 2.5}" class="animated-line" />${dots}`;
  }).join("");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.innerHTML = `
    <rect width="${width}" height="${height}" class="chart-bg" />
    ${labels.map((label, index) => `<line x1="${x(index)}" y1="${top}" x2="${x(index)}" y2="${height - bottom}" class="grid-line" /><text x="${x(index)}" y="${height - 16}" class="axis-label">${escapeSvg(label)}</text>`).join("")}
    ${paths}
    ${placeChartLabels(labelItems, top, height - bottom)}
    ${series.map((item, index) => `<circle cx="${left + index * 170}" cy="22" r="5" fill="${item.color}" /><text x="${left + 12 + index * 170}" y="27" class="legend">${escapeSvg(item.name)}</text>`).join("")}
  `;
}

function valueAxisBounds(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * 0.18, Math.abs(max) * 0.08, 1);
  return { min: min - pad, max: max + pad };
}

function rateAxisBounds(values) {
  const max = Math.max(...values, 0.01);
  return { min: 0, max: max * 1.42 };
}

function placeChartLabels(items, top, bottom) {
  const offsets = [-12, 17, -27];
  const groups = new Map();
  for (const item of items) {
    const key = Math.round(item.x);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ ...item, labelY: item.y + offsets[item.seriesIndex] });
  }
  const labels = [];
  for (const group of groups.values()) {
    group.sort((a, b) => a.labelY - b.labelY);
    for (let index = 1; index < group.length; index += 1) {
      if (group[index].labelY - group[index - 1].labelY < 15) group[index].labelY = group[index - 1].labelY + 15;
    }
    for (let index = group.length - 1; index >= 0; index -= 1) {
      if (group[index].labelY > bottom - 4) group[index].labelY = bottom - 4;
      if (index > 0 && group[index].labelY - group[index - 1].labelY < 15) group[index - 1].labelY = group[index].labelY - 15;
    }
    for (const item of group) {
      const yPos = Math.max(top + 10, Math.min(bottom - 4, item.labelY));
      labels.push(`<text x="${item.x}" y="${yPos}" class="chart-value-label chart-value-${item.seriesIndex}" fill="${item.color}">${escapeSvg(item.text)}</text>`);
    }
  }
  return labels.join("");
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
  const monthLabels = [...Array.from({ length: 12 }, (_, index) => localizeMonthLabel(index, state.language)), t("fullYear")];
  const rows = metrics.map((labelText) => {
    const actual = rowBy(labelText, "26年");
    const compare = rowBy(labelText, state.dashboardBasis === "same" ? "同期" : "预算");
    if (!actual || !compare) return null;
    const diffs = actual.values.map((value, index) => Number.isFinite(value) && Number.isFinite(compare.values[index]) ? value - compare.values[index] : null);
    diffs.push(diffNullableLocal(annualMetricValue(actual), annualMetricValue(compare)));
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

function metricTooltip(row, index) {
  const annual = index === null;
  const valueFor = (scenario) => {
    const item = state.dashboardRows.find((candidate) => candidate.label === row.label && candidate.scenario === scenario);
    return annual ? annualMetricValue(item) : item?.values?.[index];
  };
  const actual = valueFor("26年");
  const same = valueFor("同期");
  const budget = valueFor("预算");
  if (![actual, same, budget].some(Number.isFinite)) return "";
  const yoy = diffNullableLocal(actual, same);
  const budgetDiff = diffNullableLocal(actual, budget);
  const higherGood = row.direction === "higher";
  const optimized = Number.isFinite(yoy) ? (higherGood ? yoy >= 0 : yoy <= 0) : null;
  const completion = targetCompletionRate(actual, budget);
  return [
    `${annual ? t("fullYear") : localizeMonthLabel(index, state.language)} · ${localizeDashboardText("labels", row.label, state.language)}`,
    Number.isFinite(yoy) ? `<span class="${optimized ? "tooltip-good" : "tooltip-bad"}">${t("yoyVariance")} · ${t(optimized ? "better" : "worse")}: ${formatDashboardValue(Math.abs(yoy), row.unit)}</span>` : "",
    Number.isFinite(budgetDiff) ? `<span class="${tooltipDiffClass(budgetDiff, row.direction)}">${t("budgetVariance")}: ${formatDashboardValue(budgetDiff, row.unit)}</span>` : "",
    Number.isFinite(completion) ? `<span class="${completion >= 1 ? "tooltip-good" : "tooltip-bad"}">${t("targetCompletion")}: ${formatPercent(completion)}</span>` : ""
  ].filter(Boolean).join("\n");
}

function tooltipDiffClass(value, direction) {
  const good = direction === "higher" ? value >= 0 : value <= 0;
  return good ? "tooltip-good" : "tooltip-bad";
}

function installMetricHoverTooltip() {
  const tooltip = document.createElement("div");
  tooltip.className = "metric-hover-tooltip";
  tooltip.setAttribute("role", "tooltip");
  document.body.appendChild(tooltip);

  const show = (target, event) => {
    const text = target?.dataset?.metricTooltip;
    if (!text) return;
    tooltip.innerHTML = text;
    tooltip.classList.add("visible");
    positionMetricTooltip(tooltip, event?.clientX, event?.clientY, target);
  };
  const hide = () => tooltip.classList.remove("visible");

  document.addEventListener("pointerover", (event) => show(event.target.closest?.("[data-metric-tooltip]"), event));
  document.addEventListener("pointermove", (event) => {
    if (tooltip.classList.contains("visible")) positionMetricTooltip(tooltip, event.clientX, event.clientY);
  });
  document.addEventListener("pointerout", (event) => {
    if (event.target.closest?.("[data-metric-tooltip]")) hide();
  });
  document.addEventListener("focusin", (event) => show(event.target.closest?.("[data-metric-tooltip]"), null));
  document.addEventListener("focusout", (event) => {
    if (event.target.closest?.("[data-metric-tooltip]")) hide();
  });
}

function positionMetricTooltip(tooltip, clientX, clientY, target) {
  const rect = target?.getBoundingClientRect?.();
  const x = Number.isFinite(clientX) ? clientX + 14 : (rect?.left || 0) + 8;
  const y = Number.isFinite(clientY) ? clientY + 14 : (rect?.bottom || 0) + 8;
  const maxX = Math.max(8, window.innerWidth - tooltip.offsetWidth - 12);
  const maxY = Math.max(8, window.innerHeight - tooltip.offsetHeight - 12);
  tooltip.style.left = `${Math.min(x, maxX)}px`;
  tooltip.style.top = `${Math.min(y, maxY)}px`;
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
  els.summaryText.textContent = state.language === "zh"
    ? buildAutoSummary(state.result, state.analyses, null, forecast)
    : buildCompactSummary(state.result, state.analyses, null, forecast);
  if (els.analysisList) els.analysisList.innerHTML = "";
}

function buildCompactSummary(result, analyses, _factorSummary, forecast) {
  if (!result) return t("summaryEmpty");
  const highRows = result.rows.filter((row) => row.isHighImpact || Math.abs(row.unitDiff || 0) >= 0.5);
  const filled = highRows.filter((row) => (analyses[analysisKey(result.month, row.code)] || "").trim()).length;
  const direction = (result.summary.totalUnitDiff || 0) <= 0 ? t("better") : t("worse");
  const forecastText = forecast?.unitCost ? t("forecastUnitLine").replace("{unit}", formatUnit(forecast.unitCost)) : "";
  const reasonText = highRows
    .map((row) => analyses[analysisKey(result.month, row.code)]?.trim())
    .filter(Boolean)
    .slice(0, 5)
    .join("; ");
  if (state.language === "en") {
    return `${localizeMonthLabel(result.month - 1, state.language)} unit cost ${direction} by ${formatUnit(Math.abs(result.summary.totalUnitDiff || 0))} €/pc; MFG impact ${formatMoney(result.summary.manufacturingDiff)} K€. Reasons completed ${filled}/${highRows.length}${reasonText ? `: ${reasonText}` : "."} ${forecastText}`;
  }
  if (state.language === "tr") {
    return `${localizeMonthLabel(result.month - 1, state.language)} birim maliyet ${direction}: ${formatUnit(Math.abs(result.summary.totalUnitDiff || 0))} €/adet; üretim gider etkisi ${formatMoney(result.summary.manufacturingDiff)} K€. Nedenler ${filled}/${highRows.length}${reasonText ? `: ${reasonText}` : "."} ${forecastText}`;
  }
  return "";
}

function renderTable() {
  if (!state.result) {
    els.rowCount.textContent = `0 ${t("rowCountSuffix")}`;
    els.detailBody.innerHTML = `<tr><td colspan="13" class="empty-cell">${t("emptySap")}</td></tr>`;
    return;
  }
  const rows = visibleRows();
  els.rowCount.textContent = `${rows.length} ${t("rowCountSuffix")}`;
  els.detailBody.innerHTML =
    rows.map(rowToHtml).join("") || `<tr><td colspan="13" class="empty-cell">${t("noMatchingAccounts")}</td></tr>`;
  for (const textarea of els.detailBody.querySelectorAll("textarea")) {
    textarea.addEventListener("change", (event) => {
      const key = event.target.dataset.key;
      state.analyses[key] = event.target.value;
      if (els.analysisSaveStatus) els.analysisSaveStatus.textContent = t("unsavedChanges");
    });
    textarea.addEventListener("input", (event) => {
      state.analyses[event.target.dataset.key] = event.target.value;
      renderNarrative();
      renderChart();
    });
  }
}

async function submitCurrentMonthAnalyses() {
  if (!state.result) return;
  const author = els.analysisAuthor?.value.trim() || els.userName.value.trim();
  if (!author) {
    toast("请填写提报人姓名", true);
    return;
  }
  if (els.analysisSaveStatus) els.analysisSaveStatus.textContent = t("saving");
  try {
    const saves = state.result.rows
      .filter((row) => {
        const key = analysisKey(state.result.month, row.code);
        return state.analyses[key] !== undefined;
      })
      .map((row) => {
        const key = analysisKey(state.result.month, row.code);
        return store.saveAnalysis({
          key,
          month: state.result.month,
          code: row.code,
          text: state.analyses[key] || "",
          author
        });
      });
    await Promise.all(saves);
    state.analyses = await store.loadAnalyses();
    renderAll();
    if (els.analysisSaveStatus) els.analysisSaveStatus.textContent = t("analysisSubmitted");
    toast(t("analysisSubmitted"));
  } catch (error) {
    if (els.analysisSaveStatus) els.analysisSaveStatus.textContent = t("submitFailed");
    toast(error.message || String(error), true);
  }
}

async function submitProjects() {
  const rows = [...els.factorBody.querySelectorAll("tr[data-index]")];
  state.factors = rows.map((row, index) => {
    const existing = state.factors[Number(row.dataset.index)] || {};
    const get = (field) => row.querySelector(`[data-field="${field}"]`)?.value || "";
    return {
      ...existing,
      id: existing.id || String(index + 1),
      type: "decrease",
      lead: existing.lead || "",
      category: get("category"),
      strategy: get("strategy"),
      project: get("project"),
      owner: get("owner"),
      timing: get("timing"),
      plannedImpact: parseEditableNumber(get("plannedImpact")),
      actualCumulative: parseEditableNumber(get("actualCumulative")),
      progress: get("progress")
    };
  });
  if (els.factorSaveStatus) els.factorSaveStatus.textContent = t("saving");
  try {
    await store.saveFactors(state.factors);
    renderFactors();
    renderNarrative();
    renderSummaryCards();
    if (els.factorSaveStatus) els.factorSaveStatus.textContent = t("projectsSubmitted");
    toast(t("projectsSubmitted"));
  } catch (error) {
    if (els.factorSaveStatus) els.factorSaveStatus.textContent = t("submitFailed");
    toast(error.message || String(error), true);
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
  const yoyRate = Number.isFinite(row.unit25) && row.unit25 !== 0 ? row.unitDiff / row.unit25 : null;
  const targetDiff = Number.isFinite(row.unitBudget) && Number.isFinite(row.unit26) ? row.unit26 - row.unitBudget : null;
  const targetText = Number.isFinite(targetDiff) ? `目标差 ${formatUnit(targetDiff)} €/台` : "";
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
      <td class="${valueClass(yoyRate)}">${formatPercent(yoyRate)}</td>
      <td class="analysis-cell">${escapeHtml(targetText)}</td>
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
    const headers = categoryComparisonHeaders(state.language);
    els.categoryDiagnostics.innerHTML = `
      <div class="category-comparison-head">
        ${headers.map((header) => `<span>${escapeHtml(header)}</span>`).join("")}
      </div>
      ${rows.map((item) => `
        <button class="category-diagnostic category-comparison-row ${item.unitDiff > 0 ? "bad" : "good"} ${item.isTotal ? "total-row" : ""}" type="button" data-category="${escapeHtml(item.category)}" data-metric-tooltip="${escapeHtml(categoryTooltip(item))}">
          <span>${escapeHtml(localizeCategory(item.category, state.language))}</span>
          <em>${formatUnit(item.unit25)}</em>
          <em>${formatUnit(item.unitBudget)}</em>
          <strong class="${valueClass(item.unit26 - item.unit25)}">${formatUnit(item.unit26)}</strong>
          <strong class="${valueClass(item.unitDiff)}">${formatUnit(item.unitDiff)}</strong>
          <em class="${valueClass(item.yoyRate)}">${formatPercent(item.yoyRate)}</em>
          <em class="analysis-cell">${escapeHtml(buildCategoryReasonText(item, "target"))}</em>
          <em class="analysis-cell">${escapeHtml(buildCategoryReasonText(item, "yoy"))}</em>
        </button>
      `).join("")}`;
    for (const button of els.categoryDiagnostics.querySelectorAll("[data-category]")) {
      button.addEventListener("click", () => {
        els.categoryFilter.value = button.dataset.category;
        renderTable();
      });
    }
  }
}

function categoryTooltip(item) {
  const optimized = Number.isFinite(item.unitDiff) ? item.unitDiff <= 0 : null;
  return [
    `${localizeCategory(item.category, state.language)} · ${state.result?.month || ""}月`,
    Number.isFinite(item.unitDiff) ? `<span class="${optimized ? "tooltip-good" : "tooltip-bad"}">${t("yoyVariance")} · ${t(optimized ? "better" : "worse")}: ${formatUnit(Math.abs(item.unitDiff))} €/台</span>` : "",
    Number.isFinite(item.unitBudgetDiff) ? `<span class="${tooltipDiffClass(item.unitBudgetDiff, "lower")}">${t("budgetVariance")}: ${formatUnit(item.unitBudgetDiff)} €/台</span>` : "",
    Number.isFinite(item.targetCompletion) ? `<span class="${item.targetCompletion >= 1 ? "tooltip-good" : "tooltip-bad"}">${t("targetCompletion")}: ${formatPercent(item.targetCompletion)}</span>` : ""
  ].filter(Boolean).join("\n");
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
  renderProjectImpactCards();
  els.factorBody.innerHTML = state.factors.length
    ? state.factors.map((item, index) => factorRowHtml(item, index)).join("")
    : `<tr><td colspan="9" class="empty-cell">${t("emptyFactors")}</td></tr>`;
}

function factorRowHtml(item, index) {
  return `
    <tr data-index="${index}">
      <td><input data-field="category" value="${escapeHtml(item.category || "")}" /></td>
      <td><textarea data-field="strategy">${escapeHtml(item.strategy || "")}</textarea></td>
      <td><textarea data-field="project">${escapeHtml(item.project || "")}</textarea></td>
      <td><input data-field="owner" value="${escapeHtml(item.owner || "")}" /></td>
      <td><input data-field="timing" value="${escapeHtml(item.timing || "")}" /></td>
      <td><input data-field="plannedImpact" value="${formatEditable(item.plannedImpact)}" /></td>
      <td><input data-field="actualCumulative" value="${formatEditable(item.actualCumulative)}" /></td>
      <td><textarea data-field="progress">${escapeHtml(item.progress || "")}</textarea></td>
      <td><button class="delete-btn" type="button" data-delete-index="${index}" title="${t("delete")}">×</button></td>
    </tr>
  `;
}


function addFactor(type) {
  state.factors.push({
    id: `new-${Date.now()}`,
    type: "decrease",
    lead: "",
    category: "",
    strategy: "",
    project: "",
    owner: els.userName.value.trim(),
    timing: "",
    plannedImpact: 0,
    actualCumulative: 0,
    progress: "",
    budgetMonths: Array(12).fill(0),
    actualMonths: Array(12).fill(0)
  });
  els.exportBtn.disabled = false;
  renderFactors();
}

function seedCostReductionProjects() {
  return PROJECT_SEEDS.map(cloneProject);
}

function mergeMissingProjectSeeds(storedFactors) {
  const existingIds = new Set(storedFactors.map((item) => String(item.id)));
  return [
    ...storedFactors,
    ...PROJECT_SEEDS.filter((item) => !existingIds.has(String(item.id))).map(cloneProject)
  ];
}

function cloneProject(item) {
  return {
    ...item,
    budgetMonths: [...(item.budgetMonths || Array(12).fill(0))],
    actualMonths: [...(item.actualMonths || Array(12).fill(0))]
  };
}

function renderProjectImpactCards() {
  if (!els.projectImpactCards) return;
  if (state.factorMonth === 4) {
    const card = (title, value, note, klass = "") => `
      <div class="impact-card ${klass || (value < 0 ? "bad" : "good")}">
        <span>4月 · ${escapeHtml(title)}</span>
        <strong>${formatMoney(value)} K€</strong>
        <small>${escapeHtml(note)}</small>
      </div>`;
    els.projectImpactCards.innerHTML = `
      ${card("订单量/规模负影响", -1000, "三张表口径：订单量下降负影响100万欧", "bad")}
      ${card("通胀负影响", -400, "三张表口径：通胀负影响40万欧", "bad")}
      ${card("降费项目", 700, "新增63万欧 + 持续收益7万欧", "good")}
      ${card("园区分摊", 10, "园区分摊下降1万欧", "good")}
      <div><span>4月 · 上涨因素合计</span><strong class="bad">-1,400 K€</strong></div>
      <div><span>4月 · 下降因素合计</span><strong class="good">710 K€</strong></div>
    `;
    return;
  }
  const monthIndex = Math.max(0, Math.min(11, state.factorMonth - 1));
  const monthValue = (item, field, fallbackField) => {
    const series = Array.isArray(item[field]) ? item[field] : null;
    const value = Number(series?.[monthIndex]);
    if (Number.isFinite(value) && value !== 0) return value;
    return Number(item[fallbackField]) || 0;
  };
  const projectRows = state.factors.filter((item) => item.impactType === "project");
  const planned = sum(projectRows.map((item) => monthValue(item, "budgetMonths", "plannedImpact")));
  const actual = sum(projectRows.map((item) => monthValue(item, "actualMonths", "actualCumulative")));
  const impactBucket = (impactType) => {
    const rows = state.factors.filter((item) => item.impactType === impactType);
    return {
      planned: sum(rows.map((item) => monthValue(item, "budgetMonths", "plannedImpact"))),
      actual: sum(rows.map((item) => monthValue(item, "actualMonths", "actualCumulative")))
    };
  };
  const impacts = {
    scale: impactBucket("scale"),
    wage: impactBucket("wage"),
    inflation: impactBucket("inflation")
  };
  const monthLabel = `${state.factorMonth}月`;
  const impactCard = (title, data) => `
    <div class="impact-card ${data.actual <= 0 ? "bad" : "good"}">
      <span>${escapeHtml(monthLabel)} · ${escapeHtml(title)}</span>
      <strong>${formatMoney(data.actual)} K€</strong>
      <small>${escapeHtml(t("plannedShort"))}: ${formatMoney(data.planned)} K€ / ${escapeHtml(t("actualShort"))}: ${formatMoney(data.actual)} K€</small>
    </div>`;
  els.projectImpactCards.innerHTML = `
    ${impactCard(t("scaleImpact"), impacts.scale)}
    ${impactCard(t("wageImpact"), impacts.wage)}
    ${impactCard(t("inflationImpact"), impacts.inflation)}
    <div><span>${escapeHtml(monthLabel)} · ${escapeHtml(t("increaseTotal"))}</span><strong>${formatMoney(planned)} K€</strong></div>
    <div><span>${escapeHtml(monthLabel)} · ${escapeHtml(t("decreaseTotal"))}</span><strong>${formatMoney(actual)} K€</strong></div>
    <div><span>${escapeHtml(monthLabel)} · ${escapeHtml(t("netImpact"))}</span><strong class="${valueClass(actual - planned)}">${formatMoney(actual - planned)} K€</strong></div>
  `;
}

function buildProjectSummaryText() {
  const monthIndex = Math.max(0, Math.min(11, state.factorMonth - 1));
  const monthValue = (item, field, fallbackField) => {
    const series = Array.isArray(item[field]) ? item[field] : null;
    const value = Number(series?.[monthIndex]);
    if (Number.isFinite(value) && value !== 0) return value;
    return Number(item[fallbackField]) || 0;
  };
  const projectRows = state.factors.filter((item) => item.impactType === "project");
  const planned = sum(projectRows.map((item) => monthValue(item, "budgetMonths", "plannedImpact")));
  const actual = sum(projectRows.map((item) => monthValue(item, "actualMonths", "actualCumulative")));
  const impactActual = (type) => sum(state.factors.filter((item) => item.impactType === type).map((item) => monthValue(item, "actualMonths", "actualCumulative")));
  const top = projectRows
    .slice()
    .sort((a, b) => Math.abs(monthValue(b, "actualMonths", "actualCumulative")) - Math.abs(monthValue(a, "actualMonths", "actualCumulative")))
    .slice(0, 3)
    .map((item) => item.project || item.strategy || item.category)
    .join("、");
  const monthLabel = `${state.factorMonth}月`;
  return `${monthLabel}模型包含 ${state.factors.length} 项因素与降费项目；当月降费项目预计收益 ${formatMoney(planned)} K€，实际收益 ${formatMoney(actual)} K€，达成率 ${formatPercent(planned ? actual / planned : null)}。规模变化、工资上涨、通胀影响分别为 ${formatMoney(impactActual("scale"))} K€、${formatMoney(impactActual("wage"))} K€、${formatMoney(impactActual("inflation"))} K€；重点项目为 ${top || "待补充"}。`;
}

function legacySeedCostReductionProjects() {
  return [
    {
      id: "project-carryover",
      type: "decrease",
      lead: "土方",
      category: "延续项目",
      strategy: "25年延续项目",
      project: "轮毂和油底壳螺钉紧固自动化；QS部件喂料自动化；人力成本减少",
      owner: "李想",
      timing: "2026年1月",
      plannedImpact: 73.57,
      actualCumulative: 70.79,
      progress: "持续收益"
    },
    {
      id: "project-upph",
      type: "decrease",
      lead: "土方",
      category: "提效",
      strategy: "提升单台生产效率，减少单台成本",
      project: "UPH提升至130",
      owner: "李想",
      timing: "2026年1月",
      plannedImpact: 72.67,
      actualCumulative: 21.25,
      progress: "已落地"
    },
    {
      id: "project-contract",
      type: "decrease",
      lead: "土方",
      category: "直接员工降费",
      strategy: "用工结构调整",
      project: "蓝领合同工替换高工资正式工",
      owner: "李想",
      timing: "2026年1月",
      plannedImpact: 189,
      actualCumulative: 35,
      progress: "已替换81人"
    },
    {
      id: "project-balanced",
      type: "decrease",
      lead: "土方、中方",
      category: "直接员工降费",
      strategy: "锁定到月需求、生产、库存，均衡生产",
      project: "26年不产生分流费、加班费",
      owner: "李想",
      timing: "2026年1月",
      plannedImpact: 400,
      actualCumulative: 38.1,
      progress: "1月加班费减少5,100欧，2月减少3,000欧"
    },
    {
      id: "project-depreciation",
      type: "decrease",
      lead: "中方",
      category: "折旧降费",
      strategy: "折旧费用优化",
      project: "部分设备、模具折旧年限10年调整至30年",
      owner: "李想",
      timing: "2026年4月",
      plannedImpact: 530,
      actualCumulative: 530,
      progress: "已落地53万欧，全年预算160万欧"
    },
    {
      id: "project-obsolete",
      type: "decrease",
      lead: "中方、土方",
      category: "降存货跌价准备",
      strategy: "超期原材料、半成品消耗",
      project: "超期原材料加工成半成品",
      owner: "李想",
      timing: "2026年4月",
      plannedImpact: 88,
      actualCumulative: 88,
      progress: "已落地"
    }
  ];
}

function legacyBuildProjectSummaryText() {
  const planned = sum(state.factors.map((item) => Number(item.plannedImpact) || 0));
  const actual = sum(state.factors.map((item) => Number(item.actualCumulative) || 0));
  const top = state.factors
    .slice()
    .sort((a, b) => Math.abs(b.actualCumulative || 0) - Math.abs(a.actualCumulative || 0))
    .slice(0, 3)
    .map((item) => item.project || item.strategy || item.category)
    .join("、");
  return `当前降费项目库共 ${state.factors.length} 项，预计收益 ${formatMoney(planned)} K€，实际累计收益 ${formatMoney(actual)} K€，达成率 ${formatPercent(planned ? actual / planned : null)}。重点项目为 ${top || "待补充"}。`;
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
  if (els.jiangStatus) els.jiangStatus.textContent = state.jiangyue ? `${t("importJiang")}: ${state.jiangFileName}` : t("importJiang");
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
  if (unit === "%") {
    return `${(Number(value) * 100).toLocaleString("zh-CN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  }
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
