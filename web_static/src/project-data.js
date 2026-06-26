export const PROJECT_SEEDS = [
  project("1", "/", "上涨因素", "订单量-折旧", "订单量上涨18%，折旧全年持续收益65万欧", "李想", "46023", 644.72, -467.6, "订单量下滑19%，折旧影响47万欧", "scale", [-8.15,21.15,13.62,-26.91,-178.78,454.01,-17.12,106.02,491.16,86.78,236.37,-73.56], [-30.63,-50.32,-286.65,-100,0,0,0,0,0,0,0,0]),
  project("2", "/", "上涨因素", "订单量-直接、间接人工", "如果订单量恶化，直接、间接员工无法裁员导致的影响", "李想", "46023", 0, -99.51, "3月订单量下降，直接、间接员工影响10万欧", "scale", [0,0,0,0,0,0,0,0,0,0,0,0], [57.78,-123.42,-33.86,0,0,0,0,0,0,0,0,0]),
  project("3", "/", "上涨因素", "订单量-其他", "订单量上涨18%，半固定、白领工资、运营、园区费用等全年持续收益44.2万欧", "李想", "46023", 442.61, -528.06, "订单量下滑19%，半固定、运营、园区费用影响53万欧", "scale", [-56.86,81.41,-26.82,-147.81,-193.44,329.83,-75.1,-31.47,328.61,288.59,193.09,-247.4], [-69.34,-27.26,-404.41,-27.05,0,0,0,0,0,0,0,0]),
  project("4", "/", "上涨因素", "；通胀影响-直接人工工资上涨；", "直接人工和间接人工上涨12%，每人上涨241欧，总计影响96万欧", "李想", "46023", -961.35, -290.89, "总人次3989，截至4月影响29万欧", "wage", [-79.29,-79.29,-79.29,-79.29,-80.01,-79.53,-79.53,-80.98,-81.22,-80.73,-80.98,-81.22], [-79.29,-79.29,-53.02,-79.29,0,0,0,0,0,0,0,0]),
  project("5", "/", "上涨因素", "；通胀影响-管理人工工资上涨；", "管理人员上涨5%，每人161欧", "李想", "46023", -52, -17.07, "总人次323，截至4月影响2万欧", "wage", [-4.27,-4.27,-4.27,-4.27,-4.27,-4.27,-4.27,-4.43,-4.43,-4.43,-4.43,-4.43], [-4.27,-4.27,-4.27,-4.27,0.01,0,0,0,0,0,0,0]),
  project("6", "/", "上涨因素", "通胀影响-其他", "除工资科目和折旧外其余科目全部受通胀影响8%", "李想", "46023", -278.82, -94.14, "截至4月累计影响9万欧", "inflation", [-24.15,-23.86,-23.57,-23.29,-20.11,-24.42,-22.62,-22.05,-24.35,-23.68,-24.28,-22.44], [-21.01,-26.26,-23.57,-23.29,0.01,0,0,0,0,0,0,0]),
  project("7", "/", "上涨因素", "园区分摊费用", "IT费用降费；分摊逻辑-产量改为产值", "李想", "46023", -195.31, 8.24, "截至4月降费1万", "scale", [-16.56,51.88,27.4,-30.49,4.4,-7.73,-4.07,-15.27,10.46,15.39,-4.95,-225.77], [-21.02,35.47,27.91,-34.12,0.01,0,0,0,0,0,0,0]),
  project("8", "土方", "延续项目", "25年延续项目", "1.轮毂和油底壳螺钉紧固自动化；2.QS部件喂料自动化；3.人力成本减少", "李想", "46023", 73.57, 70.79, "/", "project", [37.19,20.87,9.95,2.78,2.78,0,0,0,0,0,0,0], [37.19,20.87,9.95,2.78,0.01,0,0,0,0,0,0,0]),
  project("9", "土方", "提效", "提升单台生产效率，减少单台成本", "UPH提升至130", "李想", "46023", 72.67, 21.25, "已落地", "project", [6.67,5.99,3.31,5.35,4.64,7.39,5.72,5.59,7.73,7.03,7.31,5.94], [6.67,5.99,3.24,5.35,0.01,0,0,0,0,0,0,0]),
  project("10", "土方", "直接员工降费", "用工结构调整：提前谈判清退固定员工，回收期12~15个月", "蓝领工人合同工替换高工资正式工。", "李想", "46023", 189, 35, "已替换81人", "project", [0,0,0,21,21,21,21,21,21,21,21,21], [0,0,14,21,0,0,0,0,0,0,0,0]),
  project("11", "土方、中方", "直接员工降费", "锁定26年到月需求、生产、库存预算，均衡生产策略，消除25年分流浪费42万欧（只有一个工厂有），加班费损失80万欧", "26年不产生分流费、加班费", "李想", "46023", 400, 38.1, "1月加班费减少5100，2月加班费减少3000", "project", [0,0,40,40,40,40,40,40,40,40,40,40], [5.1,3,0,30,0,0,0,0,0,0,0,0]),
  project("12", "土方、中方", "直接员工降费", "模块化成套供货", "洗碗机预装8个项目18个人模块化成套，17万欧（不包含材料上涨）", "李想", "46204", 190, 0, "进度：1月份已完成与供应商购买价格谈判；，目前无进展", "project", [0,0,0,0,0,0,0,0,0,60,60,70], [0,0,0,0,0,0,0,0,0,0,0,0]),
  project("13", "土方、中方", "间接员工降费", "对标国内工厂优化空间： DW 84人，初步机会10个，（master替班16人）", "1.第一阶段1人（物流减少一人，岗位合并）-土方主导；2.第一阶段1人（物流减少一人，岗位合并）-土方主导；3.第一阶段1人（物流减少一人，岗位合并）-土方主导；4.DW辅助人员84人，初步机会10个-中方主导；", "李想", "1.2026年1月；2.7月落地；3.7月落地；4.10月落地", 69.47, 6.72, "1.已落地；2.无进展；3.无进展；4.无进展", "project", [0,0,2.24,2.24,2.24,2.24,6.72,6.72,6.72,13.45,13.45,13.45], [0,2.24,2.24,2.24,0,0,0,0,0,0,0,0]),
  project("14", "土方", "备件费用", "冲压润滑收集循环使用", "848欧一桶，每月节省0.85桶", "李想", "46023", 10, 4, "已落地", "project", [0,0,1,1,1,1,1,1,1,1,1,1], [1,1,1,1,0,0,0,0,0,0,0,0]),
  project("15", "土方", "能源费用", "工厂空调设备节能运行优化", "电单价0.057欧//Kwh", "李想", "46054", 7, 1.4, "已落地", "project", [0,0,0.7,0.7,0.7,0.7,0.7,0.7,0.7,0.7,0.7,0.7], [0,0,0.7,0.7,0,0,0,0,0,0,0,0]),
  project("16", "土方", "能源费用", "工厂照明节能优化", "电单价0.057欧//Kwh", "李想", "46054", 2.23, 0.45, "已落地", "project", [0,0,0.22,0.22,0.22,0.22,0.22,0.22,0.22,0.22,0.22,0.22], [0,0,0.22,0.22,0,0,0,0,0,0,0,0]),
  project("17", "土方", "生产提效", "注塑件节拍改进（减少3秒）", "节拍62S-59S，效率提升", "李想", "46023", 5.67, 2.01, "已落地", "project", [0,0,0.31,0.51,0.44,0.7,0.54,0.53,0.73,0.66,0.69,0.56], [0.63,0.57,0.31,0.51,0,0,0,0,0,0,0,0]),
  project("18", "中方", "直接员工降费", "减少人员宽放损失", "26年预算人员出勤总工时宽放6%预留12个人，实际缺勤率在4%左右，计划优化2-4人", "李想", "46235", 26.88, 0, "1.申请人力部门提供全员出勤率数据，以及宽放人员日常岗位排布明细；2.建议推动宽放人员实现三家工厂统筹共享、统一调配，；3.需现场核实：日常少量人员缺勤（1-2 人）对产线整体生产效率的实际影响，合理评估现有宽放比例的必要性。", "project", [6.72,0,0,0,0,0,0,0,0,6.72,6.72,6.72], [6.72,0,0,0,0,0,0,0,0,6.72,6.72,6.72]),
  project("19", "中方", "组织运营费", "叉车租赁费降低", "1.丰田叉车合同11月到期后，更换报价最低供应商；2.排查产能负荷率，目标减少5%叉车数量", "李想", "46235", 4.8, 0, "1，提升负荷率，研究提效，节约2辆叉车", "project", [1.2,0,0,0,0,0,0,0,0,1.2,1.2,1.2], [1.2,0,0,0,0,0,0,0,0,1.2,1.2,1.2]),
  project("20", "土方", "直接员工降费", "宜家订单纸壳上料工序效率提升", "李想", "", "46082", 4.06, 0, "451.232294925624", "project", [0,0,0,0,0.45,0.45,0.45,0.45,0.45,0.45,0.45,0.45], [0.02,0,0,0,0,0,0,0,0,0,0,0]),
  project("21", "土方", "直接员工降费", "包装线速优化", "李想", "", "46174", 11.74, 0, "1706.17414121248", "project", [0,0,0,0,0,0,0,1.67,2.31,2.1,2.18,1.77], [0.02,0,0,0,0,0,0,0,0,0,0,0]),
  project("22", "中方", "折旧降费", "折旧费用优化", "部分设备、模具折旧年限10→30", "李想", "46113", 530, 530, "已落地53万欧，全年预算160万欧", "project", [530,0,0,0,530,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0,0,0]),
  project("23", "", "降存货跌价准备", "超期原材料、半成品消耗", "与开发达成一致，超期原材料加工成半成品", "李想", "46113", 88, 88, "88000", "project", [0,0,0,0,88,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0,0,0]),
];

