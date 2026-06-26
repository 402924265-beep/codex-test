const dailyState = {
  lang: "zh",
  activePage: "production",
  filter: "all",
  productionInputs: {
    volume: 11995,
    directPeople: 9.5,
    indirectPeople: 3.2,
    workDays: 1,
    availableHours: 7.5,
    planOutput: 12462,
    goodOutput: 11890,
    qsRunTime: 450,
    qsDownTime: 54,
    qsStandardOutput: 13500,
    doorRunTime: 450,
    doorDownTime: 49,
    doorStandardOutput: 13200,
    transferRunTime: 450,
    transferDownTime: 68,
    transferStandardOutput: 13000,
    inventory: 12042807,
    dos: 32.82
  },
  dosDetail: {
    fileName: "DOS明细_2026W26.xlsx",
    skuCount: 1286,
    totalInventory: 12042807,
    over90Amount: 620000,
    slowMovingAmount: 1850000
  },
  productionReasons: {
    volume: "工业园区计划外停电，影响当日可生产时间。",
    upph: "返工返修占用部分直接工时。",
    oeeTransfer: "换型等待和短暂停线影响运行时间。",
    overtimeDirect: "返工返修与 GIAS 支援造成直接蓝领加班。"
  },
  peopleInputs: {
    plannedAttendance: 320,
    absencePeople: 13,
    paidAbsPeople: 2,
    unpaidAbsPeople: 11,
    directBlueCollar: 294,
    indirectBlueCollar: 127,
    whiteCollar: 30,
    budgetVolume: 114200,
    overtimePeople: 9,
    overtimeHours: 68
  },
  peopleReasons: {
    unpaidAbs: "请假集中",
    hcDirect: "产线支援需求增加",
    hcWhite: "招聘缺口",
    overtime: "加班管控"
  }
};

