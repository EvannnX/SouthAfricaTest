#!/bin/bash

echo "🔍 仓储管理系统状态检查"
echo "================================"

# 检查后端状态
echo -n "后端服务 (端口3001): "
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ 运行中"
    
    # 测试后端API
    echo -n "后端API测试: "
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"123456"}')
    if [ "$response" = "200" ]; then
        echo "✅ 正常"
    else
        echo "❌ 异常 (HTTP $response)"
    fi
else
    echo "❌ 未运行"
fi

# 检查前端状态
echo -n "前端服务 (端口5173): "
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ 运行中"
    
    # 测试前端页面
    echo -n "前端页面测试: "
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
    if [ "$response" = "200" ]; then
        echo "✅ 正常"
    else
        echo "❌ 异常 (HTTP $response)"
    fi
else
    echo "❌ 未运行"
fi

# 检查核心API
echo ""
echo "🧪 核心API功能测试:"

# 获取token
TOKEN=$(curl -s http://localhost:3001/api/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"123456"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -n "货品管理API: "
    response=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/items)
    if [ "$response" = "200" ]; then
        echo "✅ 正常"
    else
        echo "❌ 异常 (HTTP $response)"
    fi
    
    echo -n "客户管理API: "
    response=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/customers)
    if [ "$response" = "200" ]; then
        echo "✅ 正常"
    else
        echo "❌ 异常 (HTTP $response)"
    fi
    
    echo -n "供应商管理API: "
    response=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/suppliers)
    if [ "$response" = "200" ]; then
        echo "✅ 正常"
    else
        echo "❌ 异常 (HTTP $response)"
    fi
    
    echo -n "库存管理API: "
    response=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/inventory)
    if [ "$response" = "200" ]; then
        echo "✅ 正常"
    else
        echo "❌ 异常 (HTTP $response)"
    fi
    
    echo -n "销售管理API: "
    response=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/sales)
    if [ "$response" = "200" ]; then
        echo "✅ 正常"
    else
        echo "❌ 异常 (HTTP $response)"
    fi
else
    echo "❌ 无法获取认证token"
fi

echo ""
echo "🎯 访问地址:"
echo "前端: http://localhost:5173"
echo "后端: http://localhost:3001"
echo "默认账户: admin / 123456"
echo ""
echo "================================" 