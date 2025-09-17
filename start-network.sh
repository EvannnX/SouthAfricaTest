#!/bin/bash

echo "🌐 启动 BlueLink 网络共享模式"
echo "================================"

# 获取本机IP地址
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

if [ -z "$LOCAL_IP" ]; then
    echo "❌ 无法获取本机IP地址"
    exit 1
fi

echo "📡 本机IP地址: $LOCAL_IP"

# 设置环境变量
export PATH="/usr/local/bin:$PATH"

# 启动后端服务
echo "🔧 启动后端服务..."
cd backend
npm run build
node dist/index.js &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 启动前端服务（允许外部访问）
cd ../frontend
echo "🎨 启动前端服务（网络模式）..."
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

# 等待前端启动
sleep 5

echo ""
echo "🎉 BlueLink 系统网络共享启动成功！"
echo ""
echo "📱 访问地址:"
echo "   本机访问:   http://localhost:5173"
echo "   局域网访问: http://$LOCAL_IP:5173"
echo "   手机访问:   http://$LOCAL_IP:5173"
echo ""
echo "👤 默认登录账户:"
echo "   用户名: admin"
echo "   密码: 123456"
echo ""
echo "📱 移动设备访问方式:"
echo "   1. 确保手机/平板与电脑在同一WiFi网络"
echo "   2. 在手机浏览器输入: http://$LOCAL_IP:5173"
echo "   3. 可添加到主屏幕作为App使用"
echo ""
echo "🔧 POS终端访问:"
echo "   在POS设备浏览器访问: http://$LOCAL_IP:5173"
echo "   系统会自动适配POS界面"
echo ""
echo "⚠️  网络安全提醒:"
echo "   - 此模式仅适用于可信任的局域网环境"
echo "   - 公网部署请使用 ./deploy-production.sh"
echo ""
echo "按 Ctrl+C 停止服务器"

# 等待用户中断
trap "echo '正在停止服务器...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait
