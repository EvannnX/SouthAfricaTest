import express from 'express';
import { db } from '../database/init';

const router = express.Router();

// 获取库存列表
router.get('/', (req, res) => {
  const { warehouse_id, item_id, low_stock } = req.query;
  
  let sql = `
    SELECT i.*, it.name as item_name, it.en_name as en_name, it.code as item_code, it.unit, it.min_stock, it.max_stock,
           w.name as warehouse_name, w.code as warehouse_code
    FROM inventory i
    LEFT JOIN items it ON i.item_id = it.id
    LEFT JOIN warehouses w ON i.warehouse_id = w.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (warehouse_id) {
    sql += ' AND i.warehouse_id = ?';
    params.push(warehouse_id);
  }
  
  if (item_id) {
    sql += ' AND i.item_id = ?';
    params.push(item_id);
  }
  
  if (low_stock === 'true') {
    sql += ' AND i.quantity <= it.min_stock';
  }
  
  sql += ' ORDER BY i.last_updated DESC';
  
  db.all(sql, params, (err, inventory) => {
    if (err) return res.status(500).json({ error: '查询库存失败' });
    res.json(inventory);
  });
});

// 库存调拨
router.post('/transfer', (req, res) => {
  const { item_id, from_warehouse_id, to_warehouse_id, quantity, remarks } = req.body;
  
  if (!item_id || !from_warehouse_id || !to_warehouse_id || !quantity) {
    return res.status(400).json({ error: '调拨信息不完整' });
  }
  
  if (from_warehouse_id === to_warehouse_id) {
    return res.status(400).json({ error: '源仓库和目标仓库不能相同' });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // 检查源仓库库存
    db.get(
      'SELECT available_quantity FROM inventory WHERE item_id = ? AND warehouse_id = ?',
      [item_id, from_warehouse_id],
      (err, fromInventory: any) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: '查询源仓库库存失败' });
        }
        
        if (!fromInventory || fromInventory.available_quantity < quantity) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: '源仓库库存不足' });
        }
        
        // 更新源仓库库存
        db.run(
          `UPDATE inventory SET 
           quantity = quantity - ?, 
           available_quantity = available_quantity - ?,
           last_updated = CURRENT_TIMESTAMP
           WHERE item_id = ? AND warehouse_id = ?`,
          [quantity, quantity, item_id, from_warehouse_id],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: '更新源仓库库存失败' });
            }
            
            // 更新目标仓库库存
            db.run(
              `INSERT OR REPLACE INTO inventory (item_id, warehouse_id, quantity, available_quantity, last_updated) 
               VALUES (?, ?, 
                 COALESCE((SELECT quantity FROM inventory WHERE item_id = ? AND warehouse_id = ?), 0) + ?,
                 COALESCE((SELECT available_quantity FROM inventory WHERE item_id = ? AND warehouse_id = ?), 0) + ?,
                 CURRENT_TIMESTAMP)`,
              [item_id, to_warehouse_id, item_id, to_warehouse_id, quantity, 
               item_id, to_warehouse_id, quantity],
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: '更新目标仓库库存失败' });
                }
                
                const transfer_no = 'TF' + Date.now();
                
                // 记录出库交易
                db.run(
                  `INSERT INTO inventory_transactions (item_id, warehouse_id, transaction_type, reference_no, reference_type, quantity, remarks) 
                   VALUES (?, ?, 'OUT', ?, 'TRANSFER', ?, ?)`,
                  [item_id, from_warehouse_id, transfer_no, -quantity, remarks],
                  (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: '记录出库交易失败' });
                    }
                    
                    // 记录入库交易
                    db.run(
                      `INSERT INTO inventory_transactions (item_id, warehouse_id, transaction_type, reference_no, reference_type, quantity, remarks) 
                       VALUES (?, ?, 'IN', ?, 'TRANSFER', ?, ?)`,
                      [item_id, to_warehouse_id, transfer_no, quantity, remarks],
                      (err) => {
                        if (err) {
                          db.run('ROLLBACK');
                          return res.status(500).json({ error: '记录入库交易失败' });
                        }
                        
                        db.run('COMMIT');
                        res.json({ message: '调拨成功', transfer_no });
                      }
                    );
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

// 库存调整
router.post('/adjust', (req, res) => {
  const { item_id, warehouse_id, adjust_quantity, remarks } = req.body;
  
  if (!item_id || !warehouse_id || adjust_quantity === undefined) {
    return res.status(400).json({ error: '调整信息不完整' });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    const adjust_no = 'ADJ' + Date.now();
    
    // 更新库存
    db.run(
      `INSERT OR REPLACE INTO inventory (item_id, warehouse_id, quantity, available_quantity, last_updated) 
       VALUES (?, ?, 
         COALESCE((SELECT quantity FROM inventory WHERE item_id = ? AND warehouse_id = ?), 0) + ?,
         COALESCE((SELECT available_quantity FROM inventory WHERE item_id = ? AND warehouse_id = ?), 0) + ?,
         CURRENT_TIMESTAMP)`,
      [item_id, warehouse_id, item_id, warehouse_id, adjust_quantity, 
       item_id, warehouse_id, adjust_quantity],
      (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: '更新库存失败' });
        }
        
        // 记录库存交易
        const transaction_type = adjust_quantity > 0 ? 'IN' : 'OUT';
        db.run(
          `INSERT INTO inventory_transactions (item_id, warehouse_id, transaction_type, reference_no, reference_type, quantity, remarks) 
           VALUES (?, ?, ?, ?, 'ADJUST', ?, ?)`,
          [item_id, warehouse_id, transaction_type, adjust_no, adjust_quantity, remarks],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: '记录库存交易失败' });
            }
            
            db.run('COMMIT');
            res.json({ message: '库存调整成功', adjust_no });
          }
        );
      }
    );
  });
});

// 获取库存交易记录
router.get('/transactions', (req, res) => {
  const { item_id, warehouse_id, transaction_type, page = 1, pageSize = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);
  
  let sql = `
    SELECT it.*, i.name as item_name, i.code as item_code, w.name as warehouse_name
    FROM inventory_transactions it
    LEFT JOIN items i ON it.item_id = i.id
    LEFT JOIN warehouses w ON it.warehouse_id = w.id
    WHERE 1=1
  `;
  let countSql = 'SELECT COUNT(*) as total FROM inventory_transactions WHERE 1=1';
  const params: any[] = [];
  
  if (item_id) {
    sql += ' AND it.item_id = ?';
    countSql += ' AND item_id = ?';
    params.push(item_id);
  }
  
  if (warehouse_id) {
    sql += ' AND it.warehouse_id = ?';
    countSql += ' AND warehouse_id = ?';
    params.push(warehouse_id);
  }
  
  if (transaction_type) {
    sql += ' AND it.transaction_type = ?';
    countSql += ' AND transaction_type = ?';
    params.push(transaction_type);
  }
  
  sql += ' ORDER BY it.transaction_date DESC LIMIT ? OFFSET ?';
  
  db.get(countSql, params, (err, countResult: any) => {
    if (err) return res.status(500).json({ error: '查询失败' });
    
    db.all(sql, [...params, Number(pageSize), offset], (err, transactions) => {
      if (err) return res.status(500).json({ error: '查询库存交易记录失败' });
      res.json({ 
        data: transactions, 
        total: countResult.total, 
        page: Number(page), 
        pageSize: Number(pageSize) 
      });
    });
  });
});

// 获取库存预警列表
router.get('/alerts', (req, res) => {
  const sql = `
    SELECT i.*, it.name as item_name, it.en_name as en_name, it.code as item_code, it.unit, it.min_stock, it.max_stock,
           w.name as warehouse_name, w.code as warehouse_code,
           CASE 
             WHEN i.quantity <= 0 THEN '缺货'
             WHEN i.quantity <= it.min_stock THEN '库存不足'
             WHEN i.quantity >= it.max_stock THEN '库存过多'
           END as alert_type
    FROM inventory i
    LEFT JOIN items it ON i.item_id = it.id
    LEFT JOIN warehouses w ON i.warehouse_id = w.id
    WHERE i.quantity <= 0 OR i.quantity <= it.min_stock OR i.quantity >= it.max_stock
    ORDER BY 
      CASE 
        WHEN i.quantity <= 0 THEN 1
        WHEN i.quantity <= it.min_stock THEN 2
        WHEN i.quantity >= it.max_stock THEN 3
      END,
      i.last_updated DESC
  `;
  
  db.all(sql, (err, alerts) => {
    if (err) return res.status(500).json({ error: '查询库存预警失败' });
    res.json(alerts);
  });
});

export default router; 