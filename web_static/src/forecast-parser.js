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
      const row = findRow(cpuRows, label);
      if (!row) return null;
      return {
        label,
        labelZh: zhCategory(label),
        amountMonths: rowMonths(row, 1),
        total: num(row[13]),
        unitMonths: rowMonths(row, 15),
        varianceMonths: varianceByLabel.get(normalizeLabel(label)) || Array(12).fill(null)
      };
    })
    .filter(Boolean);

  const totalAll = categories.find((item) => normalizeLabel(item.label) === normalizeLabel("TOTAL ALL"));
  const totalMfg = categories.find((item) => normalizeLabel(item.label) === normalizeLabel("TOTAL MFG COST w/ SHARES"));
  const totalIncludingFc = categories.find((item) => normalizeLabel(item.label) === normalizeLabel("TOTAL Including FC"));

  return {
    source: "4+8 forecast",
    months: DASHBOARD_MONTHS,
    volume,
    categories,
    totalAll,
    totalMfg,
    totalIncludingFc,
    parsedAt: new Date().toISOString()
  };
}

export function buildAnnualDashboardRows(forecast) {
  if (!forecast) return [];
  const total = forecast.totalAll || forecast.totalIncludingFc || forecast.totalMfg;
  const rows = [
    row("产量", "台", forecast.volume.actual, forecast.volume.budget, "higher"),
    row("产量差异", "台", forecast.volume.delta, null, "higher"),
    row("单台制造费", "欧/台", total?.unitMonths, null, "lower"),
    row("制造费总额", "K€", total?.amountMonths, null, "lower"),
    row("实际-预算差额", "K€", total?.varianceMonths, null, "lower")
  ];

  for (const item of forecast.categories.filter((category) => isVisibleCategory(category.label))) {
    rows.push(row(item.labelZh, "K€", item.amountMonths, null, "lower", item.label));
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

function row(label, unit, values, compareValues = null, direction = "lower", sourceLabel = "") {
  const normalizedValues = normalizeMonths(values);
  const normalizedCompare = compareValues ? normalizeMonths(compareValues) : null;
  const diffs = normalizedCompare
    ? normalizedValues.map((value, index) => nullableDiff(value, normalizedCompare[index]))
    : normalizedValues;
  return {
    label,
    unit,
    values: normalizedValues,
    compareValues: normalizedCompare,
    diffs,
    direction,
    sourceLabel
  };
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

function num(value) {
  const parsed = normalizeNumber(value);
  return parsed === null ? null : parsed;
}

function nullableDiff(left, right) {
  if (left === null || left === undefined || right === null || right === undefined) return null;
  return left - right;
}

function normalizeLabel(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
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
  ].some((item) => normalizeLabel(item) === normalizeLabel(label));
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