const dailyCopy = {
  zh: {
    productionDaily: "生产日报",
    peopleDaily: "人力日报",
    productionSubtitle: "填写基础数据，系统自动计算 UPPH、效率、OEE 和 DOS，异常原因由现场补充。",
    peopleSubtitle: "填写人数和小时，系统自动计算缺勤率、无薪缺勤率和加班率。",
    productionInputs: "生产基础数据",
    productionInputsHint: "只填现场可以直接提供的数据，结果指标由系统计算。",
    peopleInputs: "人力基础数据",
    peopleInputsHint: "人力每天填人数和小时，缺勤率、无薪缺勤率、加班率由系统计算。",
    autoResults: "自动计算结果",
    autoResultsHint: "UPPH、效率、OEE、DOS 等只展示结果和公式，不要求人工重复填写。",
    peopleCalculatedResults: "人力自动计算结果",
    peopleCalculatedHint: "表格展示计算后的指标，原因由人力根据异常项补充。",
    productionWeeklySummary: "生产周总结",
    productionWeeklySummaryHint: "周一输出固定为表格加一句总结，方便直接复制到周报。",
    mondayOutput: "周一输出",
    mondayOutputHint: "直接给管理层看的结论版。",
    monthlyTrendMatrix: "月度趋势矩阵",
    monthlyTrendHint: "保留 Excel 红绿判断，但改成网页可读的趋势视图。",
    all: "全部",
    risk: "异常",
    empty: "未填原因",
    metric: "指标",
    formula: "计算公式",
    target: "目标",
    lastYear: "去年同期",
    actualToday: "今日实际",
    variance: "差异",
    reason: "原因",
    actionSuggestion: "建议动作",
    submitProduction: "提交生产日报",
    submitPeople: "提交今日人力数据",
    submitReasons: "提交原因",
    saveDraft: "保存草稿",
    exportWeeklyReport: "导出周报",
    submittedByStatus: "已由 {name} 提交",
    draftSaved: "草稿已保存",
    filledBy: "填写人：{name}",
    hworkUserHint: "来自 Hwork 登录姓名",
    hworkFallbackUser: "Hwork登录用户",
    inputPlaceholder: "填写原因",
    requiredReason: "异常原因必填",
    noRiskRows: "本周暂无异常指标",
    filled: "已填",
    ok: "正常",
    watch: "关注",
    abnormal: "异常",
    uploadDosDetail: "上传 DOS 明细",
    uploadDosHint: "支持库存库龄、SKU、金额、可用天数等明细；上传后自动回填库存金额和 DOS。",
    chooseFile: "选择明细文件",
    detailFile: "明细文件",
    detailSku: "SKU 行数",
    detailInventory: "库存金额",
    detailOver90: "90天以上库存",
    detailSlowMoving: "呆滞/慢动金额",
    actionDefault: "请责任部门确认原因并在下周例会跟踪改善。",
    summaryRisk: "本周生产重点异常为 {names}，建议优先跟踪原因闭环和次日恢复情况。",
    summaryOk: "本周生产指标整体正常，继续保持日填报和异常原因闭环。",
    peopleConclusionTitle: "本周结论",
    peopleReasonTitle: "异常原因",
    peopleActionTitle: "管理建议",
    peopleConclusion: "人力源数据已填 {filled}/{total} 项，{riskCount} 项计算结果偏离目标，重点关注无薪缺勤、直接蓝领配置和加班管控。",
    peopleReason: "{name} 实际 {actual}，偏离目标，主要原因：{reason}。",
    peopleNoRisk: "暂无明显异常。",
    peopleAction: "建议周会确认缺勤人数来源、人员调配是否覆盖产量波动，并跟踪加班人数与加班小时是否由返工或人员缺口导致。",
    productionInputLabels: {
      volume: "实际产量",
      directPeople: "直接用人",
      indirectPeople: "间接用人",
      workDays: "工作日",
      availableHours: "单日有效工时",
      planOutput: "计划产量",
      goodOutput: "良品数",
      qsRunTime: "焊接线计划运行分钟",
      qsDownTime: "焊接线停线分钟",
      qsStandardOutput: "焊接线标准产能",
      doorRunTime: "门硅胶线计划运行分钟",
      doorDownTime: "门硅胶线停线分钟",
      doorStandardOutput: "门硅胶线标准产能",
      transferRunTime: "转运线计划运行分钟",
      transferDownTime: "转运线停线分钟",
      transferStandardOutput: "转运线标准产能",
      inventory: "库存金额",
      dos: "DOS"
    },
    peopleInputLabels: {
      plannedAttendance: "应出勤人数",
      absencePeople: "缺勤人数",
      paidAbsPeople: "带薪缺勤人数",
      unpaidAbsPeople: "无薪缺勤人数",
      directBlueCollar: "直接蓝领人数",
      indirectBlueCollar: "间接蓝领人数",
      whiteCollar: "白领人数",
      budgetVolume: "预算产量",
      overtimePeople: "加班人数",
      overtimeHours: "加班小时"
    },
    groupLabels: {
      base: "基础产量与人力",
      oee: "OEE 计算数据",
      stock: "库存、DOS 与明细",
      peopleBase: "出勤与缺勤人数",
      peopleHeadcount: "人力配置",
      peopleOvertime: "加班与产量"
    },
    metricLabels: {
      volume: "产量",
      upph: "UPPH",
      efficiency: "效率",
      oeeQs: "OEE 焊接线",
      oeeDoor: "OEE 门硅胶线",
      oeeTransfer: "OEE 转运线",
      inventory: "库存",
      dos: "DOS",
      overtimeDirect: "直接蓝领加班",
      absenteeism: "缺勤率",
      paidAbs: "带薪缺勤率",
      unpaidAbs: "无薪缺勤率",
      hcDirect: "直接蓝领人数",
      budgetVolumes: "预算产量",
      hcIndirect: "间接蓝领人数",
      hcWhite: "白领人数",
      overtime: "加班率"
    },
    formulas: {
      volume: "现场填报",
      upph: "产量 ÷ (直接用人 + 间接用人) ÷ 工作日 ÷ 7.5",
      efficiency: "实际产量 ÷ 计划产量",
      oee: "开动率 × 性能率 × 良品率",
      inventory: "来自 DOS 明细汇总，也可手工修正",
      dos: "来自 DOS 明细：库存可用天数汇总",
      overtimeDirect: "现场填报",
      absenteeism: "缺勤人数 ÷ 应出勤人数",
      paidAbs: "带薪缺勤人数 ÷ 应出勤人数",
      unpaidAbs: "无薪缺勤人数 ÷ 应出勤人数",
      hcDirect: "直接蓝领人数",
      budgetVolumes: "预算产量",
      hcIndirect: "间接蓝领人数",
      hcWhite: "白领人数",
      overtime: "加班人数 ÷ 直接蓝领人数"
    }
  },
  en: {
    productionDaily: "Production Daily",
    peopleDaily: "People Daily",
    productionSubtitle: "Enter source data only. UPPH, efficiency, OEE, and DOS are calculated automatically.",
    peopleSubtitle: "Enter people counts and hours; absence and overtime rates are calculated automatically.",
    productionInputs: "Production Source Data",
    productionInputsHint: "Only enter data the shop floor can provide directly; KPI results are calculated.",
    peopleInputs: "People Source Data",
    peopleInputsHint: "HR enters counts and hours; rates are calculated by the system.",
    autoResults: "Calculated Results",
    autoResultsHint: "UPPH, efficiency, OEE, and DOS show formulas and results, not duplicate manual entry.",
    peopleCalculatedResults: "People Calculated Results",
    peopleCalculatedHint: "The table shows calculated KPIs; HR adds reasons for exceptions.",
    productionWeeklySummary: "Production Weekly Summary",
    productionWeeklySummaryHint: "Monday output is a table plus one summary sentence for easy report reuse.",
    mondayOutput: "Monday Output",
    mondayOutputHint: "A concise management-ready summary.",
    monthlyTrendMatrix: "Monthly Trend Matrix",
    monthlyTrendHint: "Keeps the Excel red/green logic in a cleaner web view.",
    all: "All",
    risk: "Exception",
    empty: "Missing reason",
    metric: "Metric",
    formula: "Formula",
    target: "Target",
    lastYear: "Last year",
    actualToday: "Actual today",
    variance: "Variance",
    reason: "Reason",
    actionSuggestion: "Action",
    submitProduction: "Submit Production Daily",
    submitPeople: "Submit People Data",
    submitReasons: "Submit Reasons",
    saveDraft: "Save Draft",
    exportWeeklyReport: "Export Weekly Report",
    submittedByStatus: "Submitted by {name}",
    draftSaved: "Draft saved",
    filledBy: "Filled by: {name}",
    hworkUserHint: "From Hwork login",
    hworkFallbackUser: "Hwork user",
    inputPlaceholder: "Enter reason",
    requiredReason: "Reason required",
    noRiskRows: "No exception metrics this week",
    filled: "filled",
    ok: "OK",
    watch: "Watch",
    abnormal: "Risk",
    uploadDosDetail: "Upload DOS Detail",
    uploadDosHint: "Upload inventory aging, SKU, amount, and available-day details; inventory and DOS are auto-filled.",
    chooseFile: "Choose detail file",
    detailFile: "Detail file",
    detailSku: "SKU rows",
    detailInventory: "Inventory value",
    detailOver90: "Inventory over 90 days",
    detailSlowMoving: "Slow-moving value",
    actionDefault: "Confirm the cause with the owner and track recovery in next week's meeting.",
    summaryRisk: "Key production exceptions this week are {names}; prioritize cause closure and next-day recovery tracking.",
    summaryOk: "Production KPIs are normal this week; keep daily entry and exception closure running.",
    peopleConclusionTitle: "Weekly Conclusion",
    peopleReasonTitle: "Exception Reason",
    peopleActionTitle: "Management Suggestion",
    peopleConclusion: "People source data is {filled}/{total} filled, with {riskCount} calculated KPIs off target. Focus on unpaid absence, staffing, and overtime control.",
    peopleReason: "{name} actual is {actual}, off target. Main reason: {reason}.",
    peopleNoRisk: "No clear exception.",
    peopleAction: "Confirm absence count sources, staffing coverage for volume swings, and whether overtime people/hours are caused by rework or hiring gaps.",
    productionInputLabels: {},
    peopleInputLabels: {},
    groupLabels: {},
    metricLabels: {},
    formulas: {}
  },
  tr: {
    productionDaily: "Üretim Günlüğü",
    peopleDaily: "İK Günlüğü",
    hworkFallbackUser: "Hwork kullanıcısı",
    submittedByStatus: "{name} tarafından gönderildi",
    submitReasons: "Nedenleri Gönder",
    filledBy: "Dolduran: {name}",
    hworkUserHint: "Hwork oturumundan"
  }
};

