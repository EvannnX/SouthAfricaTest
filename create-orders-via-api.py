#!/usr/bin/env python3
import requests
import time
import random

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

def create_sales_orders(token):
    """通过销售API创建订单"""
    print("💰 通过API创建销售订单...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # 创建多个销售订单
    orders = [
        {
            "customer_id": 1,
            "warehouse_id": 1,
            "items": [
                {"item_id": 1, "quantity": 2, "unit_price": 2899.00, "discount": 0}
            ],
            "tax_rate": 0.15,
            "discount": 0,
            "notes": "深圳电器城采购格力空调"
        },
        {
            "customer_id": 2,
            "warehouse_id": 1,
            "items": [
                {"item_id": 2, "quantity": 1, "unit_price": 3599.00, "discount": 100},
                {"item_id": 4, "quantity": 1, "unit_price": 3199.00, "discount": 0}
            ],
            "tax_rate": 0.15,
            "discount": 200,
            "notes": "广州批发商城套装订单"
        },
        {
            "customer_id": 3,
            "warehouse_id": 2,
            "items": [
                {"item_id": 3, "quantity": 3, "unit_price": 2399.00, "discount": 50}
            ],
            "tax_rate": 0.15,
            "discount": 100,
            "notes": "东莞连锁超市批量采购"
        },
        {
            "customer_id": 4,
            "warehouse_id": 1,
            "items": [
                {"item_id": 1, "quantity": 5, "unit_price": 2899.00, "discount": 200},
                {"item_id": 2, "quantity": 2, "unit_price": 3599.00, "discount": 150}
            ],
            "tax_rate": 0.15,
            "discount": 500,
            "notes": "佛山家电公司大批量订单"
        },
        {
            "customer_id": 5,
            "warehouse_id": 1,
            "items": [
                {"item_id": 4, "quantity": 1, "unit_price": 3199.00, "discount": 0}
            ],
            "tax_rate": 0.15,
            "discount": 0,
            "notes": "珠海电器行单品采购"
        }
    ]
    
    success_count = 0
    for i, order_data in enumerate(orders):
        try:
            response = requests.post(f"{RAILWAY_URL}/sales", 
                                   headers=headers, json=order_data)
            
            if response.status_code == 200 or response.status_code == 201:
                success_count += 1
                result = response.json()
                print(f"✅ 销售订单 {i+1} 创建成功: {result.get('order_no', 'N/A')}")
            else:
                print(f"❌ 销售订单 {i+1} 创建失败: {response.text}")
            
            time.sleep(1)
            
        except Exception as e:
            print(f"⚠️ 创建销售订单 {i+1} 时出错: {e}")
    
    print(f"📈 销售订单: {success_count}/{len(orders)} 创建成功")

def create_purchase_orders(token):
    """通过采购API创建订单"""
    print("🛒 通过API创建采购订单...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # 创建多个采购订单
    orders = [
        {
            "supplier_id": 1,
            "warehouse_id": 1,
            "items": [
                {"item_id": 1, "quantity": 50, "unit_price": 2200.00}
            ],
            "tax_rate": 0.15,
            "notes": "格力空调大批量采购"
        },
        {
            "supplier_id": 2,
            "warehouse_id": 1,
            "items": [
                {"item_id": 4, "quantity": 30, "unit_price": 2400.00}
            ],
            "tax_rate": 0.15,
            "notes": "美的冰箱补货采购"
        },
        {
            "supplier_id": 3,
            "warehouse_id": 2,
            "items": [
                {"item_id": 2, "quantity": 25, "unit_price": 2800.00},
                {"item_id": 3, "quantity": 20, "unit_price": 1800.00}
            ],
            "tax_rate": 0.15,
            "notes": "海尔多品类采购"
        },
        {
            "supplier_id": 4,
            "warehouse_id": 1,
            "items": [
                {"item_id": 2, "quantity": 15, "unit_price": 2800.00}
            ],
            "tax_rate": 0.15,
            "notes": "TCL电视采购"
        }
    ]
    
    success_count = 0
    for i, order_data in enumerate(orders):
        try:
            response = requests.post(f"{RAILWAY_URL}/purchases", 
                                   headers=headers, json=order_data)
            
            if response.status_code == 200 or response.status_code == 201:
                success_count += 1
                result = response.json()
                print(f"✅ 采购订单 {i+1} 创建成功: {result.get('order_no', 'N/A')}")
            else:
                print(f"❌ 采购订单 {i+1} 创建失败: {response.text}")
            
            time.sleep(1)
            
        except Exception as e:
            print(f"⚠️ 创建采购订单 {i+1} 时出错: {e}")
    
    print(f"📈 采购订单: {success_count}/{len(orders)} 创建成功")

def main():
    print("🚀 通过API创建订单数据")
    print("=" * 30)
    
    # 登录
    token = login()
    if not token:
        print("❌ 登录失败，退出")
        return
    
    print("✅ 登录成功")
    
    # 创建订单
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
    
    print("\n🎉 订单创建完成！")
    print("现在您的Demo系统有完整的数据了：")
    print("- 6个客户（深圳电器城、广州批发商城等）")
    print("- 4个供应商（格力、美的、海尔、TCL）")
    print("- 5个销售订单（通过API创建）")
    print("- 4个采购订单（通过API创建）")
    print("- 20个商品数据")
    print("- 完整的库存信息")
    print("\n请刷新页面查看您的Demo系统！")

if __name__ == "__main__":
    main()
