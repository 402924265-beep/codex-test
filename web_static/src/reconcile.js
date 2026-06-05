import { ACCOUNT_INFO } from "./baseline-data.js";

const SUMMARY_LABELS = {
  CS_DEPRECIATION: "折旧（含FC）",
  "CS_DIRECT LABOUR": "直接人工",
  "CS_DIRECT LABOR": "直接人工",
  CS_SCRAP_VARIABLE: "可回收废料",
  "CS_FIX COST": "运营费",
  "CS_VARIABLE COST": "生产耗用品",
  CS_OBSOLESCENCE: "存货跌价准备",
  CS_RESELLING: "Scrap selling",
  "CS_FIX UTILITIES": "固定能源费",
  "CS_VARIABLE UTILITIES": "变动能源费",
  "CS_INDIRECT LABOUR": "间接人工成本-辅助人员",
  "CS_INDIRECT LABOR": "间接人工成本-辅助人员",
  "CS_FIXED LABOUR": "固定人工-白领",
  "CS_FIXED LABOR": "固定人工-白领",
  CS_SEMIFIX: "半固定-班车/工作服",
  CS_OVH_ADM: "分摊费用"
};

const HIGH_AMOUNT_DIFF = 10;
const HIGH_UNIT_DIFF = 0.1;

export function buildReconciliation({
  baseline25,
  budget26 = null,
  actual26,
  forecast4plus8 = null,
  month = 1,
  categoryOrder = [],
  narrative = null
}) {
  const baselineAccounts = Array.isArray(baseline25) ? baseline25 : baseline25?.accounts || [];
  const budgetAccounts = Array.isArray(budget26) ? budget26 : budget26?.accounts || [];
  const baselineByCode = groupBaselineAccounts(baselineAccounts.map(normalizeBaselineAccount));
  const actualByCode = new Map(actual26.accounts.map((row) => [row.code, row]));
  const budgetByCode = groupBudgetAccounts(budgetAccounts.map(normalizeBudgetAccount));
  const codes = [...new Set([...baselineByCode.keys(), ...actualByCode.keys(), ...budgetByCode.keys()])].sort((a, b) =>
    a.localeCompare(b, "zh-Hans-CN", { numeric: true })
  );

  const rows = codes.map((code) => {
    const base = baselineByCode.get(code);
    const actual = actualByCode.get(code);
    const budget = budgetByCode.get(code);
    const category = categoryForAccount(actual || base || budget);
    const amount25 = base?.amount25 ?? null;
    const unit25 = base?.unit25 ?? null;
    const amount26 = actual?.amount ?? null;
    const unit26 = actual?.unit ?? null;
    const amountBudget = budget?.amountBudget ?? null;
    const unitBudget = budget?.unitBudget ?? null;
    const amountDiff = diffWithMissingZero(amount26, amount25);
    const unitDiff = diffWithMissingZero(unit26, unit25);
    const manufacturingDiff = unitDiff === null || !actual26.volume ? null : (unitDiff * actual26.volume) / 1000;
    const status = rowStatus(base, actual);
    return {
      code,
      descEn: actual?.descEn || base?.descEn || budget?.descEn || "",
      category,
      amount25,
      amount26,
      amountBudget,
      amountDiff,
      budgetDiff: diffNullable(amount26, amountBudget),
      manufacturingDiff,
      unit25,
      unit26,
      unitBudget,
      unitDiff,
      unitBudgetDiff: diffNullable(unit26, unitBudget),
      status,
      statusLabel: statusLabel(status),
      sourceRows26: actual?.sourceRows || [],
      isHighImpact: Math.abs(manufacturingDiff || 0) >= HIGH_AMOUNT_DIFF || Math.abs(unitDiff || 0) >= HIGH_UNIT_DIFF,
      analysis: ""
    };
  });

  const categories = summarizeCategories(rows, actual26.summaryCategories || [], budget26, forecast4plus8, categoryOrder);
  const summary = buildSummary(rows, actual26.volume, baseline25?.volume, budget26?.volume, forecast4plus8);
  const referenceChecks = summarizeForHiddenReference(actual26.summaryCategories || [], forecast4plus8, month, summary.totalAmount26);

  return { month, volume26: actual26.volume, rows, categories, summary, referenceChecks, narrative };
}

