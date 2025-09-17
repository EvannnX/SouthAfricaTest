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

def create_premium_customers(token):
    """创建高价值客户群体 - 投资方喜欢看到的客户"""
    print("👑 创建高价值客户群体...")
    
    premium_customers = [
        # 大型连锁客户（高价值）
        ("CUS001", "苏宁易购华南总部", "王总监", "400-836-5315", "wang.director@suning.com", "深圳市南山区科技园苏宁大厦", "wholesale", 5000000, "monthly", "2023-01-15"),
        ("CUS002", "国美电器集团采购中心", "李采购总监", "400-813-3333", "li.procurement@gome.com", "北京市朝阳区国美总部大厦", "wholesale", 8000000, "monthly", "2023-02-20"),
        ("CUS003", "京东家电华南仓储中心", "陈仓储经理", "400-606-5566", "chen.warehouse@jd.com", "广州市天河区京东智慧园", "wholesale", 12000000, "weekly", "2023-03-10"),
        
        # 知名零售连锁
        ("CUS004", "万达广场连锁店", "赵店长", "400-168-8888", "zhao.manager@wanda.com", "全国万达广场连锁", "retail", 2000000, "monthly", "2023-04-05"),
        ("CUS005", "华润万家超市连锁", "钱区域经理", "400-678-1234", "qian.regional@crv.com", "深圳市福田区华润大厦", "retail", 3000000, "monthly", "2023-05-12"),
        
        # 高端客户
        ("CUS006", "恒大地产集团采购部", "孙采购经理", "400-888-6666", "sun.purchase@evergrande.com", "广州市天河区恒大中心", "enterprise", 15000000, "quarterly", "2023-01-08"),
        ("CUS007", "万科地产装修采购中心", "周项目总监", "400-999-8888", "zhou.project@vanke.com", "深圳市南山区万科总部", "enterprise", 10000000, "quarterly", "2023-02-28"),
        ("CUS008", "碧桂园集团供应链中心", "吴供应链总监", "400-777-9999", "wu.supply@countrygarden.com", "佛山市顺德区碧桂园总部", "enterprise", 18000000, "quarterly", "2022-12-15"),
        
        # 新兴高增长客户
        ("CUS009", "小米生态链合作伙伴", "郑合作总监", "400-100-5678", "zheng.partner@mi.com", "北京市海淀区小米科技园", "wholesale", 6000000, "monthly", "2024-01-20"),
        ("CUS010", "华为智能家居事业部", "刘事业部总监", "400-822-9999", "liu.smarthome@huawei.com", "深圳市龙岗区华为基地", "enterprise", 20000000, "monthly", "2024-02-15"),
        
        # 区域重要客户
        ("CUS011", "南非约翰内斯堡电器城", "Michael Johnson", "+27-11-123-4567", "michael@jhbelectronics.co.za", "Johannesburg, Gauteng, South Africa", "wholesale", 4000000, "monthly", "2023-06-01"),
        ("CUS012", "开普敦家电连锁", "Sarah Williams", "+27-21-987-6543", "sarah@capetownhome.co.za", "Cape Town, Western Cape, South Africa", "retail", 2500000, "monthly", "2023-07-10"),
        ("CUS013", "德班批发市场", "David Smith", "+27-31-555-7890", "david@durbanwholesale.co.za", "Durban, KwaZulu-Natal, South Africa", "wholesale", 3500000, "monthly", "2023-08-05"),
        
        # VIP个人客户（高消费）
        ("CUS014", "腾讯高管采购", "马化腾助理", "400-662-8888", "assistant@tencent.com", "深圳市南山区腾讯大厦", "vip", 1000000, "as_needed", "2023-09-01"),
        ("CUS015", "阿里巴巴深圳办事处", "张区域总监", "400-800-1688", "zhang.regional@alibaba.com", "深圳市南山区阿里中心", "enterprise", 8000000, "quarterly", "2023-10-15")
    ]
    
    for code, name, contact, phone, email, address, ctype, credit_limit, payment_terms, reg_date in premium_customers:
        sql = f"""INSERT OR REPLACE INTO customers (code, name, contact_person, phone, email, address, 
                 customer_type, credit_limit, payment_terms, registration_date, status, created_at, updated_at) 
                 VALUES ('{code}', '{name}', '{contact}', '{phone}', '{email}', '{address}', 
                 '{ctype}', {credit_limit}, '{payment_terms}', '{reg_date}', 'active', datetime('now'), datetime('now'));"""
        
        response = import_data(token, "customers", sql)
        if response.status_code == 200:
            print(f"✅ 高价值客户 {name} 创建成功")
        else:
            print(f"❌ 客户 {name} 创建失败: {response.text}")
        
        time.sleep(0.2)

