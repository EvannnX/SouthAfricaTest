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

def create_customers(token):
    """创建客户数据"""
    print("👥 创建客户数据...")
    
    customers = [
        ("CUS001", "深圳电器城", "王经理", "13800138001", "wang@szdc.com", "深圳市福田区华强北路", "retail"),
        ("CUS002", "广州批发商城", "李总", "13800138002", "li@gzpf.com", "广州市天河区批发大道", "wholesale"),
        ("CUS003", "东莞连锁超市", "陈店长", "13800138003", "chen@dgls.com", "东莞市南城区连锁路", "retail"),
        ("CUS004", "佛山家电公司", "赵总监", "13800138004", "zhao@fsjd.com", "佛山市禅城区家电街", "wholesale"),
        ("CUS005", "珠海电器行", "钱老板", "13800138005", "qian@zhdq.com", "珠海市香洲区电器路", "retail"),
        ("CUS006", "惠州大卖场", "孙经理", "13800138006", "sun@hzdmc.com", "惠州市惠城区大卖场路", "wholesale")
    ]
    
    for code, name, contact, phone, email, address, ctype in customers:
        sql = f"""INSERT OR REPLACE INTO customers (code, name, contact_person, phone, email, address, customer_type, registration_date, status, created_at, updated_at) 
                  VALUES ('{code}', '{name}', '{contact}', '{phone}', '{email}', '{address}', '{ctype}', '2025-09-01', 'active', datetime('now'), datetime('now'));"""
        
        response = import_data(token, "customers", sql)
        if response.status_code == 200:
            print(f"✅ 客户 {name} 创建成功")
        else:
            print(f"❌ 客户 {name} 创建失败: {response.text}")

def create_suppliers(token):
    """创建供应商数据"""
    print("🏭 创建供应商数据...")
    
    suppliers = [
        ("SUP001", "格力电器有限公司", "张经理", "400-836-5315", "zhang@gree.com", "珠海市香洲区格力路", "91440400MA4W2XYZ12"),
        ("SUP002", "美的集团股份有限公司", "李总监", "400-889-9315", "li@midea.com", "佛山市顺德区美的大道", "91440600MA4W3ABC34"),
        ("SUP003", "海尔智家股份有限公司", "王部长", "400-699-9999", "wang@haier.com", "青岛市崂山区海尔路", "91370200MA4W4DEF56"),
        ("SUP004", "TCL科技集团股份有限公司", "赵主任", "400-812-3456", "zhao@tcl.com", "惠州市仲恺区TCL科技园", "91441300MA4W5GHI78")
    ]
    
    for code, name, contact, phone, email, address, tax_no in suppliers:
        sql = f"""INSERT OR REPLACE INTO suppliers (code, name, contact_person, phone, email, address, tax_number, status, created_at, updated_at) 
                  VALUES ('{code}', '{name}', '{contact}', '{phone}', '{email}', '{address}', '{tax_no}', 'active', datetime('now'), datetime('now'));"""
        
        response = import_data(token, "suppliers", sql)
        if response.status_code == 200:
            print(f"✅ 供应商 {name} 创建成功")
        else:
            print(f"❌ 供应商 {name} 创建失败: {response.text}")

def create_sales_orders(token):
    """创建销售订单数据"""
    print("💰 创建销售订单数据...")
    
    # 基于您本地数据的模式创建销售订单
    base_date = datetime.now() - timedelta(days=30)
    
    for i in range(1, 51):  # 创建50个销售订单
        order_date = (base_date + timedelta(days=i % 30)).strftime('%Y-%m-%d')
        order_no = f"SO-{order_date.replace('-', '')}-{1000 + i}"
        customer_id = (i % 6) + 1  # 客户ID 1-6
        
        # 随机生成订单金额
        total_amount = random.randint(1000, 50000)
        tax_amount = round(total_amount * 0.15, 2)
        discount = random.randint(0, 500) if i % 5 == 0 else 0
        status = random.choice(['completed', 'completed', 'completed', 'pending', 'cancelled'])
        
        sql = f"""INSERT INTO sales_orders (order_no, customer_id, warehouse_id, order_date, delivery_date, 
                 total_amount, subtotal, tax_amount, discount_amount, status, notes, created_by, created_at, updated_at) 
                 VALUES ('{order_no}', {customer_id}, 1, '{order_date}', NULL, {total_amount}, {total_amount - tax_amount}, 
                 {tax_amount}, {discount}, '{status}', 'Demo订单数据', 1, datetime('now'), datetime('now'));"""
        
        response = import_data(token, "sales_orders", sql)
        if response.status_code == 200:
            print(f"✅ 销售订单 {order_no} 创建成功")
        else:
            print(f"❌ 销售订单 {order_no} 创建失败: {response.text}")
        
        time.sleep(0.1)

def create_purchase_orders(token):
    """创建采购订单数据"""
    print("🛒 创建采购订单数据...")
    
    base_date = datetime.now() - timedelta(days=60)
    
    for i in range(1, 31):  # 创建30个采购订单
        order_date = (base_date + timedelta(days=i % 60)).strftime('%Y-%m-%d')
        order_no = f"PO-{order_date.replace('-', '')}-{2000 + i}"
        supplier_id = (i % 4) + 1  # 供应商ID 1-4
        
        # 随机生成采购金额
        total_amount = random.randint(10000, 200000)
        tax_amount = round(total_amount * 0.15, 2)
        status = random.choice(['completed', 'completed', 'pending', 'cancelled'])
        
        sql = f"""INSERT INTO purchase_orders (order_no, supplier_id, warehouse_id, order_date, delivery_date,
                 total_amount, subtotal, tax_amount, status, notes, created_by, created_at, updated_at)
                 VALUES ('{order_no}', {supplier_id}, 1, '{order_date}', NULL, {total_amount}, {total_amount - tax_amount},
                 {tax_amount}, '{status}', 'Demo采购数据', 1, datetime('now'), datetime('now'));"""
        
        response = import_data(token, "purchase_orders", sql)
        if response.status_code == 200:
            print(f"✅ 采购订单 {order_no} 创建成功")
        else:
            print(f"❌ 采购订单 {order_no} 创建失败: {response.text}")
        
        time.sleep(0.1)

def main():
    print("🚀 创建完整的Demo数据")
    print("=" * 40)
    
    # 登录
    token = login()
    if not token:
        print("❌ 登录失败，退出")
        return
    
    print("✅ 登录成功")
    
    # 创建数据
    create_customers(token)
    time.sleep(2)
    create_suppliers(token)
    time.sleep(2)
    create_sales_orders(token)
    time.sleep(2)
    create_purchase_orders(token)
    
    # 获取最终统计
    print("\n📊 最终数据统计:")
    response = requests.get(f"{RAILWAY_URL}/data-import/stats", 
                          headers={"Authorization": f"Bearer {token}"})
    if response.status_code == 200:
        stats = response.json()
        for table, count in stats.items():
            print(f"  {table}: {count} 条记录")
    
    print("\n🎉 Demo数据创建完成！")
    print("现在您有完整的演示数据了：")
    print("- 6个客户（深圳电器城、广州批发商城等）")
    print("- 4个供应商（格力、美的、海尔、TCL）")
    print("- 50个销售订单（包含不同状态）")
    print("- 30个采购订单（包含不同金额）")
    print("- 20个商品数据")
    print("- 完整的库存信息")
    print("\n请刷新页面查看您的Demo系统！")

if __name__ == "__main__":
    main()