export function categoryForAccount(account) {
  if (account?.category) return account.category;
  const key = String(account?.summaryKey || "").toUpperCase();
  if (SUMMARY_LABELS[key]) return SUMMARY_LABELS[key];
  const haystack = [account?.descEn, account?.descCn, account?.code].filter(Boolean).join(" ").toLowerCase();
  if (haystack.includes("functional currency") || haystack.includes("depreciation") || haystack.includes("amortization")) {
    return "折旧（含FC）";
  }
  if (haystack.includes("scrap selling") || haystack.includes("sales of scrapped") || haystack.includes("reselling")) {
    return "Scrap selling";
  }
  return "其他制造费";
}

export function summarizeForHiddenReference(summaryCategories, forecast4plus8, month, actualTotal = null) {
  const forecast = forecast4plus8?.[month] || forecast4plus8;
  if (!forecast) return { available: false, totalStatus: "missing", totalDiff: null, items: [] };
  const actualByLabel = new Map(summaryCategories.map((item) => [item.label, item.amount26]));
  const categories = forecast.categories || [];
  const items = categories.map((item) => {
    const actual = actualByLabel.get(item.label);
    const referenceAmount26 = item.amountForecast ?? item.amount26 ?? null;
    const diff = actual === undefined || referenceAmount26 === null ? null : actual - referenceAmount26;
    return {
      label: item.label,
      amount26: actual ?? null,
      referenceAmount26,
      diff,
      status: diff === null ? "missing" : Math.abs(diff) <= 0.02 ? "ok" : "warning"
    };
  });
  const totalDiff = actualTotal === null || forecast.total === null || forecast.total === undefined ? null : actualTotal - forecast.total;
  return {
    available: true,
    totalReference: forecast.total,
    fcReference: forecast.fcReference,
    totalDiff,
    totalStatus: totalDiff === null ? "unknown" : Math.abs(totalDiff) <= 2 ? "ok" : "warning",
    items
  };
}

function summarizeCategories(rows, summaryCategories, budget26, forecast4plus8, categoryOrder) {
  const byCategory = new Map();
  for (const row of rows) {
    const current = byCategory.get(row.category) || emptyCategory(row.category);
    current.amount25 += row.amount25 || 0;
    current.amount26 += row.amount26 || 0;
    current.amountBudget += row.amountBudget || 0;
    current.manufacturingDiff += row.manufacturingDiff || 0;
    current.unit25 += row.unit25 || 0;
    current.unit26 += row.unit26 || 0;
    current.unitBudget += row.unitBudget || 0;
    current.count += 1;
    byCategory.set(row.category, current);
  }

  for (const item of summaryCategories) {
    const category = categoryForAccount({ category: item.label });
    const current = byCategory.get(category) || emptyCategory(category);
    current.amount26 = item.amount26 || current.amount26;
    byCategory.set(category, current);
  }

  for (const item of budget26?.categories || []) {
    const current = byCategory.get(item.label) || emptyCategory(item.label);
    current.amountBudget = item.amountBudget || 0;
    byCategory.set(item.label, current);
  }

  for (const item of forecast4plus8?.categories || []) {
    const current = byCategory.get(item.label) || emptyCategory(item.label);
    current.amountForecast = item.amountForecast ?? null;
    byCategory.set(item.label, current);
  }

  for (const item of byCategory.values()) {
    item.amountDiff = item.amount26 - item.amount25;
    item.budgetDiff = item.amount26 - item.amountBudget;
    item.unitDiff = item.unit26 - item.unit25;
    item.unitBudgetDiff = item.unit26 - item.unitBudget;
  }

  return [...byCategory.values()].sort((a, b) => categoryIndex(a.category, categoryOrder) - categoryIndex(b.category, categoryOrder));
}

