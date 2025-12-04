# 羊了个羊游戏复刻项目任务清单

## 阶段 0：项目规划与架构设计

- [x] 创建技术实现计划
- [x] 设计项目目录结构
- [x] 确定技术栈细节

## 阶段 1：项目初始化（Milestone 0）

- [x] 初始化 Monorepo 结构
  - [x] 配置前端项目（React + Next.js + Phaser 3）
  - [x] 配置后端项目（NestJS + PostgreSQL + Redis）
  - [x] 配置管理后台项目（React + Ant Design）
- [x] 设置开发环境
  - [x] 配置 TypeScript
  - [x] 配置 ESLint 和 Prettier
  - [ ] 配置 Git hooks
- [ ] 搭建基础 CI/CD
- [x] Phaser 3 最小 Demo（方块渲染与点击）
  - [x] 创建 PhaserGame 组件
  - [x] 实现 GameScene 核心逻辑
  - [x] 集成叠层方块系统
  - [x] 实现槽位与三消机制
  - [x] 在浏览器中测试运行

## 阶段 1.5：核心逻辑优化（紧急修复）

- [x] 修复方块遮挡检测
  - [x] 实现正确的堆叠遮挡算法
  - [x] 只允许点击最顶层可见方块
  - [x] 添加方块阴影效果提示遮挡关系
- [x] 优化视觉风格
  - [x] 改为羊了个羊卡通风格
  - [x] 使用 Emoji 图标（动物表情）
  - [x] 添加圆角、阴影、光泽效果
  - [x] 优化配色方案

## 阶段 1.6：农场主题视觉重设计

- [x] 生成农场主题图标素材
  - [x] 创建 8-10 种农场物品图标
  - [x] 统一图标风格和尺寸
- [x] 重新设计游戏界面
  - [x] 浅绿色背景
  - [x] 米白色方块 + 深绿粗边框
  - [x] 木质纹理槽位区
  - [x] 左右装饰条
  - [x] 多层阴影效果

## 阶段 1.7：Bug 修复与优化

- [x] 修复重新开始游戏时的崩溃问题
  - [x] 在 create() 中正确重置游戏状态 (tiles, slots, score)
- [x] 视觉修复
  - [x] 修复金币粒子过大问题 (调整缩放至 0.1)
  - [x] 后端代码重构与类型安全优化 (移除 any, 修复 lint 错误)
  - [x] 修复道具按钮被遮挡问题 (调整 slotY)
  - [x] 修复弹窗按钮点击无响应问题 (改为 pointerup 事件)
  - [x] 修复登录 500 错误 (缺少 LocalStrategy)
  - [x] 修复游戏失败未记录日志问题 (GameScene)
  - [ ] 优化渲染性能 (暂回滚，待后续优化)

## 阶段 1.8：关卡扩展与体验优化 (Level 20 Expansion)

- [x] 关卡内容扩展
  - [x] 扩展至 20 关 (新增 Nightmare & Abyss 难度)
  - [x] 实现高级生成算法 (Grid Spiral, Boss, Cross 布局)
  - [x] 难度曲线调优 (1-20 关阶梯式难度)
- [x] 关卡选择界面重构
  - [x] 实现 3 列网格布局
  - [x] 优化滚动体验 (惯性滚动 + 弹性阻尼)
  - [x] 适配长方形关卡按钮 (180x100)
- [x] 关键问题修复
  - [x] 修复黑色方块问题 (Null Type Bug)
  - [x] 修复关卡晋级限制 (允许通关至 Level 20)
  - [x] 修复关卡选择界面布局错位与语法错误
  - [x] 关卡元素扩展 (Level Expansion)
    - [x] 新增 7 种农场主题方块 (共 14 种)
    - [x] 关卡生成器支持全 14 种方块
    - [x] 前端与后台编辑器适配新方块

## 阶段 2：核心游戏玩法 MVP（Milestone 1）

- [x] 游戏核心逻辑
  - [x] 叠层方块渲染系统
  - [x] 点击检测（仅最顶层可点击）- [x] 核心玩法实现
  - [x] 7槽位管理系统
  - [x] 三消判定与消除逻辑
  - [x] 胜负条件判定
  - [x] 修复：暂停按钮无响应问题
  - [x] 修复：通关后无下一关按钮
  - [x] 修复：重进关卡无法点击 (重置 isPaused 状态)
  - [x] 修复：游戏失败无重新开始按钮
  - [x] 修复：弹窗按钮溢出与文字遮挡问题
  - [x] 优化：重绘暂停图标 (移除 emoji)
  - [x] 优化：方块错缝堆叠显示
  - [x] 修复：金币粒子层级问题 (显示在槽位上方)
  - [x] 优化：排行榜分数计算 (仅累计每关首次/最佳成绩)
- [x] 关卡系统
  - [x] 关卡 JSON 格式设计
  - [x] 开发者工具
  - [x] 添加 "一键解锁所有关卡" 按钮 (LevelSelectScene)
  - [x] 关卡加载与解析
  - [x] 创建 10 个难度递增的关卡 (LevelSeederService)
