export const ADMIN_BUDGET_MONTHS = [6, 7, 8, 9, 10, 11, 12];

const driver = (key, label, standard, provider, system, frequency = "月度") => ({ key, label, standard, provider, system, frequency });

export const ADMIN_DRIVER_MATRIX = {
  fleetFuel: [driver("vehicleList", "车辆与归属清单", "在用车辆及成本中心", "行政部门", "车辆台账"), driver("rentPrice", "车辆月租", "有效租赁合同单价", "间接采购", "采购合同"), driver("fuelQuota", "月燃油额度", "按职级/车型额度", "行政部门", "车辆政策"), driver("fuelPrice", "燃油单价", "有效框架价格", "间接采购", "采购合同")],
  canteen: [driver("headcount", "适用用餐人数", "当月在岗及适用人员", "人力资源", "HR人员系统"), driver("workdays", "工作日", "公司年度日历", "人力资源", "系统日历"), driver("sundayOt", "周日加班人数", "已批准加班计划", "人力资源", "考勤系统"), driver("mealPrice", "餐费单价", "有效食堂合同单价", "间接采购", "采购合同")],
  shuttle: [driver("headcount", "乘车人数", "当月线路适用人员", "人力资源", "HR人员系统"), driver("workdays", "工作日", "公司年度日历", "人力资源", "系统日历"), driver("routeCost", "线路成本", "有效班车合同单价", "间接采购", "采购合同"), driver("occupancy", "目标上座率", "线路规划标准", "行政部门", "班车线路台账")],
  hiring: [driver("channelBaseline", "招聘渠道基线", "已批准渠道年度标准", "人力资源", "招聘台账", "年度"), driver("vacancies", "计划空缺职位", "已批准招聘计划", "人力资源", "编制计划"), driver("increase", "价格增长率", "年度预算参数", "财务部门", "预算参数", "年度")],
  training: [driver("trainingPlan", "部门培训计划", "已批准课程与人数", "人力资源", "培训计划", "年度"), driver("headcount", "分摊人数", "预算期在岗人数", "人力资源", "HR人员系统"), driver("trainingPrice", "课程/培训池价格", "合同或批准报价", "间接采购", "采购合同"), driver("fx", "EUR/TRY汇率", "财务预算汇率", "财务部门", "财务参数")],
  sodexo: [driver("roster", "适用人员名单", "符合福利政策人员", "人力资源", "HR人员系统"), driver("annualDays", "年度工作日", "250天标准", "人力资源", "系统日历", "年度"), driver("dailyPrice", "每日标准", "455 TRY/日", "间接采购", "福利合同", "年度")],
  security: [driver("fte", "安保岗位人数", "批准的服务岗位配置", "行政部门", "供应商排班"), driver("monthlyPrice", "岗位月单价", "2026有效合同价格", "间接采购", "采购合同"), driver("allowance", "固定补贴", "合同约定补贴", "行政部门", "服务合同")],
  cleaning: [driver("fte", "清洁岗位人数", "批准的服务岗位配置", "行政部门", "供应商排班"), driver("monthlyPrice", "岗位月单价", "2026有效合同价格", "间接采购", "采购合同"), driver("allowance", "固定补贴", "合同约定补贴", "行政部门", "服务合同")],
  flatRent: [driver("housingList", "住房清单", "预算期有效住房", "行政部门", "住房台账"), driver("rentPrice", "月租", "有效租赁合同单价", "间接采购", "租赁合同"), driver("allocation", "成本中心分摊", "受益归属比例", "财务部门", "成本中心规则")],
  otherSuppliers: [driver("fte", "服务岗位人数", "批准的岗位配置", "行政部门", "供应商排班"), driver("monthlyPrice", "岗位月单价", "有效服务合同价格", "间接采购", "采购合同"), driver("surcharge", "附加系数", "合同约定系数", "财务部门", "预算参数", "年度")],
  doctorNurse: [driver("fte", "医生/护士人数", "批准的岗位配置", "人力资源", "职业健康台账"), driver("monthlyPrice", "月度服务单价", "有效医疗服务合同", "间接采购", "采购合同")],
  uniforms: [driver("headcount", "适用人数", "按岗位与用工类型确定", "人力资源", "HR人员系统"), driver("issueQty", "发放数量/周期", "工作服发放标准", "行政部门", "发放政策"), driver("itemPrice", "物品单价", "有效采购合同价格", "间接采购", "采购合同")],
  socialAids: [driver("headcount", "上下半年适用人数", "符合政策的在岗人员", "人力资源", "HR人员系统", "半年度"), driver("aidStandard", "补助标准", "8,000 TRY/人", "人力资源", "福利政策", "年度"), driver("tisRate", "TIS增长率", "60%", "人力资源", "劳资政策", "年度")],
  ramadanFood: [driver("headcount", "适用人数", "符合发放政策人员", "人力资源", "HR人员系统", "年度"), driver("packagePrice", "食品包单价", "有效采购价格", "间接采购", "采购合同", "年度"), driver("issueRule", "发放规则", "年度一次", "行政部门", "发放政策", "年度")],
  shoes: [driver("headcount", "适用人数", "符合岗位政策人员", "人力资源", "HR人员系统", "年度"), driver("shoePrice", "鞋单价", "有效采购价格", "间接采购", "采购合同", "年度"), driver("issueQty", "发放次数", "每年2次", "行政部门", "发放政策", "年度")],
  entertainment: [driver("activityPlan", "活动计划及次数", "批准的年度活动计划", "行政部门", "活动计划", "年度"), driver("headcount", "参加人数", "活动适用人员", "人力资源", "HR人员系统"), driver("activityPrice", "活动单价", "有效报价/合同", "间接采购", "采购合同")],
  mobile: [driver("userCount", "使用数量", "有效号码/设备清单", "行政部门", "通讯台账"), driver("monthlyTariff", "月度资费", "有效通讯合同价格", "间接采购", "采购合同"), driver("increase", "增长率", "30%预算参数", "财务部门", "预算参数", "年度")],
  rewards: [driver("rewardQty", "各奖励项目数量", "批准的奖励计划", "人力资源", "奖励计划"), driver("rewardPrice", "奖励单价", "2026福利政策标准", "人力资源", "奖励政策", "年度")],
  waste: [driver("wasteQty", "废弃物数量", "实际趋势及生产预测", "EHS/生产部门", "废弃物台账"), driver("handlingPrice", "处置单价", "有效处置合同价格", "间接采购", "采购合同"), driver("transportPrice", "运输费", "有效运输合同价格", "间接采购", "采购合同"), driver("actualBaseline", "7个月实际", "SAP已入账实际", "财务部门", "SAP")],
  hiringHealth: [driver("hiringQty", "计划招聘人数", "已批准招聘计划", "人力资源", "编制计划"), driver("checkPrice", "体检单价", "有效医疗合同价格", "间接采购", "采购合同")],
  socialAudits: [driver("auditPlan", "审核计划", "Sedex年度审核安排", "人力资源/合规", "审核计划", "年度"), driver("auditPrice", "审核费用", "有效报价或2025基线", "间接采购", "采购合同", "年度")],
  waterBottles: [driver("quantity", "饮用水数量", "预算用量标准", "行政部门", "领用台账"), driver("unitPrice", "单价", "500×1.3 TRY", "间接采购", "采购合同", "年度")],
  hrPrograms: [driver("licenseQty", "许可数量", "有效用户/许可清单", "人力资源", "系统许可台账"), driver("licensePrice", "许可单价", "有效软件合同价格", "间接采购/IT", "采购合同", "年度"), driver("fx", "EUR/TRY汇率", "财务预算汇率", "财务部门", "财务参数")],
  privateHealth: [driver("insuredRoster", "投保人数及家属类型", "按职级和家属关系清单", "人力资源", "HR人员系统"), driver("premium", "2026保费", "有效保险报价", "间接采购", "保险合同", "年度"), driver("lifeInsurance", "人寿保险标准", "有效保险政策", "人力资源", "福利政策", "年度")],
  otherAdmin: [driver("actual9m", "前9个月实际", "SAP已入账实际", "财务部门", "SAP"), driver("scope", "费用范围", "差旅、医疗、报刊、耗材、水、咨询、邮寄", "行政部门", "科目范围", "年度")]
};

const average = (annual) => Array(12).fill(Number(annual || 0) / 12);

export const ADMIN_BUDGET_DATA = {
  version: "2026-07-16-r2-v1",
  sourceFile: "2026 Administration Budget R2.xlsx",
  sourceSheet: "SUMMARY + category calculation sheets",
  organization: "DISHWASHER",
  budgetYear: 2026,
  sourceCurrency: "TRY",
  outputCurrency: "EUR",
  eurTry: 57,
  categories: [
    {
      id: "fleetFuel", group: "mobility", accountCode: "6666020403", label: "车辆与燃油", sourceLabel: "CAR FLEET & FUEL",
      annualTry: 2894949, monthlyTry: average(2894949), ready: true,
      formula: "车辆月租×12 + 月燃油升数×燃油单价×12，按成本中心汇总", drivers: "车辆清单、月租、燃油额度、燃油单价", allocation: "年度标准按月展开"
    },
    {
      id: "canteen", group: "employeeService", accountCode: "6666020502", label: "食堂", sourceLabel: "CANTEEN",
      annualTry: 21234697.85825, monthlyTry: [1488208.033,1488208.033,1488208.033,1562618.43465,1049627.6833,1934670.4429,1807938.279,1660444.3026,2277818.1348,2272186.9404,2184795.135,2019974.4066], ready: true,
      formula: "(适用人数×工作日 + 周日加班人数×5)×当月餐费单价", drivers: "人员类别、工作日、周日加班人数、餐费单价", allocation: "源表月度计算",
      standards: [{ key: "headcount", label: "适用人数", value: "400.465–409.555", unit: "人/月", provider: "人力资源" }, { key: "workdays", label: "工作日", value: "14–26", unit: "天/月", provider: "人力资源" }, { key: "mealPrice", label: "餐费单价", value: "185.81 / 214.44", unit: "TRY/人天（1–6月 / 7–12月）", provider: "间接采购" }, { key: "sundayOt", label: "周日加班人数", value: "0", unit: "人", provider: "人力资源" }]
    },
    {
      id: "shuttle", group: "employeeService", accountCode: "6666020401", label: "班车", sourceLabel: "SHUTTLE",
      annualTry: 24810898.4001736, monthlyTry: [1767272.23958333,1767272.23958333,1767272.23958333,1855635.8515625,1300751.01041667,2396888.13541667,2041307.09635417,1875781.84461806,2573447.16145833,2566859.36631944,2544996.31076389,2353414.90451389], ready: true,
      formula: "出勤人数×工作日×人均班车单价；人均单价=线路成本÷(16×目标上座率)×2", drivers: "出勤人数、工作日、线路成本、目标上座率", allocation: "源表月度计算"
    },
    { id: "hiring", group: "people", accountCode: "6666029900", label: "招聘", sourceLabel: "HIRING", annualTry: 0, monthlyTry: average(0), ready: true, formula: "招聘渠道/人才库基线×(1+30%)+计划空缺职位费用", drivers: "渠道基线、增长率、空缺职位数", allocation: "源表预算为0" },
    { id: "training", group: "people", accountCode: "6666020602", label: "培训", sourceLabel: "TRAINING", annualTry: 131905.759162, monthlyTry: average(131905.759162), ready: true, formula: "部门培训基线×(1+30%)；部分研发费用按人数占比×培训池×EUR/TRY", drivers: "培训基线、增长率、人数占比、汇率", allocation: "年度标准按月展开" },
    { id: "sodexo", group: "employeeService", accountCode: "6666010315", label: "Sodexo福利", sourceLabel: "SODEXO", annualTry: 0, monthlyTry: average(0), ready: true, formula: "适用人员数×250个工作日×455 TRY/日", drivers: "适用人员名单、年度工作日、日标准", allocation: "DW源表预算为0" },
    { id: "security", group: "supplier", accountCode: "6666022100", label: "安保", sourceLabel: "SECURITY", annualTry: 952861.84488, monthlyTry: average(952861.84488), ready: true, formula: "岗位人数×2026月工资×12×1.1 + 固定补贴", drivers: "岗位人数、月工资、附加系数、固定补贴", allocation: "年度标准按月展开" },
    { id: "cleaning", group: "supplier", accountCode: "6666021902", label: "清洁", sourceLabel: "CLEANING", annualTry: 4169515.89384, monthlyTry: average(4169515.89384), ready: true, formula: "岗位人数×2026月工资×12×1.1 + 固定补贴", drivers: "岗位人数、月工资、附加系数、固定补贴", allocation: "年度标准按月展开" },
    { id: "flatRent", group: "facility", accountCode: "6666020801", label: "住房租赁", sourceLabel: "FLAT RENTING", annualTry: 810000, monthlyTry: average(810000), ready: true, formula: "月租×12；共享住房按成本中心分摊", drivers: "住房清单、月租、分摊比例", allocation: "月租标准" },
    { id: "otherSuppliers", group: "supplier", accountCode: "6666029700", label: "其他供应商", sourceLabel: "OTHER SUPPLIERS", annualTry: 403056.14976, monthlyTry: average(403056.14976), ready: true, formula: "供应商岗位人数×2026月单价×12，指定项目乘1.1", drivers: "岗位人数、月单价、附加系数", allocation: "年度标准按月展开" },
    { id: "doctorNurse", group: "health", accountCode: "6666010302", label: "医生与护士", sourceLabel: "DOCTOR & NURSE", annualTry: 3332926.08, monthlyTry: average(3332926.08), ready: true, formula: "医生/护士岗位人数×月度服务单价×12", drivers: "岗位人数、月度服务单价", allocation: "年度标准按月展开" },
    { id: "uniforms", group: "employeeService", accountCode: "6666010314", label: "工作服", sourceLabel: "UNIFORMS", annualTry: 3252569.63, monthlyTry: average(3252569.63), ready: true, formula: "适用人数×单件价格×发放数量×1.2 + 特殊装备", drivers: "人员数、物品单价、发放数量、特殊装备", allocation: "年度标准按月展开", standards: [{ key: "headcount", label: "人员结构", value: "BC 336 / WC 27.5 / SUB 16", unit: "人", provider: "人力资源" }, { key: "itemPrice", label: "物品单价", value: "413–3,949.53", unit: "TRY/件", provider: "间接采购" }, { key: "issueQty", label: "发放数量", value: "1 / 2 / 12", unit: "次（按物品）", provider: "行政部门" }, { key: "surcharge", label: "预算系数", value: "1.2", unit: "源表固定系数", provider: "行政部门" }] },
    { id: "socialAids", group: "employeeService", accountCode: "6666010315", label: "社会补助", sourceLabel: "SOCIAL AIDS", annualTry: 6016000, monthlyTry: [496666.6667,496666.6667,496666.6667,496666.6667,496666.6667,496666.6665,506000,506000,506000,506000,506000,506000], ready: true, formula: "上半年适用人数×8,000 + 下半年适用人数×8,000；8,000=5,000×1.6", drivers: "上下半年适用人数、补助标准、TIS增长率", allocation: "按半年度人数展开" },
    { id: "ramadanFood", group: "employeeService", accountCode: "6666010315", label: "斋月食品补助", sourceLabel: "RAMADAN FOOD AID", annualTry: 0, monthlyTry: average(0), ready: true, formula: "适用人数×食品包单价×1.1", drivers: "适用人数、食品包单价、附加系数", allocation: "DW源表预算为0" },
    { id: "shoes", group: "employeeService", accountCode: "6666010314", label: "鞋类补助", sourceLabel: "SHOES AID", annualTry: 0, monthlyTry: average(0), ready: true, formula: "适用人数×鞋单价×2次×1.1", drivers: "适用人数、鞋单价、发放次数、附加系数", allocation: "DW源表预算为0" },
    { id: "entertainment", group: "employeeService", accountCode: "6666020101", label: "员工活动", sourceLabel: "ENTERTAINMENT", annualTry: 2963837.5, monthlyTry: average(2963837.5), ready: true, formula: "活动人数/次数×2026单价 + 固定企业活动费用", drivers: "活动人数、活动次数、单价、固定活动", allocation: "年度标准按月展开" },
    { id: "mobile", group: "communication", accountCode: "6666020301", label: "手机通讯", sourceLabel: "MOBILE", annualTry: 238645.212, monthlyTry: average(238645.212), ready: true, formula: "2025月度费用×1.3×12；指定项目再乘数量", drivers: "2025月费、增长率、使用数量", allocation: "月度标准" },
    { id: "rewards", group: "people", accountCode: "6666010380", label: "员工奖励", sourceLabel: "REWARD", annualTry: 357500, monthlyTry: average(357500), ready: true, formula: "各奖励项目数量×2026奖励单价", drivers: "奖励项目、数量、单价", allocation: "年度标准按月展开" },
    { id: "waste", group: "facility", accountCode: "6666020903", label: "废弃物管理", sourceLabel: "WASTE MANAGEMENT", annualTry: 337189.728571, monthlyTry: average(337189.728571), ready: true, formula: "[((7个月实际÷7×12 + 7个月实际)×处置单价)+运输费]×1.3", drivers: "7个月实际、预测量、处置单价、运输费、增长率", allocation: "年度标准按月展开" },
    { id: "hiringHealth", group: "health", accountCode: "6666010302", label: "招聘体检", sourceLabel: "HIRING HEALTH CONTROL", annualTry: 390000, monthlyTry: average(390000), ready: true, formula: "计划招聘人数×(1,500×1.3)", drivers: "计划招聘人数、体检基价、增长率", allocation: "年度标准按月展开" },
    { id: "socialAudits", group: "compliance", accountCode: "6666021200", label: "社会责任审核", sourceLabel: "SOCIAL AUDITS", annualTry: 165501.193, monthlyTry: average(165501.193), ready: true, formula: "2025 Sedex审核费用×1.3", drivers: "2025审核费用、增长率", allocation: "年度标准按月展开" },
    { id: "waterBottles", group: "facility", accountCode: "6666021603", label: "饮用水", sourceLabel: "WATER BOTTLES", annualTry: 130000, monthlyTry: average(130000), ready: true, formula: "数量×(500×1.3)", drivers: "数量、2025单价、增长率", allocation: "采用明细表130,000 TRY；SUMMARY链接值待核对" },
    { id: "hrPrograms", group: "people", accountCode: "6666021100", label: "HR系统与项目", sourceLabel: "HR PROGRAMS", annualTry: 0, monthlyTry: average(0), ready: true, formula: "固定许可数量×EUR/TRY；其他系统按2025费用×1.3", drivers: "许可数量、欧元价格、汇率、2025费用", allocation: "DW源表预算为0" },
    { id: "privateHealth", group: "health", accountCode: "6666010302", label: "私人医疗保险", sourceLabel: "PRIVATE HEALTH INSURANCE", annualTry: 0, monthlyTry: average(0), ready: false, formula: "按职级/家属类型人数×2026保费 + 人寿保险", drivers: "人员职级、家属类型、保费、人寿保险", allocation: "源表独立模型，尚未汇总到DW" },
    { id: "otherAdmin", group: "other", accountCode: "6666029900", label: "其他行政费用", sourceLabel: "TOPICS - OTHER ADMIN", annualTry: 0, monthlyTry: average(0), ready: false, formula: "前9个月实际÷9×12", drivers: "差旅、医疗、报刊、耗材、水、咨询、邮寄等9个月实际", allocation: "源表仅给出规则，尚无DW预算结果" }
  ]
};

export function adminCategoryMonthlyEur(category, overrides = {}) {
  return (category.monthlyTry || []).map((amount, index) => {
    const overridden = Number(overrides?.[category.id]?.months?.[index]);
    const tryAmount = Number.isFinite(overridden) ? overridden : Number(amount || 0);
    return tryAmount / ADMIN_BUDGET_DATA.eurTry;
  });
}
