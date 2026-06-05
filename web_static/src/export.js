import { loadXlsx } from "./xlsx-loader.js";
import { analysisKey } from "./workbench.js";

const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
const SCENARIO_ORDER = ["同期", "预算", "26年", "差额", "累计差额"];

export async function exportAnalysisWorkbook(input = {}) {
  const XLSX = await loadXlsx();
  const wb = XLSX.utils.book_new();
  const sheets = buildAnalysisWorkbookSheets(input);

  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    ws["!cols"] = sheet.cols || defaultColumns(sheet.rows);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }

  const month = input.result?.month ? `${input.result.month}月` : "全年";
  XLSX.writeFile(wb, `洗碗机制造费三张表_${month}.xlsx`);
}

export function buildAnalysisWorkbookSheets({
  result = null,
  analyses = {},
  dashboardRows = [],
  factors = [],
  factorSummary = null,
  forecast = null
} = {}) {
  return [
    { name: "洗碗机成本数据", rows: buildCostDataSheet(dashboardRows, forecast), cols: wideMonthColumns() },
    { name: "费用指标到月测算汇总表", rows: buildMonthlyMetricSheet(result), cols: monthlyMetricColumns() },
    { name: "月度差异明细", rows: buildVarianceDetailSheet(result, analyses), cols: varianceColumns() },
    { name: "26年降费项目-洗碗机", rows: buildFactorSheet(factors, factorSummary), cols: factorColumns() },
    { name: "口径说明", rows: buildFormulaSheet(forecast, result), cols: [{ wch: 22 }, { wch: 90 }] }
  ];
}

function buildCostDataSheet(rows, forecast) {
  if (!rows?.length) {
    return [{ 指标: "说明", 口径: "待导入4+8/5+7滚动预测", 单位: "", 年度: "" }];
  }

  const grouped = new Map();
  for (const row of rows) {
    if (!["核心", "差异", "效率"].includes(row.group)) continue;
    const key = `${row.group}|${row.label}|${row.unit}`;
    if (!grouped.has(key)) grouped.set(key, { group: row.group, label: row.label, unit: row.unit, rows: [] });
    grouped.get(key).rows.push(row);
  }

  const output = [];
  for (const item of grouped.values()) {
    const ordered = [...item.rows].sort((a, b) => SCENARIO_ORDER.indexOf(a.scenario) - SCENARIO_ORDER.indexOf(b.scenario));
    const record = { 分组: item.group, 指标: item.label, 单位: item.unit };
    for (let index = 0; index < 12; index += 1) {
      for (const row of ordered) {
        record[`${MONTHS[index]}${row.scenario}`] = round(row.values[index]);
      }
    }
    record.年度 = round(annualValue(ordered.find((row) => row.scenario === "26年") || ordered.at(-1)));
    output.push(record);
  }

  output.push({
    分组: "数据来源",
    指标: "滚动预测",
    单位: forecast?.source || "4+8/5+7 forecast",
    年度: forecast?.parsedAt || ""
  });
  return output;
}

function buildMonthlyMetricSheet(result) {
  if (!result) return [{ 指标: "说明", 同期: "待导入SAP实际报表", 目标预算: "", 实际: "", 差异: "", 幅度: "" }];
  const summary = result.summary || {};
  return [
    metricRow("定单量（累计）", result.volume25, result.volumeBudget, result.volume26, result.volume26 - result.volume25, "台"),
    metricRow("费用金额", summary.totalAmount25, summary.totalAmountBudget, summary.totalAmount26, summary.totalAmountDiff, "K€"),
    metricRow("单台制造费", summary.totalUnit25, summary.totalUnitBudget, summary.totalUnit26, summary.totalUnitDiff, "€/台"),
    metricRow("制造费差额", "", "", summary.manufacturingDiff, summary.manufacturingDiff, "K€"),
    metricRow("待确认公式：UPPH", "", "", "", "", "台/时"),
    metricRow("待确认公式：用人", "", "", "", "", "人")
  ];
}

function metricRow(name, same, budget, actual, diff, unit) {
  const width = Number.isFinite(same) && Number.isFinite(actual) && same !== 0 ? diff / same : null;
  return {
    指标: name,
    同期: round(same),
    目标预算: round(budget),
    实际: round(actual),
    差异: round(diff),
    幅度: width === null ? "" : `${round(width * 100)}%`,
    单位: unit
  };
}

