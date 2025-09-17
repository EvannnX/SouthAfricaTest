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

def create_orders_immediately(token):
    """立即创建订单数据 - 使用正确的字段"""
    print("🚀 立即创建月销100万店铺的订单数据...")
    
    # 创建销售订单 - 使用实际的表结构字段
    print("💰 创建销售订单（使用正确字段）...")
    
    sales_success = 0
    for i in range(1, 101):  # 先创建100个测试
        order_no = f"SO-20250917-{10000 + i}"
        customer_id = random.randint(1, 6)
        warehouse_id = random.randint(1, 2)
        order_date = (datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d')
        
        total_amount = random.randint(500, 15000)
        discount_amount = random.randint(0, 500) if i % 5 == 0 else 0
        final_amount = total_amount - discount_amount
        total_cost = round(total_amount * 0.6)
        gross_profit = final_amount - total_cost
        profit_margin = round((gross_profit / final_amount) * 100) if final_amount > 0 else 0
        
        status = random.choice(['completed', 'completed', 'completed', 'pending'])
        
        # 使用实际的表结构
        sql = f"""INSERT INTO sales_orders (order_no, customer_id, warehouse_id, order_date, 
                 total_amount, discount_amount, final_amount, paid_amount, total_cost, gross_profit, 
                 profit_margin, payment_status, status, remarks) 
                 VALUES ('{order_no}', {customer_id}, {warehouse_id}, '{order_date}', 
                 {total_amount}, {discount_amount}, {final_amount}, {final_amount}, {total_cost}, 
                 {gross_profit}, {profit_margin}, 'paid', '{status}', 'Demo数据');"""
        
        response = import_data(token, "sales_orders", sql)
        if response.status_code == 200:
            sales_success += 1
            if i % 20 == 0:
                print(f"✅ 已创建 {i} 个销售订单")
        else:
            print(f"❌ 销售订单 {i} 失败: {response.text}")
            # 如果前几个失败，打印详细信息用于调试
            if i <= 3:
                print(f"SQL: {sql[:100]}...")
        
        time.sleep(0.1)
    
    # 创建采购订单
    print("🏭 创建采购订单（使用正确字段）...")
    
    purchase_success = 0
    for i in range(1, 51):  # 创建50个采购订单
        order_no = f"PO-20250917-{30000 + i}"
        supplier_id = random.randint(1, 4)
        warehouse_id = random.randint(1, 2)
        order_date = (datetime.now() - timedelta(days=random.randint(0, 45))).strftime('%Y-%m-%d')
        
        total_amount = random.randint(10000, 80000)
        status = random.choice(['completed', 'completed', 'pending'])
        
        # 使用实际的表结构
        sql = f"""INSERT INTO purchase_orders (order_no, supplier_id, warehouse_id, order_date, 
                 total_amount, status, remarks) 
                 VALUES ('{order_no}', {supplier_id}, {warehouse_id}, '{order_date}', 
                 {total_amount}, '{status}', 'Demo采购数据');"""
        
        response = import_data(token, "purchase_orders", sql)
        if response.status_code == 200:
            purchase_success += 1
            if i % 10 == 0:
                print(f"✅ 已创建 {i} 个采购订单")
        else:
            print(f"❌ 采购订单 {i} 失败: {response.text}")
            if i <= 3:
                print(f"SQL: {sql[:100]}...")
        
        time.sleep(0.1)
    
    print(f"\n📊 创建结果：")
    print(f"  销售订单：{sales_success}/100")
    print(f"  采购订单：{purchase_success}/50")
    
    return sales_success, purchase_success

def create_order_items(token, sales_count, purchase_count):
    """创建订单明细"""
    print("📋 创建订单明细...")
    
    # 销售订单明细
    if sales_count > 0:
        print(f"创建 {sales_count} 个销售订单的明细...")
        
        for order_id in range(1, sales_count + 1):
            items_count = random.randint(1, 3)
            
            for j in range(items_count):
                item_id = random.randint(1, 20)
                quantity = random.randint(1, 5)
                unit_price = random.randint(500, 5000)
                unit_cost = round(unit_price * 0.6)
                total_price = unit_price * quantity
                total_cost = unit_cost * quantity
                
                sql = f"""INSERT INTO sales_order_items (order_id, item_id, quantity, unit_price, unit_cost, total_price, total_cost, delivered_quantity) 
                         VALUES ({order_id}, {item_id}, {quantity}, {unit_price}, {unit_cost}, {total_price}, {total_cost}, {quantity});"""
                
                response = import_data(token, "sales_order_items", sql)
                if response.status_code != 200 and order_id <= 3:
                    print(f"❌ 销售明细失败: {response.text}")
                
                time.sleep(0.05)
    
    # 采购订单明细
    if purchase_count > 0:
        print(f"创建 {purchase_count} 个采购订单的明细...")
        
        for order_id in range(1, purchase_count + 1):
            items_count = random.randint(1, 2)
            
            for j in range(items_count):
                item_id = random.randint(1, 20)
                quantity = random.randint(20, 100)
                unit_price = random.randint(800, 3000)
                total_price = unit_price * quantity
                
                sql = f"""INSERT INTO purchase_order_items (order_id, item_id, quantity, unit_price, total_price, received_quantity) 
                         VALUES ({order_id}, {item_id}, {quantity}, {unit_price}, {total_price}, {quantity});"""
                
                response = import_data(token, "purchase_order_items", sql)
                if response.status_code != 200 and order_id <= 3:
                    print(f"❌ 采购明细失败: {response.text}")
                
                time.sleep(0.05)

def main():
    print("🔧 立即修复并创建月销100万店铺数据")
    print("=" * 60)
    
    # 登录
    token = login()
    if not token:
        print("❌ 登录失败，退出")
        return
    
    print("✅ 登录成功")
    
    # 立即创建订单数据
    sales_count, purchase_count = create_orders_immediately(token)
    
    # 创建订单明细
    if sales_count > 0 or purchase_count > 0:
        create_order_items(token, sales_count, purchase_count)
    
    # 获取最终统计
    print("\n📊 最终数据统计:")
    response = requests.get(f"{RAILWAY_URL}/data-import/stats", 
                          headers={"Authorization": f"Bearer {token}"})
    if response.status_code == 200:
        stats = response.json()
        for table, count in stats.items():
            print(f"  {table}: {count:,} 条记录")
    
    print("\n🎉 立即修复完成！")
    if sales_count > 0 or purchase_count > 0:
        print("✅ 订单数据创建成功！")
        print("现在请刷新页面查看您的订单数据！")
    else:
        print("❌ 订单创建仍然失败，需要进一步调试")

if __name__ == "__main__":
    main()
