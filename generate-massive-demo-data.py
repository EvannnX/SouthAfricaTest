#!/usr/bin/env python3
import requests
import time
import random
from datetime import datetime, timedelta

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

def generate_sales_orders(token, count=100):
    """生成大量销售订单数据"""
    print(f"💰 生成 {count} 个销售订单...")
    
    # 基础数据
    customer_ids = [1, 2, 3, 4, 5, 6]
    warehouse_ids = [1, 2]
    item_ids = list(range(1, 21))  # 1-20
    statuses = ['completed', 'completed', 'completed', 'pending', 'cancelled']
    
    base_date = datetime.now() - timedelta(days=180)  # 从6个月前开始
    success_count = 0
    
    # 批量生成订单
    batch_size = 10
    for batch_start in range(0, count, batch_size):
        batch_end = min(batch_start + batch_size, count)
        
        # 构建批量插入SQL
        values_list = []
        for i in range(batch_start, batch_end):
            order_date = (base_date + timedelta(days=random.randint(0, 180))).strftime('%Y-%m-%d')
            order_no = f"SO-{order_date.replace('-', '')}-{10000 + i}"
            customer_id = random.choice(customer_ids)
            warehouse_id = random.choice(warehouse_ids)
            
            # 随机生成订单金额
            total_amount = random.randint(1000, 50000)
            tax_amount = round(total_amount * 0.15, 2)
            discount_amount = random.randint(0, 1000) if i % 7 == 0 else 0
            status = random.choice(statuses)
            
            # 添加到values列表
            values_list.append(f"('{order_no}', {customer_id}, {warehouse_id}, '{order_date}', {total_amount}, {tax_amount}, {discount_amount}, '{status}', 1, datetime('now'), datetime('now'))")
        
        # 构建批量插入SQL
        sql = f"""INSERT INTO sales_orders (order_no, customer_id, warehouse_id, order_date, total_amount, tax_amount, discount_amount, status, created_by, created_at, updated_at) 
                  VALUES {', '.join(values_list)};"""
        
        # 执行批量插入
        response = import_data(token, "sales_orders", sql)
        if response.status_code == 200:
            success_count += len(values_list)
            print(f"✅ 批量插入销售订单 {batch_start+1}-{batch_end} 成功")
        else:
            print(f"❌ 批量插入销售订单 {batch_start+1}-{batch_end} 失败: {response.text}")
        
        time.sleep(0.5)  # 避免API限制
    
    print(f"📈 销售订单: {success_count}/{count} 创建成功")
    return success_count

def generate_purchase_orders(token, count=100):
    """生成大量采购订单数据"""
    print(f"🛒 生成 {count} 个采购订单...")
    
    # 基础数据
    supplier_ids = [1, 2, 3, 4]
    warehouse_ids = [1, 2]
    statuses = ['completed', 'completed', 'pending', 'cancelled']
    
    base_date = datetime.now() - timedelta(days=200)  # 从200天前开始
    success_count = 0
    
    # 批量生成订单
    batch_size = 10
    for batch_start in range(0, count, batch_size):
        batch_end = min(batch_start + batch_size, count)
        
        # 构建批量插入SQL
        values_list = []
        for i in range(batch_start, batch_end):
            order_date = (base_date + timedelta(days=random.randint(0, 200))).strftime('%Y-%m-%d')
            order_no = f"PO-{order_date.replace('-', '')}-{20000 + i}"
            supplier_id = random.choice(supplier_ids)
            warehouse_id = random.choice(warehouse_ids)
            
            # 随机生成采购金额
            total_amount = random.randint(10000, 200000)
            tax_amount = round(total_amount * 0.15, 2)
            status = random.choice(statuses)
            
            # 添加到values列表
            values_list.append(f"('{order_no}', {supplier_id}, {warehouse_id}, '{order_date}', {total_amount}, {tax_amount}, '{status}', 1, datetime('now'), datetime('now'))")
        
        # 构建批量插入SQL
        sql = f"""INSERT INTO purchase_orders (order_no, supplier_id, warehouse_id, order_date, total_amount, tax_amount, status, created_by, created_at, updated_at) 
                  VALUES {', '.join(values_list)};"""
        
        # 执行批量插入
        response = import_data(token, "purchase_orders", sql)
        if response.status_code == 200:
            success_count += len(values_list)
            print(f"✅ 批量插入采购订单 {batch_start+1}-{batch_end} 成功")
        else:
            print(f"❌ 批量插入采购订单 {batch_start+1}-{batch_end} 失败: {response.text}")
        
        time.sleep(0.5)  # 避免API限制
    
    print(f"📈 采购订单: {success_count}/{count} 创建成功")
    return success_count

