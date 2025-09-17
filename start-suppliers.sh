#!/bin/bash

echo "🚀 启动仓储管理系统（供应商管理功能展示）"

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
echo "✨ 供应商管理功能特色："
echo "   🏪 供应商档案完整CRUD管理"
echo "   🏷️ 供应商类型分类（生产商/分销商/零售商/服务商）"
echo "   📞 联系信息管理（联系人、电话、邮箱、地址）"
echo "   🏦 银行账户和税号管理"
echo "   💳 付款条件配置"
echo "   🔄 供应商状态管理（合作中/停用/待审核/暂停）"
echo "   🔍 多条件搜索与筛选功能"
echo ""
echo "🎯 使用指南："
echo "   1. 点击左侧导航'供应商管理'"
echo "   2. 点击'新增供应商'创建供应商档案"
echo "   3. 使用搜索功能快速查找供应商"
echo "   4. 编辑供应商信息更新档案"
echo "   5. 查看供应商状态和分类统计"
echo ""
echo "🔗 与其他模块联动："
echo "   - 采购订单可关联供应商信息"
echo "   - 货品管理可设置默认供应商"
echo "   - 成本计算基于供应商价格"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait 