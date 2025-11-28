一、项目概述（目标 & 核心体验）

目标：实现一款“叠层三消”单机休闲闯关手机/Web 游戏（受《羊了个羊》启发），支持关卡挑战、复活/道具、每日任务、排行榜与管理后台关卡编辑。强调「上瘾但公平」、「短时高频消费」与「可编辑的关卡系统」以便后续运营与 A/B 测试。

核心体验要点

玩家在画面上方面对重叠方块（多层），只能点击最顶层可交互方块；点击的方块进入下方 7 个槽位；任意槽位中出现 3 个相同图标则消除释放空间。目标：消除全部方块或达到关卡特定目标。
腾讯手游助手

难度由堆叠深度、图标种类数、特殊方块（锁定、炸弹、替换）与初始空位决定。

关卡有“掘金（奖励）/限时挑战/困难复活”等模式；支持付费道具/看广告复活或获得提示。

受控差异化（为了原创）

视觉风格、角色设定与图标替换为原创美术（例如主题：未来牧场 / 太空绵羊 / 卡通怪兽）。

在规则上加入可选机制：次序提示、随机种子可复现（便于排查 & 活动）

关卡编辑器与可视化布局导入/导出（JSON），方便运营创建和 A/B 测试。

二、产品功能清单（按优先级）

核心 MVP（必须）

启动页、关卡列表、关卡描述、开始/暂停/失败/胜利流程。

核心玩法引擎：叠层方块渲染、点击逻辑、7 槽位管理、3 消判定。

道具：提示、移除任意方块、重排一次。

关卡进度保存（本地 + 云端），本地断点续玩。

用户账号（可选游客）与排行榜（本地/全局）。

后端：关卡数据、用户进度、排行榜、道具购买记录。

管理后台：关卡编辑、上架/下架、数据统计（DAU、付费率、通关率）。

迭代功能（v1.1+）

社交分享/挑战（邀请好友复活/赠送道具）。

每日任务/季节活动/皮肤与主题包。

A/B 测试系统（不同关卡参数按实验分流）。

多语言、无障碍（高对比度）设置。

三、技术架构（高层）

前端（客户端）

框架：React 19 + Next.js.
react.dev

渲染：Phaser 3 集成到 React（或使用 Pixi.js + 自研 UI），Canvas/WebGL 渲染保证移动性能。
LogRocket Blog

状态管理：Zustand（轻量），或 Redux Toolkit（当多人协作/复杂状态时）。

网络层：react-query（TanStack Query）或 SWR（缓存与离线支持）。

UI 组件：Ant Design Mobile / Radix + Tailwind（按团队偏好）。

后端

语言/框架：Node.js + NestJS（结构化、模块化，适合中大型后端）或 Express.js（轻量）.

数据库：PostgreSQL（主数据），Redis（缓存、排行榜、会话/限流）。

文件/静态资源：对象存储（AWS S3 / 阿里 OSS / 又拍云）。

支付/广告：接入第三方 SDK（Apple/Google IAP、广点通/AdMob）。

部署：Docker + Kubernetes（有流量预期）或 Serverless（小规模初期）。

管理后台

React + Ant Design + react-query，部署于内部子域；直接调用后端管理 API（RBAC 控制）。

四、数据模型（关键表）

用较精简的 ER 视角列出主要表结构（示例字段）

users

id (uuid), username, email, password_hash, created_at, last_login, prefs(json)

levels

id, title, difficulty, layout_json (tile 布局、图标映射、随机种子策略), created_by, status (draft/published), version, meta (通关目标、时间/步数限制)

user_progress

id, user_id, level_id, best_score, best_time, stars, attempts, last_played, state_json (若要断点续玩保存)

sessions / plays

id, user_id, level_id, play_data (事件流/日志), result (win/lose), duration, created_at

items (道具)

id, name, effect_json, price, currency_type

purchases

id, user_id, item_id, txn_id, amount, platform, created_at

leaderboard

level_id, user_id, score, rank, created_at (可以用 Redis Sorted Set 做实时排行榜)

五、主要 API 设计（REST 风格示例）

（仅列关键端点，所有返回体用 JSON）

用户

POST /api/auth/register {name,email,password} → {user, token}

POST /api/auth/login {email,password} → {user, token}

关卡 & 玩法

GET /api/levels?page&filter → [level_summary]

GET /api/levels/:id → {level_detail: layout_json,...}

POST /api/plays/start {level_id, seed?} → {play_id, initial_state}

POST /api/plays/:playId/action {action_type, payload} → {state, events} （可选，用于记录回放）

POST /api/plays/:playId/finish {result, score, events, duration} → {saved:true}

道具/商店

GET /api/items

POST /api/purchases {user_id,item_id,platform_token} → {receipt_status}

排行榜

GET /api/leaderboard/:levelId?top=50 → [{user,score,rank}]

管理后台（需鉴权/角色）

POST /api/admin/levels {level_payload} → 创建/更新

POST /api/admin/levels/:id/publish → 发布

GET /api/admin/metrics?range=7d → {DAU, avg_play_time, conversion}

六、前端实现细节（游戏核心）

核心模块

