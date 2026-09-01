// DW current-month linkage reconstructed from 2026 Administration Budget R2.xlsx.
// Scope: CANTEEN rows 57–72, SHUTTLES rows 56–72 and UNIFORMS row 5.
// Shared FTE is intentionally excluded until Administration confirms its eligibility.

export const DW_HEADCOUNT_LINKAGE = Object.freeze({
  workdays: [20, 20, 20, 21, 14, 26, 21, 19, 26, 26, 25, 23],
  mealUnitPrice: [185.81, 185.81, 185.81, 185.81, 185.81, 185.81, 214.44, 214.44, 214.44, 214.44, 214.44, 214.44],
  shuttleRouteDailyPrice: [1317, 1317, 1317, 1317, 1374, 1374, 1445, 1445, 1445, 1445, 1490, 1490],
  shuttleCapacity: 16,
  shuttleTargetOccupancy: 0.72,
  overtimeRate: 0.01,
  uniform: {
    // Distribution price × quantity, in the source workbook’s D3:D14 cells.
    baseBlueAndSub: [826, 870, 968, 870, 570],
    shoes: [1260.27, 1260.27],
    whiteOnly: [1223, 3000],
    fixedInnerwear: { quantity: 50, amount: 527 },
    fixedSpecialShoes: { quantity: 70, amount: 7899.06 },
    fixedCoats: { quantity: 100, amount: 1300 },
    uplift: 1.2
  }
});

export const DW_ADMIN_PARAMETER_DEFAULTS = Object.freeze({
  overtimeRate: DW_HEADCOUNT_LINKAGE.overtimeRate,
  shuttleCapacity: DW_HEADCOUNT_LINKAGE.shuttleCapacity,
  shuttleTargetOccupancy: DW_HEADCOUNT_LINKAGE.shuttleTargetOccupancy,
  shuttleRoundTripFactor: 2,
  summerTshirtIssueQty: 2,
  summerTrousersIssueQty: 1,
  winterSweatshirtIssueQty: 2,
  winterTrousersIssueQty: 1,
  removableSleeveFleeceIssueQty: 1,
  summerShoesIssueQty: 1,
  winterShoesIssueQty: 1,
  haierFleeceIssueQty: 1,
  safetyVestIssueQty: 12,
  fixedInnerwearQty: DW_HEADCOUNT_LINKAGE.uniform.fixedInnerwear.quantity,
  fixedSpecialShoesQty: DW_HEADCOUNT_LINKAGE.uniform.fixedSpecialShoes.quantity,
  specialShoesIssueQty: 2,
  fixedCoatsQty: DW_HEADCOUNT_LINKAGE.uniform.fixedCoats.quantity,
  uniformUplift: DW_HEADCOUNT_LINKAGE.uniform.uplift,
  uniformAllocationDivisor: 12
});

// Procurement checks only replace prices. Eligibility, distribution quantities and all
// source-workbook allocation rules remain outside the procurement role.
export const DW_PROCUREMENT_PRICE_LINES = Object.freeze({
  canteen: [
    { id: "mealUnitPrice", label: "Meal unit price", baseline: DW_HEADCOUNT_LINKAGE.mealUnitPrice }
  ],
  shuttle: [
    { id: "routeDailyPrice", label: "Shuttle route daily price", baseline: DW_HEADCOUNT_LINKAGE.shuttleRouteDailyPrice }
  ],
  uniforms: [
    { id: "summerTshirt", label: "Summer t-shirt", baseline: 413, quantity: 2, audience: "BC + SUB" },
    { id: "summerTrousers", label: "Summer trousers", baseline: 870, quantity: 1, audience: "BC + SUB" },
    { id: "winterSweatshirt", label: "Winter sweatshirt", baseline: 484, quantity: 2, audience: "BC + SUB" },
    { id: "winterTrousers", label: "Winter trousers", baseline: 870, quantity: 1, audience: "BC + SUB" },
    { id: "removableSleeveFleece", label: "Removable-sleeve fleece", baseline: 570, quantity: 1, audience: "BC + SUB" },
    { id: "summerShoes", label: "Summer shoes", baseline: 1260.27, quantity: 1, audience: "BC + WC + SUB" },
    { id: "winterShoes", label: "Winter shoes", baseline: 1260.27, quantity: 1, audience: "BC + WC + SUB" },
    { id: "haierFleece", label: "Haier logo fleece", baseline: 1223, quantity: 1, audience: "WC" },
    { id: "safetyVest", label: "Safety vest", baseline: 250, quantity: 12, audience: "WC" },
    { id: "innerwear", label: "Innerwear", baseline: 527, quantity: 1, audience: "Fixed 50 sets" },
    { id: "specialShoes", label: "Special shoes", baseline: 3949.53, quantity: 2, audience: "Fixed 70 groups" },
    { id: "coat", label: "Coat", baseline: 1300, quantity: 1, audience: "Fixed 100 coats · ×1.2" }
  ]
});

