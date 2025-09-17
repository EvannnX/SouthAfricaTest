#!/bin/bash

RAILWAY_URL="https://web-production-7a257.up.railway.app/api"

echo "🔧 强制插入订单数据"
echo "=================="

# 获取token
TOKEN=$(curl -s -X POST "$RAILWAY_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败！"
  exit 1
fi

echo "✅ 登录成功"

# 直接通过数据导入API插入订单数据
echo "📊 插入销售订单..."

SALES_SQL="INSERT INTO sales_orders (order_number, customer_id, total_amount, tax_amount, discount_amount, status, order_date, created_by) VALUES 
('SO-2025-001', 1, 2899.00, 434.85, 0, 'completed', '2025-09-15', 1),
('SO-2025-002', 2, 5798.00, 869.70, 100, 'completed', '2025-09-16', 1),
('SO-2025-003', 1, 3599.00, 539.85, 0, 'pending', '2025-09-17', 1),
('SO-2025-004', 2, 2399.00, 359.85, 50, 'completed', '2025-09-14', 1),
('SO-2025-005', 1, 3199.00, 479.85, 0, 'completed', '2025-09-13', 1);"

curl -s -X POST "$RAILWAY_URL/data-import/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tableName\":\"sales_orders\",\"data\":\"$SALES_SQL\"}"

echo ""
echo "📊 插入采购订单..."

PURCHASE_SQL="INSERT INTO purchase_orders (order_number, supplier_id, total_amount, tax_amount, status, order_date, created_by) VALUES 
('PO-2025-001', 1, 44000.00, 6600.00, 'completed', '2025-09-10', 1),
('PO-2025-002', 2, 66000.00, 9900.00, 'completed', '2025-09-11', 1),
('PO-2025-003', 1, 36000.00, 5400.00, 'pending', '2025-09-12', 1);"

curl -s -X POST "$RAILWAY_URL/data-import/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tableName\":\"purchase_orders\",\"data\":\"$PURCHASE_SQL\"}"

echo ""
echo "📊 插入销售订单明细..."

SALES_ITEMS_SQL="INSERT INTO sales_order_items (order_id, item_id, quantity, unit_price, discount, amount) VALUES 
(1, 1, 1, 2899.00, 0, 2899.00),
(2, 1, 2, 2899.00, 50, 5748.00),
(3, 2, 1, 3599.00, 0, 3599.00),
(4, 3, 1, 2399.00, 50, 2349.00),
(5, 4, 1, 3199.00, 0, 3199.00);"

curl -s -X POST "$RAILWAY_URL/data-import/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tableName\":\"sales_order_items\",\"data\":\"$SALES_ITEMS_SQL\"}"

echo ""
echo "📊 插入采购订单明细..."

PURCHASE_ITEMS_SQL="INSERT INTO purchase_order_items (order_id, item_id, quantity, unit_price, amount) VALUES 
(1, 1, 20, 2200.00, 44000.00),
(2, 2, 15, 2800.00, 42000.00),
(2, 4, 10, 2400.00, 24000.00),
(3, 3, 20, 1800.00, 36000.00);"

curl -s -X POST "$RAILWAY_URL/data-import/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tableName\":\"purchase_order_items\",\"data\":\"$PURCHASE_ITEMS_SQL\"}"

echo ""
echo "📊 最终数据统计："
curl -s -X GET "$RAILWAY_URL/data-import/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "🎉 订单数据强制插入完成！"
echo "现在请刷新页面查看："
echo "- 销售管理：应该有5个销售订单"
echo "- 采购管理：应该有3个采购订单"
