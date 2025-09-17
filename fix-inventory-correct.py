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

def fix_inventory_simple(token):
    """使用简化的库存字段修复库存数据"""
    print("📦 修复库存数据（使用正确字段）...")
    
    # 为商品ID 5-32 创建库存
    inventory_records = []
    
    for item_id in range(5, 33):  # 商品ID 5-32
        # 主仓库库存
        main_qty = random.randint(20, 100)
        inventory_records.append(f"({item_id}, 1, {main_qty})")
        
        # 分仓库库存
        branch_qty = random.randint(10, 50)
        inventory_records.append(f"({item_id}, 2, {branch_qty})")
    
    # 批量插入库存（使用基本字段）
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

def main():
    token = login()
    if not token:
        print("❌ 登录失败")
        return
    
    fix_inventory_simple(token)
    
    # 测试结果
    headers = {"Authorization": f"Bearer {token}"}
    stats_response = requests.get(f"{RAILWAY_URL}/data-import/stats", headers=headers)
    if stats_response.status_code == 200:
        stats = stats_response.json()
        print(f"📊 库存修复后统计:")
        print(f"  inventory: {stats.get('inventory', 0)} 条记录")

if __name__ == "__main__":
    main()
