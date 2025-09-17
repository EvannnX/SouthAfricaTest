import express from 'express';
import { db } from '../database/init';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// 数据导入端点（仅限管理员）
router.post('/import', (req, res) => {
  try {
    const { tableName, data } = req.body;
    
    if (!tableName || !data) {
      return res.status(400).json({ error: '缺少表名或数据' });
    }

    // 验证表名（安全检查）
    const allowedTables = [
      'items', 'suppliers', 'customers', 'warehouses',
      'sales_orders', 'sales_order_items', 
      'purchase_orders', 'purchase_order_items',
      'inventory', 'inventory_transactions'
    ];

    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({ error: '不允许的表名' });
    }

    // 执行SQL导入
    db.exec(data, (err) => {
      if (err) {
        console.error('数据导入错误:', err);
        return res.status(500).json({ error: '数据导入失败', details: err.message });
      }
      
      res.json({ message: `${tableName} 数据导入成功` });
    });

  } catch (error) {
    console.error('数据导入错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取表数据统计
router.get('/stats', (req, res) => {
  try {
    const stats: any = {};
    
    const queries = [
      'SELECT COUNT(*) as count FROM items',
      'SELECT COUNT(*) as count FROM suppliers', 
      'SELECT COUNT(*) as count FROM customers',
      'SELECT COUNT(*) as count FROM warehouses',
      'SELECT COUNT(*) as count FROM sales_orders',
      'SELECT COUNT(*) as count FROM purchase_orders',
      'SELECT COUNT(*) as count FROM inventory'
    ];

    const tables = ['items', 'suppliers', 'customers', 'warehouses', 'sales_orders', 'purchase_orders', 'inventory'];
    
    let completed = 0;
    
    queries.forEach((query, index) => {
      db.get(query, (err, row: any) => {
        if (err) {
          console.error(`查询 ${tables[index]} 错误:`, err);
          stats[tables[index]] = 0;
        } else {
          stats[tables[index]] = row.count;
        }
        
        completed++;
        if (completed === queries.length) {
          res.json(stats);
        }
      });
    });

  } catch (error) {
    console.error('获取统计错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 清空所有数据（谨慎使用）
router.post('/clear-all', (req, res) => {
  try {
    const clearQueries = [
      'DELETE FROM inventory_transactions',
      'DELETE FROM sales_order_items',
      'DELETE FROM purchase_order_items', 
      'DELETE FROM sales_orders',
      'DELETE FROM purchase_orders',
      'DELETE FROM inventory',
      'DELETE FROM items',
      'DELETE FROM customers',
      'DELETE FROM suppliers',
      'DELETE FROM warehouses'
    ];

    let completed = 0;
    
    clearQueries.forEach(query => {
      db.run(query, (err) => {
        if (err) {
          console.error('清空数据错误:', err);
        }
        completed++;
        if (completed === clearQueries.length) {
          res.json({ message: '所有数据已清空' });
        }
      });
    });

  } catch (error) {
    console.error('清空数据错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
