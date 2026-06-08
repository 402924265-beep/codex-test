import { normalizeNumber } from "./parser.js?v=20260608-forecast-fallback-v3";
import { manufacturingRate, outputValue } from "./metrics.js?v=20260608-forecast-fallback-v3";

const MONTH_COUNT = 12;

export function extractJiangYueWorkbook(workbook, XLSX) {
  const sheetName = findDishwasherSheet(workbook);
  if (!sheetName) throw new Error("姜月表中找不到洗碗机 sheet");
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    raw: true,
    defval: null
  });

  const blockData = extractScenarioBlocks(rows);
  const price = mergeScenarios(blockData.price, scenarioSeries(rows, [
    ["平均单价", "单价"],
    ["price"]
  ]));
  const volume = mergeScenarios(blockData.volume, scenarioSeries(rows, [
    ["产量"],
    ["volume"]
  ]));
  const amount = mergeScenarios(blockData.amount, scenarioSeries(rows, [
    ["制造费用合计", "制造费用"],
    ["total mfg", "manufacturing cost"]
  ]));
  const unit = mergeScenarios(blockData.unit, scenarioSeries(rows, [
    ["单台制造费", "单台"],
    ["unit manufacturing", "unit cost"]
  ]));

  const operational = mergeOperational(
    extractOperationalRows(rows),
    extractPeopleSheetOperational(workbook, XLSX)
  );
  const output = mapScenarios((scenario, index) => outputValue(price[scenario][index], volume[scenario][index]));
  const rate = mapScenarios((scenario, index) => {
    const explicit = findRateValue(rows, scenario, index);
    return explicit ?? manufacturingRate(amount[scenario][index], price[scenario][index], volume[scenario][index]);
  });

  return {
    source: "姜月表",
    sheetName,
    price,
    volume,
    amount,
    unit: fillDerivedUnit(unit, amount, volume),
    output,
    rate,
    workdays: operational.workdays,
    headcount: operational.headcount,
    upph: operational.upph
  };
}

function extractScenarioBlocks(rows) {
  const result = {
    price: emptyScenarios(),
    volume: emptyScenarios(),
    amount: emptyScenarios(),
    unit: emptyScenarios()
  };
  let scenario = null;
  for (const row of rows) {
    const text = rowText(row);
    if (/25年实际|2025actual/.test(text)) scenario = "same";
    else if (/25年预算|2025budget/.test(text)) scenario = null;
    else if (/26年实际|2026actual/.test(text)) scenario = "actual";
    else if (/26年预算|2026budget/.test(text)) scenario = "budget";
    if (!scenario) continue;
    const label = normalize([row?.[1], row?.[2]].filter(Boolean).join(" "));
    if (label.includes("平均单价")) result.price[scenario] = monthsFromRow(row);
    else if (label.includes("产量")) result.volume[scenario] = monthsFromRow(row);
    else if (label === "合计" || label.includes("制造费用合计")) result.amount[scenario] = monthsFromRow(row);
    else if (label === "单台" || label.includes("单台制造费")) result.unit[scenario] = monthsFromRow(row);
  }
  return result;
}

function mergeScenarios(primary, fallback) {
  return Object.fromEntries(["same", "budget", "actual"].map((scenario) => [
    scenario,
    Array.from({ length: MONTH_COUNT }, (_, index) =>
      Number.isFinite(primary?.[scenario]?.[index]) ? primary[scenario][index] : fallback?.[scenario]?.[index] ?? null
    )
  ]));
}

function scenarioSeries(rows, keywordGroups) {
  return {
    same: findScenarioSeries(rows, keywordGroups, ["同期", "25年", "2025"]),
    budget: findScenarioSeries(rows, keywordGroups, ["预算", "目标", "budget"]),
    actual: findScenarioSeries(rows, keywordGroups, ["26年", "实际", "预测", "2026"])
  };
}

function findScenarioSeries(rows, keywordGroups, scenarioWords) {
  const candidates = rows.filter((row) => {
    const text = rowText(row);
    const metricMatches = keywordGroups.some((group) => group.some((word) => text.includes(normalize(word))));
    return metricMatches && scenarioWords.some((word) => text.includes(normalize(word)));
  });
  const row = candidates.find((item) => hasMonthlyNumbers(item)) || candidates[0];
  return monthsFromRow(row);
}

function extractOperationalRows(rows) {
  return {
    workdays: groupedScenarioRows(rows, ["工作日", "work days"]),
    headcount: groupedScenarioRows(rows, ["用人", "一线＋辅助", "一线+辅助", "headcount"]),
    upph: groupedScenarioRows(rows, ["upph"])
  };
}

function extractPeopleSheetOperational(workbook, XLSX) {
  const sheetName = (workbook.SheetNames || []).find((name) => /人数|headcount|labou?r/i.test(name));
  if (!sheetName) return null;
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    raw: true,
    defval: null
  });
  const direct = findPeopleBlock(rows, ["直接人工人数"], "洗碗机");
  const indirect = findPeopleBlock(rows, ["间接人工人数"], "洗碗机");
  const headcount = emptyScenarios();
  for (const scenario of ["same", "actual"]) {
    headcount[scenario] = Array.from({ length: MONTH_COUNT }, (_, index) => {
      const value = sumNullable(direct?.[scenario]?.[index], indirect?.[scenario]?.[index]);
      return value;
    });
  }
  return { headcount };
}

