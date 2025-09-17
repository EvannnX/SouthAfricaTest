#!/bin/bash

echo "🔍 API调试 - 详细错误信息"
echo "================================"

# 获取token
echo "1. 获取认证token..."
TOKEN_RESPONSE=$(curl -s http://localhost:3001/api/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"123456"}')
echo "Token响应: $TOKEN_RESPONSE"

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "提取的Token: ${TOKEN:0:50}..."

if [ -z "$TOKEN" ]; then
    echo "❌ 无法获取token，停止测试"
    exit 1
fi

echo ""
echo "2. 测试各个API端点..."

# 测试仪表板API
echo -n "仪表板API: "
DASHBOARD_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/reports/dashboard)
echo "$DASHBOARD_RESPONSE"

echo ""

# 测试货品API
echo -n "货品API: "
ITEMS_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/items)
echo "$ITEMS_RESPONSE"

echo ""

# 测试客户API
echo -n "客户API: "
CUSTOMERS_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/customers)
echo "$CUSTOMERS_RESPONSE"

echo ""

# 测试供应商API
echo -n "供应商API: "
SUPPLIERS_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/suppliers)
echo "$SUPPLIERS_RESPONSE"

echo ""

# 测试库存API
echo -n "库存API: "
INVENTORY_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/inventory)
echo "$INVENTORY_RESPONSE"

echo ""

# 测试销售API
echo -n "销售API: "
SALES_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/sales)
echo "$SALES_RESPONSE"

echo ""

# 通过前端代理测试
echo "3. 通过前端代理测试..."
echo -n "前端代理登录: "
PROXY_LOGIN=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:5173/api/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"123456"}')
echo "$PROXY_LOGIN"

# 从代理响应中提取token
PROXY_TOKEN=$(echo $PROXY_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "代理Token: ${PROXY_TOKEN:0:50}..."

if [ -n "$PROXY_TOKEN" ]; then
    echo ""
    echo -n "前端代理仪表板: "
    PROXY_DASHBOARD=$(curl -s -w "\nHTTP_CODE:%{http_code}" -H "Authorization: Bearer $PROXY_TOKEN" http://localhost:5173/api/reports/dashboard)
    echo "$PROXY_DASHBOARD"
fi

echo ""
echo "================================" 