dailyCopy.en.productionInputLabels = dailyCopy.zh.productionInputLabels;
dailyCopy.en.peopleInputLabels = dailyCopy.zh.peopleInputLabels;
dailyCopy.en.groupLabels = dailyCopy.zh.groupLabels;
dailyCopy.en.metricLabels = dailyCopy.zh.metricLabels;
dailyCopy.en.formulas = {
  volume: "Shop floor entry",
  upph: "Output / (direct + indirect labor) / workdays / 7.5",
  efficiency: "Actual output / planned output",
  oee: "Availability x performance x quality",
  inventory: "Summed from DOS detail, editable if needed",
  dos: "From DOS detail: inventory available days",
  overtimeDirect: "Shop floor entry",
  absenteeism: "Absent people / planned attendance",
  paidAbs: "Paid absence people / planned attendance",
  unpaidAbs: "Unpaid absence people / planned attendance",
  hcDirect: "Direct blue collar count",
  budgetVolumes: "Budget volume",
  hcIndirect: "Indirect blue collar count",
  hcWhite: "White collar count",
  overtime: "Overtime people / direct blue collars"
};
dailyCopy.tr = { ...dailyCopy.en, ...dailyCopy.tr };

const productionInputGroups = [
  { key: "base", fields: ["volume", "directPeople", "indirectPeople", "workDays", "availableHours", "planOutput", "goodOutput"] },
  { key: "oee", fields: ["qsRunTime", "qsDownTime", "qsStandardOutput", "doorRunTime", "doorDownTime", "doorStandardOutput", "transferRunTime", "transferDownTime", "transferStandardOutput"] },
  { key: "stock", fields: ["inventory", "dos"], upload: true }
];