const PROJECT_TEXT_TRANSLATIONS = {
  en: {
    "上涨因素": "Cost increase factor",
    "下降因素": "Cost reduction factor",
    "延续项目": "Carryover project",
    "提效": "Efficiency improvement",
    "直接员工降费": "Direct labor cost reduction",
    "间接员工降费": "Indirect labor cost reduction",
    "备件费用": "Spare parts cost",
    "能源费用": "Energy cost",
    "生产提效": "Production efficiency improvement",
    "组织运营费": "Operating cost",
    "折旧降费": "Depreciation cost reduction",
    "降存货跌价准备": "Inventory write-down provision reduction",
    "土方": "Turkey team",
    "中方": "China team",
    "土方、中方": "Turkey + China team",
    "李想": "Li Xiang",
    "订单量-折旧": "Order volume - depreciation",
    "订单量-直接、间接人工": "Order volume - direct and indirect labor",
    "订单量-其他": "Order volume - other",
    "；通胀影响-直接人工工资上涨；": "Inflation impact - direct labor wage increase",
    "；通胀影响-管理人工工资上涨；": "Inflation impact - management labor wage increase",
    "通胀影响-其他": "Inflation impact - other",
    "园区分摊费用": "Campus allocation cost",
    "25年延续项目": "2025 carryover project",
    "提升单台生产效率，减少单台成本": "Improve unit production efficiency and reduce unit cost",
    "用工结构调整：提前谈判清退固定员工，回收期12~15个月": "Labor structure adjustment: negotiate fixed employee exit in advance, payback period 12-15 months",
    "锁定26年到月需求、生产、库存预算，均衡生产策略，消除25年分流浪费42万欧（只有一个工厂有），加班费损失80万欧": "Lock 2026 monthly demand, production and inventory budget; balance production strategy; eliminate 420 K€ diversion waste and 800 K€ overtime loss",
    "模块化成套供货": "Modular kit supply",
    "对标国内工厂优化空间： DW 84人，初步机会10个，（master替班16人）": "Benchmark against China factories: DW has 84 support staff, initial opportunity of 10 positions, including 16 master backup positions",
    "冲压润滑收集循环使用": "Recycle collected stamping lubricant",
    "工厂空调设备节能运行优化": "Energy-saving operation optimization for factory air-conditioning equipment",
    "工厂照明节能优化": "Factory lighting energy-saving optimization",
    "注塑件节拍改进（减少3秒）": "Injection molding cycle-time improvement, reduce 3 seconds",
    "减少人员宽放损失": "Reduce labor allowance loss",
    "叉车租赁费降低": "Reduce forklift leasing cost",
    "宜家订单纸壳上料工序效率提升": "Improve IKEA order carton feeding process efficiency",
    "包装线速优化": "Packaging line speed optimization",
    "折旧费用优化": "Depreciation cost optimization",
    "超期原材料、半成品消耗": "Consume overdue raw materials and semi-finished goods",
    "订单量上涨18%，折旧全年持续收益65万欧": "Order volume increases by 18%; depreciation brings 650 K€ full-year recurring benefit",
    "如果订单量恶化，直接、间接员工无法裁员导致的影响": "If order volume worsens, direct and indirect labor cannot be reduced immediately, creating cost impact",
    "订单量上涨18%，半固定、白领工资、运营、园区费用等全年持续收益44.2万欧": "Order volume increases by 18%; semi-fixed cost, white-collar wages, operating and campus costs bring 442 K€ full-year recurring benefit",
    "直接人工和间接人工上涨12%，每人上涨241欧，总计影响96万欧": "Direct and indirect labor wages increase by 12%, 241 EUR per person, total impact 960 K€",
    "管理人员上涨5%，每人161欧": "Management labor increases by 5%, 161 EUR per person",
    "除工资科目和折旧外其余科目全部受通胀影响8%": "All accounts except wages and depreciation are affected by 8% inflation",
    "IT费用降费；分摊逻辑-产量改为产值": "IT cost reduction; allocation logic changed from production volume to production value",
    "1.轮毂和油底壳螺钉紧固自动化；2.QS部件喂料自动化；3.人力成本减少": "1. Wheel hub and oil pan screw tightening automation; 2. QS component feeding automation; 3. Labor cost reduction",
    "UPH提升至130": "Increase UPH to 130",
    "蓝领工人合同工替换高工资正式工。": "Replace high-wage regular blue-collar workers with contract workers.",
    "26年不产生分流费、加班费": "No diversion cost or overtime cost in 2026",
    "洗碗机预装8个项目18个人模块化成套，17万欧（不包含材料上涨）": "Dishwasher pre-assembly: 8 projects and 18 people converted to modular kits, 170 K€ excluding material increase",
    "1.第一阶段1人（物流减少一人，岗位合并）-土方主导；2.第一阶段1人（物流减少一人，岗位合并）-土方主导；3.第一阶段1人（物流减少一人，岗位合并）-土方主导；4.DW辅助人员84人，初步机会10个-中方主导；": "1. Phase 1: reduce one logistics position and merge roles, led by Turkey; 2. Phase 1: reduce one logistics position and merge roles, led by Turkey; 3. Phase 1: reduce one logistics position and merge roles, led by Turkey; 4. DW support staff 84 people, initial opportunity of 10 positions, led by China.",
    "848欧一桶，每月节省0.85桶": "848 EUR per barrel, save 0.85 barrel per month",
    "电单价0.057欧//Kwh": "Electricity unit price 0.057 EUR/kWh",
    "节拍62S-59S，效率提升": "Cycle time improved from 62s to 59s",
    "26年预算人员出勤总工时宽放6%预留12个人，实际缺勤率在4%左右，计划优化2-4人": "2026 budget reserves 12 people for 6% attendance allowance; actual absence rate is around 4%, with plan to optimize 2-4 people",
    "1.丰田叉车合同11月到期后，更换报价最低供应商；2.排查产能负荷率，目标减少5%叉车数量": "1. After Toyota forklift contract expires in November, switch to the lowest quoted supplier; 2. Review capacity load rate and target 5% forklift reduction",
    "部分设备、模具折旧年限10→30": "Adjust depreciation life of selected equipment and molds from 10 to 30 years",
    "与开发达成一致，超期原材料加工成半成品": "Align with R&D to process overdue raw materials into semi-finished goods",
    "订单量下滑19%，折旧影响47万欧": "Order volume decreases by 19%, depreciation impact 470 K€",
    "3月订单量下降，直接、间接员工影响10万欧": "March order volume decreases, direct and indirect labor impact 100 K€",
    "订单量下滑19%，半固定、运营、园区费用影响53万欧": "Order volume decreases by 19%, semi-fixed, operating and campus cost impact 530 K€",
    "总人次3989，截至4月影响29万欧": "Total headcount-times 3,989; impact by April 290 K€",
    "总人次323，截至4月影响2万欧": "Total headcount-times 323; impact by April 20 K€",
    "截至4月累计影响9万欧": "Cumulative impact by April 90 K€",
    "截至4月降费1万": "Cost reduction by April 10 K€",
    "已落地": "Implemented",
    "已替换81人": "81 people replaced",
    "1月加班费减少5100，2月加班费减少3000": "Overtime cost reduced by 5,100 in January and 3,000 in February",
    "进度：1月份已完成与供应商购买价格谈判；，目前无进展": "Progress: supplier purchase price negotiation completed in January; no further progress yet",
    "1.已落地；2.无进展；3.无进展；4.无进展": "1. Implemented; 2. No progress; 3. No progress; 4. No progress",
    "1.申请人力部门提供全员出勤率数据，以及宽放人员日常岗位排布明细；2.建议推动宽放人员实现三家工厂统筹共享、统一调配，；3.需现场核实：日常少量人员缺勤（1-2 人）对产线整体生产效率的实际影响，合理评估现有宽放比例的必要性。": "1. Request HR to provide attendance rate data and daily position allocation for allowance staff; 2. Promote shared and unified allocation across the three factories; 3. Verify on site the real efficiency impact of small daily absences, usually 1-2 people, and reassess the allowance ratio.",
    "1，提升负荷率，研究提效，节约2辆叉车": "1. Improve load rate and study efficiency improvement, saving 2 forklifts",
    "已落地53万欧，全年预算160万欧": "Implemented 530 K€; full-year budget 1,600 K€"
    ,"订单量 规模负影响": "Order volume negative scale impact"
    ,"三张表口径：订单量下降负影响100万欧": "Three-table view: order volume decrease creates 1,000 K€ negative impact"
    ,"通胀负影响": "Inflation negative impact"
    ,"三张表口径：通胀负影响40万欧": "Three-table view: inflation creates 400 K€ negative impact"
    ,"降费项目": "Cost reduction projects"
    ,"新增63万欧 + 持续收益7万欧": "New 630 K€ + recurring benefit 70 K€"
    ,"园区分摊": "Campus allocation"
    ,"园区分摊下降1万欧": "Campus allocation decreases by 10 K€"
  },
  tr: {
    "上涨因素": "Maliyet artış faktörü",
    "下降因素": "Maliyet azaltma faktörü",
    "延续项目": "Devam eden proje",
    "提效": "Verimlilik artışı",
    "直接员工降费": "Direkt işçilik maliyet azaltımı",
    "间接员工降费": "Endirekt işçilik maliyet azaltımı",
    "备件费用": "Yedek parça maliyeti",
    "能源费用": "Enerji maliyeti",
    "生产提效": "Üretim verimliliği artışı",
    "组织运营费": "Operasyon maliyeti",
    "折旧降费": "Amortisman maliyet azaltımı",
    "降存货跌价准备": "Stok değer düşüklüğü karşılığı azaltımı",
    "土方": "Türkiye ekibi",
    "中方": "Çin ekibi",
    "土方、中方": "Türkiye + Çin ekibi",
    "李想": "Li Xiang",
    "订单量-折旧": "Sipariş hacmi - amortisman",
    "订单量-直接、间接人工": "Sipariş hacmi - direkt ve endirekt işçilik",
    "订单量-其他": "Sipariş hacmi - diğer",
    "；通胀影响-直接人工工资上涨；": "Enflasyon etkisi - direkt işçilik ücret artışı",
    "；通胀影响-管理人工工资上涨；": "Enflasyon etkisi - yönetim işçilik ücret artışı",
    "通胀影响-其他": "Enflasyon etkisi - diğer",
    "园区分摊费用": "Kampüs dağıtım maliyeti",
    "25年延续项目": "2025 devam eden proje",
    "提升单台生产效率，减少单台成本": "Birim üretim verimliliğini artırma ve birim maliyeti azaltma",
    "用工结构调整：提前谈判清退固定员工，回收期12~15个月": "İşgücü yapısı ayarı: sabit çalışan çıkışı için erken görüşme, geri ödeme süresi 12-15 ay",
    "锁定26年到月需求、生产、库存预算，均衡生产策略，消除25年分流浪费42万欧（只有一个工厂有），加班费损失80万欧": "2026 aylık talep, üretim ve stok bütçesini kilitleme; üretimi dengeleme; 420 K€ yönlendirme israfı ve 800 K€ fazla mesai kaybını kaldırma",
    "模块化成套供货": "Modüler kit tedariki",
    "对标国内工厂优化空间： DW 84人，初步机会10个，（master替班16人）": "Çin fabrikalarıyla kıyaslama: DW 84 destek personeli, ilk fırsat 10 pozisyon, 16 yedek master dahil",
    "冲压润滑收集循环使用": "Pres yağlama sıvısını toplayıp yeniden kullanma",
    "工厂空调设备节能运行优化": "Fabrika klima ekipmanı enerji tasarruflu işletim optimizasyonu",
    "工厂照明节能优化": "Fabrika aydınlatma enerji tasarrufu optimizasyonu",
    "注塑件节拍改进（减少3秒）": "Enjeksiyon çevrim süresi iyileştirme, 3 saniye azaltma",
    "减少人员宽放损失": "Personel tolerans kaybını azaltma",
    "叉车租赁费降低": "Forklift kiralama maliyetini azaltma",
    "宜家订单纸壳上料工序效率提升": "IKEA siparişi karton besleme proses verimliliğini artırma",
    "包装线速优化": "Paketleme hat hızı optimizasyonu",
    "折旧费用优化": "Amortisman maliyeti optimizasyonu",
    "超期原材料、半成品消耗": "Süresi geçmiş hammadde ve yarı mamul tüketimi",
    "订单量上涨18%，折旧全年持续收益65万欧": "Sipariş hacmi %18 artar; amortisman yıl boyunca 650 K€ sürekli fayda sağlar",
    "如果订单量恶化，直接、间接员工无法裁员导致的影响": "Sipariş hacmi kötüleşirse, direkt ve endirekt çalışanlar hemen azaltılamadığı için maliyet etkisi oluşur",
    "订单量上涨18%，半固定、白领工资、运营、园区费用等全年持续收益44.2万欧": "Sipariş hacmi %18 artar; yarı sabit maliyet, beyaz yaka ücretleri, operasyon ve kampüs maliyetleri yıl boyunca 442 K€ fayda sağlar",
    "直接人工和间接人工上涨12%，每人上涨241欧，总计影响96万欧": "Direkt ve endirekt işçilik %12 artar, kişi başı 241 EUR, toplam etki 960 K€",
    "管理人员上涨5%，每人161欧": "Yönetim işçiliği %5 artar, kişi başı 161 EUR",
    "除工资科目和折旧外其余科目全部受通胀影响8%": "Ücret ve amortisman dışındaki tüm hesaplar %8 enflasyondan etkilenir",
    "IT费用降费；分摊逻辑-产量改为产值": "IT maliyet azaltımı; dağıtım mantığı üretim adedinden üretim değerine çevrilir",
    "1.轮毂和油底壳螺钉紧固自动化；2.QS部件喂料自动化；3.人力成本减少": "1. Teker göbeği ve yağ karteri vida sıkma otomasyonu; 2. QS parça besleme otomasyonu; 3. İşçilik maliyeti azaltımı",
    "UPH提升至130": "UPH 130 seviyesine çıkarılır",
    "蓝领工人合同工替换高工资正式工。": "Yüksek ücretli kadrolu mavi yaka çalışanlar sözleşmeli çalışanlarla değiştirilir.",
    "26年不产生分流费、加班费": "2026 yılında yönlendirme maliyeti ve fazla mesai maliyeti oluşmaz",
    "洗碗机预装8个项目18个人模块化成套，17万欧（不包含材料上涨）": "Bulaşık makinesi ön montajında 8 proje ve 18 kişi modüler kite çevrilir, malzeme artışı hariç 170 K€",
    "1.第一阶段1人（物流减少一人，岗位合并）-土方主导；2.第一阶段1人（物流减少一人，岗位合并）-土方主导；3.第一阶段1人（物流减少一人，岗位合并）-土方主导；4.DW辅助人员84人，初步机会10个-中方主导；": "1. Faz 1: lojistikte 1 kişi azaltma ve görev birleştirme, Türkiye liderliğinde; 2. Faz 1: aynı; 3. Faz 1: aynı; 4. DW destek personeli 84 kişi, ilk fırsat 10 pozisyon, Çin liderliğinde.",
    "848欧一桶，每月节省0.85桶": "Varil başına 848 EUR, ayda 0.85 varil tasarruf",
    "电单价0.057欧//Kwh": "Elektrik birim fiyatı 0.057 EUR/kWh",
    "节拍62S-59S，效率提升": "Çevrim süresi 62 saniyeden 59 saniyeye iyileşir",
    "26年预算人员出勤总工时宽放6%预留12个人，实际缺勤率在4%左右，计划优化2-4人": "2026 bütçesinde toplam çalışma saatleri için %6 tolerans ve 12 kişi ayrılır; gerçek devamsızlık yaklaşık %4, plan 2-4 kişi optimizasyonudur",
    "1.丰田叉车合同11月到期后，更换报价最低供应商；2.排查产能负荷率，目标减少5%叉车数量": "1. Toyota forklift sözleşmesi Kasımda bitince en düşük teklif veren tedarikçiye geçilir; 2. Kapasite yük oranı incelenir ve forklift sayısında %5 azaltım hedeflenir",
    "部分设备、模具折旧年限10→30": "Seçili ekipman ve kalıpların amortisman süresi 10 yıldan 30 yıla çıkarılır",
    "与开发达成一致，超期原材料加工成半成品": "Ar-Ge ile mutabık kalınarak süresi geçmiş hammaddeler yarı mamule işlenir",
    "订单量下滑19%，折旧影响47万欧": "Sipariş hacmi %19 düşer, amortisman etkisi 470 K€",
    "3月订单量下降，直接、间接员工影响10万欧": "Mart sipariş hacmi düşer, direkt ve endirekt işçilik etkisi 100 K€",
    "订单量下滑19%，半固定、运营、园区费用影响53万欧": "Sipariş hacmi %19 düşer, yarı sabit, operasyon ve kampüs maliyeti etkisi 530 K€",
    "总人次3989，截至4月影响29万欧": "Toplam kişi-sayısı 3.989; Nisan sonu etki 290 K€",
    "总人次323，截至4月影响2万欧": "Toplam kişi-sayısı 323; Nisan sonu etki 20 K€",
    "截至4月累计影响9万欧": "Nisan sonu kümülatif etki 90 K€",
    "截至4月降费1万": "Nisan sonu maliyet azaltımı 10 K€",
    "已落地": "Uygulandı",
    "已替换81人": "81 kişi değiştirildi",
    "1月加班费减少5100，2月加班费减少3000": "Fazla mesai maliyeti Ocakta 5.100, Şubatta 3.000 azaldı",
    "进度：1月份已完成与供应商购买价格谈判；，目前无进展": "İlerleme: Ocakta tedarikçi satın alma fiyatı görüşmesi tamamlandı; şu an ek ilerleme yok",
    "1.已落地；2.无进展；3.无进展；4.无进展": "1. Uygulandı; 2. İlerleme yok; 3. İlerleme yok; 4. İlerleme yok",
    "1.申请人力部门提供全员出勤率数据，以及宽放人员日常岗位排布明细；2.建议推动宽放人员实现三家工厂统筹共享、统一调配，；3.需现场核实：日常少量人员缺勤（1-2 人）对产线整体生产效率的实际影响，合理评估现有宽放比例的必要性。": "1. İK'dan tüm çalışanların devam oranı ve tolerans personeli günlük görev dağılımı istenir; 2. Üç fabrika arasında ortak ve merkezi planlama önerilir; 3. Az sayıda günlük devamsızlığın, genelde 1-2 kişi, hat verimliliğine gerçek etkisi sahada doğrulanır.",
    "1，提升负荷率，研究提效，节约2辆叉车": "1. Yük oranını artırma ve verimlilik çalışmasıyla 2 forklift tasarrufu",
    "已落地53万欧，全年预算160万欧": "530 K€ uygulandı; tam yıl bütçe 1.600 K€"
    ,"订单量 规模负影响": "Sipariş hacmi negatif ölçek etkisi"
    ,"三张表口径：订单量下降负影响100万欧": "Üç tablo görünümü: sipariş hacmi düşüşü 1.000 K€ negatif etki yaratır"
    ,"通胀负影响": "Enflasyon negatif etkisi"
    ,"三张表口径：通胀负影响40万欧": "Üç tablo görünümü: enflasyon 400 K€ negatif etki yaratır"
    ,"降费项目": "Maliyet azaltma projeleri"
    ,"新增63万欧 + 持续收益7万欧": "Yeni 630 K€ + sürekli fayda 70 K€"
    ,"园区分摊": "Kampüs dağıtımı"
    ,"园区分摊下降1万欧": "Kampüs dağıtımı 10 K€ azalır"
  }
};

