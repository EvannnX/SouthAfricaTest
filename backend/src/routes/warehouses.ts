import express from 'express';
import { db } from '../database/init';

const router = express.Router();

router.get('/', (req, res) => {
  db.all('SELECT * FROM warehouses ORDER BY created_at DESC', (err, warehouses) => {
    if (err) return res.status(500).json({ error: '查询仓库失败' });
    res.json(warehouses);
  });
});

router.post('/', (req, res) => {
  const { code, name, address, manager } = req.body;
  
  if (!code || !name) {
    return res.status(400).json({ error: '仓库编码和名称不能为空' });
  }
  
  const sql = `INSERT INTO warehouses (code, name, address, manager) VALUES (?, ?, ?, ?)`;
  
  db.run(sql, [code, name, address, manager], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: '仓库编码已存在' });
      }
      return res.status(500).json({ error: '创建仓库失败' });
    }
    res.status(201).json({ id: this.lastID, message: '仓库创建成功' });
  });
});

router.put('/:id', (req, res) => {
  const { name, address, manager, status } = req.body;
  
  const sql = `UPDATE warehouses SET name = ?, address = ?, manager = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  
  db.run(sql, [name, address, manager, status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: '更新仓库失败' });
    if (this.changes === 0) return res.status(404).json({ error: '仓库不存在' });
    res.json({ message: '仓库更新成功' });
  });
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM warehouses WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: '删除仓库失败' });
    if (this.changes === 0) return res.status(404).json({ error: '仓库不存在' });
    res.json({ message: '仓库删除成功' });
  });
});

export default router; 