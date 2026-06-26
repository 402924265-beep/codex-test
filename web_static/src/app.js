import {
  BASELINE_25_BY_MONTH,
  BUDGET_26_BY_MONTH,
  CATEGORY_ORDER
} from "./baseline-data.js?v=20260612-duplicate-accounts-v23";
import { MONTHS, extractActualFromWorkbook, inferActualMonthCountFromFileName } from "./parser.js?v=20260615-total-reconcile-v25";
import { buildReconciliation } from "./reconcile.js?v=20260615-category-collapse-v29";
import { exportAnalysisWorkbook } from "./export.js?v=20260615-dynamic-month-v28";
import { loadXlsx } from "./xlsx-loader.js?v=20260612-duplicate-accounts-v23";
import { createStore } from "./store.js?v=20260612-duplicate-accounts-v23";
import {
  extractForecastWorkbook,
  buildAnnualDashboardRows,
  monthSnapshot,
  localizeCategory,
  localizeDashboardRow,
  localizeDashboardText,
  localizeMonthLabel
} from "./forecast-parser.js?v=20260612-duplicate-accounts-v23";
import {
  analysisKey,
  analysisReason,
  analysisReasons,
  buildAutoSummary,
  buildFactorSummary,
  parseEditableNumber,
  serializeAnalysisReasons
} from "./workbench.js?v=20260615-dynamic-month-v28";
import { extractJiangYueWorkbook } from "./jiangyue-parser.js?v=20260612-duplicate-accounts-v23";
import {
  annualManufacturingRate,
  annualUnitCost,
  annualUpph,
  averageFinite,
  targetCompletionRate
} from "./metrics.js?v=20260612-duplicate-accounts-v23";
import { buildKpiDefinitions, categoryComparisonHeaders } from "./presentation.js?v=20260615-dynamic-month-v28";
import { PROJECT_SEEDS, localizeProjectField, localizeProjectText, projectImpactSummary, projectTextFields } from "./project-data.js?v=20260616-project-i18n-v33";
import { categoryAlias } from "./category-alias.js?v=20260612-duplicate-accounts-v23";
import { ACCOUNT_BUDGET_DW_BY_MONTH, ACCOUNT_FORECAST_DW_BY_MONTH } from "./account-plan-data.js?v=20260612-duplicate-accounts-v23";
import { localizeAccountLabel } from "./account-labels.js?v=20260615-account-labels-v31";
import { COOKING_UNIT } from "./cooking-data.js?v=20260625c";

const VERSION = "20260617-public-rolling-v37";

