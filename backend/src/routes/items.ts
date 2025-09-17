import express from 'express';
import { db } from '../database/init';

const router = express.Router();

// 获取货品列表
router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, search, category } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);
  
  let sql = `
    SELECT i.*, 
           GROUP_CONCAT(DISTINCT ib.barcode) as barcodes,
           GROUP_CONCAT(DISTINCT ii.image_url) as images,
           COUNT(DISTINCT ip.id) as price_levels
    FROM items i 
    LEFT JOIN item_barcodes ib ON i.id = ib.item_id
    LEFT JOIN item_images ii ON i.id = ii.item_id
    LEFT JOIN item_prices ip ON i.id = ip.item_id
    WHERE 1=1
  `;
  let countSql = 'SELECT COUNT(*) as total FROM items WHERE 1=1';
  const params: any[] = [];
  
  if (search) {
    sql += ' AND (i.name LIKE ? OR i.code LIKE ? OR i.en_name LIKE ?)';
    countSql += ' AND (name LIKE ? OR code LIKE ? OR en_name LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  if (category) {
    sql += ' AND i.category = ?';
    countSql += ' AND category = ?';
    params.push(category);
  }
  
  sql += ' GROUP BY i.id ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
  
  db.get(countSql, params, (err, countResult: any) => {
    if (err) return res.status(500).json({ error: '查询失败' });
    
    db.all(sql, [...params, Number(pageSize), offset], (err, items) => {
      if (err) return res.status(500).json({ error: '查询货品失败' });
      
      // 处理结果，将字符串转换为数组
      const processedItems = (items as any[]).map(item => ({
        ...item,
        barcodes: item.barcodes ? item.barcodes.split(',') : [],
        images: item.images ? item.images.split(',') : []
      }));
      
      res.json({ 
        data: processedItems, 
        total: countResult.total, 
        page: Number(page), 
        pageSize: Number(pageSize) 
      });
    });
  });
});

