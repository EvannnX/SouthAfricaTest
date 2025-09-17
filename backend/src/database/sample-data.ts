import { db } from './init';

export const insertSampleData = async (): Promise<void> => {
  return new Promise((resolve) => {
    console.log('正在插入示例数据...');

    // 插入仓库数据
    db.run(`INSERT OR IGNORE INTO warehouses (id, name, location, manager) VALUES 
      (1, '主仓库', '深圳市南山区', '张经理'),
      (2, '分仓库', '深圳市福田区', '李经理')
    `, (err) => {
      if (err) console.error('插入仓库数据失败:', err);
      else console.log('仓库数据插入成功');
    });

    // 插入供应商数据
    db.run(`INSERT OR IGNORE INTO suppliers (id, name, contact_person, phone, email, address) VALUES 
      (1, 'ABC供应商', '王先生', '13800138001', 'wang@abc.com', '深圳市'),
      (2, 'XYZ供应商', '李女士', '13800138002', 'li@xyz.com', '广州市'),
      (3, '优质供应商', '陈经理', '13800138003', 'chen@youzhicom', '东莞市'),
      (4, '快捷供应商', '赵总', '13800138004', 'zhao@kuaijie.com', '惠州市')
    `, (err) => {
      if (err) console.error('插入供应商数据失败:', err);
      else console.log('供应商数据插入成功');
    });

    // 插入客户数据
    db.run(`INSERT OR IGNORE INTO customers (id, name, contact_person, phone, email, address, customer_type) VALUES 
      (1, '零售客户A', '张三', '13900139001', 'zhangsan@email.com', '深圳市罗湖区', 'retail'),
      (2, '批发客户B', '李四', '13900139002', 'lisi@email.com', '深圳市南山区', 'wholesale'),
      (3, '企业客户C', '王五', '13900139003', 'wangwu@email.com', '深圳市福田区', 'enterprise'),
      (4, 'VIP客户D', '赵六', '13900139004', 'zhaoliu@email.com', '深圳市宝安区', 'vip'),
      (5, '普通客户E', '孙七', '13900139005', 'sunqi@email.com', '深圳市龙岗区', 'retail'),
      (6, '合作伙伴F', '周八', '13900139006', 'zhouba@email.com', '深圳市盐田区', 'partner')
    `, (err) => {
      if (err) console.error('插入客户数据失败:', err);
      else console.log('客户数据插入成功');
    });

    // 插入商品数据
    db.run(`INSERT OR IGNORE INTO items (id, code, name, en_name, category, unit, purchase_price, sale_price, supplier_id, min_stock, max_stock) VALUES 
      (1, 'ITEM001', '空调', 'Air Conditioner', '制冷设备', '台', 2500.00, 3500.00, 1, 5, 50),
      (2, 'ITEM002', '冰箱', 'Refrigerator', '制冷设备', '台', 1800.00, 2500.00, 1, 3, 30),
      (3, 'ITEM003', '洗衣机', 'Washing Machine', '家用电器', '台', 1200.00, 1800.00, 2, 2, 25),
      (4, 'ITEM004', '电视机', 'Television', '电子产品', '台', 2000.00, 2800.00, 2, 3, 40),
      (5, 'ITEM005', '微波炉', 'Microwave', '厨房电器', '台', 400.00, 600.00, 3, 5, 20),
      (6, 'ITEM006', '电风扇', 'Electric Fan', '家用电器', '台', 150.00, 250.00, 3, 10, 50),
      (7, 'ITEM007', '热水器', 'Water Heater', '家用电器', '台', 800.00, 1200.00, 4, 2, 15),
      (8, 'ITEM008', '吸尘器', 'Vacuum Cleaner', '清洁设备', '台', 300.00, 500.00, 4, 3, 20)
    `, (err) => {
      if (err) console.error('插入商品数据失败:', err);
      else console.log('商品数据插入成功');
    });

    // 插入库存数据
    db.run(`INSERT OR IGNORE INTO inventory (item_id, warehouse_id, quantity) VALUES 
      (1, 1, 25), (1, 2, 15),
      (2, 1, 18), (2, 2, 12),
      (3, 1, 20), (3, 2, 8),
      (4, 1, 30), (4, 2, 15),
      (5, 1, 45), (5, 2, 25),
      (6, 1, 60), (6, 2, 40),
      (7, 1, 12), (7, 2, 8),
      (8, 1, 25), (8, 2, 15)
    `, (err) => {
      if (err) console.error('插入库存数据失败:', err);
      else console.log('库存数据插入成功');
    });

    // 插入一些示例销售订单（使用正确的商品ID）
    const sampleOrders = [
      { id: 1, order_number: 'SO20250917001', customer_id: 1, total_amount: 2899.00, tax_amount: 434.85, status: 'completed' },
      { id: 2, order_number: 'SO20250917002', customer_id: 2, total_amount: 6798.00, tax_amount: 1019.70, status: 'completed' },
      { id: 3, order_number: 'SO20250917003', customer_id: 1, total_amount: 3599.00, tax_amount: 539.85, status: 'pending' },
      { id: 4, order_number: 'SO20250917004', customer_id: 2, total_amount: 2399.00, tax_amount: 359.85, status: 'completed' },
      { id: 5, order_number: 'SO20250917005', customer_id: 1, total_amount: 3199.00, tax_amount: 479.85, status: 'completed' }
    ];

    sampleOrders.forEach((order, index) => {
      setTimeout(() => {
        db.run(`INSERT OR IGNORE INTO sales_orders (order_number, customer_id, total_amount, tax_amount, discount_amount, status, order_date, created_by) VALUES 
          (?, ?, ?, ?, 0, ?, datetime('now', '-${index} days'), 1)
        `, [order.order_number, order.customer_id, order.total_amount, order.tax_amount, order.status], (err) => {
          if (err) console.error(`插入销售订单${order.order_number}失败:`, err);
          else console.log(`销售订单${order.order_number}插入成功`);
        });
      }, index * 100);
    });

    // 插入销售订单明细（使用正确的商品ID和价格）
    const orderItems = [
      { order_id: 1, item_id: 1, quantity: 1, unit_price: 2899.00, amount: 2899.00 }, // 格力空调
      { order_id: 2, item_id: 1, quantity: 2, unit_price: 2899.00, amount: 5798.00 }, // 格力空调 x2
      { order_id: 3, item_id: 2, quantity: 1, unit_price: 3599.00, amount: 3599.00 }, // 海信电视
      { order_id: 4, item_id: 3, quantity: 1, unit_price: 2399.00, amount: 2399.00 }, // 小天鹅洗衣机
      { order_id: 5, item_id: 4, quantity: 1, unit_price: 3199.00, amount: 3199.00 }  // 美的冰箱
    ];

    orderItems.forEach((item, index) => {
      setTimeout(() => {
        db.run(`INSERT OR IGNORE INTO sales_order_items (order_id, item_id, quantity, unit_price, discount, amount) VALUES 
          (?, ?, ?, ?, 0, ?)
        `, [item.order_id, item.item_id, item.quantity, item.unit_price, item.amount], (err) => {
          if (err) console.error(`插入订单明细失败:`, err);
          else console.log(`订单${item.order_id}明细插入成功`);
        });
      }, (index + 10) * 100);
    });

    // 插入采购订单示例数据
    const purchaseOrders = [
      { order_number: 'PO20250917001', supplier_id: 1, total_amount: 44000.00, tax_amount: 6600.00, status: 'completed' },
      { order_number: 'PO20250917002', supplier_id: 2, total_amount: 66000.00, tax_amount: 9900.00, status: 'completed' },
      { order_number: 'PO20250917003', supplier_id: 1, total_amount: 36000.00, tax_amount: 5400.00, status: 'pending' }
    ];

    purchaseOrders.forEach((order, index) => {
      setTimeout(() => {
        db.run(`INSERT OR IGNORE INTO purchase_orders (order_number, supplier_id, total_amount, tax_amount, status, order_date, created_by) VALUES 
          (?, ?, ?, ?, ?, datetime('now', '-${index + 2} days'), 1)
        `, [order.order_number, order.supplier_id, order.total_amount, order.tax_amount, order.status], (err) => {
          if (err) console.error(`插入采购订单${order.order_number}失败:`, err);
          else console.log(`采购订单${order.order_number}插入成功`);
        });
      }, (index + 15) * 100);
    });

    // 插入采购订单明细
    const purchaseItems = [
      { order_id: 1, item_id: 1, quantity: 20, unit_price: 2200.00, amount: 44000.00 }, // 格力空调采购
      { order_id: 2, item_id: 2, quantity: 15, unit_price: 2800.00, amount: 42000.00 }, // 海信电视采购
      { order_id: 2, item_id: 4, quantity: 10, unit_price: 2400.00, amount: 24000.00 }, // 美的冰箱采购
      { order_id: 3, item_id: 3, quantity: 20, unit_price: 1800.00, amount: 36000.00 }  // 小天鹅洗衣机采购
    ];

    purchaseItems.forEach((item, index) => {
      setTimeout(() => {
        db.run(`INSERT OR IGNORE INTO purchase_order_items (order_id, item_id, quantity, unit_price, amount) VALUES 
          (?, ?, ?, ?, ?)
        `, [item.order_id, item.item_id, item.quantity, item.unit_price, item.amount], (err) => {
          if (err) console.error(`插入采购订单明细失败:`, err);
          else console.log(`采购订单${item.order_id}明细插入成功`);
        });
      }, (index + 20) * 100);
    });

    setTimeout(() => {
      console.log('✅ 示例数据插入完成！');
      resolve();
    }, 5000); // 增加超时时间确保所有数据都插入完成
  });
};
