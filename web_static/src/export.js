import { loadXlsx } from "./xlsx-loader.js";
import { analysisKey } from "./workbench.js";

const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

export async function exportAnalysisWorkbook({
  result = null,
  analyses = {},
  dashboardRows = [],
  factors = [],
  factorSummary = null,
  forecast = null
} = {}) {
  const XLSX = await loadXlsx();
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildDashboardSheet(dashboardRows, forecast)), "全年驾驶舱");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildVarianceSheet(result, analyses)), "月度差异");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildFactorSheet(factors, factorSummary)), "项目因素");

  const month = result?.month ? `${result.month}月` : "全年";
  XLSX.writeFile(wb, `洗碗机制造费三张表_${month}.xlsx`);
}

function buildDashboardSheet(rows, forecast) {
  if (!rows?.length) return [{ 说明: "未导入4+8预测文件，全年驾驶舱为空。" }];
  const output = rows.map((row) => {
    const record = { 分组: row.group || "", 指标: row.label, 口径: row.scenario || "", 单位: row.unit };
    row.values.forEach((value, index) => {
      record[MONTHS[index]] = round(value);
    });
    record.年度口径 = round(annualValue(row));
    return record;
  });
  if (forecast?.parsedAt) {
    output.push({ 指标: "数据来源", 单位: forecast.source || "4+8 forecast", 年度口径: forecast.parsedAt });
  }
  return output;
}

function buildVarianceSheet(result, analyses) {
  if (!result) return [{ 说明: "未导入SAP实际报表，月度差异为空。" }];
  const summary = [
    {
      类型: "月度总结",
      账户编码: "",
      英文描述: "",
      大科目: "",
      "25同期K€": round(result.summary.totalAmount25),
      "26预算K€": round(result.summary.totalAmountBudget),
      "26实际K€": round(result.summary.totalAmount26),
      "实际-同期K€": round(result.summary.totalAmountDiff),
      "制造费差额K€": round(result.summary.manufacturingDiff),
      "25单台€/台": round(result.summary.totalUnit25),
      "26单台€/台": round(result.summary.totalUnit26),
      "单台差异€/台": round(result.summary.totalUnitDiff),
      差异分析: ""
    }
  ];
  const rows = result.rows.map((row) => ({
    类型: Math.abs(row.unitDiff || 0) >= 0.5 ? "重点科目" : "普通科目",
    账户编码: row.code,
    英文描述: row.descEn,
    大科目: row.category,
    "25同期K€": round(row.amount25),
    "26预算K€": round(row.amountBudget),
    "26实际K€": round(row.amount26),
    "实际-同期K€": round(row.amountDiff),
    "实际-预算K€": round(row.budgetDiff),
    "制造费差额K€": round(row.manufacturingDiff),
    "25单台€/台": round(row.unit25),
    "26预算单台€/台": round(row.unitBudget),
    "26单台€/台": round(row.unit26),
    "单台差异€/台": round(row.unitDiff),
    差异分析: analyses[analysisKey(result.month, row.code)] || analyses[row.code] || ""
  }));
  return [...summary, ...rows];
}

function buildFactorSheet(factors, summary) {
  const header = summary ? [
    {
      类型: "汇总",
      分类: "",
      原因路径: "",
      关键项目: "",
      责任人: "",
      到位时间: "",
      "影响K€": round(summary.netCumulative),
      进展: `上涨累计 ${round(summary.increaseCumulative)} K€；下降累计 ${round(summary.decreaseCumulative)} K€`
    }
  ] : [];
  const rows = (factors || []).map((item) => ({
    类型: item.type === "increase" ? "上涨因素" : "下降因素",
    分类: item.category || "",
    原因路径: item.strategy || "",
    关键项目: item.project || "",
    责任人: item.owner || "",
    到位时间: item.timing || "",
    "影响K€": round(item.actualCumulative),
    进展: item.progress || ""
  }));
  return rows.length ? [...header, ...rows] : [{ 说明: "尚未填写上涨/下降因素。" }];
}

function round(value) {
  return value === null || value === undefined || Number.isNaN(value) ? "" : Math.round(value * 100000) / 100000;
}

function sum(values) {
  return (values || []).reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

function annualValue(row) {
  const values = row.values || [];
  if (row.label?.includes("累计") || ["€/台", "台/人"].includes(row.unit)) return lastNumber(values);
  if (row.unit === "人") {
    const valid = values.filter(Number.isFinite);
    return valid.length ? sum(valid) / valid.length : null;
  }
  return sum(values);
}

function lastNumber(values) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (Number.isFinite(values[index])) return values[index];
  }
  return null;
}
