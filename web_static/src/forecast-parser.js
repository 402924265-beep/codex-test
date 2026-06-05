import { cellText, normalizeNumber } from "./parser.js";

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
    "大科目": { en: "Category", tr: "Kategori" }
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
    "固定用人": { en: "White-collar HC", tr: "Beyaz yaka kişi" }
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

  const categories = CATEGORY_ROWS
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
  const actualSource = forecast.totalAll || forecast.totalIncludingFc || forecast.totalMfg;
  const sameAmount = monthsFromObject(options.baseline25ByMonth, (item) => sumAccounts(item?.accounts, 1));
  const sameVolume = monthsFromObject(options.baseline25ByMonth, (item) => item?.volume ?? null);
  const baselineBudgetAmount = monthsFromObject(options.budget26ByMonth, (item) => sumAccounts(item?.accounts, 1));
  const baselineBudgetVolume = monthsFromObject(options.budget26ByMonth, (item) => item?.volume ?? null);
  const budgetAmount = preferSeries(actualSource?.budgetMonths, baselineBudgetAmount);
  const budgetVolume = preferSeries(forecast.volume.budget, baselineBudgetVolume);
  const stdVolume = normalizeMonths(forecast.volume.std);
  const actualAmount = Array.from({ length: 12 }, (_, index) => {
    const result = options.resultByMonth?.get?.(index + 1);
    return result?.summary?.totalAmount26 ?? actualSource?.amountMonths?.[index] ?? null;
  });
  const actualVolume = Array.from({ length: 12 }, (_, index) => {
    const result = options.resultByMonth?.get?.(index + 1);
    return result?.volume26 ?? forecast.volume.actual[index] ?? null;
  });
  const actualUnit = actualAmount.map((value, index) => unit(value, actualVolume[index], actualSource?.unitMonths?.[index]));
  const sameUnit = sameAmount.map((value, index) => unit(value, sameVolume[index]));
  const budgetUnit = budgetAmount.map((value, index) => unit(value, budgetVolume[index]));
  const amountDiff = actualAmount.map((value, index) => nullableDiff(value, sameAmount[index]));
  const budgetAmountDiff = actualAmount.map((value, index) => nullableDiff(value, budgetAmount[index]));
  const unitDiff = actualUnit.map((value, index) => nullableDiff(value, sameUnit[index]));
  const budgetUnitDiff = actualUnit.map((value, index) => nullableDiff(value, budgetUnit[index]));
  const mfgDiff = unitDiff.map((value, index) => value === null || !actualVolume[index] ? null : (value * actualVolume[index]) / 1000);
  const budgetMfgDiff = budgetUnitDiff.map((value, index) => value === null || !actualVolume[index] ? null : (value * actualVolume[index]) / 1000);

  const rows = [
    metric("核心", "产量", "同期", "台", sameVolume, "higher"),
    metric("核心", "产量", "预算", "台", budgetVolume, "higher"),
    metric("核心", "产量", "26年", "台", actualVolume, "higher", budgetVolume),
    metric("核心", "标准台", "26年", "台", stdVolume, "higher", budgetVolume),
    metric("核心", "产量累计", "同期", "台", cumulative(sameVolume), "higher"),
    metric("核心", "产量累计", "预算", "台", cumulative(budgetVolume), "higher"),
    metric("核心", "产量累计", "26年", "台", cumulative(actualVolume), "higher", cumulative(budgetVolume)),
    metric("核心", "标准台累计", "26年", "台", cumulative(stdVolume), "higher", cumulative(budgetVolume)),
    metric("核心", "制造费用金额", "同期", "K€", sameAmount, "lower"),
    metric("核心", "制造费用金额", "预算", "K€", budgetAmount, "lower"),
    metric("核心", "制造费用金额", "26年", "K€", actualAmount, "lower", budgetAmount),
    metric("核心", "制造费用金额累计", "同期", "K€", cumulative(sameAmount), "lower"),
    metric("核心", "制造费用金额累计", "预算", "K€", cumulative(budgetAmount), "lower"),
    metric("核心", "制造费用金额累计", "26年", "K€", cumulative(actualAmount), "lower", cumulative(budgetAmount)),
    metric("核心", "单台制造费", "同期", "€/台", sameUnit, "lower"),
    metric("核心", "单台制造费", "预算", "€/台", budgetUnit, "lower"),
    metric("核心", "单台制造费", "26年", "€/台", actualUnit, "lower", budgetUnit),
    metric("核心", "单台制造费累计", "同期", "€/台", cumulativeUnit(sameAmount, sameVolume), "lower"),
    metric("核心", "单台制造费累计", "预算", "€/台", cumulativeUnit(budgetAmount, budgetVolume), "lower"),
    metric("核心", "单台制造费累计", "26年", "€/台", cumulativeUnit(actualAmount, actualVolume), "lower", cumulativeUnit(budgetAmount, budgetVolume)),
    metric("差异", "实际-同期金额", "差额", "K€", amountDiff, "lower"),
    metric("差异", "实际-预算金额", "差额", "K€", budgetAmountDiff, "lower"),
    metric("差异", "制造费差额", "差额", "K€", mfgDiff, "lower"),
    metric("差异", "预算制造费差额", "差额", "K€", budgetMfgDiff, "lower"),
    metric("差异", "累计制造费差额", "累计差额", "K€", cumulative(mfgDiff), "lower"),
    metric("差异", "累计预算制造费差额", "累计差额", "K€", cumulative(budgetMfgDiff), "lower")
  ];

  if (forecast.hc?.actualTotal?.some(isNumber)) {
    const hcActual = forecast.hc.actualTotal;
    const hcBudget = forecast.hc.budgetTotal;
    const productivityActual = actualVolume.map((value, index) => perHead(value, hcActual[index]));
    const productivityBudget = budgetVolume.map((value, index) => perHead(value, hcBudget[index]));
    rows.push(
      metric("效率", "用人", "预算", "人", hcBudget, "lower"),
      metric("效率", "用人", "26年", "人", hcActual, "lower", hcBudget),
      metric("效率", "累计用人", "预算", "人", cumulative(hcBudget), "lower"),
      metric("效率", "累计用人", "26年", "人", cumulative(hcActual), "lower", cumulative(hcBudget)),
      metric("效率", "人均产量", "预算", "台/人", productivityBudget, "higher"),
      metric("效率", "人均产量", "26年", "台/人", productivityActual, "higher", productivityBudget),
      metric("效率", "累计人均产量", "预算", "台/人", cumulativeProductivity(budgetVolume, hcBudget), "higher"),
      metric("效率", "累计人均产量", "26年", "台/人", cumulativeProductivity(actualVolume, hcActual), "higher", cumulativeProductivity(budgetVolume, hcBudget)),
      metric("效率", "直接用人", "预算", "人", forecast.hc.budgetDirect, "lower"),
      metric("效率", "直接用人", "26年", "人", forecast.hc.actualDirect, "lower"),
      metric("效率", "间接用人", "预算", "人", forecast.hc.budgetIndirect, "lower"),
      metric("效率", "间接用人", "26年", "人", forecast.hc.actualIndirect, "lower"),
      metric("效率", "固定用人", "预算", "人", forecast.hc.budgetFixed, "lower"),
      metric("效率", "固定用人", "26年", "人", forecast.hc.actualFixed, "lower")
    );
  }

  for (const item of forecast.categories.filter((category) => isVisibleCategory(category.label))) {
    const sameCategoryMonths = categoryMonthsFromObject(options.baseline25ByMonth, item.labelZh, "amount25");
    if (sameCategoryMonths.some(isNumber)) rows.push(metric("大科目", item.labelZh, "同期", "K€", sameCategoryMonths, "lower"));
    rows.push(metric("大科目", item.labelZh, "预算", "K€", item.budgetMonths, "lower"));
    rows.push(metric("大科目", item.labelZh, "26年", "K€", item.amountMonths, "lower", item.budgetMonths));
  }

  return prioritizeDashboardRows(rows.filter((item) => item.values.some((value) => value !== null && value !== undefined)));
}

function prioritizeDashboardRows(rows) {
  const metricOrder = [
    "Unit manufacturing cost",
    "YTD unit manufacturing cost",
    "MFG variance",
    "YTD MFG variance",
    "Manufacturing cost",
    "YTD manufacturing cost",
    "Volume",
    "YTD volume",
    "STD volume",
    "YTD STD volume",
    "Headcount",
    "YTD headcount",
    "Direct HC",
    "Indirect HC",
    "Fixed labor - white collar"
  ];
  const scenarioOrder = ["Same period", "Budget", "2026", "Variance", "YTD variance"];
  const groupOrder = ["Core", "Variance", "Efficiency", "Category"];
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
  const total = forecast?.totalAll || forecast?.totalIncludingFc || forecast?.totalMfg;
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
    actualTotal: addMonths(actualDirect, actualIndirect, actualFixed),
    budgetTotal: addMonths(budgetDirect, budgetIndirect, budgetFixed)
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
    "Depreciation",
    "Functional Currency Impact",
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