function buildVarianceDetailSheet(result, analyses) {
  if (!result) return [{ 类型: "说明", 账户编码: "", 英文描述: "待导入SAP实际报表", 大科目: "", 差异分析: "" }];
  const summary = result.summary || {};
  const summaryRows = [
    {
      类型: "月度总结",
      账户编码: "",
      英文描述: `${result.month}月洗碗机单台制造费同比${formatTrend(summary.totalUnitDiff)}${absText(summary.totalUnitDiff)}欧；制造费差额${round(summary.manufacturingDiff)} K€`,
      大科目: "",
      "25同期K€": round(summary.totalAmount25),
      "26预算K€": round(summary.totalAmountBudget),
      "26实际K€": round(summary.totalAmount26),
      "实际-同期K€": round(summary.totalAmountDiff),
      "单台差异€/台": round(summary.totalUnitDiff),
      差异分析: "由下方大科目和小科目原因汇总"
    }
  ];
  const categoryRows = (result.summaryCategories || []).map((item) => ({
    类型: "大科目汇总",
    账户编码: "",
    英文描述: "",
    大科目: item.label,
    "25同期K€": round(item.amount25),
    "26预算K€": round(item.amountBudget),
    "26实际K€": round(item.amount26),
    "实际-同期K€": round(item.amountDiff),
    "单台差异€/台": "",
    差异分析: ""
  }));
  const accountRows = (result.rows || []).map((row) => ({
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
  return [...summaryRows, ...categoryRows, ...accountRows];
}

function buildFactorSheet(factors, summary) {
  const rows = [];
  if (summary) {
    rows.push({
      类型: "汇总",
      分类: "",
      原因路径: "",
      关键项目: "",
      责任人: "",
      到位时间: "",
      "影响K€": round(summary.netCumulative),
      进展: `上涨累计 ${round(summary.increaseCumulative)} K€；下降累计 ${round(summary.decreaseCumulative)} K€`
    });
  }
  for (const item of factors || []) {
    rows.push({
      类型: item.type === "increase" ? "上涨因素" : "下降因素",
      分类: item.category || "",
      原因路径: item.strategy || "",
      关键项目: item.project || "",
      责任人: item.owner || "",
      到位时间: item.timing || "",
      "影响K€": round(item.actualCumulative),
      进展: item.progress || ""
    });
  }
  return rows.length ? rows : [{ 类型: "说明", 进展: "尚未填写上涨/下降因素。" }];
}

function buildFormulaSheet(forecast, result) {
  return [
    { 项目: "26年滚动预测", 说明: forecast?.source || "由用户导入4+8/5+7预测表，已发生月份为实际，后续月份为预测。" },
    { 项目: "25同期", 说明: "取自2025 monthly Renta DW _ DEC_ACT.xlsx，覆盖1-12月同期。" },
    { 项目: "预算/目标", 说明: "取预算表或预测表内预算口径，作为目标展示，不计算预算差异。" },
    { 项目: "同比差异", 说明: "26年滚动预测或SAP实际 - 25同期。" },
    { 项目: "制造费差额", 说明: "单台差 × 26年产量 / 1000，单位K€。" },
    { 项目: "折旧", 说明: "折旧包含建筑折旧、模具折旧、FC等；FC不单列，不重复加。" },
    { 项目: "月度SAP", 说明: result ? `${result.month}月SAP实际已导入。` : "尚未导入SAP实际。" }
  ];
}

function round(value) {
  return value === null || value === undefined || Number.isNaN(Number(value)) || value === "" ? "" : Math.round(Number(value) * 100000) / 100000;
}

function annualValue(row) {
  if (!row) return null;
  const values = row.values || [];
  if (row.label?.includes("累计") || ["€/台", "台/人"].includes(row.unit)) return lastNumber(values);
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

function lastNumber(values) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (Number.isFinite(values[index])) return values[index];
  }
  return null;
}

function formatTrend(value) {
  if (!Number.isFinite(value)) return "";
  return value > 0 ? "恶化" : "优化";
}

function absText(value) {
  return Number.isFinite(value) ? Math.abs(value).toFixed(2) : "";
}

function wideMonthColumns() {
  return [{ wch: 12 }, { wch: 22 }, { wch: 10 }, ...Array(48).fill({ wch: 11 }), { wch: 12 }];
}

function monthlyMetricColumns() {
  return [{ wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 10 }];
}

function varianceColumns() {
  return [{ wch: 14 }, { wch: 14 }, { wch: 38 }, { wch: 20 }, ...Array(10).fill({ wch: 14 }), { wch: 42 }];
}

function factorColumns() {
  return [{ wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 34 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 44 }];
}

function defaultColumns(rows) {
  const count = Object.keys(rows?.[0] || {}).length || 8;
  return Array.from({ length: count }, () => ({ wch: 16 }));
}
