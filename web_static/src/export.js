import * as XLSX from "../vendor/xlsx.mjs";

export function exportAnalysisWorkbook(result, analysisByCode) {
  const rows = result.rows.map((row) => ({
    账户编码: row.code,
    英文描述: row.descEn,
    大科目: row.category,
    "25同期K€": round(row.amount25),
    "26实际K€": round(row.amount26),
    "额差异K€": round(row.amountDiff),
    "25单台€/台": round(row.unit25),
    "26单台€/台": round(row.unit26),
    "单台差异€/台": round(row.unitDiff),
    状态: row.statusLabel,
    差异分析: analysisByCode[row.code] || ""
  }));
  const summary = result.categories.map((item) => ({
    大科目: item.category,
    "25同期K€": round(item.amount25),
    "26实际K€": round(item.amount26),
    "额差异K€": round(item.amountDiff),
    科目数: item.count
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "科目差异");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "大科目汇总");
  XLSX.writeFile(wb, `洗碗机${result.month}月科目差异分析.xlsx`);
}

function round(value) {
  return value === null || value === undefined ? "" : Math.round(value * 100000) / 100000;
}
