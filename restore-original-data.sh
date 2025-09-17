#!/bin/bash

RAILWAY_URL="https://web-production-7a257.up.railway.app/api"
DATA_DIR="data-export"

echo "🔄 恢复原始数据到Railway"
echo "========================"

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

# 2. 获取当前数据统计
echo "📊 当前数据统计："
curl -s -X GET "$RAILWAY_URL/data-import/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 3. 清空现有数据（可选）
read -p "是否要清空现有数据？(y/N): " clear_data
if [[ $clear_data =~ ^[Yy]$ ]]; then
  echo "🗑️ 清空现有数据..."
  curl -s -X POST "$RAILWAY_URL/data-import/clear-all" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json"
  echo ""
fi

# 4. 分批导入数据函数
import_table_safe() {
  local table_name=$1
  local sql_file="$DATA_DIR/${table_name}.sql"
  
  if [ ! -f "$sql_file" ]; then
    echo "⚠️  ${table_name}.sql 文件不存在，跳过"
    return
  fi
  
  echo "📊 正在导入 ${table_name}..."
  
  # 分块处理大文件
  local temp_file="/tmp/${table_name}_chunk.sql"
  local chunk_size=50  # 每次处理50行
  local line_count=$(wc -l < "$sql_file")
  local chunks=$((($line_count + $chunk_size - 1) / $chunk_size))
  
  echo "文件共 $line_count 行，分为 $chunks 个块处理"
  
  for ((i=1; i<=chunks; i++)); do
    echo "处理块 $i/$chunks..."
    
    # 提取当前块
    local start_line=$(((i-1) * chunk_size + 1))
    local end_line=$((i * chunk_size))
    
    sed -n "${start_line},${end_line}p" "$sql_file" > "$temp_file"
    
    # 转义并发送
    local sql_content=$(cat "$temp_file" | sed 's/"/\\"/g' | tr '\n' ' ')
    
    local response=$(curl -s -X POST "$RAILWAY_URL/data-import/import" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"tableName\":\"${table_name}\",\"data\":\"${sql_content}\"}")
    
    if echo "$response" | grep -q "成功"; then
      echo "✅ 块 $i 导入成功"
    else
      echo "⚠️ 块 $i 导入可能有问题: $response"
    fi
    
    # 短暂延迟避免服务器压力
    sleep 1
  done
  
  rm -f "$temp_file"
  echo "✅ ${table_name} 导入完成"
}

# 5. 按依赖顺序导入原始数据
echo "🔄 开始导入原始数据..."

# 基础数据
import_table_safe "warehouses"
import_table_safe "suppliers" 
import_table_safe "customers"
import_table_safe "items"
import_table_safe "inventory"

# 订单数据
import_table_safe "purchase_orders"
import_table_safe "purchase_order_items"
import_table_safe "sales_orders"
import_table_safe "sales_order_items"

# 事务数据
import_table_safe "inventory_transactions"

echo ""
echo "📊 导入完成后的数据统计："
curl -s -X GET "$RAILWAY_URL/data-import/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "🎉 原始数据恢复完成！"
echo "现在您应该能在系统中看到："
echo "- 1020个销售订单"
echo "- 914个采购订单"
echo "- 34个商品"
echo "- 所有客户和供应商数据"
