import { cellText, normalizeNumber } from "./parser.js?v=20260608-metric-groups-v9";
import {
  annualManufacturingRate,
  combineHeadcount,
  manufacturingRate,
  monthlyUpph,
  outputValue
} from "./metrics.js?v=20260608-metric-groups-v9";
import { OPERATIONAL_BASELINE } from "./operational-data.js?v=20260608-metric-groups-v9";
import { getKpiHeadcount } from "./kpi-headcount-data.js?v=20260611-kpi-headcount-full-v17";

export const DASHBOARD_MONTHS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月"
];

const MONTH_LABELS = {
  zh: DASHBOARD_MONTHS,
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  tr: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
};

const DASHBOARD_TEXT = {
  groups: {
    "核心": { en: "Core", tr: "Çekirdek" },
    "差异": { en: "Variance", tr: "Fark" },
    "效率": { en: "Efficiency", tr: "Verimlilik" },
    "大科目": { en: "Category", tr: "Kategori" },
    "单": { en: "Unit", tr: "Birim" },
    "时": { en: "Time", tr: "Zaman" },
    "人": { en: "People", tr: "Kişi" },
    "效": { en: "Efficiency", tr: "Verimlilik" },
    "费": { en: "Rate", tr: "Oran" }
  },
  scenarios: {
    "同期": { en: "Same period", tr: "Aynı dönem" },
    "预算": { en: "Budget", tr: "Bütçe" },
    "26年": { en: "2026", tr: "2026" },
    "差额": { en: "Variance", tr: "Fark" },
    "累计差额": { en: "YTD variance", tr: "YTD fark" }
  },
  units: {
    "台": { en: "pcs", tr: "adet" },
    "人": { en: "HC", tr: "kişi" },
    "€/台": { en: "€/pc", tr: "€/adet" },
    "台/人": { en: "pcs/HC", tr: "adet/kişi" },
    "K€": { en: "K€", tr: "K€" }
    ,"天": { en: "days", tr: "gün" }
    ,"UPPH": { en: "UPPH", tr: "UPPH" }
    ,"%": { en: "%", tr: "%" }
  },
  labels: {
    "产量": { en: "Volume", tr: "Hacim" },
    "标准台": { en: "STD volume", tr: "STD hacim" },
    "产量累计": { en: "YTD volume", tr: "YTD hacim" },
    "标准台累计": { en: "YTD STD volume", tr: "YTD STD hacim" },
    "制造费用金额": { en: "Manufacturing cost", tr: "Üretim gideri" },
    "制造费用金额累计": { en: "YTD manufacturing cost", tr: "YTD üretim gideri" },
    "单台制造费": { en: "Unit manufacturing cost", tr: "Birim üretim gideri" },
    "单台制造费累计": { en: "YTD unit manufacturing cost", tr: "YTD birim üretim gideri" },
    "实际-同期金额": { en: "Actual vs same period", tr: "Gerçekleşen - aynı dönem" },
    "实际-预算金额": { en: "Actual vs budget", tr: "Gerçekleşen - bütçe" },
    "制造费差额": { en: "MFG variance", tr: "Üretim gideri farkı" },
    "预算制造费差额": { en: "Budget MFG variance", tr: "Bütçe üretim farkı" },
    "累计制造费差额": { en: "YTD MFG variance", tr: "YTD üretim farkı" },
    "累计预算制造费差额": { en: "YTD budget MFG variance", tr: "YTD bütçe üretim farkı" },
    "用人": { en: "Headcount", tr: "Kişi sayısı" },
    "累计用人": { en: "YTD headcount", tr: "YTD kişi sayısı" },
    "人均产量": { en: "Output per HC", tr: "Kişi başı çıktı" },
    "累计人均产量": { en: "YTD output per HC", tr: "YTD kişi başı çıktı" },
    "直接用人": { en: "Direct HC", tr: "Direkt kişi" },
    "间接用人": { en: "Indirect HC", tr: "Endirekt kişi" },
    "固定用人": { en: "White-collar HC", tr: "Beyaz yaka kişi" },
    "直接员工": { en: "Direct employees", tr: "Direkt çalışan" },
    "间接员工": { en: "Indirect employees", tr: "Endirekt çalışan" },
    "白领": { en: "White collar", tr: "Beyaz yaka" }
    ,"工作日": { en: "Workdays", tr: "İş günü" }
    ,"UPPH": { en: "UPPH", tr: "UPPH" }
    ,"产值": { en: "Output value", tr: "Üretim değeri" }
    ,"产值累计": { en: "YTD output value", tr: "YTD üretim değeri" }
    ,"制造费率": { en: "Manufacturing rate", tr: "Üretim gider oranı" }
    ,"制造费率累计": { en: "YTD manufacturing rate", tr: "YTD üretim gider oranı" }
  },
  categories: {
    "直接人工": { en: "Direct labor", tr: "Direkt işçilik" },
    "变动能源": { en: "Variable utilities", tr: "Değişken enerji" },
    "生产耗用": { en: "Production consumables", tr: "Üretim sarf" },
    "生产耗用品": { en: "Production consumables", tr: "Üretim sarf" },
    "变动制造费": { en: "Variable conversion", tr: "Değişken dönüşüm" },
    "间接人工": { en: "Indirect labor", tr: "Endirekt işçilik" },
    "固定人工": { en: "Fixed labor", tr: "Sabit işçilik" },
    "半固定费用": { en: "Semifixed", tr: "Yarı sabit" },
    "固定能源": { en: "Fixed utilities", tr: "Sabit enerji" },
    "固定费用": { en: "Fixed cost", tr: "Sabit gider" },
    "折旧": { en: "Depreciation", tr: "Amortisman" },
    "FC汇率影响": { en: "FC FX impact", tr: "FC kur etkisi" },
    "报废": { en: "Scrap", tr: "Hurda" },
    "卖废": { en: "Scrap reselling", tr: "Hurda satışı" },
    "Scrap selling": { en: "Scrap selling", tr: "Hurda satışı" },
    "库存调整": { en: "Inventory adjustment", tr: "Stok düzeltmesi" },
    "存货跌价准备": { en: "Obsolescence", tr: "Stok değer düşüklüğü" },
    "IT Global": { en: "IT Global", tr: "IT Global" },
    "G&A": { en: "G&A", tr: "G&A" },
    "制造费用合计": { en: "Total manufacturing cost", tr: "Toplam üretim gideri" },
    "折旧（含FC）": { en: "Depreciation incl. FC", tr: "FC dahil amortisman" },
    "运营费": { en: "Operating cost", tr: "Operasyon gideri" },
    "可回收废料": { en: "Recoverable scrap", tr: "Geri kazanılabilir hurda" },
    "废品回收": { en: "Scrap recovery", tr: "Hurda geliri" },
    "固定能源费": { en: "Fixed utilities", tr: "Sabit enerji" },
    "变动能源费": { en: "Variable utilities", tr: "Değişken enerji" },
    "间接人工成本-辅助人员": { en: "Indirect labor - support", tr: "Endirekt işçilik - destek" },
    "固定人工-白领": { en: "Fixed labor - white collar", tr: "Sabit işçilik - beyaz yaka" },
    "半固定-班车/工作服": { en: "Semifixed - shuttle/uniform", tr: "Yarı sabit - servis/üniforma" },
    "分摊费用": { en: "Allocation", tr: "Dağıtım" },
    "其他制造费": { en: "Other manufacturing cost", tr: "Diğer üretim gideri" }
  }
};

