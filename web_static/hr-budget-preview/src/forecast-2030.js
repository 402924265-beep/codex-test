import { FACTORY_WORKBENCH_DATA } from "./factory-workbench-data.js?v=20260721-factory-workbench-v3";

const YEARS = [2027, 2028, 2029, 2030];
const STORE_KEY = "dw.forecast2030.v1";
const BASE_FX = 56.9918;
const BASE = {
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

const defaults = {
  scenario: "base",
  assumptions: {
    2027: { volume: 295000, efficiency: 5, peopleMode: "manual", direct: 121.5, indirect: 49.7, white: 13, wage: 8, fx: 60, price: 8, energy: 10, depreciation: -110, allocation: 100, indirectWaste: 5, tempExit: 0, tempMonthlyCost: 1.5, tempMonths: 0 },
    2028: { volume: 250000, efficiency: 8, peopleMode: "manual", direct: 131, indirect: 34, white: 11, wage: 8, fx: 65, price: 8, energy: 8, depreciation: 0, allocation: 100, indirectWaste: 0, tempExit: 0, tempMonthlyCost: 1.5, tempMonths: 0 },
    2029: { volume: 250000, efficiency: 0, peopleMode: "manual", direct: 131, indirect: 34, white: 11, wage: 8, fx: 70, price: 8, energy: 6, depreciation: 0, allocation: 100, indirectWaste: 0, tempExit: 0, tempMonthlyCost: 1.5, tempMonths: 0 },
    2030: { volume: 250000, efficiency: 0, peopleMode: "manual", direct: 131, indirect: 34, white: 11, wage: 8, fx: 75, price: 8, energy: 5, depreciation: 0, allocation: 100, indirectWaste: 0, tempExit: 0, tempMonthlyCost: 1.5, tempMonths: 0 }
  },
  advanced: false,
  parsed: null,
  aiMessage: "2027年产量30万台，直接员工125人，间接员工48人，白领13人，人工上涨8%，汇率60，提效5%"
};

let root = null;
let getLanguage = () => "zh";
let modelState = loadState();

const COPY = {
  zh: { title: "2025–2030 制造费预测模型", sub: "按产量、人数、效率、工资、价格和汇率预测未来制造费用", source: "基线：25-30制造费预测.xlsx · DW 2026", conditions: "年度预测条件", people: "人员规划", direct: "直接员工", indirect: "间接员工", white: "白领", avg: "平均人数", suggested: "建议直接人数", manual: "手动", auto: "按提效", advanced: "高级条件", ai: "AI 预测助手", apiReady: "API 可连接", aiHint: "直接输入或说出条件，解析确认后再更新模型。", parse: "解析指令", apply: "确认并更新预测", recognized: "已识别", apiSettings: "API 设置与测试连接", total: "2030 总制造费", unit: "2030 单台制造费", peopleTotal: "2030 平均人数", avoid: "累计提效避免成本", trend: "制造费与单台趋势", impact: "2030 影响拆解", detail: "大科目预测结果", formula: "计算链路", fixed: "固定", semi: "半固定", variable: "变动", volume: "产量", efficiency: "直接效率提升", wage: "工资上涨", fx: "EUR/TRY", price: "一般价格上涨", energy: "能源价格上涨", depreciation: "折旧增减", allocation: "园区分摊比例", waste: "间接浪费系数", tempExit: "临时工退出", tempCost: "临时工月成本", tempMonths: "影响月数", save: "保存情景", reset: "恢复原模型", actualPeople: "2026年1-6月实际平均", originalPlan: "2026全年模型基线", effectVolume: "产量/人数变化", effectWage: "工资上涨", effectPrice: "价格上涨", effectEnergy: "能源价格", effectFx: "汇率换算", effectFixed: "折旧/分摊" },
  en: { title: "2025–2030 Manufacturing Cost Forecast", sub: "Forecast by volume, headcount, efficiency, wages, prices and FX", source: "Baseline: 25-30 MFG forecast.xlsx · DW 2026", conditions: "Annual assumptions", people: "Headcount plan", direct: "Direct", indirect: "Indirect", white: "White collar", avg: "Average HC", suggested: "Suggested direct HC", manual: "Manual", auto: "Efficiency", advanced: "Advanced assumptions", ai: "AI Forecast Assistant", apiReady: "API ready", aiHint: "Type or speak assumptions. Review parsed values before applying.", parse: "Parse", apply: "Confirm and update", recognized: "Recognized", apiSettings: "API settings & connection test", total: "2030 total MFG cost", unit: "2030 unit cost", peopleTotal: "2030 average HC", avoid: "Efficiency cost avoided", trend: "Cost and unit-cost trend", impact: "2030 impact bridge", detail: "Category forecast", formula: "Calculation trace", fixed: "Fixed", semi: "Semi-fixed", variable: "Variable", volume: "Volume", efficiency: "Direct efficiency", wage: "Wage increase", fx: "EUR/TRY", price: "General inflation", energy: "Energy inflation", depreciation: "Depreciation change", allocation: "Park allocation", waste: "Indirect waste", tempExit: "Temp exits", tempCost: "Temp monthly cost", tempMonths: "Affected months", save: "Save scenario", reset: "Restore source model", actualPeople: "2026 Jan-Jun actual avg.", originalPlan: "2026 full-year model baseline", effectVolume: "Volume / HC", effectWage: "Wages", effectPrice: "Prices", effectEnergy: "Energy", effectFx: "FX conversion", effectFixed: "Depreciation / allocation" },
  tr: { title: "2025–2030 Üretim Gideri Tahmini", sub: "Hacim, çalışan, verimlilik, ücret, fiyat ve kur ile tahmin", source: "Baz: 25-30 üretim gideri tahmini.xlsx · DW 2026", conditions: "Yıllık varsayımlar", people: "Çalışan planı", direct: "Direkt", indirect: "Endirekt", white: "Beyaz yaka", avg: "Ortalama kişi", suggested: "Önerilen direkt kişi", manual: "Manuel", auto: "Verimlilik", advanced: "Gelişmiş varsayımlar", ai: "AI Tahmin Asistanı", apiReady: "API bağlanabilir", aiHint: "Koşulları yazın veya söyleyin; uygulamadan önce kontrol edin.", parse: "Komutu çöz", apply: "Onayla ve güncelle", recognized: "Algılandı", apiSettings: "API ayarı ve bağlantı testi", total: "2030 toplam üretim gideri", unit: "2030 birim gider", peopleTotal: "2030 ortalama çalışan", avoid: "Verimlilik tasarrufu", trend: "Gider ve birim gider eğilimi", impact: "2030 etki kırılımı", detail: "Gider grubu tahmini", formula: "Hesap izi", fixed: "Sabit", semi: "Yarı sabit", variable: "Değişken", volume: "Hacim", efficiency: "Direkt verimlilik", wage: "Ücret artışı", fx: "EUR/TRY", price: "Genel fiyat artışı", energy: "Enerji fiyat artışı", depreciation: "Amortisman değişimi", allocation: "Kampüs dağıtımı", waste: "Endirekt kayıp", tempExit: "Geçici çıkışı", tempCost: "Aylık geçici maliyet", tempMonths: "Etkilenen ay", save: "Senaryoyu kaydet", reset: "Kaynak modeli geri yükle", actualPeople: "2026 Ocak-Haziran fiili ort.", originalPlan: "2026 tam yıl model bazı", effectVolume: "Hacim / çalışan", effectWage: "Ücret", effectPrice: "Fiyat", effectEnergy: "Enerji", effectFx: "Kur", effectFixed: "Amortisman / dağıtım" }
};

const DETAIL_COPY = {
  zh: {
    phasePlan: "2027 阶段计划：1-3月三班、4-6月两班、7-12月一班；年度产量与平均人数由阶段计划汇总。",
    laborImpact: "直接/间接/白领人工",
    peopleServiceImpact: "运营及人相关费用",
    energyImpact: "固定及变动能源",
    variableImpact: "产量联动费用",
    fixedImpact: "折旧及园区分摊"
  },
  en: {
    phasePlan: "2027 phase plan: 3 shifts in Jan-Mar, 2 in Apr-Jun and 1 in Jul-Dec; annual volume and average HC are aggregated from the phases.",
    laborImpact: "Direct / indirect / white-collar labor",
    peopleServiceImpact: "Operations and people-related cost",
    energyImpact: "Fixed and variable energy",
    variableImpact: "Volume-linked cost",
    fixedImpact: "Depreciation and park allocation"
  },
  tr: {
    phasePlan: "2027 faz planı: Ocak-Mart 3 vardiya, Nisan-Haziran 2 vardiya, Temmuz-Aralık 1 vardiya; yıllık hacim ve ortalama çalışan fazlardan hesaplanır.",
    laborImpact: "Direkt / endirekt / beyaz yaka işçilik",
    peopleServiceImpact: "Operasyon ve çalışan bağlantılı gider",
    energyImpact: "Sabit ve değişken enerji",
    variableImpact: "Hacme bağlı gider",
    fixedImpact: "Amortisman ve kampüs dağıtımı"
  }
};

function loadState() {
  try { return { ...structuredClone(defaults), ...JSON.parse(globalThis.localStorage?.getItem(STORE_KEY) || "{}") }; }
  catch { return structuredClone(defaults); }
}

function c(language) { return COPY[language] || COPY.zh; }
function n(value, digits = 0) { return Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits }); }
function pct(value) { return `${Number(value || 0).toFixed(1)}%`; }
function safe(value) { return String(value ?? "").replace(/[&<>\"]/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[x])); }

function h1ActualPeople() {
  const months = FACTORY_WORKBENCH_DATA.units.dishwasher.months;
  return ["direct", "indirect", "white"].reduce((out, key) => {
    out[key] = months.reduce((sum, month) => sum + month.headcount[key], 0) / months.length;
    return out;
  }, {});
}

function calculate() {
  const rows = BASE.costs.map(([key, name, type, value]) => ({ key, name, type, values: { 2026: value } }));
  const totals = { 2026: rows.reduce((sum, row) => sum + row.values[2026], 0) };
  const units = { 2026: totals[2026] * 1000 / BASE.volume };
  const effectivePeople = { 2026: { ...BASE.headcount } };
  let previousFx = BASE_FX;

  for (const year of YEARS) {
    const a = modelState.assumptions[year];
    const priorYear = year - 1;
    const priorVolume = priorYear === 2026 ? BASE.volume : modelState.assumptions[priorYear].volume;
    const suggestedDirect = BASE.headcount.direct * (a.volume / BASE.volume) / (1 + a.efficiency / 100);
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
      else if (row.key === "allocation") row.values[year] = BASE.costs.find((x) => x[0] === "allocation")[3] * a.allocation / 100;
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

function inputRow(label, key, unit, advanced = false) {
  return `<tr class="${advanced ? "f30-advanced" : ""}"><th>${label}<small>${unit}</small></th><td>—</td>${YEARS.map((year) => `<td><input data-f30-year="${year}" data-f30-key="${key}" type="number" step="0.1" value="${modelState.assumptions[year][key]}"></td>`).join("")}</tr>`;
}

function peopleRow(label, key, actual, baseline) {
  return `<tr><th>${label}<small>HC</small></th><td><span title="${c(getLanguage()).actualPeople}">${n(actual, 1)}</span><em>${n(baseline, 1)}</em></td>${YEARS.map((year) => `<td><input data-f30-year="${year}" data-f30-key="${key}" type="number" step="0.1" value="${modelState.assumptions[year][key]}"></td>`).join("")}</tr>`;
}

function renderTrend(model) {
  const years = [2026, ...YEARS];
  const max = Math.max(...years.map((year) => model.totals[year]));
  return `<div class="f30-chart">${years.map((year) => `<div class="f30-chart-col"><div class="f30-unit-label">${n(model.units[year], 2)}</div><div class="f30-bar" style="height:${Math.max(30, model.totals[year] / max * 135)}px"><b>${n(model.totals[year], 0)}</b></div><span>${year}</span></div>`).join("")}</div>`;
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
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, assumptions: modelState.assumptions, years: YEARS }) });
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

export function initForecast2030(container, languageGetter) {
  root = container;
  getLanguage = languageGetter || getLanguage;
  root?.addEventListener("change", (event) => {
    const input = event.target.closest("[data-f30-year]");
    if (input) {
      modelState.assumptions[input.dataset.f30Year][input.dataset.f30Key] = Number(input.value);
      renderForecast2030(getLanguage());
      return;
    }
    const select = event.target.closest("[data-f30-mode]");
    if (!select) return;
    modelState.assumptions[select.dataset.f30Mode].peopleMode = select.value;
    renderForecast2030(getLanguage());
  });
  root?.addEventListener("click", async (event) => {
    const action = event.target.closest("[data-f30-action]")?.dataset.f30Action;
    if (!action) return;
    if (action === "advanced") modelState.advanced = !modelState.advanced;
    if (action === "reset") modelState = structuredClone(defaults);
    if (action === "save") localStorage.setItem(STORE_KEY, JSON.stringify(modelState));
    if (action === "parse") {
      const textarea = root.querySelector("#f30AiMessage");
      modelState.aiMessage = textarea.value;
      try { modelState.parsed = await parseAi(modelState.aiMessage); } catch (error) { modelState.parsed = { error: error.message }; }
    }
    if (action === "apply" && modelState.parsed?.year && modelState.assumptions[modelState.parsed.year]) {
      Object.assign(modelState.assumptions[modelState.parsed.year], modelState.parsed);
      delete modelState.assumptions[modelState.parsed.year].year;
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
  const model = calculate();
  const actual = h1ActualPeople();
  const finalYear = 2030;
  const people2030 = Object.values(model.effectivePeople[finalYear]).reduce((sum, value) => sum + value, 0);
  const noEfficiencyPeople = BASE.headcount.direct * modelState.assumptions[finalYear].volume / BASE.volume;
  const efficiencyAvoided = Math.max(0, noEfficiencyPeople - model.effectivePeople[finalYear].direct) * (BASE.costs.find((x) => x[0] === "direct")[3] / BASE.headcount.direct);
  const typeLabel = { fixed: copy.fixed, people: copy.semi, semi: copy.semi, variable: copy.variable };
  const detailCopy = DETAIL_COPY[language] || DETAIL_COPY.zh;
  const impacts = impactGroups(model, language);
  const impactMax = Math.max(1, ...impacts.map(([, value]) => Math.abs(value)));
  root.classList.toggle("show-advanced", modelState.advanced);
  root.innerHTML = `<section class="f30-shell">
    <header class="f30-head"><div><span>DW · LONG RANGE PLAN</span><h2>${copy.title}</h2><p>${copy.sub}</p></div><div><small>${copy.source}</small><button data-f30-action="save">${copy.save}</button><button data-f30-action="reset">${copy.reset}</button></div></header>
    <div class="f30-kpis"><article><span>${copy.total}</span><b>${n(model.totals[2030], 2)}</b><small>K€</small></article><article><span>${copy.unit}</span><b>${n(model.units[2030], 2)}</b><small>€/pc</small></article><article><span>${copy.peopleTotal}</span><b>${n(people2030, 1)}</b><small>HC</small></article><article><span>${copy.avoid}</span><b class="good">-${n(efficiencyAvoided, 1)}</b><small>K€</small></article></div>
    <div class="f30-top-grid"><section class="f30-panel"><div class="f30-title"><h3>${copy.conditions}</h3><button data-f30-action="advanced">${copy.advanced}</button></div><div class="f30-phase-note">${detailCopy.phasePlan}</div><div class="f30-table-wrap"><table class="f30-input-table"><thead><tr><th>${copy.conditions}</th><th>2026</th>${YEARS.map((year) => `<th>${year}</th>`).join("")}</tr></thead><tbody>
      ${inputRow(copy.volume, "volume", "pcs")}${inputRow(copy.efficiency, "efficiency", "%")}${inputRow(copy.wage, "wage", "%")}${inputRow(copy.fx, "fx", "TRY/EUR")}${inputRow(copy.price, "price", "%")}${inputRow(copy.energy, "energy", "%")}
      ${inputRow(copy.depreciation, "depreciation", "K€", true)}${inputRow(copy.allocation, "allocation", "%", true)}${inputRow(copy.waste, "indirectWaste", "%", true)}${inputRow(copy.tempExit, "tempExit", "HC", true)}${inputRow(copy.tempCost, "tempMonthlyCost", "K€/HC", true)}${inputRow(copy.tempMonths, "tempMonths", "month", true)}
    </tbody></table></div></section>
    <aside class="f30-panel f30-ai"><div class="f30-title"><h3>${copy.ai}</h3><span>${copy.apiReady}</span></div><div class="f30-ai-body"><p>${copy.aiHint}</p><textarea id="f30AiMessage">${safe(modelState.aiMessage)}</textarea><div class="f30-ai-actions"><button data-f30-action="mic" title="Voice">●</button><button data-f30-action="parse">${copy.parse}</button></div>${parsedHtml(modelState.parsed, language)}<button class="f30-apply" data-f30-action="apply" ${modelState.parsed ? "" : "disabled"}>${copy.apply}</button><small>${copy.apiSettings}</small></div></aside></div>
    <section class="f30-panel f30-people"><div class="f30-title"><h3>${copy.people}</h3><span>${copy.actualPeople} / ${copy.originalPlan}</span></div><div class="f30-table-wrap"><table class="f30-input-table"><thead><tr><th>${copy.avg}</th><th>2026 H1 / FY</th>${YEARS.map((year) => `<th>${year}</th>`).join("")}</tr></thead><tbody>${peopleRow(copy.direct, "direct", actual.direct, BASE.headcount.direct)}${peopleRow(copy.indirect, "indirect", actual.indirect, BASE.headcount.indirect)}${peopleRow(copy.white, "white", actual.white, BASE.headcount.white)}<tr><th>${copy.suggested}<small>HC</small></th><td>—</td>${YEARS.map((year) => { const a = modelState.assumptions[year]; const suggested = BASE.headcount.direct * a.volume / BASE.volume / (1 + a.efficiency / 100); return `<td><b>${n(suggested, 1)}</b><select data-f30-mode="${year}"><option value="manual" ${a.peopleMode === "manual" ? "selected" : ""}>${copy.manual}</option><option value="auto" ${a.peopleMode === "auto" ? "selected" : ""}>${copy.auto}</option></select></td>`; }).join("")}</tr></tbody></table></div></section>
    <div class="f30-results"><section class="f30-panel"><div class="f30-title"><h3>${copy.trend}</h3><span>K€ / €/pc</span></div>${renderTrend(model)}</section><section class="f30-panel"><div class="f30-title"><h3>${copy.impact}</h3><span>vs 2026 · K€</span></div><div class="f30-driver-list">${impacts.map(([label, value]) => `<div><span>${label}</span><i><em class="${value < 0 ? "good" : "bad"}" style="width:${Math.max(2, Math.abs(value) / impactMax * 100)}%"></em></i><b class="${value < 0 ? "good" : "bad"}">${value > 0 ? "+" : ""}${n(value)}</b></div>`).join("")}</div></section></div>
    <section class="f30-panel"><div class="f30-title"><h3>${copy.detail}</h3><span>${copy.formula}</span></div><div class="f30-table-wrap"><table class="f30-cost-table"><thead><tr><th>Category</th><th>Type</th><th>2026</th>${YEARS.map((year) => `<th>${year}</th>`).join("")}<th>2030 %</th></tr></thead><tbody>${model.rows.map((row) => `<tr title="${safe(row.key)}"><th>${row.name}</th><td><span class="type-${row.type}">${typeLabel[row.type]}</span></td><td>${n(row.values[2026], 2)}</td>${YEARS.map((year) => `<td>${n(row.values[year], 2)}</td>`).join("")}<td>${pct(row.values[2030] / model.totals[2030] * 100)}</td></tr>`).join("")}</tbody></table></div></section>
  </section>`;
}
