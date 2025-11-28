# 羊了个羊游戏复刻

> 基于 React + Next.js + Phaser 3 的完整商业化游戏项目

## 项目结构

```
sheep-game/
├── packages/
│   ├── frontend/      # 游戏客户端 (Next.js + Phaser 3)
│   ├── backend/       # 后端服务 (NestJS)
│   ├── admin/         # 管理后台 (React + Ant Design)
│   └── shared/        # 共享类型与工具
├── package.json       # Monorepo 根配置
└── README.md
```

## 技术栈

- **前端**: React 18, Next.js 14, Phaser 3, TypeScript, Tailwind CSS
- **后端**: NestJS, PostgreSQL, Redis, Prisma
- **管理后台**: React, Ant Design

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
cd packages/frontend && npm run dev    # 前端 (localhost:3000)
cd packages/backend && npm run dev     # 后端 (localhost:4000)
cd packages/admin && npm run dev       # 管理后台 (localhost:3001)
```

### 构建

```bash
npm run build
```

## 开发进度

- [x] 项目初始化
- [ ] 核心游戏玩法 MVP
- [ ] 后端服务
- [ ] 道具与变现
- [ ] 管理后台
- [ ] 优化与上线

## 文档

详细技术文档请查看 [implementation_plan.md](.gemini/antigravity/brain/80fbd827-3180-425c-9792-1731c1cf9605/implementation_plan.md)

## License

MIT
