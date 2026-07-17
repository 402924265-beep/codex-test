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
import { COOKING_UNIT } from "./cooking-data.js?v=20260709-ck-online-logic-v5";
import { buildHrBudgetAccountSync } from "./hr-budget-sync.js?v=20260715-hr-sync-v2";
import { ADMIN_BUDGET_DATA, ADMIN_BUDGET_MONTHS, ADMIN_DRIVER_MATRIX, adminCategoryMonthlyEur } from "./admin-budget-data.js?v=20260716-admin-v3";
import { buildAdminBudgetAccountSync } from "./admin-budget-sync.js?v=20260716-admin-v1";

const VERSION = "20260717-adaptive-v1";

const COOKING_HEADCOUNT_ROWS = [
  {
    label: "直接员工",
    rows: [
      { scenario: "同期", values: [279, 296, 293, 296, 293, 260, 247, 239, 248, 310, 310, 280] },
      { scenario: "预算", values: [286, 317, 317, 258, 258, 258, 258, 258, 295, 295, 343, 343] },
      { scenario: "26年", values: [294, 300, 325, 265, 258, 258, 258, 258, 295, 295, 343, 343] }
    ]
  },
  {
    label: "间接员工",
    rows: [
      { scenario: "同期", values: [170, 181, 180, 182, 178, 148, 126, 127, 120, 132, 134, 133] },
      { scenario: "预算", values: [133, 136, 136, 127, 127, 127, 127, 127, 133, 133, 142, 142] },
      { scenario: "26年", values: [127, 126, 125, 113, 127, 127, 127, 127, 133, 133, 142, 142] }
    ]
  },
  {
    label: "白领",
    rows: [
      { scenario: "同期", values: [58, 58, 56, 55, 53, 38, 35, 38, 33, 31, 31, 31] },
      { scenario: "预算", values: [34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34] },
      { scenario: "26年", values: [30, 31, 30, 28, 34, 34, 34, 34, 34, 34, 34, 34] }
    ]
  }
];

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
    emptyCategoryChart: "导入SAP报表后显示大科目对比",
    roleBrand: "三张表制造费用经营驾驶舱",
    roleTestVersion: "预算协同测试版",
    roleSelectTitle: "选择你的工作角色",
    roleSelectHint: "当前为内部测试版，无需密码。不同角色进入后只显示职责范围内的数据与操作。",
    costRole: "成本角色",
    costRoleHint: "查看经营驾驶舱、月度差异、全部预算科目和降费项目",
    hrRole: "人力角色",
    hrRoleHint: "仅查看和校核人力预算参数、人力小科目及异常",
    adminRole: "行政部门",
    adminRoleHint: "仅校核行政预算标准、月度金额和变更原因",
    adminDepartment: "行政部门",
    fullView: "完整视图",
    limitedView: "受限视图",
    enterWorkspace: "进入工作台",
    roleSwitchHint: "演示身份可在页面右上角随时切换",
    cockpitBrand: "制造费用经营驾驶舱",
    turkey: "土耳其",
    cookingFactory: "厨电工厂",
    dishwasher: "洗碗机",
    overseasReserved: "海外工厂预留",
    india: "印度",
    pakistan: "巴基斯坦",
    currentBusinessUnit: "当前经营单元",
    permission: "权限",
    financeAdmin: "财务管理员",
    hrHuman: "HR 人力",
    procurementAdmin: "行政/间接采购",
    businessLeader: "经营负责人",
    readonlyVisitor: "只读访客",
    switchRole: "切换角色",
    cookingSubtitle: "厨电制造费用经营驾驶舱",
    dishwasherSubtitle: "洗碗机制造费用经营驾驶舱",
    cookingSource: "当前：厨电工厂 · 已内置同期、预算、实际、人数、降费项目",
    dishwasherSource: "当前：洗碗机 · 已内置5+7预测、国内财务表、May Actual",
    cookingHeaderHint: "整合同期、预算、实际、人数与降费项目，形成费用发生制经营视图",
    roleAccess: "角色权限",
    supplyCostControl: "供应链成本控制",
    cookingAppliance: "厨电",
    dishwasherAppliance: "洗碗机",
    comingSoon: "即将开放"
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
    emptyCategoryChart: "Import April actual table to show category comparison",
    roleBrand: "Three-Table Manufacturing Cost Cockpit",
    roleTestVersion: "Budget Collaboration Preview",
    roleSelectTitle: "Select your work role",
    roleSelectHint: "No password is required in this internal preview. Each role only sees data and actions within its responsibility.",
    costRole: "Cost Controller",
    costRoleHint: "View the cockpit, monthly variance, all budget accounts and cost reduction projects",
    hrRole: "HR",
    hrRoleHint: "View and validate HR budget parameters, HR accounts and exceptions only",
    adminRole: "Administration",
    adminRoleHint: "Validate administration budget standards, monthly amounts and change reasons only",
    adminDepartment: "Administration",
    fullView: "Full view",
    limitedView: "Restricted view",
    enterWorkspace: "Enter workspace",
    roleSwitchHint: "The demo role can be switched from the upper-right corner",
    cockpitBrand: "Manufacturing Cost Cockpit",
    turkey: "Türkiye",
    cookingFactory: "Cooking Factory",
    dishwasher: "Dishwasher",
    overseasReserved: "Reserved overseas plants",
    india: "India",
    pakistan: "Pakistan",
    currentBusinessUnit: "Current business unit",
    permission: "Permission",
    financeAdmin: "Finance administrator",
    hrHuman: "HR",
    procurementAdmin: "Administration / Indirect Procurement",
    businessLeader: "Business leader",
    readonlyVisitor: "Read-only visitor",
    switchRole: "Switch role",
    cookingSubtitle: "Cooking Manufacturing Cost Cockpit",
    dishwasherSubtitle: "Dishwasher Manufacturing Cost Cockpit",
    cookingSource: "Current: Cooking Factory · Same period, budget, actual, headcount and projects built in",
    dishwasherSource: "Current: Dishwasher · 5+7 forecast, finance table and May Actual built in",
    cookingHeaderHint: "Combine same period, budget, actual, headcount and projects into an accrual-based operating view",
    roleAccess: "Role Access",
    supplyCostControl: "Supply Cost Control",
    cookingAppliance: "Cooking appliance",
    dishwasherAppliance: "Dishwasher",
    comingSoon: "Coming soon"
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
    emptyCategoryChart: "Kategori karşılaştırması için SAP gerçekleşen yükleyin",
    roleBrand: "Üç Tablolu Üretim Gideri Kokpiti",
    roleTestVersion: "Bütçe İş Birliği Önizlemesi",
    roleSelectTitle: "Çalışma rolünüzü seçin",
    roleSelectHint: "Bu dahili önizlemede parola gerekmez. Her rol yalnızca kendi sorumluluğundaki veri ve işlemleri görür.",
    costRole: "Maliyet Kontrol Rolü",
    costRoleHint: "Kokpit, aylık farklar, tüm bütçe hesapları ve maliyet düşürme projelerini görüntüler",
    hrRole: "İnsan Kaynakları",
    hrRoleHint: "Yalnızca İK bütçe parametrelerini, İK hesaplarını ve istisnaları görüntüler ve doğrular",
    adminRole: "İdari İşler",
    adminRoleHint: "Yalnızca idari bütçe standartlarını, aylık tutarları ve değişiklik nedenlerini doğrular",
    adminDepartment: "İdari İşler",
    fullView: "Tam görünüm",
    limitedView: "Kısıtlı görünüm",
    enterWorkspace: "Çalışma alanına gir",
    roleSwitchHint: "Demo rolü sağ üst köşeden değiştirilebilir",
    cockpitBrand: "Üretim Gideri Kokpiti",
    turkey: "Türkiye",
    cookingFactory: "Pişirme Fabrikası",
    dishwasher: "Bulaşık Makinesi",
    overseasReserved: "Yurt dışı tesis rezervi",
    india: "Hindistan",
    pakistan: "Pakistan",
    currentBusinessUnit: "Geçerli iş birimi",
    permission: "Yetki",
    financeAdmin: "Finans yöneticisi",
    hrHuman: "İnsan Kaynakları",
    procurementAdmin: "İdari / Dolaylı Satın Alma",
    businessLeader: "İş birimi yöneticisi",
    readonlyVisitor: "Salt okunur ziyaretçi",
    switchRole: "Rol değiştir",
    cookingSubtitle: "Pişirme Üretim Gideri Kokpiti",
    dishwasherSubtitle: "Bulaşık Makinesi Üretim Gideri Kokpiti",
    cookingSource: "Geçerli: Pişirme Fabrikası · Aynı dönem, bütçe, gerçekleşen, çalışan ve projeler hazır",
    dishwasherSource: "Geçerli: Bulaşık Makinesi · 5+7 tahmin, finans tablosu ve Mayıs gerçekleşeni hazır",
    cookingHeaderHint: "Aynı dönem, bütçe, gerçekleşen, çalışan ve projeleri tahakkuk bazlı işletme görünümünde birleştirir",
    roleAccess: "Rol Yetkisi",
    supplyCostControl: "Tedarik Maliyet Kontrolü",
    cookingAppliance: "Pişirme ürünleri",
    dishwasherAppliance: "Bulaşık makinesi",
    comingSoon: "Yakında"
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
  adminSelectedCategory: "canteen",
  adminSelectedAccount: "6666010314",
  adminBudgetView: "conditions",
  rollingTaskFilter: "all",
  rollingViewMode: "fill",
  rollingRole: localStorage.getItem("dwRollingRole.v1") || "finance",
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
  roleSelect: document.getElementById("roleSelect"),
  roleLogin: document.getElementById("roleLogin"),
  enterWorkspace: document.getElementById("enterWorkspace"),
  switchRoleBtn: document.getElementById("switchRoleBtn"),
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
  initializeDemoRoleAccess();
  installMetricHoverTooltip();
  els.saveMode.textContent = store.label;
  if (els.roleSelect) els.roleSelect.value = state.rollingRole;
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
    const rollingForecast = await store.loadRollingForecast?.();
    if (rollingForecast) {
      state.rollingForecastDrafts = rollingForecast.drafts || state.rollingForecastDrafts;
      state.rollingForecastSubmitted = rollingForecast.submitted || state.rollingForecastSubmitted;
    }
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
  try {
    const load = async (url, name, handler) => {
      if (!url) return;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Unable to load bundled file: ${name}`);
      const file = new File([await response.blob()], name, {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      await handler({ target: { files: [file] } });
    };
    await load(config.forecast, config.forecastName || "01_Forecast_5plus7.xlsx", handleForecastFileChange);
    await load(config.jiang, config.jiangName || "02_Domestic_Finance_5plus7.xlsx", handleJiangFileChange);
    await load(config.sap, config.sapName || "03_April_Actual.xlsx", handleSapFileChange);
    if (config.language && i18n[config.language]) {
      els.languageSelect.value = config.language;
      applyLanguage(config.language);
      renderAll();
    }
    saveUnitSnapshot("dishwasher");
  } catch (error) {
    toast(error.message || String(error), true);
  }
}

function switchBusinessUnit(unitId) {
  if (!unitId || unitId === state.activeUnit) return;
  saveUnitSnapshot(state.activeUnit);
  if (unitId === "dishwasher") {
    if (unitSnapshots.dishwasher) restoreUnitSnapshot("dishwasher");
    else state.activeUnit = "dishwasher";
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
  if (!snapshot) return;
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
  normalizeCookingHeadcountRows();
  normalizeCookingDerivedRows();
  appendCookingWorkdayRows();
  appendMissingCookingTargetRows();
  state.resultByMonth = cookingMonthlyResultMap();
  state.result = clonePlain(state.resultByMonth.get(COOKING_UNIT.monthlyResult?.month) || [...state.resultByMonth.values()][0] || COOKING_UNIT.monthlyResult);
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
  if (COOKING_UNIT.monthlyResult?.month && state.resultByMonth.has(COOKING_UNIT.monthlyResult.month)) {
    els.monthSelect.value = String(COOKING_UNIT.monthlyResult.month);
    selectCurrentMonth();
  }
  syncStatusPills();
  updateUnitChrome("cooking");
  els.toast.classList.remove("show");
  recalcFactors();
  renderAll();
}

function normalizeCookingHeadcountRows() {
  const headcountSpecs = new Map(COOKING_HEADCOUNT_ROWS.map((spec) => [spec.label, spec]));
  const inserted = new Set();
  const normalized = [];
  for (const row of state.dashboardRows) {
    const spec = headcountSpecs.get(row.label);
    if (!spec) {
      normalized.push(row);
      continue;
    }
    if (!inserted.has(spec.label)) {
      normalized.push(...buildCookingHeadcountRows(row, spec));
      inserted.add(spec.label);
    }
  }
  for (const spec of COOKING_HEADCOUNT_ROWS) {
    if (!inserted.has(spec.label)) {
      normalized.push(...buildCookingHeadcountRows({}, spec));
    }
  }
  state.dashboardRows = normalized;
}

function buildCookingHeadcountRows(template, spec) {
  return spec.rows.map(({ scenario, values }) => ({
    ...template,
    label: spec.label,
    metric: template.metric || spec.label,
    scenario,
    unit: "人",
    direction: template.direction || "lower",
    values: values.slice(),
    annual: averageFinite(values),
    sourceIndicator: `CK headcount - ${spec.label} - ${scenario}`
  }));
}

function normalizeCookingDerivedRows() {
  fillCookingForecastOutputValues();
  recalcCookingManufacturingRateRows();
}

function fillCookingForecastOutputValues() {
  const output26 = dashboardRow("产值", "26年");
  const outputBudget = dashboardRow("产值", "预算");
  const volume26 = dashboardRow("产量", "26年");
  const volumeBudget = dashboardRow("产量", "预算");
  if (!output26 || !outputBudget || !volume26 || !volumeBudget) return;
  output26.values = Array.from({ length: 12 }, (_, index) => {
    const current = output26.values?.[index];
    if (Number.isFinite(current)) return current;
    const budgetOutput = outputBudget.values?.[index];
    const budgetVolume = volumeBudget.values?.[index];
    const actualVolume = volume26.values?.[index];
    if (!Number.isFinite(budgetOutput) || !Number.isFinite(budgetVolume) || !Number.isFinite(actualVolume) || budgetVolume === 0) return null;
    return budgetOutput / budgetVolume * actualVolume;
  });
  output26.annual = sum(output26.values);
}

function recalcCookingManufacturingRateRows() {
  ["同期", "预算", "26年"].forEach((scenario) => {
    const amount = dashboardRow("制造费用金额", scenario);
    const output = dashboardRow("产值", scenario);
    const rate = dashboardRow("制造费率", scenario);
    const cumulativeRate = dashboardRow("制造费率累计", scenario);
    if (!amount || !output) return;
    const values = amount.values.map((cost, index) => {
      const outputValue = output.values?.[index];
      return Number.isFinite(cost) && Number.isFinite(outputValue) && outputValue !== 0 ? cost / outputValue : null;
    });
    if (rate) {
      rate.values = values;
      rate.annual = lastFinite(cumulativeRate?.values || values);
    }
    if (cumulativeRate) {
      let cumulativeCost = 0;
      let cumulativeOutput = 0;
      cumulativeRate.values = amount.values.map((cost, index) => {
        const outputValue = output.values?.[index];
        if (Number.isFinite(cost)) cumulativeCost += cost;
        if (Number.isFinite(outputValue)) cumulativeOutput += outputValue;
        return cumulativeOutput ? cumulativeCost / cumulativeOutput : null;
      });
      cumulativeRate.annual = lastFinite(cumulativeRate.values);
      if (rate) rate.annual = cumulativeRate.annual;
    }
  });
}

function dashboardRow(label, scenario) {
  return state.dashboardRows.find((row) => row.label === label && row.scenario === scenario);
}

function cookingMonthlyResultMap() {
  const map = new Map();
  const monthlyResults = COOKING_UNIT.monthlyResults || {};
  Object.entries(monthlyResults).forEach(([month, result]) => {
    const monthNumber = Number(month);
    if (Number.isFinite(monthNumber) && result) {
      map.set(monthNumber, clonePlain(result));
    }
  });
  if (!map.size && COOKING_UNIT.monthlyResult) {
    map.set(COOKING_UNIT.monthlyResult.month, clonePlain(COOKING_UNIT.monthlyResult));
  }
  return map;
}

function appendCookingWorkdayRows() {
  const workdayValues = {
    "同期": [20, 20, 23, 21, 20, 18, 18, 15, 22, 24, 24, 15],
    "预算": [20, 20, 23, 21, 14, 22, 17, 16, 22, 20, 21, 14],
    "26年": [20, 20, 23, 21, 14, 22, 17, 16, 22, 20, 21, 14]
  };
  Object.entries(workdayValues).forEach(([scenario, values]) => {
    if (state.dashboardRows.some((row) => row.label === "工作日" && row.scenario === scenario)) return;
    state.dashboardRows.push({
      label: "工作日",
      metric: "工作日",
      scenario,
      unit: "天",
      values: values.slice(),
      annual: sum(values),
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
    els.unitName.textContent = unitId === "cooking" ? t("cookingFactory") : t("dishwasher");
  }
  if (els.unitSubtitle) {
    els.unitSubtitle.textContent = unitId === "cooking" ? t("cookingSubtitle") : t("dishwasherSubtitle");
  }
  if (els.unitSource) {
    els.unitSource.textContent = unitId === "cooking" ? t("cookingSource") : t("dishwasherSource");
  }
  const headerTitle = document.querySelector(".app-header h1");
  const headerSubtitle = document.querySelector(".app-header p");
  if (headerTitle) {
    headerTitle.textContent = unitId === "cooking" ? t("cookingSubtitle") : t("dishwasherSubtitle");
  }
  if (headerSubtitle) {
    headerSubtitle.textContent = unitId === "cooking" ? t("cookingHeaderHint") : t("appSubtitle");
  }
  document.title = unitId === "cooking" ? t("cookingSubtitle") : t("dishwasherSubtitle");
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
  const monthlyResults = COOKING_UNIT.monthlyResults || {
    [COOKING_UNIT.monthlyResult.month]: COOKING_UNIT.monthlyResult
  };
  for (const [month, result] of Object.entries(monthlyResults)) {
    for (const row of result?.rows || []) {
      const key = analysisKey(Number(month), row.code);
      analyses[key] = {
        description: row.descCn || row.descEn || "",
        yoy: row.yoyReason || "",
        mom: row.budgetReason || ""
      };
    }
  }
  return analyses;
}

function clonePlain(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function bindEvents() {
  for (const button of document.querySelectorAll("[data-login-role]")) {
    button.addEventListener("click", () => {
      for (const option of document.querySelectorAll("[data-login-role]")) option.classList.toggle("active", option === button);
    });
  }
  els.enterWorkspace?.addEventListener("click", () => {
    const selected = document.querySelector("[data-login-role].active")?.dataset.loginRole || "finance";
    applyDemoRole(selected, true);
  });
  els.switchRoleBtn?.addEventListener("click", () => {
    els.roleLogin?.classList.remove("hidden");
  });
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
  els.roleSelect?.addEventListener("change", () => {
    state.rollingRole = els.roleSelect.value || "finance";
    localStorage.setItem("dwRollingRole.v1", state.rollingRole);
    state.rollingSelectedCode = null;
    if (["hr", "admin"].includes(state.rollingRole)) state.rollingViewMode = "fill";
    renderTable();
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
    button.addEventListener("click", () => {
      if (button.disabled) return;
      switchBusinessUnit(button.dataset.unit);
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
    const showLabel = state.activeUnit === "cooking" || row.label !== lastLabel;
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
  document.body.classList.toggle("rolling-fill-mode", !["hr", "admin"].includes(state.rollingRole) && state.rollingViewMode === "fill");
  if (!state.result) {
    varianceView?.classList.remove("show-legacy-variance");
    els.rowCount.textContent = `0 ${t("rowCountSuffix")}`;
    if (els.forecastWorkspace) els.forecastWorkspace.innerHTML = `<div class="empty-cell">${t("emptySap")}</div>`;
    if (els.detailBody) els.detailBody.innerHTML = `<tr><td colspan="8" class="empty-cell">${t("emptySap")}</td></tr>`;
    return;
  }
  if (state.rollingRole !== "hr") ensureHrBudgetBaselineSync();
  if (state.rollingRole !== "admin") ensureAdminBudgetBaselineSync();
  const rows = visibleRows();
  const collapsedCount = state.result.unsplitCategories?.length || 0;
  const collapsedText = collapsedCount ? ` · ${t("collapsedCategoryCompare").replace("{count}", collapsedCount)}` : "";
  els.rowCount.textContent = `${rows.length} ${t("rowCountSuffix")}${collapsedText}`;
  if (["hr", "admin"].includes(state.rollingRole)) {
    varianceView?.classList.remove("show-legacy-variance");
    renderRollingForecastWorkspace(rows);
    if (els.detailBody) els.detailBody.innerHTML = "";
    return;
  }
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
const HR_BUDGET_DRIVER_KEY = "dwHrBudgetDrivers.v1";
const HR_BUDGET_INPUT_KEY = "dwHrBudgetInputs.v2";
const HR_BUDGET_AUDIT_KEY = "dwHrBudgetAudit.v1";
const HR_BUDGET_SYNC_KEY = "dwHrBudgetSync.v1";
const ADMIN_BUDGET_INPUT_KEY = "dwAdminBudgetInputs.v1";
const ADMIN_BUDGET_AUDIT_KEY = "dwAdminBudgetAudit.v1";
const ADMIN_BUDGET_SYNC_KEY = "dwAdminBudgetSync.v1";
const HR_BUDGET_DEFAULTS = {
  reviewMonth: 6,
  reviewHeadcount: 374,
  reviewWorkdays: 21
};
const HR_I18N = {
  zh: {
    breadcrumb: "第二张表 / 月度差异分析 / 预算 / 人力费用", title: "DW 人力预算工作台", subtitle: "按 Excel 人员底表与参数自动计算，责任人负责填写变动、核对结果并处理异常。",
    permission: "人力角色 · 仅显示人力预算", saveReview: "保存校核", submitBudget: "提交人力预算", mapping: "测试假设映射", mappingNote: "测试假设映射：将源表 {source} 数据作为 DW 洗碗机预算样例，不代表源文件真实业务归属。", realSource: "源文件真实数",
    baseBudget: "基础数据与预算", exceptionReview: "异常校核", approvalRecords: "审批记录", headcountPlan: "人数计划", calendarHours: "工作日与工时", wagePolicy: "工资政策", adjustmentNotes: "调整说明",
    inputTitle: "人力责任人填报区", inputHint: "灰字为 Excel 预算标准，绿色为校核值；偏离标准必须填写理由并留痕。", editable: "可编辑", resetExcel: "恢复Excel原值",
    noUnsaved: "当前无未保存变更", recordedVariance: "已有 {count} 项已记录偏差，可在“审批记录”中追溯。", alignedStandard: "当前校核值与 Excel 预算标准一致。", aligned: "已对齐", pendingChanges: "{count} 项待保存变更", adjustmentReason: "调整理由", required: "必填", reasonPlaceholder: "说明调整原因、依据和影响月份",
    employeeCategory: "人员类别", annualAverage: "全年平均", direct: "直接蓝领", indirect: "间接蓝领", whiteCollar: "白领", checkedHeadcount: "校核在岗人数", standard: "标准", headcountRule: "预算标准取自 Excel 原值。新增、离职或编制调整只修改校核值，保存时必须说明依据。",
    calendarHeader: "日历与工时", owner: "责任人", workingDays: "工作日", realHours: "每日实际工时", paidHours: "每日计薪工时", hrCheck: "人力核对", calendarRule: "汇率属于财务参数，只展示不允许人力修改；工作日和工时由人力按月核对。",
    budgetStandard: "预算标准", variance: "偏差", backendRule: "后台展开规则", backendRuleText: "按生效日期把工资增长率应用到人员薪资基数，再计算奖金、社保和失业保险。", notesHint: "修改人数、日历或工资政策后，填写原因和影响月份。", notesPlaceholder: "例如：7月新增40名直接员工，9月工资增长参数调整……",
    baseResponsibility: "基础数据与责任分层", baseResponsibilityHint: "只把需要展示、填写和核对的数据放到前台。", excelBuiltIn: "Excel 内置数据", displayOnly: "只展示 · 不填写", monthlyReview: "责任人每月核对", sourceData: "源数据", pendingReview: "待校核",
    budgetYear: "预算年度", sourceOrg: "源数据组织", employeeRecords: "人员底表记录", sourceCurrency: "源币种", outputCurrency: "输出币种", year: "年", people: "人", day: "天", hour: "小时", systemDisplay: "系统展示", sourcePeriod: "源文件预算期间", mappedToDw: "测试时映射为 DW 洗碗机", boardRecords: "Board 人员记录数", boardCurrency: "Board 原始币种", managementCurrency: "网站统一管理口径",
    juneHeadcount: "6月预算在岗人数", juneWorkday: "6月工作日", dailyReal: "每日实际工时", dailyPaid: "每日计薪工时", juneFx: "6月 EUR/TRY", needsCheck: "需核对", financeParameter: "财务参数", activeSummary: "由人员月度在岗标记汇总", tdWorkday: "Parameters · TD 工作日", fxFormula: "TRY 金额 ÷ 汇率 = EUR",
    ownerMustFill: "责任人需要填写", hrFill: "HR填写", personnelChange: "人员变动", personnelChangeText: "新增人员、离职月份、部门/岗位和 Direct / Indirect 属性", salaryPolicy: "薪资与政策", salaryPolicyText: "薪资基数、工资增长参数、奖金与福利资格", adjustmentRule: "仅在覆盖系统建议或异常超阈值时填写", backendCalc: "后台计算 · 无需填写", systemCalc: "系统计算", backendCalcText: "工资增长展开、工时汇总、社保与失业险、人员到科目汇总、TRY 转 EUR、财务模板输出。",
    resultTitle: "DW 人力预算结果（按小科目）", resultHint: "单位：EUR；当前为 Excel 基线结果。填报值已保存，正式规则接入后将在这里联动重算。", account: "小科目", annualBudget: "全年预算", dataStatus: "数据状态", sourceCalculated: "源表已计算", totalHrCost: "人力费用合计", converted: "已换算",
    formulaTrace: "公式追溯 · 工资（6月）", formulaPath: "Board 人员输入 → Parameters 政策参数 → Tower 按人计算 → For Finance 科目汇总 → EUR 换算", reviewNote: "校核说明", reviewPlaceholder: "仅在覆盖系统建议或发现源数据异常时填写原因和影响范围",
    missingSource: "待补底表", missingSourceHint: "源 Excel 没有独立标准的数据不进入自动预算，待责任部门补齐。", items: "项", workwear: "工作服", mealUnit: "餐补独立单价", adminProcurement: "行政/采购", hr: "人力", noIndependentStandard: "源表未发现独立标准", cashAidIncluded: "当前归入 Aid In Cash", workwearAction: "后续接入采购单价和发放周期", mealAction: "后续确认是否拆分为独立小科目",
    hrAccounts: "人力费用科目", manualReview: "需人工校核", currentReview: "当前需核对", exceptionText: "{accounts}受人员变动、政策或一次性事项影响，需要责任人确认。", reviewPrinciple: "校核原则", reviewPrincipleText: "源表结果保持不变，调整必须留下责任人、原因和影响月份", reviewPrincipleHint: "系统计算过程在后台执行，但支持按科目追溯到来源与汇率", reviewOpinion: "校核意见", reviewOpinionPlaceholder: "填写确认或调整原因",
    approvalProgress: "预算审批进度", excelLoaded: "Excel 数据载入", completed: "已完成", tdMapped: "TD 数据假设映射为 DW", hrReview: "人力校核", currentNode: "当前节点", hrReviewHint: "核对人数、工时和异常科目", costReview: "成本复核", pending: "待处理", budgetPublish: "预算发布", basisNote: "口径说明", monthlyFx: "换算：按月度 EUR/TRY",
    adjustmentRecords: "预算调整记录", adjustmentRecordsHint: "每一项偏离预算标准的修改都记录责任人、时间、前后值和理由。", timeOwner: "时间 / 责任人", adjustmentItem: "调整项", period: "期间", before: "修改前", after: "修改后", operation: "操作", sameAsAbove: "同上", noRecords: "尚无预算调整记录。修改校核值并填写理由后，记录会显示在这里。", systemRecords: "系统记录", node: "节点", dataBasis: "数据口径", status: "状态", dataPreparation: "数据准备", load: "载入", businessMapping: "业务映射", assumedMapped: "{source} 假设映射为 DW", testVersion: "测试版", pendingConfirm: "待确认",
    wages: "工资", overtime: "加班费", bonus: "奖金", cashAid: "现金补助", socialSecurity: "社会保险", unemployment: "失业保险", rdIncentive: "研发激励抵减", incentive: "其他激励抵减", indemnity: "离职补偿", mbo: "绩效奖金（MBO）",
    restoredDraft: "已恢复为 Excel 预算标准，请填写理由后保存", reasonRequired: "有预算变更，必须先填写调整理由", submittedTrace: "人力预算已提交财务复核并留痕", savedTrace: "已保存 {count} 项变更并写入记录", noPendingSave: "当前没有待保存变更", saveAction: "保存校核", submitAction: "提交人力预算"
  },
  en: {
    breadcrumb: "Table 2 / Monthly Variance / Budget / HR Cost", title: "DW HR Budget Workspace", subtitle: "Calculations follow the Excel employee roster and parameters. Owners enter changes, validate results and resolve exceptions.",
    permission: "HR role · HR budget only", saveReview: "Save validation", submitBudget: "Submit HR budget", mapping: "Test assumption mapping", mappingNote: "Test mapping: {source} data is used as the DW Dishwasher budget sample. This does not represent the source file's actual business ownership.", realSource: "Real source data",
    baseBudget: "Base Data & Budget", exceptionReview: "Exception Review", approvalRecords: "Approval Records", headcountPlan: "Headcount Plan", calendarHours: "Workdays & Hours", wagePolicy: "Wage Policy", adjustmentNotes: "Adjustment Notes",
    inputTitle: "HR Owner Input", inputHint: "Grey text is the Excel budget standard and green fields are validated values. Any deviation requires a reason and audit trail.", editable: "Editable", resetExcel: "Restore Excel values",
    noUnsaved: "No unsaved changes", recordedVariance: "{count} recorded deviations can be traced in Approval Records.", alignedStandard: "Validated values match the Excel budget standard.", aligned: "Aligned", pendingChanges: "{count} changes pending", adjustmentReason: "Adjustment reason", required: "Required", reasonPlaceholder: "Describe the reason, evidence and affected months",
    employeeCategory: "Employee category", annualAverage: "Annual average", direct: "Direct blue collar", indirect: "Indirect blue collar", whiteCollar: "White collar", checkedHeadcount: "Validated headcount", standard: "Std.", headcountRule: "The budget standard comes from Excel. Change only the validated value for hires, leavers or staffing adjustments and provide evidence when saving.",
    calendarHeader: "Calendar & Hours", owner: "Owner", workingDays: "Working days", realHours: "Actual hours/day", paidHours: "Paid hours/day", hrCheck: "HR validation", calendarRule: "FX is a finance parameter and read-only for HR. HR validates workdays and hours monthly.",
    budgetStandard: "Budget standard", variance: "Variance", backendRule: "Backend expansion rule", backendRuleText: "Apply wage increase rates to employee salary bases by effective date, then calculate bonus, social security and unemployment insurance.", notesHint: "After changing headcount, calendar or wage policy, state the reason and affected months.", notesPlaceholder: "Example: 40 direct employees added in July; September wage increase parameter revised...",
    baseResponsibility: "Base Data & Responsibilities", baseResponsibilityHint: "Only data that must be viewed, entered or validated is shown here.", excelBuiltIn: "Excel built-in data", displayOnly: "Display only", monthlyReview: "Monthly owner validation", sourceData: "Source data", pendingReview: "Pending review",
    budgetYear: "Budget year", sourceOrg: "Source organization", employeeRecords: "Employee roster records", sourceCurrency: "Source currency", outputCurrency: "Output currency", year: "year", people: "people", day: "day", hour: "hour", systemDisplay: "System display", sourcePeriod: "Budget period in source file", mappedToDw: "Mapped to DW Dishwasher for testing", boardRecords: "Board employee record count", boardCurrency: "Original Board currency", managementCurrency: "Website management currency",
    juneHeadcount: "June budget headcount", juneWorkday: "June working days", dailyReal: "Actual hours/day", dailyPaid: "Paid hours/day", juneFx: "June EUR/TRY", needsCheck: "Review", financeParameter: "Finance parameter", activeSummary: "Summed from monthly active flags", tdWorkday: "Parameters · TD working days", fxFormula: "TRY amount ÷ FX = EUR",
    ownerMustFill: "Owner input required", hrFill: "HR input", personnelChange: "Personnel changes", personnelChangeText: "New hires, leaving month, department/position and Direct/Indirect attribute", salaryPolicy: "Salary & policy", salaryPolicyText: "Salary base, wage increase parameters, bonus and benefit eligibility", adjustmentRule: "Required only when overriding system advice or an exception threshold", backendCalc: "Backend calculation · No input", systemCalc: "System", backendCalcText: "Wage expansion, hour totals, social/unemployment insurance, employee-to-account allocation, TRY-to-EUR conversion and finance output.",
    resultTitle: "DW HR Budget Results by Account", resultHint: "Unit: EUR. These are the current Excel baseline results; saved inputs will recalculate here when the formal rules engine is connected.", account: "Account", annualBudget: "Annual budget", dataStatus: "Data status", sourceCalculated: "Source calculated", totalHrCost: "Total HR cost", converted: "Converted",
    formulaTrace: "Formula trace · Wages (June)", formulaPath: "Board employee input → Parameters policy → Tower person-level calculation → For Finance account summary → EUR conversion", reviewNote: "Validation note", reviewPlaceholder: "Required only when overriding system advice or identifying source-data issues",
    missingSource: "Missing Base Tables", missingSourceHint: "Items without an independent standard in the source Excel are excluded from automatic budgeting until the responsible team supplies them.", items: "items", workwear: "Workwear", mealUnit: "Separate meal allowance rate", adminProcurement: "Admin / Procurement", hr: "HR", noIndependentStandard: "No independent standard found", cashAidIncluded: "Currently included in Aid In Cash", workwearAction: "Connect procurement price and issue cycle", mealAction: "Confirm whether to split into a separate account",
    hrAccounts: "HR cost accounts", manualReview: "Manual review", currentReview: "Current review items", exceptionText: "{accounts} are affected by staffing, policy or one-off items and require owner confirmation.", reviewPrinciple: "Validation principle", reviewPrincipleText: "Keep source results unchanged; every adjustment must record owner, reason and affected months", reviewPrincipleHint: "Calculations run in the backend and remain traceable to source and FX", reviewOpinion: "Validation comment", reviewOpinionPlaceholder: "Enter confirmation or adjustment reason",
    approvalProgress: "Budget approval progress", excelLoaded: "Excel data loaded", completed: "Completed", tdMapped: "TD data assumed as DW", hrReview: "HR validation", currentNode: "Current step", hrReviewHint: "Validate headcount, hours and exception accounts", costReview: "Cost review", pending: "Pending", budgetPublish: "Budget release", basisNote: "Basis", monthlyFx: "Conversion: monthly EUR/TRY",
    adjustmentRecords: "Budget Adjustment Records", adjustmentRecordsHint: "Every deviation from the budget standard records owner, time, before/after values and reason.", timeOwner: "Time / Owner", adjustmentItem: "Item", period: "Period", before: "Before", after: "After", operation: "Action", sameAsAbove: "Same as above", noRecords: "No budget adjustments yet. Change a validated value and enter a reason to create a record.", systemRecords: "System Records", node: "Step", dataBasis: "Data basis", status: "Status", dataPreparation: "Data preparation", load: "Load", businessMapping: "Business mapping", assumedMapped: "{source} assumed as DW", testVersion: "Preview", pendingConfirm: "Pending confirmation",
    wages: "Wages", overtime: "Overtime", bonus: "Bonus", cashAid: "Aid in Cash", socialSecurity: "Social Security", unemployment: "Unemployment Insurance", rdIncentive: "R&D Incentive Offset", incentive: "Other Incentive Offset", indemnity: "Indemnity", mbo: "Performance Bonus (MBO)",
    restoredDraft: "Restored to the Excel budget standard. Enter a reason and save.", reasonRequired: "A reason is required for budget changes", submittedTrace: "HR budget submitted for finance review with an audit trail", savedTrace: "Saved {count} changes to the audit trail", noPendingSave: "No pending changes", saveAction: "Save validation", submitAction: "Submit HR budget"
  },
  tr: {
    breadcrumb: "Tablo 2 / Aylık Fark / Bütçe / İK Gideri", title: "DW İK Bütçe Çalışma Alanı", subtitle: "Hesaplamalar Excel çalışan listesi ve parametrelerine dayanır. Sorumlular değişiklikleri girer, sonuçları doğrular ve istisnaları çözer.",
    permission: "İK rolü · Yalnızca İK bütçesi", saveReview: "Doğrulamayı kaydet", submitBudget: "İK bütçesini gönder", mapping: "Test varsayımı eşlemesi", mappingNote: "Test eşlemesi: {source} verileri DW Bulaşık Makinesi bütçe örneği olarak kullanılır. Bu, kaynak dosyanın gerçek iş sahipliğini göstermez.", realSource: "Gerçek kaynak verisi",
    baseBudget: "Temel Veri ve Bütçe", exceptionReview: "İstisna Kontrolü", approvalRecords: "Onay Kayıtları", headcountPlan: "Çalışan Planı", calendarHours: "İş Günü ve Saat", wagePolicy: "Ücret Politikası", adjustmentNotes: "Değişiklik Açıklaması",
    inputTitle: "İK Sorumlusu Girişi", inputHint: "Gri metin Excel bütçe standardını, yeşil alan doğrulanan değeri gösterir. Her sapma gerekçe ve denetim izi gerektirir.", editable: "Düzenlenebilir", resetExcel: "Excel değerlerini geri yükle",
    noUnsaved: "Kaydedilmemiş değişiklik yok", recordedVariance: "{count} kayıtlı sapma Onay Kayıtlarında izlenebilir.", alignedStandard: "Doğrulanan değerler Excel bütçe standardıyla uyumlu.", aligned: "Uyumlu", pendingChanges: "{count} değişiklik bekliyor", adjustmentReason: "Değişiklik gerekçesi", required: "Zorunlu", reasonPlaceholder: "Gerekçe, dayanak ve etkilenen ayları açıklayın",
    employeeCategory: "Çalışan kategorisi", annualAverage: "Yıllık ortalama", direct: "Direkt mavi yaka", indirect: "Endirekt mavi yaka", whiteCollar: "Beyaz yaka", checkedHeadcount: "Doğrulanan çalışan", standard: "Std.", headcountRule: "Bütçe standardı Excel'den gelir. İşe giriş, ayrılış veya kadro değişikliğinde yalnızca doğrulanan değeri değiştirin ve kayıtta dayanak belirtin.",
    calendarHeader: "Takvim ve Saat", owner: "Sorumlu", workingDays: "İş günü", realHours: "Gerçek saat/gün", paidHours: "Ücretli saat/gün", hrCheck: "İK doğrulaması", calendarRule: "Kur finans parametresidir ve İK için salt okunurdur. İş günü ve saatleri İK aylık doğrular.",
    budgetStandard: "Bütçe standardı", variance: "Sapma", backendRule: "Arka uç uygulama kuralı", backendRuleText: "Ücret artış oranlarını yürürlük tarihine göre çalışan ücret tabanına uygular; prim, sosyal güvenlik ve işsizlik sigortasını hesaplar.", notesHint: "Çalışan, takvim veya ücret politikası değişikliğinde gerekçe ve etkilenen ayları yazın.", notesPlaceholder: "Örnek: Temmuz'da 40 direkt çalışan eklendi; Eylül ücret artış parametresi güncellendi...",
    baseResponsibility: "Temel Veri ve Sorumluluklar", baseResponsibilityHint: "Yalnızca görüntülenmesi, girilmesi veya doğrulanması gereken veriler önde gösterilir.", excelBuiltIn: "Excel hazır verisi", displayOnly: "Yalnızca görüntüle", monthlyReview: "Aylık sorumlu doğrulaması", sourceData: "Kaynak veri", pendingReview: "Kontrol bekliyor",
    budgetYear: "Bütçe yılı", sourceOrg: "Kaynak organizasyon", employeeRecords: "Çalışan listesi kaydı", sourceCurrency: "Kaynak para birimi", outputCurrency: "Çıktı para birimi", year: "yıl", people: "kişi", day: "gün", hour: "saat", systemDisplay: "Sistem gösterimi", sourcePeriod: "Kaynak dosya bütçe dönemi", mappedToDw: "Test için DW Bulaşık Makinesine eşlendi", boardRecords: "Board çalışan kayıt sayısı", boardCurrency: "Board orijinal para birimi", managementCurrency: "Web yönetim para birimi",
    juneHeadcount: "Haziran bütçe çalışanı", juneWorkday: "Haziran iş günü", dailyReal: "Gerçek saat/gün", dailyPaid: "Ücretli saat/gün", juneFx: "Haziran EUR/TRY", needsCheck: "Kontrol", financeParameter: "Finans parametresi", activeSummary: "Aylık aktif işaretlerinden toplam", tdWorkday: "Parameters · TD iş günü", fxFormula: "TRY tutarı ÷ kur = EUR",
    ownerMustFill: "Sorumlu girişi gerekli", hrFill: "İK girişi", personnelChange: "Personel değişikliği", personnelChangeText: "Yeni işe giriş, ayrılış ayı, bölüm/pozisyon ve Direct/Indirect özelliği", salaryPolicy: "Ücret ve politika", salaryPolicyText: "Ücret tabanı, ücret artış parametresi, prim ve yan hak uygunluğu", adjustmentRule: "Yalnızca sistem önerisi aşılırsa veya istisna eşiği geçilirse gereklidir", backendCalc: "Arka uç hesabı · Giriş yok", systemCalc: "Sistem", backendCalcText: "Ücret artışı, saat toplamı, sosyal/işsizlik sigortası, çalışan-hesap dağıtımı, TRY-EUR dönüşümü ve finans çıktısı.",
    resultTitle: "Hesap Bazında DW İK Bütçe Sonuçları", resultHint: "Birim: EUR. Bunlar mevcut Excel baz sonuçlarıdır; resmi kural motoru bağlandığında kayıtlı girişler burada yeniden hesaplanır.", account: "Hesap", annualBudget: "Yıllık bütçe", dataStatus: "Veri durumu", sourceCalculated: "Kaynak hesaplandı", totalHrCost: "Toplam İK gideri", converted: "Dönüştürüldü",
    formulaTrace: "Formül izi · Ücretler (Haziran)", formulaPath: "Board çalışan girişi → Parameters politika → Tower kişi bazlı hesap → For Finance hesap özeti → EUR dönüşümü", reviewNote: "Doğrulama notu", reviewPlaceholder: "Yalnızca sistem önerisi aşılırsa veya kaynak veri sorunu bulunursa doldurun",
    missingSource: "Eksik Temel Tablolar", missingSourceHint: "Kaynak Excel'de bağımsız standardı olmayan kalemler, sorumlu ekip tamamlayana kadar otomatik bütçeye girmez.", items: "kalem", workwear: "İş kıyafeti", mealUnit: "Ayrı yemek yardımı oranı", adminProcurement: "İdari / Satın Alma", hr: "İK", noIndependentStandard: "Bağımsız standart bulunamadı", cashAidIncluded: "Şu anda Aid In Cash içinde", workwearAction: "Satın alma fiyatı ve dağıtım periyodu bağlanacak", mealAction: "Ayrı hesaba bölünüp bölünmeyeceği doğrulanacak",
    hrAccounts: "İK gider hesapları", manualReview: "Manuel kontrol", currentReview: "Mevcut kontrol kalemleri", exceptionText: "{accounts} personel, politika veya tek seferlik kalemlerden etkilenir ve sorumlu onayı gerektirir.", reviewPrinciple: "Doğrulama ilkesi", reviewPrincipleText: "Kaynak sonuç değişmez; her düzeltmede sorumlu, gerekçe ve etkilenen ay kaydedilir", reviewPrincipleHint: "Hesap arka uçta çalışır ve kaynak ile kura kadar izlenebilir", reviewOpinion: "Doğrulama görüşü", reviewOpinionPlaceholder: "Onay veya değişiklik gerekçesini girin",
    approvalProgress: "Bütçe onay süreci", excelLoaded: "Excel verisi yüklendi", completed: "Tamamlandı", tdMapped: "TD verisi DW olarak varsayıldı", hrReview: "İK doğrulaması", currentNode: "Geçerli adım", hrReviewHint: "Çalışan, saat ve istisna hesaplarını doğrulayın", costReview: "Maliyet kontrolü", pending: "Bekliyor", budgetPublish: "Bütçe yayını", basisNote: "Esas", monthlyFx: "Dönüşüm: aylık EUR/TRY",
    adjustmentRecords: "Bütçe Değişiklik Kayıtları", adjustmentRecordsHint: "Bütçe standardından her sapma; sorumlu, zaman, önce/sonra değeri ve gerekçeyle kaydedilir.", timeOwner: "Zaman / Sorumlu", adjustmentItem: "Kalem", period: "Dönem", before: "Önce", after: "Sonra", operation: "İşlem", sameAsAbove: "Yukarıdakiyle aynı", noRecords: "Henüz bütçe değişikliği yok. Kayıt oluşturmak için doğrulanan değeri değiştirip gerekçe girin.", systemRecords: "Sistem Kayıtları", node: "Adım", dataBasis: "Veri esası", status: "Durum", dataPreparation: "Veri hazırlığı", load: "Yükle", businessMapping: "İş eşlemesi", assumedMapped: "{source} DW olarak varsayıldı", testVersion: "Önizleme", pendingConfirm: "Onay bekliyor",
    wages: "Ücretler", overtime: "Fazla Mesai", bonus: "Prim", cashAid: "Nakdi Yardım", socialSecurity: "Sosyal Güvenlik", unemployment: "İşsizlik Sigortası", rdIncentive: "Ar-Ge Teşvik Mahsubu", incentive: "Diğer Teşvik Mahsubu", indemnity: "Kıdem Tazminatı", mbo: "Performans Primi (MBO)",
    restoredDraft: "Excel bütçe standardına dönüldü. Gerekçe girip kaydedin.", reasonRequired: "Bütçe değişiklikleri için gerekçe zorunludur", submittedTrace: "İK bütçesi denetim iziyle finans kontrolüne gönderildi", savedTrace: "{count} değişiklik denetim izine kaydedildi", noPendingSave: "Bekleyen değişiklik yok", saveAction: "Doğrulamayı kaydet", submitAction: "İK bütçesini gönder"
  }
};
let hrBudgetDrivers = loadHrBudgetDrivers();
let hrBudgetView = "drivers";
let hrBudgetInputView = "headcount";
let hrBudgetInputs = loadHrBudgetInputs();
let hrBudgetSavedInputs = cloneHrBudgetInputs(hrBudgetInputs);
let hrBudgetAudit = loadHrBudgetAudit();
let adminBudgetInputs = loadAdminBudgetInputs();
let adminBudgetSavedInputs = clonePlain(adminBudgetInputs);
let adminBudgetAudit = loadAdminBudgetAudit();

function hrT(key, values = {}) {
  let text = HR_I18N[state.language]?.[key] || HR_I18N.zh[key] || key;
  for (const [name, value] of Object.entries(values)) text = text.replaceAll(`{${name}}`, String(value));
  return text;
}

function hrMonth(index) {
  return localizeMonthLabel(index, state.language);
}

function hrAccountLabel(account) {
  if (state.language === "zh") return account.label;
  return hrT(account.key) || account.sourceLabel;
}

function hrUnitLabel(unit) {
  const map = { 人: "people", 天: "day", 小时: "hour", 年: "year" };
  return map[unit] ? hrT(map[unit]) : unit;
}

function hrChangeLabel(change) {
  const keys = { direct: "direct", indirect: "indirect", whiteCollar: "whiteCollar", workingDays: "workingDays", realHoursPerDay: "realHours", paidHoursPerDay: "paidHours", wageRates: "wagePolicy" };
  return hrT(keys[change.key] || change.key);
}

function hrChangePeriod(change, data = hrBudgetData()) {
  return change.section === "policy" ? (data.wageIncreaseStages?.[change.index]?.label || `${change.index + 1}`) : hrMonth(change.index);
}
const ROLLING_ROLE_LABELS = {
  finance: "财务管理员",
  hr: "HR 人力",
  admin: "行政部门",
  procurement: "行政/间接采购",
  leader: "经营负责人",
  readonly: "只读访客"
};
const ROLLING_ROLE_SCOPE = {
  finance: "全部科目可见，价格、数量、总额、原因均可维护。",
  hr: "只显示人力/数量相关科目，可维护数量和数量责任人。",
  admin: "仅显示行政预算科目，可校核标准、填写调整原因并提交。",
  procurement: "只显示采购、行政、维修、工作服、能源和服务类科目，可维护价格、总额和明细。",
  leader: "全部科目可见，只维护差异原因和审核意见。",
  readonly: "全部科目只读。"
};
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
    status: "状态",
    hrBudgetSource: "人力预算",
    hrBudgetSynced: "人力预算已同步",
    hrBudgetSyncHint: "{time} · {owner} · 数据来自 For Finance",
    hrMappedAccounts: "对应人力科目",
    hrAdjustmentReason: "调整原因",
    hrBaselineReason: "Excel预算基线同步",
    hrFormulaPending: "当前同步源表预算结果；参数变更将在完整计算公式接入后联动重算。"
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
    status: "Status",
    hrBudgetSource: "HR Budget",
    hrBudgetSynced: "HR budget synced",
    hrBudgetSyncHint: "{time} · {owner} · Source: For Finance",
    hrMappedAccounts: "Mapped HR accounts",
    hrAdjustmentReason: "Adjustment reason",
    hrBaselineReason: "Excel budget baseline sync",
    hrFormulaPending: "The source budget result is synced now; driver changes will recalculate after the full formulas are connected."
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
    status: "Durum",
    hrBudgetSource: "İK Bütçesi",
    hrBudgetSynced: "İK bütçesi eşitlendi",
    hrBudgetSyncHint: "{time} · {owner} · Kaynak: For Finance",
    hrMappedAccounts: "Eşlenen İK hesapları",
    hrAdjustmentReason: "Değişiklik nedeni",
    hrBaselineReason: "Excel bütçe baz senkronu",
    hrFormulaPending: "Şimdilik kaynak bütçe sonucu eşitlenir; parametre değişiklikleri tüm formüller bağlandıktan sonra yeniden hesaplanır."
  }
};

function renderRollingForecastWorkspace(rows) {
  if (!els.forecastWorkspace) return;
  document.body.classList.toggle("hr-budget-mode", state.rollingRole === "hr");
  document.body.classList.toggle("admin-budget-mode", state.rollingRole === "admin");
  refreshProductNavigation();
  if (state.rollingRole === "hr") {
    renderHrBudgetWorkspace();
    return;
  }
  if (state.rollingRole === "admin") {
    renderAdminBudgetWorkspace();
    return;
  }
  ensureHrBudgetBaselineSync();
  ensureAdminBudgetBaselineSync();
  const accountRows = rows.filter((row) => row.code);
  if (!accountRows.length) {
    els.forecastWorkspace.innerHTML = `<div class="empty-cell">${rfT("noTask")}</div>`;
    return;
  }
  const allMeta = accountRows.map((row) => rollingRowMeta(row));
  const roleMeta = allMeta.filter((item) => rollingRoleCanView(item.row));
  if (!roleMeta.length) {
    els.forecastWorkspace.innerHTML = `<div class="empty-cell">${escapeHtml(rollingRoleScope())}</div>`;
    return;
  }
  if (state.rollingSelectedCode && !roleMeta.some((item) => item.row.code === state.rollingSelectedCode)) {
    state.rollingSelectedCode = null;
  }
  const filteredMeta = roleMeta.filter((item) => rollingFilterMatches(item));
  const selectedMeta = allMeta.find((item) => item.row.code === state.rollingSelectedCode) || null;
  const budgetedMeta = roleMeta.filter((item) => item.hasCompletedBudget);
  const excelMeta = roleMeta.filter((item) => !item.hasCompletedBudget);
  const visibleBudgeted = filteredMeta.filter((item) => item.hasCompletedBudget);
  const visibleExcel = filteredMeta.filter((item) => !item.hasCompletedBudget);
  els.forecastWorkspace.innerHTML = `
    <div class="rf-shell rf-status-workbench">
      <div class="rf-header rf-status-header">
        <h3>${escapeHtml(rfCompactT("title"))}</h3>
        <div class="rf-status-summary" aria-label="${escapeHtml(rfCompactT("budgetStatus"))}">
          <button type="button" class="rf-status-summary-item complete" data-rf-anchor="budgeted">
            <span>${escapeHtml(rfCompactT("completed"))}</span>
            <strong>${budgetedMeta.length}</strong>
          </button>
          <button type="button" class="rf-status-summary-item baseline" data-rf-anchor="excel">
            <span>${escapeHtml(rfCompactT("excelBaseline"))}</span>
            <strong>${excelMeta.length}</strong>
          </button>
        </div>
        <div class="rf-actions">
          <div class="rf-mode-toggle rf-compact-mode-toggle">
            <button type="button" class="active" data-rf-view-mode="fill">${escapeHtml(rfCompactT("budgetView"))}</button>
            <button type="button" data-rf-view-mode="variance">${escapeHtml(rfCompactT("varianceView"))}</button>
          </div>
          <button type="button" class="ghost-button" data-rf-action="save-all" ${rollingCanSave() ? "" : "disabled"}>${escapeHtml(rfCompactT("save"))}</button>
          <button type="button" data-rf-action="submit-all" ${rollingCanSubmit() ? "" : "disabled"}>${escapeHtml(rfCompactT("submit"))}</button>
        </div>
      </div>
      ${rfAccountGroup("budgeted", rfCompactT("completedAll"), visibleBudgeted, selectedMeta)}
      ${rfAccountGroup("excel", rfCompactT("excelPending"), visibleExcel, selectedMeta)}
    </div>
  `;
}

function rfCompactT(key) {
  const copy = {
    zh: {
      title: "滚动预测",
      budgetView: "预算",
      varianceView: "差异",
      budgetStatus: "预算状态",
      completed: "已完成预算",
      excelBaseline: "Excel基线",
      completedAll: "已完成预算",
      excelPending: "Excel基线（待预算）",
      save: "保存草稿",
      submit: "提交预算",
      code: "科目编码",
      account: "科目名称",
      source: "来源",
      actualBaseline: "1-5月 实际/基线",
      budgetPeriod: "6-12月 预算",
      annual: "全年合计",
      status: "状态",
      hrBudget: "人力预算",
      adminBudget: "行政预算",
      combinedBudget: "人力+行政",
      excel: "Excel",
      done: "已完成",
      start: "开始预算",
      view: "查看",
      detail: "6-12月预算明细",
      close: "收起",
      noAccounts: "暂无科目"
    },
    en: {
      title: "Rolling Forecast",
      budgetView: "Budget",
      varianceView: "Variance",
      budgetStatus: "Budget status",
      completed: "Budgeted",
      excelBaseline: "Excel baseline",
      completedAll: "Budgeted",
      excelPending: "Excel baseline (pending)",
      save: "Save draft",
      submit: "Submit budget",
      code: "Account",
      account: "Account name",
      source: "Source",
      actualBaseline: "Jan-May actual/baseline",
      budgetPeriod: "Jun-Dec budget",
      annual: "Annual total",
      status: "Status",
      hrBudget: "HR budget",
      adminBudget: "Administration",
      combinedBudget: "HR + Administration",
      excel: "Excel",
      done: "Completed",
      start: "Start budget",
      view: "View",
      detail: "Jun-Dec budget detail",
      close: "Collapse",
      noAccounts: "No accounts"
    },
    tr: {
      title: "Dönen Tahmin",
      budgetView: "Bütçe",
      varianceView: "Fark",
      budgetStatus: "Bütçe durumu",
      completed: "Bütçelendi",
      excelBaseline: "Excel baz",
      completedAll: "Bütçelendi",
      excelPending: "Excel baz (bekliyor)",
      save: "Taslağı kaydet",
      submit: "Bütçeyi gönder",
      code: "Hesap",
      account: "Hesap adı",
      source: "Kaynak",
      actualBaseline: "Oca-May gerçek/baz",
      budgetPeriod: "Haz-Ara bütçe",
      annual: "Yıllık toplam",
      status: "Durum",
      hrBudget: "İK bütçesi",
      adminBudget: "İdari bütçe",
      combinedBudget: "İK + İdari",
      excel: "Excel",
      done: "Tamamlandı",
      start: "Bütçeyi başlat",
      view: "Görüntüle",
      detail: "Haz-Ara bütçe detayı",
      close: "Daralt",
      noAccounts: "Hesap yok"
    }
  };
  return copy[state.language]?.[key] || copy.zh[key] || key;
}

function rfAccountGroup(id, title, items, selectedMeta) {
  const groupClass = id === "budgeted" ? "complete" : "baseline";
  return `
    <section class="rf-account-group ${groupClass}" data-rf-group="${escapeHtml(id)}">
      <div class="rf-account-group-head">
        <h4>${escapeHtml(title)}</h4>
        <strong>${items.length}</strong>
      </div>
      <div class="rf-account-table-wrap">
        <table class="rf-account-table">
          <colgroup>
            <col class="rf-col-code" />
            <col class="rf-col-name" />
            <col class="rf-col-source" />
            ${Array.from({ length: 12 }, () => `<col class="rf-col-month" />`).join("")}
            <col class="rf-col-annual" />
            <col class="rf-col-status" />
          </colgroup>
          <thead>
            <tr>
              <th>${escapeHtml(rfCompactT("code"))}</th>
              <th>${escapeHtml(rfCompactT("account"))}</th>
              <th>${escapeHtml(rfCompactT("source"))}</th>
              <th colspan="5">${escapeHtml(rfCompactT("actualBaseline"))}</th>
              <th colspan="7">${escapeHtml(rfCompactT("budgetPeriod"))}</th>
              <th>${escapeHtml(rfCompactT("annual"))}<small>K€</small></th>
              <th>${escapeHtml(rfCompactT("status"))}</th>
            </tr>
            <tr class="rf-account-months">
              <th></th><th></th><th></th>
              ${Array.from({ length: 12 }, (_, index) => `<th>${escapeHtml(localizeMonthLabel(index, state.language))}</th>`).join("")}
              <th></th><th></th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item) => rfAccountStatusRow(item, selectedMeta)).join("") || `<tr><td colspan="17" class="rf-empty">${escapeHtml(rfCompactT("noAccounts"))}</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function rfAccountStatusRow(item, selectedMeta) {
  const row = item.row;
  const selectable = !item.hasCompletedBudget;
  const selected = selectable && row.code === selectedMeta?.row?.code;
  const rawAccountLabel = state.activeUnit === "cooking" && state.language === "zh" && row.descCn
    ? row.descCn
    : localizeAccountLabel(row.code, row.descEn, state.language);
  const accountLabel = rfCleanAccountLabel(row.code, rawAccountLabel);
  const months = Array.from({ length: 12 }, (_, index) => rfAccountMonthAmount(row.code, index + 1));
  const annual = months.reduce((sum, value) => Number.isFinite(value) ? sum + value : sum, 0);
  const statusClass = item.hasCompletedBudget ? "complete" : "baseline";
  const source = item.hasHrBudget && item.hasAdminBudget ? rfCompactT("combinedBudget") : item.hasHrBudget ? rfCompactT("hrBudget") : item.hasAdminBudget ? rfCompactT("adminBudget") : rfCompactT("excel");
  const action = item.hasCompletedBudget ? rfCompactT("view") : rfCompactT("start");
  return `
    <tr class="rf-account-row ${selected ? "selected" : ""} ${selectable ? "selectable" : "read-only"}" ${selectable ? `data-rf-select="${escapeHtml(row.code)}"` : ""}>
      <td>${selectable ? `<button type="button" class="rf-row-toggle" data-rf-select="${escapeHtml(row.code)}" aria-expanded="${selected}">${selected ? "−" : "+"}</button>` : `<span class="rf-row-spacer"></span>`}<b>${escapeHtml(row.code)}</b></td>
      <td title="${escapeHtml(accountLabel)}">${escapeHtml(shortText(accountLabel, 30))}</td>
      <td><span class="rf-source ${statusClass}">${escapeHtml(source)}</span></td>
      ${months.map((value, index) => `<td class="rf-month-value ${index >= 5 ? "forecast" : "actual"}">${formatMoney(value)}</td>`).join("")}
      <td class="rf-annual"><strong>${formatMoney(annual)}</strong></td>
      <td>${item.hasCompletedBudget ? `<span class="rf-status-action complete">${escapeHtml(rfCompactT("done"))}</span>` : `<button type="button" class="rf-status-action ${statusClass}" data-rf-select="${escapeHtml(row.code)}">${escapeHtml(action)}</button>`}</td>
    </tr>
    ${selected ? `<tr class="rf-account-detail-row"><td colspan="17">${rfCompactEditor(item)}</td></tr>` : ""}
  `;
}

function rfCleanAccountLabel(code, label) {
  const source = String(label || "").trim();
  const normalizedCode = String(code || "").trim();
  if (!source || !normalizedCode) return source;
  const escapedCode = normalizedCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const cleaned = source.replace(new RegExp(`^${escapedCode}(?:\\s*[-·:：/]\\s*|\\s+)`, "i"), "").trim();
  return cleaned || source;
}

function rfAccountMonthAmount(code, month) {
  if (month >= 6) return rollingTotalInfo(code, month).total;
  return referenceAmountForAccount(code, month, "current");
}

function rfCompactEditor(item) {
  const row = item.row;
  const totalOnly = item.totalOnly;
  return `
    <div class="rf-compact-editor">
      <div class="rf-compact-editor-head">
        <div><strong>${escapeHtml(rfCompactT("detail"))}</strong><span>${escapeHtml(row.code)} · K€</span></div>
        <div class="rf-actions">
          <button type="button" class="ghost-button" data-rf-action="save-current" ${rollingCanSave() ? "" : "disabled"}>${escapeHtml(rfCompactT("save"))}</button>
          <button type="button" data-rf-action="submit-current" ${rollingCanSubmit() ? "" : "disabled"}>${escapeHtml(rfCompactT("submit"))}</button>
        </div>
      </div>
      <div class="rf-matrix-wrap">
        <table class="rf-matrix ${totalOnly ? "rf-total-mode" : ""}">
          <thead>${totalOnly ? rfTotalModeHeader(false) : rfUnitQtyHeader(false)}</thead>
          <tbody>${ROLLING_FORECAST_MONTHS.map((month) => rfMonthRow(row, month, totalOnly, false)).join("")}</tbody>
        </table>
      </div>
    </div>
  `;
}

function adminT(key) {
  const copy = {
    zh: {
      title: "DW 行政预算工作台", subtitle: "按 Administration Budget R2 标准校核，变更必须填写原因。", permission: "行政角色 · 仅显示行政预算",
      conditions: "预算条件", results: "预算结果", rules: "计算口径", audit: "变更记录", save: "保存责任人", submit: "提交行政预算",
      categories: "预算科目", completed: "已完成预算", pending: "待补标准", annual: "DW全年预算", source: "源文件",
      category: "科目", account: "三张表科目号", standard: "Excel标准", status: "状态", ready: "已预算", missing: "未完成",
      annualTotal: "全年", reason: "调整原因", reasonHint: "仅在修改Excel预算标准时填写原因和依据", formula: "计算逻辑", drivers: "需核对数据", allocation: "月度展开",
      changed: "已修改", unchanged: "与Excel一致", sourceUnit: "源表TRY，网站与第二张表统一为K€", noAudit: "暂无变更记录",
      reasonRequired: "修改预算标准后必须填写对应科目的调整原因", saved: "行政预算校核已保存并留痕", submitted: "行政预算已提交并同步到第二张表",
      time: "时间", owner: "责任人", beforeAfter: "修改前 → 修改后", operation: "操作", pendingNote: "源表尚无DW预算结果，不同步到第二张表"
      ,provider: "提供部门", system: "数据来源", frequency: "更新频率", condition: "预算条件", ownerPending: "待指定责任人", fixedFormula: "固定计算公式", resultReadonly: "系统计算结果，只读并同步到第二张表", responsibilitySaved: "责任人分工已保存"
      ,resultAccountName: "小科目名称", resultAccountCode: "小科目号", sourceCategories: "预算来源", sourceStandard: "按来源系统标准"
    },
    en: {
      title: "DW Administration Budget", subtitle: "Validate Administration Budget R2 standards. Every override requires a reason.", permission: "Administration role · Administration budget only",
      conditions: "Budget inputs", results: "Budget results", rules: "Calculation rules", audit: "Change log", save: "Save owners", submit: "Submit admin budget",
      categories: "Budget items", completed: "Budgeted", pending: "Standard missing", annual: "DW annual budget", source: "Source file",
      category: "Item", account: "Account", standard: "Excel standard", status: "Status", ready: "Budgeted", missing: "Incomplete",
      annualTotal: "Annual", reason: "Change reason", reasonHint: "Required only when overriding the Excel budget standard", formula: "Formula", drivers: "Review inputs", allocation: "Monthly allocation",
      changed: "Changed", unchanged: "Matches Excel", sourceUnit: "Source in TRY; site and second table use K€", noAudit: "No changes recorded",
      reasonRequired: "Enter a reason for every changed budget item", saved: "Administration review saved with audit trail", submitted: "Administration budget submitted and synced to the second table",
      time: "Time", owner: "Owner", beforeAfter: "Before → After", operation: "Action", pendingNote: "No DW result in source; excluded from second-table sync"
      ,provider: "Provider", system: "Data source", frequency: "Frequency", condition: "Budget input", ownerPending: "Assign owner", fixedFormula: "Fixed formula", resultReadonly: "System-calculated, read-only and synced to the second table", responsibilitySaved: "Responsibility owners saved"
      ,resultAccountName: "Account name", resultAccountCode: "Account code", sourceCategories: "Budget sources", sourceStandard: "Source-system standard"
    },
    tr: {
      title: "DW İdari Bütçe", subtitle: "Administration Budget R2 standartlarını doğrulayın. Her değişiklik gerekçe gerektirir.", permission: "İdari rol · Yalnızca idari bütçe",
      conditions: "Bütçe girdileri", results: "Bütçe sonuçları", rules: "Hesaplama kuralları", audit: "Değişiklik kaydı", save: "Sorumluları kaydet", submit: "İdari bütçeyi gönder",
      categories: "Bütçe kalemleri", completed: "Bütçelendi", pending: "Standart eksik", annual: "DW yıllık bütçe", source: "Kaynak dosya",
      category: "Kalem", account: "Hesap", standard: "Excel standardı", status: "Durum", ready: "Bütçelendi", missing: "Eksik",
      annualTotal: "Yıllık", reason: "Değişiklik nedeni", reasonHint: "Yalnızca Excel bütçe standardı değiştirildiğinde zorunludur", formula: "Formül", drivers: "Kontrol verileri", allocation: "Aylık dağılım",
      changed: "Değişti", unchanged: "Excel ile aynı", sourceUnit: "Kaynak TRY; web ve ikinci tablo K€", noAudit: "Değişiklik kaydı yok",
      reasonRequired: "Değiştirilen her bütçe kalemi için gerekçe girin", saved: "İdari bütçe kontrolü denetim iziyle kaydedildi", submitted: "İdari bütçe ikinci tabloya gönderildi",
      time: "Zaman", owner: "Sorumlu", beforeAfter: "Önce → Sonra", operation: "İşlem", pendingNote: "Kaynakta DW sonucu yok; ikinci tabloya aktarılmaz"
      ,provider: "Sağlayan bölüm", system: "Veri kaynağı", frequency: "Sıklık", condition: "Bütçe girdisi", ownerPending: "Sorumlu ata", fixedFormula: "Sabit formül", resultReadonly: "Sistem hesabı salt okunur ve ikinci tabloya aktarılır", responsibilitySaved: "Sorumlular kaydedildi"
      ,resultAccountName: "Hesap adı", resultAccountCode: "Hesap kodu", sourceCategories: "Bütçe kaynakları", sourceStandard: "Kaynak sistem standardı"
    }
  };
  return copy[state.language]?.[key] || copy.zh[key] || key;
}

const ADMIN_CATEGORY_TR = {
  fleetFuel: "Araç Filosu ve Yakıt", canteen: "Yemekhane", shuttle: "Servis", hiring: "İşe Alım", training: "Eğitim", sodexo: "Sodexo Yan Hakkı", security: "Güvenlik", cleaning: "Temizlik", flatRent: "Konut Kirası", otherSuppliers: "Diğer Tedarikçiler", doctorNurse: "Doktor ve Hemşire", uniforms: "İş Kıyafetleri", socialAids: "Sosyal Yardımlar", ramadanFood: "Ramazan Gıda Yardımı", shoes: "Ayakkabı Yardımı", entertainment: "Çalışan Etkinlikleri", mobile: "Mobil İletişim", rewards: "Çalışan Ödülleri", waste: "Atık Yönetimi", hiringHealth: "İşe Giriş Sağlık Kontrolü", socialAudits: "Sosyal Uygunluk Denetimi", waterBottles: "İçme Suyu", hrPrograms: "İK Sistemleri ve Programları", privateHealth: "Özel Sağlık Sigortası", otherAdmin: "Diğer İdari Giderler"
};

const ADMIN_FORMULA_EN = {
  fleetFuel: "Monthly rent x 12 + monthly fuel litres x fuel price x 12, summarized by cost center", canteen: "(eligible headcount x workdays + Sunday overtime headcount x 5) x monthly meal price", shuttle: "Attendance x workdays x shuttle rate; rate = route cost / (16 x target occupancy) x 2", hiring: "Recruitment-channel baseline x (1 + 30%) + planned-vacancy cost", training: "Department baseline x (1 + 30%); selected R&D cost allocated by headcount share x training pool x EUR/TRY", sodexo: "Eligible roster x 250 workdays x TRY 455/day", security: "Service FTE x 2026 monthly rate x 12 x 1.1 + fixed allowance", cleaning: "Service FTE x 2026 monthly rate x 12 x 1.1 + fixed allowance", flatRent: "Monthly rent x 12; shared housing allocated by cost center", otherSuppliers: "Service FTE x 2026 monthly rate x 12; selected items x 1.1", doctorNurse: "Doctor/nurse FTE x monthly service rate x 12", uniforms: "Eligible headcount x item price x issue quantity x 1.2 + special equipment", socialAids: "H1 eligible headcount x TRY 8,000 + H2 eligible headcount x TRY 8,000", ramadanFood: "Eligible headcount x food-package price x 1.1", shoes: "Eligible headcount x shoe price x 2 issues x 1.1", entertainment: "Activity headcount/count x 2026 price + fixed corporate events", mobile: "2025 monthly cost x 1.3 x 12; selected items x quantity", rewards: "Reward quantity x 2026 reward price", waste: "[((7-month actual / 7 x 12 + 7-month actual) x disposal rate) + transport] x 1.3", hiringHealth: "Planned hires x (TRY 1,500 x 1.3)", socialAudits: "2025 Sedex audit cost x 1.3", waterBottles: "Quantity x (TRY 500 x 1.3)", hrPrograms: "Fixed licence quantity x EUR/TRY; other systems = 2025 cost x 1.3", privateHealth: "Headcount by grade/dependent type x 2026 premium + life insurance", otherAdmin: "First 9 months actual / 9 x 12"
};

const ADMIN_FORMULA_TR = {
  fleetFuel: "Aylık kira x 12 + aylık yakıt litresi x yakıt fiyatı x 12; masraf merkezi bazında toplam", canteen: "(uygun çalışan x iş günü + Pazar mesaisi çalışanı x 5) x aylık yemek fiyatı", shuttle: "Katılım x iş günü x servis birim fiyatı; fiyat = hat maliyeti / (16 x hedef doluluk) x 2", hiring: "İşe alım kanal bazı x (1 + %30) + planlı açık pozisyon maliyeti", training: "Bölüm bazı x (1 + %30); seçili Ar-Ge gideri çalışan payı x eğitim havuzu x EUR/TRY", sodexo: "Uygun çalışan listesi x 250 iş günü x 455 TRY/gün", security: "Hizmet çalışanı x 2026 aylık fiyat x 12 x 1.1 + sabit yardım", cleaning: "Hizmet çalışanı x 2026 aylık fiyat x 12 x 1.1 + sabit yardım", flatRent: "Aylık kira x 12; ortak konut masraf merkezi bazında dağıtılır", otherSuppliers: "Hizmet çalışanı x 2026 aylık fiyat x 12; seçili kalemler x 1.1", doctorNurse: "Doktor/hemşire sayısı x aylık hizmet fiyatı x 12", uniforms: "Uygun çalışan x ürün fiyatı x dağıtım adedi x 1.2 + özel ekipman", socialAids: "İlk yarı çalışan x 8.000 TRY + ikinci yarı çalışan x 8.000 TRY", ramadanFood: "Uygun çalışan x gıda paketi fiyatı x 1.1", shoes: "Uygun çalışan x ayakkabı fiyatı x 2 dağıtım x 1.1", entertainment: "Etkinlik çalışanı/adedi x 2026 fiyatı + sabit şirket etkinlikleri", mobile: "2025 aylık gideri x 1.3 x 12; seçili kalemler x adet", rewards: "Ödül adedi x 2026 ödül fiyatı", waste: "[((7 aylık gerçekleşen / 7 x 12 + 7 aylık gerçekleşen) x bertaraf fiyatı) + nakliye] x 1.3", hiringHealth: "Planlı işe alım x (1.500 TRY x 1.3)", socialAudits: "2025 Sedex denetim gideri x 1.3", waterBottles: "Adet x (500 TRY x 1.3)", hrPrograms: "Sabit lisans adedi x EUR/TRY; diğer sistemler = 2025 gideri x 1.3", privateHealth: "Unvan/yakın türü çalışan adedi x 2026 primi + hayat sigortası", otherAdmin: "İlk 9 ay gerçekleşen / 9 x 12"
};

const ADMIN_DRIVER_EN = { vehicleList:"Vehicle and allocation list",rentPrice:"Monthly rent",fuelQuota:"Monthly fuel quota",fuelPrice:"Fuel price",headcount:"Eligible headcount",workdays:"Workdays",sundayOt:"Sunday overtime headcount",mealPrice:"Meal unit price",routeCost:"Route cost",occupancy:"Target occupancy",channelBaseline:"Recruitment-channel baseline",vacancies:"Planned vacancies",increase:"Increase rate",trainingPlan:"Department training plan",trainingPrice:"Course/training-pool price",fx:"EUR/TRY rate",roster:"Eligible roster",annualDays:"Annual workdays",dailyPrice:"Daily rate",fte:"Service FTE",monthlyPrice:"Monthly service rate",allowance:"Fixed allowance",housingList:"Housing list",allocation:"Cost-center allocation",surcharge:"Surcharge factor",issueQty:"Issue quantity/frequency",itemPrice:"Item unit price",aidStandard:"Aid standard",tisRate:"TIS increase rate",packagePrice:"Food-package price",issueRule:"Issue rule",shoePrice:"Shoe unit price",activityPlan:"Activity plan and count",activityPrice:"Activity unit price",userCount:"User quantity",monthlyTariff:"Monthly tariff",rewardQty:"Reward quantities",rewardPrice:"Reward unit price",wasteQty:"Waste quantity",handlingPrice:"Disposal unit price",transportPrice:"Transport fee",actualBaseline:"Actual baseline",hiringQty:"Planned hires",checkPrice:"Health-check price",auditPlan:"Audit plan",auditPrice:"Audit fee",quantity:"Quantity",unitPrice:"Unit price",licenseQty:"Licence quantity",licensePrice:"Licence unit price",insuredRoster:"Insured roster and dependent type",premium:"2026 premium",lifeInsurance:"Life-insurance standard",actual9m:"First 9 months actual",scope:"Expense scope" };
const ADMIN_DRIVER_TR = { vehicleList:"Araç ve dağılım listesi",rentPrice:"Aylık kira",fuelQuota:"Aylık yakıt limiti",fuelPrice:"Yakıt fiyatı",headcount:"Uygun çalışan sayısı",workdays:"İş günleri",sundayOt:"Pazar mesaisi çalışanı",mealPrice:"Yemek birim fiyatı",routeCost:"Hat maliyeti",occupancy:"Hedef doluluk",channelBaseline:"İşe alım kanal bazı",vacancies:"Planlı açık pozisyon",increase:"Artış oranı",trainingPlan:"Bölüm eğitim planı",trainingPrice:"Kurs/eğitim havuzu fiyatı",fx:"EUR/TRY kuru",roster:"Uygun çalışan listesi",annualDays:"Yıllık iş günü",dailyPrice:"Günlük fiyat",fte:"Hizmet çalışanı",monthlyPrice:"Aylık hizmet fiyatı",allowance:"Sabit yardım",housingList:"Konut listesi",allocation:"Masraf merkezi dağılımı",surcharge:"Ek katsayı",issueQty:"Dağıtım adedi/sıklığı",itemPrice:"Ürün birim fiyatı",aidStandard:"Yardım standardı",tisRate:"TİS artış oranı",packagePrice:"Gıda paketi fiyatı",issueRule:"Dağıtım kuralı",shoePrice:"Ayakkabı birim fiyatı",activityPlan:"Etkinlik planı ve adedi",activityPrice:"Etkinlik birim fiyatı",userCount:"Kullanıcı adedi",monthlyTariff:"Aylık tarife",rewardQty:"Ödül adetleri",rewardPrice:"Ödül birim fiyatı",wasteQty:"Atık miktarı",handlingPrice:"Bertaraf birim fiyatı",transportPrice:"Nakliye ücreti",actualBaseline:"Gerçekleşen baz",hiringQty:"Planlı işe alım",checkPrice:"Sağlık kontrolü fiyatı",auditPlan:"Denetim planı",auditPrice:"Denetim ücreti",quantity:"Miktar",unitPrice:"Birim fiyat",licenseQty:"Lisans adedi",licensePrice:"Lisans birim fiyatı",insuredRoster:"Sigortalı listesi ve yakın türü",premium:"2026 primi",lifeInsurance:"Hayat sigortası standardı",actual9m:"İlk 9 ay gerçekleşen",scope:"Gider kapsamı" };

const ADMIN_SYSTEM_I18N = {
  en: {"车辆台账":"Vehicle register","采购合同":"Procurement contract","车辆政策":"Vehicle policy","HR人员系统":"HR system","系统日历":"System calendar","考勤系统":"Attendance system","班车线路台账":"Shuttle-route register","招聘台账":"Recruitment register","编制计划":"Workforce plan","预算参数":"Budget parameters","培训计划":"Training plan","财务参数":"Finance parameters","福利合同":"Benefit contract","供应商排班":"Supplier roster","服务合同":"Service contract","住房台账":"Housing register","租赁合同":"Lease contract","成本中心规则":"Cost-center rules","职业健康台账":"Occupational-health register","发放政策":"Issue policy","福利政策":"Benefit policy","劳资政策":"Labor policy","活动计划":"Activity plan","通讯台账":"Communication register","奖励计划":"Reward plan","奖励政策":"Reward policy","废弃物台账":"Waste register","SAP":"SAP","审核计划":"Audit plan","领用台账":"Consumption register","系统许可台账":"Licence register","保险合同":"Insurance contract","科目范围":"Account scope"},
  tr: {"车辆台账":"Araç kaydı","采购合同":"Satın alma sözleşmesi","车辆政策":"Araç politikası","HR人员系统":"İK sistemi","系统日历":"Sistem takvimi","考勤系统":"Puantaj sistemi","班车线路台账":"Servis hat kaydı","招聘台账":"İşe alım kaydı","编制计划":"Kadro planı","预算参数":"Bütçe parametreleri","培训计划":"Eğitim planı","财务参数":"Finans parametreleri","福利合同":"Yan hak sözleşmesi","供应商排班":"Tedarikçi vardiyası","服务合同":"Hizmet sözleşmesi","住房台账":"Konut kaydı","租赁合同":"Kira sözleşmesi","成本中心规则":"Masraf merkezi kuralları","职业健康台账":"İş sağlığı kaydı","发放政策":"Dağıtım politikası","福利政策":"Yan hak politikası","劳资政策":"Çalışma politikası","活动计划":"Etkinlik planı","通讯台账":"İletişim kaydı","奖励计划":"Ödül planı","奖励政策":"Ödül politikası","废弃物台账":"Atık kaydı","SAP":"SAP","审核计划":"Denetim planı","领用台账":"Tüketim kaydı","系统许可台账":"Lisans kaydı","保险合同":"Sigorta sözleşmesi","科目范围":"Hesap kapsamı"}
};

const ADMIN_PROVIDER_I18N = {
  en: { "行政部门":"Administration", "间接采购":"Indirect Procurement", "人力资源":"HR", "财务部门":"Finance", "EHS/生产部门":"EHS / Production", "人力资源/合规":"HR / Compliance", "间接采购/IT":"Indirect Procurement / IT" },
  tr: { "行政部门":"İdari İşler", "间接采购":"Endirekt Satın Alma", "人力资源":"İnsan Kaynakları", "财务部门":"Finans", "EHS/生产部门":"EHS / Üretim", "人力资源/合规":"İK / Uygunluk", "间接采购/IT":"Endirekt Satın Alma / BT" }
};

function adminCategoryLabel(category) {
  if (state.language === "en") return category.sourceLabel;
  if (state.language === "tr") return ADMIN_CATEGORY_TR[category.id] || category.sourceLabel;
  return category.label;
}

function adminFormula(category) {
  if (state.language === "en") return ADMIN_FORMULA_EN[category.id] || category.formula;
  if (state.language === "tr") return ADMIN_FORMULA_TR[category.id] || category.formula;
  return category.formula;
}

function adminDriverLabel(item) {
  if (state.language === "en") return ADMIN_DRIVER_EN[item.key] || item.key;
  if (state.language === "tr") return ADMIN_DRIVER_TR[item.key] || item.key;
  return item.label;
}

function adminProvider(value) {
  return ADMIN_PROVIDER_I18N[state.language]?.[value] || value;
}

function adminDriverSystem(item) {
  if (state.language === "zh") return item.system;
  return ADMIN_SYSTEM_I18N[state.language]?.[item.system] || item.system;
}

function adminFrequency(value) {
  if (state.language === "en") return value === "年度" ? "Annual" : value === "半年度" ? "Semiannual" : "Monthly";
  if (state.language === "tr") return value === "年度" ? "Yıllık" : value === "半年度" ? "Altı aylık" : "Aylık";
  return value;
}

function defaultAdminBudgetInputs() {
  return {
    months: Object.fromEntries(ADMIN_BUDGET_DATA.categories.map((item) => [item.id, [...item.monthlyTry]])),
    reasons: {},
    owners: {}
  };
}

function loadAdminBudgetInputs() {
  const defaults = defaultAdminBudgetInputs();
  try {
    const saved = JSON.parse(localStorage.getItem(ADMIN_BUDGET_INPUT_KEY) || "null");
    if (!saved) return defaults;
    return { months: { ...defaults.months, ...(saved.months || {}) }, reasons: { ...(saved.reasons || {}) }, owners: { ...(saved.owners || {}) } };
  } catch {
    return defaults;
  }
}

function loadAdminBudgetAudit() {
  try { return JSON.parse(localStorage.getItem(ADMIN_BUDGET_AUDIT_KEY) || "[]"); } catch { return []; }
}

function saveAdminBudgetState() {
  localStorage.setItem(ADMIN_BUDGET_INPUT_KEY, JSON.stringify(adminBudgetInputs));
  localStorage.setItem(ADMIN_BUDGET_AUDIT_KEY, JSON.stringify(adminBudgetAudit));
}

function adminCategoryChanged(category) {
  const current = adminBudgetInputs.months[category.id] || [];
  const saved = adminBudgetSavedInputs.months?.[category.id] || category.monthlyTry || [];
  return current.some((value, index) => Math.abs(Number(value || 0) - Number(saved[index] || 0)) > 0.01);
}

function adminPendingChanges() {
  return ADMIN_BUDGET_DATA.categories.filter(adminCategoryChanged);
}

function adminMonthlyKeur(category, index) {
  return Number(category.monthlyTry?.[index] || 0) / ADMIN_BUDGET_DATA.eurTry / 1000;
}

function adminAnnualKeur(category) {
  return (category.monthlyTry || []).reduce((sum, value) => sum + Number(value || 0), 0) / ADMIN_BUDGET_DATA.eurTry / 1000;
}

function renderAdminBudgetWorkspace() {
  if (!els.forecastWorkspace) return;
  const ready = ADMIN_BUDGET_DATA.categories.filter((item) => item.ready);
  const pending = ADMIN_BUDGET_DATA.categories.filter((item) => !item.ready);
  const annual = ready.reduce((sum, item) => sum + adminAnnualKeur(item), 0);
  const selected = ADMIN_BUDGET_DATA.categories.find((item) => item.id === state.adminSelectedCategory) || ADMIN_BUDGET_DATA.categories[0];
  const nav = `<nav class="adb-tabs">${[["conditions","conditions"],["results","results"],["audit","audit"]].map(([id,key]) => `<button type="button" class="${state.adminBudgetView === id ? "active" : ""}" data-admin-view="${id}">${escapeHtml(adminT(key))}</button>`).join("")}</nav>`;
  const content = state.adminBudgetView === "results" ? adminBudgetResults() : state.adminBudgetView === "audit" ? adminAuditView() : adminConditionView(selected);
  const versions = state.language === "en" ? ["2026 Budget", "5+7 Forecast", "Variance"] : state.language === "tr" ? ["2026 Bütçe", "5+7 Tahmin", "Fark"] : ["2026预算", "5+7预测", "差异版"];
  els.forecastWorkspace.innerHTML = `<div class="adb-shell">
    <header class="adb-header"><div><span>${escapeHtml(adminT("permission"))}</span><h3>${escapeHtml(adminT("title"))}</h3><p>${escapeHtml(adminT("subtitle"))}</p></div><div class="adb-version-switch">${versions.map((label, index) => `<span class="${index === 1 ? "active" : ""}">${escapeHtml(label)}</span>`).join("")}</div><div class="adb-actions"><button type="button" class="ghost-button" data-admin-action="save">${escapeHtml(adminT("save"))}</button><button type="button" data-admin-action="submit">${escapeHtml(adminT("submit"))}</button></div></header>
    ${nav}
    <section class="adb-kpis"><div><span>${escapeHtml(adminT("categories"))}</span><strong>${ADMIN_BUDGET_DATA.categories.length}</strong></div><div class="good"><span>${escapeHtml(adminT("completed"))}</span><strong>${ready.length}</strong></div><div class="warn"><span>${escapeHtml(adminT("pending"))}</span><strong>${pending.length}</strong></div><div><span>${escapeHtml(adminT("annual"))}</span><strong>€${formatMoney(annual)}K</strong></div><div><span>${escapeHtml(adminT("source"))}</span><strong>R2</strong><small>${escapeHtml(ADMIN_BUDGET_DATA.sourceFile)}</small></div></section>
    ${content}
  </div>`;
}

function adminConditionView(selected) {
  return `<section class="adb-condition-layout"><aside class="adb-category-list">${ADMIN_BUDGET_DATA.categories.map((category) => `<button type="button" class="${selected.id === category.id ? "active" : ""}" data-admin-select="${category.id}"><span><b>${escapeHtml(adminCategoryLabel(category))}</b><small>${escapeHtml(category.sourceLabel)}</small></span><em class="adb-status ${category.ready ? "ready" : "missing"}">${escapeHtml(category.ready ? adminT("ready") : adminT("missing"))}</em></button>`).join("")}</aside><section class="adb-condition-main">${adminSelectedPanel(selected)}${adminDriverTable(selected)}</section></section>`;
}

function adminSelectedPanel(category) {
  return `<header class="adb-condition-head"><div><span>${escapeHtml(category.sourceLabel)}</span><h4>${escapeHtml(adminCategoryLabel(category))}</h4><b>${escapeHtml(category.accountCode)}</b></div><div><span>${escapeHtml(adminT("fixedFormula"))}</span><strong>${escapeHtml(adminFormula(category))}</strong><small>${escapeHtml(state.language === "zh" ? category.allocation : adminT("sourceStandard"))}</small></div></header>`;
}

function adminDriverTable(category) {
  const drivers = ADMIN_DRIVER_MATRIX[category.id] || [];
  return `<div class="adb-driver-table"><table><thead><tr><th>${escapeHtml(adminT("condition"))}</th><th>${escapeHtml(adminT("standard"))}</th><th>${escapeHtml(adminT("provider"))}</th><th>${escapeHtml(adminT("owner"))}</th><th>${escapeHtml(adminT("system"))}</th><th>${escapeHtml(adminT("frequency"))}</th></tr></thead><tbody>${drivers.map((item) => `<tr><td><b>${escapeHtml(adminDriverLabel(item))}</b></td><td>${escapeHtml(state.language === "zh" ? item.standard : adminT("sourceStandard"))}</td><td><span class="adb-provider">${escapeHtml(adminProvider(item.provider))}</span></td><td><input data-admin-owner="${category.id}.${item.key}" value="${escapeHtml(adminBudgetInputs.owners?.[category.id]?.[item.key] || "")}" placeholder="${escapeHtml(adminT("ownerPending"))}" /></td><td>${escapeHtml(adminDriverSystem(item))}</td><td>${escapeHtml(adminFrequency(item.frequency))}</td></tr>`).join("")}</tbody></table>${category.ready ? `<p class="adb-result-note">${escapeHtml(adminT("resultReadonly"))}</p>` : `<p class="adb-pending-note">${escapeHtml(adminT("pendingNote"))}</p>`}</div>`;
}

function adminBudgetResults() {
  const accounts = adminBudgetResultAccounts();
  const resultMonths = Array.from({ length: 12 }, (_, index) => index + 1);
  const selected = accounts.find((item) => item.code === state.adminSelectedAccount) || accounts[0];
  if (selected) state.adminSelectedAccount = selected.code;
  const actualBand = state.language === "en" ? "Jan-May Excel baseline" : state.language === "tr" ? "Oca-May Excel baz" : "1-5月 Excel基线";
  const forecastBand = state.language === "en" ? "Jun-Dec rolling budget" : state.language === "tr" ? "Haz-Ara güncel bütçe" : "6-12月 滚动预算";
  return `<section class="adb-results"><div class="adb-table-wrap"><table class="adb-budget-table"><thead><tr class="adb-month-bands"><th colspan="2">${escapeHtml(adminT("categories"))}</th><th colspan="5" class="baseline">${escapeHtml(actualBand)}</th><th colspan="7" class="forecast">${escapeHtml(forecastBand)}</th><th colspan="2">${escapeHtml(adminT("annualTotal"))}</th></tr><tr><th>${escapeHtml(adminT("resultAccountName"))}</th><th>${escapeHtml(adminT("resultAccountCode"))}</th>${resultMonths.map((month) => `<th>${escapeHtml(localizeMonthLabel(month - 1, state.language))}<small>K€</small></th>`).join("")}<th>${escapeHtml(adminT("annualTotal"))}<small>K€</small></th><th>${escapeHtml(adminT("status"))}</th></tr></thead><tbody>${accounts.map((account) => `<tr class="${selected?.code === account.code ? "selected" : ""}" data-admin-result="${escapeHtml(account.code)}"><td><b>${escapeHtml(account.label)}</b><small>${escapeHtml(adminT("sourceCategories"))}: ${escapeHtml(account.sources.join(" / "))}</small></td><td>${escapeHtml(account.code)}</td>${resultMonths.map((month) => `<td>${formatMoney(account.months[month - 1])}</td>`).join("")}<td><strong>${formatMoney(account.annual)}</strong></td><td><span class="adb-status ready">${escapeHtml(adminT("ready"))}</span></td></tr>`).join("")}</tbody></table></div>${selected ? adminBudgetAccountDetail(selected) : ""}</section>`;
}

function adminBudgetAccountDetail(account) {
  const categories = (account.categoryIds || []).map((id) => ADMIN_BUDGET_DATA.categories.find((item) => item.id === id)).filter(Boolean);
  const primary = categories[0];
  const drivers = primary ? (ADMIN_DRIVER_MATRIX[primary.id] || []).slice(0, 4) : [];
  const max = Math.max(...account.months, 1);
  const points = account.months.map((value, index) => `${index * (100 / 11)},${88 - (Number(value || 0) / max) * 64}`).join(" ");
  const sourceLabel = state.language === "en" ? "Budget source" : state.language === "tr" ? "Bütçe kaynağı" : "预算来源";
  const driverLabel = state.language === "en" ? "Driver responsibility" : state.language === "tr" ? "Sürücü sorumluluğu" : "驱动责任";
  const trendLabel = state.language === "en" ? "Monthly budget trend" : state.language === "tr" ? "Aylık bütçe eğilimi" : "月度预算趋势";
  return `<section class="adb-account-detail"><div class="adb-account-formula"><span>${escapeHtml(account.code)}</span><h4>${escapeHtml(account.label)}</h4><b>${escapeHtml(primary ? adminFormula(primary) : adminT("sourceStandard"))}</b><small>${escapeHtml(sourceLabel)}：${escapeHtml(account.sources.join(" / "))}</small></div><div class="adb-account-drivers"><strong>${escapeHtml(driverLabel)}</strong><div>${drivers.map((item) => `<span><small>${escapeHtml(adminDriverLabel(item))}</small><b>${escapeHtml(adminProvider(item.provider))}</b></span>`).join("")}</div></div><div class="adb-account-trend"><strong>${escapeHtml(trendLabel)}</strong><svg viewBox="0 0 100 94" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="88" x2="100" y2="88"></line><line x1="0" y1="56" x2="100" y2="56"></line><polyline points="${points}"></polyline></svg></div></section>`;
}

function adminBudgetResultAccounts() {
  const output = buildAdminBudgetAccountSync(ADMIN_BUDGET_DATA, {}, Array.from({ length: 12 }, (_, index) => index + 1));
  return Object.entries(output).map(([code, entry]) => {
    const row = rollingRowForCode(code);
    const rawLabel = row ? (state.activeUnit === "cooking" && state.language === "zh" && row.descCn ? row.descCn : localizeAccountLabel(code, row.descEn, state.language)) : localizeAccountLabel(code, "", state.language);
    const sources = (entry.categoryIds || []).map((id) => adminCategoryLabel(ADMIN_BUDGET_DATA.categories.find((item) => item.id === id) || { id, label: id, sourceLabel: id }));
    const months = Array.from({ length: 12 }, (_, index) => Number(entry.months?.[String(index + 1)] || 0));
    return { code, label: rfCleanAccountLabel(code, rawLabel) || code, sources, categoryIds: entry.categoryIds || [], months, annual: months.reduce((sum, value) => sum + value, 0) };
  }).sort((left, right) => left.code.localeCompare(right.code));
}

function adminRulesView() {
  return `<section class="adb-rules"><table><thead><tr><th>${escapeHtml(adminT("category"))}</th><th>${escapeHtml(adminT("formula"))}</th><th>${escapeHtml(adminT("drivers"))}</th><th>${escapeHtml(adminT("allocation"))}</th><th>${escapeHtml(adminT("status"))}</th></tr></thead><tbody>${ADMIN_BUDGET_DATA.categories.map((item) => `<tr><td><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.sourceLabel)}</small></td><td>${escapeHtml(item.formula)}</td><td>${escapeHtml(item.drivers)}</td><td>${escapeHtml(item.allocation)}</td><td><span class="adb-status ${item.ready ? "ready" : "missing"}">${escapeHtml(item.ready ? adminT("ready") : adminT("missing"))}</span></td></tr>`).join("")}</tbody></table></section>`;
}

function adminAuditView() {
  return `<section class="adb-audit"><table><thead><tr><th>${escapeHtml(adminT("time"))}</th><th>${escapeHtml(adminT("owner"))}</th><th>${escapeHtml(adminT("category"))}</th><th>${escapeHtml(adminT("beforeAfter"))}</th><th>${escapeHtml(adminT("reason"))}</th><th>${escapeHtml(adminT("operation"))}</th></tr></thead><tbody>${adminBudgetAudit.map((item) => `<tr><td>${escapeHtml(new Date(item.timestamp).toLocaleString())}</td><td>${escapeHtml(item.actor)}</td><td>${escapeHtml(item.label)}<small>${escapeHtml(item.period)}</small></td><td>${formatMoney(item.before / ADMIN_BUDGET_DATA.eurTry / 1000)} → ${formatMoney(item.after / ADMIN_BUDGET_DATA.eurTry / 1000)} K€</td><td>${escapeHtml(item.reason)}</td><td>${escapeHtml(item.action)}</td></tr>`).join("") || `<tr><td colspan="6" class="empty-cell">${escapeHtml(adminT("noAudit"))}</td></tr>`}</tbody></table></section>`;
}

function adminBudgetChanges() {
  const changes = [];
  for (const category of ADMIN_BUDGET_DATA.categories) {
    const before = adminBudgetSavedInputs.months?.[category.id] || category.monthlyTry || [];
    const after = adminBudgetInputs.months?.[category.id] || [];
    after.forEach((value, index) => {
      if (Math.abs(Number(value || 0) - Number(before[index] || 0)) > 0.01) changes.push({ category, index, before: Number(before[index] || 0), after: Number(value || 0) });
    });
  }
  return changes;
}

function applyAdminBudgetSync(reason = "Excel baseline", action = "baseline") {
  const output = buildAdminBudgetAccountSync(ADMIN_BUDGET_DATA, {});
  const timestamp = new Date().toISOString();
  const actor = els.userName?.value.trim() || (action === "baseline" ? "Excel" : adminT("permission"));
  for (const [code, entry] of Object.entries(output)) {
    const accountDraft = state.rollingForecastDrafts[code] || {};
    for (const [month, amount] of Object.entries(entry.months || {})) {
      accountDraft[month] = { ...(accountDraft[month] || {}), adminBudgetAmount: Number(Number(amount || 0).toFixed(6)), adminBudgetOwner: actor, adminBudgetUpdatedAt: timestamp, adminBudgetReason: reason, adminBudgetCategoryIds: [...entry.categoryIds], adminBudgetLabels: [...entry.sourceLabels] };
    }
    state.rollingForecastDrafts[code] = accountDraft;
    if (action === "submit") state.rollingForecastSubmitted[code] = timestamp;
  }
  localStorage.setItem(ADMIN_BUDGET_SYNC_KEY, JSON.stringify({ version: VERSION, timestamp, actor, reason, action, mappedCodes: Object.keys(output).length }));
  localStorage.setItem(ROLLING_FORECAST_DRAFT_KEY, JSON.stringify(state.rollingForecastDrafts));
  localStorage.setItem(ROLLING_FORECAST_SUBMIT_KEY, JSON.stringify(state.rollingForecastSubmitted));
}

function ensureAdminBudgetBaselineSync() {
  let meta = null;
  try { meta = JSON.parse(localStorage.getItem(ADMIN_BUDGET_SYNC_KEY) || "null"); } catch { meta = null; }
  const hasAmount = Object.values(state.rollingForecastDrafts || {}).some((account) => Object.values(account || {}).some((month) => Number.isFinite(Number(month?.adminBudgetAmount))));
  if (!hasAmount || meta?.version !== VERSION) applyAdminBudgetSync(meta?.reason || "Excel baseline", meta?.action || "baseline");
}

function loadHrBudgetDrivers() {
  try {
    return { ...HR_BUDGET_DEFAULTS, ...JSON.parse(localStorage.getItem(HR_BUDGET_DRIVER_KEY) || "{}") };
  } catch {
    return { ...HR_BUDGET_DEFAULTS };
  }
}

function defaultHrBudgetInputs() {
  const data = hrBudgetData();
  return {
    headcount: {
      direct: [...(data.headcountByPosition?.direct || Array(12).fill(0))],
      indirect: [...(data.headcountByPosition?.indirect || Array(12).fill(0))],
      whiteCollar: [...(data.headcountByPosition?.whiteCollar || Array(12).fill(0))]
    },
    calendar: {
      workingDays: [...(data.workingDays || Array(12).fill(0))],
      realHoursPerDay: [...(data.realHoursPerDay || Array(12).fill(0))],
      paidHoursPerDay: [...(data.paidHoursPerDay || Array(12).fill(0))]
    },
    policy: {
      wageRates: (data.wageIncreaseStages || []).map((item) => Number(item.rate || 0))
    },
    notes: ""
  };
}

function loadHrBudgetInputs() {
  const defaults = defaultHrBudgetInputs();
  try {
    const saved = JSON.parse(localStorage.getItem(HR_BUDGET_INPUT_KEY) || "null");
    if (!saved) return defaults;
    return {
      headcount: { ...defaults.headcount, ...(saved.headcount || {}) },
      calendar: { ...defaults.calendar, ...(saved.calendar || {}) },
      policy: { ...defaults.policy, ...(saved.policy || {}) },
      notes: saved.notes || ""
    };
  } catch {
    return defaults;
  }
}

function saveHrBudgetInputs() {
  localStorage.setItem(HR_BUDGET_INPUT_KEY, JSON.stringify(hrBudgetInputs));
}

function cloneHrBudgetInputs(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadHrBudgetAudit() {
  try {
    return JSON.parse(localStorage.getItem(HR_BUDGET_AUDIT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHrBudgetAudit() {
  localStorage.setItem(HR_BUDGET_AUDIT_KEY, JSON.stringify(hrBudgetAudit));
}

function loadHrBudgetSyncMeta() {
  try {
    return JSON.parse(localStorage.getItem(HR_BUDGET_SYNC_KEY) || "null");
  } catch {
    return null;
  }
}

function applyHrBudgetSync(reason = "", action = "baseline") {
  const output = buildHrBudgetAccountSync(hrBudgetData());
  const timestamp = new Date().toISOString();
  const actor = els.userName?.value.trim() || (action === "baseline" ? "Excel" : t("hrRole"));
  const meta = {
    version: VERSION,
    timestamp,
    actor,
    reason: String(reason || rfT("hrBaselineReason")).trim(),
    action,
    sourceFile: hrBudgetData().sourceFile,
    mappedCodes: Object.keys(output).length
  };

  for (const [code, entry] of Object.entries(output)) {
    const accountDraft = state.rollingForecastDrafts[code] || {};
    for (const [month, amount] of Object.entries(entry.months || {})) {
      accountDraft[month] = {
        ...(accountDraft[month] || {}),
        hrBudgetAmount: Number(Number(amount || 0).toFixed(6)),
        hrBudgetOwner: actor,
        hrBudgetUpdatedAt: timestamp,
        hrBudgetReason: meta.reason,
        hrBudgetKeys: [...entry.accountKeys],
        hrBudgetLabels: [...entry.sourceLabels]
      };
    }
    state.rollingForecastDrafts[code] = accountDraft;
    if (action === "submit") state.rollingForecastSubmitted[code] = timestamp;
  }
  localStorage.setItem(HR_BUDGET_SYNC_KEY, JSON.stringify(meta));
  localStorage.setItem(ROLLING_FORECAST_DRAFT_KEY, JSON.stringify(state.rollingForecastDrafts));
  localStorage.setItem(ROLLING_FORECAST_SUBMIT_KEY, JSON.stringify(state.rollingForecastSubmitted));
  return meta;
}

function ensureHrBudgetBaselineSync() {
  const meta = loadHrBudgetSyncMeta();
  const hasSyncedAmount = Object.values(state.rollingForecastDrafts || {}).some((account) => Object.values(account || {}).some((month) => Number.isFinite(Number(month?.hrBudgetAmount))));
  const staleReason = !meta?.reason || meta.reason === "hrBaselineReason";
  if (!hasSyncedAmount || meta?.version !== VERSION || staleReason) applyHrBudgetSync(staleReason ? rfT("hrBaselineReason") : meta.reason, meta?.action || "baseline");
}

function hrBudgetChanges(fromInputs, toInputs) {
  const data = hrBudgetData();
  const definitions = [
    ["headcount", "direct", "直接蓝领", "人"],
    ["headcount", "indirect", "间接蓝领", "人"],
    ["headcount", "whiteCollar", "白领", "人"],
    ["calendar", "workingDays", "工作日", "天"],
    ["calendar", "realHoursPerDay", "每日实际工时", "小时"],
    ["calendar", "paidHoursPerDay", "每日计薪工时", "小时"],
    ["policy", "wageRates", "工资增长率", "%"]
  ];
  const changes = [];
  for (const [section, key, label, unit] of definitions) {
    const beforeValues = fromInputs?.[section]?.[key] || [];
    const afterValues = toInputs?.[section]?.[key] || [];
    const length = Math.max(beforeValues.length, afterValues.length);
    for (let index = 0; index < length; index += 1) {
      const before = Number(beforeValues[index] || 0);
      const after = Number(afterValues[index] || 0);
      if (Math.abs(before - after) < 0.0001) continue;
      const policyStage = data.wageIncreaseStages?.[index]?.label;
      changes.push({
        section,
        key,
        index,
        label,
        period: section === "policy" ? (policyStage || `阶段${index + 1}`) : `${index + 1}月`,
        unit,
        before,
        after
      });
    }
  }
  return changes;
}

function hrBudgetCellState(section, key, index) {
  const standard = Number(defaultHrBudgetInputs()?.[section]?.[key]?.[index] || 0);
  const current = Number(hrBudgetInputs?.[section]?.[key]?.[index] || 0);
  const delta = current - standard;
  return { standard, current, delta, changed: Math.abs(delta) >= 0.0001 };
}

function legacyHrBudgetMonths() {
  const workdays = [21, 21, 20, 21, 20, 21, 22, 21, 21, 22, 21, 22];
  const d = hrBudgetDrivers;
  return workdays.map((days, index) => {
    const attendance = days / Math.max(1, d.workdays);
    const salary = d.headcount * d.salaryBase * attendance / 10000;
    const employerTax = salary * d.employerTaxRate / 100;
    const uniform = d.headcount * 2 * 210 / 12 / 10000 * (index === 6 ? 1.101 : 1);
    const meal = d.headcount * d.mealRate * days / 10000;
    const overtime = d.headcount * (d.salaryBase / 174) * d.overtimeHours * d.overtimeMultiplier / 100 / 10000;
    const social = salary * 0.151;
    const welfare = salary * 0.04;
    return { salary, employerTax, uniform, meal, overtime, social, welfare };
  });
}

function legacyRenderHrBudgetWorkspace() {
  const months = hrBudgetMonths();
  const rows = [
    ["salary", "间接员工工资", "系统", "人力编制 × 月度薪资基数 × 出勤系数"],
    ["employerTax", "雇主税费", "系统", "间接员工工资 × 雇主税费比例"],
    ["uniform", "工作服", "人力/行政", "人数 × 年发放次数 × 单价"],
    ["meal", "餐补", "人力", "人数 × 餐补标准 × 工作日"],
    ["overtime", "加班费", "人力", "人数 × 时薪 × 加班小时 × 倍率"],
    ["social", "社保", "系统", "工资基数 × 社保标准"],
    ["welfare", "福利费", "人力", "工资基数 × 福利标准"]
  ];
  const total = rows.reduce((sum, [key]) => sum + months.reduce((acc, month) => acc + month[key], 0), 0);
  const exceptions = 2;
  els.forecastWorkspace.innerHTML = `
    <div class="hrb-shell">
      <header class="hrb-header">
        <div>
          <div class="hrb-breadcrumb">第二张表 / 月度差异分析 / 预算 / 人力费用</div>
          <h3>人力预算工作台</h3>
          <p>系统按标准自动计算，责任人只需校核参数、异常和调整原因。</p>
        </div>
        <div class="hrb-header-actions">
          <span class="hrb-permission">人力预算责任人 · 仅显示人力科目</span>
          <button type="button" class="ghost-button" data-hr-action="save">保存草稿</button>
          <button type="button" data-hr-action="submit">提交人力预算</button>
        </div>
      </header>
      <nav class="hrb-view-tabs" aria-label="人力预算视图">
        <button type="button" class="${hrBudgetView === "drivers" ? "active" : ""}" data-hr-view="drivers">预算编制</button>
        <button type="button" class="${hrBudgetView === "exceptions" ? "active" : ""}" data-hr-view="exceptions">异常校核 <span>${exceptions}</span></button>
        <button type="button" data-hr-view="audit">审批记录</button>
      </nav>
      ${hrBudgetView === "exceptions" ? hrBudgetExceptionView(rows, months, total) : hrBudgetDriverView(rows, months, total)}
    </div>
  `;
}

function legacyHrBudgetDriverView(rows, months, total) {
  const fields = [
    ["headcount", "间接人员编制（期末）", "人", "系统", "取自组织人事系统"],
    ["workdays", "工作日天数", "天", "系统", "取自当月日历"],
    ["bcShifts", "其中：BC班天数", "天", "系统", "按排班日历统计"],
    ["wcShifts", "其中：WC班天数", "天", "系统", "按排班日历统计"],
    ["salaryBase", "月度薪资基数", "元/人", "可编辑", "含基本工资和岗位津贴"],
    ["employerTaxRate", "雇主税费比例", "%", "可编辑", "含社保、公积金及其他"],
    ["mealRate", "餐补标准", "元/人/天", "可编辑", "出勤日享受"],
    ["uniformCycle", "工作服更换周期", "月", "可编辑", "按月摊销"],
    ["overtimeHours", "加班小时数", "小时/人", "可编辑", "当月人均加班小时"],
    ["overtimeMultiplier", "加班费倍率", "%", "系统", "按公司制度"]
  ];
  return `
    <div class="hrb-layout">
      <section class="hrb-drivers">
        <div class="hrb-section-title"><div><h4>预算驱动（2026年6月）</h4><p>蓝色为系统数据，绿色字段可由人力责任人校核。</p></div><span>10 项参数</span></div>
        <div class="hrb-driver-table">
          ${fields.map(([key, label, unit, source, note]) => `
            <label class="hrb-driver-row">
              <span><b>${label}</b><small>${note}</small></span>
              <span class="hrb-input-wrap"><input type="number" step="0.01" data-hr-driver="${key}" value="${escapeHtml(hrBudgetDrivers[key])}" ${source === "系统" ? "disabled" : ""}/><em>${unit}</em></span>
              <i class="${source === "系统" ? "system" : "editable"}">${source}</i>
            </label>`).join("")}
        </div>
      </section>
      <section class="hrb-results">
        <div class="hrb-section-title"><div><h4>预算结果（按小科目）</h4><p>单位：万元；1-5月为基准，6-12月为预算。</p></div><strong>${formatMoney(total)} 万元</strong></div>
        ${hrBudgetResultTable(rows, months)}
      </section>
    </div>
    ${hrBudgetFormulaPanel(months)}
  `;
}

function legacyHrBudgetResultTable(rows, months) {
  return `<div class="hrb-result-wrap"><table class="hrb-result-table"><thead><tr><th>小科目</th>${Array.from({ length: 12 }, (_, index) => `<th class="${index < 5 ? "actual" : "forecast"}">${index + 1}月</th>`).join("")}<th>全年预算</th><th>校核状态</th></tr></thead><tbody>${rows.map(([key, label]) => {
    const annual = months.reduce((sum, month) => sum + month[key], 0);
    const pending = key === "uniform" || key === "overtime";
    return `<tr><th>${label}</th>${months.map((month, index) => `<td class="${index < 5 ? "actual" : "forecast"}">${formatMoney(month[key])}</td>`).join("")}<td><strong>${formatMoney(annual)}</strong></td><td><span class="hrb-status ${pending ? "pending" : "ok"}">${pending ? "需校核" : "已通过"}</span></td></tr>`;
  }).join("")}</tbody></table></div>`;
}

function legacyHrBudgetFormulaPanel(months) {
  const current = months[5];
  return `<section class="hrb-formula"><div><span>公式追溯 · 当前选择：间接员工工资（6月）</span><strong>${hrBudgetDrivers.headcount} 人 × ${formatMoney(hrBudgetDrivers.salaryBase)} 元/人 × ${hrBudgetDrivers.workdays}/${hrBudgetDrivers.workdays} 天 = ${formatMoney(current.salary)} 万元</strong><small>人数来源：组织人事系统　|　工资基数：人力校核　|　工作日：系统日历</small></div><label><span>差异说明</span><textarea placeholder="仅在调整系统建议时填写原因、依据和影响范围"></textarea></label></section>`;
}

function legacyHrBudgetExceptionView(rows, months, total) {
  return `<div class="hrb-exception-layout"><section class="hrb-exception-main"><div class="hrb-summary-strip"><div><span>人力费用科目</span><strong>7</strong></div><div><span>自动通过</span><strong class="good">5</strong></div><div><span>需人工校核</span><strong class="warn">2</strong></div><div><span>预算总额</span><strong>${formatMoney(total)}</strong><small>万元</small></div></div>${hrBudgetResultTable(rows, months)}<div class="hrb-exception-detail"><div><h4>工作服 · 7月异常</h4><p>系统建议 1.19 万元，责任人调整后 1.31 万元，差异 +10.1%</p></div><div class="hrb-calc-box"><span>系统计算</span><strong>34 人 × 2 次/年 × 210 元/件 = 14,280 元/年</strong><small>人数取自人力编制，单价取自采购标准</small></div><label><span>调整后单价（元/件）</span><input value="232" /></label><label class="grow"><span>调整原因</span><input value="供应商价格上调" /></label></div></section><aside class="hrb-approval"><h4>预算审批进度</h4><ol><li class="done"><b>系统计算</b><span>2026-07-13 09:15</span><small>自动完成标准预算</small></li><li class="current"><b>人力校核</b><span>当前节点</span><small>请核对异常并完善原因</small></li><li><b>财务复核</b><span>待处理</span></li><li><b>预算发布</b><span>待处理</span></li></ol><h4>操作记录</h4><p>10:20　张三调整工作服7月单价</p><p>10:18　张三填写调整原因</p></aside></div>`;
}

function hrBudgetData() {
  return window.HR_BUDGET_REAL_DATA || {
    months: Array.from({ length: 12 }, (_, index) => `${index + 1}月`),
    eurTry: Array(12).fill(1),
    activeHeadcount: Array(12).fill(0),
    workingDays: Array(12).fill(0),
    realHoursPerDay: Array(12).fill(0),
    paidHoursPerDay: Array(12).fill(0),
    accounts: [],
    missingSourceItems: []
  };
}

function formatHrEur(value, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(Number(value || 0));
}

function hrBudgetAnnualTotal(data = hrBudgetData()) {
  return (data.accounts || []).reduce((sum, account) => sum + Number(account.annual || 0), 0);
}

function renderHrBudgetWorkspace() {
  if (state.activeUnit !== "dishwasher") {
    if (unitSnapshots.dishwasher) restoreUnitSnapshot("dishwasher");
    else state.activeUnit = "dishwasher";
    updateUnitChrome("dishwasher");
  }
  const data = hrBudgetData();
  const total = hrBudgetAnnualTotal(data);
  const needsReview = (data.accounts || []).filter((account) => ["overtime", "cashAid", "indemnity"].includes(account.key)).length;
  let content = hrBudgetDriverView(data, total);
  if (hrBudgetView === "exceptions") content = hrBudgetExceptionView(data, total);
  if (hrBudgetView === "audit") content = hrBudgetAuditView(data);
  els.forecastWorkspace.innerHTML = `
    <div class="hrb-shell">
      <header class="hrb-header">
        <div>
          <div class="hrb-breadcrumb">${hrT("breadcrumb")}</div>
          <h3>${hrT("title")}</h3>
          <p>${hrT("subtitle")}</p>
        </div>
        <div class="hrb-header-actions">
          <span class="hrb-permission">${hrT("permission")}</span>
          <button type="button" class="ghost-button" data-hr-action="save">${hrT("saveReview")}</button>
          <button type="button" data-hr-action="submit">${hrT("submitBudget")}</button>
        </div>
      </header>
      <div class="hrb-source-banner">
        <div><b>${hrT("mapping")}</b><span>${escapeHtml(data.sourceOrganization)} → DW ${t("dishwasher")}</span></div>
        <p>${escapeHtml(hrT("mappingNote", { source: data.sourceOrganization }))}</p>
        <span class="hrb-tag source">${hrT("realSource")}</span>
      </div>
      <nav class="hrb-view-tabs" aria-label="人力预算视图">
        <button type="button" class="${hrBudgetView === "drivers" ? "active" : ""}" data-hr-view="drivers">${hrT("baseBudget")}</button>
        <button type="button" class="${hrBudgetView === "exceptions" ? "active" : ""}" data-hr-view="exceptions">${hrT("exceptionReview")} <span>${needsReview}</span></button>
        <button type="button" class="${hrBudgetView === "audit" ? "active" : ""}" data-hr-view="audit">${hrT("approvalRecords")}</button>
      </nav>
      ${content}
    </div>
  `;
}

function hrBudgetInputWorkbench(data) {
  const views = [
    ["headcount", hrT("headcountPlan")],
    ["calendar", hrT("calendarHours")],
    ["policy", hrT("wagePolicy")],
    ["notes", hrT("adjustmentNotes")]
  ];
  let body = hrBudgetHeadcountInputs(data);
  if (hrBudgetInputView === "calendar") body = hrBudgetCalendarInputs(data);
  if (hrBudgetInputView === "policy") body = hrBudgetPolicyInputs(data);
  if (hrBudgetInputView === "notes") body = hrBudgetNotesInput();
  const pendingChanges = hrBudgetChanges(hrBudgetSavedInputs, hrBudgetInputs);
  const standardChanges = hrBudgetChanges(defaultHrBudgetInputs(), hrBudgetInputs);
  return `<section class="hrb-input-workbench">
    <div class="hrb-input-header">
      <div><span>HR INPUT</span><h4>${hrT("inputTitle")}</h4><p>${hrT("inputHint")}</p></div>
      <div class="hrb-input-actions"><span class="hrb-tag editable">${hrT("editable")}</span><button type="button" class="ghost-button" data-hr-input-action="reset">${hrT("resetExcel")}</button><button type="button" data-hr-action="save">${hrT("saveReview")}</button></div>
    </div>
    <div class="hrb-input-tabs">${views.map(([key, label]) => `<button type="button" class="${hrBudgetInputView === key ? "active" : ""}" data-hr-input-view="${key}">${label}</button>`).join("")}</div>
    <div class="hrb-input-body">${body}</div>
    ${hrBudgetChangeGate(pendingChanges, standardChanges)}
  </section>`;
}

function hrBudgetChangeGate(pendingChanges, standardChanges) {
  if (!pendingChanges.length) {
    return `<div class="hrb-change-gate clear"><div><b>${hrT("noUnsaved")}</b><span>${standardChanges.length ? hrT("recordedVariance", { count: standardChanges.length }) : hrT("alignedStandard")}</span></div><span class="hrb-status ok">${hrT("aligned")}</span></div>`;
  }
  const preview = pendingChanges.slice(0, 3).map((item) => `${hrChangePeriod(item)} ${hrChangeLabel(item)} ${formatHrEur(item.before, 2)} → ${formatHrEur(item.after, 2)}`).join(" · ");
  return `<div class="hrb-change-gate pending"><div class="hrb-change-summary"><b>${hrT("pendingChanges", { count: pendingChanges.length })}</b><span>${escapeHtml(preview)}${pendingChanges.length > 3 ? "..." : ""}</span></div><label><span>${hrT("adjustmentReason")} <em>${hrT("required")}</em></span><textarea data-hr-input-notes placeholder="${escapeHtml(hrT("reasonPlaceholder"))}">${escapeHtml(hrBudgetInputs.notes || "")}</textarea></label></div>`;
}

function hrBudgetHeadcountInputs(data) {
  const rows = [
    ["direct", hrT("direct"), "BC Direct"],
    ["indirect", hrT("indirect"), "BC Indirect"],
    ["whiteCollar", hrT("whiteCollar"), "White Collar"]
  ];
  const totals = Array.from({ length: 12 }, (_, index) => rows.reduce((sum, [key]) => sum + Number(hrBudgetInputs.headcount[key]?.[index] || 0), 0));
  return `<div class="hrb-input-table-wrap"><table class="hrb-input-table"><thead><tr><th>${hrT("employeeCategory")}</th>${data.months.map((_, index) => `<th>${escapeHtml(hrMonth(index))}</th>`).join("")}<th>${hrT("annualAverage")}</th></tr></thead><tbody>${rows.map(([key, label, source]) => `<tr><th><b>${label}</b><small>${source}</small></th>${data.months.map((_, index) => {
    const cell = hrBudgetCellState("headcount", key, index);
    return `<td><div class="hrb-input-cell ${cell.changed ? "changed" : ""}"><input type="number" min="0" step="1" data-hr-input="headcount.${key}.${index}" value="${escapeHtml(cell.current)}" /><small>${hrT("standard")} ${formatHrEur(cell.standard)}</small>${cell.changed ? `<em>${cell.delta > 0 ? "+" : ""}${formatHrEur(cell.delta)}</em>` : ""}</div></td>`;
  }).join("")}<td><strong>${formatHrEur((hrBudgetInputs.headcount[key] || []).reduce((sum, value) => sum + Number(value || 0), 0) / 12, 1)}</strong></td></tr>`).join("")}<tr class="hrb-input-total"><th>${hrT("checkedHeadcount")}</th>${totals.map((value) => `<td><strong>${formatHrEur(value)}</strong></td>`).join("")}<td><strong>${formatHrEur(totals.reduce((sum, value) => sum + value, 0) / 12, 1)}</strong></td></tr></tbody></table></div><p class="hrb-input-hint">${hrT("headcountRule")}</p>`;
}

function hrBudgetCalendarInputs(data) {
  const rows = [
    ["workingDays", hrT("workingDays"), hrT("day"), 1],
    ["realHoursPerDay", hrT("realHours"), hrT("hour"), 0.01],
    ["paidHoursPerDay", hrT("paidHours"), hrT("hour"), 0.01]
  ];
  return `<div class="hrb-input-table-wrap"><table class="hrb-input-table"><thead><tr><th>${hrT("calendarHeader")}</th>${data.months.map((_, index) => `<th>${escapeHtml(hrMonth(index))}</th>`).join("")}<th>${hrT("owner")}</th></tr></thead><tbody>${rows.map(([key, label, unit, step]) => `<tr><th><b>${label}</b><small>${unit}</small></th>${data.months.map((_, index) => {
    const cell = hrBudgetCellState("calendar", key, index);
    return `<td><div class="hrb-input-cell ${cell.changed ? "changed" : ""}"><input type="number" min="0" step="${step}" data-hr-input="calendar.${key}.${index}" value="${escapeHtml(cell.current)}" /><small>${hrT("standard")} ${formatHrEur(cell.standard, 2)}</small>${cell.changed ? `<em>${cell.delta > 0 ? "+" : ""}${formatHrEur(cell.delta, 2)}</em>` : ""}</div></td>`;
  }).join("")}<td><span class="hrb-tag editable">${hrT("hrCheck")}</span></td></tr>`).join("")}</tbody></table></div><p class="hrb-input-hint">${hrT("calendarRule")}</p>`;
}

function hrBudgetPolicyInputs(data) {
  const stages = data.wageIncreaseStages || [];
  return `<div class="hrb-policy-grid">${stages.map((stage, index) => {
    const cell = hrBudgetCellState("policy", "wageRates", index);
    return `<label class="${cell.changed ? "changed" : ""}"><span><b>${escapeHtml(stage.label)}</b><small>${hrT("budgetStandard")} ${formatHrEur(cell.standard, 2)}%</small></span><span class="hrb-policy-input"><input type="number" step="0.01" data-hr-input="policy.wageRates.${index}" value="${escapeHtml(cell.current.toFixed(2))}" /><em>%</em></span>${cell.changed ? `<strong class="hrb-policy-delta">${hrT("variance")} ${cell.delta > 0 ? "+" : ""}${formatHrEur(cell.delta, 2)}%</strong>` : ""}</label>`;
  }).join("")}<div class="hrb-policy-rule"><b>${hrT("backendRule")}</b><p>${hrT("backendRuleText")}</p></div></div>`;
}

function hrBudgetNotesInput() {
  return `<label class="hrb-notes-input"><span><b>${hrT("adjustmentNotes")}</b><small>${hrT("notesHint")}</small></span><textarea data-hr-input-notes placeholder="${escapeHtml(hrT("notesPlaceholder"))}">${escapeHtml(hrBudgetInputs.notes || "")}</textarea></label>`;
}

function hrBudgetDriverView(data, total) {
  const reviewIndex = 5;
  const sourceRows = [
    [hrT("budgetYear"), data.budgetYear, hrT("year"), hrT("systemDisplay"), hrT("sourcePeriod")],
    [hrT("sourceOrg"), data.sourceOrganization, "", hrT("systemDisplay"), hrT("mappedToDw")],
    [hrT("employeeRecords"), data.listedEmployees, hrT("people"), hrT("systemDisplay"), hrT("boardRecords")],
    [hrT("sourceCurrency"), data.sourceCurrency, "", hrT("systemDisplay"), hrT("boardCurrency")],
    [hrT("outputCurrency"), data.outputCurrency, "", hrT("systemDisplay"), hrT("managementCurrency")]
  ];
  const reviewRows = [
    [hrT("juneHeadcount"), data.activeHeadcount?.[reviewIndex], hrT("people"), hrT("needsCheck"), hrT("activeSummary")],
    [hrT("juneWorkday"), data.workingDays?.[reviewIndex], hrT("day"), hrT("needsCheck"), hrT("tdWorkday")],
    [hrT("dailyReal"), Number(data.realHoursPerDay?.[reviewIndex] || 0).toFixed(2), hrT("hour"), hrT("needsCheck"), "Parameters · Real"],
    [hrT("dailyPaid"), Number(data.paidHoursPerDay?.[reviewIndex] || 0).toFixed(2), hrT("hour"), hrT("needsCheck"), "Parameters · Paid"],
    [hrT("juneFx"), Number(data.eurTry?.[reviewIndex] || 0).toFixed(4), "", hrT("financeParameter"), hrT("fxFormula")]
  ];
  return `
    ${hrBudgetInputWorkbench(data)}
    <div class="hrb-layout hrb-real-layout">
      <section class="hrb-drivers">
        <div class="hrb-section-title"><div><h4>${hrT("baseResponsibility")}</h4><p>${hrT("baseResponsibilityHint")}</p></div><span>${hrT("excelBuiltIn")}</span></div>
        ${hrBudgetDataGroup(hrT("displayOnly"), sourceRows, "source")}
        ${hrBudgetDataGroup(hrT("monthlyReview"), reviewRows, "review")}
        <div class="hrb-data-group">
          <div class="hrb-data-group-title"><b>${hrT("ownerMustFill")}</b><span class="hrb-tag editable">${hrT("hrFill")}</span></div>
          <div class="hrb-responsibility-list">
            <p><b>${hrT("personnelChange")}</b><span>${hrT("personnelChangeText")}</span></p>
            <p><b>${hrT("salaryPolicy")}</b><span>${hrT("salaryPolicyText")}</span></p>
            <p><b>${hrT("adjustmentNotes")}</b><span>${hrT("adjustmentRule")}</span></p>
          </div>
        </div>
        <div class="hrb-data-group backend">
          <div class="hrb-data-group-title"><b>${hrT("backendCalc")}</b><span class="hrb-tag system">${hrT("systemCalc")}</span></div>
          <p>${hrT("backendCalcText")}</p>
        </div>
      </section>
      <section class="hrb-results">
        <div class="hrb-section-title"><div><h4>${hrT("resultTitle")}</h4><p>${hrT("resultHint")}</p></div><strong>€ ${formatHrEur(total)}</strong></div>
        ${hrBudgetResultTable(data)}
      </section>
    </div>
    ${hrBudgetFormulaPanel(data)}
    ${hrBudgetMissingSourcePanel(data)}
  `;
}

function hrBudgetDataGroup(title, rows, tone) {
  return `<div class="hrb-data-group"><div class="hrb-data-group-title"><b>${title}</b><span class="hrb-tag ${tone}">${tone === "source" ? hrT("sourceData") : hrT("pendingReview")}</span></div><div class="hrb-driver-table">${rows.map(([label, value, unit, source, note]) => `
    <div class="hrb-driver-row">
      <span><b>${escapeHtml(label)}</b><small>${escapeHtml(note)}</small></span>
      <span class="hrb-static-value"><strong>${escapeHtml(value)}</strong><em>${escapeHtml(unit)}</em></span>
      <i class="${tone === "source" ? "system" : "editable"}">${escapeHtml(source)}</i>
    </div>`).join("")}</div></div>`;
}

function hrBudgetResultTable(data) {
  const accounts = data.accounts || [];
  const totalMonths = Array.from({ length: 12 }, (_, index) => accounts.reduce((sum, account) => sum + Number(account.monthly?.[index] || 0), 0));
  return `<div class="hrb-result-wrap"><table class="hrb-result-table"><thead><tr><th>${hrT("account")}</th>${(data.months || []).map((_, index) => `<th class="budget">${escapeHtml(hrMonth(index))}</th>`).join("")}<th>${hrT("annualBudget")}</th><th>${hrT("dataStatus")}</th></tr></thead><tbody>${accounts.map((account) => {
    const pending = ["overtime", "cashAid", "indemnity"].includes(account.key);
    return `<tr><th><span>${escapeHtml(hrAccountLabel(account))}</span><small>${escapeHtml(account.sourceLabel)}</small></th>${account.monthly.map((value) => `<td>${value < 0 ? "-" : ""}€${formatHrEur(Math.abs(value))}</td>`).join("")}<td><strong>${account.annual < 0 ? "-" : ""}€${formatHrEur(Math.abs(account.annual))}</strong></td><td><span class="hrb-status ${pending ? "pending" : "ok"}">${pending ? hrT("needsCheck") : hrT("sourceCalculated")}</span></td></tr>`;
  }).join("")}<tr class="hrb-total-row"><th>${hrT("totalHrCost")}</th>${totalMonths.map((value) => `<td><strong>€${formatHrEur(value)}</strong></td>`).join("")}<td><strong>€${formatHrEur(totalMonths.reduce((sum, value) => sum + value, 0))}</strong></td><td><span class="hrb-status ok">${hrT("converted")}</span></td></tr></tbody></table></div>`;
}

function hrBudgetFormulaPanel(data) {
  const wage = (data.accounts || []).find((account) => account.key === "wages");
  const monthIndex = 5;
  const eur = Number(wage?.monthly?.[monthIndex] || 0);
  const fx = Number(data.eurTry?.[monthIndex] || 1);
  const sourceTry = eur * fx;
  return `<section class="hrb-formula"><div><span>${hrT("formulaTrace")}</span><strong>${formatHrEur(sourceTry, 2)} TRY ÷ ${fx.toFixed(4)} EUR/TRY = €${formatHrEur(eur, 2)}</strong><small>${hrT("formulaPath")}</small></div><label><span>${hrT("reviewNote")}</span><textarea placeholder="${escapeHtml(hrT("reviewPlaceholder"))}"></textarea></label></section>`;
}

function hrBudgetMissingSourcePanel(data) {
  const items = data.missingSourceItems || [];
  const localized = items.map((item) => item.label === "工作服"
    ? { label: hrT("workwear"), owner: hrT("adminProcurement"), status: hrT("noIndependentStandard"), action: hrT("workwearAction") }
    : { label: hrT("mealUnit"), owner: hrT("hr"), status: hrT("cashAidIncluded"), action: hrT("mealAction") });
  return `<section class="hrb-source-gaps"><div class="hrb-section-title"><div><h4>${hrT("missingSource")}</h4><p>${hrT("missingSourceHint")}</p></div><span>${items.length} ${hrT("items")}</span></div><div class="hrb-gap-list">${localized.map((item) => `<div><b>${escapeHtml(item.label)}</b><span>${escapeHtml(item.status)}</span><em>${escapeHtml(item.owner)}</em><p>${escapeHtml(item.action)}</p></div>`).join("")}</div></section>`;
}

function hrBudgetExceptionView(data, total) {
  const pending = (data.accounts || []).filter((account) => ["overtime", "cashAid", "indemnity"].includes(account.key));
  const accountNames = pending.map(hrAccountLabel).join(state.language === "zh" ? "、" : ", ");
  return `<div class="hrb-exception-layout"><section class="hrb-exception-main"><div class="hrb-summary-strip"><div><span>${hrT("hrAccounts")}</span><strong>${data.accounts.length}</strong></div><div><span>${hrT("sourceCalculated")}</span><strong class="good">${data.accounts.length - pending.length}</strong></div><div><span>${hrT("manualReview")}</span><strong class="warn">${pending.length}</strong></div><div><span>${hrT("annualBudget")}</span><strong>€${formatHrEur(total)}</strong><small>EUR</small></div></div>${hrBudgetResultTable(data)}<div class="hrb-exception-detail"><div><h4>${hrT("currentReview")}</h4><p>${escapeHtml(hrT("exceptionText", { accounts: accountNames }))}</p></div><div class="hrb-calc-box"><span>${hrT("reviewPrinciple")}</span><strong>${hrT("reviewPrincipleText")}</strong><small>${hrT("reviewPrincipleHint")}</small></div><label class="grow"><span>${hrT("reviewOpinion")}</span><input placeholder="${escapeHtml(hrT("reviewOpinionPlaceholder"))}" /></label></div></section><aside class="hrb-approval"><h4>${hrT("approvalProgress")}</h4><ol><li class="done"><b>${hrT("excelLoaded")}</b><span>${hrT("completed")}</span><small>${hrT("tdMapped")}</small></li><li class="current"><b>${hrT("hrReview")}</b><span>${hrT("currentNode")}</span><small>${hrT("hrReviewHint")}</small></li><li><b>${hrT("costReview")}</b><span>${hrT("pending")}</span></li><li><b>${hrT("budgetPublish")}</b><span>${hrT("pending")}</span></li></ol><h4>${hrT("basisNote")}</h4><p>${hrT("sourceCurrency")}: TRY</p><p>${hrT("outputCurrency")}: EUR</p><p>${hrT("monthlyFx")}</p></aside></div>`;
}

function hrBudgetAuditView(data) {
  const records = hrBudgetAudit.flatMap((record) => (record.changes || []).map((change, index) => ({ ...change, record, first: index === 0 })));
  const locale = state.language === "tr" ? "tr-TR" : state.language === "en" ? "en-US" : "zh-CN";
  return `<div class="hrb-audit-view"><section><div class="hrb-audit-heading"><div><h4>${hrT("adjustmentRecords")}</h4><p>${hrT("adjustmentRecordsHint")}</p></div><strong>${records.length} ${hrT("items")}</strong></div><div class="hrb-audit-table-wrap"><table><thead><tr><th>${hrT("timeOwner")}</th><th>${hrT("adjustmentItem")}</th><th>${hrT("period")}</th><th>${hrT("before")}</th><th>${hrT("after")}</th><th>${hrT("adjustmentReason")}</th><th>${hrT("operation")}</th></tr></thead><tbody>${records.map((item) => `<tr><td>${item.first ? `<b>${escapeHtml(new Date(item.record.timestamp).toLocaleString(locale, { hour12: false }))}</b><small>${escapeHtml(item.record.actor)}</small>` : ""}</td><td>${escapeHtml(hrChangeLabel(item))}</td><td>${escapeHtml(hrChangePeriod(item, data))}</td><td>${formatHrEur(item.before, 2)} ${escapeHtml(hrUnitLabel(item.unit))}</td><td><strong>${formatHrEur(item.after, 2)} ${escapeHtml(hrUnitLabel(item.unit))}</strong></td><td>${item.first ? escapeHtml(item.record.reason) : `<span class="hrb-audit-same">${hrT("sameAsAbove")}</span>`}</td><td>${item.first ? escapeHtml(item.record.action === "提交人力预算" ? hrT("submitAction") : hrT("saveAction")) : ""}</td></tr>`).join("") || `<tr><td colspan="7" class="hrb-audit-empty">${hrT("noRecords")}</td></tr>`}</tbody></table></div></section><section><h4>${hrT("systemRecords")}</h4><table><thead><tr><th>${hrT("period")}</th><th>${hrT("node")}</th><th>${hrT("operation")}</th><th>${hrT("dataBasis")}</th><th>${hrT("status")}</th></tr></thead><tbody><tr><td>2026-07-13</td><td>${hrT("dataPreparation")}</td><td>${hrT("load")} ${escapeHtml(data.sourceFile)}</td><td>TRY → EUR</td><td><span class="hrb-status ok">${hrT("completed")}</span></td></tr><tr><td>2026-07-13</td><td>${hrT("businessMapping")}</td><td>${escapeHtml(hrT("assumedMapped", { source: data.sourceOrganization }))}</td><td>${hrT("testVersion")}</td><td><span class="hrb-status pending">${hrT("pendingConfirm")}</span></td></tr></tbody></table></section></div>`;
}

function refreshProductNavigation() {
  const labels = { dashboard: t("tabDashboard"), variance: t("tabVariance"), projects: t("tabProjects") };
  for (const tab of document.querySelectorAll(".tab[data-tab]")) {
    if (labels[tab.dataset.tab]) tab.textContent = labels[tab.dataset.tab];
  }
}

function initializeDemoRoleAccess() {
  const savedRole = sessionStorage.getItem("dwDemoRole");
  for (const option of Array.from(els.roleSelect?.options || [])) {
    if (!['finance', 'hr', 'admin'].includes(option.value)) option.remove();
  }
  if (["finance", "hr", "admin"].includes(savedRole)) {
    applyDemoRole(savedRole, true);
  } else {
    els.roleLogin?.classList.remove("hidden");
  }
}

function applyDemoRole(role, closeLogin = true) {
  const normalizedRole = ["hr", "admin"].includes(role) ? role : "finance";
  state.rollingRole = normalizedRole;
  localStorage.setItem("dwRollingRole.v1", normalizedRole);
  sessionStorage.setItem("dwDemoRole", normalizedRole);
  if (els.roleSelect) els.roleSelect.value = normalizedRole;
  document.body.classList.toggle("demo-role-hr", normalizedRole === "hr");
  document.body.classList.toggle("demo-role-admin", normalizedRole === "admin");
  document.body.classList.toggle("demo-role-cost", normalizedRole === "finance");
  state.rollingSelectedCode = null;
  if (closeLogin) els.roleLogin?.classList.add("hidden");
  if (["hr", "admin"].includes(normalizedRole)) {
    if (state.activeUnit !== "dishwasher") switchBusinessUnit("dishwasher");
    setSidebarCollapsed(true);
    state.rollingViewMode = "fill";
    switchTab("variance");
  } else {
    setSidebarCollapsed(false);
    switchTab("dashboard");
  }
  renderAll();
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
  const taskLabel = item.hasHrBudget
    ? rfT("hrBudgetSource")
    : item.warningCount
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

function rfHrBudgetSourcePanel(item) {
  if (!item.hasHrBudget) return "";
  const source = item.months.find((month) => month.hasHrBudget)?.draft;
  if (!source) return "";
  const locale = state.language === "tr" ? "tr-TR" : state.language === "en" ? "en-US" : "zh-CN";
  const time = source.hrBudgetUpdatedAt
    ? new Date(source.hrBudgetUpdatedAt).toLocaleString(locale, { hour12: false })
    : "--";
  const labels = source.hrBudgetLabels.length ? source.hrBudgetLabels.join(" + ") : "For Finance";
  return `<section class="rf-hr-source">
    <div><span>${escapeHtml(rfT("hrBudgetSynced"))}</span><strong>${escapeHtml(labels)}</strong><small>${escapeHtml(rfT("hrBudgetSyncHint", { time, owner: source.hrBudgetOwner || t("hrRole") }))}</small></div>
    <div><span>${escapeHtml(rfT("hrAdjustmentReason"))}</span><strong>${escapeHtml(source.hrBudgetReason || rfT("hrBaselineReason"))}</strong><small>${escapeHtml(rfT("hrFormulaPending"))}</small></div>
  </section>`;
}

function rfEditor(item) {
  const row = item.row;
  const accountLabel = localizeAccountLabel(row.code, row.descEn, state.language);
  const totalOnly = item.totalOnly;
  const showVariance = state.rollingViewMode === "variance";
  const ownerSummary = item.hasHrBudget ? rfT("hrBudgetSource") : item.ownerMissing ? rfT("ownerNeeded") : totalOnly ? rfT("byTotal") : rfT("byFormula");
  return `
    <div class="rf-editor-head">
      <div>
        <span>${escapeHtml(rfT("selectedAccount"))}</span>
        <h3>${escapeHtml(row.code)} · ${escapeHtml(accountLabel)}</h3>
        <p>${escapeHtml(localizeCategory(row.category, state.language))} · ${escapeHtml(rfT("forecastLogic"))}: ${escapeHtml(forecastLogicForRow(row))}</p>
      </div>
      <div class="rf-status-stack">
        <span class="rf-chip ${item.submitted || item.hasHrBudget ? "ok" : item.hasDraft ? "draft" : ""}">${escapeHtml(item.submitted ? rfT("submitted") : item.hasHrBudget ? rfT("hrBudgetSource") : item.hasDraft ? rfT("draft") : rfT("usesForecast"))}</span>
        <span class="rf-chip ${item.ownerMissing ? "muted" : "ok"}">${escapeHtml(ownerSummary)}</span>
      </div>
    </div>
    ${rfHrBudgetSourcePanel(item)}
    <div class="rf-formula-note">${escapeHtml(totalOnly ? rfT("totalModeHint") : rfT("formulaHint"))}</div>
    <div class="rf-matrix-wrap">
      <table class="rf-matrix ${totalOnly ? "rf-total-mode" : ""} ${showVariance ? "rf-variance-mode" : ""}">
        <thead>
          ${totalOnly ? rfTotalModeHeader(showVariance) : rfUnitQtyHeader(showVariance)}
        </thead>
        <tbody>
          ${ROLLING_FORECAST_MONTHS.map((month) => rfMonthRow(row, month, totalOnly, showVariance)).join("")}
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
        <button type="button" class="ghost-button" data-rf-action="save-current" ${rollingCanSave() ? "" : "disabled"}>${escapeHtml(rfT("saveCurrent"))}</button>
        <button type="button" data-rf-action="submit-current" ${rollingCanSubmit() ? "" : "disabled"}>${escapeHtml(rfT("submitCurrent"))}</button>
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

