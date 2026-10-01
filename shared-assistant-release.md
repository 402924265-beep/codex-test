# 智能指标问答共享改造 — 2026-10-01验收状态

新版在原智能指标问答界面内支持共享对话、连续追问、多指标表格、已确认口径检索及Excel数据版本发布。DeepSeek规划查询和解释；金额、单台、费率、累计和两厂合并由确定性引擎计算。未修改原三张表业务数值、公式、cooking-data.js或原Excel解析器。

## 当前可审阅结果

- 最终预览：https://6abe0349ae47b573becf2b69--mfg-cost-workbench-lixiang.netlify.app/mfg-cost-workbench/?embed=assistant&lang=zh
- 原站：https://mfg-cost-workbench-lixiang.netlify.app/mfg-cost-workbench/
- 原站现已恢复已验证的完整生产部署`6ab3f88e9869687e51bb6689`，DeepSeek状态`configured=true`。新版暂不作为正式交付。
- 最终预览共享接口可读：revision=1、18条基线知识、无验收聊天或候选写入、数据版本`excel-bcec9c5e093d4078`。预览没有生产密钥，不能声称真实AI问答验收通过。
- 18条知识包含17条已确认规则和1条待行政核定参数；迁入科目复合键、G&A隔离、Q4、三类人工、累计/合并加权、UPPH、缺失值、Service Fee、收益证据、Halino售价情景等边界。账面收入沿用收入来源表，不以制造费生产数量覆盖收入数量。
- 会话纠错经口令确认发布后共享；会话发布的动态口径可撤回/恢复，撤回后不进入后续模型资料。源表计算边界不能通过聊天撤回。回答记录数据版本及口径摘要；历史聊天不因规则撤回而改写。
- 初始成本基线仍是9月23日的原站数据。三张表当前记忆已有9月29日新版文件；本次没有自动覆盖财务基线。Excel导入核对后才发布新版本。

## 已完成验证

- 源工程208项，Excel导入222项，共享引擎/后台50项，原仓库84项，共564项通过；git diff --check通过。
- 导入测试读取真实三张表格式，核对全年摘要值和另一工厂不被覆盖。摘要与旧明细不一致时，只有当前摘要等于已发布摘要才保留已核对明细，否则把明细标缺失；不自动调平或分摊差额。
- 本机隔离模拟服务不接外部API：电脑1440×900、手机390×844均无整页横向溢出；多指标表同时展示售价、产量、收入、人工金额、单台和收入费率；连续追问保留两厂及1—7月范围，显示预算对比与逐月表；图表已绘制；第二标签读取同一会话。
- 本机模拟纠错进入待确认并发布成功。真实Netlify提交→发布→另一浏览器复问尚未做。
- 图像证据保存在项目`outputs/shared-assistant-qa-20261001/`。截图内财务数字为模拟数据，不是业务分析结论。
- Excel下载按钮已触发，但当前浏览器工具的下载事件超时且未取得文件，浏览器下载与回读尚未验收，不列为通过。
- Impeccable检测因缺HTML解析模块降级：491项建议及1项原有视觉警告，没有阻断错误；不作为完整视觉验收结论。随后进行上述真实界面检查。

## 正式发布剩余确认

自动审批已拒绝下列操作，均已向用户提问，尚未取得明确回答；不得绕过：

1. 新增`COST_LEARNING_ADMIN_TOKEN`。免费账号拒绝仅Functions的范围，需用户同意只在原站以默认环境范围保存，或由用户自行配置。现有环境变量不覆盖。凭据不写入HTML、Git、聊天或记忆。
2. 将原站已有DeepSeek密钥用于新版同站部署的后端函数并切换完整正式版本。标准生产部署API现返回403，原因未确认；完整预览可部署。CLI的部署变量尝试未恢复连接，完整创建时设置部署变量的方案仍待授权与验证。
3. 把已发布CK/DW费用、人工、产量、收入、同期与预算计算结果交给现有DeepSeek解释，并将几条验收问答保存到原Netlify共享会话。可另选只用模拟数据验收。

完成以上后，还须原地址核验模型连接、提交/确认口径、另一浏览器继续会话及重问、数据预览/发布并发保护和导出文件回读。不要把测试、Git推送或预览发布当作正式业务验收。

## 维护与恢复

- 可编辑源工程：`/Users/lixiang/Documents/ChatGPT/制造费三张表网站/outputs/mfg-cost-workbench-20260914/`。重点为shared-engine.js、shared-client.js、shared-import.js、shared-knowledge.json、shared.test.cjs、shared-import.test.mjs、app.js、style.css和build.mjs。
- 发布仓库：`/Users/lixiang/Documents/ChatGPT/制造费三张表网站/codex-test/`。新入口为netlify/functions/shared.mjs；共享后台为lib/shared-handler.cjs；生成计算包为lib/shared-engine.cjs。
- 用bundled Node运行build.mjs后，将生成HTML复制到web_static/mfg-cost-workbench/index.html。新函数使用原生Netlify Request/Response和静态ESM getStore，保留强一致及ETag条件写入；不改回旧CJS connectLambda入口。
- 用户原有design-qa.md、attendance-implementation-tr.png、两处.DS_Store不加入本次提交。当前只推送工作分支，未经正式切换确认不推main触发发布。
- 共享会话保存在站点级mfg-shared-assistant存储。当前无账号，不能核验操作者真实身份；发布口令校验不是公司单点登录。会话目前整份读取，长期大量聊天的分页是规模限制，尚未实现。
