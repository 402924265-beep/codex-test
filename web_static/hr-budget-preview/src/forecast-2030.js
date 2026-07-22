import { FACTORY_WORKBENCH_DATA } from "./factory-workbench-data.js?v=20260721-factory-workbench-v3";
import { COOKING_UNIT } from "./cooking-data.js?v=20260722-ck-6plus6-v1";

const YEARS = [2027, 2028, 2029, 2030];
const STORE_KEY = "dw.forecast2030.v1";
const BASE_FX = 56.9918;
const DW_BASE = {
  unit: "dw",
  year: 2026,
  volume: 523270,
  headcount: { direct: 232.5, indirect: 84, white: 23 },
  costs: [
    ["depreciation", "折旧", "fixed", 5450.5876],
    ["allocation", "园区分摊", "fixed", 2294.7328],
    ["direct", "直接人工", "people", 5066.8488],
    ["indirect", "间接人工", "people", 2794.4328],
    ["white", "白领人工", "people", 1244.5566],
    ["operations", "运营费", "semi", 609.0839],
    ["fixedEnergy", "固定能源费", "semi", 61.5855],
    ["peopleServices", "班车/工作服/工作餐", "semi", 2132.3179],
    ["inventory", "存货跌价准备", "variable", 104.4574],
    ["scrap", "废料", "variable", 254.8970],
    ["consumables", "生产耗用品", "variable", 262.8122],
    ["reselling", "废品收入", "variable", -556.2380],
    ["variableEnergy", "变动能源费", "variable", 369.8217]
  ]
};

function buildCookingBase() {
  const categoryTotals = {};
  for (const month of Object.values(COOKING_UNIT.monthlyResults || {})) {
    for (const category of month.categories || []) categoryTotals[category.category] = (categoryTotals[category.category] || 0) + Number(category.amount26 || 0);
  }
  const annual = (label) => Number(COOKING_UNIT.dashboardRows.find((row) => row.label === label && row.scenario === "26年")?.annual || 0);
  const officialTotal = annual("制造费用金额");
  const mappedTotal = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);
  return {
    unit: "ck",
    year: 2026,
    volume: annual("产量"),
    headcount: { direct: annual("直接员工"), indirect: annual("间接员工"), white: annual("白领") },
    costs: [
      ["depreciation", "折旧（含FC）", "fixed", categoryTotals["折旧（含FC）"] || 0],
      ["allocation", "其他制造费/分摊", "fixed", (categoryTotals["其他制造费"] || 0) + officialTotal - mappedTotal],
      ["direct", "直接人工", "people", categoryTotals["直接人工"] || 0],
      ["indirect", "间接人工成本-辅助人员", "people", categoryTotals["间接人工成本-辅助人员"] || 0],
      ["white", "固定人工-白领", "people", categoryTotals["固定人工-白领"] || 0],
      ["operations", "运营费", "semi", categoryTotals["运营费"] || 0],
      ["fixedEnergy", "固定能源费", "semi", categoryTotals["固定能源费"] || 0],
      ["peopleServices", "班车/工作服/工作餐", "semi", categoryTotals["半固定-班车/工作服"] || 0],
      ["inventory", "存货跌价准备", "variable", categoryTotals["存货跌价准备"] || 0],
      ["scrap", "可回收废料", "variable", categoryTotals["可回收废料"] || 0],
      ["consumables", "生产耗用品", "variable", categoryTotals["生产耗用品"] || 0],
      ["reselling", "Scrap selling", "variable", categoryTotals["Scrap selling"] || 0],
      ["variableEnergy", "变动能源费", "variable", categoryTotals["变动能源费"] || 0]
    ]
  };
}

const CK_BASE = buildCookingBase();
const BASES = { dw: DW_BASE, ck: CK_BASE };

const defaults = {
  scenario: "base",
  activeUnit: "dw",
  unitPlans: {
    dw: {
      phase2027: [
        { label: "P1", start: 1, end: 3, shifts: 3, volume: 94000 },
        { label: "P2", start: 4, end: 6, shifts: 2, volume: 76000 },
        { label: "P3", start: 7, end: 12, shifts: 1, volume: 125000 }
      ],
      assumptions: {
        2027: { volume: 295000, efficiency: 5, peopleMode: "manual", direct: 121.5, indirect: 49.7, white: 13, wage: 8, fx: 60, price: 8, energy: 10, depreciation: -110, allocation: 100, indirectWaste: 5, tempExit: 0, tempMonthlyCost: 1.5, tempMonths: 0 },
        2028: { volume: 250000, efficiency: 8, peopleMode: "manual", direct: 131, indirect: 34, white: 11, wage: 8, fx: 65, price: 8, energy: 8, depreciation: 0, allocation: 100, indirectWaste: 0, tempExit: 0, tempMonthlyCost: 1.5, tempMonths: 0 },
        2029: { volume: 250000, efficiency: 0, peopleMode: "manual", direct: 131, indirect: 34, white: 11, wage: 8, fx: 70, price: 8, energy: 6, depreciation: 0, allocation: 100, indirectWaste: 0, tempExit: 0, tempMonthlyCost: 1.5, tempMonths: 0 },
        2030: { volume: 250000, efficiency: 0, peopleMode: "manual", direct: 131, indirect: 34, white: 11, wage: 8, fx: 75, price: 8, energy: 5, depreciation: 0, allocation: 100, indirectWaste: 0, tempExit: 0, tempMonthlyCost: 1.5, tempMonths: 0 }
      }
    },
    ck: {
      phase2027: [],
      assumptions: Object.fromEntries(YEARS.map((year) => [year, { volume: CK_BASE.volume, efficiency: 0, peopleMode: "manual", direct: CK_BASE.headcount.direct, indirect: CK_BASE.headcount.indirect, white: CK_BASE.headcount.white, wage: 0, fx: BASE_FX, price: 0, energy: 0, depreciation: 0, allocation: 100, indirectWaste: 0, tempExit: 0, tempMonthlyCost: 1.5, tempMonths: 0 }]))
    }
  },
  advanced: false,
  parsed: null,
  aiMessage: "2027年产量30万台，直接员工125人，间接员工48人，白领13人，人工上涨8%，汇率60，提效5%"
};