const peopleInputGroups = [
  { key: "peopleBase", fields: ["plannedAttendance", "absencePeople", "paidAbsPeople", "unpaidAbsPeople"] },
  { key: "peopleHeadcount", fields: ["directBlueCollar", "indirectBlueCollar", "whiteCollar"] },
  { key: "peopleOvertime", fields: ["budgetVolume", "overtimePeople", "overtimeHours"] }
];

function lang() {
  const value = document.getElementById("languageSelect")?.value || "zh";
  return dailyCopy[value] ? value : "zh";
}

function d(key) {
  return dailyCopy[lang()]?.[key] || dailyCopy.zh[key] || key;
}

function dLabel(group, key) {
  return d(group)?.[key] || dailyCopy.zh[group]?.[key] || key;
}

function tpl(text, values) {
  return String(text).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
}

function currentUserName() {
  return window.HWORK_USER_NAME || window.HWORK_CURRENT_USER?.name || document.getElementById("userName")?.value?.trim() || d("hworkFallbackUser");
}

function format(value, unit = "") {
  if (!Number.isFinite(value)) return "-";
  if (unit === "%") return `${value.toFixed(value % 1 ? 2 : 1)}%`;
  if (unit === "€") return `${Math.round(value).toLocaleString("zh-CN")} €`;
  if (Math.abs(value) >= 1000) return Math.round(value).toLocaleString("zh-CN");
  return value.toFixed(value % 1 ? 2 : 0);
}

function formulaOee(runTime, downTime, standardOutput, goodOutput, totalOutput) {
  const availability = runTime > 0 ? (runTime - downTime) / runTime : 0;
  const performance = standardOutput > 0 ? totalOutput / standardOutput : 0;
  const quality = totalOutput > 0 ? goodOutput / totalOutput : 0;
  return availability * performance * quality * 100;
}

function productionResults() {
  const p = dailyState.productionInputs;
  const upph = p.volume / (p.directPeople + p.indirectPeople) / p.workDays / p.availableHours;
  const efficiency = p.planOutput > 0 ? (p.volume / p.planOutput) * 100 : 0;
  return [
    { key: "volume", unit: "台", target: 12032, actual: p.volume, better: "higher", formula: d("formulas").volume },
    { key: "upph", unit: "台/人时", target: 125, actual: upph, better: "higher", formula: d("formulas").upph },
    { key: "efficiency", unit: "%", target: 92.6, actual: efficiency, better: "higher", formula: d("formulas").efficiency },
    { key: "oeeQs", unit: "%", target: 85, actual: formulaOee(p.qsRunTime, p.qsDownTime, p.qsStandardOutput, p.goodOutput, p.volume), better: "higher", formula: d("formulas").oee },
    { key: "oeeDoor", unit: "%", target: 80, actual: formulaOee(p.doorRunTime, p.doorDownTime, p.doorStandardOutput, p.goodOutput, p.volume), better: "higher", formula: d("formulas").oee },
    { key: "oeeTransfer", unit: "%", target: 82, actual: formulaOee(p.transferRunTime, p.transferDownTime, p.transferStandardOutput, p.goodOutput, p.volume), better: "higher", formula: d("formulas").oee },
    { key: "inventory", unit: "€", target: 12500000, actual: p.inventory, better: "lower", formula: d("formulas").inventory },
    { key: "dos", unit: "天", target: 35, actual: p.dos, better: "lower", formula: d("formulas").dos },
    { key: "overtimeDirect", unit: "%", target: 0, actual: 0.75, better: "lower", formula: d("formulas").overtimeDirect }
  ];
}

