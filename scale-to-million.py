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

def scale_up_orders(token):
    """扩展到月销100万规模"""
    print("🏪 扩展到月销100万规模...")
    
    # 目标：总共需要约1500个订单来达到100万销售额
    # 已有100个，还需要1400个
    
    total_revenue = 0
    batch_size = 50
    
    for batch in range(20):  # 20批，每批50个 = 1000个额外订单
        print(f"📊 创建订单批次 {batch + 1}/20...")
        
        values_list = []
        batch_revenue = 0
        
        for i in range(batch_size):
            order_index = 101 + batch * batch_size + i
            order_no = f"SO-20250917-{10000 + order_index}"
            customer_id = random.randint(1, 6)
            warehouse_id = random.randint(1, 2)
            
            # 订单日期分布在过去30天
            days_ago = random.randint(0, 30)
            order_date = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d')
            
            # 更真实的订单金额分布（目标日均3.3万）
            order_type = random.random()
            if order_type < 0.5:  # 50% 小订单
                total_amount = random.randint(300, 1200)
            elif order_type < 0.8:  # 30% 中订单
                total_amount = random.randint(1200, 3000)
            elif order_type < 0.95:  # 15% 大订单
                total_amount = random.randint(3000, 8000)
            else:  # 5% 特大订单
                total_amount = random.randint(8000, 20000)
            
            discount_amount = random.randint(0, min(500, total_amount // 20)) if random.random() < 0.25 else 0
            final_amount = total_amount - discount_amount
            total_cost = round(total_amount * 0.6)
            gross_profit = final_amount - total_cost
            profit_margin = round((gross_profit / final_amount) * 100) if final_amount > 0 else 0
            
            status = random.choices(['completed', 'pending', 'cancelled'], weights=[90, 8, 2])[0]
            
            if status == 'completed':
                batch_revenue += final_amount
                total_revenue += final_amount
            
            values_list.append(f"('{order_no}', {customer_id}, {warehouse_id}, '{order_date}', {total_amount}, {discount_amount}, {final_amount}, {final_amount}, {total_cost}, {gross_profit}, {profit_margin}, 'paid', '{status}', 'Demo数据-批次{batch+1}')")
        
        # 批量插入
        sql = f"""INSERT INTO sales_orders (order_no, customer_id, warehouse_id, order_date, 
                 total_amount, discount_amount, final_amount, paid_amount, total_cost, gross_profit, 
                 profit_margin, payment_status, status, remarks) 
                 VALUES {', '.join(values_list)};"""
        
        response = import_data(token, "sales_orders", sql)
        if response.status_code == 200:
            print(f"✅ 批次 {batch + 1} 成功，本批收入：¥{batch_revenue:,.0f}")
        else:
            print(f"❌ 批次 {batch + 1} 失败: {response.text}")
        
        time.sleep(1)  # 避免API限制
    
    print(f"\n💰 总收入统计：¥{total_revenue:,.0f}")
    
    # 扩展采购订单
    print("🏭 扩展采购订单...")
    
    for batch in range(10):  # 10批，每批20个 = 200个额外采购订单
        print(f"📦 创建采购批次 {batch + 1}/10...")
        
        values_list = []
        
        for i in range(20):
            order_index = 51 + batch * 20 + i
            order_no = f"PO-20250917-{30000 + order_index}"
            supplier_id = random.randint(1, 4)
            warehouse_id = random.randint(1, 2)
            
            days_ago = random.randint(0, 60)
            order_date = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d')
            
            # 采购金额（支撑销售）
            total_amount = random.randint(15000, 100000)
            status = random.choices(['completed', 'pending'], weights=[85, 15])[0]
            
            values_list.append(f"('{order_no}', {supplier_id}, {warehouse_id}, '{order_date}', {total_amount}, '{status}', 'Demo采购-批次{batch+1}')")
        
        sql = f"""INSERT INTO purchase_orders (order_no, supplier_id, warehouse_id, order_date, 
                 total_amount, status, remarks) 
                 VALUES {', '.join(values_list)};"""
        
        response = import_data(token, "purchase_orders", sql)
        if response.status_code == 200:
            print(f"✅ 采购批次 {batch + 1} 成功")
        else:
            print(f"❌ 采购批次 {batch + 1} 失败")
        
        time.sleep(0.8)

def main():
    print("🏪 扩展到月销100万大型店铺规模")
    print("=" * 60)
    
    # 登录
    token = login()
    if not token:
        print("❌ 登录失败，退出")
        return
    
    print("✅ 登录成功")
    
    # 扩展订单数据
    scale_up_orders(token)
    
    # 获取最终统计
    print("\n📊 最终数据统计:")
    response = requests.get(f"{RAILWAY_URL}/data-import/stats", 
                          headers={"Authorization": f"Bearer {token}"})
    if response.status_code == 200:
        stats = response.json()
        total_sales = stats.get('sales_orders', 0)
        total_purchases = stats.get('purchase_orders', 0)
        
        for table, count in stats.items():
            print(f"  {table}: {count:,} 条记录")
        
        print(f"\n🎉🎉🎉 月销100万大型店铺数据创建完成！")
        print("=" * 60)
        print(f"🏪 您的Demo系统现在是一个大型家电连锁店：")
        print(f"💰 销售订单：{total_sales:,} 个")
        print(f"🏭 采购订单：{total_purchases:,} 个") 
        print(f"📊 预计月销售额：¥1,000,000+")
        print(f"📈 日均销售：¥33,333+")
        print(f"🎯 利润率：约40%")
        print(f"✨ 完整的大型店铺业务数据！")
        print("\n🚀 请刷新页面查看您的月销100万Demo系统！")
    
    else:
        print("❌ 获取统计失败")

if __name__ == "__main__":
    main()
