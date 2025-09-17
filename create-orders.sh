#!/bin/bash

RAILWAY_URL="https://web-production-7a257.up.railway.app/api"

echo "🔄 创建销售和采购订单"
echo "===================="

# 获取token
TOKEN=$(curl -s -X POST "$RAILWAY_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "✅ 登录成功"

# 创建销售订单
echo "📊 创建销售订单..."

# 销售订单1
ORDER1='{
  "customer_id": 1,
  "warehouse_id": 1,
  "items": [
    {
      "item_id": 1,
      "quantity": 2,
      "unit_price": 2899.00,
      "discount": 0
    }
  ],
  "tax_rate": 0.15,
  "discount": 0,
  "notes": "格力空调销售订单"
}'

echo "创建销售订单1..."
RESPONSE1=$(curl -s -X POST "$RAILWAY_URL/sales" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$ORDER1")
echo "响应: $RESPONSE1"

# 销售订单2
ORDER2='{
  "customer_id": 2,
  "warehouse_id": 1,
  "items": [
    {
      "item_id": 2,
      "quantity": 1,
      "unit_price": 3599.00,
      "discount": 100
    },
    {
      "item_id": 4,
      "quantity": 1,
      "unit_price": 3199.00,
      "discount": 0
    }
  ],
  "tax_rate": 0.15,
  "discount": 200,
  "notes": "海信电视+美的冰箱套装"
}'

echo "创建销售订单2..."
RESPONSE2=$(curl -s -X POST "$RAILWAY_URL/sales" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$ORDER2")
echo "响应: $RESPONSE2"

# 销售订单3
ORDER3='{
  "customer_id": 1,
  "warehouse_id": 2,
  "items": [
    {
      "item_id": 3,
      "quantity": 1,
      "unit_price": 2399.00,
      "discount": 50
    }
  ],
  "tax_rate": 0.15,
  "discount": 0,
  "notes": "小天鹅洗衣机"
}'

echo "创建销售订单3..."
RESPONSE3=$(curl -s -X POST "$RAILWAY_URL/sales" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$ORDER3")
echo "响应: $RESPONSE3"

sleep 2

# 创建采购订单
echo ""
echo "📊 创建采购订单..."

# 采购订单1
PURCHASE1='{
  "supplier_id": 1,
  "warehouse_id": 1,
  "items": [
    {
      "item_id": 1,
      "quantity": 20,
      "unit_price": 2200.00
    }
  ],
  "tax_rate": 0.15,
  "notes": "格力空调批量采购"
}'

echo "创建采购订单1..."
PRESPONSE1=$(curl -s -X POST "$RAILWAY_URL/purchases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PURCHASE1")
echo "响应: $PRESPONSE1"

# 采购订单2
PURCHASE2='{
  "supplier_id": 2,
  "warehouse_id": 1,
  "items": [
    {
      "item_id": 2,
      "quantity": 15,
      "unit_price": 2800.00
    },
    {
      "item_id": 4,
      "quantity": 10,
      "unit_price": 2400.00
    }
  ],
  "tax_rate": 0.15,
  "notes": "海信电视+美的冰箱采购"
}'

echo "创建采购订单2..."
PRESPONSE2=$(curl -s -X POST "$RAILWAY_URL/purchases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PURCHASE2")
echo "响应: $PRESPONSE2"

sleep 2

echo ""
echo "📊 最终数据统计："
curl -s -X GET "$RAILWAY_URL/data-import/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "🎉 订单创建完成！"
echo "现在请刷新页面查看："
echo "- 销售管理：应该有3个销售订单"
echo "- 采购管理：应该有2个采购订单"
echo "- 包含完整的订单明细和金额计算"