let root = null;
let getLanguage = () => "zh";
let numericInputTimer = null;
let modelState = loadState();

const COPY = {
  zh: { title: "2025–2030 制造费预测模型", sub: "按产量、人数、效率、工资、价格和汇率预测未来制造费用", source: "基线：25-30制造费预测.xlsx · DW 2026", conditions: "年度预测条件", people: "人员规划", direct: "直接员工", indirect: "间接员工", white: "白领", avg: "平均人数", suggested: "建议直接人数", manual: "手动", auto: "按提效", advanced: "高级条件", ai: "AI 预测助手", apiReady: "API 可连接", aiHint: "直接输入或说出条件，解析确认后再更新模型。", parse: "解析指令", apply: "确认并更新预测", recognized: "已识别", apiSettings: "API 设置与测试连接", total: "2030 总制造费", unit: "2030 单台制造费", peopleTotal: "2030 平均人数", avoid: "累计提效避免成本", trend: "制造费与单台趋势", impact: "2030 影响拆解", detail: "大科目预测结果", formula: "计算链路", fixed: "固定", semi: "半固定", variable: "变动", volume: "产量", efficiency: "直接效率提升", wage: "工资上涨", fx: "EUR/TRY", price: "一般价格上涨", energy: "能源价格上涨", depreciation: "折旧增减", allocation: "园区分摊比例", waste: "间接浪费系数", tempExit: "临时工退出人数", tempCost: "临时工每人月成本", tempMonths: "退出后节省月数", save: "保存情景", reset: "恢复原模型", actualPeople: "2026年1-6月实际平均", originalPlan: "2026全年模型基线", effectVolume: "产量/人数变化", effectWage: "工资上涨", effectPrice: "价格上涨", effectEnergy: "能源价格", effectFx: "汇率换算", effectFixed: "折旧/分摊" },
  en: { title: "2025–2030 Manufacturing Cost Forecast", sub: "Forecast by volume, headcount, efficiency, wages, prices and FX", source: "Baseline: 25-30 MFG forecast.xlsx · DW 2026", conditions: "Annual assumptions", people: "Headcount plan", direct: "Direct", indirect: "Indirect", white: "White collar", avg: "Average HC", suggested: "Suggested direct HC", manual: "Manual", auto: "Efficiency", advanced: "Advanced assumptions", ai: "AI Forecast Assistant", apiReady: "API ready", aiHint: "Type or speak assumptions. Review parsed values before applying.", parse: "Parse", apply: "Confirm and update", recognized: "Recognized", apiSettings: "API settings & connection test", total: "2030 total MFG cost", unit: "2030 unit cost", peopleTotal: "2030 average HC", avoid: "Efficiency cost avoided", trend: "Cost and unit-cost trend", impact: "2030 impact bridge", detail: "Category forecast", formula: "Calculation trace", fixed: "Fixed", semi: "Semi-fixed", variable: "Variable", volume: "Volume", efficiency: "Direct efficiency", wage: "Wage increase", fx: "EUR/TRY", price: "General inflation", energy: "Energy inflation", depreciation: "Depreciation change", allocation: "Park allocation", waste: "Indirect waste", tempExit: "Temporary workers exiting", tempCost: "Monthly cost per temp", tempMonths: "Saving months after exit", save: "Save scenario", reset: "Restore source model", actualPeople: "2026 Jan-Jun actual avg.", originalPlan: "2026 full-year model baseline", effectVolume: "Volume / HC", effectWage: "Wages", effectPrice: "Prices", effectEnergy: "Energy", effectFx: "FX conversion", effectFixed: "Depreciation / allocation" },
  tr: { title: "2025–2030 Üretim Gideri Tahmini", sub: "Hacim, çalışan, verimlilik, ücret, fiyat ve kur ile tahmin", source: "Baz: 25-30 üretim gideri tahmini.xlsx · DW 2026", conditions: "Yıllık varsayımlar", people: "Çalışan planı", direct: "Direkt", indirect: "Endirekt", white: "Beyaz yaka", avg: "Ortalama kişi", suggested: "Önerilen direkt kişi", manual: "Manuel", auto: "Verimlilik", advanced: "Gelişmiş varsayımlar", ai: "AI Tahmin Asistanı", apiReady: "API bağlanabilir", aiHint: "Koşulları yazın veya söyleyin; uygulamadan önce kontrol edin.", parse: "Komutu çöz", apply: "Onayla ve güncelle", recognized: "Algılandı", apiSettings: "API ayarı ve bağlantı testi", total: "2030 toplam üretim gideri", unit: "2030 birim gider", peopleTotal: "2030 ortalama çalışan", avoid: "Verimlilik tasarrufu", trend: "Gider ve birim gider eğilimi", impact: "2030 etki kırılımı", detail: "Gider grubu tahmini", formula: "Hesap izi", fixed: "Sabit", semi: "Yarı sabit", variable: "Değişken", volume: "Hacim", efficiency: "Direkt verimlilik", wage: "Ücret artışı", fx: "EUR/TRY", price: "Genel fiyat artışı", energy: "Enerji fiyat artışı", depreciation: "Amortisman değişimi", allocation: "Kampüs dağıtımı", waste: "Endirekt kayıp", tempExit: "Çıkan geçici çalışan", tempCost: "Kişi başı aylık geçici maliyet", tempMonths: "Çıkış sonrası tasarruf ayı", save: "Senaryoyu kaydet", reset: "Kaynak modeli geri yükle", actualPeople: "2026 Ocak-Haziran fiili ort.", originalPlan: "2026 tam yıl model bazı", effectVolume: "Hacim / çalışan", effectWage: "Ücret", effectPrice: "Fiyat", effectEnergy: "Enerji", effectFx: "Kur", effectFixed: "Amortisman / dağıtım" }
};

