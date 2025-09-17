#!/usr/bin/env python3
import requests
import time
import random
from datetime import datetime, timedelta

RAILWAY_URL = "https://web-production-7a257.up.railway.app/api"

def login():
    response = requests.post(f"{RAILWAY_URL}/auth/login", 
                           json={"username": "admin", "password": "123456"})
    return response.json().get("token") if response.status_code == 200 else None

def import_data(token, table_name, sql_data):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    data = {"tableName": table_name, "data": sql_data}
    return requests.post(f"{RAILWAY_URL}/data-import/import", headers=headers, json=data)

def create_complete_investor_demo(token):
    """创建完整的投资级Demo数据"""
    print("🏦 创建投资级别的完美Demo系统")
    print("=" * 70)
    
    # 1. 创建高价值客户
    print("👑 创建15个高价值客户...")
    customers = [
        ("CUS001", "苏宁易购华南总部", "王总监", "400-836-5315", "wang@suning.com", "深圳市南山区", "wholesale", 5000000),
        ("CUS002", "国美电器集团", "李采购总监", "400-813-3333", "li@gome.com", "北京市朝阳区", "wholesale", 8000000),
        ("CUS003", "京东家电华南中心", "陈经理", "400-606-5566", "chen@jd.com", "广州市天河区", "wholesale", 12000000),
        ("CUS004", "万达广场连锁", "赵店长", "400-168-8888", "zhao@wanda.com", "全国连锁", "retail", 2000000),
        ("CUS005", "华润万家超市", "钱经理", "400-678-1234", "qian@crv.com", "深圳市福田区", "retail", 3000000),
        ("CUS006", "恒大地产采购部", "孙经理", "400-888-6666", "sun@evergrande.com", "广州市天河区", "enterprise", 15000000),
        ("CUS007", "万科地产", "周总监", "400-999-8888", "zhou@vanke.com", "深圳市南山区", "enterprise", 10000000),
        ("CUS008", "碧桂园集团", "吴总监", "400-777-9999", "wu@countrygarden.com", "佛山市顺德区", "enterprise", 18000000),
        ("CUS009", "小米生态链", "郑总监", "400-100-5678", "zheng@mi.com", "北京市海淀区", "wholesale", 6000000),
        ("CUS010", "华为智能家居", "刘总监", "400-822-9999", "liu@huawei.com", "深圳市龙岗区", "enterprise", 20000000),
        ("CUS011", "南非约翰内斯堡电器城", "Michael Johnson", "+27-11-123-4567", "michael@jhb.co.za", "Johannesburg, SA", "wholesale", 4000000),
        ("CUS012", "开普敦家电连锁", "Sarah Williams", "+27-21-987-6543", "sarah@cape.co.za", "Cape Town, SA", "retail", 2500000),
        ("CUS013", "德班批发市场", "David Smith", "+27-31-555-7890", "david@durban.co.za", "Durban, SA", "wholesale", 3500000),
        ("CUS014", "腾讯高管采购", "马助理", "400-662-8888", "ma@tencent.com", "深圳市南山区", "vip", 1000000),
        ("CUS015", "阿里巴巴深圳", "张总监", "400-800-1688", "zhang@alibaba.com", "深圳市南山区", "enterprise", 8000000)
    ]
    
    for code, name, contact, phone, email, address, ctype, credit in customers:
        sql = f"""INSERT OR REPLACE INTO customers (code, name, contact_person, phone, email, address, customer_type, credit_limit, payment_terms, registration_date, status, created_at, updated_at) 
                 VALUES ('{code}', '{name}', '{contact}', '{phone}', '{email}', '{address}', '{ctype}', {credit}, 'monthly', '2023-01-01', 'active', datetime('now'), datetime('now'));"""
        import_data(token, "customers", sql)
        time.sleep(0.1)
    
    print("✅ 15个高价值客户创建完成")
    
    # 2. 创建顶级供应商
    print("🏭 创建15个顶级供应商...")
    suppliers = [
        ("SUP001", "格力电器股份有限公司", "张总监", "400-836-5315", "zhang@gree.com", "珠海市香洲区", "91440400MA4W2XYZ12"),
        ("SUP002", "美的集团股份有限公司", "李总监", "400-889-9315", "li@midea.com", "佛山市顺德区", "91440600MA4W3ABC34"),
        ("SUP003", "海尔智家股份有限公司", "王总经理", "400-699-9999", "wang@haier.com", "青岛市崂山区", "91370200MA4W4DEF56"),
        ("SUP004", "TCL科技集团", "赵总监", "400-812-3456", "zhao@tcl.com", "惠州市仲恺区", "91441300MA4W5GHI78"),
        ("SUP005", "三星电子中国", "金总监", "400-810-5858", "kim@samsung.com", "北京市朝阳区", "91110000MA4W6JKL90"),
        ("SUP006", "LG电子中国", "朴总经理", "400-819-9999", "park@lge.com", "北京市朝阳区", "91110000MA4W7MNO12"),
        ("SUP007", "松下电器中国", "田中总监", "400-810-0781", "tanaka@panasonic.cn", "北京市朝阳区", "91110000MA4W8PQR34"),
        ("SUP008", "西门子家电中国", "施密特", "400-616-2020", "schmidt@siemens.com", "南京市江宁区", "91320100MA4W9STU56"),
        ("SUP009", "小米生态链云米", "陈总监", "400-100-5678", "chen@viomi.com", "佛山市顺德区", "91440600MA4WABCD78"),
        ("SUP010", "华为智能家居", "刘副总裁", "400-822-9999", "liu@huawei.com", "深圳市龙岗区", "91440300MA4WEFGH90"),
        ("SUP011", "South African Appliances", "John van der Merwe", "+27-11-234-5678", "john@saapp.co.za", "Johannesburg, SA", "ZA1234567890"),
        ("SUP012", "Cape Electronics", "Nomsa Mbeki", "+27-21-345-6789", "nomsa@cape.co.za", "Cape Town, SA", "ZA2345678901"),
        ("SUP013", "德国博世家电", "Mueller", "400-880-0808", "mueller@bosch.com", "上海市浦东新区", "91310000MA4WIJKL12"),
        ("SUP014", "意大利阿里斯顿", "Rossi", "400-820-1811", "rossi@ariston.com", "无锡市", "91320200MA4WMNOP34"),
        ("SUP015", "日本夏普电器", "佐藤", "400-810-8888", "sato@sharp.cn", "广州市天河区", "91440100MA4WQRST56")
    ]
    
    for code, name, contact, phone, email, address, tax_no in suppliers:
        sql = f"""INSERT OR REPLACE INTO suppliers (code, name, contact_person, phone, email, address, tax_number, status, created_at, updated_at) 
                 VALUES ('{code}', '{name}', '{contact}', '{phone}', '{email}', '{address}', '{tax_no}', 'active', datetime('now'), datetime('now'));"""
        import_data(token, "suppliers", sql)
        time.sleep(0.1)
    
    print("✅ 15个顶级供应商创建完成")
    
    # 3. 创建高价值商品
    print("📱 创建20个高价值商品...")
    items = [
        ("AC001", "格力3匹变频中央空调", "GREE 3HP Central AC", "中央空调", "套", 8800, 12800, 5, 30),
        ("AC002", "美的5匹商用空调", "Midea 5HP Commercial", "商用空调", "套", 15800, 22800, 3, 20),
        ("TV001", "三星85寸8K QLED电视", "Samsung 85\" 8K QLED", "8K电视", "台", 25000, 35000, 2, 15),
        ("TV002", "LG 77寸OLED电视", "LG 77\" OLED", "OLED电视", "台", 18000, 25000, 3, 20),
        ("RF001", "西门子610升对开门冰箱", "Siemens 610L Fridge", "对开门冰箱", "台", 8500, 12000, 4, 25),
        ("RF002", "博世569升多门冰箱", "Bosch 569L Multi-Door", "多门冰箱", "台", 9800, 13500, 3, 22),
        ("WM001", "小天鹅12公斤滚筒洗衣机", "Little Swan 12kg Washer", "滚筒洗衣机", "台", 3800, 5200, 6, 35),
        ("WM002", "海尔10公斤直驱洗衣机", "Haier 10kg Direct Drive", "直驱洗衣机", "台", 4200, 5800, 5, 30),
        ("KT001", "方太嵌入式微波炉", "Fotile Built-in Microwave", "嵌入式微波炉", "台", 2800, 3800, 8, 40),
        ("KT002", "老板大吸力油烟机", "Robam Range Hood", "油烟机", "台", 2200, 3200, 10, 50),
        ("LA001", "戴森V15无线吸尘器", "Dyson V15 Cordless", "无线吸尘器", "台", 3200, 4500, 12, 40),
        ("LA002", "飞利浦破壁料理机", "Philips Blender", "破壁机", "台", 800, 1200, 20, 80),
        ("SH001", "小米智能门锁", "Mi Smart Lock", "智能门锁", "套", 800, 1200, 25, 100),
        ("SH002", "华为55寸智慧屏", "Huawei Smart Screen", "智慧屏", "台", 3800, 5200, 8, 40),
        ("SH003", "海康威视智能摄像头", "Hikvision Camera", "智能摄像头", "台", 300, 500, 30, 150),
        ("CM001", "海尔商用展示柜", "Haier Commercial Cooler", "商用展示柜", "台", 5800, 8500, 5, 25),
        ("CM002", "美的商用洗碗机", "Midea Commercial Dishwasher", "商用洗碗机", "台", 8200, 12000, 3, 15),
        ("AP001", "松下空气净化器", "Panasonic Air Purifier", "空气净化器", "台", 1200, 1800, 15, 60),
        ("AP002", "夏普加湿器", "Sharp Humidifier", "加湿器", "台", 600, 900, 20, 80),
        ("SP001", "TCL智能音响", "TCL Smart Speaker", "智能音响", "台", 400, 600, 25, 100)
    ]
    
    for code, name, en_name, category, unit, purchase_price, sale_price, min_stock, max_stock in items:
        sql = f"""INSERT OR REPLACE INTO items (code, name, en_name, category, unit, purchase_price, sale_price, min_stock, max_stock, status, created_at, updated_at) 
                 VALUES ('{code}', '{name}', '{en_name}', '{category}', '{unit}', {purchase_price}, {sale_price}, {min_stock}, {max_stock}, 'active', datetime('now'), datetime('now'));"""
        import_data(token, "items", sql)
        time.sleep(0.05)
    
    print("✅ 20个高价值商品创建完成")
    
    # 4. 创建30天的销售数据（显示增长趋势）
    print("📈 创建30天增长趋势销售数据...")
    
    total_revenue = 0
    total_orders = 0
    
    for days_ago in range(29, -1, -1):
        order_date = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d')
        created_at = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d %H:%M:%S')
        
        # 显示明显增长趋势：从每天20单增长到80单
        base_orders = 20 + (29 - days_ago) * 2
        weekday = (datetime.now() - timedelta(days=days_ago)).weekday()
        daily_orders = int(base_orders * (1.3 if weekday >= 5 else 1.0)) + random.randint(-3, 8)
        
        daily_revenue = 0
        batch_values = []
        
        for i in range(daily_orders):
            order_no = f"SO-{order_date.replace('-', '')}-{10000 + total_orders + i}"
            customer_id = random.randint(1, 15)
            warehouse_id = random.randint(1, 2)
            
            # 订单金额显示增长（平均订单价值也在增长）
            base_amount = 800 + (29 - days_ago) * 100  # 从800增长到3700
            total_amount = int(base_amount * random.uniform(0.3, 2.5))
            
            discount_amount = random.randint(0, min(300, total_amount // 15)) if random.random() < 0.25 else 0
            final_amount = total_amount - discount_amount
            total_cost = round(total_amount * 0.58)
            gross_profit = final_amount - total_cost
            profit_margin = round((gross_profit / final_amount) * 100) if final_amount > 0 else 0
            
            status = random.choices(['completed', 'pending'], weights=[96, 4])[0]
            
            if status == 'completed':
                daily_revenue += final_amount
            
            batch_values.append(f"('{order_no}', {customer_id}, {warehouse_id}, '{order_date}', {total_amount}, {discount_amount}, {final_amount}, {final_amount}, {total_cost}, {gross_profit}, {profit_margin}, 'paid', '{status}', 'Demo数据', '{created_at}', '{created_at}')")
        
        # 批量插入
        if batch_values:
            batch_size = 50
            for j in range(0, len(batch_values), batch_size):
                batch = batch_values[j:j+batch_size]
                sql = f"""INSERT INTO sales_orders (order_no, customer_id, warehouse_id, order_date, total_amount, discount_amount, final_amount, paid_amount, total_cost, gross_profit, profit_margin, payment_status, status, remarks, created_at, updated_at) 
                         VALUES {', '.join(batch)};"""
                import_data(token, "sales_orders", sql)
                time.sleep(0.2)
        
        total_orders += daily_orders
        total_revenue += daily_revenue
        
        if days_ago % 5 == 0 or days_ago < 3:
            print(f"📊 {order_date}: {daily_orders}单, ¥{daily_revenue:,.0f}")
    
    print(f"✅ 30天销售数据创建完成：{total_orders}单，¥{total_revenue:,.0f}")
    
    # 5. 创建采购订单
    print("🏭 创建采购订单...")
    for i in range(100):
        order_no = f"PO-20250917-{40000 + i}"
        supplier_id = random.randint(1, 15)
        warehouse_id = random.randint(1, 2)
        order_date = (datetime.now() - timedelta(days=random.randint(0, 60))).strftime('%Y-%m-%d')
        total_amount = random.randint(15000, 100000)
        status = random.choices(['completed', 'pending'], weights=[85, 15])[0]
        
        sql = f"""INSERT INTO purchase_orders (order_no, supplier_id, warehouse_id, order_date, total_amount, status, remarks, created_at, updated_at) 
                 VALUES ('{order_no}', {supplier_id}, {warehouse_id}, '{order_date}', {total_amount}, '{status}', 'Demo采购', datetime('now'), datetime('now'));"""
        import_data(token, "purchase_orders", sql)
        
        if i % 20 == 19:
            print(f"✅ 已创建 {i+1} 个采购订单")
        time.sleep(0.1)
    
    # 6. 创建订单明细（确保报表有数据）
    print("📋 创建订单明细...")
    
    # 为前500个销售订单创建明细
    detail_count = 0
    for order_id in range(1, 501):
        items_count = random.randint(1, 4)
        
        for j in range(items_count):
            item_id = random.randint(1, 20)
            quantity = random.randint(1, 8)
            unit_price = random.randint(600, 35000)
            unit_cost = round(unit_price * 0.58)
            total_price = unit_price * quantity
            total_cost = unit_cost * quantity
            
            sql = f"""INSERT INTO sales_order_items (order_id, item_id, quantity, unit_price, unit_cost, total_price, total_cost, delivered_quantity, created_at) 
                     VALUES ({order_id}, {item_id}, {quantity}, {unit_price}, {unit_cost}, {total_price}, {total_cost}, {quantity}, datetime('now'));"""
            
            import_data(token, "sales_order_items", sql)
            detail_count += 1
            
            if detail_count % 200 == 0:
                print(f"✅ 已创建 {detail_count} 条销售明细")
                time.sleep(0.5)
    
    print(f"✅ {detail_count} 条订单明细创建完成")

def main():
    print("🏦 最终创建投资级别Demo系统")
    print("=" * 70)
    
    token = login()
    if not token:
        print("❌ 登录失败")
        return
    
    print("✅ 登录成功，开始创建投资级Demo...")
    
    create_complete_investor_demo(token)
    
    # 测试报表
    print("\n🧪 测试报表功能...")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 测试销售趋势
    trend_response = requests.get(f"{RAILWAY_URL}/reports/sales-trend?start_date=2025-08-20&end_date=2025-09-17", headers=headers)
    if trend_response.status_code == 200:
        trend_data = trend_response.json()
        print(f"📈 销售趋势：{len(trend_data)} 个数据点")
        if len(trend_data) >= 2:
            print(f"  增长趋势：从¥{trend_data[0]['sales_amount']:,} 到 ¥{trend_data[-1]['sales_amount']:,}")
    
    # 测试商品排行
    items_response = requests.get(f"{RAILWAY_URL}/reports/top-selling-items?limit=5", headers=headers)
    if items_response.status_code == 200:
        items_data = items_response.json()
        print(f"🏆 热销商品：{len(items_data)} 个")
        for item in items_data[:3]:
            print(f"  {item['name']}: ¥{item['total_sales']:,}")
    
    # 最终统计
    stats_response = requests.get(f"{RAILWAY_URL}/data-import/stats", headers=headers)
    if stats_response.status_code == 200:
        stats = stats_response.json()
        print(f"\n📊 投资级Demo系统数据统计:")
        for table, count in stats.items():
            print(f"  {table}: {count:,} 条记录")
    
    print("\n🏦🏦🏦 投资级Demo系统创建完成！")
    print("=" * 70)
    print("💎 投资亮点总结：")
    print("📈 强劲增长：30天内订单量和金额双增长")
    print("👑 高价值客户：腾讯、华为、万科、恒大等知名企业")
    print("🏭 顶级供应链：格力、美的、三星、LG等国际品牌")
    print("🌍 国际化布局：中国+南非双市场")
    print("💰 健康财务：42%利润率，96%订单完成率")
    print("📊 数据驱动：完整的报表分析系统")
    print("🎯 市场地位：大型家电连锁领导者")
    print("\n🚀 完美的投资级Demo准备就绪！")

if __name__ == "__main__":
    main()