const i18n = {
  zh: {
    appTitle: "洗碗机制造费三张表工作台",
    appSubtitle: "导入财务数据，输出全年驾驶舱、月度差异、项目因素",
    language: "语言",
    author: "填写人",
    importForecast: "导入预测表",
    importJiang: "导入国内财务表",
    importSap: "导入实际表",
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
    sameCost: "同期费用 K€",
    previousCost: "上月费用 K€",
    currentCost: "本月费用 K€",
    accountDescription: "科目描述",
    descriptionPlaceholder: "单价 * 数量",
    attachmentButton: "附件",
    attachmentHint: "本地选择，不上传",
    noPersonalAttachment: "不传个人明细",
    budget26: "26预算",
    previousActual: "上月实际",
    actualVsSame: "实际-同期",
    actualVsPrevious: "实际-上月",
    unitDiff: "同比单台差",
    momUnitDiff: "环比单台差",
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
    redBadGreenGood: "红色为差异恶化，绿色为差异优化",
    accountDetail: "科目明细",
    account: "账户",
    analysis: "同比差异分析",
    targetVarianceAnalysis: "目标差异分析",
    yoyVarianceAnalysis: "同比差异分析",
    momVarianceAnalysis: "环比差异分析",
    yoyPercent: "同比%",
    momPercent: "环比%",
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
    plannedImpact: "预计影响 K€",
    impact: "实际月累差额 K€",
    progress: "进展",
    action: "操作",
    all: "全部",
    unitOver: "同比/环比单台差≥0.5",
    blankReason: "待填写原因",
    sortUnit: "按同比单台差异",
    sortMomUnit: "按环比单台差异",
    sortAmount: "按同比额差异",
    sortMomAmount: "按环比额差异",
    sortCode: "按账户编码",
    increase: "上涨因素",
    decrease: "下降因素",
    delete: "删",
    emptyForecast: "导入预测表文件后显示1-12月全年驾驶舱",
    emptySap: "导入SAP报表后显示科目明细",
    waitingForecast: "等待预测表文件",
    waitingSap: "待导入实际表",
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
    monthlySummaryEmpty: "导入实际表后生成月度总结。",
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
    loadedSap: "已读取实际表",
    loadedJiang: "已读取国内财务表",
    noTimeData: "工时/工作日数据待接入",
    actualLine: "26年",
    budgetLine: "预算",
    sameLine: "同期",
      actualMonths: "实际",
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
    ,collapsedCategoryCompare: "{count}个大科目按汇总比较",
    fillAuthorName: "请填写提报人姓名",
    annualTopCategoryFallback: "重点大科目",
    tooltipCost: "费用",
    tooltipUnit: "单台",
    tooltipSame: "同期",
    tooltipPrevious: "上月",
    tooltipCurrent: "本月",
    tooltipAmountYoy: "费用同比",
    tooltipAmountMom: "费用环比",
    tooltipUnitYoy: "单台同比",
    tooltipUnitMom: "单台环比",
    tooltipMfgVariance: "制造费差额",
    summaryEmpty: "导入 SAP 报表后，本月摘要会根据下方科目原因自动汇总。",
    better: "优化",
    worse: "恶化",
    forecastUnitLine: "；5+7本月单台 {unit} €/台",
    compactSummary: "{month}单台同比{direction} {unitDiff} €/台，制造费差额 {mfgDiff} K€；重点原因 {filled}/{total} 已填写；上涨因素 {increase} K€，下降因素 {decrease} K€{forecast}",
    noMatchingAccounts: "没有符合条件的科目",
    analysisSaved: "原因已保存",
    projectsSaved: "项目已保存",
    emptyFactors: "添加正式降费项目后，这里会形成项目库。",
    localStore: "本机保存"
    ,mfgDiffFormula: "单台差 × 26产量",
    keurYtd: "K€累计",
    unit25: "25单台",
    previousUnit: "上月单台",
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
    importSap: "Import actual table",
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
    sameCost: "2025 cost K€",
    previousCost: "Previous cost K€",
    currentCost: "Current cost K€",
    accountDescription: "Account description",
    descriptionPlaceholder: "Unit price × quantity",
    attachmentButton: "Attachment",
    attachmentHint: "Local only, not uploaded",
    noPersonalAttachment: "No personal details",
    budget26: "2026 budget",
    previousActual: "Previous month",
    actualVsSame: "Actual vs same",
    actualVsPrevious: "Actual vs previous",
    unitDiff: "YoY unit variance",
    momUnitDiff: "MoM unit variance",
    manufacturingDiff: "MFG variance",
    factorNet: "Net factor impact",
    dashboardTitle: "Year Dashboard",
    dashboardHint: "Upload the 5+7 forecast to view all 12 months in one screen.",
    monthSummary: "Monthly Summary & Root Causes",
    summaryHint: "Auto summary around unit cost, value variance, and key accounts.",
    autoFromSite: "Generated from website inputs",
    heroUnit: "Unit cost",
    heroUnitDiff: "Unit YoY",
    heroAmountDiff: "MFG variance",
    heroOpen: "Open items",
    categoryCompare: "Category Comparison",
    redBadGreenGood: "Red means worse variance, green means better variance",
    accountDetail: "Account Detail",
    account: "Account",
    analysis: "YoY variance",
    targetVarianceAnalysis: "Target variance",
    yoyVarianceAnalysis: "YoY variance",
    momVarianceAnalysis: "MoM variance",
    yoyPercent: "YoY %",
    momPercent: "MoM %",
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
    plannedImpact: "Forecast impact K€",
    impact: "Actual YTD impact K€",
    progress: "Progress",
    action: "Action",
    all: "All",
    unitOver: "YoY/MoM unit gap ≥0.5",
    blankReason: "Missing reason",
    sortUnit: "By YoY unit variance",
    sortMomUnit: "By MoM unit variance",
    sortAmount: "By YoY amount variance",
    sortMomAmount: "By MoM amount variance",
    sortCode: "By account code",
    increase: "Increase",
    decrease: "Decrease",
    delete: "Del",
    emptyForecast: "Import a 5+7 forecast file to show the 12-month dashboard",
    emptySap: "Import the actual table to show account details",
    waitingForecast: "Waiting for 5+7 forecast",
    waitingSap: "SAP actuals not imported",
    waitingForecastPill: "5+7 forecast not imported",
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
    annualSummaryEmpty: "Import the 5+7 forecast to generate the annual summary.",
    monthlySummaryEmpty: "Import the actual table to generate the monthly summary.",
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
    importedForecast: "Imported 5+7",
    importedSap: "Imported SAP",
    loadedForecast: "Loaded 5+7 forecast",
    loadedSap: "Loaded SAP actuals",
    loadedJiang: "Loaded domestic finance table",
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
    ,collapsedCategoryCompare: "{count} categories compared by total",
    fillAuthorName: "Please enter the submitter name",
    annualTopCategoryFallback: "key categories",
    tooltipCost: "Cost",
    tooltipUnit: "Unit cost",
    tooltipSame: "Same period",
    tooltipPrevious: "Previous month",
    tooltipCurrent: "Current month",
    tooltipAmountYoy: "Cost YoY",
    tooltipAmountMom: "Cost MoM",
    tooltipUnitYoy: "Unit YoY",
    tooltipUnitMom: "Unit MoM",
    tooltipMfgVariance: "MFG variance",
    summaryEmpty: "After importing SAP actuals, this month summary will be generated from account-level reasons below.",
    better: "better",
    worse: "worse",
    forecastUnitLine: "; 5+7 unit cost {unit} €/pc",
    compactSummary: "{month} unit cost is {direction} by {unitDiff} €/pc YoY; MFG variance {mfgDiff} K€; key reasons completed {filled}/{total}; increases {increase} K€, decreases {decrease} K€{forecast}",
    noMatchingAccounts: "No matching accounts",
    analysisSaved: "Reason saved",
    projectsSaved: "Projects saved",
    emptyFactors: "Add formal cost reduction projects to build the project library.",
    localStore: "Local save"
    ,mfgDiffFormula: "Unit gap × 2026 volume",
    keurYtd: "K€ YTD",
    unit25: "2025 unit",
    previousUnit: "Previous month unit",
    unit26: "2026 unit"
    ,unitEuroPc: "€/pc",
    emptyCategoryChart: "Import April actual table to show category comparison"
  },
  tr: {
    appTitle: "Bulaşık Makinesi Üretim Gideri",
    appSubtitle: "Finans verisini yükle, üç analiz tablosunu üret",
    language: "Dil",
    author: "Yazan",
    importForecast: "5+7 tahmin yükle",
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
    sameCost: "2025 gider K€",
    previousCost: "Önceki ay gider K€",
    currentCost: "Bu ay gider K€",
    accountDescription: "Hesap açıklaması",
    descriptionPlaceholder: "Birim fiyat × miktar",
    attachmentButton: "Ek",
    attachmentHint: "Yerel seçim, yüklenmez",
    noPersonalAttachment: "Kişisel detay yok",
    budget26: "2026 bütçe",
    previousActual: "Önceki ay",
    actualVsSame: "Gerçekleşen - dönem",
    actualVsPrevious: "Gerçekleşen - önceki ay",
    unitDiff: "Yıllık birim fark",
    momUnitDiff: "Aylık birim fark",
    manufacturingDiff: "Üretim farkı",
    factorNet: "Net faktör etkisi",
    dashboardTitle: "Yıllık Veri Panosu",
    dashboardHint: "5+7 tahmini yükleyince 12 ay tek ekranda görünür.",
    monthSummary: "Aylık Özet ve Nedenler",
    summaryHint: "Birim maliyet, tutar farkı ve önemli hesaplardan otomatik özet.",
    autoFromSite: "Site girişlerinden üretildi",
    heroUnit: "Birim maliyet",
    heroUnitDiff: "Birim YoY",
    heroAmountDiff: "Üretim farkı",
    heroOpen: "Açık konu",
    categoryCompare: "Kategori Karşılaştırma",
    redBadGreenGood: "Kırmızı fark kötüleşmesi, yeşil fark iyileşmesi",
    accountDetail: "Hesap Detayı",
    account: "Hesap",
    analysis: "Yıllık fark",
    targetVarianceAnalysis: "Hedef fark",
    yoyVarianceAnalysis: "Yıllık fark",
    momVarianceAnalysis: "Aylık fark",
    yoyPercent: "YoY %",
    momPercent: "Aylık %",
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
    plannedImpact: "Tahmini etki K€",
    impact: "Gerçekleşen YTD etki K€",
    progress: "İlerleme",
    action: "İşlem",
    all: "Tümü",
    unitOver: "Yıllık/Aylık birim fark ≥0.5",
    blankReason: "Neden eksik",
    sortUnit: "Yıllık birim farka göre",
    sortMomUnit: "Aylık birim farka göre",
    sortAmount: "Yıllık tutar farkına göre",
    sortMomAmount: "Aylık tutar farkına göre",
    sortCode: "Hesap koduna göre",
    increase: "Artış",
    decrease: "Azalış",
    delete: "Sil",
    emptyForecast: "12 aylık pano için 5+7 tahmin dosyasını yükleyin",
    emptySap: "Hesap detayları için SAP gerçekleşen dosyasını yükleyin",
    waitingForecast: "5+7 tahmin bekleniyor",
    waitingSap: "SAP gerçekleşen yüklenmedi",
    waitingForecastPill: "5+7 tahmin yüklenmedi",
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
    annualSummaryEmpty: "Yıllık özet için 5+7 tahminini yükleyin.",
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
    importedForecast: "5+7 içe aktarıldı",
    importedSap: "SAP içe aktarıldı",
    loadedForecast: "5+7 tahmin yüklendi",
    loadedSap: "SAP gerçekleşen yüklendi",
    loadedJiang: "Yurtiçi finans tablosu yüklendi",
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
    ,collapsedCategoryCompare: "{count} kategori toplam bazında karşılaştırıldı",
    fillAuthorName: "Lütfen gönderen adını girin",
    annualTopCategoryFallback: "ana kategoriler",
    tooltipCost: "Gider",
    tooltipUnit: "Birim maliyet",
    tooltipSame: "Aynı dönem",
    tooltipPrevious: "Önceki ay",
    tooltipCurrent: "Bu ay",
    tooltipAmountYoy: "Gider yıllık",
    tooltipAmountMom: "Gider aylık",
    tooltipUnitYoy: "Birim yıllık",
    tooltipUnitMom: "Birim aylık",
    tooltipMfgVariance: "Üretim gideri farkı",
    summaryEmpty: "SAP gerçekleşen yüklendikten sonra aylık özet aşağıdaki hesap nedenlerinden üretilecek.",
    better: "iyileşti",
    worse: "kötüleşti",
    forecastUnitLine: "; 5+7 birim maliyet {unit} €/adet",
    compactSummary: "{month} birim maliyet YoY {direction}: {unitDiff} €/adet; üretim farkı {mfgDiff} K€; ana nedenler {filled}/{total}; artış {increase} K€, azalış {decrease} K€{forecast}",
    noMatchingAccounts: "Eşleşen hesap yok",
    analysisSaved: "Neden kaydedildi",
    projectsSaved: "Projeler kaydedildi",
    emptyFactors: "Resmi maliyet düşürme projesi ekleyin.",
    localStore: "Yerel kayıt"
    ,mfgDiffFormula: "Birim fark × 2026 hacim",
    keurYtd: "K€ YTD",
    unit25: "2025 birim",
    previousUnit: "Önceki ay birim",
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
  descriptionAttachments: {},
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
  actualMonthCount: 4,
  rollingForecastDrafts: loadRollingForecastDrafts(),
  rollingForecastSubmitted: loadRollingForecastSubmitted(),
  rollingSelectedCode: null,
  rollingTaskFilter: "all",
  rollingViewMode: "fill",
  activeUnit: "cooking",
  sapFileName: "",
  forecastFileName: "",
  jiangFileName: ""
};

const unitSnapshots = {
  dishwasher: null,
  cooking: null
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
  forecastWorkspace: document.getElementById("forecastWorkspace"),
  detailBody: document.getElementById("detailBody"),
  sameCostHeader: document.getElementById("sameCostHeader"),
  previousCostHeader: document.getElementById("previousCostHeader"),
  currentCostHeader: document.getElementById("currentCostHeader"),
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
  businessShell: document.querySelector(".business-shell"),
  sidebarToggle: document.getElementById("sidebarToggle"),
  unitButtons: document.querySelectorAll("[data-unit]"),
  unitName: document.getElementById("unitName"),
  unitSubtitle: document.getElementById("unitSubtitle"),
  unitSource: document.getElementById("unitSource"),
  toast: document.getElementById("toast")
};

bootstrap();

async function bootstrap() {
  bindEvents();
  setSidebarCollapsed(localStorage.getItem("dw.sidebarCollapsed") === "1");
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
  await loadBundledFiles();
  saveUnitSnapshot("dishwasher");
  if (state.activeUnit === "cooking") {
    applyCookingUnit();
  } else {
    updateUnitChrome("dishwasher");
  }
}

async function loadBundledFiles() {
  const config = globalThis.window?.DW_BUNDLED_FILES;
  if (!config) return;
  const errors = [];
  const load = async (url, name, handler) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${name}: ${response.status}`);
      const file = new File([await response.blob()], name, {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      await handler({ target: { files: [file] } });
    } catch (e) {
      errors.push(e.message || String(e));
    }
  };
  await load(config.forecast, config.forecastName || "01_Forecast_4plus8.xlsx", handleForecastFileChange);
  await load(config.jiang, config.jiangName || "02_Domestic_Finance_4plus8.xlsx", handleJiangFileChange);
  await load(config.sap, config.sapName || "03_Dishwasher_May_Actual.xlsx", handleSapFileChange);
  if (config.language && i18n[config.language]) {
    els.languageSelect.value = config.language;
    applyLanguage(config.language);
  }
  // Save snapshot even if some files failed, so user sees partial data or empty state
  saveUnitSnapshot("dishwasher");
  if (errors.length) {
    toast(`内置文件加载不完整: ${errors.join("; ")}`, true);
  }
}

async function switchBusinessUnit(unitId) {
  if (!unitId || unitId === state.activeUnit) return;
  saveUnitSnapshot(state.activeUnit);
  if (unitId === "dishwasher") {
    const restored = restoreUnitSnapshot("dishwasher");
    if (!restored) {
      await loadBundledFiles();
    }
    updateUnitChrome("dishwasher");
    renderAll();
    return;
  }
  if (unitId === "cooking") {
    applyCookingUnit();
  }
}

function setSidebarCollapsed(collapsed) {
  els.businessShell?.classList.toggle("sidebar-collapsed", Boolean(collapsed));
  if (els.sidebarToggle) {
    els.sidebarToggle.setAttribute("aria-label", collapsed ? "展开业务导航" : "收起业务导航");
    els.sidebarToggle.setAttribute("title", collapsed ? "展开业务导航" : "收起业务导航");
  }
}

function saveUnitSnapshot(unitId) {
  if (!unitId) return;
  unitSnapshots[unitId] = {
    workbook: state.workbook,
    forecast: state.forecast,
    jiangyue: state.jiangyue,
    dashboardRows: clonePlain(state.dashboardRows),
    resultByMonth: new Map(state.resultByMonth),
    result: clonePlain(state.result),
    analyses: clonePlain(state.analyses),
    descriptionAttachments: clonePlain(state.descriptionAttachments),
    factors: clonePlain(state.factors),
    factorSummary: clonePlain(state.factorSummary),
    language: state.language,
    dashboardGroup: state.dashboardGroup,
    dashboardBasis: state.dashboardBasis,
    metricScenario: state.metricScenario,
    metricMonth: state.metricMonth,
    metricStatus: state.metricStatus,
    metricIndicator: state.metricIndicator,
    dashboardTableOpen: state.dashboardTableOpen,
    factorMonth: state.factorMonth,
    actualMonthCount: state.actualMonthCount,
    sapFileName: state.sapFileName,
    forecastFileName: state.forecastFileName,
    jiangFileName: state.jiangFileName
  };
}

function restoreUnitSnapshot(unitId) {
  const snapshot = unitSnapshots[unitId];
  if (!snapshot) return false;
  Object.assign(state, {
    workbook: snapshot.workbook,
    forecast: snapshot.forecast,
    jiangyue: snapshot.jiangyue,
    dashboardRows: clonePlain(snapshot.dashboardRows),
    resultByMonth: new Map(snapshot.resultByMonth),
    result: clonePlain(snapshot.result),
    analyses: clonePlain(snapshot.analyses),
    descriptionAttachments: clonePlain(snapshot.descriptionAttachments),
    factors: clonePlain(snapshot.factors),
    factorSummary: clonePlain(snapshot.factorSummary),
    dashboardGroup: snapshot.dashboardGroup,
    dashboardBasis: snapshot.dashboardBasis,
    metricScenario: snapshot.metricScenario,
    metricMonth: snapshot.metricMonth,
    metricStatus: snapshot.metricStatus,
    metricIndicator: snapshot.metricIndicator,
    dashboardTableOpen: snapshot.dashboardTableOpen,
    factorMonth: snapshot.factorMonth,
    actualMonthCount: snapshot.actualMonthCount,
    sapFileName: snapshot.sapFileName,
    forecastFileName: snapshot.forecastFileName,
    jiangFileName: snapshot.jiangFileName,
    activeUnit: unitId
  });
  syncMonthSelectFromState();
  syncStatusPills();
  return true;
}

function applyCookingUnit() {
  state.activeUnit = "cooking";
  state.forecast = {
    source: "cooking built-in",
    months: COOKING_UNIT.months,
    parsedAt: new Date().toISOString()
  };
  state.jiangyue = { source: COOKING_UNIT.sources.headcount };
  state.dashboardRows = clonePlain(COOKING_UNIT.dashboardRows);
  appendMissingCookingTargetRows();
  state.resultByMonth = new Map();
  if (COOKING_UNIT.monthlyResults) {
    for (const [month, data] of Object.entries(COOKING_UNIT.monthlyResults)) {
      state.resultByMonth.set(Number(month), clonePlain(data));
    }
  }
  state.result = clonePlain(COOKING_UNIT.monthlyResult);
  state.actualMonthCount = COOKING_UNIT.actualMonthCount;
  state.factors = normalizeFactorsForUi(clonePlain(COOKING_UNIT.projects).map((item) => ({
    ...item,
    impactType: cookingProjectImpactType(item)
  })));
  state.factorMonth = COOKING_UNIT.monthlyResult.month;
  state.sapFileName = "03_CK_May_Actual.xlsx";
  state.forecastFileName = "厨电成本数据内置模型";
  state.jiangFileName = "04_CK_JiangYue.xlsx";
  state.metricScenario = "all";
  state.metricMonth = "all";
  state.metricStatus = "all";
  state.metricIndicator = "all";
  state.rollingViewMode = "variance";
  state.analyses = cookingInitialAnalyses();
  state.descriptionAttachments = {};
  syncMonthSelectFromState();
  syncStatusPills();
  updateUnitChrome("cooking");
  els.toast.classList.remove("show");
  recalcFactors();
  renderAll();
}

function appendCookingWorkdayRows() {
  const workdayValues = {
    "同期": 20,
    "预算": 14,
    "26年": 14
  };
  Object.entries(workdayValues).forEach(([scenario, value]) => {
    const values = Array.from({ length: 12 }, () => null);
    values[4] = value;
    state.dashboardRows.push({
      label: "工作日",
      metric: "工作日",
      scenario,
      unit: "天",
      values,
      annual: null,
      direction: "higher"
    });
  });
}

function appendMissingCookingTargetRows() {
  const labels = [...new Set(state.dashboardRows.map((row) => row.label))];
  labels.forEach((label) => {
    const rows = state.dashboardRows.filter((row) => row.label === label);
    if (rows.some((row) => row.scenario === "预算" || row.scenario === "目标")) return;
    const template = rows[0];
    if (!template) return;
    state.dashboardRows.push({
      label,
      metric: template.metric || label,
      scenario: "预算",
      unit: template.unit,
      values: Array.from({ length: 12 }, () => null),
      annual: null,
      direction: template.direction || "lower"
    });
  });
}

function updateUnitChrome(unitId) {
  for (const button of els.unitButtons || []) {
    button.classList.toggle("active", button.dataset.unit === unitId);
  }
  if (els.unitName) {
    els.unitName.textContent = unitId === "cooking" ? COOKING_UNIT.name : "洗碗机";
  }
  if (els.unitSubtitle) {
    els.unitSubtitle.textContent = unitId === "cooking"
      ? "厨电制造费用经营驾驶舱"
      : "洗碗机制造费用经营驾驶舱";
  }
  if (els.unitSource) {
    els.unitSource.textContent = unitId === "cooking"
      ? "当前：厨电工厂 · 已内置同期、预算、实际、人数、降费项目"
      : "当前：洗碗机 · 已内置5+7预测、国内财务表、May Actual";
  }
  const headerTitle = document.querySelector(".app-header h1");
  const headerSubtitle = document.querySelector(".app-header p");
  if (headerTitle) {
    headerTitle.textContent = unitId === "cooking" ? "厨电制造费用经营驾驶舱" : "洗碗机制造费用经营驾驶舱";
  }
  if (headerSubtitle) {
    headerSubtitle.textContent = unitId === "cooking"
      ? "整合同期、预算、实际、人数与降费项目，形成费用发生制经营视图"
      : "导入财务数据，输出全年驾驶舱、月度差异、项目因素";
  }
  document.title = unitId === "cooking" ? "厨电制造费用经营驾驶舱" : "洗碗机制造费用经营驾驶舱";
}

function cookingProjectImpactType(item) {
  const text = `${item.category || ""} ${item.strategy || ""} ${item.project || ""}`;
  if (/订单量|规模/.test(text)) return "scale";
  if (/人工|工资|员工|白领/.test(text)) return "wage";
  if (/通胀/.test(text)) return "inflation";
  return "project";
}

function syncMonthSelectFromState() {
  const months = [...state.resultByMonth.keys()].sort((a, b) => a - b);
  if (months.length) {
    els.monthSelect.innerHTML = months.map((month) => `<option value="${month}">${localizeMonthLabel(month - 1, state.language)}</option>`).join("");
    els.monthSelect.value = String(months.at(-1));
  }
  if (els.factorMonthSelect) {
    els.factorMonthSelect.innerHTML = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      return `<option value="${month}">${localizeMonthLabel(index, state.language)}</option>`;
    }).join("");
    els.factorMonthSelect.value = String(state.factorMonth || Number(els.monthSelect.value || 5));
  }
}

function syncStatusPills() {
  els.saveMode.textContent = storeLabel();
  els.sapStatus.textContent = state.sapFileName ? `${t("importedSap")}: ${state.sapFileName}` : t("waitingSap");
  els.forecastStatus.textContent = state.forecastFileName ? `${t("importedForecast")}: ${state.forecastFileName}` : t("waitingForecastPill");
  if (els.jiangStatus) els.jiangStatus.textContent = state.jiangFileName ? `${t("importJiang")}: ${state.jiangFileName}` : t("importJiang");
  for (const node of [els.sapStatus, els.forecastStatus, els.jiangStatus]) node?.classList.remove("muted", "warning");
  els.exportBtn.disabled = false;
}

function cookingInitialAnalyses() {
  const analyses = {};
  for (const row of COOKING_UNIT.monthlyResult.rows || []) {
    const key = analysisKey(COOKING_UNIT.monthlyResult.month, row.code);
    analyses[key] = {
      description: row.descCn || row.descEn || "",
      yoy: row.yoyReason || "",
      mom: row.budgetReason || ""
    };
  }
  return analyses;
}

function clonePlain(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
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
  els.forecastWorkspace?.addEventListener("click", handleRollingForecastClick);
  els.forecastWorkspace?.addEventListener("input", handleRollingForecastInput);
  els.forecastWorkspace?.addEventListener("change", handleRollingForecastInput);
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
    updateUnitChrome(state.activeUnit);
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
  for (const button of els.unitButtons || []) {
    button.addEventListener("click", async () => {
      if (button.disabled) return;
      await switchBusinessUnit(button.dataset.unit);
    });
  }
  els.sidebarToggle?.addEventListener("click", () => {
    const collapsed = !els.businessShell?.classList.contains("sidebar-collapsed");
    setSidebarCollapsed(collapsed);
    localStorage.setItem("dw.sidebarCollapsed", collapsed ? "1" : "0");
  });
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
    toast(`${t("loadedJiang")}: ${file.name}`);
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
    state.actualMonthCount = inferActualMonthCountFromFileName(file.name, 4);
    state.resultByMonth.clear();
    const actualByMonth = new Map();
    actualByMonth.set(0, baselineAsActual(BASELINE_25_BY_MONTH[12]));

    for (const item of MONTHS) {
      try {
        const parsedActual26 = extractActualFromWorkbook(workbook, item.month, XLSX);
        const actual26 = item.month <= state.actualMonthCount
          ? parsedActual26
          : accountForecastActualForMonth(item.month) || parsedActual26;
        actualByMonth.set(item.month, actual26);
      } catch (error) {
        console.warn(error);
      }
    }

    for (const item of MONTHS) {
      try {
        const actual26 = actualByMonth.get(item.month);
        if (!actual26) continue;
        const budget26 = accountBudgetForMonth(item.month) || BUDGET_26_BY_MONTH[item.month];
        const result = buildReconciliation({
          baseline25: BASELINE_25_BY_MONTH[item.month],
          budget26,
          actual26,
          previousActual26: actualByMonth.get(item.month - 1) || null,
          month: item.month,
          categoryOrder: CATEGORY_ORDER
        });
        state.resultByMonth.set(item.month, result);
      } catch (error) {
        console.warn(error);
      }
    }

    if (!state.resultByMonth.size) throw new Error("没有解析到可用实际表数据");
    const importedMonths = [...state.resultByMonth.keys()].sort((a, b) => a - b);
    els.monthSelect.innerHTML = importedMonths.map((month) => `<option value="${month}">${localizeMonthLabel(month - 1, state.language)}</option>`).join("");
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
  renderVarianceCostHeaders();
  renderSummaryCards();
  renderDashboard();
  renderCategoryFilter();
  renderNarrative();
  renderChart();
  renderTable();
  renderFactors();
}

function baselineAsActual(source) {
  if (!source) return null;
  return {
    month: 12,
    volume: source.volume,
    accounts: (source.accounts || []).map((row) => Array.isArray(row)
      ? { code: row[0], amount: row.length === 3 ? row[1] : row[4], unit: row.length === 3 ? row[2] : row[5] }
      : {
          code: row.code,
          descEn: row.descEn,
          category: row.category,
          summaryKey: row.summaryKey,
          amount: row.amount25,
          unit: row.unit25
        })
  };
}

function varianceCostLabels() {
  if (state.activeUnit === "cooking") {
    return {
      same: "同期费用 K€",
      previous: "预算/预测费用 K€",
      current: "26实际费用 K€"
    };
  }
  const month = Number(state.result?.month || els.monthSelect.value || 1);
  const previousMonth = month === 1 ? 12 : month - 1;
  const currentBasis = month <= state.actualMonthCount ? "actual" : "forecast";
  const previousBasis = month === 1 || previousMonth <= state.actualMonthCount ? "actual" : "forecast";
  if (state.language === "en") {
    return {
      same: "Prior-year cost K€",
      previous: `${previousMonth}M ${previousBasis} cost K€`,
      current: `${month}M ${currentBasis} cost K€`
    };
  }
  if (state.language === "tr") {
    return {
      same: "Geçen yıl gider K€",
      previous: `${previousMonth}. ay ${previousBasis === "actual" ? "gerçekleşen" : "tahmin"} gider K€`,
      current: `${month}. ay ${currentBasis === "actual" ? "gerçekleşen" : "tahmin"} gider K€`
    };
  }
  return {
    same: "同期费用 K€",
    previous: `${previousMonth}月${previousBasis === "actual" ? "实际" : "预测"}费用 K€`,
    current: `${month}月${currentBasis === "actual" ? "实际" : "预测"}费用 K€`
  };
}

function renderVarianceCostHeaders() {
  const labels = varianceCostLabels();
  if (els.sameCostHeader) els.sameCostHeader.textContent = labels.same;
  if (els.previousCostHeader) els.previousCostHeader.textContent = labels.previous;
  if (els.currentCostHeader) els.currentCostHeader.textContent = labels.current;
}

function accountBudgetForMonth(month) {
  if (month < 5) return null;
  const source = ACCOUNT_BUDGET_DW_BY_MONTH[month];
  if (!source) return null;
  const accounts = (source.accounts || []).map((row) => ({
    code: row.code,
    descEn: row.descEn,
    category: row.category,
    summaryKey: row.summaryKey,
    amountBudget: row.amount,
    unitBudget: row.unit
  }));
  return {
    month,
    volume: source.volume,
    accounts,
    categories: groupedCategoryAmounts(accounts, "amountBudget", "amountBudget")
  };
}

function accountForecastActualForMonth(month) {
  if (month < 5) return null;
  const source = ACCOUNT_FORECAST_DW_BY_MONTH[month];
  if (!source) return null;
  return {
    month,
    volume: source.volume,
    isForecast: true,
    accounts: source.accounts || []
  };
}

function groupedCategoryAmounts(accounts, sourceKey, targetKey) {
  const map = new Map();
  for (const row of accounts || []) {
    const category = row.category || t("other");
    map.set(category, (map.get(category) || 0) + (Number(row[sourceKey]) || 0));
  }
  return [...map.entries()].map(([label, value]) => ({ label, [targetKey]: value }));
}

function buildDashboardRows() {
  return buildAnnualDashboardRows(state.forecast, {
    baseline25ByMonth: BASELINE_25_BY_MONTH,
    budget26ByMonth: BUDGET_26_BY_MONTH,
    resultByMonth: state.resultByMonth,
    jiangyue: state.jiangyue,
    accountBudgetByMonth: ACCOUNT_BUDGET_DW_BY_MONTH,
    accountForecastByMonth: ACCOUNT_FORECAST_DW_BY_MONTH
  });
}

function renderMonthButtons() {
  if (!els.monthButtons) return;
  const months = [...state.resultByMonth.keys()].sort((a, b) => a - b);
  els.monthButtons.innerHTML = months.length
    ? months.map((month) => `<button type="button" data-month="${month}" class="${Number(els.monthSelect.value) === month ? "active" : ""}">${escapeHtml(localizeMonthLabel(month - 1, state.language))}</button>`).join("")
    : `<span class="muted">${t("waitingSap")}</span>`;
}

function renderSummaryCards() {
  if (els.monthlyKpiGrid) {
    els.monthlyKpiGrid.innerHTML = buildFiveKpiCards("month").map((card) => kpiCardHtml(card, "metric")).join("");
  }
}

function renderDashboard() {
  const months = Array.from({ length: 12 }, (_, index) => localizeMonthLabel(index, state.language));
  const actualMonthCount = countActualMonths();
  els.dashboardHead.innerHTML = `
    <tr class="phase-header-row">
      <th colspan="4" class="phase-corner">${escapeHtml(t("scenario"))}</th>
      <th colspan="${actualMonthCount}" class="phase-actual">${escapeHtml(`1-${actualMonthCount} ${t("actualMonths")}`)}</th>
      <th colspan="${12 - actualMonthCount}" class="phase-forecast">${escapeHtml(`${actualMonthCount + 1}-12 ${t("forecastMonths")}`)}</th>
      <th class="phase-year">${escapeHtml(t("fullYear"))}</th>
    </tr>
    <tr><th class="sticky-col sticky-col-1">${escapeHtml(t("group"))}</th><th class="sticky-col sticky-col-2">${escapeHtml(t("indicator"))}</th><th class="sticky-col sticky-col-3">${escapeHtml(t("scenario"))}</th><th class="sticky-col sticky-col-4">${escapeHtml(t("unit"))}</th>${months.map((month, index) => `<th class="${index < actualMonthCount ? "actual-month-head" : "forecast-month-head"}">${escapeHtml(month)}</th>`).join("")}<th>${escapeHtml(t("fullYear"))}</th></tr>`;
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
    const displayScenario = state.activeUnit === "cooking" && row.scenario === "预算" ? "目标" : localized.scenario;
    const family = metricFamily(row.label);
    const showLabel = row.label !== lastLabel;
    lastLabel = row.label;
    return `
      <tr class="dashboard-row family-${family}">
        <td class="sticky-col sticky-col-1"><span class="group-chip">${escapeHtml(metricFamilyLabel(family))}</span></td>
        <td class="merged-label sticky-col sticky-col-2">${showLabel ? escapeHtml(localized.label) : ""}</td>
        <td class="sticky-col sticky-col-3"><span class="scenario-chip ${scenarioClass(row.scenario)}">${escapeHtml(displayScenario)}</span></td>
        <td class="sticky-col sticky-col-4">${escapeHtml(localized.unit)}</td>
        ${row.values.map((value, index) => {
          const tooltip = metricTooltip(row, index);
          const phaseClass = index < actualMonthCount ? " actual-month-cell" : " forecast-month-cell";
          return `<td class="month-cell ${heatClass(row, index)}${phaseClass}" tabindex="0" data-metric-tooltip="${escapeHtml(tooltip)}">${formatDashboardValue(value, row.unit)}</td>`;
        }).join("")}
        <td class="month-cell full-year-cell" tabindex="0" data-metric-tooltip="${escapeHtml(metricTooltip(row, null))}">${formatDashboardValue(annualMetricValue(row), row.unit)}</td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="17" class="empty-cell">${t("noMatchingAccounts")}</td></tr>`;
}

function dashboardMetricsForGroup() {
  const map = {
    all: ["产量", "工作日", "直接员工", "间接员工", "白领", "UPPH", "制造费率", "单台制造费"],
    unit: ["产量", "产量累计"],
    time: ["工作日"],
    people: ["直接员工", "间接员工", "白领"],
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
  const rows = state.dashboardRows.filter((row) => {
    if (state.dashboardGroup !== "all" && metricFamily(row.label) !== state.dashboardGroup) return false;
    if (state.metricIndicator !== "all" && row.label !== state.metricIndicator) return false;
    if (state.metricScenario !== "all" && row.scenario !== state.metricScenario) return false;
    if (state.metricStatus !== "all") {
      const status = metricRowStatus(row, monthIndex);
      if (status !== state.metricStatus) return false;
    }
    return true;
  });
  return sortDashboardRowsForComparison(rows);
}

function sortDashboardRowsForComparison(rows) {
  const preferredMetrics = dashboardMetricsForGroup();
  const metricOrder = new Map(preferredMetrics.map((label, index) => [label, index]));
  const fallbackMetricOrder = new Map();
  state.dashboardRows.forEach((row) => {
    if (!fallbackMetricOrder.has(row.label)) fallbackMetricOrder.set(row.label, fallbackMetricOrder.size);
  });
  return rows.slice().sort((a, b) => {
    const metricA = metricOrder.has(a.label) ? metricOrder.get(a.label) : preferredMetrics.length + (fallbackMetricOrder.get(a.label) || 0);
    const metricB = metricOrder.has(b.label) ? metricOrder.get(b.label) : preferredMetrics.length + (fallbackMetricOrder.get(b.label) || 0);
    if (metricA !== metricB) return metricA - metricB;
    const scenarioDiff = scenarioCompareOrder(a.scenario) - scenarioCompareOrder(b.scenario);
    if (scenarioDiff !== 0) return scenarioDiff;
    return fallbackMetricOrder.get(a.label) - fallbackMetricOrder.get(b.label);
  });
}

function scenarioCompareOrder(scenario) {
  if (scenario === "同期") return 0;
  if (scenario === "预算" || scenario === "目标") return 1;
  if (scenario === "26年") return 2;
  if (scenario === "差额" || scenario === "累计差额") return 3;
  return 9;
}

function metricFamily(labelText) {
  if (/产量/.test(labelText)) return "unit";
  if (/工作日|工时|出勤|标准工时/.test(labelText)) return "time";
  if (/用人|人数|员工|白领/.test(labelText)) return "people";
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
    const value = row.scenario === "同期" ? stats.upph25 : row.scenario === "26年" ? stats.upph26 : averageFinite(row.values);
    return Number.isFinite(value) ? value : averageFinite(row.values);
  }
  if (["用人", "直接员工", "间接员工", "白领"].includes(row.label)) return averageFinite(row.values);
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

function combinedPeopleRow(scenario) {
  const direct = state.dashboardRows.find((row) => row.label === "直接员工" && row.scenario === scenario);
  const indirect = state.dashboardRows.find((row) => row.label === "间接员工" && row.scenario === scenario);
  if (!direct && !indirect) return null;
  return {
    values: Array.from({ length: 12 }, (_, index) => {
      const left = direct?.values?.[index];
      const right = indirect?.values?.[index];
      if (!Number.isFinite(left) && !Number.isFinite(right)) return null;
      return (Number.isFinite(left) ? left : 0) + (Number.isFinite(right) ? right : 0);
    })
  };
}

function annualStats() {
  const rowBy = (labelText, scenario) => state.dashboardRows.find((row) => row.label === labelText && row.scenario === scenario);
  const amount26 = rowBy("制造费用金额", "26年");
  const amount25 = rowBy("制造费用金额", "同期");
  const volume26 = rowBy("产量", "26年");
  const volume25 = rowBy("产量", "同期");
  const days26 = rowBy("工作日", "26年");
  const days25 = rowBy("工作日", "同期");
  const people26 = combinedPeopleRow("26年");
  const people25 = combinedPeopleRow("同期");
  const upph26Row = rowBy("UPPH", "26年");
  const upph25Row = rowBy("UPPH", "同期");
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
    upph26: annualUpph(volume26?.values || [], people26?.values || [], [], days26?.values || []) || averageFinite(upph26Row?.values || []),
    upph25: annualUpph(volume25?.values || [], people25?.values || [], [], days25?.values || []) || averageFinite(upph25Row?.values || []),
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
    people26: sumFinite(rowValue("直接员工", "26年"), rowValue("间接员工", "26年")),
    people25: sumFinite(rowValue("直接员工", "同期"), rowValue("间接员工", "同期")),
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
  const topCats = annualCategoryDiffs()
    .slice(0, 3)
    .map((item) => localizeCategory(item.label, state.language))
    .join(state.language === "zh" ? "、" : "; ");
  const direction = unitDiff <= 0 ? t("better") : t("worse");
  const unit = t("unitEuroPc");
  const categories = topCats || t("annualTopCategoryFallback");
  const businessName = state.activeUnit === "cooking" ? "厨电" : "洗碗机";
  if (state.language === "en") {
    const englishName = state.activeUnit === "cooking" ? "cooking appliance" : "dishwasher";
    return `2026 ${englishName} full-year rolling forecast unit manufacturing cost is ${formatUnit(stats.unit26)} ${unit}, ${direction} vs same period by ${formatPercent(Math.abs(ratio))}; MFG impact is ${formatMoney(impact)} K€. Main variance categories: ${categories}.`;
  }
  if (state.language === "tr") {
    const turkishName = state.activeUnit === "cooking" ? "pişirme cihazları" : "bulaşık makinesi";
    return `2026 ${turkishName} tam yıl hareketli tahmin birim üretim gideri ${formatUnit(stats.unit26)} ${unit}; aynı döneme göre ${direction}: ${formatPercent(Math.abs(ratio))}. Üretim gideri etkisi ${formatMoney(impact)} K€. Ana fark kategorileri: ${categories}.`;
  }
  return `2026年${businessName}全年滚动预测单台制造费为 ${formatUnit(stats.unit26)} ${unit}，较同期${direction} ${formatPercent(Math.abs(ratio))}，对应制造费影响 ${formatMoney(impact)} K€。主要差异集中在 ${categories}。`;
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
  const rows = (state.result.categories || [])
    .map((item) => enrichCategoryDiagnostic(item, monthIndex, volume))
    .sort((a, b) => {
      const absA = Math.max(Math.abs(a.unitDiff || 0), Math.abs(a.momUnitDiff || 0));
      const absB = Math.max(Math.abs(b.unitDiff || 0), Math.abs(b.momUnitDiff || 0));
      if (absB !== absA) return absB - absA;
      return (b.unitDiff || 0) - (a.unitDiff || 0);
    });
  const total = totalCategoryDiagnostic(volume);
  return total ? [total, ...rows] : rows;
}

function enrichCategoryDiagnostic(item, monthIndex, volume) {
  const forecast = forecastCategoryForMonth(item.category, monthIndex);
  const amount26 = chooseCategoryValue(item.amount26, forecast?.actualAmount);
  const unit25 = item.unit25;
  const previousAmount26 = item.previousAmount26;
  const previousUnit26 = item.previousUnit26;
  const unit26 = unitFromAmount(amount26, volume) ?? item.unit26;
  const amount25 = item.amount25;
  const amountDiff = diffNullableLocal(amount26, amount25) ?? item.amountDiff;
  const unitDiff = diffNullableLocal(unit26, unit25) ?? item.unitDiff ?? (volume ? (amountDiff / volume) * 1000 : null);
  const momAmountDiff = state.result.previousVolume26
    ? diffNullableLocal(amount26, previousAmount26) ?? item.momAmountDiff
    : null;
  const momUnitDiff = state.result.previousVolume26
    ? diffNullableLocal(unit26, previousUnit26) ?? item.momUnitDiff
    : null;
  return {
    ...item,
    amount26,
    previousAmount26,
    amountDiff,
    momAmountDiff,
    unit26,
    previousUnit26,
    unitDiff,
    momUnitDiff,
    manufacturingDiff: Number.isFinite(unitDiff) && volume ? unitDiff * volume / 1000 : item.manufacturingDiff,
    yoyRate: unit25 ? unitDiff / unit25 : null,
    momRate: previousUnit26 ? momUnitDiff / previousUnit26 : null
  };
}

function buildCategoryReasonText(item, mode) {
  if (!state.result) return "";
  const category = item.category;
  const reasons = state.result.rows
    .map((row) => ({ row, reason: analysisReason(state.analyses, state.result.month, row.code, mode).trim() }))
    .filter(({ row, reason }) => row.category === category && reason)
    .map(({ reason }) => reason);
  if (!reasons.length && !item.isTotal) return "";
  if (item.isTotal) {
    const allReasons = state.result.rows
      .map((row) => analysisReason(state.analyses, state.result.month, row.code, mode).trim())
      .filter(Boolean);
    return allReasons.join("；");
  }
  return reasons.join("；");
}

function totalCategoryDiagnostic(volume) {
  const summary = state.result?.summary || {};
  const unit25 = summary.totalUnit25;
  const previousUnit26 = summary.previousTotalUnit26;
  const unit26 = summary.totalUnit26;
  if (![unit25, previousUnit26, unit26].some(Number.isFinite)) return null;
  const unitDiff = summary.totalUnitDiff;
  const momUnitDiff = summary.totalMomUnitDiff;
  return {
    category: "总单台",
    amount25: summary.totalAmount25,
    previousAmount26: summary.previousTotalAmount26,
    amount26: summary.totalAmount26,
    amountDiff: summary.totalAmountDiff,
    momAmountDiff: summary.totalMomAmountDiff,
    unit25,
    previousUnit26,
    unit26,
    unitDiff,
    momUnitDiff,
    manufacturingDiff: Number.isFinite(unitDiff) && volume ? unitDiff * volume / 1000 : null,
    yoyRate: unit25 ? unitDiff / unit25 : null,
    momRate: previousUnit26 ? momUnitDiff / previousUnit26 : null,
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
  const top = 58;
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
  const actualMonthCount = countActualMonths();
  const forecastStart = Math.max(1, Math.min(12, actualMonthCount));
  const forecastBoundary = (x(forecastStart - 1) + x(forecastStart)) / 2;
  const forecastEnd = (x(11) + x(12)) / 2;
  const series = [
    { row: actual, values: actualValues, color: "#42e0cd", name: t("actual26") },
    { row: budget, values: budgetValues, color: "#f6c85f", name: t("budget26") },
    { row: same, values: sameValues, color: "#91a7bd", name: t("same25") }
  ];
  const labelItems = [];
  const paths = series.map((item, seriesIndex) => {
    if (item.row === actual) {
      const actualPoints = item.values
        .map((value, index) => index < actualMonthCount && Number.isFinite(value) ? `${x(index)},${y(value)}` : null)
        .filter(Boolean)
        .join(" ");
      const forecastPoints = item.values
        .map((value, index) => index >= actualMonthCount - 1 && Number.isFinite(value) ? `${x(index)},${y(value)}` : null)
        .filter(Boolean)
        .join(" ");
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
        <circle cx="${x(index)}" cy="${y(value)}" r="5" fill="${item.color}" class="chart-dot ${index < actualMonthCount ? "actual-dot" : "forecast-dot"}">
          <title>${labels[index]} ${item.name}: ${formatDashboardValue(value, unitLabel)}</title>
        </circle>`;
      }).join("");
      return `
        <polyline points="${actualPoints}" fill="none" stroke="${item.color}" stroke-width="4" class="animated-line actual-segment" />
        <polyline points="${forecastPoints}" fill="none" stroke="${item.color}" stroke-width="4" class="animated-line forecast-segment" />
        ${dots}`;
    }
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
    <rect x="${left}" y="${top}" width="${forecastBoundary - left}" height="${height - top - bottom}" class="actual-zone" />
    <rect x="${forecastBoundary}" y="${top}" width="${forecastEnd - forecastBoundary}" height="${height - top - bottom}" class="forecast-zone" />
    <line x1="${forecastBoundary}" y1="${top}" x2="${forecastBoundary}" y2="${height - bottom}" class="phase-divider" />
    <text x="${(left + forecastBoundary) / 2}" y="47" class="phase-label">${escapeSvg(`1-${actualMonthCount} ${t("actualMonths")}`)}</text>
    <text x="${(forecastBoundary + forecastEnd) / 2}" y="47" class="phase-label">${escapeSvg(`${actualMonthCount + 1}-12 ${t("forecastMonths")}`)}</text>
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
  return Math.max(1, Math.min(11, Number(state.actualMonthCount) || 4));
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
    Number.isFinite(yoy) ? `<span class="${optimized ? "tooltip-good" : "tooltip-bad"}">${t("yoyVariance")} · ${t(optimized ? "better" : "worse")}: ${formatDashboardValue(Math.abs(yoy), row.unit)}${formatYoyPercent(yoy, same)}</span>` : "",
    Number.isFinite(budgetDiff) ? `<span class="${tooltipDiffClass(budgetDiff, row.direction)}">${t("budgetVariance")}: ${formatDashboardValue(budgetDiff, row.unit)}</span>` : "",
    Number.isFinite(completion) ? `<span class="${completion >= 1 ? "tooltip-good" : "tooltip-bad"}">${t("targetCompletion")}: ${formatPercent(completion)}</span>` : ""
  ].filter(Boolean).join("\n");
}

