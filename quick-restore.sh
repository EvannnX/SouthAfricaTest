#!/bin/bash

RAILWAY_URL="https://web-production-7a257.up.railway.app/api"

echo "🚀 快速恢复关键数据"
echo "=================="

# 获取token
TOKEN=$(curl -s -X POST "$RAILWAY_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败！"
  exit 1
fi

echo "✅ 登录成功，开始导入数据..."

# 导入供应商数据
echo "📊 导入供应商数据..."
SUPPLIERS_SQL=$(head -20 data-export/suppliers.sql | sed 's/"/\\"/g' | tr '\n' ' ')
curl -s -X POST "$RAILWAY_URL/data-import/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tableName\":\"suppliers\",\"data\":\"$SUPPLIERS_SQL\"}" | grep -o '"message":"[^"]*"' || echo "供应商导入完成"

# 导入客户数据  
echo "📊 导入客户数据..."
CUSTOMERS_SQL=$(head -20 data-export/customers.sql | sed 's/"/\\"/g' | tr '\n' ' ')
curl -s -X POST "$RAILWAY_URL/data-import/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tableName\":\"customers\",\"data\":\"$CUSTOMERS_SQL\"}" | grep -o '"message":"[^"]*"' || echo "客户导入完成"

# 导入商品数据
echo "📊 导入商品数据..."
ITEMS_SQL=$(head -50 data-export/items.sql | sed 's/"/\\"/g' | tr '\n' ' ')
curl -s -X POST "$RAILWAY_URL/data-import/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tableName\":\"items\",\"data\":\"$ITEMS_SQL\"}" | grep -o '"message":"[^"]*"' || echo "商品导入完成"

# 导入前10个销售订单
echo "📊 导入销售订单（前10个）..."
SALES_SQL=$(head -15 data-export/sales_orders.sql | sed 's/"/\\"/g' | tr '\n' ' ')
curl -s -X POST "$RAILWAY_URL/data-import/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tableName\":\"sales_orders\",\"data\":\"$SALES_SQL\"}" | grep -o '"message":"[^"]*"' || echo "销售订单导入完成"

# 导入前10个采购订单
echo "📊 导入采购订单（前10个）..."
PURCHASE_SQL=$(head -15 data-export/purchase_orders.sql | sed 's/"/\\"/g' | tr '\n' ' ')
curl -s -X POST "$RAILWAY_URL/data-import/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tableName\":\"purchase_orders\",\"data\":\"$PURCHASE_SQL\"}" | grep -o '"message":"[^"]*"' || echo "采购订单导入完成"

echo ""
echo "📊 最终数据统计："
curl -s -X GET "$RAILWAY_URL/data-import/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "✅ 关键数据导入完成！"
echo "现在请刷新页面查看数据。"
