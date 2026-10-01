# 智能指标问答共享改造 — 2026-10-01当前验收状态

## 当前可用入口

- 正式原站：https://mfg-cost-workbench-lixiang.netlify.app/mfg-cost-workbench/
- 问答直达（无需先操作登录页）：https://mfg-cost-workbench-lixiang.netlify.app/mfg-cost-workbench/?embed=assistant&lang=zh
- 已恢复完整旧生产部署 `6ab3f88e9869687e51bb6689`。浏览器实际提问“洗碗机2026年7月折旧费用是多少”已返回本地结果和DeepSeek解释；另一个无财务金额公式问题也完成真实模型调用。页面可打开，不等于新版共享问答已正式交付。
- 新版完整预览 `6abe970690d15e842d8025e6`：https://6abe970690d15e842d8025e6--mfg-cost-workbench-lixiang.netlify.app/mfg-cost-workbench/?embed=assistant&lang=zh 。共享后台可用，DeepSeek部署变量是脱敏占位值，实际调用401；不要把其绿色“已连接”标识当作真实连接验证。

## 已确定的部署阻塞

用户已明确同意此前三项授权：发布口令默认范围、原站密钥用于新版后端并切换、真实CK/DW问答验收；无需重复问这些权限。

直接读取生产部署API错误正文确认：403，`Account credit usage exceeded - new deploys are blocked until credits are added`。此前SDK只返回Forbidden，以及另一个额度界面新周期的读数不足以排除额度阻塞；以本次实际部署拒绝为准。免费Netlify可以等下个账期重置，不必购买。没有购买套餐或启用自动充值。

Netlify Secrets Controller不向API返回真实生产密钥，原值未修改。把脱敏返回值用于部署变量会得到401，即使configured=true。完整生产部署应直接继承原环境变量，不再复制读取到的占位文本。新版曾短暂切到原地址，真实调用失败后已恢复原完整生产版本；共享Blobs数据没有回滚或删除。没有通过预览切换继续规避已确认的额度限制。

## 共同学习与共享数据

共享会话、业务口径和Excel版本通过站点级 `mfg-shared-assistant` 保存，强一致读取、ETag并发保护。模型理解问题，确定性引擎计算金额、单台、费率、累计和两厂合并，再交模型解释。共同学习是把经确认的知识用于后续回答，不修改模型权重；缺数据仍需说明缺口。

18条基线规则已迁入（17确认、1行政待核定）。本轮又按用户已确认要求发布1条人工输出格式：售价→产量→收入→三类人工金额/单台/费率；两厂分别及合计；分子分母期间一致，自定售价标情景。真实Netlify提交→待确认→发布→新请求读取通过，当前共19条，revision=5，候选清空。发布口令已在原站以免费账号默认范围创建，本机仅保存在Git忽略的 `.netlify/shared-publish-token.txt`，权限600；不进入HTML、Git、聊天和记忆正文。

真实共享会话保存了一问一答：1—7月CK/DW多指标问题，回答因401失败。不能声称新模型多轮规划、同义问法学习或两设备续聊已通过。数据版本保持 `excel-bcec9c5e093d4078`，来源9月23日，没有发布新成本数据；9月29日三张表不自动覆盖基线。

未修改原业务数值、公式、cooking-data.js或原Excel解析链。保留G&A与主段人工隔离、SAP复合科目键、累计/合并加权、Q4=10—12、UPPH、缺失值、Service Fee、Halino售价情景及收益证据边界。

## 本地修复与验证

本轮补上脱敏密钥防护：旧代理状态不把占位值认作配置成功，共享后端在请求模型前拒绝占位值；新界面把未经真实调用验证的“已连接”改为“配置已载入”。这些修复目前只在本地/工作分支，生产额度恢复前未上线。

本轮源工程208项、共享引擎/后台52项、仓库85项通过。Excel导入逻辑未改，先前222项实际工作簿导入验证仍是已完成证据。原有桌面/手机、模拟多轮、候选发布、图表已验证。浏览器Excel下载与回读仍未验收，不列为完成。

截图与API证据：项目 `outputs/shared-assistant-qa-20261001/`，新增 `restored-live-answer.png`、`live-query-1.json`、`live-rule-publish.json`。旧模型能实际回答，不代表其每句话或业务因果已重新验收。

## 免费方案待用户选择

用户询问Netlify用途和免费替代，尚未授权更换服务商或向新平台迁移数据。建议先评估Cloudflare Pages/Workers + D1免费方案，继续使用现有DeepSeek API。官方截至2026-10-01：Workers每天10万请求、每次10毫秒CPU；D1总存储5GB、每天500万行读/10万行写。免费额度不代表不限量，迁移前必须测试当前计算包、初始化时间和数据库读写。可复用界面与业务引擎，需适配Netlify Blobs到D1、部署路由/密钥和共享事务，不能直接换网址宣称完成。

官方来源：
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://docs.netlify.com/manage/accounts-and-billing/billing/resume-paused-projects/
- https://docs.netlify.com/build/environment-variables/secrets-controller/

## 恢复与下一步

可编辑源：`outputs/mfg-cost-workbench-20260914/`；发布仓库：`codex-test/`。保留原生Netlify Request/Response静态ESM getStore入口，不退回旧connectLambda。临时部署脚本中 `mfg-production-full.mjs` 会误读取脱敏值，已判无效，不得复用；生产方案应完整上传文件/函数并直接继承生产环境。

若继续Netlify：恢复额度后完整生产部署，验证真实多指标/连续追问、纠错发布后复问、两端共享、数据预览和导出回读。若用户选择Cloudflare：先完成本地后端适配和免费限额测试，再取得该平台登录/数据迁移所需授权并迁移；原Netlify保留恢复入口。

用户原有design-qa.md、attendance-implementation-tr.png和两处.DS_Store保持未提交。主分支不改；工作分支保存本轮修复。
