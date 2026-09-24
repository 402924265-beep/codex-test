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

## 公开制造费用工作台与智能问答

公开入口位于 `web_static/mfg-cost-workbench/index.html`。普通访问先显示演示账号与权限登录页；登录后按生产、行政、采购、成本审核、财务编制和管理查看六种岗位权限显示页面。成本岗位在滚动预测页可以建立预测批次，所有已登录账号都可以打开右下角智能指标问答；嵌入式问答不重复显示登录页。

DeepSeek API Key不进入网页或GitHub仓库。Netlify函数 `netlify/functions/deepseek.cjs` 通过同源 `/api/deepseek` 代理问答，部署站点时必须在Netlify环境变量中配置：

```text
DEEPSEEK_API_KEY=你的DeepSeek API Key
DEEPSEEK_MODEL=deepseek-flash
```

### 全站共享纠错（不是微调模型权重）

问答结果下方可点“纠正这次理解”填写完整的正确问法，或点“数字有误”提交数据核查。提交项保存在 Netlify Blobs 的站点级存储中，默认待审核；提交者的浏览器可立即按自己提交的说法试用（明确标记待审核）。只有审核通过的理解纠错才按“原问法 + 工厂/年月/期间”全站复用，并作为相近口语问题的 DeepSeek 语义识别示例，避免把 8 月纠错误套到 7 月。数字问题不会自动修改源表、公式或金额。

审核需要在同一个 Netlify 站点设置独立环境变量 `COST_LEARNING_ADMIN_TOKEN`（至少 24 个随机字符；不要放进 HTML、Git 或文档）。成本岗位打开问答抽屉里的“纠错审核”，输入此口令即可批准或驳回。演示账号密码只控制界面显示，不提供服务端审核权限。口令仅在当前网页内存中保留，退出时清除。

`/api/learning` 由 `netlify/functions/learning.cjs` 提供；单独打开 HTML 或运行本仓库的普通静态开发服务器不会提供站点级共享存储。函数未部署或不可用时，问答仍使用原有确定性数据引擎，但纠错不能提交或共享。运行 `npm run test:web` 可验证未审核、无口令、数字核查和审核通过后的访问边界。

`DEEPSEEK_MODEL`可省略，默认使用`deepseek-flash`。公开访问意味着任何人都可以消耗该API额度，应同时在DeepSeek账户侧设置可接受的余额或调用上限。

问答把“为什么高/低、怎么这么高/低、异常、变化”等单月表达识别为比较意图。用户未指定基准时，页面确定性引擎同时列示同比和环比，并用费用金额与产量方向区分费用变化和产量分摊；DeepSeek只解释这些已计算证据和待核实事项。

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