const CATEGORY_ROWS = [
  "Direct Labor",
  "Variable Utilities",
  "Other Variable (Production Consumable)",
  "Variable Conv.",
  "Indirect Labour",
  "Fixed Labour",
  "Semifixed",
  "Fixed utilities",
  "Fixed Cost",
  "Depreciation",
  "Fixed Conv.",
  "TOTAL MFG COST w/o SHARES",
  "TOTAL SHARES",
  "TOTAL MFG COST w/ SHARES",
  "Functional Currency Impact",
  "TOTAL Including FC",
  "Scrap",
  "Scrap Reselling",
  "Other Variable (Inventory Adj)",
  "Obsolete",
  "Asset Sales",
  "TOTAL OTHERS",
  "IT GLOBAL",
  "G&A(Insurance included)",
  "TOTAL OVERHEAD",
  "TOTAL ALL"
];

export function extractForecastWorkbook(workbook, XLSX) {
  const volumeRows = rowsFromSheet(workbook, XLSX, ["VOLUME"]);
  const cpuRows = rowsFromSheet(workbook, XLSX, ["FCST CPU"]);
  const varianceRows = rowsFromSheet(workbook, XLSX, ["FCST 26"]);
  const hcRows = optionalRowsFromSheet(workbook, XLSX, ["HC 2026"]);

  const volume = {
    budget: rowMonths(findRow(volumeRows, "Budget Volume"), 1),
    std: rowMonths(findRow(volumeRows, "STD Volume"), 1),
    actual: rowMonths(findRow(volumeRows, "Actual Volume"), 1)
  };
  volume.delta = volume.actual.map((value, index) => nullableDiff(value, volume.budget[index]));

  const varianceByLabel = new Map();
  for (const row of varianceRows) {
    const label = cellText(row[0]);
    if (!label) continue;
    varianceByLabel.set(normalizeLabel(label), rowMonths(row, 1));
  }

  const rawCategories = CATEGORY_ROWS
    .map((label) => {
      const sourceRow = findRow(cpuRows, label);
      if (!sourceRow) return null;
      const amountMonths = rowMonths(sourceRow, 1);
      const varianceMonths = varianceByLabel.get(normalizeLabel(label)) || Array(12).fill(null);
      return {
        label,
        labelZh: zhCategory(label),
        amountMonths,
        total: num(sourceRow[13]),
        unitMonths: rowMonths(sourceRow, 15),
        varianceMonths,
        budgetMonths: amountMonths.map((value, index) => {
          const variance = varianceMonths[index];
          return value === null || variance === null ? null : value - variance;
        })
      };
    })
    .filter(Boolean);

  const categories = mergeDepreciationWithFc(rawCategories);

  const totalAll = categories.find((item) => sameLabel(item.label, "TOTAL ALL"));
  const totalMfg = categories.find((item) => sameLabel(item.label, "TOTAL MFG COST w/ SHARES"));
  const totalIncludingFc = categories.find((item) => sameLabel(item.label, "TOTAL Including FC"));

  return {
    source: "4+8 forecast",
    months: DASHBOARD_MONTHS,
    volume,
    hc: extractHc(hcRows),
    categories,
    totalAll,
    totalMfg,
    totalIncludingFc,
    parsedAt: new Date().toISOString()
  };
}