def create_premium_suppliers(token):
    """创建顶级供应商 - 展示强大的供应链"""
    print("🏭 创建顶级供应商网络...")
    
    premium_suppliers = [
        # 国际知名品牌
        ("SUP001", "格力电器股份有限公司", "张全球销售总监", "400-836-5315", "zhang.global@gree.com", "珠海市香洲区格力路1号格力总部", "91440400MA4W2XYZ12", "A+"),
        ("SUP002", "美的集团股份有限公司", "李战略合作总监", "400-889-9315", "li.strategic@midea.com", "佛山市顺德区美的大道6号", "91440600MA4W3ABC34", "A+"),
        ("SUP003", "海尔智家股份有限公司", "王华南区总经理", "400-699-9999", "wang.south@haier.com", "青岛市崂山区海尔路1号", "91370200MA4W4DEF56", "A"),
        ("SUP004", "TCL科技集团股份有限公司", "赵全球供应链总监", "400-812-3456", "zhao.supply@tcl.com", "惠州市仲恺区TCL科技园", "91441300MA4W5GHI78", "A"),
        
        # 国际品牌
        ("SUP005", "三星电子(中国)有限公司", "金亚太区销售总监", "400-810-5858", "kim.apac@samsung.com", "北京市朝阳区三星总部", "91110000MA4W6JKL90", "A+"),
        ("SUP006", "LG电子(中国)有限公司", "朴华南区总经理", "400-819-9999", "park.south@lge.com", "北京市朝阳区LG双子座大厦", "91110000MA4W7MNO12", "A"),
        ("SUP007", "松下电器(中国)有限公司", "田中销售总监", "400-810-0781", "tanaka.sales@panasonic.cn", "北京市朝阳区松下大厦", "91110000MA4W8PQR34", "A"),
        ("SUP008", "西门子家电(中国)有限公司", "施密特总经理", "400-616-2020", "schmidt@siemens.com", "南京市江宁区西门子工业园", "91320100MA4W9STU56", "A+"),
        
        # 新兴优质供应商
        ("SUP009", "小米生态链-云米科技", "陈生态合作总监", "400-100-5678", "chen.eco@viomi.com", "佛山市顺德区云米总部", "91440600MA4WABCD78", "B+"),
        ("SUP010", "华为智能家居事业部", "刘事业部副总裁", "400-822-9999", "liu.smarthome@huawei.com", "深圳市龙岗区华为基地", "91440300MA4WEFGH90", "A+"),
        
        # 南非本地供应商
        ("SUP011", "South African Appliances Ltd", "John van der Merwe", "+27-11-234-5678", "john@saappliances.co.za", "Johannesburg Industrial Area, South Africa", "ZA1234567890", "B+"),
        ("SUP012", "Cape Electronics Manufacturing", "Nomsa Mbeki", "+27-21-345-6789", "nomsa@capeelectronics.co.za", "Cape Town Industrial Zone, South Africa", "ZA2345678901", "B"),
        
        # 专业细分供应商
        ("SUP013", "德国博世家电集团", "Mueller销售总监", "400-880-0808", "mueller@bosch.com", "上海市浦东新区博世中国总部", "91310000MA4WIJKL12", "A+"),
        ("SUP014", "意大利阿里斯顿集团", "Rossi亚太总监", "400-820-1811", "rossi@ariston.com", "无锡市阿里斯顿工业园", "91320200MA4WMNOP34", "A"),
        ("SUP015", "日本夏普电器", "佐藤华南总代理", "400-810-8888", "sato@sharp.cn", "广州市天河区夏普大厦", "91440100MA4WQRST56", "A")
    ]
    
    for code, name, contact, phone, email, address, tax_no, rating in premium_suppliers:
        sql = f"""INSERT OR REPLACE INTO suppliers (code, name, contact_person, phone, email, address, 
                 tax_number, supplier_rating, status, created_at, updated_at) 
                 VALUES ('{code}', '{name}', '{contact}', '{phone}', '{email}', '{address}', 
                 '{tax_no}', '{rating}', 'active', datetime('now'), datetime('now'));"""
        
        response = import_data(token, "suppliers", sql)
        if response.status_code == 200:
            print(f"✅ 顶级供应商 {name} 创建成功")
        else:
            print(f"❌ 供应商 {name} 创建失败: {response.text}")
        
        time.sleep(0.2)

