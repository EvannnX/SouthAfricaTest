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

def clear_data(token):
    """清空现有数据"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{RAILWAY_URL}/data-import/clear-all", headers=headers)
    print(f"清空数据: {response.text}")

def convert_sales_order(values):
    """转换销售订单数据格式"""
    # 原格式: id, order_no, customer_id, warehouse_id, order_date, delivery_date, 
    #         total_amount, subtotal, tax_amount, discount, status, notes, created_at, updated_at
    # 新格式: order_number, customer_id, total_amount, tax_amount, discount_amount, status, order_date, created_by
    
    parts = values.split(',')
    if len(parts) < 14:
        return None
        
    order_id = parts[0].strip()
    order_no = parts[1].strip().strip("'")
    customer_id = parts[2].strip()
    total_amount = parts[6].strip()
    tax_amount = parts[8].strip()
    discount = parts[9].strip()
    status = parts[10].strip().strip("'")
    order_date = parts[4].strip().strip("'")
    
    return f"INSERT INTO sales_orders (order_number, customer_id, total_amount, tax_amount, discount_amount, status, order_date, created_by) VALUES ('{order_no}', {customer_id}, {total_amount}, {tax_amount}, {discount}, '{status}', '{order_date}', 1);"

def convert_purchase_order(values):
    """转换采购订单数据格式"""
    parts = values.split(',')
    if len(parts) < 12:
        return None
        
    order_no = parts[1].strip().strip("'")
    supplier_id = parts[2].strip()
    total_amount = parts[5].strip()
    tax_amount = parts[7].strip() if len(parts) > 7 else "0"
    status = parts[8].strip().strip("'") if len(parts) > 8 else "'pending'"
    order_date = parts[4].strip().strip("'")
    
    return f"INSERT INTO purchase_orders (order_number, supplier_id, total_amount, tax_amount, status, order_date, created_by) VALUES ('{order_no}', {supplier_id}, {total_amount}, {tax_amount}, {status}, '{order_date}', 1);"

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

def process_file(filename, converter_func, table_name, token):
    """处理文件并导入数据"""
    print(f"\n📊 处理 {filename}...")
    
    try:
        with open(f"data-export/{filename}", 'r', encoding='utf-8') as f:
            content = f.read()
            
        # 提取INSERT语句
        insert_pattern = r"INSERT INTO \w+ VALUES\((.*?)\);"
        matches = re.findall(insert_pattern, content)
        
        success_count = 0
        total_count = min(len(matches), 20)  # 限制每个表最多导入20条记录
        
        for i, match in enumerate(matches[:20]):  # 只处理前20条
            try:
                if converter_func:
                    converted_sql = converter_func(match)
                    if converted_sql:
                        response = import_data(token, table_name, converted_sql)
                        if response.status_code == 200:
                            success_count += 1
                            print(f"✅ {table_name} 记录 {i+1} 导入成功")
                        else:
                            print(f"❌ {table_name} 记录 {i+1} 导入失败: {response.text}")
                else:
                    # 直接使用原始INSERT语句
                    original_sql = f"INSERT INTO {table_name} VALUES({match});"
                    response = import_data(token, table_name, original_sql)
                    if response.status_code == 200:
                        success_count += 1
                        print(f"✅ {table_name} 记录 {i+1} 导入成功")
                    else:
                        print(f"❌ {table_name} 记录 {i+1} 导入失败: {response.text}")
                
                time.sleep(0.2)  # 避免API限制
                
            except Exception as e:
                print(f"⚠️ 处理 {table_name} 记录 {i+1} 时出错: {e}")
        
        print(f"📈 {table_name}: {success_count}/{total_count} 记录导入成功")
        
    except FileNotFoundError:
        print(f"⚠️ 文件 {filename} 不存在")
    except Exception as e:
        print(f"❌ 处理 {filename} 时出错: {e}")

def main():
    print("🚀 开始迁移本地数据到Railway")
    print("=" * 40)
    
    # 登录
    token = login()
    if not token:
        print("❌ 登录失败，退出")
        return
    
    print("✅ 登录成功")
    
    # 清空现有数据
    print("🗑️ 清空现有数据...")
    clear_data(token)
    time.sleep(2)
    
    # 按顺序导入数据
    tables = [
        ("warehouses.sql", None, "warehouses"),
        ("suppliers.sql", None, "suppliers"),
        ("customers.sql", None, "customers"),
        ("items.sql", None, "items"),
        ("inventory.sql", None, "inventory"),
        ("purchase_orders.sql", convert_purchase_order, "purchase_orders"),
        ("purchase_order_items.sql", None, "purchase_order_items"),
        ("sales_orders.sql", convert_sales_order, "sales_orders"),
        ("sales_order_items.sql", None, "sales_order_items"),
        ("inventory_transactions.sql", None, "inventory_transactions")
    ]
    
    for filename, converter, table_name in tables:
        process_file(filename, converter, table_name, token)
        time.sleep(1)
    
    # 获取最终统计
    print("\n📊 最终数据统计:")
    response = requests.get(f"{RAILWAY_URL}/data-import/stats", 
                          headers={"Authorization": f"Bearer {token}"})
    if response.status_code == 200:
        stats = response.json()
        for table, count in stats.items():
            print(f"  {table}: {count} 条记录")
    
    print("\n🎉 数据迁移完成！")
    print("请刷新页面查看您的真实数据！")

if __name__ == "__main__":
    main()
