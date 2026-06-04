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
  "CS_RESELLING": "废品回收",
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
  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function accountCode(value) {
  if (value === null || value === undefined || typeof value === "boolean") return "";
  if (typeof value === "number" && Number.isInteger(value)) {
    const raw = String(value);
    return /^\d{6}$|^\d{10}$/.test(raw) ? raw : "";
  }
  const match = cellText(value).match(/(?:^|[^\w.])(\d{10}|\d{6})(?![\w.])/);
  return match ? match[1] : "";
}

export function detectSapMonthColumn(rows, month) {
  const tokens = MONTH_TOKENS[month] || [];
  for (let r = 0; r < Math.min(rows.length, 8); r += 1) {
    const row = rows[r] || [];
    for (let c = 0; c < Math.min(row.length, 30); c += 1) {
      const label = cellText(row[c]).toLowerCase();
      if (tokens.some((token) => label === token || label.includes(token))) return c;
    }
  }
  throw new Error(`SAP_ACT_EUR中识别不到${month}月实际成本列`);
}

export function detectRentaMonthColumns(rows, month) {
  const tokens = MONTH_TOKENS[month] || [];
  for (let r = 0; r < Math.min(rows.length, 20); r += 1) {
    const row = rows[r] || [];
    for (let c = 0; c < row.length; c += 1) {
      const label = cellText(row[c]).toLowerCase();
      const hasMonth = tokens.some((token) => label === token || label.includes(token));
      if (hasMonth && (label.includes("k€") || label.includes("k eur") || label.includes("keur") || label.includes("k "))) {
        return { headerRow: r, valueCol: c, cpuCol: findRentaCpuColumn(row, c, tokens) };
      }
    }
  }
  throw new Error(`Renta DW _2026中识别不到${month}月K€列`);
}

export function extractSapActualFromWorkbook(workbook, month, xlsx) {
  const sapSheetName = findSheetName(workbook, ["SAP_ACT_EUR", "SAP Actual extraction"]);
  if (sapSheetName) {
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sapSheetName], { header: 1, raw: true, defval: null });
    const volume = detectFcstVolume(workbook, month, xlsx);
    return { ...extractSapActualFromRows(rows, { month, volume }), sheetName: sapSheetName };
  }
  const rentaSheetName = findSheetName(workbook, ["Renta DW _2026", "Renta DW_2026", "Renta DW"]);
  if (rentaSheetName) {
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[rentaSheetName], { header: 1, raw: true, defval: null });
    return { ...extractRentaActualFromRows(rows, { month }), sheetName: rentaSheetName };
  }
  throw new Error("找不到SAP_ACT_EUR或Renta DW _2026 sheet，请确认导入的是洗碗机26年实际报表");
}

export function extractActualFromWorkbook(workbook, month, xlsx) {
  return extractSapActualFromWorkbook(workbook, month, xlsx);
}

export function extractSapActualFromRows(rows, { month, volume }) {
  const valueCol = detectSapMonthColumn(rows, month);
  const accountMap = new Map();
  const summaryMap = new Map();
  const sourceRows = [];
  for (let r = 1; r < rows.length; r += 1) {
    const row = rows[r] || [];
    if (row.slice(0, 3).some((v) => cellText(v).toLowerCase() === "over/under")) break;
    addSummary(summaryMap, sapSummaryKey(row), (normalizeNumber(row[valueCol]) || 0) / 1000, r + 1);
    const codeCol = findAccountCodeColumn(row);
    if (codeCol === -1) continue;
    const amountEur = normalizeNumber(row[valueCol]);
    addAccount(accountMap, {
      code: accountCode(row[codeCol]),
      descEn: cellText(row[codeCol + 1]) || cellText(row[codeCol]),
      amount: amountEur === null ? null : amountEur / 1000,
      volume,
      sourceRow: r + 1
    });
    sourceRows.push(r + 1);
  }
  return finishExtraction(month, volume, valueCol, null, accountMap, summaryMap, sourceRows);
}