// 创建货品
router.post('/', (req, res) => {
  const { 
    code, name, en_name, category, unit, description, 
    purchase_price, sale_price, min_stock, max_stock,
    barcodes = [], images = [], units = [], prices = [], suppliers = []
  } = req.body;
  
  if (!code || !name) {
    return res.status(400).json({ error: '货品编码和名称不能为空' });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // 创建主货品记录
    db.run(
      `INSERT INTO items (code, name, en_name, category, unit, description, 
       purchase_price, sale_price, min_stock, max_stock) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, name, en_name, category, unit, description, 
       purchase_price, sale_price, min_stock, max_stock],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: '货品编码已存在' });
          }
          return res.status(500).json({ error: '创建货品失败' });
        }
        
        const itemId = this.lastID;
        const promises: Promise<any>[] = [];
        
        // 添加条码
        if (barcodes.length > 0) {
          barcodes.forEach((barcode: any, index: number) => {
            promises.push(new Promise((resolve, reject) => {
              db.run(
                'INSERT INTO item_barcodes (item_id, barcode, barcode_type, is_primary) VALUES (?, ?, ?, ?)',
                [itemId, barcode.code, barcode.type || 'custom', index === 0],
                (err) => err ? reject(err) : resolve(null)
              );
            }));
          });
        }
        
        // 添加图片
        if (images.length > 0) {
          images.forEach((image: any, index: number) => {
            promises.push(new Promise((resolve, reject) => {
              db.run(
                'INSERT INTO item_images (item_id, image_url, image_type, sort_order) VALUES (?, ?, ?, ?)',
                [itemId, image.url, image.type || 'main', index],
                (err) => err ? reject(err) : resolve(null)
              );
            }));
          });
        }
        
        // 添加多单位
        if (units.length > 0) {
          units.forEach((unit: any, index: number) => {
            promises.push(new Promise((resolve, reject) => {
              db.run(
                'INSERT INTO item_units (item_id, unit_name, conversion_rate, is_base_unit) VALUES (?, ?, ?, ?)',
                [itemId, unit.name, unit.rate, index === 0],
                (err) => err ? reject(err) : resolve(null)
              );
            }));
          });
        }
        
        // 添加价格档位
        if (prices.length > 0) {
          prices.forEach((price: any) => {
            promises.push(new Promise((resolve, reject) => {
              db.run(
                'INSERT INTO item_prices (item_id, price_type, price, min_quantity, max_quantity, customer_type) VALUES (?, ?, ?, ?, ?, ?)',
                [itemId, price.type, price.price, price.min_qty || 1, price.max_qty, price.customer_type || 'all'],
                (err) => err ? reject(err) : resolve(null)
              );
            }));
          });
        }
        
        // 添加供应商关系
        if (suppliers.length > 0) {
          suppliers.forEach((supplier: any, index: number) => {
            promises.push(new Promise((resolve, reject) => {
              db.run(
                'INSERT INTO item_suppliers (item_id, supplier_id, supplier_code, purchase_price, min_order_qty, lead_time, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [itemId, supplier.supplier_id, supplier.code, supplier.price, supplier.min_qty || 1, supplier.lead_time || 0, index === 0],
                (err) => err ? reject(err) : resolve(null)
              );
            }));
          });
        }
        
        Promise.all(promises)
          .then(() => {
            db.run('COMMIT');
            res.status(201).json({ id: itemId, message: '货品创建成功' });
          })
          .catch(() => {
            db.run('ROLLBACK');
            res.status(500).json({ error: '创建货品扩展信息失败' });
          });
      }
    );
  });
});

// 获取货品详情
router.get('/:id', (req, res) => {
  const itemId = req.params.id;
  
  // 获取基本信息
  db.get('SELECT * FROM items WHERE id = ?', [itemId], (err, item) => {
    if (err) return res.status(500).json({ error: '查询货品失败' });
    if (!item) return res.status(404).json({ error: '货品不存在' });
    
    // 获取条码
    db.all('SELECT * FROM item_barcodes WHERE item_id = ?', [itemId], (err, barcodes) => {
      if (err) return res.status(500).json({ error: '查询条码失败' });
      
      // 获取图片
      db.all('SELECT * FROM item_images WHERE item_id = ? ORDER BY sort_order', [itemId], (err, images) => {
        if (err) return res.status(500).json({ error: '查询图片失败' });
        
        // 获取单位
        db.all('SELECT * FROM item_units WHERE item_id = ?', [itemId], (err, units) => {
          if (err) return res.status(500).json({ error: '查询单位失败' });
          
          // 获取价格
          db.all('SELECT * FROM item_prices WHERE item_id = ?', [itemId], (err, prices) => {
            if (err) return res.status(500).json({ error: '查询价格失败' });
            
            // 获取供应商
            db.all(
              `SELECT isu.*, s.name as supplier_name 
               FROM item_suppliers isu 
               LEFT JOIN suppliers s ON isu.supplier_id = s.id 
               WHERE isu.item_id = ?`,
              [itemId],
              (err, suppliers) => {
                if (err) return res.status(500).json({ error: '查询供应商失败' });
                
                res.json({
                  ...item as any,
                  barcodes,
                  images,
                  units,
                  prices,
                  suppliers
                });
              }
            );
          });
        });
      });
    });
  });
});

// 更新货品
router.put('/:id', (req, res) => {
  const itemId = req.params.id;
  const { 
    code, name, en_name, category, unit, description, 
    purchase_price, sale_price, min_stock, max_stock,
    barcodes = [], images = [], units = [], prices = [], suppliers = []
  } = req.body;
  
  if (!code || !name) {
    return res.status(400).json({ error: '货品编码和名称不能为空' });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // 更新主货品记录
    db.run(
      `UPDATE items SET code = ?, name = ?, en_name = ?, category = ?, unit = ?, 
       description = ?, purchase_price = ?, sale_price = ?, min_stock = ?, max_stock = ?,
       updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [code, name, en_name, category, unit, description, 
       purchase_price, sale_price, min_stock, max_stock, itemId],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: '货品编码已存在' });
          }
          return res.status(500).json({ error: '更新货品失败' });
        }
        
        if (this.changes === 0) {
          db.run('ROLLBACK');
          return res.status(404).json({ error: '货品不存在' });
        }
        
        const promises: Promise<any>[] = [];
        
        // 删除旧的扩展信息
        ['item_barcodes', 'item_images', 'item_units', 'item_prices', 'item_suppliers'].forEach(table => {
          promises.push(new Promise((resolve, reject) => {
            db.run(`DELETE FROM ${table} WHERE item_id = ?`, [itemId], (err) => {
              err ? reject(err) : resolve(null);
            });
          }));
        });
        
        Promise.all(promises)
          .then(() => {
            const insertPromises: Promise<any>[] = [];
            
            // 重新插入条码
            if (barcodes.length > 0) {
              barcodes.forEach((barcode: any, index: number) => {
                insertPromises.push(new Promise((resolve, reject) => {
                  db.run(
                    'INSERT INTO item_barcodes (item_id, barcode, barcode_type, is_primary) VALUES (?, ?, ?, ?)',
                    [itemId, barcode.code, barcode.type || 'custom', index === 0],
                    (err) => err ? reject(err) : resolve(null)
                  );
                }));
              });
            }
            
            // 重新插入图片
            if (images.length > 0) {
              images.forEach((image: any, index: number) => {
                insertPromises.push(new Promise((resolve, reject) => {
                  db.run(
                    'INSERT INTO item_images (item_id, image_url, image_type, sort_order) VALUES (?, ?, ?, ?)',
                    [itemId, image.url, image.type || 'main', index],
                    (err) => err ? reject(err) : resolve(null)
                  );
                }));
              });
            }
            
            // 重新插入单位
            if (units.length > 0) {
              units.forEach((unit: any, index: number) => {
                insertPromises.push(new Promise((resolve, reject) => {
                  db.run(
                    'INSERT INTO item_units (item_id, unit_name, conversion_rate, is_base_unit) VALUES (?, ?, ?, ?)',
                    [itemId, unit.name, unit.rate, index === 0],
                    (err) => err ? reject(err) : resolve(null)
                  );
                }));
              });
            }
            
            // 重新插入价格
            if (prices.length > 0) {
              prices.forEach((price: any) => {
                insertPromises.push(new Promise((resolve, reject) => {
                  db.run(
                    'INSERT INTO item_prices (item_id, price_type, price, min_quantity, max_quantity, customer_type) VALUES (?, ?, ?, ?, ?, ?)',
                    [itemId, price.type, price.price, price.min_qty || 1, price.max_qty, price.customer_type || 'all'],
                    (err) => err ? reject(err) : resolve(null)
                  );
                }));
              });
            }
            
            // 重新插入供应商
            if (suppliers.length > 0) {
              suppliers.forEach((supplier: any, index: number) => {
                insertPromises.push(new Promise((resolve, reject) => {
                  db.run(
                    'INSERT INTO item_suppliers (item_id, supplier_id, supplier_code, purchase_price, min_order_qty, lead_time, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [itemId, supplier.supplier_id, supplier.code, supplier.price, supplier.min_qty || 1, supplier.lead_time || 0, index === 0],
                    (err) => err ? reject(err) : resolve(null)
                  );
                }));
              });
            }
            
            return Promise.all(insertPromises);
          })
          .then(() => {
            db.run('COMMIT');
            res.json({ message: '货品更新成功' });
          })
          .catch(() => {
            db.run('ROLLBACK');
            res.status(500).json({ error: '更新货品扩展信息失败' });
          });
      }
    );
  });
});

