# Candy DW cost 项目说明

## 项目定位

这是 Candy / 洗碗机 DW 制造费三张表工作台。当前主线是 `web_static/` 静态网页应用，辅线是 `dw_reconcile_app/` Python 本地核对版。

## 常用命令

```powershell
npm run test:web
python -m unittest discover -s tests -v
npm run serve:web
.\run_dw_reconcile_app.ps1
.\scripts\build_web_lan_package.ps1
.\scripts\build_windows_portable.ps1
```

如果当前 PowerShell 找不到命令，确认已安装并重启终端：Git、Node.js LTS、Python 3.12+。

## 主要目录

- `web_static/`：当前重点维护的三张表静态网页。
- `web_static/src/`：前端模块。
- `web_static/tests/`：Node 测试。
- `dw_reconcile_app/`：早期 Python 本地核对工具。
- `tests/`：Python 测试。
- `scripts/`：打包脚本。
- `docs/`：设计说明与历史计划。
- `outputs/`：少量关键样例/输出。
- `dist/`：少量历史打包 zip。

## 业务口径

- 单台制造费 = 制造费 / 产量。
- UPPH = 产量 / (直接用人 + 间接用人) / 工作日 / 7.5。
- 制造费率 = 制造费 / 产值，产值 = 平均单价 * 产量。
- 目标完成率 = 2 - 26实际 / 预算。
- 制造费差额 = 单台同比差 * 26年产量。
- 月度原因只来自小科目明细原因，不混入降费项目。
- 降费项目单独作为正式项目库管理。

## 工作习惯

- 修改业务逻辑后优先跑 `npm run test:web`。
- 修改 Python 本地版后跑 `python -m unittest discover -s tests -v`。
- 不要提交 `node_modules/`、日志、临时拆包 XML、大量中间输出。
- Supabase schema 当前是公开读写，调整公开部署前要提醒用户。
- `xlsx` 包有 npm audit 高危提示但无官方修复，若处理不可信 Excel 要特别提醒。
