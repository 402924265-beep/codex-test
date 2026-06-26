const state = {
  config: null,
  payload: null,
  analysisByCode: loadSavedAnalysis(),
  selectedCategory: "all",
  chartHitZones: []
};

const els = {
  actual25Path: document.getElementById("actual25Path"),
  actual26Path: document.getElementById("actual26Path"),
  reference4plus8Path: document.getElementById("reference4plus8Path"),
  loadBtn: document.getElementById("loadBtn"),
  exportBtn: document.getElementById("exportBtn"),
  message: document.getElementById("message"),
  sourceLine: document.getElementById("sourceLine"),
  total26: document.getElementById("total26"),
  total25: document.getElementById("total25"),
  diffTotal: document.getElementById("diffTotal"),
  unit26: document.getElementById("unit26"),
  unit25: document.getElementById("unit25"),
  diffUnit: document.getElementById("diffUnit"),
  sapTotal: document.getElementById("sapTotal"),
  fcNote: document.getElementById("fcNote"),
  statusCounts: document.getElementById("statusCounts"),
  referenceSummary: document.getElementById("referenceSummary"),
  referenceBody: document.getElementById("referenceBody"),
  searchInput: document.getElementById("searchInput"),
  statusFilter: document.getElementById("statusFilter"),
  categoryFilter: document.getElementById("categoryFilter"),
  sortBy: document.getElementById("sortBy"),
  detailBody: document.getElementById("detailBody"),
  chart: document.getElementById("categoryChart")
};

document.addEventListener("DOMContentLoaded", init);
els.loadBtn.addEventListener("click", loadReconciliation);
els.exportBtn.addEventListener("click", exportWorkbook);
els.searchInput.addEventListener("input", renderTable);
els.statusFilter.addEventListener("change", renderTable);
els.categoryFilter.addEventListener("change", () => {
  state.selectedCategory = els.categoryFilter.value;
  renderTable();
});
els.sortBy.addEventListener("change", renderTable);
els.chart.addEventListener("click", handleChartClick);
window.addEventListener("resize", () => {
  if (state.payload) renderChart();
});

