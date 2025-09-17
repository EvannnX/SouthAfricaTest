#!/bin/bash

echo "🔧 修复前端数据获取问题"
echo "================================"

echo "1. 停止前端服务..."
pkill -f "vite" 2>/dev/null || true

echo "2. 清理前端缓存..."
cd frontend
rm -rf node_modules/.vite 2>/dev/null || true
rm -rf dist 2>/dev/null || true

echo "3. 重新启动前端服务..."
npm run dev &
FRONTEND_PID=$!

echo "4. 等待前端启动..."
sleep 10

echo "5. 检查前端状态..."
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ 前端服务重新启动成功"
else
    echo "❌ 前端服务启动失败"
    exit 1
fi

echo ""
echo "🎯 修复建议："
echo "1. 清除浏览器缓存（Ctrl+F5 或 Cmd+Shift+R）"
echo "2. 使用无痕模式访问 http://localhost:5173"
echo "3. 打开浏览器开发者工具查看网络请求和控制台错误"
echo "4. 重新登录：admin / 123456"
echo ""
echo "📋 如果问题仍然存在，请："
echo "- 检查浏览器控制台是否有JavaScript错误"
echo "- 检查网络标签页中API请求的状态"
echo "- 确认localStorage中是否有有效的token"
echo ""
echo "================================"

# 保持前端运行
trap 'echo ""; echo "🛑 停止前端服务..."; kill $FRONTEND_PID 2>/dev/null; exit' INT
echo "前端服务运行中... 按 Ctrl+C 停止"
wait 