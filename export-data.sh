#!/bin/bash

echo "🗄️ 导出本地数据库数据"
echo "====================="

DB_FILE="backend/database/wms.db"
OUTPUT_DIR="data-export"

# 创建导出目录
mkdir -p $OUTPUT_DIR

echo "📊 正在导出数据..."

# 导出所有表的数据（除了用户表，保持默认admin用户）
sqlite3 $DB_FILE ".dump items" > $OUTPUT_DIR/items.sql
sqlite3 $DB_FILE ".dump suppliers" > $OUTPUT_DIR/suppliers.sql
sqlite3 $DB_FILE ".dump customers" > $OUTPUT_DIR/customers.sql
sqlite3 $DB_FILE ".dump warehouses" > $OUTPUT_DIR/warehouses.sql
sqlite3 $DB_FILE ".dump sales_orders" > $OUTPUT_DIR/sales_orders.sql
sqlite3 $DB_FILE ".dump sales_order_items" > $OUTPUT_DIR/sales_order_items.sql
sqlite3 $DB_FILE ".dump purchase_orders" > $OUTPUT_DIR/purchase_orders.sql
sqlite3 $DB_FILE ".dump purchase_order_items" > $OUTPUT_DIR/purchase_order_items.sql
sqlite3 $DB_FILE ".dump inventory" > $OUTPUT_DIR/inventory.sql
sqlite3 $DB_FILE ".dump inventory_transactions" > $OUTPUT_DIR/inventory_transactions.sql

echo "📈 数据导出统计:"
echo "- 商品: $(sqlite3 $DB_FILE "SELECT COUNT(*) FROM items;")"
echo "- 供应商: $(sqlite3 $DB_FILE "SELECT COUNT(*) FROM suppliers;")"
echo "- 客户: $(sqlite3 $DB_FILE "SELECT COUNT(*) FROM customers;")"
echo "- 仓库: $(sqlite3 $DB_FILE "SELECT COUNT(*) FROM warehouses;")"
echo "- 销售订单: $(sqlite3 $DB_FILE "SELECT COUNT(*) FROM sales_orders;")"
echo "- 采购订单: $(sqlite3 $DB_FILE "SELECT COUNT(*) FROM purchase_orders;")"
echo "- 库存记录: $(sqlite3 $DB_FILE "SELECT COUNT(*) FROM inventory;")"

echo ""
echo "✅ 数据导出完成！文件保存在 $OUTPUT_DIR/ 目录中"
echo "💡 接下来可以将这些数据导入到Railway数据库中"