export function buildAnnualDashboardRows(forecast, options = {}) {
  if (!forecast) return [];
  const jiang = options.jiangyue || null;
  const actualSource = forecast.totalAll || forecast.totalIncludingFc || forecast.totalMfg;
  const baselineSameAmount = monthsFromObject(options.baseline25ByMonth, (item) => sumAccounts(item?.accounts, 1));
  const baselineSameVolume = monthsFromObject(options.baseline25ByMonth, (item) => item?.volume ?? null);
  const sameAmount = preferSeries(jiang?.amount?.same, baselineSameAmount);
  const sameVolume = preferSeries(jiang?.volume?.same, baselineSameVolume);
  const baselineBudgetAmount = monthsFromObject(options.budget26ByMonth, (item) => sumAccounts(item?.accounts, 1));
  const baselineBudgetVolume = monthsFromObject(options.budget26ByMonth, (item) => item?.volume ?? null);
  const budgetAmount = preferSeries(jiang?.amount?.budget, preferSeries(actualSource?.budgetMonths, baselineBudgetAmount));
  const budgetVolume = preferSeries(jiang?.volume?.budget, preferSeries(forecast.volume.budget, baselineBudgetVolume));
  const stdVolume = normalizeMonths(forecast.volume.std);
  const sameUnit = sameAmount.map((value, index) => unit(value, sameVolume[index]));
  const budgetUnit = budgetAmount.map((value, index) => unit(value, budgetVolume[index]));
  const actualMonthCount = inferActualMonthCount(options, jiang);
  const forecastAmount = preferNonZeroSeries(actualSource?.amountMonths, preferNonZeroSeries(actualSource?.budgetMonths, budgetAmount));
  const forecastVolume = preferNonZeroSeries(forecast.volume.actual, preferNonZeroSeries(forecast.volume.std, budgetVolume));
  const forecastUnit = preferNonZeroSeries(actualSource?.unitMonths, budgetUnit);
  const actualAmount = Array.from({ length: 12 }, (_, index) => {
    const result = options.resultByMonth?.get?.(index + 1);
    if (hasRealizedActual(result)) return result.summary.totalAmount26;
    return forecastAmount[index];
  });
  const actualVolume = Array.from({ length: 12 }, (_, index) => {
    const result = options.resultByMonth?.get?.(index + 1);
    if (hasRealizedActual(result) && result?.volume26 !== undefined) return result.volume26;
    if (Number.isFinite(forecastVolume[index])) return forecastVolume[index];
    const amount = forecastAmount[index];
    const unitValue = forecastUnit[index];
    return Number.isFinite(amount) && Number.isFinite(unitValue) && unitValue ? amount * 1000 / unitValue : null;
  });
  const actualUnit = actualAmount.map((value, index) => unit(value, actualVolume[index], forecastUnit[index]));
  const workdaysSame = preferSeries(jiang?.workdays?.same, OPERATIONAL_BASELINE.workdays.same);
  const workdaysBudget = preferSeries(jiang?.workdays?.budget, OPERATIONAL_BASELINE.workdays.budget);
  const workdaysActual = preferSeries(jiang?.workdays?.actual, OPERATIONAL_BASELINE.workdays.actual);
  const kpiHeadcount = getKpiHeadcount("DW");
  const directEmployeesSame = normalizeMonths(kpiHeadcount.direct.same);
  const directEmployeesBudget = normalizeMonths(kpiHeadcount.direct.budget);
  const directEmployees26 = normalizeMonths(kpiHeadcount.direct.actual);
  const indirectEmployeesSame = normalizeMonths(kpiHeadcount.indirect.same);
  const indirectEmployeesBudget = normalizeMonths(kpiHeadcount.indirect.budget);
  const indirectEmployees26 = normalizeMonths(kpiHeadcount.indirect.actual);
  const whiteCollarSame = normalizeMonths(kpiHeadcount.white.same);
  const whiteCollarBudget = normalizeMonths(kpiHeadcount.white.budget);
  const whiteCollar26 = normalizeMonths(kpiHeadcount.white.actual);
  const hcSame = combineHeadcount(directEmployeesSame, indirectEmployeesSame);
  const hcBudget = combineHeadcount(directEmployeesBudget, indirectEmployeesBudget);
  const hcActual = combineHeadcount(directEmployees26, indirectEmployees26);
  const upphSame = sameVolume.map((value, index) => monthlyUpph(value, hcSame[index], 0, workdaysSame[index]));
  const upphBudget = budgetVolume.map((value, index) => monthlyUpph(value, hcBudget[index], 0, workdaysBudget[index]));
  const upphActual = actualVolume.map((value, index) => monthlyUpph(value, hcActual[index], 0, workdaysActual[index]));
  const priceSame = normalizeMonths(jiang?.price?.same);
  const priceBudget = normalizeMonths(jiang?.price?.budget);
  const priceActual = normalizeMonths(jiang?.price?.actual).map((value, index) => Number.isFinite(value) ? value : priceBudget[index]);
  const outputSame = sameVolume.map((value, index) => outputValue(priceSame[index], value));
  const outputBudget = budgetVolume.map((value, index) => outputValue(priceBudget[index], value));
  const outputActual = actualVolume.map((value, index) => outputValue(priceActual[index], value));
  const rateSame = sameAmount.map((value, index) => manufacturingRate(value, priceSame[index], sameVolume[index]));
  const rateBudget = budgetAmount.map((value, index) => manufacturingRate(value, priceBudget[index], budgetVolume[index]));
  const rateActual = actualAmount.map((value, index) => manufacturingRate(value, priceActual[index], actualVolume[index]));

  const rows = [
    metric("费", "单台制造费", "同期", "€/台", sameUnit, "lower"),
    metric("费", "单台制造费", "预算", "€/台", budgetUnit, "lower"),
    metric("费", "单台制造费", "26年", "€/台", actualUnit, "lower", budgetUnit),
    metric("费", "单台制造费累计", "同期", "€/台", cumulativeUnit(sameAmount, sameVolume), "lower"),
    metric("费", "单台制造费累计", "预算", "€/台", cumulativeUnit(budgetAmount, budgetVolume), "lower"),
    metric("费", "单台制造费累计", "26年", "€/台", cumulativeUnit(actualAmount, actualVolume), "lower", cumulativeUnit(budgetAmount, budgetVolume)),
    metric("时", "工作日", "同期", "天", workdaysSame, "higher"),
    metric("时", "工作日", "预算", "天", workdaysBudget, "higher"),
    metric("时", "工作日", "26年", "天", workdaysActual, "higher", workdaysBudget),
    metric("人", "直接员工", "同期", "人", directEmployeesSame, "lower"),
    metric("人", "直接员工", "预算", "人", directEmployeesBudget, "lower"),
    metric("人", "直接员工", "26年", "人", directEmployees26, "lower", directEmployeesBudget),
    metric("人", "间接员工", "同期", "人", indirectEmployeesSame, "lower"),
    metric("人", "间接员工", "预算", "人", indirectEmployeesBudget, "lower"),
    metric("人", "间接员工", "26年", "人", indirectEmployees26, "lower", indirectEmployeesBudget),
    metric("人", "白领", "同期", "人", whiteCollarSame, "lower"),
    metric("人", "白领", "预算", "人", whiteCollarBudget, "lower"),
    metric("人", "白领", "26年", "人", whiteCollar26, "lower", whiteCollarBudget),
    metric("单", "产量", "同期", "台", sameVolume, "higher"),
    metric("单", "产量", "预算", "台", budgetVolume, "higher"),
    metric("单", "产量", "26年", "台", actualVolume, "higher", budgetVolume),
    metric("单", "产量累计", "同期", "台", cumulative(sameVolume), "higher"),
    metric("单", "产量累计", "预算", "台", cumulative(budgetVolume), "higher"),
    metric("单", "产量累计", "26年", "台", cumulative(actualVolume), "higher", cumulative(budgetVolume)),
    metric("效", "UPPH", "同期", "UPPH", upphSame, "higher"),
    metric("效", "UPPH", "预算", "UPPH", upphBudget, "higher"),
    metric("效", "UPPH", "26年", "UPPH", upphActual, "higher", upphBudget),
    metric("费", "产值", "同期", "K€", outputSame, "higher"),
    metric("费", "产值", "预算", "K€", outputBudget, "higher"),
    metric("费", "产值", "26年", "K€", outputActual, "higher", outputBudget),
    metric("费", "产值累计", "同期", "K€", cumulative(outputSame), "higher"),
    metric("费", "产值累计", "预算", "K€", cumulative(outputBudget), "higher"),
    metric("费", "产值累计", "26年", "K€", cumulative(outputActual), "higher", cumulative(outputBudget)),
    metric("费", "制造费用金额", "同期", "K€", sameAmount, "lower"),
    metric("费", "制造费用金额", "预算", "K€", budgetAmount, "lower"),
    metric("费", "制造费用金额", "26年", "K€", actualAmount, "lower", budgetAmount),
    metric("费", "制造费用金额累计", "同期", "K€", cumulative(sameAmount), "lower"),
    metric("费", "制造费用金额累计", "预算", "K€", cumulative(budgetAmount), "lower"),
    metric("费", "制造费用金额累计", "26年", "K€", cumulative(actualAmount), "lower", cumulative(budgetAmount)),
    metric("费", "制造费率", "同期", "%", rateSame, "lower"),
    metric("费", "制造费率", "预算", "%", rateBudget, "lower"),
    metric("费", "制造费率", "26年", "%", rateActual, "lower", rateBudget),
    metric("费", "制造费率累计", "同期", "%", cumulativeRate(sameAmount, outputSame), "lower"),
    metric("费", "制造费率累计", "预算", "%", cumulativeRate(budgetAmount, outputBudget), "lower"),
    metric("费", "制造费率累计", "26年", "%", cumulativeRate(actualAmount, outputActual), "lower", cumulativeRate(budgetAmount, outputBudget))
  ];

  return prioritizeDashboardRows(rows.filter((item) => item.values.some((value) => value !== null && value !== undefined)));
}

