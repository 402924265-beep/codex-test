import { cellText, normalizeNumber } from "./parser.js";

export const DASHBOARD_MONTHS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月"
];

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
  const budgetAmount = monthsFromObject(options.budget26ByMonth, (item) => sumAccounts(item?.accounts, 1));
  const budgetVolume = monthsFromObject(options.budget26ByMonth, (item) => item?.volume ?? null);
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
  const unitDiff = actualUnit.map((value, index) => nullableDiff(value, sameUnit[index]));
  const mfgDiff = unitDiff.map((value, index) => value === null || !actualVolume[index] ? null : (value * actualVolume[index]) / 1000);

  const rows = [
    metric("核心", "产量", "同期", "台", sameVolume, "higher"),
    metric("核心", "产量", "预算", "台", budgetVolume, "higher"),
    metric("核心", "产量", "26年", "台", actualVolume, "higher", budgetVolume),
    metric("核心", "产量累计", "同期", "台", cumulative(sameVolume), "higher"),
    metric("核心", "产量累计", "预算", "台", cumulative(budgetVolume), "higher"),
    metric("核心", "产量累计", "26年", "台", cumulative(actualVolume), "higher", cumulative(budgetVolume)),
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
    metric("差异", "制造费差额", "差额", "K€", mfgDiff, "lower"),
    metric("差异", "累计制造费差额", "累计差额", "K€", cumulative(mfgDiff), "lower")
  ];

  if (forecast.hc?.actualTotal?.some(isNumber)) {
    const hcActual = forecast.hc.actualTotal;
    const hcBudget = forecast.hc.budgetTotal;
    rows.push(
      metric("效率", "用人", "预算", "人", hcBudget, "lower"),
      metric("效率", "用人", "26年", "人", hcActual, "lower", hcBudget),
      metric("效率", "累计用人", "预算", "人", cumulative(hcBudget), "lower"),
      metric("效率", "累计用人", "26年", "人", cumulative(hcActual), "lower", cumulative(hcBudget)),
      metric("效率", "直接用人", "26年", "人", forecast.hc.actualDirect, "lower"),
      metric("效率", "间接用人", "26年", "人", forecast.hc.actualIndirect, "lower"),
      metric("效率", "固定用人", "26年", "人", forecast.hc.actualFixed, "lower")
    );
  }

  for (const item of forecast.categories.filter((category) => isVisibleCategory(category.label))) {
    rows.push(metric("大科目", item.labelZh, "预算", "K€", item.budgetMonths, "lower"));
    rows.push(metric("大科目", item.labelZh, "26年", "K€", item.amountMonths, "lower", item.budgetMonths));
  }

  return rows.filter((item) => item.values.some((value) => value !== null && value !== undefined));
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
