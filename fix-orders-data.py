#!/usr/bin/env python3
import re
import json
import requests
import time

# Railway API配置
RAILWAY_URL = "https://web-production-7a257.up.railway.app/api"

def login():
    """登录获取token"""
    response = requests.post(f"{RAILWAY_URL}/auth/login", 
                           json={"username": "admin", "password": "123456"})
    if response.status_code == 200:
        return response.json().get("token")
    else:
        print(f"登录失败: {response.text}")
        return None

def import_data(token, table_name, sql_data):
    """导入数据到Railway"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    data = {
        "tableName": table_name,
        "data": sql_data
    }
    
    response = requests.post(f"{RAILWAY_URL}/data-import/import", 
                           headers=headers, json=data)
    return response

def process_sales_orders(token):
    """处理销售订单数据"""
    print("📊 处理销售订单数据...")
    
    # 从本地数据提取销售订单
    with open("data-export/sales_orders.sql", 'r') as f:
        content = f.read()
    
    # 提取INSERT语句
    insert_pattern = r"INSERT INTO sales_orders VALUES\((.*?)\);"
    matches = re.findall(insert_pattern, content)
    
    success_count = 0
    
    for i, match in enumerate(matches[:50]):  # 处理前50个订单
        try:
            # 解析数据 - 根据您的本地数据格式
            parts = [p.strip().strip("'") for p in match.split(',')]
            
            if len(parts) >= 14:
                order_id = parts[0]
                order_no = parts[1]
                customer_id = parts[2] 
                warehouse_id = parts[3]
                order_date = parts[4]
                total_amount = parts[6]
                subtotal = parts[7]
                tax_amount = parts[8]
                discount = parts[9]
                status = parts[10]
                
                # 转换为新格式的SQL
                sql = f"""INSERT INTO sales_orders (id, order_no, customer_id, warehouse_id, order_date, 
                         total_amount, subtotal, tax_amount, discount_amount, status, created_by, created_at, updated_at) 
                         VALUES ({order_id}, '{order_no}', {customer_id}, {warehouse_id}, '{order_date}', 
                         {total_amount}, {subtotal}, {tax_amount}, {discount}, '{status}', 1, 
                         datetime('now'), datetime('now'));"""
                
                response = import_data(token, "sales_orders", sql)
                if response.status_code == 200:
                    success_count += 1
                    print(f"✅ 销售订单 {order_no} 导入成功")
                else:
                    print(f"❌ 销售订单 {order_no} 导入失败: {response.text}")
                
                time.sleep(0.1)
                
        except Exception as e:
            print(f"⚠️ 处理销售订单 {i+1} 时出错: {e}")
    
    print(f"📈 销售订单: {success_count}/{min(len(matches), 50)} 记录导入成功")

def process_purchase_orders(token):
    """处理采购订单数据"""
    print("📊 处理采购订单数据...")
    
    with open("data-export/purchase_orders.sql", 'r') as f:
        content = f.read()
    
    insert_pattern = r"INSERT INTO purchase_orders VALUES\((.*?)\);"
    matches = re.findall(insert_pattern, content)
    
    success_count = 0
    
    for i, match in enumerate(matches[:30]):  # 处理前30个订单
        try:
            parts = [p.strip().strip("'") for p in match.split(',')]
            
            if len(parts) >= 12:
                order_id = parts[0]
                order_no = parts[1]
                supplier_id = parts[2]
                warehouse_id = parts[3]
                order_date = parts[4]
                total_amount = parts[6]
                subtotal = parts[7] if len(parts) > 7 else total_amount
                tax_amount = parts[8] if len(parts) > 8 else "0"
                status = parts[9] if len(parts) > 9 else "pending"
                
                sql = f"""INSERT INTO purchase_orders (id, order_no, supplier_id, warehouse_id, order_date,
                         total_amount, subtotal, tax_amount, status, created_by, created_at, updated_at)
                         VALUES ({order_id}, '{order_no}', {supplier_id}, {warehouse_id}, '{order_date}',
                         {total_amount}, {subtotal}, {tax_amount}, '{status}', 1,
                         datetime('now'), datetime('now'));"""
                
                response = import_data(token, "purchase_orders", sql)
                if response.status_code == 200:
                    success_count += 1
                    print(f"✅ 采购订单 {order_no} 导入成功")
                else:
                    print(f"❌ 采购订单 {order_no} 导入失败: {response.text}")
                
                time.sleep(0.1)
                
        except Exception as e:
            print(f"⚠️ 处理采购订单 {i+1} 时出错: {e}")
    
    print(f"📈 采购订单: {success_count}/{min(len(matches), 30)} 记录导入成功")

def main():
    print("🔧 修复订单数据导入")
    print("=" * 30)
    
    # 登录
    token = login()
    if not token:
        print("❌ 登录失败，退出")
        return
    
    print("✅ 登录成功")
    
    # 处理订单数据
    process_sales_orders(token)
    time.sleep(2)
    process_purchase_orders(token)
    
    # 获取最终统计
    print("\n📊 最终数据统计:")
    response = requests.get(f"{RAILWAY_URL}/data-import/stats", 
                          headers={"Authorization": f"Bearer {token}"})
    if response.status_code == 200:
        stats = response.json()
        for table, count in stats.items():
            print(f"  {table}: {count} 条记录")
    
    print("\n🎉 订单数据修复完成！")
    print("现在请刷新页面查看您的销售订单和采购订单数据！")

if __name__ == "__main__":
    main()