function inferActualMonthCount(options, jiang) {
  const resultMonths = [...(options.resultByMonth?.entries?.() || [])]
    .filter(([, result]) => hasRealizedActual(result))
    .map(([month]) => Number(month))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 12);
  if (resultMonths.length) return Math.max(...resultMonths);

  return 4;
}

function hasRealizedActual(result) {
  return Number.isFinite(result?.summary?.totalAmount26) && Math.abs(result.summary.totalAmount26) > 0.0001;
}

function mergeRealizedAndForecast(realized, forecast, actualMonthCount) {
  return Array.from({ length: 12 }, (_, index) => {
    const primary = index < actualMonthCount ? realized?.[index] : forecast?.[index];
    const fallback = index < actualMonthCount ? forecast?.[index] : realized?.[index];
    return Number.isFinite(primary) ? primary : Number.isFinite(fallback) ? fallback : null;
  });
}

function prioritizeDashboardRows(rows) {
  const metricOrder = [
    "Unit manufacturing cost",
    "YTD unit manufacturing cost",
    "Workdays",
    "Headcount",
    "Direct employees",
    "Indirect employees",
    "White collar",
    "Volume",
    "YTD volume",
    "UPPH",
    "Output value",
    "YTD output value",
    "Manufacturing cost",
    "YTD manufacturing cost",
    "Manufacturing rate",
    "YTD manufacturing rate"
  ];
  const scenarioOrder = ["Same period", "Budget", "2026", "Variance", "YTD variance"];
  const groupOrder = ["Unit", "Time", "People", "Efficiency", "Rate"];
  const orderOf = (list, value) => {
    const index = list.indexOf(value);
    return index === -1 ? 999 : index;
  };
  return [...rows].sort((left, right) => {
    const leftLocal = localizeDashboardRow(left, "en");
    const rightLocal = localizeDashboardRow(right, "en");
    return orderOf(groupOrder, leftLocal.group) - orderOf(groupOrder, rightLocal.group)
      || orderOf(metricOrder, leftLocal.label) - orderOf(metricOrder, rightLocal.label)
      || orderOf(scenarioOrder, leftLocal.scenario) - orderOf(scenarioOrder, rightLocal.scenario);
  });
}

