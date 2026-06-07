const KPI_COPY = {
  zh: [
    ["unit", "单", "€/台", "lower", "26单台 / 25单台"],
    ["days", "时", "天", "lower", "26工作日 / 25工作日"],
    ["people", "人", "人", "lower", "26月均直接+间接用人 / 25"],
    ["upph", "效", "UPPH", "higher", "26 UPPH / 25 UPPH"],
    ["rate", "费", "%", "lower", "26制造费率 / 25制造费率"]
  ],
  en: [
    ["unit", "Unit", "€/pc", "lower", "2026 unit cost / 2025 unit cost"],
    ["days", "Time", "days", "lower", "2026 workdays / 2025 workdays"],
    ["people", "People", "people", "lower", "2026 avg. direct + indirect / 2025"],
    ["upph", "Efficiency", "UPPH", "higher", "2026 UPPH / 2025 UPPH"],
    ["rate", "Rate", "%", "lower", "2026 manufacturing rate / 2025"]
  ],
  tr: [
    ["unit", "Birim", "€/adet", "lower", "2026 birim maliyet / 2025 birim maliyet"],
    ["days", "Zaman", "gün", "lower", "2026 iş günü / 2025 iş günü"],
    ["people", "Kişi", "kişi", "lower", "2026 aylık direkt + endirekt / 2025"],
    ["upph", "Verim", "UPPH", "higher", "2026 UPPH / 2025 UPPH"],
    ["rate", "Oran", "%", "lower", "2026 üretim gider oranı / 2025"]
  ]
};

const CATEGORY_HEADERS = {
  zh: ["大科目", "25同期单台 €/台", "26目标单台 €/台", "26实际单台 €/台", "同比单台差 €/台", "目标单台差 €/台", "同比影响额 K€", "目标影响额 K€", "同比"],
  en: ["Category", "2025 unit €/pc", "2026 target unit €/pc", "2026 actual unit €/pc", "YoY unit gap €/pc", "Target unit gap €/pc", "YoY impact K€", "Target impact K€", "YoY %"],
  tr: ["Kategori", "2025 birim €/adet", "2026 hedef birim €/adet", "2026 gerçekleşen birim €/adet", "YoY birim farkı €/adet", "Hedef birim farkı €/adet", "YoY etki K€", "Hedef etki K€", "YoY %"]
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
