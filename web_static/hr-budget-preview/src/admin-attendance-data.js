// Generated from 2026 Administration Budget R2.xlsx / CANTEEN.
// Values are the monthly budget headcount baseline. Do not edit numbers by hand.
const flat = (value) => Array(12).fill(value);

const row = (id, label, entries) => ({ id, label, entries });

export const ADMIN_ATTENDANCE_DATA = {
  version: "2026-administration-budget-r2",
  sourceFile: "2026 Administration Budget R2.xlsx",
  sourceSheet: "CANTEEN",
  budgetYear: 2026,
  categories: [
    ["direct", "直接蓝领", "Direct blue collar"],
    ["indirect", "间接蓝领", "Indirect blue collar"],
    ["whiteCollar", "白领", "White collar"],
    ["waste", "废弃物人员", "Waste employee"],
    ["canteen", "食堂人员", "Canteen staff"],
    ["cleaning", "清洁人员", "Cleaning staff"],
    ["security", "安保人员", "Security staff"],
    ["drivers", "司机", "Drivers"],
    ["suppliers", "供应商", "Suppliers"],
    ["trainees", "实习生", "Trainees"],
    ["visitors", "访客", "Visitors"]
  ],
  groups: {
    dw: {
      label: "DW",
      units: [
        row("dw", "DW", {
          direct: [245,245,245,245,248,245,246,251,252,251,251,253],
          indirect: flat(85),
          whiteCollar: [26.5,26.5,26.5,26.5,26.5,26.5,26.5,27.5,27.5,27.5,27.5,27.5],
          waste: flat(10), canteen: flat(0), cleaning: flat(5), security: flat(1),
          drivers: flat(2), suppliers: flat(2), trainees: flat(10), visitors: flat(10)
        }),
        row("dw-rd", "DW R&D", {
          direct: flat(0), indirect: flat(11), whiteCollar: flat(21), waste: flat(0),
          canteen: flat(2), cleaning: flat(1), security: flat(0), drivers: flat(0),
          suppliers: flat(2), trainees: flat(3), visitors: flat(5)
        }),
        row("procurement-dw", "PROCUREMENT DW", {
          direct: flat(0), indirect: flat(0), whiteCollar: flat(6), waste: flat(0),
          canteen: flat(0), cleaning: flat(1), security: flat(0), drivers: flat(0),
          suppliers: flat(4), trainees: flat(1), visitors: flat(4)
        })
      ]
    },
    ck: {
      label: "CK + TD",
      units: [
        row("ck2", "CK2", {
          direct: [286,317,317,258,258,258,258,258,258,295,275,275],
          indirect: [133,136,136,127,127,127,127,127,127,133,130,130],
          whiteCollar: flat(34), waste: flat(10), canteen: flat(0), cleaning: flat(7),
          security: flat(6), drivers: flat(3), suppliers: flat(3), trainees: flat(15), visitors: flat(10)
        }),
        row("ck-rd", "CK R&D", {
          direct: flat(0), indirect: flat(3), whiteCollar: flat(50), waste: flat(0),
          canteen: flat(2), cleaning: flat(1), security: flat(1), drivers: flat(0),
          suppliers: flat(2), trainees: flat(3), visitors: flat(5)
        }),
        row("td", "TD（干衣机）", {
          direct: [296,292.964285714286,274.645161290323,276.6,274,274,314.451612903226,369.677419354839,455,455,455,455],
          indirect: [110,110,110,100,100,100,115.935483870968,132.193548387097,150,150,150,150],
          whiteCollar: flat(38), waste: flat(10), canteen: flat(0), cleaning: flat(7),
          security: flat(5), drivers: flat(3), suppliers: flat(5), trainees: flat(15), visitors: flat(10)
        }),
        row("td-rd", "TUMBLE DRYER R&D", {
          direct: flat(0), indirect: flat(15), whiteCollar: flat(22), waste: flat(0),
          canteen: flat(2), cleaning: flat(1), security: flat(0), drivers: flat(0),
          suppliers: flat(10), trainees: flat(4), visitors: flat(5)
        }),
        row("procurement-ck", "PROCUREMENT CK", {
          direct: flat(0), indirect: flat(0), whiteCollar: flat(7), waste: flat(0),
          canteen: flat(0), cleaning: flat(1), security: flat(0), drivers: flat(0),
          suppliers: flat(4), trainees: flat(1), visitors: flat(4)
        }),
        row("procurement-td", "PROCUREMENT TD", {
          direct: flat(0), indirect: flat(0), whiteCollar: flat(8), waste: flat(0),
          canteen: flat(0), cleaning: flat(0), security: flat(0), drivers: flat(0),
          suppliers: flat(4), trainees: flat(1), visitors: flat(4)
        })
      ]
    }
  }
};
