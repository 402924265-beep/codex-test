export function analysisKey(month, code) {
  return `${month}:${code}`;
}

export function parseEditableNumber(value) {
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildFactorSummary(items, month = 4) {
  const monthIndex = Math.max(0, Math.min(11, Number(month || 1) - 1));
  const normalized = (items || []).map((item, index) => {
    const actualMonths = normalizeMonths(item.actualMonths);
    const budgetMonths = normalizeMonths(item.budgetMonths);
    const typedActual = parseEditableNumber(item.actualCumulative);
    const hasMonthly = actualMonths.some((value) => value !== 0);
    const cumulative = hasMonthly ? sum(actualMonths.slice(0, monthIndex + 1)) : typedActual;
    const monthImpact = hasMonthly ? actualMonths[monthIndex] : typedActual;
    return {
      ...item,
      id: item.id || String(index + 1),
      type: item.type === "increase" ? "increase" : "decrease",
      actualMonths,
      budgetMonths,
      monthlyImpact: Math.abs(monthImpact || 0),
      cumulativeImpact: Math.abs(cumulative || 0),
      yearImpact: sum(budgetMonths.map(Math.abs))
    };
  });
  const increases = normalized.filter((item) => item.type === "increase");
  const decreases = normalized.filter((item) => item.type === "decrease");
  return {
    items: normalized,
    increases,
    decreases,
    increaseMonth: sum(increases.map((item) => item.monthlyImpact)),
    decreaseMonth: sum(decreases.map((item) => item.monthlyImpact)),
    increaseCumulative: sum(increases.map((item) => item.cumulativeImpact)),
    decreaseCumulative: sum(decreases.map((item) => item.cumulativeImpact)),
    netCumulative: sum(increases.map((item) => item.cumulativeImpact)) - sum(decreases.map((item) => item.cumulativeImpact)),
    yearImpact: sum(increases.map((item) => item.yearImpact)) - sum(decreases.map((item) => item.yearImpact))
  };
}

export function buildAutoSummary(result, analyses, _factorSummary, forecastSnapshot = null) {
  if (!result) return "导入 SAP 报表后生成本月总结。";
  const totalUnit = result.summary.totalUnitDiff;
  const manufacturingDiff = result.summary.manufacturingDiff;
  const direction = totalUnit <= 0 ? "下降" : "上升";
  const quality = totalUnit <= 0 ? "优化" : "恶化";
  const reasonLines = result.rows
    .map((row) => ({
      row,
      reason: (analyses?.[analysisKey(result.month, row.code)] || analyses?.[row.code] || "").trim()
    }))
    .filter((item) => item.reason)
    .sort((a, b) => Math.abs(b.row.manufacturingDiff || b.row.unitDiff || 0) - Math.abs(a.row.manufacturingDiff || a.row.unitDiff || 0))
    .slice(0, 8)
    .map(({ row, reason }, index) => `${index + 1}. ${row.code} ${row.descEn}: ${reason}`);
  const forecastLine = forecastSnapshot?.unitCost
    ? `4+8预测口径：本月单台 ${formatNumber(forecastSnapshot.unitCost)} 欧/台，金额 ${formatKeur(forecastSnapshot.amount)}。`
    : "";
  return [
    `总结：${result.month}月洗碗机单台制造费同比${direction}${Math.abs(totalUnit || 0).toFixed(2)}欧，表现为${quality}；制造费差额 ${formatKeur(manufacturingDiff)}。`,
    forecastLine,
    reasonLines.length ? `重点科目原因：\n${reasonLines.join("\n")}` : "重点科目原因：暂无需要解释的科目。"
  ].filter(Boolean).join("\n");
}

function normalizeMonths(values) {
  return Array.from({ length: 12 }, (_, index) => parseEditableNumber(values?.[index]));
}

function sum(values) {
  return (values || []).reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

function formatKeur(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-- K€";
  return `${Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 1 })} K€`;
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}
