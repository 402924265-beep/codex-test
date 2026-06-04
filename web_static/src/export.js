import { loadXlsx } from "./xlsx-loader.js";

export async function exportAnalysisWorkbook(result, analysisByCode) {
  const XLSX = await loadXlsx();
  const rows = result.rows.map((row) => ({
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
    "预算单台€/台": round(row.unitBudget),
    "26单台€/台": round(row.unit26),
    "单台差异€/台": round(row.unitDiff),
    差异分析: analysisByCode[row.code] || ""
  }));
  const summary = result.categories.map((item) => ({
    大科目: item.category,
    "25同期K€": round(item.amount25),
    "26预算K€": round(item.amountBudget),
    "26实际K€": round(item.amount26),
    "4+8预测K€": round(item.amountForecast),
    "实际-同期K€": round(item.amountDiff),
    "实际-预算K€": round(item.budgetDiff),
    "制造费差额K€": round(item.manufacturingDiff),
    科目数: item.count
  }));
  const narrative = [
    { 类型: "月度总结", 内容: result.narrative?.blocks?.join("\n\n") || "" },
    ...result.rows
      .filter((row) => analysisByCode[row.code])
      .map((row) => ({ 类型: row.code, 内容: analysisByCode[row.code] }))
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "科目差异");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "大科目汇总");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(narrative), "原因分析");
  XLSX.writeFile(wb, `洗碗机${result.month}月科目差异分析.xlsx`);
}

function round(value) {
  return value === null || value === undefined ? "" : Math.round(value * 100000) / 100000;
}
