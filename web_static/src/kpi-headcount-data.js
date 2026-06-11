export const KPI_HEADCOUNT_2026 = {
  DW: {
    source: "DW KPI Template 2026 V1 (1).xlsx",
    direct: [235, 130, 132, 164, 247, 245, 245, 251, 252, 250, 251, 252],
    indirect: [85, 71, 69, 75, 85, 85, 85, 85, 85, 85, 85, 85],
    white: [26, 25, 25, 24.67, 26.5, 26.5, 26.5, 27.5, 27.5, 27.5, 27.5, 27.5]
  }
};

export function getKpiHeadcount(product = "DW") {
  return KPI_HEADCOUNT_2026[product] || KPI_HEADCOUNT_2026.DW;
}