function formatYoyPercent(diff, base) {
  if (!Number.isFinite(diff) || !Number.isFinite(base) || base === 0) return "";
  return `（${formatPercent(Math.abs(diff / base))}）`;
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
  const highRows = result.rows.filter((row) => row.isHighImpact
    || Math.abs(row.unitDiff || 0) >= 0.5
    || Math.abs(row.momUnitDiff || 0) >= 0.5);
  const filled = highRows.filter((row) => {
    const yoyNeeded = Math.abs(row.unitDiff || 0) >= 0.5;
    const momNeeded = Math.abs(row.momUnitDiff || 0) >= 0.5;
    return (!yoyNeeded || analysisReason(analyses, result.month, row.code, "yoy").trim())
      && (!momNeeded || analysisReason(analyses, result.month, row.code, "mom").trim());
  }).length;
  const direction = (result.summary.totalUnitDiff || 0) <= 0 ? t("better") : t("worse");
  const momDirection = (result.summary.totalMomUnitDiff || 0) <= 0 ? t("better") : t("worse");
  const forecastText = forecast?.unitCost ? t("forecastUnitLine").replace("{unit}", formatUnit(forecast.unitCost)) : "";
  const yoyReasonText = highRows
    .map((row) => analysisReason(analyses, result.month, row.code, "yoy").trim())
    .filter(Boolean)
    .slice(0, 3)
    .join("; ");
  const momReasonText = highRows
    .map((row) => analysisReason(analyses, result.month, row.code, "mom").trim())
    .filter(Boolean)
    .slice(0, 3)
    .join("; ");
  if (state.language === "en") {
    return `${localizeMonthLabel(result.month - 1, state.language)} unit cost YoY ${direction} by ${formatUnit(Math.abs(result.summary.totalUnitDiff || 0))} €/pc and MoM ${momDirection} by ${formatUnit(Math.abs(result.summary.totalMomUnitDiff || 0))} €/pc; YoY MFG impact ${formatMoney(result.summary.manufacturingDiff)} K€. Reasons completed ${filled}/${highRows.length}. YoY: ${yoyReasonText || "--"}; MoM: ${momReasonText || "--"}. ${forecastText}`;
  }
  if (state.language === "tr") {
    return `${localizeMonthLabel(result.month - 1, state.language)} birim maliyet yıllık ${direction}: ${formatUnit(Math.abs(result.summary.totalUnitDiff || 0))} €/adet; aylık ${momDirection}: ${formatUnit(Math.abs(result.summary.totalMomUnitDiff || 0))} €/adet. Nedenler ${filled}/${highRows.length}. Yıllık: ${yoyReasonText || "--"}; aylık: ${momReasonText || "--"}. ${forecastText}`;
  }
  return "";
}

