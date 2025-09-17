#!/bin/bash

echo "🚀 启动仓储管理系统演示"
echo "========================"

# 进入后端目录并启动后端服务
echo "📡 启动后端服务..."
cd backend
npm run build
echo "后端编译完成，启动服务器..."
node dist/index.js &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ 后端服务启动成功: http://localhost:3001"
else
    echo "❌ 后端服务启动失败"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 进入前端目录并启动前端服务
cd ../frontend
echo "🎨 启动前端服务..."
npm run dev &
FRONTEND_PID=$!

# 等待前端启动
sleep 5

echo ""
echo "🎉 系统启动完成！"
echo ""
echo "📱 访问地址:"
echo "   前端应用: http://localhost:5173"
echo "   后端API:  http://localhost:3001"
echo ""
echo "👤 默认登录账户:"
echo "   用户名: admin"
echo "   密码: 123456"
echo ""
echo "按 Ctrl+C 停止服务器"

# 等待用户中断
trap "echo '正在停止服务器...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait 