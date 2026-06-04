const CORE_DASHBOARD_METRICS = [
  "洗碗机定单量",
  "洗碗机定单量（累计）",
  "洗碗机费用金额",
  "洗碗机费用金额（累计）",
  "洗碗机单台",
  "洗碗机单台（累计）",
  "洗碗机制造费差额",
  "洗碗机制造费累计差额",
  "洗碗机收入",
  "洗碗机收入（累计）",
  "洗碗机制造费率",
  "洗碗机制造费率（累计）"
];

const SCENARIO_ALIASES = {
  "同期": "same",
  "目标": "budget",
  "26年": "actual",
  "差额": "diff",
  "累计差额": "diff"
};

export function buildDashboardRows(source, monthIndex = 3) {
  const rowMap = new Map();
  for (const row of source?.rows || []) {
    const normalizedMetric = normalizeMetric(row.metric);
    if (!CORE_DASHBOARD_METRICS.includes(normalizedMetric)) continue;
    const entry = rowMap.get(normalizedMetric) || {
      metric: normalizedMetric,
      same: null,
      budget: null,
      actual: null,
      diff: null,
      rate: null,
      status: "neutral"
    };
    const key = SCENARIO_ALIASES[row.scenario] || null;
    if (!key) continue;
    entry[key] = valueAt(row, monthIndex);
    rowMap.set(normalizedMetric, entry);
  }

  const rows = CORE_DASHBOARD_METRICS
    .map((metric) => rowMap.get(normalizeMetric(metric)))
    .filter(Boolean)
    .map((row) => {
      const calculatedDiff = numberOrNull(row.actual) !== null && numberOrNull(row.same) !== null
        ? numberOrNull(row.actual) - numberOrNull(row.same)
        : numberOrNull(row.diff);
      const rate = numberOrNull(row.same) ? calculatedDiff / Math.abs(numberOrNull(row.same)) : null;
      return {
        ...row,
        diff: row.diff ?? calculatedDiff,
        rate,
        status: varianceStatus(row.metric, calculatedDiff)
      };
    });

  return rows;
}

export function buildFactorSummary(items, month = 4) {
  const monthIndex = Math.max(0, Number(month || 1) - 1);
  const normalized = (items || []).map((item, index) => ({
    ...item,
    id: item.id || String(index + 1),
    monthlyImpact: numberOrNull(item.actualMonths?.[monthIndex]) ?? numberOrNull(item.budgetMonths?.[monthIndex]) ?? 0,
    cumulativeImpact: sum((item.actualMonths || item.budgetMonths || []).slice(0, monthIndex + 1)),
    yearImpact: sum(item.budgetMonths || [])
  }));
  const increases = normalized.filter((item) => item.type === "increase");
  const decreases = normalized.filter((item) => item.type !== "increase");
  return {
    items: normalized,
    increases,
    decreases,
    increaseMonth: sum(increases.map((item) => item.monthlyImpact)),
    decreaseMonth: sum(decreases.map((item) => item.monthlyImpact)),
    increaseCumulative: sum(increases.map((item) => item.cumulativeImpact)),
    decreaseCumulative: sum(decreases.map((item) => item.cumulativeImpact)),
    netCumulative: sum(normalized.map((item) => item.cumulativeImpact)),
    yearImpact: sum(normalized.map((item) => item.yearImpact))
  };
}

export function buildAutoSummary(result, analyses, factorSummary) {
  if (!result) return "导入SAP报表后生成本月总结。";
  const month = result.month;
  const totalUnit = result.summary.totalUnitDiff;
  const manufacturingDiff = result.summary.manufacturingDiff;
  const direction = totalUnit <= 0 ? "优化" : "恶化";
  const importantRows = result.rows
    .filter((row) => row.isHighImpact)
    .slice()
    .sort((a, b) => Math.abs(b.unitDiff || 0) - Math.abs(a.unitDiff || 0))
    .slice(0, 5);
  const reasonLines = importantRows.map((row) => {
    const reason = analyses?.[analysisKey(result.month, row.code)] || analyses?.[row.code] || "待填写原因";
    return `${row.code} ${row.descEn}: ${reason}`;
  });
  return [
    `${month}月洗碗机单台制造费同比${direction}${Math.abs(totalUnit || 0).toFixed(2)}欧，制造费差额${formatKeur(manufacturingDiff)}。`,
    `上涨因素累计${formatKeur(factorSummary?.increaseCumulative)}，下降因素累计${formatKeur(factorSummary?.decreaseCumulative)}，净影响${formatKeur(factorSummary?.netCumulative)}。`,
    reasonLines.length ? `重点科目：\n${reasonLines.join("\n")}` : "重点科目：暂无需要解释的科目。"
  ].join("\n");
}

export function analysisKey(month, code) {
  return `${month}:${code}`;
}

export function parseEditableNumber(value) {
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function valueAt(row, monthIndex) {
  if (monthIndex === "year") return row.year ?? null;
  return row.months?.[monthIndex] ?? null;
}

function normalizeMetric(metric) {
  return String(metric || "").replace("(", "（").replace(")", "）");
}

function varianceStatus(metric, diff) {
  const value = numberOrNull(diff);
  if (value === null || Math.abs(value) < 0.0001) return "neutral";
  const lowerIsGood = metric.includes("费用") || metric.includes("单台") || metric.includes("费率") || metric.includes("差额");
  const good = lowerIsGood ? value < 0 : value > 0;
  return good ? "good" : "bad";
}

function numberOrNull(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sum(values) {
  return (values || []).reduce((total, value) => total + (numberOrNull(value) || 0), 0);
}

function formatKeur(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-- K€";
  return `${Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 1 })} K€`;
}
