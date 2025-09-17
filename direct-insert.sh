#!/bin/bash

RAILWAY_URL="https://web-production-7a257.up.railway.app/api"

echo "🔄 直接插入订单数据"
echo "=================="

# 获取token
TOKEN=$(curl -s -X POST "$RAILWAY_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "✅ 登录成功，token: ${TOKEN:0:20}..."

# 使用现有的销售API创建订单
echo "📊 通过API创建销售订单..."

for i in {1..5}; do
  ORDER_DATA='{
    "customer_id": '$(($i % 3 + 1))',
    "items": [
      {
        "item_id": 1,
        "quantity": '$i',
        "unit_price": 3500.00,
        "discount": 0
      }
    ],
    "tax_rate": 0.15,
    "discount": 0,
    "notes": "通过API导入的订单 '$i'"
  }'
  
  echo "创建订单 $i..."
  RESPONSE=$(curl -s -X POST "$RAILWAY_URL/sales" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$ORDER_DATA")
  
  echo "响应: $RESPONSE"
  sleep 1
done

echo ""
echo "📊 通过API创建采购订单..."

for i in {1..3}; do
  PURCHASE_DATA='{
    "supplier_id": '$(($i % 2 + 1))',
    "items": [
      {
        "item_id": '$i',
        "quantity": '$((i * 10))',
        "unit_price": '$((2000 + i * 500))'.00
      }
    ],
    "tax_rate": 0.15,
    "notes": "通过API导入的采购订单 '$i'"
  }'
  
  echo "创建采购订单 $i..."
  RESPONSE=$(curl -s -X POST "$RAILWAY_URL/purchases" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$PURCHASE_DATA")
  
  echo "响应: $RESPONSE"
  sleep 1
done

echo ""
echo "📊 最终数据统计："
curl -s -X GET "$RAILWAY_URL/data-import/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "✅ 通过API创建订单完成！"
echo "请刷新页面查看销售管理和采购管理中的数据！"
