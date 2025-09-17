import express from 'express';
import { db } from '../database/init';

const router = express.Router();

// 获取销售订单列表
router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, status, customer_id } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);
  
  let sql = `
    SELECT so.*, c.name as customer_name, w.name as warehouse_name 
    FROM sales_orders so 
    LEFT JOIN customers c ON so.customer_id = c.id 
    LEFT JOIN warehouses w ON so.warehouse_id = w.id 
    WHERE 1=1
  `;
  let countSql = 'SELECT COUNT(*) as total FROM sales_orders WHERE 1=1';
  const params: any[] = [];
  
  if (status) {
    sql += ' AND so.status = ?';
    countSql += ' AND status = ?';
    params.push(status);
  }
  
  if (customer_id) {
    sql += ' AND so.customer_id = ?';
    countSql += ' AND customer_id = ?';
    params.push(customer_id);
  }
  
  sql += ' ORDER BY so.created_at DESC LIMIT ? OFFSET ?';
  
  db.get(countSql, params, (err, countResult: any) => {
    if (err) return res.status(500).json({ error: '查询失败' });
    
    db.all(sql, [...params, Number(pageSize), offset], (err, orders) => {
      if (err) return res.status(500).json({ error: '查询销售订单失败' });
      res.json({ data: orders, total: countResult.total, page: Number(page), pageSize: Number(pageSize) });
    });
  });
});

