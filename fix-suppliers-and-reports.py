#!/usr/bin/env python3
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

def fix_suppliers(token):
    """修复供应商数据 - 使用正确字段"""
    print("🏭 修复顶级供应商数据...")
    
    suppliers = [
        ("SUP001", "格力电器股份有限公司", "张全球销售总监", "400-836-5315", "zhang.global@gree.com", "珠海市香洲区格力路1号", "91440400MA4W2XYZ12"),
        ("SUP002", "美的集团股份有限公司", "李战略合作总监", "400-889-9315", "li.strategic@midea.com", "佛山市顺德区美的大道6号", "91440600MA4W3ABC34"),
        ("SUP003", "海尔智家股份有限公司", "王华南区总经理", "400-699-9999", "wang.south@haier.com", "青岛市崂山区海尔路1号", "91370200MA4W4DEF56"),
        ("SUP004", "TCL科技集团股份有限公司", "赵全球供应链总监", "400-812-3456", "zhao.supply@tcl.com", "惠州市仲恺区TCL科技园", "91441300MA4W5GHI78"),
        ("SUP005", "三星电子(中国)有限公司", "金亚太区销售总监", "400-810-5858", "kim.apac@samsung.com", "北京市朝阳区三星总部", "91110000MA4W6JKL90"),
        ("SUP006", "LG电子(中国)有限公司", "朴华南区总经理", "400-819-9999", "park.south@lge.com", "北京市朝阳区LG双子座大厦", "91110000MA4W7MNO12"),
        ("SUP007", "松下电器(中国)有限公司", "田中销售总监", "400-810-0781", "tanaka.sales@panasonic.cn", "北京市朝阳区松下大厦", "91110000MA4W8PQR34"),
        ("SUP008", "西门子家电(中国)有限公司", "施密特总经理", "400-616-2020", "schmidt@siemens.com", "南京市江宁区西门子工业园", "91320100MA4W9STU56"),
        ("SUP009", "小米生态链-云米科技", "陈生态合作总监", "400-100-5678", "chen.eco@viomi.com", "佛山市顺德区云米总部", "91440600MA4WABCD78"),
        ("SUP010", "华为智能家居事业部", "刘事业部副总裁", "400-822-9999", "liu.smarthome@huawei.com", "深圳市龙岗区华为基地", "91440300MA4WEFGH90"),
        ("SUP011", "South African Appliances Ltd", "John van der Merwe", "+27-11-234-5678", "john@saappliances.co.za", "Johannesburg Industrial Area", "ZA1234567890"),
        ("SUP012", "Cape Electronics Manufacturing", "Nomsa Mbeki", "+27-21-345-6789", "nomsa@capeelectronics.co.za", "Cape Town Industrial Zone", "ZA2345678901"),
        ("SUP013", "德国博世家电集团", "Mueller销售总监", "400-880-0808", "mueller@bosch.com", "上海市浦东新区博世中国总部", "91310000MA4WIJKL12"),
        ("SUP014", "意大利阿里斯顿集团", "Rossi亚太总监", "400-820-1811", "rossi@ariston.com", "无锡市阿里斯顿工业园", "91320200MA4WMNOP34"),
        ("SUP015", "日本夏普电器", "佐藤华南总代理", "400-810-8888", "sato@sharp.cn", "广州市天河区夏普大厦", "91440100MA4WQRST56")
    ]
    
    for code, name, contact, phone, email, address, tax_no in suppliers:
        sql = f"""INSERT OR REPLACE INTO suppliers (code, name, contact_person, phone, email, address, 
                 tax_number, status, created_at, updated_at) 
                 VALUES ('{code}', '{name}', '{contact}', '{phone}', '{email}', '{address}', 
                 '{tax_no}', 'active', datetime('now'), datetime('now'));"""
        
        response = import_data(token, "suppliers", sql)
        if response.status_code == 200:
            print(f"✅ 顶级供应商 {name} 创建成功")
        time.sleep(0.1)

def fix_items(token):
    """修复商品数据 - 使用正确字段"""
    print("📱 修复高价值产品线...")
    
    items = [
        ("AC001", "格力KFR-72LW 3匹变频中央空调", "GREE 3HP Central AC", "中央空调", "套", 8800, 12800, 5, 30),
        ("AC002", "美的MDS-H120W 5匹商用空调", "Midea 5HP Commercial AC", "商用空调", "套", 15800, 22800, 3, 20),
        ("TV001", "三星85英寸8K QLED电视", "Samsung 85\" 8K QLED", "8K电视", "台", 25000, 35000, 2, 15),
        ("TV002", "LG 77英寸OLED电视", "LG 77\" OLED TV", "OLED电视", "台", 18000, 25000, 3, 20),
        ("RF001", "西门子610升对开门冰箱", "Siemens 610L Refrigerator", "对开门冰箱", "台", 8500, 12000, 4, 25),
        ("RF002", "博世569升多门冰箱", "Bosch 569L Multi-Door", "多门冰箱", "台", 9800, 13500, 3, 22),
        ("WM001", "小天鹅12公斤滚筒洗衣机", "Little Swan 12kg Washer", "滚筒洗衣机", "台", 3800, 5200, 6, 35),
        ("KT001", "方太嵌入式微波炉", "Fotile Built-in Microwave", "嵌入式微波炉", "台", 2800, 3800, 8, 40),
        ("LA001", "戴森V15无线吸尘器", "Dyson V15 Cordless Vacuum", "无线吸尘器", "台", 3200, 4500, 12, 40),
        ("SH001", "小米智能门锁", "Mi Smart Door Lock", "智能门锁", "套", 800, 1200, 25, 100),
        ("SH002", "华为55英寸智慧屏", "Huawei 55\" Smart Screen", "智慧屏", "台", 3800, 5200, 8, 40),
        ("CM001", "海尔商用展示柜", "Haier Commercial Cooler", "商用展示柜", "台", 5800, 8500, 5, 25)
    ]
    
    for code, name, en_name, category, unit, purchase_price, sale_price, min_stock, max_stock in items:
        sql = f"""INSERT OR REPLACE INTO items (code, name, en_name, category, unit, purchase_price, sale_price, 
                 min_stock, max_stock, status, created_at, updated_at) 
                 VALUES ('{code}', '{name}', '{en_name}', '{category}', '{unit}', {purchase_price}, {sale_price}, 
                 {min_stock}, {max_stock}, 'active', datetime('now'), datetime('now'));"""
        
        response = import_data(token, "items", sql)
        if response.status_code == 200:
            print(f"✅ 高价值商品 {name} 创建成功")
        time.sleep(0.1)

def main():
    print("🔧 修复供应商、商品数据")
    print("=" * 50)
    
    # 登录
    token = login()
    if not token:
        print("❌ 登录失败，退出")
        return
    
    print("✅ 登录成功")
    
    # 修复数据
    fix_suppliers(token)
    time.sleep(2)
    fix_items(token)
    
    # 获取最终统计
    print("\n📊 修复后数据统计:")
    response = requests.get(f"{RAILWAY_URL}/data-import/stats", 
                          headers={"Authorization": f"Bearer {token}"})
    if response.status_code == 200:
        stats = response.json()
        for table, count in stats.items():
            print(f"  {table}: {count:,} 条记录")
    
    print("\n✅ 数据修复完成！")
    print("现在检查报表分析功能...")

if __name__ == "__main__":
    main()