function peopleResults() {
  const p = dailyState.peopleInputs;
  return [
    { key: "absenteeism", unit: "%", target: 6, lastYear: 5.3, actual: p.absencePeople / p.plannedAttendance * 100, better: "lower", formula: d("formulas").absenteeism },
    { key: "paidAbs", unit: "%", target: 4, lastYear: 0.4, actual: p.paidAbsPeople / p.plannedAttendance * 100, better: "lower", formula: d("formulas").paidAbs },
    { key: "unpaidAbs", unit: "%", target: 2, lastYear: 3.0, actual: p.unpaidAbsPeople / p.plannedAttendance * 100, better: "lower", formula: d("formulas").unpaidAbs },
    { key: "hcDirect", unit: "人", target: 286, lastYear: 279, actual: p.directBlueCollar, better: "near", formula: d("formulas").hcDirect },
    { key: "budgetVolumes", unit: "K台", target: 116681, lastYear: 116681, actual: p.budgetVolume, better: "higher", formula: d("formulas").budgetVolumes },
    { key: "hcIndirect", unit: "人", target: 133, lastYear: 170, actual: p.indirectBlueCollar, better: "near", formula: d("formulas").hcIndirect },
    { key: "hcWhite", unit: "人", target: 34, lastYear: 58, actual: p.whiteCollar, better: "near", formula: d("formulas").hcWhite },
    { key: "overtime", unit: "%", target: 2.5, lastYear: 1.7, actual: p.overtimePeople / p.directBlueCollar * 100, better: "lower", formula: d("formulas").overtime }
  ];
}

function status(item) {
  const diff = item.actual - item.target;
  const tolerance = item.unit === "%" ? 0.35 : Math.max(1, item.target * 0.02);
  if (item.better === "near") return Math.abs(diff) <= tolerance ? "ok" : "watch";
  if (item.better === "higher") return diff >= 0 ? "ok" : Math.abs(diff) > tolerance ? "risk" : "watch";
  return diff <= 0 ? "ok" : Math.abs(diff) > tolerance ? "risk" : "watch";
}

function statusText(item) {
  const s = status(item);
  return s === "ok" ? d("ok") : s === "risk" ? d("abnormal") : d("watch");
}

function variance(item) {
  return item.actual - item.target;
}

function varianceClass(item) {
  const s = status(item);
  return s === "risk" ? "negative" : s === "ok" ? "positive" : "";
}

function reasonEditor(type, key, value, isRisk) {
  const attr = type === "production" ? "data-daily-production-reason" : "data-daily-people-reason";
  const meta = value
    ? `<small class="daily-reason-meta">${tpl(d("filledBy"), { name: currentUserName() })} · ${d("hworkUserHint")}</small>`
    : `<small class="daily-reason-meta muted">${d("hworkUserHint")}</small>`;
  return `<div class="daily-reason-editor"><textarea rows="2" placeholder="${isRisk ? d("requiredReason") : d("inputPlaceholder")}" ${attr}="${key}">${value || ""}</textarea>${meta}</div>`;
}

function reasonTextWithUser(reason) {
  if (!reason) return d("requiredReason");
  return `<div>${reason}</div><small class="daily-reason-meta">${tpl(d("filledBy"), { name: currentUserName() })}</small>`;
}

function renderInputGroups(target, groups, source, labelKey, attrName) {
  return groups.map((group) => `
    <section class="daily-input-group">
      <h3>${dLabel("groupLabels", group.key)}</h3>
      <div class="daily-input-fields">
        ${group.fields.map((field) => `
          <label class="daily-metric-field">
            <span>${dLabel(labelKey, field)}</span>
            <input type="number" step="0.01" value="${source[field]}" ${attrName}="${field}" />
          </label>
        `).join("")}
      </div>
      ${group.upload ? renderDosUpload() : ""}
    </section>
  `).join("");
}

function renderDosUpload() {
  const item = dailyState.dosDetail;
  return `
    <div class="daily-upload-box">
      <div><strong>${d("uploadDosDetail")}</strong><p>${d("uploadDosHint")}</p></div>
      <label class="daily-upload-button">${d("chooseFile")}<input type="file" accept=".xlsx,.xls,.csv" data-daily-dos-upload /></label>
      <div class="daily-detail-grid">
        <span>${d("detailFile")}<strong>${item.fileName}</strong></span>
        <span>${d("detailSku")}<strong>${format(item.skuCount)}</strong></span>
        <span>${d("detailInventory")}<strong>${format(item.totalInventory, "€")}</strong></span>
        <span>${d("detailOver90")}<strong>${format(item.over90Amount, "€")}</strong></span>
        <span>${d("detailSlowMoving")}<strong>${format(item.slowMovingAmount, "€")}</strong></span>
      </div>
    </div>
  `;
}