Renderer Layer（Canvas/Phaser）

负责渲染方块堆叠、动画（移入槽位、消除特效）、粒子与过渡。

Game State Layer（纯逻辑）

独立于渲染的“纯函数”实现：接收当前 state + action → 返回 next state（便于测试与回放）。

包含：可点块选择检测（只有最上层可点）、槽位队列管理、三消检测、连锁/补偿行为、失败/胜利判定。

UI Layer（React）

HUD（槽位、提示、道具、计时、步骤计数）、模态框（胜利/失败）、动画桥接（React 控制部分 UI、Canvas 控制游戏画布）。

Persistence & Networking

本地：IndexedDB（play state checkpoint）或 LocalStorage。

云端：定期上报 play 记录（便于复盘/作弊检测）。

关键实现注意点（工程级）

游戏逻辑必须可复现（相同 seed 下 deterministic），便于回放/作弊检测。

将“渲染”与“规则”完全解耦，规则函数不依赖任何 DOM/Canvas。

关卡布局使用最小序列化格式（JSON），并支持可视化编辑器导入/导出。

性能：移动端使用 requestAnimationFrame、合并帧动画，减少 React 渲染频次（利用 refs + Canvas）。

七、管理后台（运营）功能清单

关卡编辑器：可视化拖放堆叠、图标设定、难度参数、测试通关（本地模拟器）。

AB 实验管理：为关卡参数设置实验 variant，分配流量比例，查看实验结果。

用户管理：查看用户数据、封禁、发放补偿道具。

数据仪表盘：DAU/MAU、次留、通关率、付费率、ARPU、各关卡卡点统计。

内容上传：美术资源、音乐、图标、主题打包管理（版本控制）。

八、运维、部署 & 安全

CI: GitHub Actions — 测试（unit + e2e）→ 构建 → 镜像 → 到测试/staging。

部署：Frontend（Vercel/Netlify/Cloudflare Pages），Backend（Docker/K8s on AWS/GCP/阿里），数据库（RDS/Postgres），缓存（Redis）。

日志/追踪：Sentry + ELK 或 Datadog（错误/性能），埋点：Segment 或自建埋点上报。

安全：JWT + Refresh Token，接口限流（防刷），敏感操作 RBAC 控制，支付验证走平台收据验证（苹果/谷歌）。

九、测试策略

单元测试：游戏规则模块（断言 deterministic 行为）。

集成测试：前端 UI + 渲染流程（Jest + React Testing Library + puppeteer）。

e2e：Cypress/Playwright（常见设备分辨率回归）。

性能/压力测试：移动端渲染帧率（Chrome DevTools），后端压力测试（k6/locust）。

十、里程碑与任务拆分（可直接用于 Sprint)

里程碑 0 — 项目搭建（1 sprint）

初始化 monorepo（frontend / backend / admin / infra），设置 CI, 可运行的空壳页面。

选定游戏引擎（Phaser）并完成最简单的 Canvas 渲染 demo（可点击方块进入槽位，保存 state）。

里程碑 1 — 核心玩法 MVP（2–3 sprints）

完整实现：点击逻辑、槽位管理、三消逻辑、胜负流程、关卡 JSON 加载。

本地存档与简单关卡（5 个关卡）。

里程碑 2 — 后端与基础运营（2 sprints）

用户 Auth、关卡服务、排行榜、数据埋点、基础管理后台（关卡 CRUD）。

里程碑 3 — 支付/广告、道具、复活、社交（2 sprints）

集成平台支付、广告 SDK、道具商店、分享功能。

里程碑 4 — 测试/优化/上线（1–2 sprints）

全面 QA、性能优化、上架准备（若做 Web：PWA 支持；若做原生包：使用 Capacitor/Electron/React Native wrapper）。

十一、运营与变现建议

freemium + 道具付费（提示、移除一个方块、额外槽位临时扩展）。

广告：看广告获得一次重试或道具（非强制）。

活动：周常挑战、限定主题关卡、赛季皮肤。

监控付费漏斗（关卡卡点→付费转化），优先在强卡点放入“提示付费槽”。

十二、反作弊 & 可复现性

游戏回放与事件流上报（play events），服务端验证关键动作（购买、分数上报）。

排行榜写入需多重校验：score 与 play events 一同发送，服务器端回放验证（或基于 seed 的再现验证）。

十三、交付物（交付清单）

完整需求文档（当前文档 + 可导出 Markdown/Figma）

前端仓库：React + Phaser 项目脚手架（包含最小 playable demo）

后端仓库：NestJS/Express + Postgres 的基本 API（auth, levels, plays）

管理后台：React (Antd) 可编辑关卡页面

测试用例：单元与 e2e 示例

部署脚本：Dockerfile + Kubernetes manifests 或 Serverless config

运营埋点 & 监控配置

十四、工程注意事项（实践建议）

将“关卡参数”做为可运行时配置（DB 存 JSON），便于快速下发/回滚。

关卡编辑器早期即可上线给运营，减少前端通过代码改关卡的频繁发布。

保留“回放日志”至少 30 天，用于分析卡点与处理用户申诉。

美术资源请使用原创或受许可的素材，避免侵权。
