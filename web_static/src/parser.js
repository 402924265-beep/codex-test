export const MONTHS = [
  { month: 1, key: "jan", label: "1月" },
  { month: 2, key: "feb", label: "2月" },
  { month: 3, key: "mar", label: "3月" },
  { month: 4, key: "apr", label: "4月" }
];

const MONTH_TOKENS = {
  1: ["jan", "january", "1月"],
  2: ["feb", "february", "2月"],
  3: ["mar", "march", "3月"],
  4: ["apr", "april", "4月"]
};

export const SAP_SUMMARY_LABELS = {
  "CS_DEPRECIATION": "折旧（含FC）",
  "CS_DIRECT LABOUR": "直接人工",
  "CS_DIRECT LABOR": "直接人工",
  "CS_SCRAP_VARIABLE": "可回收废料",
  "CS_FIX COST": "运营费",
  "CS_VARIABLE COST": "生产耗用品",
  "CS_OBSOLESCENCE": "存货跌价准备",
  "CS_RESELLING": "Scrap selling",
  "CS_FIX UTILITIES": "固定能源费",
  "CS_VARIABLE UTILITIES": "变动能源费",
  "CS_INDIRECT LABOUR": "间接人工成本-辅助人员",
  "CS_INDIRECT LABOR": "间接人工成本-辅助人员",
  "CS_FIXED LABOUR": "固定人工-白领",
  "CS_FIXED LABOR": "固定人工-白领",
  "CS_SEMIFIX": "半固定-班车/工作服",
  "CS_OVH_ADM": "分摊费用"
};

export function cellText(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\n/g, " ").replace(/\u00a0/g, " ").trim();
}

export function normalizeNumber(value) {
  if (value === null || value === undefined || value === "" || value === "#DIV/0!") return null;
  if (typeof value === "boolean") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const normalized = String(value).replace(/,/g, "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function accountCode(value) {
  if (value === null || value === undefined || typeof value === "boolean") return "";
  if (typeof value === "number" && Number.isInteger(value)) {
    const raw = String(value);
    return /^\d{6}$|^\d{10}$/.test(raw) ? raw : "";
  }
  const raw = cellText(value);
  const match = raw.match(/(?:^|[^\w.])(\d{10}|\d{6})(?![\w.])/);
  return match ? match[1] : "";
}

export function detectSapMonthColumn(rows, month) {
  const tokens = MONTH_TOKENS[month] || [];
  const maxRows = Math.min(rows.length, 8);
  for (let rowIndex = 0; rowIndex < maxRows; rowIndex += 1) {
    const row = rows[rowIndex] || [];
    const maxCols = Math.min(row.length, 30);
    for (let colIndex = 0; colIndex < maxCols; colIndex += 1) {
      const label = cellText(row[colIndex]).toLowerCase();
      if (tokens.some((token) => label === token || label.includes(token))) {
        return colIndex;
      }
    }
  }
  throw new Error(`SAP_ACT_EUR中识别不到${month}月实际成本列`);
}

export function extractSapActualFromRows(rows, { month, volume }) {
  const valueCol = detectSapMonthColumn(rows, month);
  const accountMap = new Map();
  const summaryMap = new Map();
  const sourceRows = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] || [];
    if (isSapSectionEnd(row)) break;

    const summaryKey = sapSummaryKey(row);
    if (summaryKey && SAP_SUMMARY_LABELS[summaryKey]) {
      const amount = (normalizeNumber(row[valueCol]) || 0) / 1000;
      const label = SAP_SUMMARY_LABELS[summaryKey];
      const current = summaryMap.get(label) || { label, amount26: 0, sourceKey: summaryKey, sourceRows: [] };
      current.amount26 += amount;
      current.sourceRows.push(rowIndex + 1);
      summaryMap.set(label, current);
    }

    const codeCol = findAccountCodeColumn(row);
    if (codeCol === -1) continue;
    const code = accountCode(row[codeCol]);
    const amountEur = normalizeNumber(row[valueCol]);
    const amount = amountEur === null ? null : amountEur / 1000;
    const descEn = cellText(row[codeCol + 1]) || cellText(row[codeCol]);
    const unit = amount !== null && volume ? (amount / volume) * 1000 : null;
    const existing = accountMap.get(code);
    if (existing) {
      existing.amount = sumNullable(existing.amount, amount);
      existing.unit = existing.amount !== null && volume ? (existing.amount / volume) * 1000 : null;
      existing.duplicateCount += 1;
      existing.sourceRows.push(rowIndex + 1);
    } else {
      accountMap.set(code, {
        code,
        descEn,
        category: SAP_SUMMARY_LABELS[summaryKey] || "",
        summaryKey,
        amount,
        unit,
        volume,
        duplicateCount: 1,
        sourceRows: [rowIndex + 1]
      });
    }
    sourceRows.push(rowIndex + 1);
  }

  return {
    month,
    volume,
    valueCol,
    accounts: [...accountMap.values()].sort((a, b) => a.code.localeCompare(b.code, "zh-Hans-CN", { numeric: true })),
    summaryCategories: [...summaryMap.values()],
    sourceRows
  };
}

export function extractSapActualFromWorkbook(workbook, month, xlsx) {
  const sheetName = findSheetName(workbook, ["SAP_ACT_EUR", "SAP Actual extraction"]);
  if (!sheetName) throw new Error("找不到SAP_ACT_EUR sheet");
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: true, defval: null });
  const volume = detectFcstVolume(workbook, month, xlsx);
  return {
    ...extractSapActualFromRows(rows, { month, volume }),
    sheetName
  };
}

