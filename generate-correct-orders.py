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
    """生成销售订单数据 - 使用正确的字段"""
    print(f"💰 生成 {count} 个销售订单...")
    
    customer_ids = [1, 2, 3, 4, 5, 6]
    warehouse_ids = [1, 2]
    statuses = ['completed', 'completed', 'completed', 'pending', 'cancelled']
    payment_statuses = ['paid', 'paid', 'unpaid', 'partial']
    
    base_date = datetime.now() - timedelta(days=180)
    success_count = 0
    
    # 批量生成
    batch_size = 10
    for batch_start in range(0, count, batch_size):
        batch_end = min(batch_start + batch_size, count)
        
        values_list = []
        for i in range(batch_start, batch_end):
            order_date = (base_date + timedelta(days=random.randint(0, 180))).strftime('%Y-%m-%d %H:%M:%S')
            order_no = f"SO-{datetime.now().strftime('%Y%m%d')}-{10000 + i}"
            customer_id = random.choice(customer_ids)
            warehouse_id = random.choice(warehouse_ids)
            
            # 随机金额
            subtotal = random.randint(1000, 50000)
            tax_rate = 15.0
            tax_amount = round(subtotal * tax_rate / 100, 2)
            discount_amount = random.randint(0, 1000) if i % 7 == 0 else 0
            final_amount = subtotal + tax_amount - discount_amount
            paid_amount = final_amount if random.choice([True, True, False]) else random.randint(0, int(final_amount))
            
            total_cost = round(subtotal * 0.7, 2)  # 假设成本是售价的70%
            gross_profit = final_amount - total_cost
            profit_margin = round((gross_profit / final_amount * 100), 2) if final_amount > 0 else 0
            
            status = random.choice(statuses)
            payment_status = random.choice(payment_statuses)
            
            values_list.append(f"""('{order_no}', {customer_id}, {warehouse_id}, '{order_date}', 
                               {subtotal}, {tax_rate}, {tax_amount}, {discount_amount}, {final_amount}, 
                               {paid_amount}, {total_cost}, {gross_profit}, {profit_margin}, 
                               '{payment_status}', 'full', '{status}', 'Demo订单数据', 
                               datetime('now'), datetime('now'))""")
        
        # 批量插入SQL
        sql = f"""INSERT INTO sales_orders (order_no, customer_id, warehouse_id, order_date, 
                 subtotal, tax_rate, tax_amount, discount_amount, final_amount, paid_amount, 
                 total_cost, gross_profit, profit_margin, payment_status, payment_type, 
                 status, remarks, created_at, updated_at) 
                 VALUES {', '.join(values_list)};"""
        
        response = import_data(token, "sales_orders", sql)
        if response.status_code == 200:
            success_count += len(values_list)
            print(f"✅ 销售订单批次 {batch_start+1}-{batch_end} 成功")
        else:
            print(f"❌ 销售订单批次 {batch_start+1}-{batch_end} 失败: {response.text}")
        
        time.sleep(0.5)
    
    print(f"📈 销售订单: {success_count}/{count} 创建成功")
    return success_count

def generate_purchase_orders(token, count=100):
    """生成采购订单数据 - 使用正确的字段"""
    print(f"🛒 生成 {count} 个采购订单...")
    
    supplier_ids = [1, 2, 3, 4]
    warehouse_ids = [1, 2]
    statuses = ['completed', 'completed', 'pending', 'cancelled']
    
    base_date = datetime.now() - timedelta(days=200)
    success_count = 0
    
    # 批量生成
    batch_size = 10
    for batch_start in range(0, count, batch_size):
        batch_end = min(batch_start + batch_size, count)
        
        values_list = []
        for i in range(batch_start, batch_end):
            order_date = (base_date + timedelta(days=random.randint(0, 200))).strftime('%Y-%m-%d %H:%M:%S')
            order_no = f"PO-{datetime.now().strftime('%Y%m%d')}-{20000 + i}"
            supplier_id = random.choice(supplier_ids)
            warehouse_id = random.choice(warehouse_ids)
            
            # 随机金额
            subtotal = random.randint(10000, 200000)
            tax_rate = 15.0
            tax_amount = round(subtotal * tax_rate / 100, 2)
            discount_amount = random.randint(0, 2000) if i % 10 == 0 else 0
            final_amount = subtotal + tax_amount - discount_amount
            paid_amount = final_amount if random.choice([True, True, False]) else random.randint(0, int(final_amount))
            
            status = random.choice(statuses)
            payment_status = 'paid' if paid_amount >= final_amount else ('partial' if paid_amount > 0 else 'unpaid')
            
            values_list.append(f"""('{order_no}', {supplier_id}, {warehouse_id}, '{order_date}', 
                               {subtotal}, {tax_rate}, {tax_amount}, {discount_amount}, {final_amount}, 
                               {paid_amount}, '{payment_status}', 'full', '{status}', 'Demo采购数据', 
                               datetime('now'), datetime('now'))""")
        
        # 批量插入SQL - 根据实际的采购订单表结构
        sql = f"""INSERT INTO purchase_orders (order_no, supplier_id, warehouse_id, order_date, 
                 subtotal, tax_rate, tax_amount, discount_amount, final_amount, paid_amount, 
                 payment_status, payment_type, status, remarks, created_at, updated_at) 
                 VALUES {', '.join(values_list)};"""
        
        response = import_data(token, "purchase_orders", sql)
        if response.status_code == 200:
            success_count += len(values_list)
            print(f"✅ 采购订单批次 {batch_start+1}-{batch_end} 成功")
        else:
            print(f"❌ 采购订单批次 {batch_start+1}-{batch_end} 失败: {response.text}")
        
        time.sleep(0.5)
    
    print(f"📈 采购订单: {success_count}/{count} 创建成功")
    return success_count

