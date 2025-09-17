#!/bin/bash

echo "🚀 启动仓储管理系统 Demo"
echo "=========================="

# 检查 Node.js 版本
node_version=$(node -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js (版本 >= 16.x)"
    echo "   下载地址: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $node_version"

# 安装根目录依赖
echo "📦 安装项目依赖..."
npm install

# 安装后端依赖
echo "📦 安装后端依赖..."
cd backend
npm install

# 初始化数据库
echo "🗄️  初始化数据库..."
npm run db:init

# 返回根目录
cd ..

# 安装前端依赖
echo "📦 安装前端依赖..."
cd frontend
npm install

# 返回根目录
cd ..

echo ""
echo "🎉 安装完成！"
echo ""
echo "启动命令："
echo "  npm run dev      # 同时启动前后端开发服务器"
echo "  npm run backend:dev  # 仅启动后端服务器"
echo "  npm run frontend:dev # 仅启动前端服务器"
echo ""
echo "访问地址："
echo "  前端: http://localhost:5173"
echo "  后端: http://localhost:3001"
echo ""
echo "默认登录账户："
echo "  用户名: admin"
echo "  密码: 123456"
echo ""
echo "现在可以运行 'npm run dev' 来启动系统！" 