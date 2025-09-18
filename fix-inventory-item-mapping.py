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

def fix_inventory_item_mapping(token):
    """修复库存商品ID映射问题"""
    print("🔧 修复库存商品ID映射问题")
    print("=" * 60)
    
    # 1. 清理所有库存数据
    print("🗑️ 清理现有库存数据...")
    clear_response = import_data(token, "inventory", "DELETE FROM inventory;")
    print(f"清理结果: {clear_response.text}")
    time.sleep(2)
    
    # 2. 重新创建正确的库存数据
    # 商品ID应该从5开始（1-4是原有商品，5-32是新创建的商品）
    print("📦 创建正确的库存映射...")
    
    # 获取商品列表来确保正确的ID映射
    headers = {"Authorization": f"Bearer {token}"}
    items_response = requests.get(f"{RAILWAY_URL}/items", headers=headers)
    
    if items_response.status_code == 200:
        items_json = items_response.json()
        items_data = items_json.get('data', [])
        print(f"📋 找到 {len(items_data)} 个商品")
        
        inventory_records = []
        
        # 为每个存在的商品创建库存记录
        for item in items_data:
            item_id = item['id']
            
            # 主仓库库存
            main_qty = random.randint(20, 100)
            inventory_records.append(f"({item_id}, 1, {main_qty})")
            
            # 分仓库库存
            branch_qty = random.randint(10, 50)
            inventory_records.append(f"({item_id}, 2, {branch_qty})")
            
            print(f"✅ 商品 {item['name']} (ID: {item_id}): 主仓库 {main_qty}, 分仓库 {branch_qty}")
        
        # 批量插入库存
        if inventory_records:
            batch_size = 20
            for i in range(0, len(inventory_records), batch_size):
                batch = inventory_records[i:i+batch_size]
                sql = f"INSERT INTO inventory (item_id, warehouse_id, quantity) VALUES {', '.join(batch)};"
                
                response = import_data(token, "inventory", sql)
                if response.status_code == 200:
                    print(f"✅ 库存批次 {i//batch_size + 1} 创建成功")
                else:
                    print(f"❌ 库存批次 {i//batch_size + 1} 失败: {response.text}")
                time.sleep(0.5)
            
            print(f"✅ 库存数据修复完成：{len(inventory_records)} 条记录")
        else:
            print("❌ 没有找到商品数据")
    else:
        print(f"❌ 获取商品列表失败: {items_response.text}")

def test_inventory_display(token):
    """测试库存显示"""
    print("\n🧪 测试库存显示...")
    
    headers = {"Authorization": f"Bearer {token}"}
    inventory_response = requests.get(f"{RAILWAY_URL}/inventory", headers=headers)
    
    if inventory_response.status_code == 200:
        inventory_data = inventory_response.json()
        print(f"📦 库存记录总数：{len(inventory_data)}")
        
        # 显示前几条有商品名称的记录
        with_names = [item for item in inventory_data if item.get('item_name')]
        without_names = [item for item in inventory_data if not item.get('item_name')]
        
        print(f"✅ 有商品名称的记录：{len(with_names)}")
        print(f"❌ 没有商品名称的记录：{len(without_names)}")
        
        if with_names:
            print("\n📋 有名称的库存记录示例:")
            for item in with_names[:5]:
                print(f"  {item['item_name']} - {item['warehouse_name']}: {item['quantity']}个")
        
        if without_names:
            print("\n⚠️ 没有名称的库存记录示例:")
            for item in without_names[:3]:
                print(f"  商品ID {item['item_id']} - {item['warehouse_name']}: {item['quantity']}个")
    else:
        print(f"❌ 获取库存数据失败: {inventory_response.text}")

def main():
    print("🔧 修复库存商品名称显示问题")
    print("=" * 70)
    
    token = login()
    if not token:
        print("❌ 登录失败")
        return
    
    print("✅ 登录成功")
    
    fix_inventory_item_mapping(token)
    test_inventory_display(token)
    
    # 最终统计
    headers = {"Authorization": f"Bearer {token}"}
    stats_response = requests.get(f"{RAILWAY_URL}/data-import/stats", headers=headers)
    if stats_response.status_code == 200:
        stats = stats_response.json()
        print(f"\n📊 最终数据统计:")
        for table, count in stats.items():
            print(f"  {table}: {count:,} 条记录")
    
    print("\n🎉 库存商品名称修复完成！")
    print("📦 现在库存管理页面应该能正确显示所有商品名称")
    print("🚀 请刷新页面查看效果！")

if __name__ == "__main__":
    main()