const DETAIL_COPY = {
  zh: {
    phaseTitle: "2027 产量与班次调整",
    phaseHint: "修改阶段产量后，2027年度产量自动汇总；调整值与上一阶段月均水平比较。",
    period: "执行期间",
    shifts: "班次",
    phaseVolume: "阶段产量",
    monthlyAverage: "月均产量",
    adjustment: "较上阶段",
    startsAt: "起始方案",
    noChange: "无变化",
    baseline: "基准",
    forecast: "预测",
    totalCost: "总制造费",
    unitCost: "单台制造费",
    headcount: "平均人数",
    versusPrior: "较上年",
    localParser: "内置指令解析",
    apiConnected: "API 已连接",
    laborImpact: "直接/间接/白领人工",
    peopleServiceImpact: "运营及人相关费用",
    energyImpact: "固定及变动能源",
    variableImpact: "产量联动费用",
    fixedImpact: "折旧及园区分摊"
  },
  en: {
    phaseTitle: "2027 volume and shift changes",
    phaseHint: "Changing a phase volume automatically updates 2027 annual volume. Changes compare monthly averages with the prior phase.",
    period: "Period",
    shifts: "Shifts",
    phaseVolume: "Phase volume",
    monthlyAverage: "Monthly average",
    adjustment: "vs prior phase",
    startsAt: "Starting plan",
    noChange: "No change",
    baseline: "Baseline",
    forecast: "Forecast",
    totalCost: "Total MFG cost",
    unitCost: "Unit cost",
    headcount: "Average HC",
    versusPrior: "vs prior year",
    localParser: "Built-in command parser",
    apiConnected: "API connected",
    laborImpact: "Direct / indirect / white-collar labor",
    peopleServiceImpact: "Operations and people-related cost",
    energyImpact: "Fixed and variable energy",
    variableImpact: "Volume-linked cost",
    fixedImpact: "Depreciation and park allocation"
  },
  tr: {
    phaseTitle: "2027 hacim ve vardiya değişimi",
    phaseHint: "Faz hacmi değiştirildiğinde 2027 yıllık hacmi otomatik güncellenir. Değişim önceki fazın aylık ortalamasıyla karşılaştırılır.",
    period: "Dönem",
    shifts: "Vardiya",
    phaseVolume: "Faz hacmi",
    monthlyAverage: "Aylık ortalama",
    adjustment: "Önceki faza göre",
    startsAt: "Başlangıç planı",
    noChange: "Değişiklik yok",
    baseline: "Baz",
    forecast: "Tahmin",
    totalCost: "Toplam üretim gideri",
    unitCost: "Birim gider",
    headcount: "Ortalama çalışan",
    versusPrior: "Önceki yıla göre",
    localParser: "Yerleşik komut çözümleyici",
    apiConnected: "API bağlı",
    laborImpact: "Direkt / endirekt / beyaz yaka işçilik",
    peopleServiceImpact: "Operasyon ve çalışan bağlantılı gider",
    energyImpact: "Sabit ve değişken enerji",
    variableImpact: "Hacme bağlı gider",
    fixedImpact: "Amortisman ve kampüs dağıtımı"
  }
};

function loadState() {
  try {
    const stored = JSON.parse(globalThis.localStorage?.getItem(STORE_KEY) || "{}");
    const next = { ...structuredClone(defaults), ...stored, unitPlans: structuredClone(defaults.unitPlans) };
    if (stored.unitPlans) {
      for (const unit of ["dw", "ck"]) {
        next.unitPlans[unit] = {
          ...next.unitPlans[unit],
          ...(stored.unitPlans[unit] || {}),
          assumptions: { ...next.unitPlans[unit].assumptions, ...(stored.unitPlans[unit]?.assumptions || {}) }
        };
      }
    } else if (stored.assumptions) {
      next.unitPlans.dw.assumptions = { ...next.unitPlans.dw.assumptions, ...stored.assumptions };
      next.unitPlans.dw.phase2027 = stored.phase2027 || next.unitPlans.dw.phase2027;
    }
    return next;
  }
  catch { return structuredClone(defaults); }
}