function rfMonthRow(row, month, totalOnly = isRollingTotalOnlyRow(row), showVariance = state.rollingViewMode === "variance") {
  const code = row.code;
  const draft = rollingMonthDraft(code, month);
  const base = forecastAmountForAccount(code, month);
  const totalInfo = rollingTotalInfo(code, month);
  const warning = rollingWarningInfo(code, month);
  const variance = showVariance ? rollingVarianceInfo(code, month) : null;
  const totalClass = `${warning.level === "severe" ? "severe" : warning.level === "warn" ? "warn" : ""} ${totalInfo.sourceType === "hr" ? "hr-source" : ""}`.trim();
  if (totalOnly) {
    const detailLabel = draft.detailName ? rfT("replaceDetail") : rfT("uploadDetail");
    return `
      <tr>
        <td>${escapeHtml(localizeMonthLabel(month - 1, state.language))}</td>
        <td>${formatMoney(base)}</td>
        <td class="rf-detail-cell">
          <label class="rf-detail-upload ${rollingCanEditField("detailName", row) ? "" : "disabled"}">
            <input type="file" data-rf-field="detailName" data-rf-code="${escapeHtml(code)}" data-rf-month="${month}" ${rollingInputDisabledAttr("detailName", row)} />
            <span>${escapeHtml(detailLabel)}</span>
          </label>
          <small>${escapeHtml(draft.detailName || rfT("detailRequired"))}</small>
        </td>
        <td><input inputmode="decimal" data-rf-field="totalAmount" data-rf-code="${escapeHtml(code)}" data-rf-month="${month}" value="${escapeHtml(draft.totalAmount)}" placeholder="--" ${rollingInputDisabledAttr("totalAmount", row)} /></td>
        <td><input data-rf-field="totalOwner" data-rf-code="${escapeHtml(code)}" data-rf-month="${month}" value="${escapeHtml(draft.totalOwner)}" placeholder="${escapeHtml(rfT("ownerNeeded"))}" ${rollingInputDisabledAttr("totalOwner", row)} /></td>
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
      <td><input inputmode="decimal" data-rf-field="unitPrice" data-rf-code="${escapeHtml(code)}" data-rf-month="${month}" value="${escapeHtml(draft.unitPrice)}" placeholder="--" ${rollingInputDisabledAttr("unitPrice", row)} /></td>
      <td><input data-rf-field="priceOwner" data-rf-code="${escapeHtml(code)}" data-rf-month="${month}" value="${escapeHtml(draft.priceOwner)}" placeholder="${escapeHtml(rfT("ownerNeeded"))}" ${rollingInputDisabledAttr("priceOwner", row)} /></td>
      <td><input inputmode="decimal" data-rf-field="quantity" data-rf-code="${escapeHtml(code)}" data-rf-month="${month}" value="${escapeHtml(draft.quantity)}" placeholder="--" ${rollingInputDisabledAttr("quantity", row)} /></td>
      <td><input data-rf-field="quantityOwner" data-rf-code="${escapeHtml(code)}" data-rf-month="${month}" value="${escapeHtml(draft.quantityOwner)}" placeholder="${escapeHtml(rfT("ownerNeeded"))}" ${rollingInputDisabledAttr("quantityOwner", row)} /></td>
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
          <textarea data-rf-analysis-key="${escapeHtml(key)}" data-rf-analysis-mode="yoy" placeholder="${escapeHtml(rfT("reasonPlaceholder"))}" ${rollingCanEditReasons() ? "" : "disabled"}>${escapeHtml(yoyAnalysis)}</textarea>
        </label>
        <label>
          <span>${escapeHtml(rfT("momReason"))}</span>
          <textarea data-rf-analysis-key="${escapeHtml(key)}" data-rf-analysis-mode="mom" placeholder="${escapeHtml(rfT("reasonPlaceholder"))}" ${rollingCanEditReasons() ? "" : "disabled"}>${escapeHtml(momAnalysis)}</textarea>
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
    const hasHrBudget = Number.isFinite(draft.hrBudgetAmount);
    const hasAdminBudget = Number.isFinite(draft.adminBudgetAmount);
    const hasCompletedBudget = hasHrBudget || hasAdminBudget;
    const hasOwner = totalOnly
      ? String(draft.totalOwner || "").trim()
      : String(draft.priceOwner || "").trim() || String(draft.quantityOwner || "").trim();
    const hasDetail = String(draft.detailName || "").trim() !== "";
    return {
      month,
      draft,
      hasHrBudget,
      hasAdminBudget,
      hasCompletedBudget,
      hasDraft: (totalOnly ? hasTotal || hasOwner || hasDetail : hasUnit || hasQty || hasOwner) || hasCompletedBudget,
      hasFormula: (totalOnly ? hasTotal : hasUnit && hasQty) || hasCompletedBudget,
      ownerMissing: hasCompletedBudget ? !(String(draft.hrBudgetOwner || draft.adminBudgetOwner || "").trim()) : totalOnly
        ? !String(draft.totalOwner || "").trim()
        : !String(draft.priceOwner || "").trim() || !String(draft.quantityOwner || "").trim(),
      warning: rollingWarningInfo(row.code, month)
    };
  });
  const warningCount = months.filter((item) => item.warning.level).length;
  const ownerMissingCount = months.filter((item) => item.ownerMissing).length;
  const formulaCount = months.filter((item) => item.hasFormula).length;
  const hasDraft = months.some((item) => item.hasDraft);
  const hasHrBudget = months.some((item) => item.hasHrBudget);
  const hasAdminBudget = months.some((item) => item.hasAdminBudget);
  return {
    row,
    totalOnly,
    months,
    hasDraft,
    hasHrBudget,
    hasAdminBudget,
    hasCompletedBudget: hasHrBudget || hasAdminBudget,
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
    detailName: String(monthDraft.detailName || ""),
    hrBudgetAmount: Number.isFinite(Number(monthDraft.hrBudgetAmount)) ? Number(monthDraft.hrBudgetAmount) : null,
    hrBudgetOwner: String(monthDraft.hrBudgetOwner || ""),
    hrBudgetUpdatedAt: String(monthDraft.hrBudgetUpdatedAt || ""),
    hrBudgetReason: String(monthDraft.hrBudgetReason || ""),
    hrBudgetKeys: Array.isArray(monthDraft.hrBudgetKeys) ? [...monthDraft.hrBudgetKeys] : [],
    hrBudgetLabels: Array.isArray(monthDraft.hrBudgetLabels) ? [...monthDraft.hrBudgetLabels] : []
    ,adminBudgetAmount: Number.isFinite(Number(monthDraft.adminBudgetAmount)) ? Number(monthDraft.adminBudgetAmount) : null,
    adminBudgetOwner: String(monthDraft.adminBudgetOwner || ""),
    adminBudgetUpdatedAt: String(monthDraft.adminBudgetUpdatedAt || ""),
    adminBudgetReason: String(monthDraft.adminBudgetReason || ""),
    adminBudgetCategoryIds: Array.isArray(monthDraft.adminBudgetCategoryIds) ? [...monthDraft.adminBudgetCategoryIds] : [],
    adminBudgetLabels: Array.isArray(monthDraft.adminBudgetLabels) ? [...monthDraft.adminBudgetLabels] : []
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
  const completed = completedBudgetInfo(draft);
  if (isRollingTotalOnlyCode(code)) {
    const total = parseOptionalNumber(draft.totalAmount);
    if (Number.isFinite(total)) return { total, source: rfT("byTotal") };
    if (completed) return completed;
    return { total: forecastAmountForAccount(code, month), source: rfT("usesForecast") };
  }
  const unit = parseOptionalNumber(draft.unitPrice);
  const qty = parseOptionalNumber(draft.quantity);
  if (Number.isFinite(unit) && Number.isFinite(qty)) {
    return { total: unit * qty, source: rfT("byFormula") };
  }
  if (completed) return completed;
  return { total: forecastAmountForAccount(code, month), source: rfT("usesForecast") };
}

function completedBudgetInfo(draft) {
  const hr = Number.isFinite(draft.hrBudgetAmount) ? Number(draft.hrBudgetAmount) : null;
  const admin = Number.isFinite(draft.adminBudgetAmount) ? Number(draft.adminBudgetAmount) : null;
  if (hr === null && admin === null) return null;
  const total = Number(hr || 0) + Number(admin || 0);
  const source = hr !== null && admin !== null ? rfCompactT("combinedBudget") : hr !== null ? rfCompactT("hrBudget") : rfCompactT("adminBudget");
  return { total, source, sourceType: hr !== null && admin !== null ? "combined" : hr !== null ? "hr" : "admin" };
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

function rollingRoleLabel() {
  return ROLLING_ROLE_LABELS[state.rollingRole] || ROLLING_ROLE_LABELS.finance;
}

function rollingRoleScope() {
  return ROLLING_ROLE_SCOPE[state.rollingRole] || ROLLING_ROLE_SCOPE.finance;
}

function rollingRoleCanView(row) {
  const role = state.rollingRole || "finance";
  if (role === "finance" || role === "leader" || role === "readonly") return true;
  const scopes = rollingRowScopes(row);
  if (role === "hr") return scopes.has("hr");
  if (role === "admin") return scopes.has("admin");
  if (role === "procurement") return scopes.has("procurement");
  return true;
}

function rollingCanEditField(field, row) {
  const role = state.rollingRole || "finance";
  if (role === "finance") return true;
  if (role === "readonly" || role === "leader") return false;
  const scopes = rollingRowScopes(row);
  if (role === "hr") {
    return scopes.has("hr") && ["quantity", "quantityOwner"].includes(field);
  }
  if (role === "admin") return false;
  if (role === "procurement") {
    return scopes.has("procurement") && ["unitPrice", "priceOwner", "totalAmount", "totalOwner", "detailName"].includes(field);
  }
  return false;
}

function rollingCanEditReasons() {
  return state.rollingRole !== "readonly";
}

function rollingCanSave() {
  return state.rollingRole !== "readonly";
}

function rollingCanSubmit() {
  return ["finance", "hr", "admin", "procurement"].includes(state.rollingRole);
}

function rollingInputDisabledAttr(field, row) {
  return rollingCanEditField(field, row) ? "" : `disabled title="${escapeHtml(rollingRoleScope())}"`;
}

function rollingRowScopes(row) {
  const text = rollingRowText(row);
  const scopes = new Set();
  if (/\b(labou?r|salary|wage|overtime|headcount|people|direct|indirect)\b/.test(text)
    || /人工|工资|加班|人数|人力|蓝领|白领|员工|工时/.test(text)) {
    scopes.add("hr");
  }
  if (/\b(uniform|transport|repair|maint|material|tool|spare|purchase|purchasing|consumable|utility|utilities|energy|service|office|admin|travel|training|work\s*clothes)\b/.test(text)
    || /工作服|工装|班车|维修|维护|备件|采购|物料|耗材|能源|水电|服务|办公|行政|差旅|培训/.test(text)) {
    scopes.add("procurement");
    scopes.add("admin");
  }
  if (text.includes("uniform") || text.includes("transport") || /工作服|工装|班车/.test(text)) {
    scopes.add("hr");
    scopes.add("procurement");
    scopes.add("admin");
  }
  if (!scopes.size) {
    scopes.add("procurement");
    scopes.add("admin");
  }
  return scopes;
}

function rollingRowText(row) {
  return [
    row?.code,
    row?.category,
    row?.descEn,
    row?.descCn,
    localizeAccountLabel(row?.code, row?.descEn, "zh")
  ].filter(Boolean).join(" ").toLowerCase();
}

async function handleRollingForecastClick(event) {
  const adminView = event.target.closest("[data-admin-view]")?.dataset.adminView;
  if (adminView) {
    state.adminBudgetView = ["conditions", "results", "audit"].includes(adminView) ? adminView : "conditions";
    renderAdminBudgetWorkspace();
    return;
  }
  const adminSelect = event.target.closest("[data-admin-select]")?.dataset.adminSelect;
  if (adminSelect && !event.target.closest("input, textarea")) {
    state.adminSelectedCategory = adminSelect;
    renderAdminBudgetWorkspace();
    return;
  }
  const adminResult = event.target.closest("[data-admin-result]")?.dataset.adminResult;
  if (adminResult) {
    state.adminSelectedAccount = adminResult;
    renderAdminBudgetWorkspace();
    return;
  }
  const adminAction = event.target.closest("[data-admin-action]")?.dataset.adminAction;
  if (adminAction) {
    const changes = adminBudgetChanges();
    const missingReason = changes.find(({ category }) => !String(adminBudgetInputs.reasons?.[category.id] || "").trim());
    if (missingReason) {
      state.adminSelectedCategory = missingReason.category.id;
      state.adminBudgetView = "conditions";
      toast(adminT("reasonRequired"), true);
      renderAdminBudgetWorkspace();
      return;
    }
    const timestamp = new Date().toISOString();
    const actor = els.userName?.value.trim() || adminT("permission");
    for (const change of changes) {
      adminBudgetAudit.unshift({ id: `admin-${Date.now()}-${change.category.id}-${change.index}`, timestamp, actor, label: change.category.label, period: localizeMonthLabel(change.index, state.language), before: change.before, after: change.after, reason: adminBudgetInputs.reasons[change.category.id], action: adminAction === "submit" ? adminT("submit") : adminT("save") });
    }
    adminBudgetAudit = adminBudgetAudit.slice(0, 200);
    saveAdminBudgetState();
    adminBudgetSavedInputs = clonePlain(adminBudgetInputs);
    applyAdminBudgetSync(changes.map((item) => adminBudgetInputs.reasons[item.category.id]).filter(Boolean).join("; ") || "Excel baseline", adminAction);
    await saveRollingForecastDrafts();
    if (adminAction === "submit") state.adminBudgetView = "audit";
    toast(adminAction === "submit" ? adminT("submitted") : adminT("responsibilitySaved"));
    renderAdminBudgetWorkspace();
    return;
  }
  const inputView = event.target.closest("[data-hr-input-view]")?.dataset.hrInputView;
  if (inputView) {
    hrBudgetInputView = inputView;
    renderHrBudgetWorkspace();
    return;
  }
  const inputAction = event.target.closest("[data-hr-input-action]")?.dataset.hrInputAction;
  if (inputAction === "reset") {
    const reason = hrBudgetInputs.notes || "";
    hrBudgetInputs = defaultHrBudgetInputs();
    hrBudgetInputs.notes = reason;
    toast(hrT("restoredDraft"));
    renderHrBudgetWorkspace();
    return;
  }
  const hrView = event.target.closest("[data-hr-view]");
  if (hrView) {
    const requestedView = hrView.dataset.hrView;
    hrBudgetView = ["drivers", "exceptions", "audit"].includes(requestedView) ? requestedView : "drivers";
    renderHrBudgetWorkspace();
    return;
  }
  const hrAction = event.target.closest("[data-hr-action]")?.dataset.hrAction;
  if (hrAction) {
    const changes = hrBudgetChanges(hrBudgetSavedInputs, hrBudgetInputs);
    const reason = String(hrBudgetInputs.notes || "").trim();
    if (changes.length && !reason) {
      toast(hrT("reasonRequired"), true);
      renderHrBudgetWorkspace();
      return;
    }
    if (changes.length) {
      hrBudgetAudit.unshift({
        id: `hr-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: els.userName?.value.trim() || t("hrRole"),
        reason,
        action: hrAction === "submit" ? "提交人力预算" : "保存校核",
        changes
      });
      hrBudgetAudit = hrBudgetAudit.slice(0, 100);
      saveHrBudgetAudit();
      hrBudgetInputs.notes = "";
      saveHrBudgetInputs();
      hrBudgetSavedInputs = cloneHrBudgetInputs(hrBudgetInputs);
    }
    saveHrBudgetInputs();
    applyHrBudgetSync(reason || rfT("hrBaselineReason"), hrAction);
    await saveRollingForecastDrafts();
    toast(hrAction === "submit" ? hrT("submittedTrace") : (changes.length ? hrT("savedTrace", { count: changes.length }) : hrT("noPendingSave")));
    if (hrAction === "submit") hrBudgetView = "exceptions";
    renderHrBudgetWorkspace();
    return;
  }
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
  const anchorButton = event.target.closest("[data-rf-anchor]");
  if (anchorButton) {
    els.forecastWorkspace?.querySelector(`[data-rf-group="${anchorButton.dataset.rfAnchor}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const selectButton = event.target.closest("[data-rf-select]");
  if (selectButton) {
    state.rollingSelectedCode = state.rollingSelectedCode === selectButton.dataset.rfSelect ? null : selectButton.dataset.rfSelect;
    renderTable();
    return;
  }
  const action = event.target.closest("[data-rf-action]")?.dataset.rfAction;
  if (!action) return;
  if ((action.includes("save") && !rollingCanSave()) || (action.includes("submit") && !rollingCanSubmit())) {
    toast(rollingRoleScope(), true);
    return;
  }
  if (action === "save-all") {
    await saveRollingForecastDrafts();
    toast(rfT("saved"));
    return;
  }
  if (action === "save-current") {
    await saveRollingForecastDrafts();
    toast(rfT("currentSaved"));
    return;
  }
  if (action === "submit-current") {
    if (state.rollingSelectedCode) state.rollingForecastSubmitted[state.rollingSelectedCode] = new Date().toISOString();
    state.rollingViewMode = "variance";
    await saveRollingForecastDrafts();
    toast(rfT("currentSubmitted"));
    renderTable();
    return;
  }
  if (action === "submit-all") {
    for (const row of visibleRows().filter(rollingRoleCanView)) {
      if (row.code) state.rollingForecastSubmitted[row.code] = new Date().toISOString();
    }
    state.rollingViewMode = "variance";
    await saveRollingForecastDrafts();
    toast(rfT("submittedToast"));
    renderTable();
  }
}

function handleRollingForecastInput(event) {
  const adminOwner = event.target.closest("[data-admin-owner]");
  if (adminOwner) {
    const [categoryId, driverKey] = adminOwner.dataset.adminOwner.split(".");
    adminBudgetInputs.owners[categoryId] = { ...(adminBudgetInputs.owners[categoryId] || {}), [driverKey]: adminOwner.value };
    return;
  }
  const adminMonth = event.target.closest("[data-admin-month]");
  if (adminMonth) {
    const [categoryId, indexText] = adminMonth.dataset.adminMonth.split(".");
    const keur = parseOptionalNumber(adminMonth.value);
    const index = Number(indexText);
    if (Number.isFinite(keur) && Number.isInteger(index)) {
      adminBudgetInputs.months[categoryId][index] = keur * ADMIN_BUDGET_DATA.eurTry * 1000;
      if (event.type === "change") renderAdminBudgetWorkspace();
    }
    return;
  }
  const adminReason = event.target.closest("[data-admin-reason]");
  if (adminReason) {
    adminBudgetInputs.reasons[adminReason.dataset.adminReason] = adminReason.value;
    return;
  }
  const hrInput = event.target.closest("[data-hr-input]");
  if (hrInput) {
    const [section, key, indexText] = hrInput.dataset.hrInput.split(".");
    const index = Number(indexText);
    const value = Number(hrInput.value);
    if (Number.isFinite(value) && Array.isArray(hrBudgetInputs[section]?.[key]) && Number.isInteger(index)) {
      hrBudgetInputs[section][key][index] = value;
      if (event.type === "change") renderHrBudgetWorkspace();
    }
    return;
  }
  const notesInput = event.target.closest("[data-hr-input-notes]");
  if (notesInput) {
    hrBudgetInputs.notes = notesInput.value;
    return;
  }
  const hrDriver = event.target.closest("[data-hr-driver]");
  if (hrDriver) {
    const value = Number(hrDriver.value);
    if (Number.isFinite(value)) hrBudgetDrivers[hrDriver.dataset.hrDriver] = value;
    localStorage.setItem(HR_BUDGET_DRIVER_KEY, JSON.stringify(hrBudgetDrivers));
    if (event.type === "change") renderHrBudgetWorkspace();
    return;
  }
  const analysisTarget = event.target.closest("[data-rf-analysis-key]");
  if (analysisTarget) {
    if (!rollingCanEditReasons()) {
      toast(rollingRoleScope(), true);
      return;
    }
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
  const row = rollingRowForCode(target.dataset.rfCode);
  if (!rollingCanEditField(target.dataset.rfField, row)) {
    toast(rollingRoleScope(), true);
    renderTable();
    return;
  }
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

async function saveRollingForecastDrafts() {
  try {
    localStorage.setItem(ROLLING_FORECAST_DRAFT_KEY, JSON.stringify(state.rollingForecastDrafts));
    localStorage.setItem(ROLLING_FORECAST_SUBMIT_KEY, JSON.stringify(state.rollingForecastSubmitted));
    await store.saveRollingForecast?.({
      drafts: state.rollingForecastDrafts,
      submitted: state.rollingForecastSubmitted,
      role: state.rollingRole
    });
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

function rfT(key, values = {}) {
  let text = ROLLING_FORECAST_TEXT[state.language]?.[key] || ROLLING_FORECAST_TEXT.zh[key] || key;
  for (const [name, value] of Object.entries(values)) text = text.replaceAll(`{${name}}`, String(value));
  return text;
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
  const rows = rowsWithHrBudgetAccounts(state.result.rows).filter((row) => {
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

function rowsWithHrBudgetAccounts(rows) {
  if (state.activeUnit !== "dishwasher" || Number(state.result?.month || 0) < 6) return rows;
  const output = buildHrBudgetAccountSync(hrBudgetData());
  const existingCodes = new Set(rows.map((row) => String(row.code || "")));
  const month = Number(state.result.month);
  const volume25 = Number(state.result.volume25 || 0);
  const volume26 = Number(state.result.volume26 || 0);
  const additions = [];

  for (const code of Object.keys(output)) {
    if (existingCodes.has(String(code))) continue;
    const planRows = ACCOUNT_BUDGET_DW_BY_MONTH[month]?.accounts || [];
    const source = planRows.find((row) => String(row.code) === String(code) && row.category)
      || planRows.find((row) => String(row.code) === String(code));
    if (!source) continue;
    const amount26 = rollingTotalInfo(code, month).total;
    const amount25 = referenceAmountForAccount(code, month, "same");
    const previousAmount26 = month > 1 ? rollingTotalInfo(code, month - 1).total : null;
    const unit25 = Number.isFinite(amount25) && volume25 ? amount25 * 1000 / volume25 : null;
    const unit26 = Number.isFinite(amount26) && volume26 ? amount26 * 1000 / volume26 : null;
    const previousVolume26 = Number(state.result.previousVolume26 || 0);
    const previousUnit26 = Number.isFinite(previousAmount26) && previousVolume26 ? previousAmount26 * 1000 / previousVolume26 : null;
    additions.push({
      code,
      descEn: source.descEn,
      category: source.category || source.summaryKey || "",
      summaryKey: source.summaryKey || source.category || "",
      amount25,
      previousAmount26,
      amount26,
      amountDiff: Number.isFinite(amount26) && Number.isFinite(amount25) ? amount26 - amount25 : null,
      momAmountDiff: Number.isFinite(amount26) && Number.isFinite(previousAmount26) ? amount26 - previousAmount26 : null,
      unit25,
      unit26,
      previousUnit26,
      unitDiff: Number.isFinite(unit26) && Number.isFinite(unit25) ? unit26 - unit25 : null,
      momUnitDiff: Number.isFinite(unit26) && Number.isFinite(previousUnit26) ? unit26 - previousUnit26 : null,
      isHighImpact: false,
      isHrBudgetAccount: true
    });
  }
  return [...rows, ...additions];
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
