#!/bin/bash

RAILWAY_URL="https://web-production-7a257.up.railway.app/api"

echo "🔄 转换并导入数据"
echo "================"

# 获取token
TOKEN=$(curl -s -X POST "$RAILWAY_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败！"
  exit 1
fi

echo "✅ 登录成功"

# 创建销售订单示例数据
echo "📊 创建销售订单数据..."
SALES_DATA="INSERT INTO sales_orders (order_number, customer_id, total_amount, tax_amount, discount_amount, status, order_date, created_by) VALUES 
('SO-2025-001', 1, 3500.00, 525.00, 0, 'completed', '2025-09-15', 1),
('SO-2025-002', 2, 7000.00, 1050.00, 200, 'completed', '2025-09-16', 1),
('SO-2025-003', 3, 1800.00, 270.00, 0, 'pending', '2025-09-17', 1),
('SO-2025-004', 1, 2500.00, 375.00, 100, 'completed', '2025-09-14', 1),
('SO-2025-005', 2, 4200.00, 630.00, 0, 'completed', '2025-09-13', 1),
('SO-2025-006', 3, 1200.00, 180.00, 50, 'pending', '2025-09-12', 1),
('SO-2025-007', 1, 5600.00, 840.00, 300, 'completed', '2025-09-11', 1),
('SO-2025-008', 2, 3300.00, 495.00, 0, 'completed', '2025-09-10', 1),
('SO-2025-009', 3, 2800.00, 420.00, 150, 'pending', '2025-09-09', 1),
('SO-2025-010', 1, 6500.00, 975.00, 500, 'completed', '2025-09-08', 1);"

curl -s -X POST "$RAILWAY_URL/data-import/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tableName\":\"sales_orders\",\"data\":\"$SALES_DATA\"}"

echo "销售订单创建完成"

# 创建采购订单示例数据
echo "📊 创建采购订单数据..."
PURCHASE_DATA="INSERT INTO purchase_orders (order_number, supplier_id, total_amount, tax_amount, status, order_date, created_by) VALUES 
('PO-2025-001', 1, 25000.00, 3750.00, 'completed', '2025-09-01', 1),
('PO-2025-002', 2, 18000.00, 2700.00, 'completed', '2025-09-02', 1),
('PO-2025-003', 3, 12000.00, 1800.00, 'pending', '2025-09-03', 1),
('PO-2025-004', 1, 30000.00, 4500.00, 'completed', '2025-09-04', 1),
('PO-2025-005', 2, 22000.00, 3300.00, 'completed', '2025-09-05', 1),
('PO-2025-006', 3, 15000.00, 2250.00, 'pending', '2025-09-06', 1),
('PO-2025-007', 1, 28000.00, 4200.00, 'completed', '2025-09-07', 1),
('PO-2025-008', 2, 20000.00, 3000.00, 'pending', '2025-09-08', 1);"

curl -s -X POST "$RAILWAY_URL/data-import/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tableName\":\"purchase_orders\",\"data\":\"$PURCHASE_DATA\"}"

echo "采购订单创建完成"

# 创建销售订单明细
echo "📊 创建销售订单明细..."
SALES_ITEMS_DATA="INSERT INTO sales_order_items (order_id, item_id, quantity, unit_price, discount, amount) VALUES 
(1, 1, 1, 3500.00, 0, 3500.00),
(2, 1, 2, 3500.00, 100, 6900.00),
(3, 2, 1, 1800.00, 0, 1800.00),
(4, 3, 1, 2500.00, 0, 2500.00),
(5, 1, 1, 3500.00, 0, 3500.00),
(5, 4, 1, 700.00, 0, 700.00),
(6, 5, 2, 600.00, 50, 1150.00),
(7, 1, 1, 3500.00, 0, 3500.00),
(7, 2, 1, 2500.00, 300, 2200.00),
(8, 3, 1, 2500.00, 0, 2500.00),
(8, 6, 1, 800.00, 0, 800.00),
(9, 4, 4, 700.00, 150, 2650.00),
(10, 1, 1, 3500.00, 0, 3500.00),
(10, 2, 1, 2500.00, 0, 2500.00),
(10, 7, 1, 500.00, 0, 500.00);"

curl -s -X POST "$RAILWAY_URL/data-import/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tableName\":\"sales_order_items\",\"data\":\"$SALES_ITEMS_DATA\"}"

echo "销售订单明细创建完成"

# 创建采购订单明细
echo "📊 创建采购订单明细..."
PURCHASE_ITEMS_DATA="INSERT INTO purchase_order_items (order_id, item_id, quantity, unit_price, amount) VALUES 
(1, 1, 10, 2500.00, 25000.00),
(2, 2, 10, 1800.00, 18000.00),
(3, 3, 8, 1500.00, 12000.00),
(4, 1, 12, 2500.00, 30000.00),
(5, 4, 10, 2200.00, 22000.00),
(6, 5, 25, 600.00, 15000.00),
(7, 1, 8, 3500.00, 28000.00),
(8, 6, 25, 800.00, 20000.00);"

curl -s -X POST "$RAILWAY_URL/data-import/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tableName\":\"purchase_order_items\",\"data\":\"$PURCHASE_ITEMS_DATA\"}"

echo "采购订单明细创建完成"

echo ""
echo "📊 最终数据统计："
curl -s -X GET "$RAILWAY_URL/data-import/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "🎉 数据导入完成！"
echo "现在您应该能看到："
echo "- 10个销售订单"
echo "- 8个采购订单"
echo "- 完整的订单明细"
echo ""
echo "请刷新页面查看采购管理和销售管理中的数据！"
