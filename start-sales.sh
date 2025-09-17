#!/bin/bash

echo "🚀 启动仓储管理系统（销售功能测试）"

# 检查后端是否在运行
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ 后端服务已在运行 (端口3001)"
else
    echo "🔄 启动后端服务..."
    cd backend
    node dist/index.js &
    BACKEND_PID=$!
    echo "✅ 后端服务已启动 PID: $BACKEND_PID"
    cd ..
fi

# 检查前端是否在运行
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ 前端服务已在运行 (端口5173)"
else
    echo "🔄 启动前端服务..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    echo "✅ 前端服务已启动 PID: $FRONTEND_PID"
    cd ..
fi

echo ""
echo "🎉 系统启动完成！"
echo ""
echo "📱 前端地址: http://localhost:5173"
echo "🔧 后端地址: http://localhost:3001"
echo "👤 登录账户: admin / 123456"
echo ""
echo "✨ 新功能: 销售管理"
echo "   - 销售订单管理"
echo "   - 订单详情查看"
echo "   - 出库操作"
echo "   - 毛利率计算"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait 