#!/bin/bash

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 加载 NVM 并使用 Node.js 20
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm use 20

echo "🚀 启动开发环境..."
echo ""

# 启动 Backend
echo "📦 启动 Backend (端口 4001)..."
(cd "$SCRIPT_DIR/packages/backend" && npm run dev) &
BACKEND_PID=$!

# 等待一下让 Backend 启动
sleep 3

# 启动 Frontend
echo "🎮 启动 Frontend (端口 4000)..."
(cd "$SCRIPT_DIR/packages/frontend" && npm run dev) &
FRONTEND_PID=$!

# 启动 Admin
echo "⚙️  启动 Admin (端口 4002)..."
(cd "$SCRIPT_DIR/packages/admin" && npm run dev) &
ADMIN_PID=$!

echo ""
echo "✅ 所有服务已启动!"
echo ""
echo "📍 服务地址:"
echo "   - Frontend: http://localhost:4000"
echo "   - Backend:  http://localhost:4001"
echo "   - Admin:    http://localhost:4002"
echo ""
echo "按 Ctrl+C 停止所有服务..."

# 捕获中断信号并清理子进程
trap "kill $BACKEND_PID $FRONTEND_PID $ADMIN_PID 2>/dev/null; exit" INT TERM

# 等待所有后台进程
wait
