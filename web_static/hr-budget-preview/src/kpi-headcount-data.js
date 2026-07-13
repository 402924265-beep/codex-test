export const KPI_HEADCOUNT_2026 = {
  DW: {
    sources: {
      actual: "DW KPI Template 2026 V1 (1).xlsx",
      sameAndBudget: "KPIs CK&DW人数表.xlsx"
    },
    direct: {
      same: [218, 218, 218, 218, 226, 239, 222, 133, 132, 132, 182, 234],
      budget: [244, 244, 244, 244, 247, 245, 245, 251, 252, 250, 251, 252],
      actual: [235, 130, 132, 164, 247, 245, 245, 251, 252, 250, 251, 252]
    },
    indirect: {
      same: [87, 85, 94, 93, 93, 91, 85, 70, 70, 70, 77, 85],
      budget: [85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 85],
      actual: [85, 71, 69, 75, 85, 85, 85, 85, 85, 85, 85, 85]
    },
    white: {
      same: [24.5, 22.5, 22, 23, 22, 26.79, 26.5, 25.33, 25, 25, 25, 25],
      budget: [26.5, 26.5, 26.5, 26.5, 26.5, 26.5, 26.5, 27.5, 27.5, 27.5, 27.5, 27.5],
      actual: [26, 25, 25, 24.67, 26.5, 26.5, 26.5, 27.5, 27.5, 27.5, 27.5, 27.5]
    }
  }
};

export function getKpiHeadcount(product = "DW") {
  return KPI_HEADCOUNT_2026[product] || KPI_HEADCOUNT_2026.DW;
}