const PROJECT_FIELD_NAMES = ["category", "strategy", "project", "owner", "timing", "progress"];

export function localizeProjectField(item, field, language = "zh") {
  const value = item?.[field] ?? "";
  if (language === "zh") return value;
  const saved = item?.translations?.[language]?.[field] || item?.localized?.[language]?.[field];
  return saved || localizeProjectText(value, language);
}

export function localizeProjectText(value, language = "zh") {
  const text = String(value ?? "");
  if (language === "zh" || !text) return text;
  const dictionary = PROJECT_TEXT_TRANSLATIONS[language] || {};
  if (dictionary[text]) return dictionary[text];
  if (!/[\u3400-\u9fff]/.test(text)) return text;
  return Object.entries(dictionary)
    .sort((a, b) => b[0].length - a[0].length)
    .reduce((result, [source, target]) => result.split(source).join(target), text);
}

export function projectTextFields() {
  return [...PROJECT_FIELD_NAMES];
}

export function projectImpactSummary(items = PROJECT_SEEDS) {
  const bucket = (impactType) => {
    const rows = items.filter((item) => item.impactType === impactType);
    return { planned: sum(rows.map((item) => item.plannedImpact)), actual: sum(rows.map((item) => item.actualCumulative)) };
  };
  return { inflation: bucket("inflation"), wage: bucket("wage"), scale: bucket("scale") };
}

function project(id, lead, category, strategy, projectName, owner, timing, plannedImpact, actualCumulative, progress, impactType, budgetMonths = Array(12).fill(0), actualMonths = Array(12).fill(0)) {
  return { id, type: category === "上涨因素" ? "increase" : "decrease", lead, category, strategy, project: projectName, owner, timing, plannedImpact, actualCumulative, progress, impactType, budgetMonths, actualMonths };
}

function sum(values) {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}