// 删除货品
router.delete('/:id', (req, res) => {
  const itemId = req.params.id;
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // 检查是否有相关的订单记录
    db.get(
      'SELECT COUNT(*) as count FROM sales_order_items WHERE item_id = ?',
      [itemId],
      (err, result: any) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: '检查关联记录失败' });
        }
        
        if (result.count > 0) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: '该货品已有销售记录，不能删除' });
        }
        
        // 删除扩展信息
        const promises = ['item_barcodes', 'item_images', 'item_units', 'item_prices', 'item_suppliers'].map(table => {
          return new Promise((resolve, reject) => {
            db.run(`DELETE FROM ${table} WHERE item_id = ?`, [itemId], (err) => {
              err ? reject(err) : resolve(null);
            });
          });
        });
        
        Promise.all(promises)
          .then(() => {
            // 删除主记录
            db.run('DELETE FROM items WHERE id = ?', [itemId], function(err) {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: '删除货品失败' });
              }
              
              if (this.changes === 0) {
                db.run('ROLLBACK');
                return res.status(404).json({ error: '货品不存在' });
              }
              
              db.run('COMMIT');
              res.json({ message: '货品删除成功' });
            });
          })
          .catch(() => {
            db.run('ROLLBACK');
            res.status(500).json({ error: '删除货品扩展信息失败' });
          });
      }
    );
  });
});

// 根据条码查询货品
router.get('/barcode/:barcode', (req, res) => {
  const barcode = req.params.barcode;
  
  db.get(
    `SELECT i.*, ib.barcode, ib.barcode_type, ib.is_primary
     FROM items i 
     INNER JOIN item_barcodes ib ON i.id = ib.item_id 
     WHERE ib.barcode = ?`,
    [barcode],
    (err, item) => {
      if (err) return res.status(500).json({ error: '查询失败' });
      if (!item) return res.status(404).json({ error: '条码不存在' });
      res.json(item);
    }
  );
});

// 获取货品分类列表
router.get('/categories/list', (req, res) => {
  db.all(
    'SELECT DISTINCT category FROM items WHERE category IS NOT NULL AND category != "" ORDER BY category',
    [],
    (err, categories) => {
      if (err) return res.status(500).json({ error: '查询分类失败' });
      res.json(categories.map((c: any) => c.category));
    }
  );
});

export default router;