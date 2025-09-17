import { db } from './init';

export const insertMassiveOrderData = async (): Promise<void> => {
  return new Promise((resolve) => {
    console.log('🚀 开始插入大量订单数据...');

    // 生成100个销售订单
    const generateSalesOrders = () => {
      console.log('💰 生成销售订单数据...');
      
      for (let i = 1; i <= 100; i++) {
        const orderDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const orderNo = `SO-${orderDate.replace(/-/g, '')}-${10000 + i}`;
        const customerId = Math.floor(Math.random() * 6) + 1;
        const warehouseId = Math.floor(Math.random() * 2) + 1;
        
        const totalAmount = Math.floor(Math.random() * 49000) + 1000;
        const taxAmount = Math.round(totalAmount * 0.15 * 100) / 100;
        const discountAmount = Math.random() < 0.3 ? Math.floor(Math.random() * 1000) : 0;
        const status = ['completed', 'completed', 'completed', 'pending', 'cancelled'][Math.floor(Math.random() * 5)];
        
        setTimeout(() => {
          db.run(`INSERT OR IGNORE INTO sales_orders (order_no, customer_id, warehouse_id, order_date, 
                   total_amount, tax_amount, discount_amount, status, created_by, created_at, updated_at) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
            [orderNo, customerId, warehouseId, orderDate, totalAmount, taxAmount, discountAmount, status],
            (err) => {
              if (err) console.error(`销售订单 ${orderNo} 插入失败:`, err);
              else if (i % 20 === 0) console.log(`已插入 ${i} 个销售订单`);
            }
          );
        }, i * 50);
      }
    };

    // 生成100个采购订单
    const generatePurchaseOrders = () => {
      console.log('🛒 生成采购订单数据...');
      
      for (let i = 1; i <= 100; i++) {
        const orderDate = new Date(Date.now() - Math.random() * 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const orderNo = `PO-${orderDate.replace(/-/g, '')}-${20000 + i}`;
        const supplierId = Math.floor(Math.random() * 4) + 1;
        const warehouseId = Math.floor(Math.random() * 2) + 1;
        
        const totalAmount = Math.floor(Math.random() * 190000) + 10000;
        const taxAmount = Math.round(totalAmount * 0.15 * 100) / 100;
        const status = ['completed', 'completed', 'pending', 'cancelled'][Math.floor(Math.random() * 4)];
        
        setTimeout(() => {
          db.run(`INSERT OR IGNORE INTO purchase_orders (order_no, supplier_id, warehouse_id, order_date, 
                   total_amount, tax_amount, status, created_by, created_at, updated_at) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
            [orderNo, supplierId, warehouseId, orderDate, totalAmount, taxAmount, status],
            (err) => {
              if (err) console.error(`采购订单 ${orderNo} 插入失败:`, err);
              else if (i % 20 === 0) console.log(`已插入 ${i} 个采购订单`);
            }
          );
        }, (i + 100) * 50);
      }
    };

    // 生成销售订单明细
    const generateSalesOrderItems = () => {
      console.log('📋 生成销售订单明细...');
      
      setTimeout(() => {
        for (let orderId = 1; orderId <= 100; orderId++) {
          const itemsCount = Math.floor(Math.random() * 3) + 1; // 1-3个商品
          
          for (let j = 0; j < itemsCount; j++) {
            const itemId = Math.floor(Math.random() * 20) + 1;
            const quantity = Math.floor(Math.random() * 10) + 1;
            const unitPrice = Math.floor(Math.random() * 4000) + 1000;
            const discount = Math.random() < 0.3 ? Math.floor(Math.random() * 200) : 0;
            const amount = (unitPrice * quantity) - discount;
            
            setTimeout(() => {
              db.run(`INSERT OR IGNORE INTO sales_order_items (order_id, item_id, quantity, unit_price, discount, amount) 
                       VALUES (?, ?, ?, ?, ?, ?)`,
                [orderId, itemId, quantity, unitPrice, discount, amount],
                (err) => {
                  if (err && err.message.includes('no such table')) {
                    // 如果表不存在，尝试使用其他字段名
                    db.run(`INSERT OR IGNORE INTO sales_order_items (order_id, item_id, quantity, unit_price, total_price) 
                             VALUES (?, ?, ?, ?, ?)`,
                      [orderId, itemId, quantity, unitPrice, amount],
                      (err2) => {
                        if (err2) console.error(`销售明细插入失败:`, err2);
                      }
                    );
                  } else if (err) {
                    console.error(`销售明细插入失败:`, err);
                  }
                }
              );
            }, (orderId * itemsCount + j) * 20);
          }
        }
      }, 6000);
    };

    // 生成采购订单明细
    const generatePurchaseOrderItems = () => {
      console.log('📋 生成采购订单明细...');
      
      setTimeout(() => {
        for (let orderId = 1; orderId <= 100; orderId++) {
          const itemsCount = Math.floor(Math.random() * 2) + 1; // 1-2个商品
          
          for (let j = 0; j < itemsCount; j++) {
            const itemId = Math.floor(Math.random() * 20) + 1;
            const quantity = Math.floor(Math.random() * 90) + 10;
            const unitPrice = Math.floor(Math.random() * 2200) + 800;
            const amount = unitPrice * quantity;
            
            setTimeout(() => {
              db.run(`INSERT OR IGNORE INTO purchase_order_items (order_id, item_id, quantity, unit_price, amount) 
                       VALUES (?, ?, ?, ?, ?)`,
                [orderId, itemId, quantity, unitPrice, amount],
                (err) => {
                  if (err && err.message.includes('no such table')) {
                    // 如果表不存在，尝试使用其他字段名
                    db.run(`INSERT OR IGNORE INTO purchase_order_items (order_id, item_id, quantity, unit_price, total_price) 
                             VALUES (?, ?, ?, ?, ?)`,
                      [orderId, itemId, quantity, unitPrice, amount],
                      (err2) => {
                        if (err2) console.error(`采购明细插入失败:`, err2);
                      }
                    );
                  } else if (err) {
                    console.error(`采购明细插入失败:`, err);
                  }
                }
              );
            }, (orderId * itemsCount + j) * 20);
          }
        }
      }, 8000);
    };

    // 执行数据生成
    generateSalesOrders();
    setTimeout(generatePurchaseOrders, 1000);
    generateSalesOrderItems();
    generatePurchaseOrderItems();

    // 完成
    setTimeout(() => {
      console.log('✅ 大量订单数据插入完成！');
      console.log('📊 已生成：');
      console.log('  - 100个销售订单');
      console.log('  - 100个采购订单');
      console.log('  - 200-300个销售订单明细');
      console.log('  - 100-200个采购订单明细');
      resolve();
    }, 15000);
  });
};