export function extractActualFromWorkbook(workbook, month, xlsx) {
  const sapSheetName = findSheetName(workbook, ["SAP_ACT_EUR", "SAP Actual extraction"]);
  if (sapSheetName) return extractSapActualFromWorkbook(workbook, month, xlsx);

  const rentaSheetName = findSheetName(workbook, ["Renta DW _2026", "Renta DW_2026", "Renta DW"]);
  if (rentaSheetName) {
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[rentaSheetName], { header: 1, raw: true, defval: null });
    return {
      ...extractRentaActualFromRows(rows, { month }),
      sheetName: rentaSheetName
    };
  }

  throw new Error("找不到SAP_ACT_EUR或Renta DW _2026 sheet，请确认导入的是洗碗机26年实际报表");
}

export function detectRentaMonthColumns(rows, month) {
  const tokens = MONTH_TOKENS[month] || [];
  const maxRows = Math.min(rows.length, 20);
  for (let rowIndex = 0; rowIndex < maxRows; rowIndex += 1) {
    const row = rows[rowIndex] || [];
    for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
      const label = cellText(row[colIndex]).toLowerCase();
      if (!label) continue;
      const hasMonth = tokens.some((token) => label === token || label.includes(token));
      if (!hasMonth) continue;
      if (label.includes("k€") || label.includes("k eur") || label.includes("keur") || label.includes("k ")) {
        const cpuCol = findRentaCpuColumn(row, colIndex, tokens);
        return { headerRow: rowIndex, valueCol: colIndex, cpuCol };
      }
    }
  }
  throw new Error(`Renta DW _2026中识别不到${month}月K€列`);
}

export function extractRentaActualFromRows(rows, { month }) {
  const { headerRow, valueCol, cpuCol } = detectRentaMonthColumns(rows, month);
  const volume = detectRentaVolume(rows, valueCol);
  const accountMap = new Map();
  const summaryMap = new Map();

  for (let rowIndex = headerRow + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] || [];
    const codeCol = findAccountCodeColumn(row);
    if (codeCol === -1) continue;
    const code = accountCode(row[codeCol]);
    const amount = normalizeNumber(row[valueCol]);
    const unitFromSheet = normalizeNumber(row[cpuCol]);
    const unit = amount !== null && volume ? (amount / volume) * 1000 : unitFromSheet;
    const descEn = cellText(row[codeCol + 1]) || cellText(row[codeCol]);
    const summaryKey = sapSummaryKey(row) || cellText(row[codeCol + 2]).replace(/^\*+\s*/, "").trim().toUpperCase();
    const label = SAP_SUMMARY_LABELS[summaryKey] || "";

    if (label) {
      const current = summaryMap.get(label) || { label, amount26: 0, sourceKey: summaryKey, sourceRows: [] };
      current.amount26 += amount || 0;
      current.sourceRows.push(rowIndex + 1);
      summaryMap.set(label, current);
    }

    const existing = accountMap.get(code);
    if (existing) {
      existing.amount = sumNullable(existing.amount, amount);
      existing.unit = existing.amount !== null && volume ? (existing.amount / volume) * 1000 : sumNullable(existing.unit, unit);
      existing.duplicateCount += 1;
      existing.sourceRows.push(rowIndex + 1);
    } else {
      accountMap.set(code, {
        code,
        descEn,
        category: label,
        summaryKey,
        amount,
        unit,
        volume,
        duplicateCount: 1,
        sourceRows: [rowIndex + 1]
      });
    }
  }

  return {
    month,
    volume,
    valueCol,
    cpuCol,
    accounts: [...accountMap.values()].sort((a, b) => a.code.localeCompare(b.code, "zh-Hans-CN", { numeric: true })),
    summaryCategories: [...summaryMap.values()],
    sourceRows: [...accountMap.values()].flatMap((item) => item.sourceRows)
  };
}

export function detectFcstVolume(workbook, month, xlsx) {
  const sheetName = findSheetName(workbook, ["FCST CPU"]);
  if (!sheetName) return null;
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: true, defval: null });
  return normalizeNumber(rows?.[1]?.[month]) || null;
}

function detectRentaVolume(rows, valueCol) {
  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 5); rowIndex += 1) {
    const row = rows[rowIndex] || [];
    for (let colIndex = Math.max(0, valueCol - 2); colIndex <= Math.min(row.length - 1, valueCol + 2); colIndex += 1) {
      const value = normalizeNumber(row[colIndex]);
      if (value !== null && value > 100) return value;
    }
  }
  return null;
}

function findRentaCpuColumn(row, valueCol, tokens) {
  for (let colIndex = valueCol + 1; colIndex < Math.min(row.length, valueCol + 4); colIndex += 1) {
    const label = cellText(row[colIndex]).toLowerCase();
    const hasMonth = tokens.some((token) => label === token || label.includes(token));
    if (hasMonth && label.includes("cpu")) return colIndex;
  }
  return valueCol + 1;
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

function findAccountCodeColumn(row) {
  const limit = Math.min(row.length, 8);
  for (let index = 0; index < limit; index += 1) {
    if (accountCode(row[index])) return index;
  }
  return -1;
}

function isSapSectionEnd(row) {
  return row.slice(0, 3).some((value) => cellText(value).toLowerCase() === "over/under");
}

function sapSummaryKey(row) {
  for (const value of row.slice(0, 2)) {
    const label = cellText(value);
    if (label.startsWith("*")) {
      return label.replace(/^\*+\s*/, "").trim().toUpperCase();
    }
  }
  return "";
}

function sumNullable(left, right) {
  if (left === null && right === null) return null;
  return (left || 0) + (right || 0);
}