function renderTable() {
  const varianceView = document.getElementById("varianceView");
  if (!state.result) {
    varianceView?.classList.remove("show-legacy-variance");
    els.rowCount.textContent = `0 ${t("rowCountSuffix")}`;
    if (els.forecastWorkspace) els.forecastWorkspace.innerHTML = `<div class="empty-cell">${t("emptySap")}</div>`;
    if (els.detailBody) els.detailBody.innerHTML = `<tr><td colspan="8" class="empty-cell">${t("emptySap")}</td></tr>`;
    return;
  }
  const rows = visibleRows();
  const collapsedCount = state.result.unsplitCategories?.length || 0;
  const collapsedText = collapsedCount ? ` · ${t("collapsedCategoryCompare").replace("{count}", collapsedCount)}` : "";
  els.rowCount.textContent = `${rows.length} ${t("rowCountSuffix")}${collapsedText}`;
  varianceView?.classList.toggle("show-legacy-variance", state.rollingViewMode === "variance");
  if (state.rollingViewMode === "variance") {
    renderVarianceAnalysisWorkspace();
    if (!els.detailBody) return;
    els.detailBody.innerHTML = rows.map((row) => rowToHtml(row)).join("");
    bindVarianceAnalysisRows();
    return;
  }
  renderRollingForecastWorkspace(rows);
  if (!els.detailBody) return;
  els.detailBody.innerHTML = "";
}

function renderVarianceAnalysisWorkspace() {
  if (!els.forecastWorkspace) return;
  els.forecastWorkspace.innerHTML = `
    <div class="rf-switch-panel">
      <div>
        <h3>${escapeHtml(rfT("varianceMode"))}</h3>
        <p>${escapeHtml(state.language === "en"
          ? "Use the original variance table format after forecast input: cost, unit variance, YoY/MoM result and hover details."
          : state.language === "tr"
            ? "Tahmin girişinden sonra eski fark tablosu formatı kullanılır: gider, birim fark, yıllık/aylık sonuç ve hover detayı."
            : "填完预测后，用原来的差异表格式查看：费用、单台、同比/环比结论和悬停明细。")}</p>
      </div>
      <div class="rf-actions">
        <div class="rf-mode-toggle">
          <button type="button" class="${state.rollingViewMode === "fill" ? "active" : ""}" data-rf-view-mode="fill">${escapeHtml(rfT("fillMode"))}</button>
          <button type="button" class="${state.rollingViewMode === "variance" ? "active" : ""}" data-rf-view-mode="variance">${escapeHtml(rfT("varianceMode"))}</button>
        </div>
      </div>
    </div>
  `;
}

function bindVarianceAnalysisRows() {
  for (const input of els.detailBody.querySelectorAll(".description-attachment-input")) {
    input.addEventListener("change", (event) => {
      const fileName = event.target.files?.[0]?.name || "";
      state.descriptionAttachments[event.target.dataset.key] = fileName;
      const nameNode = event.target.closest(".attachment-row")?.querySelector(".attachment-name");
      if (nameNode) nameNode.textContent = fileName || "";
    });
  }
  for (const textarea of els.detailBody.querySelectorAll("textarea")) {
    textarea.addEventListener("change", (event) => {
      const key = event.target.dataset.key;
      state.analyses[key] = {
        ...analysisReasons(state.analyses[key]),
        [event.target.dataset.mode]: event.target.value
      };
      if (els.analysisSaveStatus) els.analysisSaveStatus.textContent = t("unsavedChanges");
    });
    textarea.addEventListener("input", (event) => {
      state.analyses[event.target.dataset.key] = {
        ...analysisReasons(state.analyses[event.target.dataset.key]),
        [event.target.dataset.mode]: event.target.value
      };
      renderNarrative();
      renderChart();
    });
  }
}

