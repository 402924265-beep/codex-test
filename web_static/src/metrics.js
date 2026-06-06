const HOURS_PER_WORKDAY = 7.5;

export function combineHeadcount(direct = [], indirect = []) {
  const length = Math.max(direct.length, indirect.length);
  return Array.from({ length }, (_, index) => {
    const left = finiteOrNull(direct[index]);
    const right = finiteOrNull(indirect[index]);
    if (left === null && right === null) return null;
    return (left || 0) + (right || 0);
  });
}

export function monthlyUpph(volume, direct, indirect, workdays) {
  const headcount = addFinite(direct, indirect);
  if (!isPositive(volume) || !isPositive(headcount) || !isPositive(workdays)) return null;
  return volume / headcount / workdays / HOURS_PER_WORKDAY;
}

export function annualUpph(volumes = [], direct = [], indirect = [], workdays = []) {
  let totalVolume = 0;
  let totalLaborHours = 0;
  const length = Math.max(volumes.length, direct.length, indirect.length, workdays.length, 12);
  for (let index = 0; index < length; index += 1) {
    const volume = finiteOrNull(volumes[index]);
    const headcount = addFinite(direct[index], indirect[index]);
    const days = finiteOrNull(workdays[index]);
    if (volume !== null) totalVolume += volume;
    if (isPositive(headcount) && isPositive(days)) totalLaborHours += headcount * days * HOURS_PER_WORKDAY;
  }
  return totalVolume && totalLaborHours ? totalVolume / totalLaborHours : null;
}

export function outputValue(averagePrice, volume) {
  if (!Number.isFinite(averagePrice) || !Number.isFinite(volume)) return null;
  return averagePrice * volume / 1000;
}

export function manufacturingRate(manufacturingCostKeur, averagePrice, volume) {
  const revenueKeur = outputValue(averagePrice, volume);
  if (!Number.isFinite(manufacturingCostKeur) || !isPositive(revenueKeur)) return null;
  return manufacturingCostKeur / revenueKeur;
}

export function annualManufacturingRate(costsKeur = [], outputValuesKeur = []) {
  const cost = sumFinite(costsKeur);
  const revenue = sumFinite(outputValuesKeur);
  return cost !== null && isPositive(revenue) ? cost / revenue : null;
}

export function targetCompletionRate(actual, budget) {
  if (!Number.isFinite(actual) || !isPositive(budget)) return null;
  return 2 - actual / budget;
}

export function averageFinite(values = []) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? finite.reduce((total, value) => total + value, 0) / finite.length : null;
}

function finiteOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function addFinite(left, right) {
  const a = finiteOrNull(left);
  const b = finiteOrNull(right);
  if (a === null && b === null) return null;
  return (a || 0) + (b || 0);
}

function isPositive(value) {
  return Number.isFinite(value) && value > 0;
}

function sumFinite(values) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? finite.reduce((total, value) => total + value, 0) : null;
}