export function monthSnapshot(forecast, month) {
  const index = Math.max(0, Math.min(11, Number(month || 1) - 1));
  const total = forecast?.totalIncludingFc || forecast?.totalAll || forecast?.totalMfg;
  if (!forecast || !total) {
    return { volume: null, unitCost: null, amount: null, budgetDelta: null };
  }
  return {
    volume: forecast.volume.actual[index] ?? null,
    unitCost: total.unitMonths[index] ?? null,
    amount: total.amountMonths[index] ?? null,
    budgetDelta: total.varianceMonths[index] ?? null
  };
}

export function localizeDashboardRow(row, language = "zh") {
  return {
    group: translateDashboardText("groups", row.group, language),
    label: translateDashboardText("labels", row.label, language),
    scenario: translateDashboardText("scenarios", row.scenario, language),
    unit: translateDashboardText("units", row.unit, language)
  };
}

export function localizeDashboardText(type, value, language = "zh") {
  return translateDashboardText(type, value, language);
}

export function localizeMonthLabel(index, language = "zh") {
  return MONTH_LABELS[language]?.[index] || MONTH_LABELS.zh[index] || `${index + 1}月`;
}

export function localizeCategory(value, language = "zh") {
  return translateDashboardText("categories", value, language);
}

function translateDashboardText(type, value, language) {
  if (language === "zh") return value;
  return DASHBOARD_TEXT[type]?.[value]?.[language] || value;
}