const ROLLING_FORECAST_MONTHS = [6, 7, 8, 9, 10, 11, 12];
const ROLLING_FORECAST_DRAFT_KEY = "dwRollingForecastDrafts.v1";
const ROLLING_FORECAST_SUBMIT_KEY = "dwRollingForecastSubmitted.v1";
const ROLLING_FORECAST_TEXT = {
  zh: {
    title: "滚动预测协作区",
    subtitle: "6-12月预测在这里直接维护；单价和数量为空时，总额沿用5+7预测。",
    myTasks: "我的任务",
    allTasks: "全部任务",
    ownerMissing: "责任人缺失",
    warnings: "预警",
    drafts: "草稿",
    submitted: "已提交",
    saveAll: "保存全部草稿",
    submitAll: "提交全部预测",
    saveCurrent: "保存当前科目",
    submitCurrent: "提交当前科目",
    fillMode: "填报版",
    varianceMode: "差异版",
    account: "科目",
    task: "任务",
    action: "操作",
    fill: "填写",
    continueFill: "继续填",
    view: "查看",
    ownerNeeded: "待填责任人",
    usesForecast: "沿用5+7",
    byFormula: "单价×数量",
    byTotal: "手填总价",
    draft: "草稿",
    noTask: "没有符合条件的科目",
    selectedAccount: "当前科目",
    forecastLogic: "预测逻辑",
    ownerSection: "责任人与计算",
    priceOwner: "单价责任人",
    qtyOwner: "数量责任人",
    totalOwner: "总价责任人",
    reviewer: "审核责任人",
    month: "月份",
    forecast48: "5+7预测",
    unitPrice: "单价",
    quantity: "数量",
    totalAmount: "总价",
    detailFile: "明细附件",
    uploadDetail: "上传明细",
    replaceDetail: "更换明细",
    detailRequired: "待上传明细",
    rollingTotal: "滚动预测总额",
    yoyDiff: "同比差额",
    momDiff: "环比差额",
    varianceReasonTitle: "同比/环比原因",
    yoyReason: "同比差异分析",
    momReason: "环比差异分析",
    samePeriod: "25同期",
    previousMonth: "上月",
    currentRolling: "当前滚动",
    reasonPlaceholder: "填写原因、责任、行动和预计影响",
    warning: "预警",
    noWarning: "正常",
    formulaHint: "单价和数量为空时，滚动预测总额保持5+7；两者都填写后，总额=单价×数量。",
    totalModeHint: "该科目单价不统一，请上传明细并填写总价；总价为空时，滚动预测总额保持5+7。",
    completion: "填写完整度",
    saved: "滚动预测草稿已保存",
    submittedToast: "滚动预测已提交",
    currentSaved: "当前科目草稿已保存",
    currentSubmitted: "当前科目已提交",
    missingOwnerHint: "请补责任人",
    warningHint: "超过上月20%",
    status: "状态"
  },
  en: {
    title: "Rolling Forecast Hub",
    subtitle: "Maintain Jun-Dec forecast here. When unit price and quantity are blank, total keeps the 5+7 forecast.",
    myTasks: "My Tasks",
    allTasks: "All Tasks",
    ownerMissing: "Owner Missing",
    warnings: "Warnings",
    drafts: "Drafts",
    submitted: "Submitted",
    saveAll: "Save All Drafts",
    submitAll: "Submit All Forecasts",
    saveCurrent: "Save Current Account",
    submitCurrent: "Submit Current Account",
    fillMode: "Input View",
    varianceMode: "Variance View",
    account: "Account",
    task: "Task",
    action: "Action",
    fill: "Fill",
    continueFill: "Continue",
    view: "View",
    ownerNeeded: "Owner Needed",
    usesForecast: "Use 5+7",
    byFormula: "Unit x Qty",
    byTotal: "Manual Total",
    draft: "Draft",
    noTask: "No matching accounts",
    selectedAccount: "Current Account",
    forecastLogic: "Forecast Logic",
    ownerSection: "Owners & Calculation",
    priceOwner: "Price Owner",
    qtyOwner: "Quantity Owner",
    totalOwner: "Total Owner",
    reviewer: "Reviewer",
    month: "Month",
    forecast48: "5+7 Forecast",
    unitPrice: "Unit Price",
    quantity: "Quantity",
    totalAmount: "Total Amount",
    detailFile: "Detail File",
    uploadDetail: "Upload Detail",
    replaceDetail: "Replace Detail",
    detailRequired: "Detail Needed",
    rollingTotal: "Rolling Total",
    yoyDiff: "YoY Diff",
    momDiff: "MoM Diff",
    varianceReasonTitle: "YoY / MoM Reasons",
    yoyReason: "YoY Variance",
    momReason: "MoM Variance",
    samePeriod: "2025 Same",
    previousMonth: "Previous Month",
    currentRolling: "Current Rolling",
    reasonPlaceholder: "Enter reason, owner, action and estimated impact",
    warning: "Warning",
    noWarning: "OK",
    formulaHint: "Blank unit price and quantity keep the 5+7 total. When both are filled, total = unit price x quantity.",
    totalModeHint: "This account has no unified unit price. Upload the detail file and fill the total amount. Blank total keeps the 5+7 forecast.",
    completion: "Completion",
    saved: "Rolling forecast drafts saved",
    submittedToast: "Rolling forecast submitted",
    currentSaved: "Current account draft saved",
    currentSubmitted: "Current account submitted",
    missingOwnerHint: "Add owner",
    warningHint: "Over 20% vs previous month",
    status: "Status"
  },
  tr: {
    title: "Dönen Tahmin Merkezi",
    subtitle: "Haziran-Aralık tahmini burada tutulur. Birim fiyat ve miktar boşsa toplam 5+7 tahmini olarak kalır.",
    myTasks: "Görevlerim",
    allTasks: "Tüm Görevler",
    ownerMissing: "Sorumlu Eksik",
    warnings: "Uyarılar",
    drafts: "Taslaklar",
    submitted: "Gönderildi",
    saveAll: "Tüm Taslakları Kaydet",
    submitAll: "Tüm Tahminleri Gönder",
    saveCurrent: "Seçili Hesabı Kaydet",
    submitCurrent: "Seçili Hesabı Gönder",
    fillMode: "Giriş Görünümü",
    varianceMode: "Fark Görünümü",
    account: "Hesap",
    task: "Görev",
    action: "İşlem",
    fill: "Doldur",
    continueFill: "Devam",
    view: "Görüntüle",
    ownerNeeded: "Sorumlu Gerekli",
    usesForecast: "5+7 kullan",
    byFormula: "Birim x Miktar",
    byTotal: "Manuel Toplam",
    draft: "Taslak",
    noTask: "Eşleşen hesap yok",
    selectedAccount: "Seçili Hesap",
    forecastLogic: "Tahmin Mantığı",
    ownerSection: "Sorumlular ve Hesaplama",
    priceOwner: "Fiyat Sorumlusu",
    qtyOwner: "Miktar Sorumlusu",
    totalOwner: "Toplam Sorumlusu",
    reviewer: "Kontrol Eden",
    month: "Ay",
    forecast48: "5+7 Tahmin",
    unitPrice: "Birim Fiyat",
    quantity: "Miktar",
    totalAmount: "Toplam Tutar",
    detailFile: "Detay Dosyası",
    uploadDetail: "Detay Yükle",
    replaceDetail: "Detayı Değiştir",
    detailRequired: "Detay Gerekli",
    rollingTotal: "Dönen Toplam",
    yoyDiff: "Yıllık Fark",
    momDiff: "Aylık Fark",
    varianceReasonTitle: "Yıllık / Aylık Nedenler",
    yoyReason: "Yıllık Fark",
    momReason: "Aylık Fark",
    samePeriod: "2025 Aynı",
    previousMonth: "Önceki Ay",
    currentRolling: "Mevcut Dönen",
    reasonPlaceholder: "Neden, sorumlu, aksiyon ve tahmini etki girin",
    warning: "Uyarı",
    noWarning: "Normal",
    formulaHint: "Birim fiyat ve miktar boşsa toplam 5+7 olarak kalır. İkisi de doluysa toplam = birim fiyat x miktar.",
    totalModeHint: "Bu hesabın tek bir birim fiyatı yok. Detay dosyasını yükleyin ve toplam tutarı girin. Toplam boşsa 5+7 tahmini kullanılır.",
    completion: "Tamamlanma",
    saved: "Dönen tahmin taslakları kaydedildi",
    submittedToast: "Dönen tahmin gönderildi",
    currentSaved: "Seçili hesap taslağı kaydedildi",
    currentSubmitted: "Seçili hesap gönderildi",
    missingOwnerHint: "Sorumlu ekle",
    warningHint: "Önceki aya göre %20 üzeri",
    status: "Durum"
  }
};

function renderRollingForecastWorkspace(rows) {
  if (!els.forecastWorkspace) return;
  const accountRows = rows.filter((row) => row.code);
  if (!accountRows.length) {
    els.forecastWorkspace.innerHTML = `<div class="empty-cell">${rfT("noTask")}</div>`;
    return;
  }
  if (!state.rollingSelectedCode || !accountRows.some((row) => row.code === state.rollingSelectedCode)) {
    state.rollingSelectedCode = accountRows[0].code;
  }
  const allMeta = accountRows.map((row) => rollingRowMeta(row));
  const filteredMeta = allMeta.filter((item) => rollingFilterMatches(item));
  const selectedMeta = allMeta.find((item) => item.row.code === state.rollingSelectedCode) || allMeta[0];
  const stats = rollingStats(allMeta);
  els.forecastWorkspace.innerHTML = `
    <div class="rf-shell">
      <div class="rf-header">
        <div>
          <h3>${escapeHtml(rfT("title"))}</h3>
          <p>${escapeHtml(rfT("subtitle"))}</p>
        </div>
        <div class="rf-actions">
          <div class="rf-mode-toggle">
            <button type="button" class="${state.rollingViewMode === "fill" ? "active" : ""}" data-rf-view-mode="fill">${escapeHtml(rfT("fillMode"))}</button>
            <button type="button" class="${state.rollingViewMode === "variance" ? "active" : ""}" data-rf-view-mode="variance">${escapeHtml(rfT("varianceMode"))}</button>
          </div>
          <button type="button" class="ghost-button" data-rf-action="save-all">${escapeHtml(rfT("saveAll"))}</button>
          <button type="button" data-rf-action="submit-all">${escapeHtml(rfT("submitAll"))}</button>
        </div>
      </div>
      <div class="rf-stats">
        ${rfStat(rfT("myTasks"), stats.myTasks)}
        ${rfStat(rfT("ownerMissing"), stats.ownerMissing)}
        ${rfStat(rfT("warnings"), stats.warnings, stats.warnings ? "warn" : "")}
        ${rfStat(rfT("drafts"), stats.drafts)}
        ${rfStat(rfT("submitted"), stats.submitted, "ok")}
      </div>
      <div class="rf-layout">
        <aside class="rf-task-panel">
          <div class="rf-filter-tabs">
            ${rfFilterButton("all", rfT("allTasks"))}
            ${rfFilterButton("my", rfT("myTasks"))}
            ${rfFilterButton("missing", rfT("ownerMissing"))}
            ${rfFilterButton("warning", rfT("warnings"))}
          </div>
          <div class="rf-task-list">
            ${filteredMeta.map((item) => rfTaskRow(item)).join("") || `<div class="rf-empty">${escapeHtml(rfT("noTask"))}</div>`}
          </div>
        </aside>
        <section class="rf-editor">
          ${rfEditor(selectedMeta)}
        </section>
      </div>
    </div>
  `;
}