def generate_sales_order_items(token, sales_count):
    """生成销售订单明细"""
    print("📋 生成销售订单明细...")
    
    item_ids = list(range(1, 21))
    success_count = 0
    
    # 为每个销售订单生成明细
    batch_size = 20
    for batch_start in range(1, sales_count + 1, batch_size):
        batch_end = min(batch_start + batch_size, sales_count + 1)
        
        values_list = []
        for order_id in range(batch_start, batch_end):
            # 每个订单1-3个商品
            items_count = random.randint(1, 3)
            for _ in range(items_count):
                item_id = random.choice(item_ids)
                quantity = random.randint(1, 10)
                unit_price = random.randint(1000, 5000)
                unit_cost = round(unit_price * 0.7, 2)  # 成本是售价的70%
                total_price = unit_price * quantity
                total_cost = unit_cost * quantity
                delivered_quantity = quantity if random.choice([True, True, False]) else random.randint(0, quantity)
                
                values_list.append(f"({order_id}, {item_id}, {quantity}, {unit_price}, {unit_cost}, {total_price}, {total_cost}, {delivered_quantity}, datetime('now'))")
        
        if values_list:
            sql = f"""INSERT INTO sales_order_items (order_id, item_id, quantity, unit_price, unit_cost, total_price, total_cost, delivered_quantity, created_at) 
                      VALUES {', '.join(values_list)};"""
            
            response = import_data(token, "sales_order_items", sql)
            if response.status_code == 200:
                success_count += len(values_list)
                print(f"✅ 销售明细批次 {batch_start}-{batch_end-1} 成功")
            
            time.sleep(0.3)
    
    print(f"📈 销售订单明细: {success_count} 条创建成功")

def generate_purchase_order_items(token, purchase_count):
    """生成采购订单明细"""
    print("📋 生成采购订单明细...")
    
    item_ids = list(range(1, 21))
    success_count = 0
    
    # 为每个采购订单生成明细
    batch_size = 20
    for batch_start in range(1, purchase_count + 1, batch_size):
        batch_end = min(batch_start + batch_size, purchase_count + 1)
        
        values_list = []
        for order_id in range(batch_start, batch_end):
            # 每个采购订单1-2个商品
            items_count = random.randint(1, 2)
            for _ in range(items_count):
                item_id = random.choice(item_ids)
                quantity = random.randint(10, 100)
                unit_price = random.randint(800, 3000)
                total_price = unit_price * quantity
                received_quantity = quantity if random.choice([True, True, False]) else random.randint(0, quantity)
                
                values_list.append(f"({order_id}, {item_id}, {quantity}, {unit_price}, {total_price}, {received_quantity}, datetime('now'))")
        
        if values_list:
            # 根据实际的采购订单明细表结构
            sql = f"""INSERT INTO purchase_order_items (order_id, item_id, quantity, unit_price, total_price, received_quantity, created_at) 
                      VALUES {', '.join(values_list)};"""
            
            response = import_data(token, "purchase_order_items", sql)
            if response.status_code == 200:
                success_count += len(values_list)
                print(f"✅ 采购明细批次 {batch_start}-{batch_end-1} 成功")
            
            time.sleep(0.3)
    
    print(f"📈 采购订单明细: {success_count} 条创建成功")

def main():
    print("🚀 生成大量正确格式的演示数据")
    print("=" * 60)
    
    # 登录
    token = login()
    if not token:
        print("❌ 登录失败，退出")
        return
    
    print("✅ 登录成功")
    
    # 生成订单数据
    print("\n🔥 开始生成大量订单数据...")
    
    # 生成100个销售订单
    sales_count = generate_sales_orders(token, 100)
    time.sleep(2)
    
    # 生成100个采购订单
    purchase_count = generate_purchase_orders(token, 100)
    time.sleep(2)
    
    # 生成订单明细
    if sales_count > 0:
        generate_sales_order_items(token, sales_count)
        time.sleep(2)
    
    if purchase_count > 0:
        generate_purchase_order_items(token, purchase_count)
    
    # 获取最终统计
    print("\n📊 最终数据统计:")
    response = requests.get(f"{RAILWAY_URL}/data-import/stats", 
                          headers={"Authorization": f"Bearer {token}"})
    if response.status_code == 200:
        stats = response.json()
        for table, count in stats.items():
            print(f"  {table}: {count} 条记录")
    
    print("\n🎉🎉🎉 大量演示数据生成完成！")
    print("=" * 60)
    print("您的Demo系统现在拥有：")
    print(f"📊 {sales_count} 个销售订单（包含完整明细和财务数据）")
    print(f"📊 {purchase_count} 个采购订单（包含完整明细和财务数据）")
    print("📊 6个真实客户和4个知名供应商")
    print("📊 20个商品和完整库存管理")
    print("📊 涵盖6个月的历史交易数据")
    print("📊 多种订单状态（已完成、待处理、已取消）")
    print("📊 完整的财务数据（成本、利润、税额等）")
    print("📊 真实的业务流程数据")
    print("\n🚀 完美的Demo系统准备就绪！")
    print("现在请刷新页面，查看您丰富的演示数据！")

if __name__ == "__main__":
    main()