async function init() {
  try {
    state.config = await getJson("/api/config");
    loadSavedPaths();
    els.sourceLine.textContent = `${state.config.project}${state.config.monthLabel}: 26实际 - 25同期，预算暂不纳入`;
    await loadReconciliation();
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function loadReconciliation() {
  setMessage("正在读取工作簿并计算差异...");
  els.loadBtn.disabled = true;
  els.exportBtn.disabled = true;
  try {
    savePaths();
    const payload = await postJson("/api/reconcile", {
      actual25Path: els.actual25Path.value.trim(),
      actual26Path: els.actual26Path.value.trim(),
      reference4plus8Path: els.reference4plus8Path.value.trim()
    });
    state.payload = payload;
    state.selectedCategory = "all";
    els.categoryFilter.value = "all";
    renderAll();
    const detailCount = payload.rows.filter(row => !row.is_summary).length;
    setMessage(`已读取 ${payload.metadata.actual_26.sheet}，共 ${detailCount} 个明细科目/成本要素。`);
    els.exportBtn.disabled = false;
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    els.loadBtn.disabled = false;
  }
}

function renderAll() {
  renderSummary();
  renderCategoryFilter();
  renderChart();
  renderReferenceChecks();
  renderTable();
}

function renderSummary() {
  const s = state.payload.summary;
  els.total26.textContent = formatMoney(s.total_amount_26);
  els.total25.textContent = formatMoney(s.total_amount_25);
  els.diffTotal.textContent = formatMoney(s.total_amount_diff);
  els.unit26.textContent = `${formatUnit(s.total_unit_26)} €/台`;
  els.unit25.textContent = `${formatUnit(s.total_unit_25)} €/台`;
  els.diffUnit.textContent = `${formatUnit(s.total_unit_diff)} €/台`;
  els.sapTotal.textContent = formatMoney(s.reference_total_26_4plus8);
  els.fcNote.textContent = `差异 ${formatMoney(s.reference_total_diff_26_4plus8)} K€；FC ${formatMoney(s.reference_fc_26_4plus8)} 已含折旧`;
  els.statusCounts.textContent = `${s.both_count} / ${s.only_25_count} / ${s.only_26_count}`;
}

function renderReferenceChecks() {
  const checks = state.payload.reference_checks || [];
  const s = state.payload.summary;
  els.referenceSummary.textContent = `SAP合计 ${formatMoney(s.total_amount_26)} K€，4+8合计 ${formatMoney(s.reference_total_26_4plus8)} K€`;
  els.referenceBody.innerHTML = checks.map(item => `
    <tr>
      <td>${escapeHtml(item.label || "")}</td>
      <td>${formatMoney(item.amount_sap_26)}</td>
      <td>${formatMoney(item.amount_reference_26)}</td>
      <td class="${valueClass(item.amount_diff)}">${formatMoney(item.amount_diff)}</td>
    </tr>
  `).join("") || '<tr><td colspan="4" class="empty">未读取到4+8校验数据</td></tr>';
}

function renderCategoryFilter() {
  const current = state.selectedCategory;
  els.categoryFilter.innerHTML = '<option value="all">全部大科目</option>';
  for (const item of state.payload.categories) {
    const option = document.createElement("option");
    option.value = item.category;
    option.textContent = item.category;
    els.categoryFilter.appendChild(option);
  }
  els.categoryFilter.value = current;
}

function renderTable() {
  if (!state.payload) return;
  const rows = getVisibleRows();
  const html = rows.map(rowToHtml).join("");
  els.detailBody.innerHTML = html || '<tr><td colspan="10" class="empty">没有符合条件的科目</td></tr>';
  for (const textarea of els.detailBody.querySelectorAll("textarea")) {
    textarea.addEventListener("input", event => {
      const code = event.target.dataset.code;
      state.analysisByCode[code] = event.target.value;
      saveAnalysis();
    });
  }
}

function getVisibleRows() {
  const search = els.searchInput.value.trim().toLowerCase();
  const status = els.statusFilter.value;
  const category = state.selectedCategory;
  const sortBy = els.sortBy.value;
  const rows = state.payload.rows.filter(row => {
    if (row.is_summary) return false;
    if (category !== "all" && row.category !== category) return false;
    if (status === "high" && !row.is_high_impact) return false;
    if (!["all", "high"].includes(status) && row.status !== status) return false;
    if (!search) return true;
    const haystack = `${row.code} ${row.desc_en || ""} ${row.desc_cn || ""} ${row.category || ""}`.toLowerCase();
    return haystack.includes(search);
  });
  rows.sort((a, b) => {
    if (sortBy === "code") return String(a.code).localeCompare(String(b.code), "zh-Hans-CN", { numeric: true });
    const key = sortBy === "unit" ? "unit_diff" : "amount_diff";
    return Math.abs(b[key] || 0) - Math.abs(a[key] || 0);
  });
  return rows;
}

function rowToHtml(row) {
  const analysis = state.analysisByCode[row.code] ?? row.analysis ?? "";
  return `
    <tr class="${row.is_high_impact ? "high" : ""}">
      <td>
        <div class="account-code">${escapeHtml(row.code)}</div>
        <div class="desc">${escapeHtml(row.desc_en || row.desc_cn || "")}</div>
      </td>
      <td>${escapeHtml(row.category || "")}</td>
      <td>${formatMoney(row.amount_25)}</td>
      <td>${formatMoney(row.amount_26)}</td>
      <td class="${valueClass(row.amount_diff)}">${formatMoney(row.amount_diff)}</td>
      <td>${formatUnit(row.unit_25)}</td>
      <td>${formatUnit(row.unit_26)}</td>
      <td class="${valueClass(row.unit_diff)}">${formatUnit(row.unit_diff)}</td>
      <td><span class="status ${row.status}">${escapeHtml(row.status_label)}</span></td>
      <td><textarea data-code="${escapeHtml(row.code)}" placeholder="填写原因、责任部门、改善动作">${escapeHtml(analysis)}</textarea></td>
    </tr>
  `;
}

function renderChart() {
  const canvas = els.chart;
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(220, Math.floor(rect.height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const categories = state.payload.categories.slice(0, 8);
  const padding = { left: 130, right: 34, top: 16, bottom: 26 };
  const chartWidth = rect.width - padding.left - padding.right;
  const rowHeight = Math.max(28, (rect.height - padding.top - padding.bottom) / Math.max(1, categories.length));
  const maxValue = Math.max(1, ...categories.flatMap(item => [Math.abs(item.amount_25 || 0), Math.abs(item.amount_26 || 0)]));
  state.chartHitZones = [];

  ctx.font = "12px Microsoft YaHei, Segoe UI, sans-serif";
  ctx.textBaseline = "middle";
  categories.forEach((item, index) => {
    const y = padding.top + index * rowHeight;
    const y25 = y + rowHeight * 0.28;
    const y26 = y + rowHeight * 0.62;
    const w25 = Math.abs(item.amount_25 || 0) / maxValue * chartWidth;
    const w26 = Math.abs(item.amount_26 || 0) / maxValue * chartWidth;

    ctx.fillStyle = "#1f2933";
    ctx.fillText(item.category, 10, y + rowHeight * 0.45);
    ctx.fillStyle = "#dbe4ea";
    ctx.fillRect(padding.left, y25 - 5, chartWidth, 8);
    ctx.fillRect(padding.left, y26 - 5, chartWidth, 8);
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(padding.left, y25 - 5, w25, 8);
    ctx.fillStyle = "#0f766e";
    ctx.fillRect(padding.left, y26 - 5, w26, 8);
    ctx.fillStyle = "#64707d";
    ctx.fillText(`25 ${formatMoney(item.amount_25)}`, padding.left + Math.min(w25 + 6, chartWidth - 72), y25 - 1);
    ctx.fillText(`26 ${formatMoney(item.amount_26)}`, padding.left + Math.min(w26 + 6, chartWidth - 72), y26 - 1);
    state.chartHitZones.push({ category: item.category, x: 0, y, width: rect.width, height: rowHeight });
  });

  ctx.fillStyle = "#2563eb";
  ctx.fillRect(padding.left, rect.height - 16, 14, 8);
  ctx.fillStyle = "#64707d";
  ctx.fillText("25同期", padding.left + 20, rect.height - 12);
  ctx.fillStyle = "#0f766e";
  ctx.fillRect(padding.left + 84, rect.height - 16, 14, 8);
  ctx.fillStyle = "#64707d";
  ctx.fillText("26实际", padding.left + 104, rect.height - 12);
}

function handleChartClick(event) {
  const rect = els.chart.getBoundingClientRect();
  const y = event.clientY - rect.top;
  const hit = state.chartHitZones.find(zone => y >= zone.y && y <= zone.y + zone.height);
  if (!hit) return;
  state.selectedCategory = hit.category;
  els.categoryFilter.value = hit.category;
  renderTable();
}

async function exportWorkbook() {
  if (!state.payload) return;
  setMessage("正在生成导出文件...");
  els.exportBtn.disabled = true;
  try {
    const payload = JSON.parse(JSON.stringify(state.payload));
    payload.analysisByCode = state.analysisByCode;
    const response = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "导出失败" }));
      throw new Error(error.error || "导出失败");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "洗碗机1月科目差异分析.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage("导出完成。");
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    els.exportBtn.disabled = false;
  }
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`读取失败：${response.status}`);
  return response.json();
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `请求失败：${response.status}`);
  return payload;
}