def create_growth_trajectory_orders(token):
    """创建显示增长轨迹的订单数据 - 投资方最爱看的"""
    print("📈 创建展示强劲增长的订单数据...")
    
    # 模拟6个月的增长轨迹：从月销30万增长到月销150万
    months_data = [
        {"month": 6, "target": 300000, "orders": 600},   # 6个月前：30万
        {"month": 5, "target": 450000, "orders": 750},   # 5个月前：45万
        {"month": 4, "target": 650000, "orders": 900},   # 4个月前：65万
        {"month": 3, "target": 850000, "orders": 1100},  # 3个月前：85万
        {"month": 2, "target": 1200000, "orders": 1300}, # 2个月前：120万
        {"month": 1, "target": 1500000, "orders": 1500}, # 上个月：150万
    ]
    
    total_orders_created = 0
    total_revenue = 0
    
    for month_data in months_data:
        month_ago = month_data["month"]
        target_revenue = month_data["target"]
        orders_count = month_data["orders"]
        
        print(f"📅 生成 {month_ago} 个月前数据：目标¥{target_revenue:,}，{orders_count}个订单")
        
        month_revenue = 0
        batch_values = []
        
        # 在该月内分布订单
        for i in range(orders_count):
            # 订单日期在该月内随机分布
            base_date = datetime.now() - timedelta(days=month_ago * 30)
            random_day = random.randint(0, 29)
            order_date = (base_date + timedelta(days=random_day)).strftime('%Y-%m-%d')
            
            order_no = f"SO-{order_date.replace('-', '')}-{50000 + total_orders_created + i}"
            customer_id = random.randint(1, 15)  # 使用新的客户ID范围
            warehouse_id = random.randint(1, 2)
            
            # 订单金额：确保达到月目标
            remaining_orders = orders_count - i
            remaining_target = target_revenue - month_revenue
            
            if remaining_orders > 0:
                avg_needed = remaining_target / remaining_orders
                # 在平均值基础上增加随机性
                base_amount = max(200, int(avg_needed * random.uniform(0.3, 1.8)))
            else:
                base_amount = random.randint(500, 3000)
            
            # 确保金额合理
            total_amount = min(max(base_amount, 200), 25000)
            
            discount_amount = random.randint(0, min(300, total_amount // 15)) if random.random() < 0.2 else 0
            final_amount = total_amount - discount_amount
            total_cost = round(total_amount * 0.58)  # 成本58%，利润率42%
            gross_profit = final_amount - total_cost
            profit_margin = round((gross_profit / final_amount) * 100) if final_amount > 0 else 0
            
            status = random.choices(['completed', 'pending'], weights=[95, 5])[0]  # 95%完成率
            
            if status == 'completed':
                month_revenue += final_amount
            
            batch_values.append(f"('{order_no}', {customer_id}, {warehouse_id}, '{order_date}', {total_amount}, {discount_amount}, {final_amount}, {final_amount}, {total_cost}, {gross_profit}, {profit_margin}, 'paid', '{status}', '增长期数据-{month_ago}月前')")
        
        # 批量插入该月数据
        batch_size = 100
        for j in range(0, len(batch_values), batch_size):
            batch = batch_values[j:j+batch_size]
            sql = f"""INSERT INTO sales_orders (order_no, customer_id, warehouse_id, order_date, 
                     total_amount, discount_amount, final_amount, paid_amount, total_cost, gross_profit, 
                     profit_margin, payment_status, status, remarks) 
                     VALUES {', '.join(batch)};"""
            
            response = import_data(token, "sales_orders", sql)
            if response.status_code == 200:
                print(f"  ✅ {month_ago}月前 批次 {j//batch_size + 1} 成功")
            
            time.sleep(0.5)
        
        total_orders_created += orders_count
        total_revenue += month_revenue
        
        print(f"  📊 {month_ago}月前完成：{orders_count}单，¥{month_revenue:,.0f}")
        time.sleep(1)
    
    print(f"\n🎯 增长数据创建完成：")
    print(f"  总订单：{total_orders_created:,}个")
    print(f"  总收入：¥{total_revenue:,.0f}")
    print(f"  增长率：从30万到150万（500%增长）")
    
    return total_orders_created

def create_premium_items(token):
    """创建高价值商品线 - 展示产品多样性"""
    print("📱 创建高价值产品线...")
    
    premium_items = [
        # 高端空调系列
        ("AC001", "格力KFR-72LW/NhZeB3W 3匹变频中央空调", "GREE KFR-72LW/NhZeB3W 3HP Central AC", "中央空调", "套", 8800, 12800, 1, 5, 30),
        ("AC002", "美的MDS-H120W 5匹商用中央空调", "Midea MDS-H120W 5HP Commercial AC", "商用空调", "套", 15800, 22800, 2, 3, 20),
        ("AC003", "海尔KFR-50LW/09UAP21AU1 2匹智能空调", "Haier Smart AC 2HP WiFi", "智能空调", "台", 4200, 5800, 3, 8, 50),
        
        # 高端电视系列
        ("TV001", "三星QN85A 85英寸8K QLED电视", "Samsung QN85A 85\" 8K QLED TV", "8K电视", "台", 25000, 35000, 5, 2, 15),
        ("TV002", "LG OLED77C1PCB 77英寸OLED电视", "LG OLED77C1PCB 77\" OLED TV", "OLED电视", "台", 18000, 25000, 6, 3, 20),
        ("TV003", "索尼XR-65A90J 65英寸OLED电视", "Sony XR-65A90J 65\" OLED TV", "OLED电视", "台", 22000, 28000, 7, 2, 18),
        
        # 高端冰箱系列
        ("RF001", "西门子KA92NV02TI 610升对开门冰箱", "Siemens KA92NV02TI 610L Refrigerator", "对开门冰箱", "台", 8500, 12000, 8, 4, 25),
        ("RF002", "博世KAN92V02TI 569升多门冰箱", "Bosch KAN92V02TI 569L Multi-Door", "多门冰箱", "台", 9800, 13500, 13, 3, 22),
        ("RF003", "松下NR-W56S1 561升风冷无霜冰箱", "Panasonic NR-W56S1 561L Frost Free", "风冷冰箱", "台", 7200, 9800, 7, 5, 30),
        
        # 高端洗衣机系列
        ("WM001", "小天鹅TG120VT096WDG 12公斤滚筒洗衣机", "Little Swan 12kg Front Load Washer", "滚筒洗衣机", "台", 3800, 5200, 3, 6, 35),
        ("WM002", "海尔EG10012B29W 10公斤直驱洗衣机", "Haier 10kg Direct Drive Washer", "直驱洗衣机", "台", 4200, 5800, 3, 5, 30),
        
        # 厨房电器系列
        ("KT001", "方太EMD20T.B 嵌入式微波炉", "Fotile EMD20T.B Built-in Microwave", "嵌入式微波炉", "台", 2800, 3800, 9, 8, 40),
        ("KT002", "老板CXW-260-67A7 大吸力油烟机", "Robam CXW-260-67A7 Range Hood", "油烟机", "台", 2200, 3200, 10, 10, 50),
        ("KT003", "华帝i11083 燃气灶具", "Vatti i11083 Gas Stove", "燃气灶", "台", 1200, 1800, 11, 15, 60),
        
        # 生活电器
        ("LA001", "戴森V15 Detect无线吸尘器", "Dyson V15 Detect Cordless Vacuum", "无线吸尘器", "台", 3200, 4500, 12, 12, 40),
        ("LA002", "飞利浦HR2876/00 破壁料理机", "Philips HR2876/00 Blender", "破壁机", "台", 800, 1200, 14, 20, 80),
        ("LA003", "美的MG38CB-AA 微蒸烤一体机", "Midea MG38CB-AA Steam Oven", "蒸烤箱", "台", 2500, 3500, 2, 8, 35),
        
        # 智能家居
        ("SH001", "小米米家智能门锁", "Mi Smart Door Lock", "智能门锁", "套", 800, 1200, 9, 25, 100),
        ("SH002", "华为智慧屏V55i-B 55英寸智慧屏", "Huawei Smart Screen V55i-B", "智慧屏", "台", 3800, 5200, 10, 8, 40),
        ("SH003", "海康威视萤石智能摄像头", "Hikvision Smart Camera", "智能摄像头", "台", 300, 500, 15, 30, 150),
        
        # 商用设备
        ("CM001", "海尔商用展示柜SC-340", "Haier Commercial Display Cooler", "商用展示柜", "台", 5800, 8500, 3, 5, 25),
        ("CM002", "美的商用洗碗机WQP12-W3602E-CN", "Midea Commercial Dishwasher", "商用洗碗机", "台", 8200, 12000, 2, 3, 15)
    ]
    
    for code, name, en_name, category, unit, purchase_price, sale_price, supplier_id, min_stock, max_stock in premium_items:
        sql = f"""INSERT OR REPLACE INTO items (code, name, en_name, category, unit, purchase_price, sale_price, 
                 supplier_id, min_stock, max_stock, status, created_at, updated_at) 
                 VALUES ('{code}', '{name}', '{en_name}', '{category}', '{unit}', {purchase_price}, {sale_price}, 
                 {supplier_id}, {min_stock}, {max_stock}, 'active', datetime('now'), datetime('now'));"""
        
        response = import_data(token, "items", sql)
        if response.status_code == 200:
            print(f"✅ 高价值商品 {name} 创建成功")
        else:
            print(f"❌ 商品 {name} 创建失败: {response.text}")
        
        time.sleep(0.1)

def main():
    print("🏦 创建投资级别的完美Demo数据")
    print("=" * 70)
    print("🎯 投资方视角：寻找高增长、高价值、有潜力的企业")
    print("=" * 70)
    
    # 登录
    token = login()
    if not token:
        print("❌ 登录失败，退出")
        return
    
    print("✅ 登录成功")
    
    # 创建高价值数据
    print("\n🚀 第一步：建立强大的商业网络...")
    create_premium_customers(token)
    time.sleep(2)
    
    print("\n🚀 第二步：构建顶级供应链...")
    create_premium_suppliers(token)
    time.sleep(2)
    
    print("\n🚀 第三步：扩展高价值产品线...")
    create_premium_items(token)
    time.sleep(2)
    
    print("\n🚀 第四步：创建增长轨迹数据...")
    orders_created = create_growth_trajectory_orders(token)
    
    # 获取最终统计
    print("\n📊 投资级Demo数据统计:")
    response = requests.get(f"{RAILWAY_URL}/data-import/stats", 
                          headers={"Authorization": f"Bearer {token}"})
    if response.status_code == 200:
        stats = response.json()
        for table, count in stats.items():
            print(f"  {table}: {count:,} 条记录")
    
    print("\n🏦🏦🏦 投资级别Demo系统创建完成！")
    print("=" * 70)
    print("💎 投资亮点：")
    print("📈 强劲增长：6个月内从30万增长到150万（500%增长）")
    print("👑 高价值客户：腾讯、华为、万科、恒大等知名企业客户")
    print("🏭 顶级供应链：格力、美的、三星、LG等国际品牌")
    print("📱 产品多样化：从家用到商用，从传统到智能")
    print("🌍 国际化：中国+南非双市场布局")
    print("💰 健康财务：42%利润率，95%订单完成率")
    print("🎯 市场地位：大型家电连锁领导者")
    print("📊 数据驱动：完整的业务分析和报表系统")
    print("\n🚀 这是一个值得投资的高增长企业！")

if __name__ == "__main__":
    main()