- [x] 体验优化
  - [x] 关卡布局强制居中 (修复左右间距不一致问题)
  - [x] 优化方块入场动画 (从上方下落 + 淡入)
  - [x] 代码质量优化 (Lint 修复 & 全中文注释)
- [x] 游戏 UI
  - [x] 启动页面
  - [x] 关卡列表页
  - [x] 游戏主界面（HUD）
  - [x] 胜利/失败弹窗
  - [x] 暂停/继续功能
- [/] 本地存档
  - [x] LocalStorage/IndexedDB 集成 (基础进度保存)
  - [x] 关卡进度保存
  - [ ] 断点续玩

## 阶段 3：后端服务与数据（Milestone 2）

- [x] 数据库设计
  - [x] 设计表结构（users, levels, user_progress）
  - [x] PostgreSQL 初始化 (Docker Compose)
  - [x] Redis 缓存策略 (Docker Ready)
- [x] 用户系统
  - [x] 注册/登录 API
  - [x] JWT 认证
    - [x] 实现自动续签 (Sliding Expiration)
    - [x] 7天免登录机制
  - [x] 游客模式支持
  - [x] 账户绑定功能
    - [x] 后端 API (/auth/bind, /auth/login)
    - [x] 前端设置界面 (SettingsModal)
- [x] 关卡服务
  - [x] 关卡 CRUD API
  - [x] 关卡列表与详情
  - [ ] 关卡发布/下架 (后续迭代)
- [x] 游戏进度
  - [x] 开始游戏 API (无需特定API，前端直接加载)
  - [x] 保存游戏进度
  - [x] 游戏结束记录
- [/] 排行榜
  - [x] 全局排行榜
  - [x] 关卡排行榜
  - [x] Redis Sorted Set 实现

## 阶段 4：道具与变现（Milestone 3）

- [x] 道具系统
  - [x] 移出道具（Remove）：移出槽位前3个方块到暂存区
  - [x] 撤回道具（Undo）：撤回上一步操作
  - [x] 洗牌道具（Shuffle）：随机打乱场上剩余方块
  - [x] 每日使用限制 (2次/日) & 自动重置
- [x] UI 视觉升级（仿羊了个羊）
  - [x] 顶部栏：设置、日期/关卡信息
  - [x] 底部栏：木质栅栏槽位 + 道具按钮（移出、撤回、洗牌）
  - [x] 整体配色：清新草绿背景
- [ ] 商店系统
  - [ ] 道具商店 UI
  - [ ] 购买流程
  - [ ] 道具库存管理
- [ ] 广告系统
  - [ ] 模拟广告播放
  - [ ] 看广告复活
  - [ ] 看广告获得道具
- [ ] 复活机制
  - [ ] 付费复活
  - [ ] 广告复活

- [x] 管理后台（Milestone 2）
- [x] 后台基础框架
  - [x] React + Ant Design 搭建
  - [x] 国际化支持 (中/英) - 全局 ConfigProvider 配置
  - [ ] RBAC 权限管理
  - [x] 管理员登录
    - [x] JWT 认证与 AdminGuard
    - [x] 记住密码功能
    - [x] 退出登录二次确认
  - [x] 管理员登录
    - [x] JWT 认证与 AdminGuard
    - [x] 记住密码功能
    - [x] 退出登录二次确认
- [x] 用户管理
  - [x] 用户列表 (ID, 用户名, 注册时间)
  - [x] 用户详情 (最高分, 当前关卡)
  - [x] 用户筛选 (ID/用户名/类型)
  - [x] 用户删除
    - [x] 手动级联删除 (修复500错误)
    - [x] 删除二次确认
  - [x] 游客清理功能
  - [x] 用户筛选 (ID/用户名/类型)
  - [x] 用户删除
    - [x] 手动级联删除 (修复500错误)
    - [x] 删除二次确认
  - [x] 游客清理功能
- [x] 关卡编辑器
  - [x] 可视化关卡布局编辑 (所见即所得)
  - [x] 方块堆叠拖放
  - [x] 关卡参数设置
  - [x] 大画布支持与辅助线
  - [x] 手机预览框 (iPhone SE 375x667)
  - [x] 双层网格系统 (40px + 80px)
  - [x] 图层方块数量统计
  - [x] 暗色主题画布
  - [x] 发布/下架功能
  - [ ] 导入/导出 JSON
  - [ ] 实时预览面板 (Phaser 集成)
- [x] 数据统计
  - [x] 用户行为日志 (User Logs)
    - [x] 行为类型本地化 (Action Localization)
    - [x] 实时自动刷新 (Switch + Interval)
    - [x] 行为类型本地化 (Action Localization)
    - [x] 实时自动刷新 (Switch + Interval)
  - [x] 游玩时长统计 (Playtime Tracking)
  - [ ] DAU/MAU 统计
  - [ ] 通关率分析
  - [ ] 付费率与 ARPU
  - [ ] 关卡卡点热力图

