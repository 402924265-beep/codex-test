// Generated from the employee structure workbooks supplied on 2026-08-28.
// These values are the fixed monthly budget baseline until an annual HC budget is provided.
// CK totals come from Candy-Cooking; Ovens/Hobs sheets are used only to split production lines.
const label = (zh, en, tr = en) => ({ zh, en, tr });
const row = (id, names, values = {}) => ({ id, label: label(...names), direct: 0, indirect: 0, white: 0, shared: 0, ...values });
const department = (id, names, rows) => ({ id, label: label(...names), rows });

export const EMPLOYEE_ATTENDANCE_DATA = {
  version: "2026-hc-structure-baseline-v1",
  budgetYear: 2026,
  fields: ["direct", "indirect", "white", "shared"],
  factories: {
    dw: {
      label: label("DW洗碗机", "DW Dishwasher", "DW Bulaşık Makinesi"),
      sourceFile: "Renta DW Factory Personnel Structure and HC 01 rev 2 1.xlsx",
      sourceSheet: "Candy-DW-TR",
      departments: [
        department("production", ["生产制造", "Production", "Üretim"], [
          row("plant-management", ["工厂管理", "Plant management", "Fabrika yönetimi"], { white: 1 }),
          row("line-1", ["1号线", "Line 1", "Hat 1"], { direct: 47, indirect: 3, white: 1 }),
          row("line-2", ["2号线", "Line 2", "Hat 2"], { direct: 52, indirect: 4 }),
          row("pre-assy-basket", ["预装配篮", "Pre-assembly basket", "Ön montaj sepeti"], { direct: 15, indirect: 1 }),
          row("small-pre-assy", ["小预装配", "Small pre-assembly", "Küçük ön montaj"], { direct: 12, indirect: 1 }),
          row("pre-assy-sump-door", ["预装配水槽&门", "Pre-assembly sump & door", "Ön montaj hazne ve kapı"], { direct: 30, indirect: 2 }),
          row("packing", ["包装", "Packing", "Paketleme"], { direct: 11, indirect: 3 }),
          row("internal-logistics", ["内部物流", "Internal logistics", "İç lojistik"], { indirect: 9 }),
          row("documentation", ["文档区", "Documentation", "Dokümantasyon"], { direct: 5 }),
          row("decoration", ["面板组装与喷涂", "Decoration & coating", "Panel montajı ve boyama"], { direct: 20, indirect: 1 }),
          row("mechanic", ["钣金", "Mechanic", "Sac metal"], { direct: 21, indirect: 6, white: 1 }),
          row("injection", ["注塑", "Injection", "Enjeksiyon"], { direct: 5, indirect: 1 }),
          row("repair", ["维修", "Repair", "Onarım"], { indirect: 3 })
        ]),
        department("quality", ["质量", "Quality", "Kalite"], [
          row("quality-manager", ["质量经理", "Quality manager", "Kalite yöneticisi"], { white: 1 }),
          row("iqc", ["外检 IQC", "Incoming quality (IQC)", "Giriş kalite kontrolü (IQC)"], { indirect: 4, white: 1 }),
          row("process-q", ["过程检验", "Process quality", "Proses kalite"], { indirect: 5, white: 2 }),
          row("cabas", ["质量改进 CABAS", "Quality improvement (CABAS)", "Kalite iyileştirme (CABAS)"], { indirect: 7, white: 2 }),
          row("quality-shared", ["质量共享", "Quality shared", "Paylaşımlı kalite"], { shared: 0.33 }),
          row("homologation", ["认证与测量", "Homologation & measurement", "Homologasyon ve ölçüm"], { indirect: 4, white: 1 })
        ]),
        department("planning", ["计划", "Planning", "Planlama"], [
          row("planning", ["计划", "Planning", "Planlama"], { indirect: 1, white: 4 })
        ]),
        department("technical", ["技术", "Technical", "Teknik"], [
          row("technical-manager", ["技术经理", "Technical manager", "Teknik yönetici"], { white: 1 }),
          row("maintenance", ["维保", "Maintenance", "Bakım"], { indirect: 8, white: 1 }),
          row("tooling", ["模具", "Tooling", "Kalıp"], { indirect: 3, white: 2 }),
          row("process", ["工艺", "Process", "Proses"], { white: 1 }),
          row("time-method", ["时间与方法", "Time & method", "Zaman ve metot"], { white: 1 }),
          row("automation", ["自动化", "Automation", "Otomasyon"], { white: 1 })
        ]),
        department("digitalization", ["数字化", "Digitalization", "Dijitalleşme"], [
          row("digitalization-manager", ["数字化经理", "Digitalization manager", "Dijitalleşme yöneticisi"], { shared: 0.33 }),
          row("planning-engineer", ["计划工程师", "Planning engineer", "Planlama mühendisi"], { shared: 1 })
        ]),
        department("hops", ["HOPS", "HOPS", "HOPS"], [
          row("lean", ["精益生产", "Lean production", "Yalın üretim"], { shared: 0.33 }),
          row("union", ["工会", "Union", "Sendika"], { indirect: 2 })
        ]),
        department("supply", ["供应链", "Supply chain", "Tedarik zinciri"], [
          row("warehouse", ["仓库", "Warehouse", "Depo"], { indirect: 15 }),
          row("supply-shared", ["供应链共享", "Supply chain shared", "Paylaşımlı tedarik zinciri"], { shared: 0.33 })
        ]),
        department("ehs", ["EHS及厂务", "EHS & facilities", "EHS ve tesis hizmetleri"], [
          row("security", ["安全", "Security", "Güvenlik"], { indirect: 1, white: 1 }),
          row("ehs-shared", ["EHS共享", "EHS shared", "Paylaşımlı EHS"], { indirect: 1, white: 1 }),
          row("facility-shared", ["厂务共享", "Facilities shared", "Paylaşımlı tesis hizmetleri"], { shared: 0.33 }),
          row("environment-shared", ["环境共享", "Environment shared", "Paylaşımlı çevre"], { shared: 0.33 })
        ])
      ]
    },
    ck: {
      label: label("CK厨电", "CK Cooking", "CK Pişirme"),
      sourceFile: "Comparison of CK production efficiency information_ (003).xlsx",
      sourceSheet: "Candy-Cooking + Production Analysis",
      departments: [
        department("technical", ["技术团队", "Technical team", "Teknik ekip"], [
          row("technical-manager", ["技术经理", "Technical manager", "Teknik yönetici"], { white: 1 }),
          row("maintenance", ["维保", "Maintenance", "Bakım"], { indirect: 10, white: 2 }),
          row("tooling", ["模具", "Tooling", "Kalıp"], { indirect: 4, white: 1 }),
          row("time-method", ["时间与方法", "Time & method", "Zaman ve metot"], { indirect: 1, white: 2 }),
          row("automation-process", ["自动化与工艺", "Automation & process", "Otomasyon ve proses"], { indirect: 1, white: 2 }),
          row("technical-shared", ["数字化/能源共享", "Digital & energy shared", "Paylaşımlı dijitalleşme ve enerji"], { shared: 1 })
        ]),
        department("production", ["生产制造", "Production", "Üretim"], [
          row("plant-manager", ["工厂经理", "Plant manager", "Fabrika yöneticisi"], { white: 1, shared: 1 / 3 }),
          row("production-manager", ["生产经理", "Production manager", "Üretim yöneticisi"], { white: 1 }),
          row("line-1", ["1号线", "Line 1", "Hat 1"], { direct: 38, indirect: 4, white: 1 }),
          row("line-2", ["2号线", "Line 2", "Hat 2"], { direct: 22, indirect: 2 }),
          row("line-3", ["3号线", "Line 3", "Hat 3"], { direct: 36, indirect: 4 }),
          row("line-6", ["6号线（燃气）", "Line 6 (gas)", "Hat 6 (gaz)"], { direct: 68, indirect: 7, white: 1 }),
          row("line-7", ["7号线", "Line 7", "Hat 7"], { direct: 19, indirect: 3 }),
          row("decoration-oven", ["烤箱面板组装", "Oven panel assembly", "Fırın panel montajı"], { direct: 24 }),
          row("door-silicone", ["门预装硅胶", "Door silicone pre-assembly", "Kapı silikon ön montajı"], { direct: 4 }),
          row("glass-silicone", ["玻璃面板硅胶", "Glass panel silicone pre-assembly", "Cam panel silikon ön montajı"], { direct: 2 }),
          row("decoration-hob", ["灶具面板丝印", "Hob worktop serigraphy", "Ocak panel serigrafisi"], { direct: 9 }),
          row("worktop-silicone", ["灶具玻璃预装硅胶", "Hob glass worktop silicone", "Ocak cam tabla silikon ön montajı"], { direct: 3 }),
          row("decoration-support", ["面板与预装支持", "Decoration & pre-assembly support", "Panel ve ön montaj desteği"], { indirect: 4, white: 1 }),
          row("packing", ["包装和通用件", "Packing & common units", "Paketleme ve ortak parçalar"], { direct: 6, indirect: 5, white: 1 }),
          row("colombo-oven", ["Colombo（烤箱）", "Colombo (ovens)", "Colombo (fırınlar)"], { direct: 2 }),
          row("flexy-oven", ["Flexy（烤箱）", "Flexy (ovens)", "Flexy (fırınlar)"], { direct: 4 }),
          row("unihob", ["Unihob", "Unihob", "Unihob"], { direct: 2 }),
          row("ales", ["Ales", "Ales", "Ales"], { direct: 2 }),
          row("coiltech", ["Coiltech裁切", "Coiltech cut to length", "Coiltech kesim"], { direct: 4 }),
          row("panel-press", ["面板自动冲压", "Panel automation press", "Panel otomasyon presi"], { direct: 2 }),
          row("manual-press", ["手工冲压", "Manual press", "Manuel pres"], { direct: 2 }),
          row("qs", ["QS", "QS", "QS"], { direct: 4 }),
          row("scamm", ["Scamm", "Scamm", "Scamm"], { direct: 1 }),
          row("colombo-hob", ["Colombo（灶具）", "Colombo (hobs)", "Colombo (ocaklar)"], { direct: 2 }),
          row("flexy-hob", ["Flexy（灶具）", "Flexy (hobs)", "Flexy (ocaklar)"], { direct: 3 }),
          row("mechanic-support", ["钣金支持", "Mechanic support", "Sac metal desteği"], { indirect: 11 }),
          row("flat-enamel", ["平板搪瓷", "Flat part enamel", "Düz parça emaye"], { direct: 9 }),
          row("cavity-enamel", ["腔体搪瓷", "Cavity enamel", "Kavite emaye"], { direct: 10 }),
          row("powder-paint", ["喷粉", "Powder paint", "Toz boya"], { direct: 5 }),
          row("manual-spray", ["人工喷涂", "Manual spray", "Manuel boya"], { direct: 3 }),
          row("enamel-paint-support", ["搪瓷与喷涂支持", "Enamel & paintshop support", "Emaye ve boya atölyesi desteği"], { indirect: 7 }),
          row("union", ["工会", "Union", "Sendika"], { indirect: 3 })
        ]),
        department("quality", ["质量", "Quality", "Kalite"], [
          row("iqc", ["外检 IQC", "Incoming quality (IQC)", "Giriş kalite kontrolü (IQC)"], { indirect: 5, white: 1 }),
          row("process-q", ["过程检验", "Process quality", "Proses kalite"], { indirect: 7, white: 3 }),
          row("cabas", ["质量改进 CABAS", "Quality improvement (CABAS)", "Kalite iyileştirme (CABAS)"], { indirect: 12, white: 1 })
        ]),
        department("planning", ["计划", "Planning", "Planlama"], [
          row("planning-manager", ["计划经理", "Planning manager", "Planlama yöneticisi"], { white: 1 }),
          row("planning", ["计划", "Planning", "Planlama"], { indirect: 1, white: 7 })
        ]),
        department("hops", ["HOPS", "HOPS", "HOPS"], [
          row("lean", ["精益生产", "Lean production", "Yalın üretim"], { shared: 1 / 3 })
        ]),
        department("supply", ["供应链", "Supply chain", "Tedarik zinciri"], [
          row("warehouse", ["仓库和内部物流", "Warehouse & internal logistics", "Depo ve iç lojistik"], { indirect: 41, white: 1 }),
          row("supply-shared", ["供应链共享", "Supply chain shared", "Paylaşımlı tedarik zinciri"], { shared: 1 / 3 })
        ]),
        department("ehs", ["EHS", "EHS", "EHS"], [
          row("ehs-shared", ["EHS共享", "EHS shared", "Paylaşımlı EHS"], { indirect: 1, shared: 2 / 3 }),
          row("quality-shared", ["质量共享", "Quality shared", "Paylaşımlı kalite"], { shared: 1 / 3 })
        ])
      ]
    }
  }
};