function buildSummary(rows, volume26, volume25, volumeBudget, forecast4plus8) {
  const totalAmount25 = sum(rows, "amount25");
  const totalAmount26 = sum(rows, "amount26");
  const totalAmountBudget = sum(rows, "amountBudget");
  const totalUnit25 = totalAmount25 && volume25 ? (totalAmount25 / volume25) * 1000 : sum(rows, "unit25");
  const totalUnit26 = totalAmount26 && volume26 ? (totalAmount26 / volume26) * 1000 : sum(rows, "unit26");
  const totalUnitBudget = totalAmountBudget && volumeBudget ? (totalAmountBudget / volumeBudget) * 1000 : sum(rows, "unitBudget");
  const totalUnitDiff = diffNullable(totalUnit26, totalUnit25);
  const manufacturingDiff = totalUnitDiff === null || !volume26 ? null : (totalUnitDiff * volume26) / 1000;

  return {
    totalAmount25,
    totalAmount26,
    totalAmountBudget,
    totalAmountForecast: forecast4plus8?.total ?? null,
    totalAmountDiff: totalAmount26 - totalAmount25,
    totalBudgetDiff: totalAmount26 - totalAmountBudget,
    manufacturingDiff,
    totalUnit25,
    totalUnit26,
    totalUnitBudget,
    totalUnitForecast: forecast4plus8?.unit ?? null,
    totalUnitDiff,
    totalUnitBudgetDiff: diffNullable(totalUnit26, totalUnitBudget),
    highImpactCount: rows.filter((row) => row.isHighImpact).length,
    only25Count: rows.filter((row) => row.status === "only_25").length,
    only26Count: rows.filter((row) => row.status === "only_26").length,
    budgetMissingCount: rows.filter((row) => row.amount26 !== null && row.amountBudget === null).length
  };
}

function emptyCategory(category) {
  return {
    category,
    amount25: 0,
    amount26: 0,
    amountBudget: 0,
    amountForecast: null,
    amountDiff: 0,
    budgetDiff: 0,
    manufacturingDiff: 0,
    unit25: 0,
    unit26: 0,
    unitBudget: 0,
    unitDiff: 0,
    unitBudgetDiff: 0,
    count: 0
  };
}

function categoryIndex(category, order) {
  const index = order.indexOf(category);
  return index === -1 ? order.length + category.localeCompare("其他制造费", "zh-Hans-CN") : index;
}

function rowStatus(base, actual) {
  const left = base && (base.amount25 !== null || base.unit25 !== null);
  const right = actual && (actual.amount !== null || actual.unit !== null);
  return left && right ? "both" : left ? "only_25" : "only_26";
}

function groupBaselineAccounts(accounts) {
  const grouped = new Map();
  for (const row of accounts) {
    const current = grouped.get(row.code) || { ...row, amount25: 0, unit25: 0 };
    current.descEn = current.descEn || row.descEn;
    current.category = current.category || row.category;
    current.summaryKey = current.summaryKey || row.summaryKey;
    current.amount25 += row.amount25 || 0;
    current.unit25 += row.unit25 || 0;
    grouped.set(row.code, current);
  }
  return grouped;
}

function normalizeBaselineAccount(row) {
  if (!Array.isArray(row)) return row;
  const info = ACCOUNT_INFO?.[row[0]] || [];
  if (row.length === 3) {
    return {
      code: row[0],
      descEn: info[0] || "",
      category: info[1] || "",
      summaryKey: info[2] || "",
      amount25: row[1],
      unit25: row[2]
    };
  }
  return {
    code: row[0],
    descEn: row[1],
    category: row[2],
    summaryKey: row[3],
    amount25: row[4],
    unit25: row[5]
  };
}

function groupBudgetAccounts(accounts) {
  const grouped = new Map();
  for (const row of accounts) {
    const current = grouped.get(row.code) || { ...row, amountBudget: 0, unitBudget: 0 };
    current.descEn = current.descEn || row.descEn;
    current.category = current.category || row.category;
    current.summaryKey = current.summaryKey || row.summaryKey;
    current.amountBudget += row.amountBudget || 0;
    current.unitBudget += row.unitBudget || 0;
    grouped.set(row.code, current);
  }
  return grouped;
}

function normalizeBudgetAccount(row) {
  if (!Array.isArray(row)) return row;
  const info = ACCOUNT_INFO?.[row[0]] || [];
  if (row.length === 3) {
    return {
      code: row[0],
      descEn: info[0] || "",
      category: info[1] || "",
      summaryKey: info[2] || "",
      amountBudget: row[1],
      unitBudget: row[2]
    };
  }
  return {
    code: row[0],
    descEn: row[1],
    category: row[2],
    summaryKey: row[3],
    amountBudget: row[4],
    unitBudget: row[5]
  };
}

function statusLabel(status) {
  return { both: "两边都有", only_25: "25有26无", only_26: "26有25无" }[status] || "";
}

function diffNullable(left, right) {
  if (left === null || left === undefined || right === null || right === undefined) return null;
  return left - right;
}

function diffWithMissingZero(left, right) {
  if ((left === null || left === undefined) && (right === null || right === undefined)) return null;
  return (left || 0) - (right || 0);
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + (row[key] || 0), 0);
}