const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function calculateDwHeadcountBudget({ employee = {}, service = {}, monthIndex = 0, procurementPrices = {}, adminParameters = {} } = {}) {
  const month = Math.max(0, Math.min(11, Math.trunc(number(monthIndex))));
  const direct = number(employee.direct);
  const indirect = number(employee.indirect);
  const white = number(employee.white);
  const shared = number(employee.shared);
  const waste = number(service.waste);
  const canteen = number(service.canteen);
  const cleaning = number(service.cleaning);
  const security = number(service.security);
  const drivers = number(service.drivers);
  const suppliers = number(service.suppliers);
  const trainees = number(service.trainees);
  const visitors = number(service.visitors);
  const parameter = (key) => {
    const candidate = Number(adminParameters?.[key]);
    return Number.isFinite(candidate) && candidate >= 0 ? candidate : DW_ADMIN_PARAMETER_DEFAULTS[key];
  };
  const allEligibleBase = direct + indirect + white + waste + canteen + cleaning + security + drivers + suppliers + trainees + visitors;
  const overtimeRate = parameter("overtimeRate");
  const overtime = allEligibleBase * overtimeRate;
  const workdays = DW_HEADCOUNT_LINKAGE.workdays[month];
  const price = (key, baseline) => {
    const candidate = Number(procurementPrices?.[key]);
    return Number.isFinite(candidate) && candidate >= 0 ? candidate : baseline;
  };
  const mealPrice = price("mealUnitPrice", DW_HEADCOUNT_LINKAGE.mealUnitPrice[month]);
  const canteenHeadcount = allEligibleBase + overtime;
  const shuttleHeadcount = direct + indirect + white + waste + canteen + cleaning + security + trainees + overtime;
  const shuttleRouteDailyPrice = price("routeDailyPrice", DW_HEADCOUNT_LINKAGE.shuttleRouteDailyPrice[month]);
  const shuttleCapacity = Math.max(parameter("shuttleCapacity"), 0.000001);
  const shuttleTargetOccupancy = Math.max(parameter("shuttleTargetOccupancy"), 0.000001);
  const shuttleRoundTripFactor = parameter("shuttleRoundTripFactor");
  const shuttleRate = shuttleRouteDailyPrice / (shuttleCapacity * shuttleTargetOccupancy) * shuttleRoundTripFactor;
  const uniformBlue = direct + indirect;
  const uniformWhite = white;
  const uniformSub = waste + canteen + cleaning + security;
  const uniform = DW_HEADCOUNT_LINKAGE.uniform;
  const uniformLine = (id) => price(id, DW_PROCUREMENT_PRICE_LINES.uniforms.find((item) => item.id === id)?.baseline || 0);
  const blueAndSubUnitCost = uniformLine("summerTshirt") * parameter("summerTshirtIssueQty") + uniformLine("summerTrousers") * parameter("summerTrousersIssueQty") + uniformLine("winterSweatshirt") * parameter("winterSweatshirtIssueQty") + uniformLine("winterTrousers") * parameter("winterTrousersIssueQty") + uniformLine("removableSleeveFleece") * parameter("removableSleeveFleeceIssueQty");
  const shoesUnitCost = uniformLine("summerShoes") * parameter("summerShoesIssueQty") + uniformLine("winterShoes") * parameter("winterShoesIssueQty");
  const whiteOnlyUnitCost = uniformLine("haierFleece") * parameter("haierFleeceIssueQty") + uniformLine("safetyVest") * parameter("safetyVestIssueQty");
  const uniformAnnualTry = (
    (uniformBlue + uniformSub) * blueAndSubUnitCost +
    (uniformBlue + uniformWhite + uniformSub) * shoesUnitCost +
    uniformWhite * whiteOnlyUnitCost +
    parameter("fixedInnerwearQty") * uniformLine("innerwear") +
    parameter("fixedSpecialShoesQty") * uniformLine("specialShoes") * parameter("specialShoesIssueQty")
  ) + parameter("fixedCoatsQty") * uniformLine("coat") * parameter("uniformUplift");
  const uniformAllocationDivisor = Math.max(parameter("uniformAllocationDivisor"), 0.000001);

  return {
    monthIndex: month,
    workdays,
    mealPrice,
    shuttleRouteDailyPrice,
    shuttleRate,
    parameters: {
      ...Object.fromEntries(Object.keys(DW_ADMIN_PARAMETER_DEFAULTS).map((key) => [key, parameter(key)])),
      overtimeRate,
      shuttleCapacity,
      shuttleTargetOccupancy,
      shuttleRoundTripFactor,
      uniformAllocationDivisor
    },
    employee: { direct, indirect, white, shared },
    service: { waste, canteen, cleaning, security, drivers, suppliers, trainees, visitors },
    overtime,
    canteenHeadcount,
    shuttleHeadcount,
    uniform: { blue: uniformBlue, white: uniformWhite, sub: uniformSub, sharedStatus: "pending" },
    amounts: {
      canteenTry: canteenHeadcount * workdays * mealPrice,
      shuttleTry: shuttleHeadcount * workdays * shuttleRate,
      // The source allocates the annual workwear calculation evenly by month.
      uniformsTry: uniformAnnualTry / uniformAllocationDivisor
    }
  };
}
