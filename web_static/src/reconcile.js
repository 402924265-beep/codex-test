const CATEGORY_RULES = [
  {
    name: "折旧（含FC）",
    keywords: ["cs_depreciation", "depreciation", "amortization", "functional currency", "currency impact"]
  },
  {
    name: "固定人工",
    keywords: ["indirect labour", "indirect labor", "fixed labour", "fixed labor", "white collar", "salary-white"]
  },
  {
    name: "固定费用",
    keywords: ["semifix", "fixed utilities", "fix cost", "fixed cost", "g&a", "association dues", "it expense", "overhead"]
  },
  {
    name: "直接人工",
    keywords: ["direct labour", "direct labor", "blue collar direct", "cs_direct"]
  },
  {
    name: "变动费用",
    keywords: ["variable", "scrap", "production consumable", "inventory", "obsolete", "reselling", "asset sales"]
  },
  {
    name: "分摊费用",
    keywords: ["ovh_adm", "charge out", "allocation"]
  }
];

const STATUS_LABELS = {
  both: "两边都有",
  only_25: "25有26无",
  only_26: "26有25无"
};

const HIGH_AMOUNT_DIFF = 10;
const HIGH_UNIT_DIFF = 0.1;

export function buildReconciliation({ baseline25, actual26, reference4plus8 = {}, month = 1 }) {
  const baselineByCode = new Map(baseline25.map((row) => [row.code, row]));
  const actualByCode = new Map(actual26.accounts.map((row) => [row.code, row]));
  const codes = [...new Set([...baselineByCode.keys(), ...actualByCode.keys()])].sort((a, b) =>
    a.localeCompare(b, "zh-Hans-CN", { numeric: true })
  );

  const rows = codes.map((code) => {
    const left = baselineByCode.get(code);
    const right = actualByCode.get(code);
    const category = categoryForAccount(right || left);
    const amount25 = left?.amount25 ?? null;
    const unit25 = left?.unit25 ?? null;
    const amount26 = right?.amount ?? null;
    const unit26 = right?.unit ?? null;
    const amountDiff = diffNullable(amount26, amount25);
    const unitDiff = diffNullable(unit26, unit25);
    const leftHasValue = left && (amount25 !== null || unit25 !== null);
    const rightHasValue = right && (amount26 !== null || unit26 !== null);
    const status = leftHasValue && rightHasValue ? "both" : leftHasValue ? "only_25" : "only_26";
    return {
      code,
      descEn: right?.descEn || left?.descEn || "",
      category,
      amount25,
      amount26,
      amountDiff,
      unit25,
      unit26,
      unitDiff,
      status,
      statusLabel: STATUS_LABELS[status],
      sourceRows26: right?.sourceRows || [],
      isHighImpact: Math.abs(amountDiff || 0) >= HIGH_AMOUNT_DIFF || Math.abs(unitDiff || 0) >= HIGH_UNIT_DIFF,
      analysis: ""
    };
  });

  const categories = summarizeCategories(rows, actual26.summaryCategories || []);
  const summary = buildSummary(rows, actual26.volume);
  const referenceChecks = summarizeForHiddenReference(actual26.summaryCategories || [], reference4plus8, month, summary.totalAmount26);

  return { month, volume26: actual26.volume, rows, categories, summary, referenceChecks };
}

export function categoryForAccount(account) {
  const haystack = [account?.summaryKey, account?.category, account?.descEn, account?.descCn, account?.code]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) return rule.name;
  }
  return "其他制造费";
}

export function summarizeForHiddenReference(summaryCategories, reference4plus8, month, actualTotal = null) {
  const reference = reference4plus8?.[month];
  if (!reference) return { available: false, totalStatus: "missing", totalDiff: null, items: [] };
  const actualByLabel = new Map(summaryCategories.map((item) => [item.label, item.amount26]));
  const items = reference.categories.map((item) => {
    const actual = actualByLabel.get(item.label);
    const diff = actual === undefined ? null : actual - item.amount26;
    return {
      label: item.label,
      amount26: actual ?? null,
      referenceAmount26: item.amount26,
      diff,
      status: diff === null ? "missing" : Math.abs(diff) <= 0.02 ? "ok" : "warning"
    };
  });
  const totalDiff = actualTotal === null ? null : actualTotal - reference.total;
  return {
    available: true,
    totalReference: reference.total,
    fcReference: reference.fcReference,
    totalDiff,
    totalStatus: totalDiff === null ? "unknown" : Math.abs(totalDiff) <= 2 ? "ok" : "warning",
    items
  };
}

function summarizeCategories(rows, summaryCategories) {
  const byCategory = new Map();
  for (const row of rows) {
    const current = byCategory.get(row.category) || {
      category: row.category,
      amount25: 0,
      amount26: 0,
      amountDiff: 0,
      unit25: 0,
      unit26: 0,
      unitDiff: 0,
      count: 0
    };
    current.amount25 += row.amount25 || 0;
    current.amount26 += row.amount26 || 0;
    current.amountDiff = current.amount26 - current.amount25;
    current.unit25 += row.unit25 || 0;
    current.unit26 += row.unit26 || 0;
    current.unitDiff = current.unit26 - current.unit25;
    current.count += 1;
    byCategory.set(row.category, current);
  }

  const summaryByCategory = new Map();
  for (const item of summaryCategories) {
    const category = categoryForSummaryLabel(item.label);
    summaryByCategory.set(category, (summaryByCategory.get(category) || 0) + (item.amount26 || 0));
  }

  for (const [category, amount26] of summaryByCategory.entries()) {
    const current = byCategory.get(category) || {
      category,
      amount25: 0,
      amount26: 0,
      amountDiff: 0,
      unit25: 0,
      unit26: 0,
      unitDiff: 0,
      count: 0
    };
    current.amount26 = amount26;
    current.amountDiff = current.amount26 - current.amount25;
    byCategory.set(category, current);
  }

  return [...byCategory.values()].sort((a, b) => Math.abs(b.amountDiff) - Math.abs(a.amountDiff));
}

function categoryForSummaryLabel(label) {
  if (["折旧（含FC）"].includes(label)) return "折旧（含FC）";
  if (["直接人工"].includes(label)) return "直接人工";
  if (["间接人工成本-辅助人员", "固定人工-白领"].includes(label)) return "固定人工";
  if (["可回收废料", "生产耗用品", "存货跌价准备", "废品回收", "变动能源费"].includes(label)) return "变动费用";
  if (["分摊费用"].includes(label)) return "分摊费用";
  return "固定费用";
}

function buildSummary(rows, volume26) {
  const totalAmount25 = sum(rows.map((row) => row.amount25));
  const totalAmount26 = sum(rows.map((row) => row.amount26));
  const totalUnit25 = sum(rows.map((row) => row.unit25));
  const totalUnit26 = volume26 ? (totalAmount26 / volume26) * 1000 : sum(rows.map((row) => row.unit26));
  return {
    totalAmount25,
    totalAmount26,
    totalAmountDiff: totalAmount26 - totalAmount25,
    totalUnit25,
    totalUnit26,
    totalUnitDiff: totalUnit26 - totalUnit25,
    bothCount: rows.filter((row) => row.status === "both").length,
    only25Count: rows.filter((row) => row.status === "only_25").length,
    only26Count: rows.filter((row) => row.status === "only_26").length,
    highImpactCount: rows.filter((row) => row.isHighImpact).length
  };
}

function sum(values) {
  return values.reduce((total, value) => total + (value || 0), 0);
}

function diffNullable(right, left) {
  if (right === null && left === null) return null;
  return (right || 0) - (left || 0);
}