function metric(group, label, scenario, unitLabel, values, direction = "lower", compareValues = null) {
  const normalizedValues = normalizeMonths(values);
  const normalizedCompare = compareValues ? normalizeMonths(compareValues) : null;
  const diffs = normalizedCompare
    ? normalizedValues.map((value, index) => nullableDiff(value, normalizedCompare[index]))
    : normalizedValues;
  return {
    group,
    label,
    scenario,
    unit: unitLabel,
    values: normalizedValues,
    compareValues: normalizedCompare,
    diffs,
    direction
  };
}

function extractHc(rows) {
  if (!rows?.length) return null;
  const directRows = rows.filter((row) => sameLabel(cellText(row[0]), "Direct HC") && sameLabel(cellText(row[1]), "Production"));
  const indirectRows = rows.filter((row) => sameLabel(cellText(row[0]), "Indirect HC") && sameLabel(cellText(row[1]), "Production"));
  const fixedRows = rows.filter((row) => sameLabel(cellText(row[0]), "Fixed HC") && sameLabel(cellText(row[1]), "Production"));
  const actualFixedTotal = totalAfter(rows, "Fixed HC", 0);
  const budgetFixedTotal = totalAfter(rows, "Fixed HC", 1);
  const actualDirect = rowMonths(directRows[0], 2);
  const budgetDirect = rowMonths(directRows[1], 2);
  const actualIndirect = rowMonths(indirectRows[0], 2);
  const budgetIndirect = rowMonths(indirectRows[1], 2);
  const actualFixed = rowMonths(actualFixedTotal || fixedRows[0], 2);
  const budgetFixed = rowMonths(budgetFixedTotal || fixedRows[1], 2);
  return {
    actualDirect,
    budgetDirect,
    actualIndirect,
    budgetIndirect,
    actualFixed,
    budgetFixed,
    actualTotal: addMonths(actualDirect, actualIndirect),
    budgetTotal: addMonths(budgetDirect, budgetIndirect)
  };
}