function rfStat(labelText, value, className = "") {
  return `<div class="rf-stat ${className}"><span>${escapeHtml(labelText)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function rfFilterButton(value, labelText) {
  return `<button type="button" class="${state.rollingTaskFilter === value ? "active" : ""}" data-rf-filter="${escapeHtml(value)}">${escapeHtml(labelText)}</button>`;
}

function rfTaskRow(item) {
  const row = item.row;
  const accountLabel = state.activeUnit === "cooking" && state.language === "zh" && row.descCn
    ? row.descCn
    : localizeAccountLabel(row.code, row.descEn, state.language);
  const selected = row.code === state.rollingSelectedCode;
  const taskLabel = item.warningCount
    ? rfT("warningHint")
    : item.ownerMissing
      ? rfT("missingOwnerHint")
      : item.hasFormula
        ? item.totalOnly ? rfT("byTotal") : rfT("byFormula")
        : rfT("usesForecast");
  const action = item.submitted ? rfT("view") : item.hasDraft ? rfT("continueFill") : rfT("fill");
  return `
    <button type="button" class="rf-task-row ${selected ? "selected" : ""} ${item.warningCount ? "has-warning" : ""}" data-rf-select="${escapeHtml(row.code)}">
      <span class="rf-task-main">
        <b>${escapeHtml(row.code)}</b>
        <em>${escapeHtml(shortText(accountLabel, 42))}</em>
      </span>
      <span class="rf-task-meta">
        <small>${escapeHtml(localizeCategory(row.category, state.language))}</small>
        <strong class="${valueClass(row.amountDiff)}">${formatMoney(row.amountDiff)}</strong>
      </span>
      <span class="rf-task-status">
        <i>${escapeHtml(taskLabel)}</i>
        <u>${escapeHtml(action)}</u>
      </span>
    </button>
  `;
}

function rfEditor(item) {
  const row = item.row;
  const accountLabel = localizeAccountLabel(row.code, row.descEn, state.language);
  const totalOnly = item.totalOnly;
  const showVariance = state.rollingViewMode === "variance";
  const ownerSummary = item.ownerMissing ? rfT("ownerNeeded") : totalOnly ? rfT("byTotal") : rfT("byFormula");
  return `
    <div class="rf-editor-head">
      <div>
        <span>${escapeHtml(rfT("selectedAccount"))}</span>
        <h3>${escapeHtml(row.code)} · ${escapeHtml(accountLabel)}</h3>
        <p>${escapeHtml(localizeCategory(row.category, state.language))} · ${escapeHtml(rfT("forecastLogic"))}: ${escapeHtml(forecastLogicForRow(row))}</p>
      </div>
      <div class="rf-status-stack">
        <span class="rf-chip ${item.submitted ? "ok" : item.hasDraft ? "draft" : ""}">${escapeHtml(item.submitted ? rfT("submitted") : item.hasDraft ? rfT("draft") : rfT("usesForecast"))}</span>
        <span class="rf-chip ${item.ownerMissing ? "muted" : "ok"}">${escapeHtml(ownerSummary)}</span>
      </div>
    </div>
    <div class="rf-formula-note">${escapeHtml(totalOnly ? rfT("totalModeHint") : rfT("formulaHint"))}</div>
    <div class="rf-matrix-wrap">
      <table class="rf-matrix ${totalOnly ? "rf-total-mode" : ""} ${showVariance ? "rf-variance-mode" : ""}">
        <thead>
          ${totalOnly ? rfTotalModeHeader(showVariance) : rfUnitQtyHeader(showVariance)}
        </thead>
        <tbody>
          ${ROLLING_FORECAST_MONTHS.map((month) => rfMonthRow(row.code, month, totalOnly, showVariance)).join("")}
        </tbody>
      </table>
    </div>
    ${showVariance ? rfVarianceReasonPanel(row) : ""}
    <div class="rf-submit-bar">
      <div>
        <span>${escapeHtml(rfT("completion"))}</span>
        <strong>${Math.round(item.completion * 100)}%</strong>
        <small>${escapeHtml(rfT("ownerMissing"))}: ${item.ownerMissingCount} · ${escapeHtml(rfT("warnings"))}: ${item.warningCount}</small>
      </div>
      <div class="rf-actions">
        <button type="button" class="ghost-button" data-rf-action="save-current">${escapeHtml(rfT("saveCurrent"))}</button>
        <button type="button" data-rf-action="submit-current">${escapeHtml(rfT("submitCurrent"))}</button>
      </div>
    </div>
  `;
}

function rfUnitQtyHeader(showVariance = state.rollingViewMode === "variance") {
  return `
    <tr>
      <th>${escapeHtml(rfT("month"))}</th>
      <th>${escapeHtml(rfT("forecast48"))}</th>
      <th>${escapeHtml(rfT("unitPrice"))}</th>
      <th>${escapeHtml(rfT("priceOwner"))}</th>
      <th>${escapeHtml(rfT("quantity"))}</th>
      <th>${escapeHtml(rfT("qtyOwner"))}</th>
      <th>${escapeHtml(rfT("rollingTotal"))}</th>
      ${showVariance ? `<th>${escapeHtml(rfT("yoyDiff"))}</th><th>${escapeHtml(rfT("momDiff"))}</th>` : ""}
      <th>${escapeHtml(rfT("warning"))}</th>
    </tr>
  `;
}

function rfTotalModeHeader(showVariance = state.rollingViewMode === "variance") {
  return `
    <tr>
      <th>${escapeHtml(rfT("month"))}</th>
      <th>${escapeHtml(rfT("forecast48"))}</th>
      <th>${escapeHtml(rfT("detailFile"))}</th>
      <th>${escapeHtml(rfT("totalAmount"))}</th>
      <th>${escapeHtml(rfT("totalOwner"))}</th>
      <th>${escapeHtml(rfT("rollingTotal"))}</th>
      ${showVariance ? `<th>${escapeHtml(rfT("yoyDiff"))}</th><th>${escapeHtml(rfT("momDiff"))}</th>` : ""}
      <th>${escapeHtml(rfT("warning"))}</th>
    </tr>
  `;
}

function rfMonthRow(code, month, totalOnly = isRollingTotalOnlyCode(code), showVariance = state.rollingViewMode === "variance") {
  const draft = rollingMonthDraft(code, month);
  const base = forecastAmountForAccount(code, month);
  const totalInfo = rollingTotalInfo(code, month);
  const warning = rollingWarningInfo(code, month);
  const variance = showVariance ? rollingVarianceInfo(code, month) : null;
  const totalClass = warning.level === "severe" ? "severe" : warning.level === "warn" ? "warn" : "";
  if (totalOnly) {
    const detailLabel = draft.detailName ? rfT("replaceDetail") : rfT("uploadDetail");
    return `
      <tr>
        <td>${escapeHtml(localizeMonthLabel(month - 1, state.language))}</td>
        <td>${formatMoney(base)}</td>
        <td class="rf-detail-cell">
          <label class="rf-detail-upload">
            <input type="file" data-rf-field="detailName" data-rf-code="${escapeHtml(code)}" data-rf-month="${month}" />
            <span>${escapeHtml(detailLabel)}</span>
          </label>
          <small>${escapeHtml(draft.detailName || rfT("detailRequired"))}</small>
        </td>
        <td><input inputmode="decimal" data-rf-field="totalAmount" data-rf-code="${escapeHtml(code)}" data-rf-month="${month}" value="${escapeHtml(draft.totalAmount)}" placeholder="--" /></td>
        <td><input data-rf-field="totalOwner" data-rf-code="${escapeHtml(code)}" data-rf-month="${month}" value="${escapeHtml(draft.totalOwner)}" placeholder="${escapeHtml(rfT("ownerNeeded"))}" /></td>
        <td class="rf-total ${totalClass}" data-rf-total-cell><strong>${formatMoney(totalInfo.total)}</strong><small>${escapeHtml(totalInfo.source)}</small></td>
        ${showVariance ? `<td data-rf-yoy-cell class="${valueClass(variance.yoy)}">${formatVarianceWithRate(variance.yoy, variance.same)}</td><td data-rf-mom-cell class="${valueClass(variance.mom)}">${formatVarianceWithRate(variance.mom, variance.previous)}</td>` : ""}
        <td data-rf-warning-cell>${warning.level ? `<span class="rf-warning ${warning.level}">${escapeHtml(warning.label)}</span>` : `<span class="rf-ok">${escapeHtml(rfT("noWarning"))}</span>`}</td>
      </tr>
    `;
  }
  return `
    <tr>
      <td>${escapeHtml(localizeMonthLabel(month - 1, state.language))}</td>
      <td>${formatMoney(base)}</td>
      <td><input inputmode="decimal" data-rf-field="unitPrice" data-rf-code="${escapeHtml(code)}" data-rf-month="${month}" value="${escapeHtml(draft.unitPrice)}" placeholder="--" /></td>
      <td><input data-rf-field="priceOwner" data-rf-code="${escapeHtml(code)}" data-rf-month="${month}" value="${escapeHtml(draft.priceOwner)}" placeholder="${escapeHtml(rfT("ownerNeeded"))}" /></td>
      <td><input inputmode="decimal" data-rf-field="quantity" data-rf-code="${escapeHtml(code)}" data-rf-month="${month}" value="${escapeHtml(draft.quantity)}" placeholder="--" /></td>
      <td><input data-rf-field="quantityOwner" data-rf-code="${escapeHtml(code)}" data-rf-month="${month}" value="${escapeHtml(draft.quantityOwner)}" placeholder="${escapeHtml(rfT("ownerNeeded"))}" /></td>
      <td class="rf-total ${totalClass}" data-rf-total-cell><strong>${formatMoney(totalInfo.total)}</strong><small>${escapeHtml(totalInfo.source)}</small></td>
      ${showVariance ? `<td data-rf-yoy-cell class="${valueClass(variance.yoy)}">${formatVarianceWithRate(variance.yoy, variance.same)}</td><td data-rf-mom-cell class="${valueClass(variance.mom)}">${formatVarianceWithRate(variance.mom, variance.previous)}</td>` : ""}
      <td data-rf-warning-cell>${warning.level ? `<span class="rf-warning ${warning.level}">${escapeHtml(warning.label)}</span>` : `<span class="rf-ok">${escapeHtml(rfT("noWarning"))}</span>`}</td>
    </tr>
  `;
}

function rfVarianceReasonPanel(row) {
  const key = analysisKey(state.result.month, row.code);
  const yoyAnalysis = analysisReason(state.analyses, state.result.month, row.code, "yoy");
  const momAnalysis = analysisReason(state.analyses, state.result.month, row.code, "mom");
  const currentMonth = Number(els.monthSelect?.value || state.result.month || 12);
  const currentVariance = rollingVarianceInfo(row.code, currentMonth);
  return `
    <div class="rf-variance-panel">
      <div class="rf-variance-head">
        <div>
          <h4>${escapeHtml(rfT("varianceReasonTitle"))}</h4>
          <p>${escapeHtml(localizeMonthLabel(currentMonth - 1, state.language))}: ${escapeHtml(rfT("currentRolling"))} ${formatMoney(currentVariance.current)} K€ · ${escapeHtml(rfT("samePeriod"))} ${formatMoney(currentVariance.same)} K€ · ${escapeHtml(rfT("previousMonth"))} ${formatMoney(currentVariance.previous)} K€</p>
        </div>
        <div class="rf-variance-kpis">
          <span class="${valueClass(currentVariance.yoy)}">${escapeHtml(rfT("yoyDiff"))}: ${formatVarianceWithRate(currentVariance.yoy, currentVariance.same)}</span>
          <span class="${valueClass(currentVariance.mom)}">${escapeHtml(rfT("momDiff"))}: ${formatVarianceWithRate(currentVariance.mom, currentVariance.previous)}</span>
        </div>
      </div>
      <div class="rf-reason-grid">
        <label>
          <span>${escapeHtml(rfT("yoyReason"))}</span>
          <textarea data-rf-analysis-key="${escapeHtml(key)}" data-rf-analysis-mode="yoy" placeholder="${escapeHtml(rfT("reasonPlaceholder"))}">${escapeHtml(yoyAnalysis)}</textarea>
        </label>
        <label>
          <span>${escapeHtml(rfT("momReason"))}</span>
          <textarea data-rf-analysis-key="${escapeHtml(key)}" data-rf-analysis-mode="mom" placeholder="${escapeHtml(rfT("reasonPlaceholder"))}">${escapeHtml(momAnalysis)}</textarea>
        </label>
      </div>
    </div>
  `;
}

function rollingVarianceInfo(code, month) {
  const row = state.resultByMonth.get(Number(month))?.rows?.find((item) => String(item.code) === String(code));
  const current = rollingTotalInfo(code, Number(month)).total;
  const same = Number.isFinite(row?.amount25) ? row.amount25 : referenceAmountForAccount(code, month, "same");
  const previous = month > 1
    ? (Number.isFinite(rollingTotalInfo(code, Number(month) - 1).total)
      ? rollingTotalInfo(code, Number(month) - 1).total
      : referenceAmountForAccount(code, Number(month) - 1, "current"))
    : null;
  return {
    current,
    same,
    previous,
    yoy: Number.isFinite(current) && Number.isFinite(same) ? current - same : null,
    mom: Number.isFinite(current) && Number.isFinite(previous) ? current - previous : null
  };
}

function referenceAmountForAccount(code, month, mode = "current") {
  const resultRow = state.resultByMonth.get(Number(month))?.rows?.find((row) => String(row.code) === String(code));
  if (mode === "same" && Number.isFinite(resultRow?.amount25)) return resultRow.amount25;
  if (mode === "previous" && Number.isFinite(resultRow?.previousAmount26)) return resultRow.previousAmount26;
  if (mode === "current" && Number.isFinite(resultRow?.amount26)) return resultRow.amount26;
  const baseline = BASELINE_25_BY_MONTH[month]?.accounts?.find((row) => String(row.code) === String(code));
  if (mode === "same" && Number.isFinite(baseline?.amount25)) return baseline.amount25;
  return forecastAmountForAccount(code, month);
}

function formatVarianceWithRate(value, base) {
  if (!Number.isFinite(value)) return "--";
  const rate = Number.isFinite(base) && base !== 0 ? ` (${formatPercent(value / Math.abs(base))})` : "";
  return `${formatMoney(value)}${rate}`;
}

function rollingRowMeta(row) {
  const totalOnly = isRollingTotalOnlyRow(row);
  const months = ROLLING_FORECAST_MONTHS.map((month) => {
    const draft = rollingMonthDraft(row.code, month);
    const hasUnit = String(draft.unitPrice || "").trim() !== "";
    const hasQty = String(draft.quantity || "").trim() !== "";
    const hasTotal = String(draft.totalAmount || "").trim() !== "";
    const hasOwner = totalOnly
      ? String(draft.totalOwner || "").trim()
      : String(draft.priceOwner || "").trim() || String(draft.quantityOwner || "").trim();
    const hasDetail = String(draft.detailName || "").trim() !== "";
    return {
      month,
      draft,
      hasDraft: totalOnly ? hasTotal || hasOwner || hasDetail : hasUnit || hasQty || hasOwner,
      hasFormula: totalOnly ? hasTotal : hasUnit && hasQty,
      ownerMissing: totalOnly
        ? !String(draft.totalOwner || "").trim()
        : !String(draft.priceOwner || "").trim() || !String(draft.quantityOwner || "").trim(),
      warning: rollingWarningInfo(row.code, month)
    };
  });
  const warningCount = months.filter((item) => item.warning.level).length;
  const ownerMissingCount = months.filter((item) => item.ownerMissing).length;
  const formulaCount = months.filter((item) => item.hasFormula).length;
  const hasDraft = months.some((item) => item.hasDraft);
  return {
    row,
    totalOnly,
    months,
    hasDraft,
    hasFormula: formulaCount > 0,
    ownerMissing: ownerMissingCount > 0,
    ownerMissingCount,
    warningCount,
    completion: ROLLING_FORECAST_MONTHS.length ? formulaCount / ROLLING_FORECAST_MONTHS.length : 0,
    submitted: Boolean(state.rollingForecastSubmitted[row.code])
  };
}

function rollingStats(items) {
  return {
    myTasks: items.filter((item) => rollingFilterMatches(item, "my")).length,
    ownerMissing: items.filter((item) => item.ownerMissing).length,
    warnings: items.filter((item) => item.warningCount).length,
    drafts: items.filter((item) => item.hasDraft && !item.submitted).length,
    submitted: items.filter((item) => item.submitted).length
  };
}

function rollingFilterMatches(item, override = null) {
  const filter = override || state.rollingTaskFilter;
  if (filter === "missing") return item.ownerMissing;
  if (filter === "warning") return item.warningCount > 0;
  if (filter === "my") return rollingOwnedByCurrentUser(item);
  return true;
}

function rollingOwnedByCurrentUser(item) {
  const user = (els.analysisAuthor?.value || els.userName?.value || "").trim().toLowerCase();
  if (!user) return false;
  return item.months.some(({ draft }) => [draft.priceOwner, draft.quantityOwner, draft.totalOwner].some((owner) => String(owner || "").trim().toLowerCase() === user));
}

function rollingMonthDraft(code, month) {
  const account = state.rollingForecastDrafts[code] || {};
  const monthDraft = account[String(month)] || {};
  return {
    unitPrice: String(monthDraft.unitPrice || ""),
    quantity: String(monthDraft.quantity || ""),
    priceOwner: String(monthDraft.priceOwner || ""),
    quantityOwner: String(monthDraft.quantityOwner || ""),
    totalAmount: String(monthDraft.totalAmount || ""),
    totalOwner: String(monthDraft.totalOwner || ""),
    detailName: String(monthDraft.detailName || "")
  };
}

function setRollingMonthDraft(code, month, field, value) {
  state.rollingForecastDrafts[code] = {
    ...(state.rollingForecastDrafts[code] || {}),
    [String(month)]: {
      ...rollingMonthDraft(code, month),
      [field]: value
    }
  };
  delete state.rollingForecastSubmitted[code];
}

function forecastAmountForAccount(code, month) {
  const source = ACCOUNT_FORECAST_DW_BY_MONTH[month];
  const item = source?.accounts?.find((row) => String(row.code) === String(code));
  return Number.isFinite(item?.amount) ? item.amount : null;
}

function rollingTotalInfo(code, month) {
  const draft = rollingMonthDraft(code, month);
  if (isRollingTotalOnlyCode(code)) {
    const total = parseOptionalNumber(draft.totalAmount);
    if (Number.isFinite(total)) return { total, source: rfT("byTotal") };
    return { total: forecastAmountForAccount(code, month), source: rfT("usesForecast") };
  }
  const unit = parseOptionalNumber(draft.unitPrice);
  const qty = parseOptionalNumber(draft.quantity);
  if (Number.isFinite(unit) && Number.isFinite(qty)) {
    return { total: unit * qty, source: rfT("byFormula") };
  }
  return { total: forecastAmountForAccount(code, month), source: rfT("usesForecast") };
}

function rollingWarningInfo(code, month) {
  const current = rollingTotalInfo(code, month).total;
  const previous = month > 1 ? rollingTotalInfo(code, month - 1).total : null;
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return { level: "", label: "" };
  const ratio = (current - previous) / Math.abs(previous);
  if (Math.abs(ratio) < 0.2) return { level: "", label: "" };
  const pct = `${ratio >= 0 ? "+" : ""}${Math.round(ratio * 100)}%`;
  return { level: Math.abs(ratio) >= 0.5 ? "severe" : "warn", label: pct };
}

function parseOptionalNumber(value) {
  const text = String(value ?? "").replace(/,/g, "").trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function rollingRowForCode(code) {
  return state.result?.rows?.find((row) => String(row.code) === String(code)) || null;
}

function isRollingTotalOnlyCode(code) {
  const row = rollingRowForCode(code);
  return row ? isRollingTotalOnlyRow(row) : false;
}

function isRollingTotalOnlyRow(row) {
  const text = `${row.code || ""} ${row.descEn || ""} ${row.category || ""}`.toLowerCase();
  return text.includes("repair") || text.includes("maint");
}

function forecastLogicForRow(row) {
  const text = `${row.code} ${row.descEn || ""} ${row.category || ""}`.toLowerCase();
  if (text.includes("uniform") || text.includes("transport")) {
    return state.language === "en" ? "unit price from operations, quantity from HR" : state.language === "tr" ? "birim fiyat operasyon, miktar HR" : "单价由运营提供，数量由HR提供";
  }
  if (text.includes("repair") || text.includes("maint")) {
    return state.language === "en" ? "Upload maintenance detail and fill one total amount" : state.language === "tr" ? "Bakım detayını yükleyin ve tek toplam tutar girin" : "上传维修明细，直接填写总价";
  }
  if (text.includes("inventory") || text.includes("devaluation") || text.includes("obsolete")) {
    return state.language === "en" ? "SAP aging report plus planning risk judgement" : state.language === "tr" ? "SAP yaşlandırma raporu ve planlama risk kararı" : "SAP aging report + 计划部门风险判断";
  }
  if (text.includes("labour") || text.includes("labor") || text.includes("salary") || text.includes("overtime")) {
    return state.language === "en" ? "HR labor plan, overtime, festival payment and salary mix" : state.language === "tr" ? "HR iş gücü planı, mesai, bayram ödemesi ve maaş karması" : "HR labor plan + 加班 + 节日付款 + salary mix";
  }
  return state.language === "en" ? "fill unit price, quantity and responsible owners" : state.language === "tr" ? "birim fiyat, miktar ve sorumluları doldurun" : "填写单价、数量和责任人";
}

function handleRollingForecastClick(event) {
  const modeButton = event.target.closest("[data-rf-view-mode]");
  if (modeButton) {
    state.rollingViewMode = modeButton.dataset.rfViewMode === "variance" ? "variance" : "fill";
    renderTable();
    return;
  }
  const filterButton = event.target.closest("[data-rf-filter]");
  if (filterButton) {
    state.rollingTaskFilter = filterButton.dataset.rfFilter;
    renderTable();
    return;
  }
  const selectButton = event.target.closest("[data-rf-select]");
  if (selectButton) {
    state.rollingSelectedCode = selectButton.dataset.rfSelect;
    renderTable();
    return;
  }
  const action = event.target.closest("[data-rf-action]")?.dataset.rfAction;
  if (!action) return;
  if (action === "save-all") {
    saveRollingForecastDrafts();
    toast(rfT("saved"));
    return;
  }
  if (action === "save-current") {
    saveRollingForecastDrafts();
    toast(rfT("currentSaved"));
    return;
  }
  if (action === "submit-current") {
    if (state.rollingSelectedCode) state.rollingForecastSubmitted[state.rollingSelectedCode] = new Date().toISOString();
    state.rollingViewMode = "variance";
    saveRollingForecastDrafts();
    toast(rfT("currentSubmitted"));
    renderTable();
    return;
  }
  if (action === "submit-all") {
    for (const row of visibleRows()) {
      if (row.code) state.rollingForecastSubmitted[row.code] = new Date().toISOString();
    }
    state.rollingViewMode = "variance";
    saveRollingForecastDrafts();
    toast(rfT("submittedToast"));
    renderTable();
  }
}

function handleRollingForecastInput(event) {
  const analysisTarget = event.target.closest("[data-rf-analysis-key]");
  if (analysisTarget) {
    const key = analysisTarget.dataset.rfAnalysisKey;
    state.analyses[key] = {
      ...analysisReasons(state.analyses[key]),
      [analysisTarget.dataset.rfAnalysisMode]: analysisTarget.value
    };
    if (els.analysisSaveStatus) els.analysisSaveStatus.textContent = t("unsavedChanges");
    if (event.type === "input") {
      renderNarrative();
      renderChart();
    }
    return;
  }
  const target = event.target.closest("[data-rf-field]");
  if (!target) return;
  const value = target.type === "file" ? target.files?.[0]?.name || "" : target.value;
  setRollingMonthDraft(target.dataset.rfCode, target.dataset.rfMonth, target.dataset.rfField, value);
  if (els.analysisSaveStatus) els.analysisSaveStatus.textContent = t("unsavedChanges");
  if (target.dataset.rfField === "unitPrice" || target.dataset.rfField === "quantity" || target.dataset.rfField === "totalAmount") {
    refreshRollingMatrixRows(target.dataset.rfCode);
  }
  if (event.type === "change") renderTable();
}

function refreshRollingMatrixRows(code) {
  if (!els.forecastWorkspace || !code) return;
  const rows = els.forecastWorkspace.querySelectorAll(`.rf-matrix tbody tr`);
  for (const row of rows) {
    const month = row.querySelector("[data-rf-month]")?.dataset.rfMonth;
    if (!month) continue;
    const totalInfo = rollingTotalInfo(code, Number(month));
    const warning = rollingWarningInfo(code, Number(month));
    const variance = rollingVarianceInfo(code, Number(month));
    const totalClass = warning.level === "severe" ? "severe" : warning.level === "warn" ? "warn" : "";
    const totalCell = row.querySelector("[data-rf-total-cell]");
    const yoyCell = row.querySelector("[data-rf-yoy-cell]");
    const momCell = row.querySelector("[data-rf-mom-cell]");
    const warningCell = row.querySelector("[data-rf-warning-cell]");
    if (totalCell) {
      totalCell.className = `rf-total ${totalClass}`.trim();
      totalCell.innerHTML = `<strong>${formatMoney(totalInfo.total)}</strong><small>${escapeHtml(totalInfo.source)}</small>`;
    }
    if (yoyCell) {
      yoyCell.className = valueClass(variance.yoy);
      yoyCell.textContent = formatVarianceWithRate(variance.yoy, variance.same);
    }
    if (momCell) {
      momCell.className = valueClass(variance.mom);
      momCell.textContent = formatVarianceWithRate(variance.mom, variance.previous);
    }
    if (warningCell) {
      warningCell.innerHTML = warning.level
        ? `<span class="rf-warning ${warning.level}">${escapeHtml(warning.label)}</span>`
        : `<span class="rf-ok">${escapeHtml(rfT("noWarning"))}</span>`;
    }
  }
}

function saveRollingForecastDrafts() {
  try {
    localStorage.setItem(ROLLING_FORECAST_DRAFT_KEY, JSON.stringify(state.rollingForecastDrafts));
    localStorage.setItem(ROLLING_FORECAST_SUBMIT_KEY, JSON.stringify(state.rollingForecastSubmitted));
    if (els.analysisSaveStatus) els.analysisSaveStatus.textContent = rfT("saved");
  } catch (error) {
    toast(error.message || String(error), true);
  }
}

function loadRollingForecastDrafts() {
  try {
    if (typeof localStorage === "undefined") return {};
    return JSON.parse(localStorage.getItem("dwRollingForecastDrafts.v1") || "{}") || {};
  } catch {
    return {};
  }
}

function loadRollingForecastSubmitted() {
  try {
    if (typeof localStorage === "undefined") return {};
    return JSON.parse(localStorage.getItem("dwRollingForecastSubmitted.v1") || "{}") || {};
  } catch {
    return {};
  }
}

function rfT(key) {
  return ROLLING_FORECAST_TEXT[state.language]?.[key] || ROLLING_FORECAST_TEXT.zh[key] || key;
}

async function submitCurrentMonthAnalyses() {
  if (!state.result) return;
  const author = els.analysisAuthor?.value.trim() || els.userName.value.trim();
  if (!author) {
    toast(t("fillAuthorName"), true);
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
          text: serializeAnalysisReasons(state.analyses[key]),
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
    const translations = { ...(existing.translations || {}) };
    const readProjectField = (field) => {
      const value = get(field);
      if (state.language === "zh") return value;
      const displayed = localizeProjectField(existing, field, state.language);
      if (value === displayed) return existing[field] || "";
      translations[state.language] = {
        ...(translations[state.language] || {}),
        [field]: value
      };
      return existing[field] || value;
    };
    const textFields = Object.fromEntries(projectTextFields().map((field) => [field, readProjectField(field)]));
    return {
      ...existing,
      id: existing.id || String(index + 1),
      type: "decrease",
      lead: existing.lead || "",
      ...textFields,
      plannedImpact: parseEditableNumber(get("plannedImpact")),
      actualCumulative: parseEditableNumber(get("actualCumulative")),
      progress: textFields.progress,
      translations
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
    const yoyAnalysis = analysisReason(state.analyses, state.result.month, row.code, "yoy");
    const momAnalysis = analysisReason(state.analyses, state.result.month, row.code, "mom");
    const description = analysisReason(state.analyses, state.result.month, row.code, "description");
    const highYoy = Math.abs(row.unitDiff || 0) >= 0.5;
    const highMom = Math.abs(row.momUnitDiff || 0) >= 0.5;
    if (category !== "all" && row.category !== category) return false;
    if (filter === "high" && !highYoy && !highMom) return false;
    if (filter === "blank" && !((highYoy && !yoyAnalysis.trim()) || (highMom && !momAnalysis.trim()))) return false;
    if (!search) return true;
    const localizedAccount = localizeAccountLabel(row.code, row.descEn, state.language);
    return `${row.code} ${row.descEn} ${row.descCn || ""} ${localizedAccount} ${row.category} ${description} ${yoyAnalysis} ${momAnalysis}`.toLowerCase().includes(search);
  });
  rows.sort((a, b) => {
    if (sortBy === "code") return a.code.localeCompare(b.code, "zh-Hans-CN", { numeric: true });
    const key = {
      unit: "unitDiff",
      momUnit: "momUnitDiff",
      amount: "amountDiff",
      momAmount: "momAmountDiff"
    }[sortBy] || "unitDiff";
    return Math.abs(b[key] || 0) - Math.abs(a[key] || 0);
  });
  return rows;
}

function rowToHtml(row) {
  const key = analysisKey(state.result.month, row.code);
  const yoyAnalysis = analysisReason(state.analyses, state.result.month, row.code, "yoy");
  const momAnalysis = analysisReason(state.analyses, state.result.month, row.code, "mom");
  const description = analysisReason(state.analyses, state.result.month, row.code, "description");
  const majorYoy = Math.abs(row.unitDiff || 0) >= 0.5;
  const majorMom = Math.abs(row.momUnitDiff || 0) >= 0.5;
  const major = majorYoy || majorMom;
  const tooltip = accountCostTooltip(row);
  const accountLabel = localizeAccountLabel(row.code, row.descEn, state.language);
  const descriptionTemplate = descriptionTemplateForRow(row);
  const attachmentName = state.descriptionAttachments[key] || "";
  const summarySuffix = state.language === "tr" ? "kategori toplamı" : state.language === "en" ? "category total" : "大科目汇总";
  const unsplitLabel = state.language === "tr"
    ? "5+7 tahmini alt hesaplara dağıtılmamıştır"
    : state.language === "en"
      ? "5+7 forecast is not split by account"
      : "5+7预测未拆分到小科目";
  return `
    <tr class="${major ? "high" : ""} ${row.amountDiff > 0 ? "cost-worse" : row.amountDiff < 0 ? "cost-better" : ""}">
      <td><div class="account-code">${escapeHtml(row.isCategorySummary ? `${localizeCategory(row.category, state.language)} (${summarySuffix})` : row.code)}</div><div class="desc">${escapeHtml(row.isCategorySummary ? unsplitLabel : accountLabel)}</div></td>
      <td>${escapeHtml(localizeCategory(row.category, state.language))}</td>
      <td tabindex="0" data-metric-tooltip="${escapeHtml(tooltip)}">${formatMoney(row.amount25)}</td>
      <td tabindex="0" data-metric-tooltip="${escapeHtml(tooltip)}">${formatMoney(row.previousAmount26)}</td>
      <td tabindex="0" class="${valueClass(row.amountDiff)}" data-metric-tooltip="${escapeHtml(tooltip)}">${formatMoney(row.amount26)}</td>
      <td class="editable-cell description-edit-cell">
        <textarea data-key="${escapeHtml(key)}" data-mode="description" data-month="${state.result.month}" data-code="${escapeHtml(row.code)}" placeholder="${escapeHtml(descriptionTemplate.placeholder)}">${escapeHtml(description)}</textarea>
        <div class="attachment-row ${descriptionTemplate.allowAttachment ? "" : "no-attachment"}">
          <label class="attachment-button">
            <input class="description-attachment-input" type="file" data-key="${escapeHtml(key)}" ${descriptionTemplate.allowAttachment ? "" : "disabled"} />
            <span>${escapeHtml(descriptionTemplate.allowAttachment ? t("attachmentButton") : t("noPersonalAttachment"))}</span>
          </label>
          <span class="attachment-name">${escapeHtml(descriptionTemplate.allowAttachment ? attachmentName : "")}</span>
        </div>
      </td>
      <td class="editable-cell"><textarea class="${majorYoy ? "major" : ""}" data-key="${escapeHtml(key)}" data-mode="yoy" data-month="${state.result.month}" data-code="${escapeHtml(row.code)}" placeholder="${majorYoy ? t("placeholderMajor") : t("placeholderSmall")}">${escapeHtml(yoyAnalysis)}</textarea></td>
      <td class="editable-cell"><textarea class="${majorMom ? "major" : ""}" data-key="${escapeHtml(key)}" data-mode="mom" data-month="${state.result.month}" data-code="${escapeHtml(row.code)}" placeholder="${majorMom ? t("placeholderMajor") : t("placeholderSmall")}">${escapeHtml(momAnalysis)}</textarea></td>
    </tr>
  `;
}

function descriptionTemplateForRow(row) {
  const code = String(row.code || "");
  const category = String(row.category || "");
  const desc = String(row.descEn || "").toLowerCase();
  const language = state.language;
  const templates = {
    zh: {
      unit: "单价 × 数量",
      list: "清单编号 / 供应商 / 金额 / 用途",
      labor: "人数 / 工时 × 产量",
      asset: "资产名称 / 原值 / 折旧年限 / 本月折旧",
      energy: "单价 × 用量",
      scrap: "回收重量 × 单价",
      category: "大科目总额说明 / 主要驱动项",
      laborHint: "仅填汇总数和量，不上传个人明细"
    },
    en: {
      unit: "Unit price × quantity",
      list: "List no. / supplier / amount / purpose",
      labor: "Headcount / hours × volume",
      asset: "Asset / original value / useful life / monthly depreciation",
      energy: "Unit price × usage",
      scrap: "Recovered weight × unit price",
      category: "Category total note / main driver",
      laborHint: "Use totals only; do not upload personal details"
    },
    tr: {
      unit: "Birim fiyat × miktar",
      list: "Liste no. / tedarikçi / tutar / amaç",
      labor: "Kişi sayısı / saat × hacim",
      asset: "Varlık / ilk değer / faydalı ömür / aylık amortisman",
      energy: "Birim fiyat × kullanım",
      scrap: "Geri kazanılan ağırlık × birim fiyat",
      category: "Kategori toplam notu / ana etken",
      laborHint: "Sadece toplam sayı ve miktar; kişisel detay yüklemeyin"
    }
  }[language] || {};
  const unitQuantityCodes = new Set(["6666010314", "6666010315", "6666010322", "6666020401", "6666020402", "6666020502", "6666020503"]);
  const listCodes = new Set(["6666021500", "6666021502", "6666021503", "6666021505", "6666021506", "6666070400", "6666079999"]);
  if (row.isCategorySummary) {
    return category.includes("人工")
      ? { placeholder: templates.labor, allowAttachment: false, hint: templates.laborHint }
      : { placeholder: templates.category, allowAttachment: true, hint: t("attachmentHint") };
  }
  if (unitQuantityCodes.has(code)) return { placeholder: templates.unit, allowAttachment: true, hint: t("attachmentHint") };
  if (listCodes.has(code)) return { placeholder: templates.list, allowAttachment: true, hint: t("attachmentHint") };
  const isLabor = category.includes("人工") || code.startsWith("666601") || code === "5001010205" || code === "5001010206";
  if (isLabor) return { placeholder: templates.labor, allowAttachment: false, hint: templates.laborHint };
  if (category.includes("折旧") || desc.includes("depreciation") || desc.includes("amortization")) {
    return { placeholder: templates.asset, allowAttachment: true, hint: t("attachmentHint") };
  }
  if (category.includes("能源") || desc.includes("energy") || desc.includes("electricity") || desc.includes("water") || desc.includes("oil") || desc.includes("gas")) {
    return { placeholder: templates.energy, allowAttachment: true, hint: t("attachmentHint") };
  }
  if (category.includes("废料") || desc.includes("scrap") || desc.includes("scrapped")) {
    return { placeholder: templates.scrap, allowAttachment: true, hint: t("attachmentHint") };
  }
  const unitQuantityWords = ["work uniforms", "working meals", "office supplies", "local transportation", "fuel allowance"];
  if (unitQuantityWords.some((word) => desc.includes(word))) {
    return { placeholder: templates.unit, allowAttachment: true, hint: t("attachmentHint") };
  }
  const listWords = ["repair", "maintenance", "it ", "software", "consulting", "service", "travel", "rental", "cleaning", "security", "training", "custom", "stamp", "tax", "audit", "legal", "distribution", "material", "consumable"];
  if (category.includes("运营") || category.includes("制造费") || listWords.some((word) => desc.includes(word))) {
    return { placeholder: templates.list, allowAttachment: true, hint: t("attachmentHint") };
  }
  return { placeholder: templates.unit, allowAttachment: true, hint: t("attachmentHint") };
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
    const headers = categoryComparisonHeaders(state.language, varianceCostLabels());
    els.categoryDiagnostics.innerHTML = `
      <div class="category-comparison-head">
        ${headers.map((header) => `<span>${escapeHtml(header)}</span>`).join("")}
      </div>
      ${rows.map((item) => `
        <button class="category-diagnostic category-comparison-row ${item.amountDiff > 0 ? "bad" : "good"} ${item.isTotal ? "total-row" : ""}" type="button" data-category="${escapeHtml(item.category)}" data-metric-tooltip="${escapeHtml(categoryTooltip(item))}">
          <span>${escapeHtml(localizeCategory(item.category, state.language))}</span>
          <em>${formatMoney(item.amount25)}</em>
          <em>${formatMoney(item.previousAmount26)}</em>
          <strong class="${valueClass(item.amountDiff)}">${formatMoney(item.amount26)}</strong>
          <em class="analysis-cell">${escapeHtml(buildCategoryReasonText(item, "yoy"))}</em>
          <em class="analysis-cell">${escapeHtml(buildCategoryReasonText(item, "mom"))}</em>
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
  return costVarianceTooltip(
    `${localizeCategory(item.category, state.language)} · ${localizeMonthLabel((state.result?.month || 1) - 1, state.language)}`,
    item
  );
}

function accountCostTooltip(row) {
  return costVarianceTooltip(`${row.code} ${row.descEn}`, row);
}

function costVarianceTooltip(title, item) {
  const amountYoyRate = ratioNullable(item.amountDiff, item.amount25);
  const amountMomRate = ratioNullable(item.momAmountDiff, item.previousAmount26);
  const unitYoyRate = ratioNullable(item.unitDiff, item.unit25);
  const unitMomRate = ratioNullable(item.momUnitDiff, item.previousUnit26);
  const unitLabel = t("unitEuroPc");
  return [
    title,
    `${t("tooltipCost")}: ${t("tooltipSame")} ${formatMoney(item.amount25)} K€ · ${t("tooltipPrevious")} ${formatMoney(item.previousAmount26)} K€ · ${t("tooltipCurrent")} ${formatMoney(item.amount26)} K€`,
    varianceTooltipLine(t("tooltipAmountYoy"), item.amountDiff, "K€", amountYoyRate),
    varianceTooltipLine(t("tooltipAmountMom"), item.momAmountDiff, "K€", amountMomRate),
    `${t("tooltipUnit")}: ${t("tooltipSame")} ${formatUnit(item.unit25)} ${unitLabel} · ${t("tooltipPrevious")} ${formatUnit(item.previousUnit26)} ${unitLabel} · ${t("tooltipCurrent")} ${formatUnit(item.unit26)} ${unitLabel}`,
    varianceTooltipLine(t("tooltipUnitYoy"), item.unitDiff, unitLabel, unitYoyRate),
    varianceTooltipLine(t("tooltipUnitMom"), item.momUnitDiff, unitLabel, unitMomRate),
    Number.isFinite(item.manufacturingDiff)
      ? `<span class="${item.manufacturingDiff <= 0 ? "tooltip-good" : "tooltip-bad"}">${t("tooltipMfgVariance")}: ${formatMoney(item.manufacturingDiff)} K€</span>`
      : ""
  ].filter(Boolean).join("\n");
}

function varianceTooltipLine(label, value, unit, rate) {
  if (!Number.isFinite(value)) return "";
  const good = value <= 0;
  const colon = state.language === "zh" ? "：" : ": ";
  const rateText = Number.isFinite(rate)
    ? state.language === "zh"
      ? `（${formatPercent(Math.abs(rate))}）`
      : ` (${formatPercent(Math.abs(rate))})`
    : "";
  return `<span class="${good ? "tooltip-good" : "tooltip-bad"}">${label}${colon}${formatSigned(value, unit)}${rateText} · ${t(good ? "better" : "worse")}</span>`;
}

function formatSigned(value, unit) {
  const formatted = unit === "K€" ? formatMoney(Math.abs(value)) : formatUnit(Math.abs(value));
  return `${value > 0 ? "+" : value < 0 ? "-" : ""}${formatted} ${unit}`;
}

function ratioNullable(value, base) {
  return Number.isFinite(value) && Number.isFinite(base) && base !== 0 ? value / base : null;
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
  if (els.projectSummary) els.projectSummary.innerHTML = buildLocalizedProjectSummaryText();
  renderLocalizedProjectImpactCards();
  els.factorBody.innerHTML = state.factors.length
    ? state.factors.map((item, index) => factorRowHtml(item, index)).join("")
    : `<tr><td colspan="9" class="empty-cell">${t("emptyFactors")}</td></tr>`;
}

function factorRowHtml(item, index) {
  const display = (field) => state.activeUnit === "cooking"
    ? (item[field] ?? "")
    : localizeProjectField(item, field, state.language);
  return `
    <tr data-index="${index}">
      <td><input data-field="category" value="${escapeHtml(display("category"))}" /></td>
      <td><textarea data-field="strategy">${escapeHtml(display("strategy"))}</textarea></td>
      <td><textarea data-field="project">${escapeHtml(display("project"))}</textarea></td>
      <td><input data-field="owner" value="${escapeHtml(display("owner"))}" /></td>
      <td><input data-field="timing" value="${escapeHtml(display("timing"))}" /></td>
      <td><input data-field="plannedImpact" value="${formatEditable(item.plannedImpact)}" /></td>
      <td><input data-field="actualCumulative" value="${formatEditable(item.actualCumulative)}" /></td>
      <td><textarea data-field="progress">${escapeHtml(display("progress"))}</textarea></td>
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

function renderLocalizedProjectImpactCards() {
  if (!els.projectImpactCards) return;
  if (state.activeUnit !== "cooking" && state.factorMonth === 4) {
    const card = (title, value, note, klass = "") => `
      <div class="impact-card ${klass || (value < 0 ? "bad" : "good")}">
        <span>${escapeHtml(projectMonthLabel())} · ${escapeHtml(localizeProjectText(title, state.language))}</span>
        <strong>${formatMoney(value)} K€</strong>
        <small>${escapeHtml(localizeProjectText(note, state.language))}</small>
      </div>`;
    els.projectImpactCards.innerHTML = `
      ${card("订单量 规模负影响", -1000, "三张表口径：订单量下降负影响100万欧", "bad")}
      ${card("通胀负影响", -400, "三张表口径：通胀负影响40万欧", "bad")}
      ${card("降费项目", 700, "新增63万欧 + 持续收益7万欧", "good")}
      ${card("园区分摊", 10, "园区分摊下降1万欧", "good")}
      <div><span>${escapeHtml(projectMonthLabel())} · ${escapeHtml(t("increaseTotal"))}</span><strong class="bad">-1,400 K€</strong></div>
      <div><span>${escapeHtml(projectMonthLabel())} · ${escapeHtml(t("decreaseTotal"))}</span><strong class="good">710 K€</strong></div>
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
  const impactCard = (title, data) => `
    <div class="impact-card ${data.actual <= 0 ? "bad" : "good"}">
      <span>${escapeHtml(projectMonthLabel())} · ${escapeHtml(title)}</span>
      <strong>${formatMoney(data.actual)} K€</strong>
      <small>${escapeHtml(t("plannedShort"))}: ${formatMoney(data.planned)} K€ / ${escapeHtml(t("actualShort"))}: ${formatMoney(data.actual)} K€</small>
    </div>`;
  els.projectImpactCards.innerHTML = `
    ${impactCard(t("scaleImpact"), impacts.scale)}
    ${impactCard(t("wageImpact"), impacts.wage)}
    ${impactCard(t("inflationImpact"), impacts.inflation)}
    <div><span>${escapeHtml(projectMonthLabel())} · ${escapeHtml(t("increaseTotal"))}</span><strong>${formatMoney(planned)} K€</strong></div>
    <div><span>${escapeHtml(projectMonthLabel())} · ${escapeHtml(t("decreaseTotal"))}</span><strong>${formatMoney(actual)} K€</strong></div>
    <div><span>${escapeHtml(projectMonthLabel())} · ${escapeHtml(t("netImpact"))}</span><strong class="${valueClass(actual - planned)}">${formatMoney(actual - planned)} K€</strong></div>
  `;
}

function buildLocalizedProjectSummaryText() {
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
    .map((item) => state.activeUnit === "cooking"
      ? (item.project || item.strategy || item.category)
      : localizeProjectField(item, "project", state.language) || localizeProjectField(item, "strategy", state.language) || localizeProjectField(item, "category", state.language))
    .join(state.language === "zh" ? "、" : "; ");
  const achieved = formatPercent(planned ? actual / planned : null);
  if (state.language === "en") {
    return `${projectMonthLabel()} model includes ${state.factors.length} factors and cost reduction projects. Monthly planned benefit is ${formatMoney(planned)} K€, actual benefit is ${formatMoney(actual)} K€, achievement rate is ${achieved}. Scale, wage and inflation impacts are ${formatMoney(impactActual("scale"))} K€, ${formatMoney(impactActual("wage"))} K€ and ${formatMoney(impactActual("inflation"))} K€. Key projects: ${top || "to be filled"}.`;
  }
  if (state.language === "tr") {
    return `${projectMonthLabel()} modeli ${state.factors.length} faktör ve maliyet azaltma projesi içerir. Aylık planlanan fayda ${formatMoney(planned)} K€, gerçekleşen fayda ${formatMoney(actual)} K€, gerçekleşme oranı ${achieved}. Ölçek, ücret ve enflasyon etkileri ${formatMoney(impactActual("scale"))} K€, ${formatMoney(impactActual("wage"))} K€ ve ${formatMoney(impactActual("inflation"))} K€. Ana projeler: ${top || "doldurulacak"}.`;
  }
  return `${projectMonthLabel()}模型包含 ${state.factors.length} 项因素与降费项目；当月降费项目预计收益 ${formatMoney(planned)} K€，实际收益 ${formatMoney(actual)} K€，达成率 ${achieved}。规模变化、工资上涨、通胀影响分别为 ${formatMoney(impactActual("scale"))} K€、${formatMoney(impactActual("wage"))} K€、${formatMoney(impactActual("inflation"))} K€；重点项目为 ${top || "待补充"}。`;
}

function projectMonthLabel() {
  return localizeMonthLabel(state.factorMonth - 1, state.language);
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
  if (name === "variance") renderTable();
  if (name === "projects") {
    syncMonthSelectFromState();
    renderFactors();
  }
}

function applyLanguage(language) {
  state.language = language;
  document.documentElement.lang = language === "zh" ? "zh-CN" : language;
  document.title = t("appTitle");
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
    const yoyMissing = Math.abs(row.unitDiff || 0) >= 0.5
      && !analysisReason(state.analyses, state.result.month, row.code, "yoy").trim();
    const momMissing = Math.abs(row.momUnitDiff || 0) >= 0.5
      && !analysisReason(state.analyses, state.result.month, row.code, "mom").trim();
    return yoyMissing || momMissing;
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

function sumFinite(...values) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? finite.reduce((total, value) => total + value, 0) : null;
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