export function extractRentaActualFromRows(rows, { month }) {
  const { headerRow, valueCol, cpuCol } = detectRentaMonthColumns(rows, month);
  const volume = detectRentaVolume(rows, valueCol);
  const accountMap = new Map();
  const summaryMap = new Map();
  for (let r = headerRow + 1; r < rows.length; r += 1) {
    const row = rows[r] || [];
    const codeCol = findAccountCodeColumn(row);
    if (codeCol === -1) continue;
    const amount = normalizeNumber(row[valueCol]);
    const summaryKey = sapSummaryKey(row) || cellText(row[codeCol + 2]).replace(/^\*+\s*/, "").trim().toUpperCase();
    addSummary(summaryMap, summaryKey, amount || 0, r + 1);
    addAccount(accountMap, {
      code: accountCode(row[codeCol]),
      descEn: cellText(row[codeCol + 1]) || cellText(row[codeCol]),
      amount,
      unit: normalizeNumber(row[cpuCol]),
      volume,
      sourceRow: r + 1
    });
  }
  return finishExtraction(month, volume, valueCol, cpuCol, accountMap, summaryMap, [...accountMap.values()].flatMap((x) => x.sourceRows));
}

export function detectFcstVolume(workbook, month, xlsx) {
  const sheetName = findSheetName(workbook, ["FCST CPU"]);
  if (!sheetName) return null;
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: true, defval: null });
  return normalizeNumber(rows?.[1]?.[month]) || null;
}

function addSummary(summaryMap, summaryKey, amount, sourceRow) {
  const label = SAP_SUMMARY_LABELS[summaryKey];
  if (!label) return;
  const current = summaryMap.get(label) || { label, amount26: 0, sourceKey: summaryKey, sourceRows: [] };
  current.amount26 += amount || 0;
  current.sourceRows.push(sourceRow);
  summaryMap.set(label, current);
}

function addAccount(accountMap, account) {
  const existing = accountMap.get(account.code);
  const unit = account.amount !== null && account.volume ? (account.amount / account.volume) * 1000 : account.unit ?? null;
  if (existing) {
    existing.amount = sumNullable(existing.amount, account.amount);
    existing.unit = existing.amount !== null && account.volume ? (existing.amount / account.volume) * 1000 : sumNullable(existing.unit, unit);
    existing.duplicateCount += 1;
    existing.sourceRows.push(account.sourceRow);
    return;
  }
  accountMap.set(account.code, {
    code: account.code,
    descEn: account.descEn,
    amount: account.amount,
    unit,
    volume: account.volume,
    duplicateCount: 1,
    sourceRows: [account.sourceRow]
  });
}

function finishExtraction(month, volume, valueCol, cpuCol, accountMap, summaryMap, sourceRows) {
  return {
    month,
    volume,
    valueCol,
    cpuCol,
    accounts: [...accountMap.values()].sort((a, b) => a.code.localeCompare(b.code, "zh-Hans-CN", { numeric: true })),
    summaryCategories: [...summaryMap.values()],
    sourceRows
  };
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
  for (let i = 0; i < Math.min(row.length, 8); i += 1) if (accountCode(row[i])) return i;
  return -1;
}

function sapSummaryKey(row) {
  for (const value of row.slice(0, 4)) {
    const label = cellText(value);
    if (label.startsWith("*")) return label.replace(/^\*+\s*/, "").trim().toUpperCase();
  }
  return "";
}

function detectRentaVolume(rows, valueCol) {
  for (let r = 0; r < Math.min(rows.length, 5); r += 1) {
    const row = rows[r] || [];
    for (let c = Math.max(0, valueCol - 2); c <= Math.min(row.length - 1, valueCol + 2); c += 1) {
      const value = normalizeNumber(row[c]);
      if (value !== null && value > 100) return value;
    }
  }
  return null;
}

function findRentaCpuColumn(row, valueCol, tokens) {
  for (let c = valueCol + 1; c < Math.min(row.length, valueCol + 4); c += 1) {
    const label = cellText(row[c]).toLowerCase();
    if (label.includes("cpu") && tokens.some((token) => label === token || label.includes(token))) return c;
  }
  return valueCol + 1;
}

function sumNullable(left, right) {
  if (left === null && right === null) return null;
  return (left || 0) + (right || 0);
}