function c(language) { return COPY[language] || COPY.zh; }
function activeBase() { return BASES[modelState.activeUnit] || DW_BASE; }
function activePlan() { return modelState.unitPlans[modelState.activeUnit] || modelState.unitPlans.dw; }
function n(value, digits = 0) { return Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits }); }
function pct(value) { return `${Number(value || 0).toFixed(1)}%`; }
function safe(value) { return String(value ?? "").replace(/[&<>\"]/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[x])); }

function h1ActualPeople() {
  const unitKey = modelState.activeUnit === "ck" ? "cooking" : "dishwasher";
  const months = FACTORY_WORKBENCH_DATA.units[unitKey].months;
  return ["direct", "indirect", "white"].reduce((out, key) => {
    out[key] = months.reduce((sum, month) => sum + month.headcount[key], 0) / months.length;
    return out;
  }, {});
}

function calculate() {
  const base = activeBase();
  const assumptions = activePlan().assumptions;
  const rows = base.costs.map(([key, name, type, value]) => ({ key, name, type, values: { 2026: value } }));
  const totals = { 2026: rows.reduce((sum, row) => sum + row.values[2026], 0) };
  const units = { 2026: totals[2026] * 1000 / base.volume };
  const effectivePeople = { 2026: { ...base.headcount } };
  let previousFx = BASE_FX;

  for (const year of YEARS) {
    const a = assumptions[year];
    const priorYear = year - 1;
    const priorVolume = priorYear === 2026 ? base.volume : assumptions[priorYear].volume;
    const suggestedDirect = base.headcount.direct * (a.volume / base.volume) / (1 + a.efficiency / 100);
    const people = { direct: a.peopleMode === "auto" ? suggestedDirect : a.direct, indirect: a.indirect, white: a.white };
    effectivePeople[year] = people;
    const previousPeople = effectivePeople[priorYear];
    const fxFactor = previousFx / a.fx;
    const wageFactor = (1 + a.wage / 100) * fxFactor;
    const priceFactor = (1 + a.price / 100) * fxFactor;
    const energyFactor = (1 + a.energy / 100) * fxFactor;
    const volumeFactor = a.volume / priorVolume;
    const totalPeopleFactor = (people.direct + people.indirect + people.white) / (previousPeople.direct + previousPeople.indirect + previousPeople.white);
    for (const row of rows) {
      const prior = row.values[priorYear];
      if (row.key === "depreciation") row.values[year] = prior + a.depreciation;
      else if (row.key === "allocation") row.values[year] = base.costs.find((x) => x[0] === "allocation")[3] * a.allocation / 100;
      else if (row.key === "direct") row.values[year] = prior / previousPeople.direct * people.direct * wageFactor - a.tempExit * a.tempMonthlyCost * a.tempMonths;
      else if (row.key === "indirect") row.values[year] = prior / previousPeople.indirect * people.indirect * wageFactor * (1 + a.indirectWaste / 100);
      else if (row.key === "white") row.values[year] = prior / previousPeople.white * people.white * wageFactor;
      else if (row.key === "operations") row.values[year] = prior * totalPeopleFactor * priceFactor;
      else if (row.key === "fixedEnergy") row.values[year] = prior * totalPeopleFactor * energyFactor;
      else if (row.key === "peopleServices") row.values[year] = prior * totalPeopleFactor * priceFactor;
      else if (row.key === "variableEnergy") row.values[year] = prior * volumeFactor * energyFactor;
      else row.values[year] = prior * volumeFactor * priceFactor;
    }
    totals[year] = rows.reduce((sum, row) => sum + row.values[year], 0);
    units[year] = totals[year] * 1000 / a.volume;
    previousFx = a.fx;
  }
  return { rows, totals, units, effectivePeople };
}

function impactGroups(model, language) {
  const detail = DETAIL_COPY[language] || DETAIL_COPY.zh;
  const groups = [
    [detail.laborImpact, ["direct", "indirect", "white"]],
    [detail.peopleServiceImpact, ["operations", "peopleServices"]],
    [detail.energyImpact, ["fixedEnergy", "variableEnergy"]],
    [detail.variableImpact, ["inventory", "scrap", "consumables", "reselling"]],
    [detail.fixedImpact, ["depreciation", "allocation"]]
  ];
  return groups.map(([label, keys]) => {
    const value = model.rows
      .filter((row) => keys.includes(row.key))
      .reduce((sum, row) => sum + row.values[2030] - row.values[2026], 0);
    return [label, value];
  });
}

function traceFor(row, year, model, language) {
  const base = activeBase();
  const assumptions = activePlan().assumptions;
  const locale = language === "zh" ? {
    source: "来源：2026内置基准",
    result: "计算结果",
    prior: "上年金额",
    people: "平均人数",
    volume: "产量",
    wage: "工资",
    price: "价格",
    energy: "能源",
    fx: "汇率",
    adjustment: "调整",
    ratio: "比例",
    waste: "浪费系数",
    temp: "临时工节省"
  } : language === "tr" ? {
    source: "Kaynak: 2026 yerleşik baz",
    result: "Hesaplanan sonuç",
    prior: "Önceki yıl",
    people: "Ortalama çalışan",
    volume: "Hacim",
    wage: "Ücret",
    price: "Fiyat",
    energy: "Enerji",
    fx: "Kur",
    adjustment: "Düzeltme",
    ratio: "Oran",
    waste: "Kayıp oranı",
    temp: "Geçici işçi tasarrufu"
  } : {
    source: "Source: 2026 built-in baseline",
    result: "Calculated result",
    prior: "Prior-year amount",
    people: "Average HC",
    volume: "Volume",
    wage: "Wage",
    price: "Price",
    energy: "Energy",
    fx: "FX",
    adjustment: "Adjustment",
    ratio: "Ratio",
    waste: "Waste factor",
    temp: "Temporary-labor saving"
  };
  if (year === 2026) return `${row.name} · 2026\n${locale.source}\n${locale.result}: ${n(row.values[year], 2)} K€`;
  const a = assumptions[year];
  const priorYear = year - 1;
  const priorFx = priorYear === 2026 ? BASE_FX : assumptions[priorYear].fx;
  const priorPeople = model.effectivePeople[priorYear];
  const people = model.effectivePeople[year];
  const priorVolume = priorYear === 2026 ? base.volume : assumptions[priorYear].volume;
  const lines = [`${row.name} · ${year}`, `${locale.prior}: ${n(row.values[priorYear], 2)} K€`];
  if (row.key === "depreciation") lines.push(`${locale.adjustment}: ${a.depreciation > 0 ? "+" : ""}${n(a.depreciation, 1)} K€`);
  else if (row.key === "allocation") lines.push(`${locale.ratio}: ${pct(a.allocation)}`);
  else if (["direct", "indirect", "white"].includes(row.key)) {
    lines.push(`${locale.people}: ${n(priorPeople[row.key], 1)} → ${n(people[row.key], 1)} HC`);
    lines.push(`${locale.wage}: ${a.wage > 0 ? "+" : ""}${pct(a.wage)} · ${locale.fx}: ${n(priorFx, 2)} → ${n(a.fx, 2)}`);
    if (row.key === "indirect" && a.indirectWaste) lines.push(`${locale.waste}: +${pct(a.indirectWaste)}`);
    if (row.key === "direct" && a.tempExit) lines.push(`${locale.temp}: ${n(a.tempExit, 1)} × ${n(a.tempMonthlyCost, 1)} × ${n(a.tempMonths, 1)} = ${n(a.tempExit * a.tempMonthlyCost * a.tempMonths, 1)} K€`);
  } else if (["operations", "peopleServices"].includes(row.key)) {
    lines.push(`${locale.people}: ${n(Object.values(priorPeople).reduce((s, v) => s + v, 0), 1)} → ${n(Object.values(people).reduce((s, v) => s + v, 0), 1)} HC`);
    lines.push(`${locale.price}: ${a.price > 0 ? "+" : ""}${pct(a.price)} · ${locale.fx}: ${n(priorFx, 2)} → ${n(a.fx, 2)}`);
  } else if (row.key === "fixedEnergy") {
    lines.push(`${locale.people}: ${n(Object.values(priorPeople).reduce((s, v) => s + v, 0), 1)} → ${n(Object.values(people).reduce((s, v) => s + v, 0), 1)} HC`);
    lines.push(`${locale.energy}: ${a.energy > 0 ? "+" : ""}${pct(a.energy)} · ${locale.fx}: ${n(priorFx, 2)} → ${n(a.fx, 2)}`);
  } else {
    lines.push(`${locale.volume}: ${n(priorVolume)} → ${n(a.volume)} pcs`);
    lines.push(`${row.key === "variableEnergy" ? locale.energy : locale.price}: ${a[row.key === "variableEnergy" ? "energy" : "price"] > 0 ? "+" : ""}${pct(a[row.key === "variableEnergy" ? "energy" : "price"])} · ${locale.fx}: ${n(priorFx, 2)} → ${n(a.fx, 2)}`);
  }
  lines.push(`${locale.result}: ${n(row.values[year], 2)} K€`);
  return lines.join("\n");
}

function inputRow(label, key, unit, advanced = false) {
  const detail = DETAIL_COPY[getLanguage()] || DETAIL_COPY.zh;
  const base = activeBase();
  const assumptions = activePlan().assumptions;
  const baseline = {
    volume: n(base.volume),
    fx: n(BASE_FX, 4),
    allocation: "100%"
  }[key] || detail.noChange;
  return `<tr class="${advanced ? "f30-advanced" : ""}"><th>${label}<small>${unit}</small></th><td><span class="f30-baseline-value">${baseline}</span></td>${YEARS.map((year) => {
    const disabled = ["tempMonthlyCost", "tempMonths"].includes(key) && Number(assumptions[year].tempExit || 0) === 0;
    const value = disabled ? detail.noChange : assumptions[year][key];
    return `<td>${disabled ? `<span class="f30-baseline-value">${value}</span>` : `<input data-f30-year="${year}" data-f30-key="${key}" type="number" step="0.1" value="${value}">`}</td>`;
  }).join("")}</tr>`;
}

function renderPhasePlan(language) {
  const detail = DETAIL_COPY[language] || DETAIL_COPY.zh;
  const phases = activePlan().phase2027;
  if (!phases.length) return "";
  return `<section class="f30-phase-editor"><div class="f30-phase-heading"><div><b>${detail.phaseTitle}</b><span>${detail.phaseHint}</span></div><strong>${n(phases.reduce((sum, phase) => sum + Number(phase.volume || 0), 0))} pcs</strong></div><div class="f30-phase-track">${phases.map((phase, index) => {
    const months = phase.end - phase.start + 1;
    const monthly = Number(phase.volume || 0) / months;
    const previous = phases[index - 1];
    const previousMonthly = previous ? Number(previous.volume || 0) / (previous.end - previous.start + 1) : null;
    const volumeDelta = previousMonthly == null ? null : monthly - previousMonthly;
    const shiftDelta = previous ? Number(phase.shifts) - Number(previous.shifts) : null;
    const deltaClass = volumeDelta == null || volumeDelta === 0 ? "neutral" : volumeDelta < 0 ? "good" : "bad";
    return `<article class="f30-phase-card"><div class="f30-phase-index"><span>${phase.label}</span><b>${phase.start}-${phase.end}月</b></div><label>${detail.shifts}<div><input data-f30-phase="${index}" data-f30-phase-key="shifts" type="number" min="1" max="4" step="1" value="${phase.shifts}"><em>${shiftDelta == null ? detail.startsAt : `${shiftDelta > 0 ? "+" : ""}${shiftDelta}`}</em></div></label><label>${detail.phaseVolume}<div><input data-f30-phase="${index}" data-f30-phase-key="volume" type="number" min="0" step="1000" value="${phase.volume}"><em>pcs</em></div></label><div class="f30-phase-summary"><span>${detail.monthlyAverage}<b>${n(monthly)}</b></span><span class="${deltaClass}">${detail.adjustment}<b>${volumeDelta == null ? detail.startsAt : `${volumeDelta > 0 ? "+" : ""}${n(volumeDelta)}`}</b><small>${shiftDelta == null ? "" : `${shiftDelta > 0 ? "+" : ""}${shiftDelta} ${detail.shifts}`}</small></span></div></article>`;
  }).join("")}</div></section>`;
}

function peopleRow(label, key, actual, baseline) {
  const assumptions = activePlan().assumptions;
  return `<tr><th>${label}<small>HC</small></th><td><span title="${c(getLanguage()).actualPeople}">${n(actual, 1)}</span><em>${n(baseline, 1)}</em></td>${YEARS.map((year) => `<td><input data-f30-year="${year}" data-f30-key="${key}" type="number" step="0.1" value="${Number(Number(assumptions[year][key]).toFixed(1))}"></td>`).join("")}</tr>`;
}

function renderTrend(model) {
  const years = [2026, ...YEARS];
  const max = Math.max(...years.map((year) => model.totals[year]));
  return `<div class="f30-chart">${years.map((year) => `<div class="f30-chart-col"><div class="f30-unit-label">${n(model.units[year], 2)}</div><div class="f30-bar" style="height:${Math.max(30, model.totals[year] / max * 135)}px"><b>${n(model.totals[year], 0)}</b></div><span>${year}</span></div>`).join("")}</div>`;
}

function renderYearStrip(model, language) {
  const detail = DETAIL_COPY[language] || DETAIL_COPY.zh;
  return `<section class="f30-year-strip">${[2026, ...YEARS].map((year, index) => {
    const people = year === 2026 ? activeBase().headcount : model.effectivePeople[year];
    const headcount = Object.values(people).reduce((sum, value) => sum + Number(value || 0), 0);
    const priorYear = year - 1;
    const change = index === 0 ? null : (model.totals[year] / model.totals[priorYear] - 1) * 100;
    const changeClass = change == null || Math.abs(change) < 0.05 ? "neutral" : change < 0 ? "good" : "bad";
    return `<article class="${year === 2026 ? "baseline" : "forecast"}"><header><b>${year}</b><span>${year === 2026 ? detail.baseline : detail.forecast}</span></header><div class="f30-year-main"><small>${detail.totalCost}</small><strong>${n(model.totals[year], 1)}</strong><em>K€</em></div><dl><div><dt>${detail.unitCost}</dt><dd>${n(model.units[year], 2)} <small>€/pc</small></dd></div><div><dt>${detail.headcount}</dt><dd>${n(headcount, 1)} <small>HC</small></dd></div></dl><footer class="${changeClass}">${change == null ? detail.baseline : `${detail.versusPrior} ${change > 0 ? "+" : ""}${pct(change)}`}</footer></article>`;
  }).join("")}</section>`;
}

function parseLocal(message) {
  const text = String(message || "");
  const yearMatch = text.match(/20(2[7-9]|30)|\b(2[7-9]|30)年/);
  const year = yearMatch ? Number(yearMatch[0].replace(/年/g, "").length === 2 ? `20${yearMatch[0].replace(/年/g, "")}` : yearMatch[0].replace(/年/g, "")) : 2027;
  const updates = { year };
  const rules = [
    ["volume", /产量\s*(\d+(?:\.\d+)?)\s*(万)?/], ["direct", /直接(?:员工|人工)?\s*(\d+(?:\.\d+)?)\s*人?/], ["indirect", /间接(?:员工|人工)?\s*(\d+(?:\.\d+)?)\s*人?/], ["white", /白领\s*(\d+(?:\.\d+)?)\s*人?/],
    ["efficiency", /(?:提效|效率(?:提升)?)[^\d]*(\d+(?:\.\d+)?)\s*%/], ["wage", /(?:人工|工资)(?:上涨|增长|增加)?\s*(\d+(?:\.\d+)?)\s*%/], ["fx", /(?:汇率|EUR\/TRY)[^\d]*(\d+(?:\.\d+)?)/], ["price", /(?:价格|通胀)(?:上涨|增长|增加)?\s*(\d+(?:\.\d+)?)\s*%/], ["energy", /能源(?:价格)?(?:上涨|增长|增加)?\s*(\d+(?:\.\d+)?)\s*%/]
  ];
  for (const [key, regex] of rules) {
    const match = text.match(regex);
    if (!match) continue;
    let value = Number(match[1]);
    if (key === "volume" && match[2]) value *= 10000;
    updates[key] = value;
  }
  if (updates.efficiency !== undefined && updates.direct === undefined) updates.peopleMode = "auto";
  return updates;
}

async function parseAi(message) {
  const endpoint = window.MFG_FORECAST_AI_CONFIG?.endpoint;
  if (!endpoint) return parseLocal(message);
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, unit: modelState.activeUnit, assumptions: activePlan().assumptions, years: YEARS }) });
  if (!response.ok) throw new Error(`API ${response.status}`);
  const data = await response.json();
  return data.update || data;
}