// 创建销售订单
router.post('/', (req, res) => {
  const { 
    customer_id, 
    warehouse_id, 
    order_date, 
    delivery_date, 
    items, 
    remarks,
    discount_amount = 0,
    round_amount = 0,
    payment_type = 'full',
    payment_info = null
  } = req.body;
  
  if (!customer_id || !warehouse_id || !items || items.length === 0) {
    return res.status(400).json({ error: '客户、仓库和货品信息不能为空' });
  }
  
  const order_no = 'SO' + Date.now();
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // 计算订单总金额和成本
    let total_amount = 0;
    let total_cost = 0;
    
    const itemPromises = items.map((item: any) => {
      return new Promise((resolve, reject) => {
        // 获取货品成本价
        db.get('SELECT purchase_price FROM items WHERE id = ?', [item.item_id], (err, itemData: any) => {
          if (err) return reject(err);
          
          const unit_cost = itemData?.purchase_price || 0;
          const line_total = item.quantity * item.unit_price;
          const line_cost = item.quantity * unit_cost;
          
          total_amount += line_total;
          total_cost += line_cost;
          
          resolve({ ...item, unit_cost, total_price: line_total, total_cost: line_cost });
        });
      });
    });
    
    Promise.all(itemPromises)
      .then((processedItems: any) => {
        const gross_profit = total_amount - total_cost;
        const profit_margin = total_amount > 0 ? (gross_profit / total_amount) * 100 : 0;
        const final_amount = total_amount - discount_amount + round_amount;
        
        // 创建销售订单
        db.run(
          `INSERT INTO sales_orders (order_no, customer_id, warehouse_id, order_date, delivery_date, 
           total_amount, discount_amount, round_amount, final_amount, total_cost, gross_profit, profit_margin, 
           payment_type, remarks) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [order_no, customer_id, warehouse_id, order_date, delivery_date, 
           total_amount, discount_amount, round_amount, final_amount, total_cost, gross_profit, profit_margin, 
           payment_type, remarks],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: '创建销售订单失败' });
            }
            
            const order_id = this.lastID;
            
            // 插入订单明细
            const insertItems = processedItems.map((item: any) => {
              return new Promise((resolve, reject) => {
                db.run(
                  `INSERT INTO sales_order_items (order_id, item_id, quantity, unit_price, unit_cost, total_price, total_cost) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [order_id, item.item_id, item.quantity, item.unit_price, item.unit_cost, item.total_price, item.total_cost],
                  (err) => {
                    if (err) reject(err);
                    else resolve(null);
                  }
                );
              });
            });
            
            Promise.all(insertItems)
              .then(() => {
                // 如果是立即支付，创建支付记录
                if (payment_info && payment_info.payment_method) {
                  db.run(
                    `INSERT INTO payment_records (order_id, payment_method, amount, received_amount, 
                     change_amount, discount_amount, round_amount) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [order_id, payment_info.payment_method, final_amount, 
                     payment_info.received_amount || final_amount, 
                     payment_info.change_amount || 0, discount_amount, round_amount],
                    (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: '创建支付记录失败' });
                      }

                      // 更新订单支付状态
                      db.run(
                        'UPDATE sales_orders SET payment_status = ?, paid_amount = ? WHERE id = ?',
                        ['paid', final_amount, order_id],
                        (err) => {
                          if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: '更新支付状态失败' });
                          }

                          db.run('COMMIT');
                          res.status(201).json({ 
                            id: order_id, 
                            order_no, 
                            total_amount, 
                            final_amount,
                            total_cost, 
                            gross_profit, 
                            profit_margin: Number(profit_margin.toFixed(2)),
                            payment_status: 'paid',
                            message: '销售订单创建并支付成功' 
                          });
                        }
                      );
                    }
                  );
                } else {
                  db.run('COMMIT');
                  res.status(201).json({ 
                    id: order_id, 
                    order_no, 
                    total_amount, 
                    final_amount,
                    total_cost, 
                    gross_profit, 
                    profit_margin: Number(profit_margin.toFixed(2)),
                    payment_status: 'unpaid',
                    message: '销售订单创建成功' 
                  });
                }
              })
              .catch(() => {
                db.run('ROLLBACK');
                res.status(500).json({ error: '创建订单明细失败' });
              });
          }
        );
      })
      .catch(() => {
        db.run('ROLLBACK');
        res.status(500).json({ error: '处理订单数据失败' });
      });
  });
});

// 销售出库
router.post('/:id/deliver', (req, res) => {
  const orderId = req.params.id;
  const { items } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ error: '出库货品信息不能为空' });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // 检查库存并更新
    const updateItems = items.map((item: any) => {
      return new Promise((resolve, reject) => {
        // 检查库存
        db.get(
          'SELECT available_quantity FROM inventory WHERE item_id = ? AND warehouse_id = ?',
          [item.item_id, item.warehouse_id],
          (err, inventory: any) => {
            if (err) return reject(err);
            
            if (!inventory || inventory.available_quantity < item.delivered_quantity) {
              return reject(new Error(`货品库存不足`));
            }
            
            // 更新销售订单明细
            db.run(
              'UPDATE sales_order_items SET delivered_quantity = delivered_quantity + ? WHERE order_id = ? AND item_id = ?',
              [item.delivered_quantity, orderId, item.item_id],
              (err) => {
                if (err) return reject(err);
                
                // 更新库存
                db.run(
                  `UPDATE inventory SET 
                   quantity = quantity - ?, 
                   available_quantity = available_quantity - ?,
                   last_updated = CURRENT_TIMESTAMP
                   WHERE item_id = ? AND warehouse_id = ?`,
                  [item.delivered_quantity, item.delivered_quantity, item.item_id, item.warehouse_id],
                  (err) => {
                    if (err) return reject(err);
                    
                    // 记录库存交易
                    db.run(
                      `INSERT INTO inventory_transactions (item_id, warehouse_id, transaction_type, reference_no, reference_type, quantity) 
                       VALUES (?, ?, 'OUT', ?, 'SALES', ?)`,
                      [item.item_id, item.warehouse_id, `SO-${orderId}`, -item.delivered_quantity],
                      (err) => {
                        if (err) reject(err);
                        else resolve(null);
                      }
                    );
                  }
                );
              }
            );
          }
        );
      });
    });
    
    Promise.all(updateItems)
      .then(() => {
        // 检查是否全部发货完成，更新订单状态
        db.get(
          `SELECT COUNT(*) as pending FROM sales_order_items 
           WHERE order_id = ? AND quantity > delivered_quantity`,
          [orderId],
          (err, result: any) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: '检查订单状态失败' });
            }
            
            const status = result.pending === 0 ? 'completed' : 'partial';
            db.run(
              'UPDATE sales_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [status, orderId],
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: '更新订单状态失败' });
                }
                
                db.run('COMMIT');
                res.json({ message: '出库成功' });
              }
            );
          }
        );
      })
      .catch((error) => {
        db.run('ROLLBACK');
        res.status(400).json({ error: error.message || '出库失败' });
      });
  });
});

// 获取销售订单详情
router.get('/:id', (req, res) => {
  const orderId = req.params.id;
  
  // 获取订单基本信息
  db.get(
    `SELECT so.*, c.name as customer_name, w.name as warehouse_name 
     FROM sales_orders so 
     LEFT JOIN customers c ON so.customer_id = c.id 
     LEFT JOIN warehouses w ON so.warehouse_id = w.id 
     WHERE so.id = ?`,
    [orderId],
    (err, order) => {
      if (err) return res.status(500).json({ error: '查询订单失败' });
      if (!order) return res.status(404).json({ error: '订单不存在' });
      
      // 获取订单明细
      db.all(
        `SELECT soi.*, i.name as item_name, i.code as item_code, i.unit 
         FROM sales_order_items soi 
         LEFT JOIN items i ON soi.item_id = i.id 
         WHERE soi.order_id = ?`,
        [orderId],
        (err, items) => {
          if (err) return res.status(500).json({ error: '查询订单明细失败' });
          
          res.json({ 
            ...order as any, 
            items 
          });
        }
      );
    }
  );
});

export default router; 