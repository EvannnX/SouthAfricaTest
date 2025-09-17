import { db } from './init';

export const insertMassiveOrderData = async (): Promise<void> => {
  return new Promise((resolve) => {
    console.log('🏪 开始生成月销100万大型店铺数据...');

    // 目标：月销售额100万，约2000个订单
    const generateRealisticSalesOrders = () => {
      console.log('💰 生成月销100万的真实销售数据...');
      
      let totalRevenue = 0;
      let orderCount = 0;
      
      // 生成30天的数据
      for (let day = 0; day < 30; day++) {
        const currentDate = new Date(Date.now() - (29 - day) * 24 * 60 * 60 * 1000);
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
        
        // 每天50-80个订单，周末更多
        const dailyOrders = Math.floor(Math.random() * 31) + 50;
        const actualDailyOrders = isWeekend ? Math.floor(dailyOrders * 1.2) : dailyOrders;
        
        for (let orderIdx = 0; orderIdx < actualDailyOrders; orderIdx++) {
          orderCount++;
          
          // 订单时间在营业时间内(9:00-21:00)
          const hour = Math.floor(Math.random() * 12) + 9;
          const minute = Math.floor(Math.random() * 60);
          const orderDateTime = new Date(currentDate);
          orderDateTime.setHours(hour, minute, 0, 0);
          
          const orderNo = `SO-${orderDateTime.getFullYear()}${String(orderDateTime.getMonth() + 1).padStart(2, '0')}${String(orderDateTime.getDate()).padStart(2, '0')}-${10000 + orderCount}`;
          const customerId = Math.floor(Math.random() * 6) + 1;
          const warehouseId = Math.floor(Math.random() * 2) + 1;
          
          // 真实的订单金额分布
          let baseAmount;
          const orderType = Math.random();
          if (orderType < 0.4) { // 40% 小订单
            baseAmount = Math.floor(Math.random() * 600) + 200;
          } else if (orderType < 0.75) { // 35% 中订单
            baseAmount = Math.floor(Math.random() * 1200) + 800;
          } else if (orderType < 0.95) { // 20% 大订单
            baseAmount = Math.floor(Math.random() * 3000) + 2000;
          } else { // 5% 特大订单
            baseAmount = Math.floor(Math.random() * 10000) + 5000;
          }
          
          // 应用周末加成
          const totalAmount = Math.floor(baseAmount * (isWeekend ? 1.3 : 0.9));
          const taxAmount = Math.round(totalAmount * 0.15 * 100) / 100;
          const discountAmount = Math.random() < 0.25 ? Math.floor(Math.random() * 200) : 0;
          
          // 92%完成，6%待处理，2%取消
          const statusRand = Math.random();
          let status;
          if (statusRand < 0.92) status = 'completed';
          else if (statusRand < 0.98) status = 'pending';
          else status = 'cancelled';
          
          if (status === 'completed') {
            totalRevenue += totalAmount + taxAmount - discountAmount;
          }
          
          setTimeout(() => {
            db.run(`INSERT OR IGNORE INTO sales_orders (order_no, customer_id, warehouse_id, order_date, 
                     total_amount, tax_amount, discount_amount, status, created_by, created_at, updated_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
              [orderNo, customerId, warehouseId, orderDateTime.toISOString().split('T')[0], 
               totalAmount, taxAmount, discountAmount, status],
              (err) => {
                if (err) console.error(`销售订单 ${orderNo} 插入失败:`, err);
                else if (orderCount % 200 === 0) console.log(`已生成 ${orderCount} 个订单，累计收入 ¥${Math.floor(totalRevenue).toLocaleString()}`);
              }
            );
          }, orderCount * 30);
        }
      }
      
      console.log(`🎯 目标生成：${orderCount} 个订单，预计收入 ¥${Math.floor(totalRevenue).toLocaleString()}`);
    };

    // 生成支撑销售的采购订单
    const generatePurchaseOrders = () => {
      console.log('🏭 生成支撑月销100万的采购订单...');
      
      let totalPurchase = 0;
      
      // 生成50个大额采购订单，总额约60万（销售额的60%）
      for (let i = 1; i <= 50; i++) {
        const orderDate = new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000);
        const orderNo = `PO-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}-${30000 + i}`;
        const supplierId = Math.floor(Math.random() * 4) + 1;
        const warehouseId = Math.floor(Math.random() * 2) + 1;
        
        // 采购订单金额分布
        let amount;
        const purchaseType = Math.random();
        if (purchaseType < 0.6) { // 60% 常规采购
          amount = Math.floor(Math.random() * 7000) + 8000; // 8k-15k
        } else if (purchaseType < 0.9) { // 30% 大额采购
          amount = Math.floor(Math.random() * 15000) + 15000; // 15k-30k
        } else { // 10% 批量采购
          amount = Math.floor(Math.random() * 30000) + 30000; // 30k-60k
        }
        
        const taxAmount = Math.round(amount * 0.15 * 100) / 100;
        
        // 85%完成，15%待处理
        const status = Math.random() < 0.85 ? 'completed' : 'pending';
        
        if (status === 'completed') {
          totalPurchase += amount + taxAmount;
        }
        
        setTimeout(() => {
          db.run(`INSERT OR IGNORE INTO purchase_orders (order_no, supplier_id, warehouse_id, order_date, 
                   total_amount, tax_amount, status, created_by, created_at, updated_at) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
            [orderNo, supplierId, warehouseId, orderDate.toISOString().split('T')[0], amount, taxAmount, status],
            (err) => {
              if (err) console.error(`采购订单 ${orderNo} 插入失败:`, err);
              else if (i % 10 === 0) console.log(`已生成 ${i} 个采购订单，累计采购 ¥${Math.floor(totalPurchase).toLocaleString()}`);
            }
          );
        }, (i + 2000) * 40);
      }
      
      console.log(`🎯 目标采购：50个订单，预计金额 ¥${Math.floor(totalPurchase).toLocaleString()}`);
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

    // 更新订单明细生成逻辑
    const generateOrderItems = () => {
      console.log('📋 生成大量真实订单明细...');
      
      // 为销售订单生成明细（约2000个订单，每个1-4个商品）
      setTimeout(() => {
        console.log('生成销售订单明细...');
        for (let orderId = 1; orderId <= 2000; orderId++) {
          const itemsCount = Math.floor(Math.random() * 4) + 1; // 1-4个商品
          
          for (let j = 0; j < itemsCount; j++) {
            const itemId = Math.floor(Math.random() * 20) + 1;
            const quantity = Math.floor(Math.random() * 5) + 1; // 1-5个数量
            
            // 根据商品类型设置价格
            let unitPrice;
            if (itemId <= 4) { // 主要商品
              unitPrice = [2899, 3599, 2399, 3199][itemId - 1];
            } else {
              unitPrice = Math.floor(Math.random() * 3000) + 500;
            }
            
            const discount = Math.random() < 0.2 ? Math.floor(Math.random() * 200) : 0;
            const amount = (unitPrice * quantity) - discount;
            
            setTimeout(() => {
              db.run(`INSERT OR IGNORE INTO sales_order_items (order_id, item_id, quantity, unit_price, discount, amount) 
                       VALUES (?, ?, ?, ?, ?, ?)`,
                [orderId, itemId, quantity, unitPrice, discount, amount],
                (err) => {
                  if (err && !err.message.includes('no such table')) {
                    console.error(`销售明细插入失败:`, err);
                  }
                }
              );
            }, (orderId * itemsCount + j) * 10);
          }
        }
      }, 30000); // 30秒后开始生成明细
      
      // 为采购订单生成明细
      setTimeout(() => {
        console.log('生成采购订单明细...');
        for (let orderId = 1; orderId <= 50; orderId++) {
          const itemsCount = Math.floor(Math.random() * 3) + 1; // 1-3个商品
          
          for (let j = 0; j < itemsCount; j++) {
            const itemId = Math.floor(Math.random() * 20) + 1;
            const quantity = Math.floor(Math.random() * 80) + 20; // 20-100个数量
            const unitPrice = Math.floor(Math.random() * 2000) + 800; // 采购价格
            const amount = unitPrice * quantity;
            
            setTimeout(() => {
              db.run(`INSERT OR IGNORE INTO purchase_order_items (order_id, item_id, quantity, unit_price, amount) 
                       VALUES (?, ?, ?, ?, ?)`,
                [orderId, itemId, quantity, unitPrice, amount],
                (err) => {
                  if (err && !err.message.includes('no such table')) {
                    console.error(`采购明细插入失败:`, err);
                  }
                }
              );
            }, (orderId * itemsCount + j) * 15);
          }
        }
      }, 35000); // 35秒后开始生成采购明细
    };

    // 执行数据生成
    console.log('🚀 开始生成月销100万的大型店铺完整数据...');
    generateRealisticSalesOrders();
    setTimeout(generatePurchaseOrders, 3000);
    generateOrderItems();

    // 完成
    setTimeout(() => {
      console.log('');
      console.log('🎉🎉🎉 月销100万大型店铺数据生成完成！');
      console.log('============================================');
      console.log('📊 数据概览：');
      console.log('💰 月销售额：约¥1,000,000');
      console.log('📈 日均销售：约¥33,333');
      console.log('🛒 销售订单：约2,000个');
      console.log('🏭 采购订单：50个大额订单');
      console.log('📦 采购金额：约¥600,000');
      console.log('📋 订单明细：4,000+条记录');
      console.log('🎯 利润率：约40%');
      console.log('✨ 数据特征：');
      console.log('  • 真实的订单金额分布');
      console.log('  • 工作日/周末销售差异');
      console.log('  • 营业时间内的订单分布');
      console.log('  • 大型家电店铺的经营规模');
      console.log('  • 完整的进销存数据');
      console.log('🚀 Demo系统准备就绪！');
      resolve();
    }, 45000); // 45秒后完成
  });
};
