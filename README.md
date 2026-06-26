# Candy DW cost

Candy / 洗碗机 DW 制造费三张表工作台整理版。

这个目录是从原 `New project` 清理出来的可维护版本，只保留当前有用的代码、测试、发布脚本、说明文档和少量关键样例/产物；没有复制 Excel 拆包 XML、历史审计临时文件、大量中间校准输出等垃圾文件。

## 主要用途

用于导入财务 Excel，生成洗碗机制造费分析：

- 全年驾驶舱：1-12 月 26 实际/预测、预算、25 同期，单/时/人/效/费指标。
- 月度差异：SAP 实际与同期、预算对比，小科目原因填写与自动总结。
- 降费项目：正式降费项目库，和月度原因分开管理。
- 导出三张表：按现有三张表结构输出 Excel。
- 支持中文、英文、土耳其语界面。
- 支持浏览器本机保存、Supabase 后台共享、局域网 JSON 文件共享。

## 目录结构

```text
web_static/          主要静态网页应用，当前重点维护
web_static/src/      前端业务模块：解析、核对、指标、导出、保存
web_static/tests/    Node 测试和真实文件校验脚本
dw_reconcile_app/    早期 Python 本地核对版，用于 1 月 DW 核对
tests/               Python 后端测试
scripts/             打包脚本
docs/                设计说明和历史实施计划
outputs/             少量保留的关键样例/输出文件
dist/                少量保留的历史打包 zip
supabase_schema.sql  Supabase 后台共享表结构
netlify.toml         Netlify 静态发布配置
```

## 当前重点应用：静态三张表工作台

本地启动：

```powershell
npm run serve:web
```

打开：

```text
http://127.0.0.1:8780/
```

运行测试：

```powershell
npm run test:web
```

发布为静态网站时，把 `web_static` 作为静态网站根目录即可。

## 局域网版本

打包：

```powershell
.\scripts\build_web_lan_package.ps1
```

生成：

```text
dist\DWWebLan.zip
```

局域网版本通过 `web_static/dev-server.mjs` 提供页面和本地 API，原因/项目保存到：

```text
data\analyses.json
data\factors.json
```

## Python 本地核对版

安装依赖：

```powershell
python -m pip install -r requirements.txt
```

启动：

```powershell
.\run_dw_reconcile_app.ps1
```

打开：

```text
http://127.0.0.1:8765/
```

运行测试：

```powershell
python -m unittest discover -s tests -v
```

打包：

```powershell
.\scripts\build_windows_portable.ps1
```

## 环境要求

重装系统后需要安装：

- Git for Windows
- Node.js LTS
- Python 3.12+

当前整理时已验证：

- Node 测试：32 个通过
- Python 测试：20 个通过

## 注意事项

1. `node_modules/` 是依赖目录，不提交。
2. `web_static/index.html` 当前带 Supabase 配置；如发给外部使用，要确认是否允许公开读写。
3. `supabase_schema.sql` 当前策略是公开读写，适合内部共享，不适合敏感权限场景。
4. 局域网版会把同事提交的原因和项目保存到 `data/`，上线后要定期备份。
5. npm audit 会提示 `xlsx` 高危漏洞，但官方包当前无修复版本；本项目用法是浏览器/本地解析用户主动导入的 Excel，后续如有安全要求可评估替换 SheetJS。

## 保留的关键产物

`outputs/` 中保留了：

- `candy_dw_three_tables.xlsx`
- `forecast_4plus8_verify.xlsx`
- `renta_2025_dec_act.xlsx`
- 三张表使用指南 PPTX

`dist/` 中保留了历史 zip 包，方便回退或发给别人使用。
