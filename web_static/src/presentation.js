const KPI_COPY = {
  zh: [
    ["volume", "订单量", "台", "higher", "26订单量 / 25订单量"],
    ["days", "时", "天", "lower", "26工作日 / 25工作日"],
    ["people", "人", "人", "lower", "26月均直接员工+间接员工 / 25"],
    ["upph", "效", "UPPH", "higher", "26 UPPH / 25 UPPH"],
    ["rate", "制造费率", "%", "lower", "26制造费率 / 25制造费率"],
    ["unit", "单台制造费", "€/台", "lower", "26单台 / 25单台"]
  ],
  en: [
    ["volume", "Orders", "pcs", "higher", "2026 orders / 2025 orders"],
    ["days", "Time", "days", "lower", "2026 workdays / 2025 workdays"],
    ["people", "People", "people", "lower", "2026 avg. direct + indirect employees / 2025"],
    ["upph", "Efficiency", "UPPH", "higher", "2026 UPPH / 2025 UPPH"],
    ["rate", "MFG rate", "%", "lower", "2026 manufacturing rate / 2025"],
    ["unit", "Unit cost", "€/pc", "lower", "2026 unit cost / 2025 unit cost"]
  ],
  tr: [
    ["volume", "Sipariş", "adet", "higher", "2026 sipariş / 2025 sipariş"],
    ["days", "Zaman", "gün", "lower", "2026 iş günü / 2025 iş günü"],
    ["people", "Kişi", "kişi", "lower", "2026 aylık direkt + endirekt çalışan / 2025"],
    ["upph", "Verim", "UPPH", "higher", "2026 UPPH / 2025 UPPH"],
    ["rate", "Üretim oranı", "%", "lower", "2026 üretim gider oranı / 2025"],
    ["unit", "Birim maliyet", "€/adet", "lower", "2026 birim maliyet / 2025 birim maliyet"]
  ]
};

const CATEGORY_HEADERS = {
  zh: ["大科目", "25同期单台 €/台", "26目标单台 €/台", "26实际单台 €/台", "同比单台差 €/台", "同比%", "目标差异分析", "同比差异分析"],
  en: ["Category", "2025 unit €/pc", "2026 target unit €/pc", "2026 actual unit €/pc", "YoY unit gap €/pc", "YoY %", "Target variance", "YoY variance"],
  tr: ["Kategori", "2025 birim €/adet", "2026 hedef birim €/adet", "2026 gerçekleşen birim €/adet", "YoY birim farkı €/adet", "YoY %", "Hedef fark", "Yıllık fark"]
};

export function buildKpiDefinitions(language = "zh") {
  return (KPI_COPY[language] || KPI_COPY.zh).map(([key, title, unit, direction, formula]) => ({
    key,
    title,
    unit,
    direction,
    formula
  }));
}

export function categoryComparisonHeaders(language = "zh") {
  return [...(CATEGORY_HEADERS[language] || CATEGORY_HEADERS.zh)];
}
