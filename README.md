# 羊了个羊游戏复刻

> 基于 React + Next.js + Phaser 3 的完整商业化游戏项目

## 项目结构

```
sheep-game/
├── packages/
│   ├── frontend/      # 游戏客户端 (Next.js + Phaser 3)
│   ├── backend/       # 后端服务 (NestJS + TypeORM)
│   ├── admin/         # 管理后台 (React + Ant Design)
│   └── shared/        # 共享类型与工具
├── package.json       # Monorepo 根配置
└── README.md
```

## 技术栈

- **前端**: React 18, Next.js 14, Phaser 3, TypeScript, Tailwind CSS
- **后端**: NestJS, PostgreSQL, Redis, TypeORM
- **管理后台**: React, Ant Design, Vite

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动所有服务
npm run dev

# 单独启动
cd packages/frontend && npm run dev    # 前端 (localhost:4000)
cd packages/backend && npm run start:dev # 后端 (localhost:4001)
cd packages/admin && npm run dev       # 管理后台 (localhost:4002)
```

### API 文档 (Swagger)

后端服务启动后，访问以下地址查看完整 API 文档：

- **Swagger UI**: [http://localhost:4001/api](http://localhost:4001/api)
- **OpenAPI JSON**: [http://localhost:4001/api-json](http://localhost:4001/api-json)

### 构建

```bash
npm run build
```

## 开发进度

- [x] 项目初始化
- [x] 核心游戏玩法 MVP
- [x] 后端服务 (Auth, Levels, Users, Leaderboard)
- [x] 道具与变现 (Ads, Items)
- [x] 管理后台 (User Management, Level Editor)
- [x] API 文档 (Swagger)
- [ ] 优化与上线

## License

MIT