def generate_order_items(token, sales_count, purchase_count):
    """生成订单明细数据"""
    print("📋 生成订单明细数据...")
    
    item_ids = list(range(1, 21))  # 1-20
    sales_success = 0
    purchase_success = 0
    
    # 生成销售订单明细
    print("生成销售订单明细...")
    batch_size = 20
    for batch_start in range(1, sales_count + 1, batch_size):
        batch_end = min(batch_start + batch_size, sales_count + 1)
        
        values_list = []
        for order_id in range(batch_start, batch_end):
            # 每个订单随机1-3个商品
            items_count = random.randint(1, 3)
            for _ in range(items_count):
                item_id = random.choice(item_ids)
                quantity = random.randint(1, 10)
                unit_price = random.randint(1000, 5000)
                discount = random.randint(0, 200) if random.random() < 0.3 else 0
                amount = (unit_price * quantity) - discount
                
                values_list.append(f"({order_id}, {item_id}, {quantity}, {unit_price}, {discount}, {amount})")
        
        if values_list:
            sql = f"""INSERT INTO sales_order_items (order_id, item_id, quantity, unit_price, discount, amount) 
                      VALUES {', '.join(values_list)};"""
            
            response = import_data(token, "sales_order_items", sql)
            if response.status_code == 200:
                sales_success += len(values_list)
                print(f"✅ 销售订单明细批次 {batch_start}-{batch_end-1} 成功")
            
            time.sleep(0.3)
    
    # 生成采购订单明细
    print("生成采购订单明细...")
    for batch_start in range(1, purchase_count + 1, batch_size):
        batch_end = min(batch_start + batch_size, purchase_count + 1)
        
        values_list = []
        for order_id in range(batch_start, batch_end):
            # 每个采购订单随机1-2个商品
            items_count = random.randint(1, 2)
            for _ in range(items_count):
                item_id = random.choice(item_ids)
                quantity = random.randint(10, 100)
                unit_price = random.randint(800, 3000)
                amount = unit_price * quantity
                
                values_list.append(f"({order_id}, {item_id}, {quantity}, {unit_price}, {amount})")
        
        if values_list:
            sql = f"""INSERT INTO purchase_order_items (order_id, item_id, quantity, unit_price, amount) 
                      VALUES {', '.join(values_list)};"""
            
            response = import_data(token, "purchase_order_items", sql)
            if response.status_code == 200:
                purchase_success += len(values_list)
                print(f"✅ 采购订单明细批次 {batch_start}-{batch_end-1} 成功")
            
            time.sleep(0.3)
    
    print(f"📈 订单明细: 销售 {sales_success} 条, 采购 {purchase_success} 条")

def main():
    print("🚀 生成大量演示数据")
    print("=" * 50)
    
    # 登录
    token = login()
    if not token:
        print("❌ 登录失败，退出")
        return
    
    print("✅ 登录成功")
    
    # 生成大量订单数据
    print("\n开始生成大量订单数据...")
    
    # 生成100个销售订单
    sales_count = generate_sales_orders(token, 100)
    time.sleep(2)
    
    # 生成100个采购订单
    purchase_count = generate_purchase_orders(token, 100)
    time.sleep(2)
    
    # 生成订单明细
    if sales_count > 0 or purchase_count > 0:
        generate_order_items(token, sales_count, purchase_count)
    
    # 获取最终统计
    print("\n📊 最终数据统计:")
    response = requests.get(f"{RAILWAY_URL}/data-import/stats", 
                          headers={"Authorization": f"Bearer {token}"})
    if response.status_code == 200:
        stats = response.json()
        for table, count in stats.items():
            print(f"  {table}: {count} 条记录")
    
    print("\n🎉 大量演示数据生成完成！")
    print("现在您的Demo系统拥有：")
    print(f"- {sales_count} 个销售订单（包含完整明细）")
    print(f"- {purchase_count} 个采购订单（包含完整明细）")
    print("- 6个客户和4个供应商")
    print("- 20个商品和完整库存")
    print("- 涵盖6个月的历史交易数据")
    print("- 不同状态的订单（已完成、待处理、已取消）")
    print("\n🎯 完美的Demo系统准备就绪！")
    print("请刷新页面查看您的大量演示数据！")

if __name__ == "__main__":
    main()