function renderResultRows(rows, type) {
  return rows.map((row) => {
    const diff = variance(row);
    const reason = type === "production" ? dailyState.productionReasons[row.key] : dailyState.peopleReasons[row.key];
    return `
      <tr class="${status(row)}">
        <td><strong>${dLabel("metricLabels", row.key)}</strong><br><small>${statusText(row)}</small></td>
        <td class="daily-formula-cell">${row.formula}</td>
        <td>${format(row.target, row.unit)}</td>
        ${row.lastYear === undefined ? "" : `<td>${format(row.lastYear, row.unit)}</td>`}
        <td><strong>${format(row.actual, row.unit)}</strong></td>
        <td><span class="variance ${varianceClass(row)}">${diff > 0 ? "+" : ""}${format(diff, row.unit)}</span></td>
        <td>${reasonEditor(type, row.key, reason, status(row) !== "ok")}</td>
      </tr>
    `;
  }).join("");
}

function renderWeeklySummary() {
  const risks = productionResults().filter((row) => status(row) !== "ok");
  const rows = risks.map((row) => {
    const diff = variance(row);
    return `
      <tr class="${status(row)}">
        <td>${dLabel("metricLabels", row.key)}</td>
        <td>${format(row.target, row.unit)}</td>
        <td>${format(row.actual, row.unit)}</td>
        <td><span class="variance ${varianceClass(row)}">${diff > 0 ? "+" : ""}${format(diff, row.unit)}</span></td>
        <td>${reasonTextWithUser(dailyState.productionReasons[row.key])}</td>
        <td>${d("actionDefault")}</td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="6">${d("noRiskRows")}</td></tr>`;
  const names = risks.slice(0, 3).map((row) => dLabel("metricLabels", row.key)).join(lang() === "en" ? ", " : "、");
  return { rows, text: risks.length ? tpl(d("summaryRisk"), { names }) : d("summaryOk") };
}

function renderPeopleSummary(rows) {
  const risks = rows.filter((row) => status(row) !== "ok");
  const filled = Object.values(dailyState.peopleInputs).filter((value) => Number.isFinite(Number(value))).length;
  const total = Object.keys(dailyState.peopleInputs).length;
  const topRisk = risks[0];
  return `
    <section><h3>${d("peopleConclusionTitle")}</h3><p>${tpl(d("peopleConclusion"), { filled, total, riskCount: risks.length })}</p></section>
    <section><h3>${d("peopleReasonTitle")}</h3><p>${topRisk ? tpl(d("peopleReason"), {
      name: dLabel("metricLabels", topRisk.key),
      actual: format(topRisk.actual, topRisk.unit),
      reason: dailyState.peopleReasons[topRisk.key] || d("requiredReason")
    }) : d("peopleNoRisk")}</p></section>
    <section><h3>${d("peopleActionTitle")}</h3><p>${d("peopleAction")}</p></section>
  `;
}

function renderMonthMatrix() {
  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const rows = [
    { key: "absenteeism", values: ["good", "good", "good", "good", "neutral", "neutral", "neutral", "neutral", "neutral", "neutral", "neutral", "neutral"] },
    { key: "unpaidAbs", values: ["bad", "bad", "bad", "bad", "good", "good", "good", "good", "good", "good", "good", "good"] },
    { key: "hcDirect", values: ["bad", "good", "bad", "bad", "good", "good", "good", "good", "good", "good", "good", "good"] },
    { key: "hcIndirect", values: ["good", "good", "good", "good", "good", "neutral", "neutral", "neutral", "neutral", "neutral", "neutral", "neutral"] },
    { key: "hcWhite", values: ["good", "good", "good", "good", "good", "good", "good", "neutral", "neutral", "neutral", "neutral", "neutral"] }
  ];
  return `<div class="daily-month-matrix"><div class="matrix-cell header">${d("metric")}</div>${months.map((month) => `<div class="matrix-cell header">${month}</div>`).join("")}${rows.map((row) => `<div class="matrix-cell metric">${dLabel("metricLabels", row.key)}</div>${row.values.map((value, index) => `<div class="matrix-cell ${value}">${value === "neutral" ? "-" : index < 4 ? String(index + 1) : "0"}</div>`).join("")}`).join("")}</div>`;
}

function productionView() {
  const weekly = renderWeeklySummary();
  return `
    <section class="view daily-kpi-view" id="dailyProductionView">
      <div class="daily-page-head"><div><span class="eyebrow">DW / ${d("productionDaily")}</span><h2>${d("productionDaily")}</h2><p>${d("productionSubtitle")}</p></div></div>
      <section class="panel daily-panel"><div class="daily-panel-heading"><div><h2>${d("productionInputs")}</h2><p>${d("productionInputsHint")}</p></div><div class="daily-segmented"><button class="active" data-daily-filter="all">${d("all")}</button><button data-daily-filter="risk">${d("risk")}</button><button data-daily-filter="empty">${d("empty")}</button></div></div>${renderInputGroups(null, productionInputGroups, dailyState.productionInputs, "productionInputLabels", "data-daily-production-input")}</section>
      <section class="panel daily-panel"><div class="daily-panel-heading"><div><h2>${d("autoResults")}</h2><p>${d("autoResultsHint")}</p></div><button class="daily-primary" data-daily-submit>${d("submitReasons")}</button></div><div class="table-wrap"><table class="daily-table"><thead><tr><th>${d("metric")}</th><th>${d("formula")}</th><th>${d("target")}</th><th>${d("actualToday")}</th><th>${d("variance")}</th><th>${d("reason")}</th></tr></thead><tbody>${renderResultRows(productionResults().filter((row) => dailyState.filter === "all" || (dailyState.filter === "risk" && status(row) !== "ok") || (dailyState.filter === "empty" && status(row) !== "ok" && !dailyState.productionReasons[row.key])), "production")}</tbody></table></div></section>
      <section class="panel daily-panel"><div class="daily-panel-heading"><div><h2>${d("productionWeeklySummary")}</h2><p>${d("productionWeeklySummaryHint")}</p></div></div><div class="table-wrap"><table class="daily-table daily-weekly-table"><thead><tr><th>${d("metric")}</th><th>${d("target")}</th><th>${d("actualToday")}</th><th>${d("variance")}</th><th>${d("reason")}</th><th>${d("actionSuggestion")}</th></tr></thead><tbody>${weekly.rows}</tbody></table></div><p class="daily-one-line-summary">${weekly.text}</p><div class="daily-action-row"><span class="daily-submit-status">${tpl(d("filledBy"), { name: currentUserName() })}</span><button class="daily-primary" data-daily-submit>${d("submitProduction")}</button><button class="daily-secondary" data-daily-draft>${d("saveDraft")}</button></div></section>
    </section>
  `;
}

function peopleView() {
  const rows = peopleResults();
  const filled = Object.values(dailyState.peopleInputs).filter((value) => Number.isFinite(Number(value))).length;
  const total = Object.keys(dailyState.peopleInputs).length;
  return `
    <section class="view daily-kpi-view" id="dailyPeopleView">
      <div class="daily-page-head"><div><span class="eyebrow">DW / ${d("peopleDaily")}</span><h2>${d("peopleDaily")}</h2><p>${d("peopleSubtitle")}</p></div></div>
      <section class="daily-kpi-strip">${rows.filter((row) => ["absenteeism", "unpaidAbs", "hcDirect", "hcIndirect"].includes(row.key)).map((row) => `<article class="daily-kpi-tile ${status(row) === "ok" ? "ok" : "risk"}"><small>${dLabel("metricLabels", row.key)}</small><strong>${format(row.actual, row.unit)}</strong><small>${d("target")} ${format(row.target, row.unit)} · ${d("variance")} ${format(variance(row), row.unit)}</small></article>`).join("")}</section>
      <section class="panel daily-panel"><div class="daily-panel-heading"><div><h2>${d("peopleInputs")}</h2><p>${d("peopleInputsHint")}</p></div></div>${renderInputGroups(null, peopleInputGroups, dailyState.peopleInputs, "peopleInputLabels", "data-daily-people-input")}</section>
      <div class="daily-people-grid"><section class="panel daily-panel"><div class="daily-panel-heading"><div><h2>${d("peopleCalculatedResults")}</h2><p>${d("peopleCalculatedHint")}</p></div><div class="daily-heading-actions"><span class="progress-chip">${filled}/${total} ${d("filled")}</span><button class="daily-primary" data-daily-submit>${d("submitReasons")}</button></div></div><div class="table-wrap"><table class="daily-table"><thead><tr><th>${d("metric")}</th><th>${d("formula")}</th><th>${d("target")}</th><th>${d("lastYear")}</th><th>${d("actualToday")}</th><th>${d("variance")}</th><th>${d("reason")}</th></tr></thead><tbody>${renderResultRows(rows, "people")}</tbody></table></div></section><aside class="panel daily-panel daily-summary-side"><h2>${d("mondayOutput")}</h2><p>${d("mondayOutputHint")}</p><article class="daily-report-preview">${renderPeopleSummary(rows)}</article><div class="daily-action-row vertical"><span class="daily-submit-status">${tpl(d("filledBy"), { name: currentUserName() })}</span><button class="daily-primary" data-daily-submit>${d("submitPeople")}</button><button class="daily-secondary">${d("exportWeeklyReport")}</button></div></aside></div>
      <section class="panel daily-panel"><div class="daily-panel-heading"><div><h2>${d("monthlyTrendMatrix")}</h2><p>${d("monthlyTrendHint")}</p></div></div>${renderMonthMatrix()}</section>
    </section>
  `;
}

function installNav() {
  const dwButton = document.querySelector('[data-unit="dishwasher"]');
  if (!dwButton || document.querySelector(".daily-subnav")) return;
  const nav = document.createElement("div");
  nav.className = "daily-subnav";
  nav.innerHTML = `<button type="button" data-daily-page="production">${d("productionDaily")}</button><button type="button" data-daily-page="people">${d("peopleDaily")}</button>`;
  dwButton.insertAdjacentElement("afterend", nav);
}

function renderDailyViews() {
  installNav();
  document.querySelectorAll(".daily-subnav [data-daily-page]").forEach((button) => {
    button.textContent = button.dataset.dailyPage === "production" ? d("productionDaily") : d("peopleDaily");
  });
  document.getElementById("dailyProductionView")?.remove();
  document.getElementById("dailyPeopleView")?.remove();
  document.querySelector(".workspace")?.insertAdjacentHTML("beforeend", productionView() + peopleView());
  if (document.body.classList.contains("daily-kpi-mode")) showDailyPage(dailyState.activePage);
}

function showDailyPage(page) {
  dailyState.activePage = page;
  document.body.classList.add("daily-kpi-mode");
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.getElementById(page === "production" ? "dailyProductionView" : "dailyPeopleView")?.classList.add("active");
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  document.querySelectorAll("[data-unit]").forEach((button) => button.classList.toggle("active", button.dataset.unit === "dishwasher"));
  document.querySelectorAll(".daily-subnav [data-daily-page]").forEach((button) => button.classList.toggle("active", button.dataset.dailyPage === page));
  const unitName = document.getElementById("unitName");
  const unitSubtitle = document.getElementById("unitSubtitle");
  if (unitName) unitName.textContent = d("dwFactory") || "洗碗机";
  if (unitSubtitle) unitSubtitle.textContent = page === "production" ? d("productionDaily") : d("peopleDaily");
}

function leaveDailyMode() {
  document.body.classList.remove("daily-kpi-mode");
  document.querySelectorAll(".daily-subnav [data-daily-page]").forEach((button) => button.classList.remove("active"));
  document.querySelectorAll(".daily-kpi-view").forEach((view) => view.classList.remove("active"));
}

function setDailySubmitStatus(text) {
  const status = document.getElementById("saveMode") || document.getElementById("submitStatus");
  if (status) status.textContent = text;
  document.querySelectorAll(".daily-submit-status").forEach((item) => {
    item.textContent = text;
  });
}

document.addEventListener("click", (event) => {
  const pageButton = event.target.closest("[data-daily-page]");
  if (pageButton) {
    showDailyPage(pageButton.dataset.dailyPage);
    return;
  }
  if (event.target.closest(".tab") || event.target.closest("[data-unit]")) {
    leaveDailyMode();
  }
  if (event.target.closest("[data-daily-submit]")) {
    setDailySubmitStatus(tpl(d("submittedByStatus"), { name: currentUserName() }));
  }
  if (event.target.closest("[data-daily-draft]")) {
    setDailySubmitStatus(d("draftSaved"));
  }
});

document.addEventListener("change", (event) => {
  const productionInput = event.target.dataset.dailyProductionInput;
  const peopleInput = event.target.dataset.dailyPeopleInput;
  const productionReason = event.target.dataset.dailyProductionReason;
  const peopleReason = event.target.dataset.dailyPeopleReason;
  if (productionInput) dailyState.productionInputs[productionInput] = Number(event.target.value);
  if (peopleInput) dailyState.peopleInputs[peopleInput] = Number(event.target.value);
  if (productionReason) dailyState.productionReasons[productionReason] = event.target.value;
  if (peopleReason) dailyState.peopleReasons[peopleReason] = event.target.value;
  if (event.target.dataset.dailyDosUpload !== undefined) {
    const file = event.target.files?.[0];
    if (file) {
      dailyState.dosDetail.fileName = file.name;
      dailyState.dosDetail.skuCount = 1368;
      dailyState.dosDetail.totalInventory = dailyState.productionInputs.inventory;
    }
  }
  if (productionInput || peopleInput || productionReason || peopleReason || event.target.dataset.dailyDosUpload !== undefined) renderDailyViews();
});

document.getElementById("languageSelect")?.addEventListener("change", renderDailyViews);
document.getElementById("userName")?.addEventListener("input", () => {
  if (document.body.classList.contains("daily-kpi-mode")) renderDailyViews();
});

renderDailyViews();
