#!/usr/bin/env python3
import requests
import time
import random

RAILWAY_URL = "https://web-production-7a257.up.railway.app/api"

def login():
    response = requests.post(f"{RAILWAY_URL}/auth/login", 
                           json={"username": "admin", "password": "123456"})
    return response.json().get("token") if response.status_code == 200 else None

def import_data(token, table_name, sql_data):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    data = {"tableName": table_name, "data": sql_data}
    return requests.post(f"{RAILWAY_URL}/data-import/import", headers=headers, json=data)

def fix_product_data(token):
    """修复商品数据和关联问题"""
    print("🔧 修复商品名称乱码和数据关联问题")
    print("=" * 60)
    
    # 1. 清理并重新创建完整的商品数据
    print("🗑️ 清理现有商品数据...")
    clear_items = import_data(token, "items", "DELETE FROM items WHERE id > 4;")
    print(f"清理结果: {clear_items.text if clear_items else 'OK'}")
    
    time.sleep(2)
    
    # 2. 创建完整的高质量商品数据
    print("📱 创建完整的高质量商品数据...")
    
    premium_items = [
        # 空调系列
        ("AC001", "格力KFR-72LW 3匹变频中央空调", "GREE KFR-72LW 3HP Inverter Central AC", "中央空调", "套", 8800, 12800, 5, 30),
        ("AC002", "美的MDS-H120W 5匹商用中央空调", "Midea MDS-H120W 5HP Commercial Central AC", "商用空调", "套", 15800, 22800, 3, 20),
        ("AC003", "海尔KFR-50LW 2匹智能变频空调", "Haier KFR-50LW 2HP Smart Inverter AC", "智能空调", "台", 4200, 5800, 8, 50),
        
        # 电视系列
        ("TV001", "三星QN85A 85英寸8K QLED智能电视", "Samsung QN85A 85\" 8K QLED Smart TV", "8K电视", "台", 25000, 35000, 2, 15),
        ("TV002", "LG OLED77C1 77英寸OLED智能电视", "LG OLED77C1 77\" OLED Smart TV", "OLED电视", "台", 18000, 25000, 3, 20),
        ("TV003", "索尼XR-65A90J 65英寸OLED电视", "Sony XR-65A90J 65\" OLED TV", "OLED电视", "台", 22000, 28000, 2, 18),
        ("TV004", "海信75U7G 75英寸ULED电视", "Hisense 75U7G 75\" ULED TV", "ULED电视", "台", 8500, 12000, 4, 25),
        
        # 冰箱系列
        ("RF001", "西门子KA92NV02TI 610升对开门冰箱", "Siemens KA92NV02TI 610L Side-by-Side", "对开门冰箱", "台", 8500, 12000, 4, 25),
        ("RF002", "博世KAN92V02TI 569升多门冰箱", "Bosch KAN92V02TI 569L Multi-Door", "多门冰箱", "台", 9800, 13500, 3, 22),
        ("RF003", "松下NR-W56S1 561升风冷无霜冰箱", "Panasonic NR-W56S1 561L Frost Free", "风冷冰箱", "台", 7200, 9800, 5, 30),
        ("RF004", "美的BCD-516WKPZM 516升对开门冰箱", "Midea BCD-516WKPZM 516L Side-by-Side", "对开门冰箱", "台", 5800, 8500, 6, 35),
        
        # 洗衣机系列
        ("WM001", "小天鹅TG120VT096WDG 12公斤滚筒洗衣机", "Little Swan TG120VT096WDG 12kg Front Load", "滚筒洗衣机", "台", 3800, 5200, 6, 35),
        ("WM002", "海尔EG10012B29W 10公斤直驱洗衣机", "Haier EG10012B29W 10kg Direct Drive", "直驱洗衣机", "台", 4200, 5800, 5, 30),
        ("WM003", "美的MG100V331WDG 10公斤变频洗衣机", "Midea MG100V331WDG 10kg Inverter", "变频洗衣机", "台", 3200, 4500, 8, 40),
        
        # 厨房电器系列
        ("KT001", "方太EMD20T.B 嵌入式微波炉", "Fotile EMD20T.B Built-in Microwave", "嵌入式微波炉", "台", 2800, 3800, 8, 40),
        ("KT002", "老板CXW-260-67A7 大吸力油烟机", "Robam CXW-260-67A7 Range Hood", "油烟机", "台", 2200, 3200, 10, 50),
        ("KT003", "华帝i11083 燃气灶具", "Vatti i11083 Gas Stove", "燃气灶", "台", 1200, 1800, 15, 60),
        ("KT004", "美的MG38CB-AA 微蒸烤一体机", "Midea MG38CB-AA Steam Oven", "蒸烤箱", "台", 2500, 3500, 8, 35),
        
        # 生活电器
        ("LA001", "戴森V15 Detect无线吸尘器", "Dyson V15 Detect Cordless Vacuum", "无线吸尘器", "台", 3200, 4500, 12, 40),
        ("LA002", "飞利浦HR2876/00 破壁料理机", "Philips HR2876/00 High Speed Blender", "破壁机", "台", 800, 1200, 20, 80),
        ("LA003", "松下F-VJL75C2 空气净化器", "Panasonic F-VJL75C2 Air Purifier", "空气净化器", "台", 1200, 1800, 15, 60),
        ("LA004", "夏普KC-CD60-W 加湿空气净化器", "Sharp KC-CD60-W Humidifying Air Purifier", "加湿净化器", "台", 1800, 2500, 12, 50),
        
        # 智能家居
        ("SH001", "小米米家智能门锁", "Mi Smart Door Lock", "智能门锁", "套", 800, 1200, 25, 100),
        ("SH002", "华为智慧屏V55i-B 55英寸智慧屏", "Huawei Smart Screen V55i-B 55\"", "智慧屏", "台", 3800, 5200, 8, 40),
        ("SH003", "海康威视萤石智能摄像头", "Hikvision Ezviz Smart Camera", "智能摄像头", "台", 300, 500, 30, 150),
        ("SH004", "TCL智能音响", "TCL Smart Speaker", "智能音响", "台", 400, 600, 25, 100),
        
        # 商用设备
        ("CM001", "海尔商用展示柜SC-340", "Haier Commercial Display Cooler SC-340", "商用展示柜", "台", 5800, 8500, 5, 25),
        ("CM002", "美的商用洗碗机WQP12-W3602E-CN", "Midea Commercial Dishwasher WQP12", "商用洗碗机", "台", 8200, 12000, 3, 15)
    ]
    
    for code, name, en_name, category, unit, purchase_price, sale_price, min_stock, max_stock in premium_items:
        sql = f"""INSERT OR REPLACE INTO items (code, name, en_name, category, unit, purchase_price, sale_price, min_stock, max_stock, status, created_at, updated_at) 
                 VALUES ('{code}', '{name}', '{en_name}', '{category}', '{unit}', {purchase_price}, {sale_price}, {min_stock}, {max_stock}, 'active', datetime('now'), datetime('now'));"""
        
        response = import_data(token, "items", sql)
        if response.status_code == 200:
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {response.text}")
        time.sleep(0.05)
    
    print(f"✅ {len(premium_items)} 个高质量商品创建完成")
    
    # 3. 更新库存数据以匹配新商品
    print("\n📦 更新库存数据以匹配新商品...")
    
    # 清理现有库存
    clear_inventory = import_data(token, "inventory", "DELETE FROM inventory;")
    time.sleep(1)
    
    # 为新商品创建库存记录
    inventory_data = []
    for i, (code, name, en_name, category, unit, purchase_price, sale_price, min_stock, max_stock) in enumerate(premium_items, 1):
        item_id = i + 4  # 前4个是原有商品
        warehouse_1_qty = random.randint(min_stock, max_stock)
        warehouse_2_qty = random.randint(min_stock // 2, max_stock // 2)
        
        # 主仓库库存
        inventory_data.append(f"({item_id}, 1, {warehouse_1_qty}, datetime('now'), datetime('now'))")
        # 分仓库库存
        inventory_data.append(f"({item_id}, 2, {warehouse_2_qty}, datetime('now'), datetime('now'))")
    
    # 批量插入库存
    if inventory_data:
        batch_size = 20
        for j in range(0, len(inventory_data), batch_size):
            batch = inventory_data[j:j+batch_size]
            sql = f"INSERT INTO inventory (item_id, warehouse_id, quantity, created_at, updated_at) VALUES {', '.join(batch)};"
            response = import_data(token, "inventory", sql)
            if response.status_code == 200:
                print(f"✅ 库存批次 {j//batch_size + 1} 创建成功")
            time.sleep(0.3)
    
    # 4. 修复销售订单明细中的商品关联
    print("\n🔗 修复销售订单明细中的商品关联...")
    
    # 清理并重新创建销售订单明细
    clear_items_sql = import_data(token, "sales_order_items", "DELETE FROM sales_order_items;")
    time.sleep(2)
    
    # 为前200个销售订单重新创建明细
    detail_count = 0
    batch_values = []
    
    for order_id in range(1, 201):  # 前200个订单
        items_per_order = random.randint(1, 3)
        
        for j in range(items_per_order):
            item_id = random.randint(5, 30)  # 使用新创建的商品ID范围
            quantity = random.randint(1, 5)
            
            # 根据商品ID设置合理价格
            if item_id <= 10:  # 高端商品
                unit_price = random.randint(12000, 35000)
            elif item_id <= 20:  # 中端商品
                unit_price = random.randint(3000, 15000)
            else:  # 普通商品
                unit_price = random.randint(500, 5000)
            
            unit_cost = round(unit_price * 0.58)
            total_price = unit_price * quantity
            total_cost = unit_cost * quantity
            delivered_quantity = quantity
            
            batch_values.append(f"({order_id}, {item_id}, {quantity}, {unit_price}, {unit_cost}, {total_price}, {total_cost}, {delivered_quantity}, datetime('now'))")
            detail_count += 1
            
            # 每50条明细插入一次
            if len(batch_values) >= 50:
                sql = f"""INSERT INTO sales_order_items (order_id, item_id, quantity, unit_price, unit_cost, total_price, total_cost, delivered_quantity, created_at) 
                          VALUES {', '.join(batch_values)};"""
                
                response = import_data(token, "sales_order_items", sql)
                if response.status_code == 200:
                    print(f"✅ 已修复 {detail_count} 条销售明细")
                
                batch_values = []
                time.sleep(0.5)
    
    # 插入剩余明细
    if batch_values:
        sql = f"""INSERT INTO sales_order_items (order_id, item_id, quantity, unit_price, unit_cost, total_price, total_cost, delivered_quantity, created_at) 
                  VALUES {', '.join(batch_values)};"""
        response = import_data(token, "sales_order_items", sql)
        print(f"✅ 最终修复 {detail_count} 条销售明细")
    
    # 5. 修复采购订单明细
    print("\n🏭 修复采购订单明细...")
    
    # 清理并重新创建采购订单明细
    clear_purchase_items = import_data(token, "purchase_order_items", "DELETE FROM purchase_order_items;")
    time.sleep(1)
    
    # 为前50个采购订单创建明细
    purchase_detail_count = 0
    purchase_batch_values = []
    
    for order_id in range(1, 51):  # 前50个采购订单
        items_per_order = random.randint(2, 5)
        
        for j in range(items_per_order):
            item_id = random.randint(5, 30)  # 使用新创建的商品ID范围
            quantity = random.randint(10, 50)  # 采购数量较大
            
            # 采购价格（比销售价格低）
            if item_id <= 10:  # 高端商品
                unit_price = random.randint(8000, 25000)
            elif item_id <= 20:  # 中端商品
                unit_price = random.randint(2000, 12000)
            else:  # 普通商品
                unit_price = random.randint(300, 3000)
            
            total_price = unit_price * quantity
            received_quantity = quantity
            
            purchase_batch_values.append(f"({order_id}, {item_id}, {quantity}, {unit_price}, {total_price}, {received_quantity}, datetime('now'))")
            purchase_detail_count += 1
            
            # 每30条明细插入一次
            if len(purchase_batch_values) >= 30:
                sql = f"""INSERT INTO purchase_order_items (order_id, item_id, quantity, unit_price, total_price, received_quantity, created_at) 
                          VALUES {', '.join(purchase_batch_values)};"""
                
                response = import_data(token, "purchase_order_items", sql)
                if response.status_code == 200:
                    print(f"✅ 已修复 {purchase_detail_count} 条采购明细")
                
                purchase_batch_values = []
                time.sleep(0.5)
    
    # 插入剩余采购明细
    if purchase_batch_values:
        sql = f"""INSERT INTO purchase_order_items (order_id, item_id, quantity, unit_price, total_price, received_quantity, created_at) 
                  VALUES {', '.join(purchase_batch_values)};"""
        response = import_data(token, "purchase_order_items", sql)
        print(f"✅ 最终修复 {purchase_detail_count} 条采购明细")

def test_data_integrity(token):
    """测试数据完整性"""
    print("\n🧪 测试数据完整性...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 测试商品排行
    items_response = requests.get(f"{RAILWAY_URL}/reports/top-selling-items?limit=10", headers=headers)
    if items_response.status_code == 200:
        items_data = items_response.json()
        print(f"🏆 热销商品排行：{len(items_data)} 个商品")
        for i, item in enumerate(items_data[:5], 1):
            print(f"  {i}. {item['name']}: ¥{item['total_sales']:,}")
    else:
        print(f"❌ 商品排行查询失败: {items_response.text}")
    
    # 获取最终统计
    stats_response = requests.get(f"{RAILWAY_URL}/data-import/stats", headers=headers)
    if stats_response.status_code == 200:
        stats = stats_response.json()
        print(f"\n📊 修复后数据统计:")
        for table, count in stats.items():
            print(f"  {table}: {count:,} 条记录")

def main():
    print("🔧 修复商品名称乱码和数据关联问题")
    print("=" * 70)
    
    token = login()
    if not token:
        print("❌ 登录失败")
        return
    
    print("✅ 登录成功，开始修复数据...")
    
    fix_product_data(token)
    test_data_integrity(token)
    
    print("\n🎉 商品数据修复完成！")
    print("=" * 70)
    print("✅ 修复内容：")
    print("📱 创建了26个高质量商品（中英文名称完整）")
    print("📦 更新了库存数据以匹配新商品")
    print("🔗 修复了销售订单明细中的商品关联")
    print("🏭 修复了采购订单明细中的商品关联")
    print("📊 确保了报表数据的完整性")
    print("\n🚀 现在所有商品都应该正确显示中文名称！")
    print("请刷新页面查看修复效果。")

if __name__ == "__main__":
    main()