function parsedHtml(parsed, language) {
  if (!parsed) return "";
  const copy = c(language);
  const labels = { volume: copy.volume, direct: copy.direct, indirect: copy.indirect, white: copy.white, efficiency: copy.efficiency, wage: copy.wage, fx: copy.fx, price: copy.price, energy: copy.energy };
  return `<div class="f30-parsed"><b>${copy.recognized} · ${parsed.year}</b><div>${Object.entries(parsed).filter(([key]) => !["year", "peopleMode"].includes(key)).map(([key, value]) => `<span>${labels[key] || key}: ${key === "volume" ? n(value) : value}${["efficiency", "wage", "price", "energy"].includes(key) ? "%" : ""}</span>`).join("")}</div></div>`;
}

function syncDwPhaseVolume(targetTotal) {
  if (modelState.activeUnit !== "dw") return;
  const phases = activePlan().phase2027;
  const currentTotal = phases.reduce((sum, phase) => sum + Number(phase.volume || 0), 0) || 1;
  let allocated = 0;
  phases.forEach((phase, index) => {
    const next = index === phases.length - 1 ? targetTotal - allocated : Math.round(Number(phase.volume || 0) / currentTotal * targetTotal / 1000) * 1000;
    phase.volume = Math.max(0, next);
    allocated += phase.volume;
  });
}

