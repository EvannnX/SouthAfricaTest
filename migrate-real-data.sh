#!/bin/bash

RAILWAY_URL="https://web-production-7a257.up.railway.app/api"
DATA_DIR="data-export"

echo "🚀 迁移真实本地数据到Railway"
echo "=========================="

# 获取token
echo "🔐 正在登录..."
TOKEN=$(curl -s -X POST "$RAILWAY_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败！"
  exit 1
fi

echo "✅ 登录成功"

# 首先清空现有数据
echo "🗑️ 清空现有数据..."
curl -s -X POST "$RAILWAY_URL/data-import/clear-all" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo ""
echo "📊 开始导入本地数据..."

# 转换并导入本地数据的函数
convert_and_import() {
  local table_name=$1
  local sql_file="$DATA_DIR/${table_name}.sql"
  
  if [ ! -f "$sql_file" ]; then
    echo "⚠️  ${table_name}.sql 文件不存在，跳过"
    return
  fi
  
  echo "📊 转换并导入 ${table_name}..."
  
  # 提取INSERT语句，去掉表结构
  local insert_lines=$(grep "^INSERT INTO" "$sql_file" | head -20)
  
  if [ -z "$insert_lines" ]; then
    echo "⚠️  ${table_name} 没有找到INSERT语句"
    return
  fi
  
  # 逐行处理INSERT语句
  echo "$insert_lines" | while IFS= read -r line; do
    if [ ! -z "$line" ]; then
      # 转义引号
      local escaped_line=$(echo "$line" | sed 's/"/\\"/g')
      
      # 发送到API
      local response=$(curl -s -X POST "$RAILWAY_URL/data-import/import" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"tableName\":\"${table_name}\",\"data\":\"${escaped_line}\"}")
      
      if echo "$response" | grep -q "成功"; then
        echo "✅ 一条${table_name}记录导入成功"
      else
        echo "⚠️ ${table_name}记录导入失败: $response"
      fi
      
      sleep 0.5  # 避免API限制
    fi
  done
}

# 按依赖顺序导入数据
echo "📦 导入仓库数据..."
convert_and_import "warehouses"

echo "🏭 导入供应商数据..."
convert_and_import "suppliers"

echo "👥 导入客户数据..."
convert_and_import "customers"

echo "📱 导入商品数据..."
convert_and_import "items"

echo "📦 导入库存数据..."
convert_and_import "inventory"

echo "🛒 导入采购订单..."
convert_and_import "purchase_orders"

echo "📝 导入采购订单明细..."
convert_and_import "purchase_order_items"

echo "💰 导入销售订单..."
convert_and_import "sales_orders"

echo "📋 导入销售订单明细..."
convert_and_import "sales_order_items"

echo "📊 导入库存事务..."
convert_and_import "inventory_transactions"

echo ""
echo "📊 最终数据统计："
curl -s -X GET "$RAILWAY_URL/data-import/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "🎉 本地数据迁移完成！"
echo "现在您应该能在系统中看到："
echo "- 真实的销售订单数据"
echo "- 真实的采购订单数据"
echo "- 完整的商品和客户信息"
echo ""
echo "请刷新页面查看数据！"
