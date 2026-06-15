const CANONICAL = {
  scrapSelling: "卖废",
  scrap: "报废"
};

const ALIAS_MAP = new Map([
  [CANONICAL.scrapSelling, ["scrap selling", "scrap reselling", "废品回收", "卖废"]],
  [CANONICAL.scrap, ["scrap", "报废", "可回收废料", "obsolete"]],
  ["直接人工", ["direct labor", "直接人工"]],
  ["变动能源", ["variable utilities", "变动能源费", "变动能源"]],
  ["间接人工", ["indirect labour", "indirect labor", "间接人工成本-辅助人员", "间接人工"]],
  ["固定人工", ["fixed labour", "fixed labor", "固定人工-白领", "固定人工"]],
  ["半固定费用", ["semifixed", "半固定-班车/工作服", "半固定费用"]],
  ["固定能源", ["fixed utilities", "固定能源费", "固定能源"]],
  ["固定费用", ["fixed cost", "运营费"]],
  ["折旧", ["depreciation", "depreciation incl. fc", "折旧（含fc）", "折旧"]]
]);

const LOOKUP = new Map();
for (const [canonical, aliases] of ALIAS_MAP) {
  for (const alias of aliases) {
    LOOKUP.set(normalizeLabel(alias), canonical);
  }
}

export function categoryAlias(label) {
  const normalized = normalizeLabel(label);
  return LOOKUP.get(normalized) || String(label || "");
}

export function normalizeLabel(label) {
  return String(label || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}