export function initForecast2030(container, languageGetter) {
  root = container;
  getLanguage = languageGetter || getLanguage;
  const commitNumericInput = (target) => {
    const phaseInput = target.closest("[data-f30-phase]");
    if (phaseInput) {
      const plan = activePlan();
      const phase = plan.phase2027[Number(phaseInput.dataset.f30Phase)];
      phase[phaseInput.dataset.f30PhaseKey] = Number(phaseInput.value);
      plan.assumptions[2027].volume = plan.phase2027.reduce((sum, item) => sum + Number(item.volume || 0), 0);
      renderForecast2030(getLanguage());
      return true;
    }
    const input = target.closest("[data-f30-year]");
    if (input) {
      const plan = activePlan();
      plan.assumptions[input.dataset.f30Year][input.dataset.f30Key] = Number(input.value);
      if (modelState.activeUnit === "dw" && input.dataset.f30Year === "2027" && input.dataset.f30Key === "volume") {
        syncDwPhaseVolume(Number(input.value));
      }
      renderForecast2030(getLanguage());
      return true;
    }
    return false;
  };
  root?.addEventListener("input", (event) => {
    if (!event.target.closest("[data-f30-phase], [data-f30-year]")) return;
    window.clearTimeout(numericInputTimer);
    const target = event.target;
    numericInputTimer = window.setTimeout(() => commitNumericInput(target), 220);
  });
  root?.addEventListener("focusout", (event) => {
    window.clearTimeout(numericInputTimer);
    commitNumericInput(event.target);
  });
  root?.addEventListener("change", (event) => {
    const select = event.target.closest("[data-f30-mode]");
    if (!select) return;
    activePlan().assumptions[select.dataset.f30Mode].peopleMode = select.value;
    renderForecast2030(getLanguage());
  });
  root?.addEventListener("click", async (event) => {
    const action = event.target.closest("[data-f30-action]")?.dataset.f30Action;
    if (!action) return;
    if (action === "unit") {
      modelState.activeUnit = event.target.closest("[data-f30-unit]").dataset.f30Unit;
      modelState.parsed = null;
    }
    if (action === "advanced") modelState.advanced = !modelState.advanced;
    if (action === "reset") modelState = structuredClone(defaults);
    if (action === "save") localStorage.setItem(STORE_KEY, JSON.stringify(modelState));
    if (action === "parse") {
      const textarea = root.querySelector("#f30AiMessage");
      modelState.aiMessage = textarea.value;
      try { modelState.parsed = await parseAi(modelState.aiMessage); } catch (error) { modelState.parsed = { error: error.message }; }
    }
    if (action === "apply" && modelState.parsed?.year && activePlan().assumptions[modelState.parsed.year]) {
      const parsedYear = modelState.parsed.year;
      const parsedVolume = modelState.parsed.volume;
      Object.assign(activePlan().assumptions[modelState.parsed.year], modelState.parsed);
      delete activePlan().assumptions[modelState.parsed.year].year;
      if (parsedYear === 2027 && parsedVolume != null) syncDwPhaseVolume(Number(parsedVolume));
      modelState.parsed = null;
    }
    if (action === "mic") startSpeech();
    renderForecast2030(getLanguage());
  });
}

