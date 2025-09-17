import express from 'express';
import { db } from '../database/init';

const router = express.Router();

// 获取采购订单列表
router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, status, supplier_id } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);
  
  let sql = `
    SELECT po.*, s.name as supplier_name, w.name as warehouse_name 
    FROM purchase_orders po 
    LEFT JOIN suppliers s ON po.supplier_id = s.id 
    LEFT JOIN warehouses w ON po.warehouse_id = w.id 
    WHERE 1=1
  `;
  let countSql = 'SELECT COUNT(*) as total FROM purchase_orders WHERE 1=1';
  const params: any[] = [];
  
  if (status) {
    sql += ' AND po.status = ?';
    countSql += ' AND status = ?';
    params.push(status);
  }
  
  if (supplier_id) {
    sql += ' AND po.supplier_id = ?';
    countSql += ' AND supplier_id = ?';
    params.push(supplier_id);
  }
  
  sql += ' ORDER BY po.created_at DESC LIMIT ? OFFSET ?';
  
  db.get(countSql, params, (err, countResult: any) => {
    if (err) return res.status(500).json({ error: '查询失败' });
    
    db.all(sql, [...params, Number(pageSize), offset], (err, orders) => {
      if (err) return res.status(500).json({ error: '查询采购订单失败' });
      res.json({ data: orders, total: countResult.total, page: Number(page), pageSize: Number(pageSize) });
    });
  });
});

// 创建采购订单
router.post('/', (req, res) => {
  const { supplier_id, warehouse_id, order_date, expected_date, items, remarks } = req.body;
  
  if (!supplier_id || !warehouse_id || !items || items.length === 0) {
    return res.status(400).json({ error: '供应商、仓库和货品信息不能为空' });
  }
  
  const order_no = 'PO' + Date.now();
  const total_amount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // 创建采购订单
    db.run(
      `INSERT INTO purchase_orders (order_no, supplier_id, warehouse_id, order_date, expected_date, total_amount, remarks) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [order_no, supplier_id, warehouse_id, order_date, expected_date, total_amount, remarks],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: '创建采购订单失败' });
        }
        
        const order_id = this.lastID;
        
        // 插入订单明细
        const insertItems = items.map((item: any) => {
          return new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO purchase_order_items (order_id, item_id, quantity, unit_price, total_price) 
               VALUES (?, ?, ?, ?, ?)`,
              [order_id, item.item_id, item.quantity, item.unit_price, item.quantity * item.unit_price],
              (err) => {
                if (err) reject(err);
                else resolve(null);
              }
            );
          });
        });
        
        Promise.all(insertItems)
          .then(() => {
            db.run('COMMIT');
            res.status(201).json({ id: order_id, order_no, message: '采购订单创建成功' });
          })
          .catch(() => {
            db.run('ROLLBACK');
            res.status(500).json({ error: '创建订单明细失败' });
          });
      }
    );
  });
});

// 采购入库
router.post('/:id/receive', (req, res) => {
  const orderId = req.params.id;
  const { items } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ error: '入库货品信息不能为空' });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // 更新订单明细的已收货数量
    const updateItems = items.map((item: any) => {
      return new Promise((resolve, reject) => {
        // 更新采购订单明细
        db.run(
          'UPDATE purchase_order_items SET received_quantity = received_quantity + ? WHERE order_id = ? AND item_id = ?',
          [item.received_quantity, orderId, item.item_id],
          (err) => {
            if (err) return reject(err);
            
            // 更新库存
            db.run(
              `INSERT OR REPLACE INTO inventory (item_id, warehouse_id, quantity, available_quantity) 
               VALUES (?, ?, 
                 COALESCE((SELECT quantity FROM inventory WHERE item_id = ? AND warehouse_id = ?), 0) + ?,
                 COALESCE((SELECT available_quantity FROM inventory WHERE item_id = ? AND warehouse_id = ?), 0) + ?)`,
              [item.item_id, item.warehouse_id, item.item_id, item.warehouse_id, item.received_quantity,
               item.item_id, item.warehouse_id, item.received_quantity],
              (err) => {
                if (err) return reject(err);
                
                // 记录库存交易
                db.run(
                  `INSERT INTO inventory_transactions (item_id, warehouse_id, transaction_type, reference_no, reference_type, quantity, unit_cost) 
                   VALUES (?, ?, 'IN', ?, 'PURCHASE', ?, ?)`,
                  [item.item_id, item.warehouse_id, `PO-${orderId}`, item.received_quantity, item.unit_cost || 0],
                  (err) => {
                    if (err) reject(err);
                    else resolve(null);
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
        // 检查是否全部收货完成，更新订单状态
        db.get(
          `SELECT COUNT(*) as pending FROM purchase_order_items 
           WHERE order_id = ? AND quantity > received_quantity`,
          [orderId],
          (err, result: any) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: '检查订单状态失败' });
            }
            
            const status = result.pending === 0 ? 'completed' : 'partial';
            db.run(
              'UPDATE purchase_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [status, orderId],
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: '更新订单状态失败' });
                }
                
                db.run('COMMIT');
                res.json({ message: '入库成功' });
              }
            );
          }
        );
      })
      .catch(() => {
        db.run('ROLLBACK');
        res.status(500).json({ error: '入库失败' });
      });
  });
});

// 获取采购订单详情
router.get('/:id', (req, res) => {
  const orderId = req.params.id;
  
  // 获取订单基本信息
  db.get(
    `SELECT po.*, s.name as supplier_name, w.name as warehouse_name 
     FROM purchase_orders po 
     LEFT JOIN suppliers s ON po.supplier_id = s.id 
     LEFT JOIN warehouses w ON po.warehouse_id = w.id 
     WHERE po.id = ?`,
    [orderId],
    (err, order) => {
      if (err) return res.status(500).json({ error: '查询订单失败' });
      if (!order) return res.status(404).json({ error: '订单不存在' });
      
      // 获取订单明细
      db.all(
        `SELECT poi.*, i.name as item_name, i.code as item_code, i.unit 
         FROM purchase_order_items poi 
         LEFT JOIN items i ON poi.item_id = i.id 
         WHERE poi.order_id = ?`,
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