function totalAfter(rows, label, occurrence = 0) {
  const starts = rows
    .map((row, index) => ({ row, index }))
    .filter((item) => sameLabel(cellText(item.row[0]), label));
  const start = starts[occurrence]?.index;
  if (start === undefined) return null;
  for (let index = start + 1; index < Math.min(rows.length, start + 8); index += 1) {
    if (sameLabel(cellText(rows[index]?.[1]), "Total")) return rows[index];
  }
  return null;
}

function normalizeMonths(values) {
  return Array.from({ length: 12 }, (_, index) => {
    const value = values?.[index];
    return Number.isFinite(value) ? value : null;
  });
}

function preferSeries(primary, fallback) {
  const first = normalizeMonths(primary);
  const second = normalizeMonths(fallback);
  return first.map((value, index) => Number.isFinite(value) ? value : second[index]);
}

function preferNonZeroSeries(primary, fallback) {
  const first = normalizeMonths(primary);
  const second = normalizeMonths(fallback);
  return first.map((value, index) => Number.isFinite(value) && Math.abs(value) > 0.0001 ? value : second[index]);
}

function rowsFromSheet(workbook, XLSX, candidates) {
  const sheetName = findSheetName(workbook, candidates);
  if (!sheetName) throw new Error(`找不到 ${candidates.join(" / ")} sheet`);
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: true, defval: null });
}

function optionalRowsFromSheet(workbook, XLSX, candidates) {
  const sheetName = findSheetName(workbook, candidates);
  if (!sheetName) return [];
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: true, defval: null });
}

function findSheetName(workbook, candidates) {
  const names = workbook.SheetNames || [];
  const exact = new Map(names.map((name) => [name.trim().toLowerCase(), name]));
  for (const candidate of candidates) {
    const found = exact.get(candidate.trim().toLowerCase());
    if (found) return found;
  }
  return names.find((name) => candidates.some((candidate) => name.toLowerCase().includes(candidate.toLowerCase()))) || "";
}

function findRow(rows, label) {
  const wanted = normalizeLabel(label);
  return rows.find((row) => row.some((cell) => normalizeLabel(cellText(cell)) === wanted)) || null;
}

function rowMonths(row, startCol) {
  return Array.from({ length: 12 }, (_, index) => num(row?.[startCol + index]));
}

function monthsFromObject(source, getter) {
  return Array.from({ length: 12 }, (_, index) => {
    const value = getter(source?.[index + 1]);
    return Number.isFinite(value) ? value : null;
  });
}

function categoryMonthsFromObject(source, label, valueKey) {
  return monthsFromObject(source, (item) => {
    const found = item?.categories?.find((category) => sameLabel(category.label, label));
    return found?.[valueKey] ?? null;
  });
}

function sumAccounts(accounts, valueIndex) {
  if (!Array.isArray(accounts)) return null;
  return accounts.reduce((total, row) => total + (Number(row?.[valueIndex]) || 0), 0);
}

function cumulative(values) {
  let total = 0;
  return normalizeMonths(values).map((value) => {
    if (value === null) return null;
    total += value;
    return total;
  });
}

function cumulativeUnit(amounts, volumes) {
  const amountCum = cumulative(amounts);
  const volumeCum = cumulative(volumes);
  return amountCum.map((amount, index) => unit(amount, volumeCum[index]));
}

