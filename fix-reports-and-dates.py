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

def fix_order_dates_for_charts(token):
    """修复订单日期，确保报表图表有数据显示"""
    print("📈 修复订单日期以显示报表曲线...")
    
    # 清空现有销售订单，重新创建带正确日期的
    print("🗑️ 清空现有销售订单...")
    clear_response = import_data(token, "sales_orders", "DELETE FROM sales_orders;")
    print(f"清空结果: {clear_response.text if clear_response else 'OK'}")
    
    time.sleep(2)
    
    # 创建过去30天的每日销售数据
    print("📅 创建过去30天的每日销售数据...")
    
    total_revenue = 0
    total_orders = 0
    
    for days_ago in range(29, -1, -1):  # 从29天前到今天
        order_date = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d')
        created_at = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d %H:%M:%S')
        
        # 每天的订单数量（模拟增长趋势）
        base_orders = 20 + (29 - days_ago) * 2  # 从20单/天增长到78单/天
        daily_orders = base_orders + random.randint(-5, 10)
        
        # 周末加成
        weekday = (datetime.now() - timedelta(days=days_ago)).weekday()
        if weekday >= 5:  # 周末
            daily_orders = int(daily_orders * 1.3)
        
        daily_revenue = 0
        batch_values = []
        
        print(f"📊 {order_date}: 生成 {daily_orders} 个订单...")
        
        for i in range(daily_orders):
            order_no = f"SO-{order_date.replace('-', '')}-{10000 + total_orders + i}"
            customer_id = random.randint(1, 15)
            warehouse_id = random.randint(1, 2)
            
            # 订单金额（显示增长趋势）
            base_amount = 500 + (29 - days_ago) * 50  # 基础金额递增
            amount_variation = random.uniform(0.5, 2.0)
            total_amount = int(base_amount * amount_variation)
            
            discount_amount = random.randint(0, min(200, total_amount // 20)) if random.random() < 0.2 else 0
            final_amount = total_amount - discount_amount
            total_cost = round(total_amount * 0.58)
            gross_profit = final_amount - total_cost
            profit_margin = round((gross_profit / final_amount) * 100) if final_amount > 0 else 0
            
            status = random.choices(['completed', 'pending'], weights=[95, 5])[0]
            
            if status == 'completed':
                daily_revenue += final_amount
            
            # 使用正确的日期字段
            batch_values.append(f"('{order_no}', {customer_id}, {warehouse_id}, '{order_date}', {total_amount}, {discount_amount}, {final_amount}, {final_amount}, {total_cost}, {gross_profit}, {profit_margin}, 'paid', '{status}', 'Demo数据', '{created_at}', '{created_at}')")
        
        # 批量插入当天订单
        if batch_values:
            batch_size = 50
            for j in range(0, len(batch_values), batch_size):
                batch = batch_values[j:j+batch_size]
                sql = f"""INSERT INTO sales_orders (order_no, customer_id, warehouse_id, order_date, 
                         total_amount, discount_amount, final_amount, paid_amount, total_cost, gross_profit, 
                         profit_margin, payment_status, status, remarks, created_at, updated_at) 
                         VALUES {', '.join(batch)};"""
                
                response = import_data(token, "sales_orders", sql)
                if response.status_code == 200:
                    print(f"  ✅ {order_date} 批次 {j//batch_size + 1} 成功")
                
                time.sleep(0.3)
        
        total_orders += daily_orders
        total_revenue += daily_revenue
        
        print(f"  💰 {order_date}: {daily_orders}单, ¥{daily_revenue:,.0f}")
    
    print(f"\n📊 日期修复完成：")
    print(f"  总订单：{total_orders:,}个")
    print(f"  总收入：¥{total_revenue:,.0f}")
    print(f"  日期范围：过去30天")
    print(f"  增长趋势：从20单/天增长到78单/天")

def create_order_items_for_reports(token):
    """为报表创建订单明细数据"""
    print("📋 创建订单明细以支持报表分析...")
    
    # 获取当前订单数量
    stats_response = requests.get(f"{RAILWAY_URL}/data-import/stats", 
                                headers={"Authorization": f"Bearer {token}"})
    
    if stats_response.status_code == 200:
        stats = stats_response.json()
        sales_orders_count = stats.get('sales_orders', 0)
        items_count = stats.get('items', 0)
        
        print(f"📊 为 {sales_orders_count} 个销售订单创建明细...")
        
        # 为每个订单创建1-3个商品明细
        batch_values = []
        detail_count = 0
        
        for order_id in range(1, min(sales_orders_count + 1, 2001)):  # 限制在2000个订单内
            items_per_order = random.randint(1, 3)
            
            for _ in range(items_per_order):
                item_id = random.randint(1, min(items_count, 14))
                quantity = random.randint(1, 5)
                
                # 根据商品ID设置合理价格
                if item_id <= 4:
                    unit_prices = [2899, 3599, 2399, 3199]
                    unit_price = unit_prices[item_id - 1]
                elif item_id <= 8:
                    unit_price = random.randint(8000, 35000)  # 高端商品
                else:
                    unit_price = random.randint(800, 5200)   # 其他商品
                
                unit_cost = round(unit_price * 0.58)
                total_price = unit_price * quantity
                total_cost = unit_cost * quantity
                delivered_quantity = quantity
                
                batch_values.append(f"({order_id}, {item_id}, {quantity}, {unit_price}, {unit_cost}, {total_price}, {total_cost}, {delivered_quantity}, datetime('now'))")
                detail_count += 1
                
                # 每1000条明细插入一次
                if len(batch_values) >= 1000:
                    sql = f"""INSERT INTO sales_order_items (order_id, item_id, quantity, unit_price, unit_cost, total_price, total_cost, delivered_quantity, created_at) 
                              VALUES {', '.join(batch_values)};"""
                    
                    response = import_data(token, "sales_order_items", sql)
                    if response.status_code == 200:
                        print(f"✅ 已创建 {detail_count} 条订单明细")
                    
                    batch_values = []
                    time.sleep(0.5)
        
        # 插入剩余明细
        if batch_values:
            sql = f"""INSERT INTO sales_order_items (order_id, item_id, quantity, unit_price, unit_cost, total_price, total_cost, delivered_quantity, created_at) 
                      VALUES {', '.join(batch_values)};"""
            
            response = import_data(token, "sales_order_items", sql)
            if response.status_code == 200:
                print(f"✅ 最终创建 {detail_count} 条订单明细")

def main():
    print("📈 修复报表图表显示问题")
    print("=" * 50)
    
    # 登录
    token = login()
    if not token:
        print("❌ 登录失败，退出")
        return
    
    print("✅ 登录成功")
    
    # 修复日期和报表数据
    fix_order_dates_for_charts(token)
    time.sleep(3)
    create_order_items_for_reports(token)
    
    # 测试报表API
    print("\n🧪 测试报表API...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 测试销售趋势
    trend_response = requests.get(f"{RAILWAY_URL}/reports/sales-trend?start_date=2025-08-18&end_date=2025-09-17", headers=headers)
    if trend_response.status_code == 200:
        trend_data = trend_response.json()
        print(f"📈 销售趋势数据：{len(trend_data)} 个数据点")
        if trend_data:
            print(f"  最早：{trend_data[0]['date']} - ¥{trend_data[0]['sales_amount']:,}")
            print(f"  最新：{trend_data[-1]['date']} - ¥{trend_data[-1]['sales_amount']:,}")
    
    # 测试商品排行
    items_response = requests.get(f"{RAILWAY_URL}/reports/top-selling-items?limit=5", headers=headers)
    if items_response.status_code == 200:
        items_data = items_response.json()
        print(f"🏆 热销商品：{len(items_data)} 个商品")
    
    # 获取最终统计
    print("\n📊 最终数据统计:")
    response = requests.get(f"{RAILWAY_URL}/data-import/stats", 
                          headers={"Authorization": f"Bearer {token}"})
    if response.status_code == 200:
        stats = response.json()
        for table, count in stats.items():
            print(f"  {table}: {count:,} 条记录")
    
    print("\n🎉 报表修复完成！")
    print("📈 现在报表应该显示完整的增长曲线")
    print("🏆 商品排行应该显示热销数据")
    print("👥 客户分析应该显示完整信息")
    print("\n🚀 请刷新页面查看美丽的报表图表！")

if __name__ == "__main__":
    main()