function startSpeech() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) return;
  const recognition = new Recognition();
  recognition.lang = getLanguage() === "zh" ? "zh-CN" : getLanguage() === "tr" ? "tr-TR" : "en-US";
  recognition.onresult = (event) => { const textarea = root.querySelector("#f30AiMessage"); textarea.value = event.results[0][0].transcript; modelState.aiMessage = textarea.value; };
  recognition.start();
}

export function renderForecast2030(language = "zh") {
  if (!root) return;
  const copy = c(language);
  const base = activeBase();
  const assumptions = activePlan().assumptions;
  const model = calculate();
  const actual = h1ActualPeople();
  const typeLabel = { fixed: copy.fixed, people: copy.semi, semi: copy.semi, variable: copy.variable };
  const detailCopy = DETAIL_COPY[language] || DETAIL_COPY.zh;
  const impacts = impactGroups(model, language);
  const impactMax = Math.max(1, ...impacts.map(([, value]) => Math.abs(value)));
  root.classList.toggle("show-advanced", modelState.advanced);
  root.innerHTML = `<section class="f30-shell">
    <header class="f30-head"><div><span>${base.unit.toUpperCase()} · LONG RANGE PLAN</span><h2>${copy.title}</h2><p>${copy.sub}</p></div><div><div class="f30-unit-switch"><button data-f30-action="unit" data-f30-unit="ck" class="${modelState.activeUnit === "ck" ? "active" : ""}">CK 厨电</button><button data-f30-action="unit" data-f30-unit="dw" class="${modelState.activeUnit === "dw" ? "active" : ""}">DW 洗碗机</button></div><small>${modelState.activeUnit === "dw" ? copy.source : "CK 2026 · June actual + 6+6 forecast"}</small><button data-f30-action="save">${copy.save}</button><button data-f30-action="reset">${copy.reset}</button></div></header>
    ${renderYearStrip(model, language)}
    <div class="f30-top-grid"><section class="f30-panel"><div class="f30-title"><h3>${copy.conditions}</h3><button data-f30-action="advanced">${copy.advanced}</button></div>${renderPhasePlan(language)}<div class="f30-table-wrap"><table class="f30-input-table"><thead><tr><th>${copy.conditions}</th><th>2026</th>${YEARS.map((year) => `<th>${year}</th>`).join("")}</tr></thead><tbody>
      ${inputRow(copy.volume, "volume", "pcs")}${inputRow(copy.efficiency, "efficiency", "%")}${inputRow(copy.wage, "wage", "%")}${inputRow(copy.fx, "fx", "TRY/EUR")}${inputRow(copy.price, "price", "%")}${inputRow(copy.energy, "energy", "%")}
      ${inputRow(copy.depreciation, "depreciation", "K€", true)}${inputRow(copy.allocation, "allocation", "%", true)}${inputRow(copy.waste, "indirectWaste", "%", true)}${inputRow(copy.tempExit, "tempExit", "HC", true)}${inputRow(copy.tempCost, "tempMonthlyCost", "K€/HC", true)}${inputRow(copy.tempMonths, "tempMonths", "month", true)}
    </tbody></table></div></section>
    <aside class="f30-panel f30-ai"><div class="f30-title"><h3>${copy.ai}</h3><span>${window.MFG_FORECAST_AI_CONFIG?.endpoint ? detailCopy.apiConnected : detailCopy.localParser}</span></div><div class="f30-ai-body"><p>${copy.aiHint}</p><textarea id="f30AiMessage">${safe(modelState.aiMessage)}</textarea><div class="f30-ai-actions"><button data-f30-action="mic" title="Voice">●</button><button data-f30-action="parse">${copy.parse}</button></div>${parsedHtml(modelState.parsed, language)}<button class="f30-apply" data-f30-action="apply" ${modelState.parsed ? "" : "disabled"}>${copy.apply}</button><small>${copy.apiSettings}</small></div></aside></div>
    <section class="f30-panel f30-people"><div class="f30-title"><h3>${copy.people}</h3><span>${copy.actualPeople} / ${copy.originalPlan}</span></div><div class="f30-table-wrap"><table class="f30-input-table"><thead><tr><th>${copy.avg}</th><th>2026 H1 / FY</th>${YEARS.map((year) => `<th>${year}</th>`).join("")}</tr></thead><tbody>${peopleRow(copy.direct, "direct", actual.direct, base.headcount.direct)}${peopleRow(copy.indirect, "indirect", actual.indirect, base.headcount.indirect)}${peopleRow(copy.white, "white", actual.white, base.headcount.white)}<tr><th>${copy.suggested}<small>HC</small></th><td><span class="f30-baseline-value">${detailCopy.noChange}</span></td>${YEARS.map((year) => { const a = assumptions[year]; const suggested = base.headcount.direct * a.volume / base.volume / (1 + a.efficiency / 100); return `<td><b>${n(suggested, 1)}</b><select data-f30-mode="${year}"><option value="manual" ${a.peopleMode === "manual" ? "selected" : ""}>${copy.manual}</option><option value="auto" ${a.peopleMode === "auto" ? "selected" : ""}>${copy.auto}</option></select></td>`; }).join("")}</tr></tbody></table></div></section>
    <div class="f30-results"><section class="f30-panel"><div class="f30-title"><h3>${copy.trend}</h3><span>K€ / €/pc</span></div>${renderTrend(model)}</section><section class="f30-panel"><div class="f30-title"><h3>${copy.impact}</h3><span>vs 2026 · K€</span></div><div class="f30-driver-list">${impacts.map(([label, value]) => `<div><span>${label}</span><i><em class="${value < 0 ? "good" : "bad"}" style="width:${Math.max(2, Math.abs(value) / impactMax * 100)}%"></em></i><b class="${value < 0 ? "good" : "bad"}">${value > 0 ? "+" : ""}${n(value)}</b></div>`).join("")}</div></section></div>
    <section class="f30-panel"><div class="f30-title"><h3>${copy.detail}</h3><span>${copy.formula}</span></div><div class="f30-table-wrap"><table class="f30-cost-table"><thead><tr><th>Category</th><th>Type</th><th>2026</th>${YEARS.map((year) => `<th>${year}</th>`).join("")}<th>2030 %</th></tr></thead><tbody>${model.rows.map((row) => `<tr><th>${row.name}<span class="f30-info" title="${safe(traceFor(row, 2026, model, language))}">i</span></th><td><span class="type-${row.type}">${typeLabel[row.type]}</span></td><td class="f30-data-point" title="${safe(traceFor(row, 2026, model, language))}">${n(row.values[2026], 2)}</td>${YEARS.map((year) => `<td class="f30-data-point" title="${safe(traceFor(row, year, model, language))}">${n(row.values[year], 2)}</td>`).join("")}<td title="${safe(`${row.name} · 2030\n${pct(row.values[2030] / model.totals[2030] * 100)}`)}">${pct(row.values[2030] / model.totals[2030] * 100)}</td></tr>`).join("")}</tbody></table></div></section>
  </section>`;
}