function setMessage(text, isError = false) {
  els.message.textContent = text;
  els.message.classList.toggle("error", isError);
}

function formatMoney(value) {
  return formatNumber(value, 2);
}

function formatUnit(value) {
  return formatNumber(value, 3);
}

function formatNumber(value, digits) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return Number(value).toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function valueClass(value) {
  if (!value) return "";
  return value > 0 ? "positive" : "negative";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadSavedAnalysis() {
  try {
    return JSON.parse(localStorage.getItem("dwAnalysisByCode") || "{}");
  } catch {
    return {};
  }
}

function loadSavedPaths() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem("dwSourcePaths") || "{}");
  } catch {
    saved = {};
  }
  els.actual25Path.value = saved.actual25Path || state.config.defaultActual25Path || "";
  els.actual26Path.value = saved.actual26Path || state.config.defaultActual26Path || "";
  els.reference4plus8Path.value = saved.reference4plus8Path || state.config.defaultReference4plus8Path || "";
}

function savePaths() {
  localStorage.setItem("dwSourcePaths", JSON.stringify({
    actual25Path: els.actual25Path.value.trim(),
    actual26Path: els.actual26Path.value.trim(),
    reference4plus8Path: els.reference4plus8Path.value.trim()
  }));
}

function saveAnalysis() {
  localStorage.setItem("dwAnalysisByCode", JSON.stringify(state.analysisByCode));
}
