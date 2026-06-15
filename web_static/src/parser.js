export const MONTHS = [
  { month: 1, key: "jan", label: "1月" },
  { month: 2, key: "feb", label: "2月" },
  { month: 3, key: "mar", label: "3月" },
  { month: 4, key: "apr", label: "4月" },
  { month: 5, key: "may", label: "5月" },
  { month: 6, key: "jun", label: "6月" },
  { month: 7, key: "jul", label: "7月" },
  { month: 8, key: "aug", label: "8月" },
  { month: 9, key: "sep", label: "9月" },
  { month: 10, key: "oct", label: "10月" },
  { month: 11, key: "nov", label: "11月" },
  { month: 12, key: "dec", label: "12月" }
];

const MONTH_TOKENS = {
  1: ["jan", "january", "1月"],
  2: ["feb", "february", "2月"],
  3: ["mar", "march", "3月"],
  4: ["apr", "april", "4月"],
  5: ["may", "5月"],
  6: ["jun", "june", "6月"],
  7: ["jul", "july", "7月"],
  8: ["aug", "august", "8月"],
  9: ["sep", "sept", "september", "9月"],
  10: ["oct", "october", "10月"],
  11: ["nov", "november", "11月"],
  12: ["dec", "december", "12月"]
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

  const rentaSheetName = findSheetName(workbook, ["4+8 DW 2026", "Renta DW _2026", "Renta DW_2026", "Renta DW"]);
  if (rentaSheetName) {
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[rentaSheetName], { header: 1, raw: true, defval: null });
    return {
      ...extractRentaActualFromRows(rows, { month }),
      sheetName: rentaSheetName
    };
  }

  throw new Error("找不到SAP_ACT_EUR或Renta DW _2026 sheet，请确认导入的是洗碗机26年实际报表");
}

export function inferActualMonthCountFromFileName(fileName, fallback = 4) {
  const text = cellText(fileName).toLowerCase();
  const chineseMonth = text.match(/(?:^|[^\d])(1[0-2]|[1-9])\s*月/);
  if (chineseMonth) return Number(chineseMonth[1]);

  const numericMonth = text.match(/(?:^|[_\s-])(0?[1-9]|1[0-2])\.(?:20)?\d{2}(?:\D|$)/);
  if (numericMonth) return Number(numericMonth[1]);

  const englishMonths = [
    ["january", "jan"],
    ["february", "feb"],
    ["march", "mar"],
    ["april", "apr"],
    ["may"],
    ["june", "jun"],
    ["july", "jul"],
    ["august", "aug"],
    ["september", "sept", "sep"],
    ["october", "oct"],
    ["november", "nov"],
    ["december", "dec"]
  ];
  const englishIndex = englishMonths.findIndex((tokens) => tokens.some((token) => new RegExp(`(?:^|[^a-z])${token}(?:[^a-z]|$)`).test(text)));
  return englishIndex >= 0 ? englishIndex + 1 : fallback;
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
  const reportedTotal = findRentaReportedTotal(rows, headerRow, valueCol);
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

  const detailTotal = [...accountMap.values()].reduce((total, item) => total + (item.amount || 0), 0);
  const totalAdjustment = reportedTotal.amount === null ? 0 : reportedTotal.amount - detailTotal;
  if (reportedTotal.amount !== null && Math.abs(totalAdjustment) > 0.000001) {
    const code = "REPORT_TOTAL_ADJUSTMENT";
    accountMap.set(code, {
      code,
      descEn: "Report TOTAL reconciliation adjustment",
      category: "报表TOTAL校准",
      summaryKey: "REPORT_TOTAL_ADJUSTMENT",
      amount: totalAdjustment,
      unit: volume ? (totalAdjustment / volume) * 1000 : null,
      volume,
      duplicateCount: 1,
      sourceRows: [reportedTotal.rowNumber]
    });
  }

  return {
    month,
    volume,
    valueCol,
    cpuCol,
    reportedTotal: reportedTotal.amount,
    reportedTotalRow: reportedTotal.rowNumber,
    detailTotal,
    totalAdjustment,
    accounts: [...accountMap.values()].sort((a, b) => a.code.localeCompare(b.code, "zh-Hans-CN", { numeric: true })),
    summaryCategories: [...summaryMap.values()],
    sourceRows: [...accountMap.values()].flatMap((item) => item.sourceRows)
  };
}

export function detectFcstVolume(workbook, month, xlsx) {
  const sheetName = findSheetName(workbook, ["FCST CPU"]);
  if (!sheetName) return null;
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: true, defval: null });
  const tokens = MONTH_TOKENS[month] || [];
  const headerRow = rows.find((row) => row?.some((cell) => tokens.some((token) => cellText(cell).toLowerCase().includes(token))));
  if (headerRow) {
    for (let colIndex = 0; colIndex < headerRow.length; colIndex += 1) {
      const label = cellText(headerRow[colIndex]).toLowerCase();
      if (tokens.some((token) => label === token || label.includes(token))) {
        for (let rowIndex = 1; rowIndex < Math.min(rows.length, 8); rowIndex += 1) {
          const value = normalizeNumber(rows[rowIndex]?.[colIndex]);
          if (value !== null && value > 100) return value;
        }
      }
    }
  }
  return normalizeNumber(rows?.[1]?.[month]) || null;
}

function detectRentaVolume(rows, valueCol) {
  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 5); rowIndex += 1) {
    const value = normalizeNumber(rows[rowIndex]?.[valueCol]);
    if (value !== null && value > 100) return value;
  }
  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 5); rowIndex += 1) {
    const row = rows[rowIndex] || [];
    for (let distance = 1; distance <= 2; distance += 1) {
      for (const colIndex of [valueCol - distance, valueCol + distance]) {
        if (colIndex < 0 || colIndex >= row.length) continue;
        const value = normalizeNumber(row[colIndex]);
        if (value !== null && value > 100) return value;
      }
    }
  }
  return null;
}

function findRentaReportedTotal(rows, headerRow, valueCol) {
  for (let rowIndex = rows.length - 1; rowIndex > headerRow; rowIndex -= 1) {
    const row = rows[rowIndex] || [];
    const isTotal = row.some((cell) => cellText(cell).trim().toUpperCase() === "TOTAL");
    if (!isTotal) continue;
    const amount = normalizeNumber(row[valueCol]);
    if (amount !== null) return { amount, rowNumber: rowIndex + 1 };
  }
  return { amount: null, rowNumber: null };
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