function cumulativeRate(costs, outputs) {
  const costCum = cumulative(costs);
  const outputCum = cumulative(outputs);
  return costCum.map((cost, index) => annualManufacturingRate([cost], [outputCum[index]]));
}

function cumulativeProductivity(volumes, headcounts) {
  const volumeCum = cumulative(volumes);
  const hcCum = cumulative(headcounts);
  return volumeCum.map((volume, index) => perHead(volume, hcCum[index]));
}

function perHead(value, headcount) {
  if (Number.isFinite(value) && Number.isFinite(headcount) && headcount) return value / headcount;
  return null;
}

function unit(amount, volume, fallback = null) {
  if (Number.isFinite(amount) && Number.isFinite(volume) && volume) return (amount / volume) * 1000;
  return Number.isFinite(fallback) ? fallback : null;
}

function addMonths(...series) {
  return Array.from({ length: 12 }, (_, index) => {
    const values = series.map((item) => item?.[index]).filter(isNumber);
    return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
  });
}

function num(value) {
  const parsed = normalizeNumber(value);
  return parsed === null ? null : parsed;
}

function nullableDiff(left, right) {
  if (left === null || left === undefined || right === null || right === undefined) return null;
  return left - right;
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function sumNullable(left, right) {
  const a = Number.isFinite(left) ? left : 0;
  const b = Number.isFinite(right) ? right : 0;
  return Number.isFinite(left) || Number.isFinite(right) ? a + b : null;
}

function mergeDepreciationWithFc(categories) {
  const depreciation = categories.find((item) => sameLabel(item.label, "Depreciation"));
  const fc = categories.find((item) => sameLabel(item.label, "Functional Currency Impact"));
  if (!depreciation || !fc) return categories;
  const merged = {
    ...depreciation,
    label: "Depreciation incl. FC",
    labelZh: "折旧（含FC）",
    amountMonths: depreciation.amountMonths.map((value, index) => sumNullable(value, fc.amountMonths[index])),
    budgetMonths: depreciation.budgetMonths.map((value, index) => sumNullable(value, fc.budgetMonths[index])),
    varianceMonths: depreciation.varianceMonths.map((value, index) => sumNullable(value, fc.varianceMonths[index])),
    unitMonths: depreciation.unitMonths.map((value, index) => sumNullable(value, fc.unitMonths[index]))
  };
  merged.total = sumNullable(depreciation.total, fc.total);
  return [
    ...categories.filter((item) => !sameLabel(item.label, "Depreciation") && !sameLabel(item.label, "Functional Currency Impact")),
    merged
  ];
}

function normalizeLabel(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function sameLabel(left, right) {
  return normalizeLabel(left) === normalizeLabel(right);
}

function isVisibleCategory(label) {
  return [
    "Direct Labor",
    "Variable Utilities",
    "Other Variable (Production Consumable)",
    "Variable Conv.",
    "Indirect Labour",
    "Fixed Labour",
    "Semifixed",
    "Fixed utilities",
    "Fixed Cost",
    "Depreciation incl. FC",
    "Scrap",
    "Scrap Reselling",
    "Other Variable (Inventory Adj)",
    "Obsolete",
    "IT GLOBAL",
    "G&A(Insurance included)",
    "TOTAL ALL"
  ].some((item) => sameLabel(item, label));
}

function zhCategory(label) {
  return {
    "Direct Labor": "直接人工",
    "Variable Utilities": "变动能源",
    "Other Variable (Production Consumable)": "生产耗用",
    "Variable Conv.": "变动制造费",
    "Indirect Labour": "间接人工",
    "Fixed Labour": "固定人工",
    Semifixed: "半固定费用",
    "Fixed utilities": "固定能源",
    "Fixed Cost": "固定费用",
    "Depreciation incl. FC": "折旧（含FC）",
    Depreciation: "折旧",
    "Functional Currency Impact": "FC汇率影响",
    Scrap: "报废",
    "Scrap Reselling": "卖废",
    "Other Variable (Inventory Adj)": "库存调整",
    Obsolete: "存货跌价准备",
    "IT GLOBAL": "IT Global",
    "G&A(Insurance included)": "G&A",
    "TOTAL ALL": "制造费用合计"
  }[label] || label;
}