function mergeOperational(primary, secondary) {
  if (!secondary) return primary;
  return {
    workdays: mergeScenarios(primary.workdays, secondary.workdays || emptyScenarios()),
    headcount: mergeScenarios(primary.headcount, secondary.headcount || emptyScenarios()),
    upph: mergeScenarios(primary.upph, secondary.upph || emptyScenarios())
  };
}

function findPeopleBlock(rows, labels, productName) {
  let inBlock = false;
  const result = emptyScenarios();
  for (const row of rows) {
    const text = rowText(row);
    if (labels.some((label) => text.includes(normalize(label))) && text.includes(normalize(productName))) {
      inBlock = true;
      continue;
    }
    if (!inBlock) continue;
    const year = normalize(row?.[1]);
    if (year.includes("25年") || year.includes("2025")) result.same = monthsFromPeopleRow(row);
    else if (year.includes("26年") || year.includes("2026")) result.actual = monthsFromPeopleRow(row);
    else if (year && !year.includes("24年") && !year.includes("january")) break;
  }
  return result;
}

function monthsFromPeopleRow(row) {
  return Array.from({ length: MONTH_COUNT }, (_, index) => {
    const value = normalizeNumber(row?.[2 + index]);
    return value === null ? null : value;
  });
}

function sumNullable(left, right) {
  const hasLeft = Number.isFinite(left);
  const hasRight = Number.isFinite(right);
  if (!hasLeft && !hasRight) return null;
  return (hasLeft ? left : 0) + (hasRight ? right : 0);
}

function groupedScenarioRows(rows, labels) {
  const result = emptyScenarios();
  let activeMetric = false;
  for (const row of rows) {
    const first = normalize(row?.[0]);
    if (labels.some((label) => first.includes(normalize(label)))) activeMetric = true;
    if (!activeMetric) continue;
    const scenario = scenarioFromRow(row);
    if (scenario) result[scenario] = monthsFromRow(row);
    const nextMetric = first && !labels.some((label) => first.includes(normalize(label)));
    if (nextMetric && scenario === null) activeMetric = false;
  }
  return result;
}

function scenarioFromRow(row) {
  const text = rowText(row);
  if (text.includes("同期") || text.includes("25年") || text.includes("2025")) return "same";
  if (text.includes("预算") || text.includes("目标") || text.includes("budget")) return "budget";
  if (text.includes("26年") || text.includes("实际") || text.includes("2026")) return "actual";
  return null;
}

function findRateValue(rows, scenario, monthIndex) {
  const words = scenario === "same" ? ["同期", "25年"] : scenario === "budget" ? ["预算", "目标"] : ["26年", "实际"];
  const row = rows.find((item) => {
    const text = rowText(item);
    return (text.includes("制造费率") || text.includes("费率")) && words.some((word) => text.includes(normalize(word)));
  });
  return monthsFromRow(row)[monthIndex];
}

function fillDerivedUnit(unit, amount, volume) {
  return mapScenarios((scenario, index) => {
    if (Number.isFinite(unit[scenario][index])) return unit[scenario][index];
    const cost = amount[scenario][index];
    const qty = volume[scenario][index];
    return Number.isFinite(cost) && qty ? cost * 1000 / qty : null;
  });
}

function mapScenarios(getter) {
  return Object.fromEntries(["same", "budget", "actual"].map((scenario) => [
    scenario,
    Array.from({ length: MONTH_COUNT }, (_, index) => getter(scenario, index))
  ]));
}

function emptyScenarios() {
  return {
    same: Array(MONTH_COUNT).fill(null),
    budget: Array(MONTH_COUNT).fill(null),
    actual: Array(MONTH_COUNT).fill(null)
  };
}

function monthsFromRow(row) {
  if (!row) return Array(MONTH_COUNT).fill(null);
  const start = firstMonthlyNumberIndex(row);
  if (start < 0) return Array(MONTH_COUNT).fill(null);
  const values = [];
  for (let index = start; index < row.length && values.length < MONTH_COUNT; index += 1) {
    const value = normalizeNumber(row[index]);
    if (value !== null) values.push(value);
  }
  return Array.from({ length: MONTH_COUNT }, (_, index) => values[index] ?? null);
}

function firstMonthlyNumberIndex(row) {
  for (let index = 1; index < Math.min(row.length, 8); index += 1) {
    if (normalizeNumber(row[index]) !== null) return index;
  }
  return -1;
}

function hasMonthlyNumbers(row) {
  return monthsFromRow(row).filter(Number.isFinite).length >= 2;
}

function rowText(row) {
  return normalize((row || []).slice(0, 4).filter(Boolean).join(" "));
}

function normalize(value) {
  return String(value ?? "").replace(/\s+/g, "").toLowerCase();
}

function findDishwasherSheet(workbook) {
  const names = workbook.SheetNames || [];
  return names.find((name) => /洗碗机|dishwasher|\bdw\b/i.test(name)) || names[0] || "";
}