## 阶段 5：后端性能与代码质量优化（Milestone 3.5）

- [x] 查询效率优化
  - [x] GameProgressService: 使用 DISTINCT 优化关卡解锁查询
  - [x] UsersService: 使用 Redis Pipeline 优化用户列表查询 (N+1 问题)
- [x] 代码质量与规范
  - [x] 全面引入 NestJS Logger
  - [x] 修复所有 ESLint 类型错误 (Unsafe return/member access)
- [x] 缓存策略
  - [x] 用户信息 Redis 缓存 (TTL 5min)
  - [x] 用户信息 Redis 缓存 (TTL 5min)

## 阶段 5.5：管理后台视觉打磨（Milestone 3.6）

- [x] 登录界面优化
  - [x] 农场主题 Banner 背景
  - [x] Glassmorphism (毛玻璃) 卡片效果
  - [x] 品牌标识优化 (Sheep Admin)
  - [x] 侧边栏优化
  - [x] 头部 Logo 与标题
  - [x] 网站图标
  - [x] 配置 Favicon

## 阶段 5.6：关卡编辑器优化与代码规范统一（Milestone 3.7）

- [x] 关卡发布系统（后端）
  - [x] Level Entity 添加 status 字段 (draft/published)
  - [x] LevelsService 实现发布状态过滤
  - [x] API 端点：PATCH /levels/:id/toggle-publish
  - [x] API 端点：GET /levels?includeAll=true (管理后台专用)
- [x] 关卡编辑器 UI 重构
  - [x] 手机预览框 (iPhone SE 375x667)
  - [x] 双层网格系统 (40px 主网格 + 80px 辅助网格)
  - [x] 暗色主题画布 (#1a1a1a)
  - [x] 图层方块数量统计
  - [x] 发布/下架按钮集成
  - [x] 左侧面板状态 Tag 显示
- [x] 关卡列表优化
  - [x] 添加状态列 (已发布/草稿)
  - [x] 发布/下架操作按钮
  - [x] 管理后台查看所有关卡 (includeAll=true)
- [x] 管理后台功能增强 (2024-12-04)
  - [x] 关卡默认发布状态
    - [x] 修改 LevelsService.create() 支持 status 参数
    - [x] Seeder 生成关卡默认为 published 状态
  - [x] 批量操作与删除功能
    - [x] 新增批量发布/下架/删除 API
    - [x] LevelList 支持多选和批量操作工具栏
    - [x] 添加删除确认弹窗（二次确认）
  - [x] 面包屑导航
    - [x] 创建 Breadcrumb 组件支持动态路由
    - [x] 集成到 MainLayout
    - [x] 修复被侧边栏遮挡问题
  - [x] Phaser 实时预览编辑器
    - [x] 创建 PhaserPreview 组件
    - [x] 创建 PreviewScene.ts (简化版 GameScene)
    - [x] 左右分栏布局 (40% 控制 / 60% 预览)
    - [x] EventBus 实时同步 tiles 数据
    - [x] 修复数据同步时序问题（使用 ref 避免闭包陷阱）
    - [x] 修复面包屑被侧边栏遮挡
    - [ ] 完善点击测试三消逻辑（待优化）
- [x] 代码规范统一
  - [x] 配置业界标准 Prettier 规则
  - [x] 统一后端、前端、管理后台代码风格
  - [x] 修复 ESLint 与 Prettier 冲突
  - [x] 批量格式化所有代码文件


## 阶段 6：社交功能（Milestone 3）

- [ ] 分享功能
  - [ ] 分享关卡成绩
  - [ ] 邀请好友
- [ ] 好友系统
  - [ ] 好友列表
  - [ ] 赠送道具
  - [ ] 好友复活

## 阶段 7：优化与上线（Milestone 4）

- [ ] 性能优化
  - [ ] Canvas 渲染优化
  - [x] 移动端适配
    - [x] 开启 High-DPI (Retina) 高清渲染
    - [x] 优化抗锯齿与像素对齐
  - [ ] 加载速度优化
- [ ] 测试
  - [ ] 单元测试（游戏逻辑）
  - [ ] 集成测试
  - [ ] E2E 测试
  - [ ] 性能测试
- [ ] 安全性
  - [ ] 反作弊系统
  - [ ] 游戏回放验证
  - [ ] 接口限流
- [/] 部署
  - [x] Docker 镜像 (Frontend, Backend, Admin)
  - [x] Docker Compose 编排
  - [ ] Kubernetes 配置
  - [ ] 监控与日志
  - [ ] 错误追踪（Sentry）

## 阶段 8：运营功能（v1.1+）

- [ ] 每日任务系统
- [ ] 季节活动
- [ ] 皮肤与主题包
- [ ] A/B 测试系统
- [ ] 多语言支持
