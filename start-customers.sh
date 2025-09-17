#!/bin/bash

echo "🚀 启动仓储管理系统（客户管理功能展示）"

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
echo "✨ 客户管理功能特色："
echo "   📋 客户档案完整CRUD管理"
echo "   🏷️ 客户类型分类（零售/批发/企业）"
echo "   📞 联系信息管理（联系人、电话、邮箱、地址）"
echo "   💳 信用额度设置与付款条件配置"
echo "   🔄 客户状态管理（活跃/停用/待审核）"
echo "   🔍 多条件搜索与筛选功能"
echo "   📊 客户统计信息展示"
echo ""
echo "🎯 使用指南："
echo "   1. 点击左侧导航'客户管理'"
echo "   2. 点击'新增客户'创建客户档案"
echo "   3. 使用搜索功能快速查找客户"
echo "   4. 编辑客户信息更新档案"
echo "   5. 查看客户状态和分类统计"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait 