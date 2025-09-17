#!/bin/bash

RAILWAY_URL="https://web-production-7a257.up.railway.app/api"
DATA_DIR="data-export"

echo "🚀 开始数据迁移到Railway..."
echo ""

# 1. 登录获取token
echo "🔐 正在登录..."
LOGIN_RESPONSE=$(curl -s -X POST "$RAILWAY_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败！"
  echo "响应: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ 登录成功"
echo ""

# 2. 获取导入前统计
echo "📊 获取导入前的数据统计..."
curl -s -X GET "$RAILWAY_URL/data-import/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 3. 导入数据函数
import_table() {
  local table_name=$1
  local sql_file="$DATA_DIR/${table_name}.sql"
  
  if [ ! -f "$sql_file" ]; then
    echo "⚠️  ${table_name}.sql 文件不存在，跳过"
    return
  fi
  
  echo "📊 正在导入 ${table_name}..."
  
  # 读取SQL文件内容并转义
  local sql_content=$(cat "$sql_file" | sed 's/"/\\"/g' | tr '\n' ' ')
  
  # 发送导入请求
  local response=$(curl -s -X POST "$RAILWAY_URL/data-import/import" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"tableName\":\"${table_name}\",\"data\":\"${sql_content}\"}")
  
  if echo "$response" | grep -q "成功"; then
    echo "✅ ${table_name} 导入成功"
  else
    echo "❌ ${table_name} 导入失败: $response"
  fi
}

# 4. 按依赖顺序导入
echo "🔄 开始导入数据..."
import_table "warehouses"
import_table "suppliers"
import_table "customers"
import_table "items"
import_table "inventory"
import_table "purchase_orders"
import_table "purchase_order_items"
import_table "sales_orders"
import_table "sales_order_items"
import_table "inventory_transactions"

echo ""
echo "📊 获取导入后的数据统计..."
curl -s -X GET "$RAILWAY_URL/data-import/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "🎉 数据迁移完成！"
echo "现在您可以在Railway部署的系统中看到所有本地数据了。"
