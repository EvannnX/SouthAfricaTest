import express from 'express';
import { db } from '../database/init';

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, search } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);
  
  let sql = 'SELECT * FROM suppliers WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as total FROM suppliers WHERE 1=1';
  const params: any[] = [];
  
  if (search) {
    sql += ' AND (code LIKE ? OR name LIKE ?)';
    countSql += ' AND (code LIKE ? OR name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  
  db.get(countSql, params, (err, countResult: any) => {
    if (err) return res.status(500).json({ error: '查询失败' });
    
    db.all(sql, [...params, Number(pageSize), offset], (err, suppliers) => {
      if (err) return res.status(500).json({ error: '查询供应商失败' });
      res.json({ data: suppliers, total: countResult.total, page: Number(page), pageSize: Number(pageSize) });
    });
  });
});

router.post('/', (req, res) => {
  const { code, name, contact_person, phone, email, address } = req.body;
  
  if (!code || !name) {
    return res.status(400).json({ error: '供应商编码和名称不能为空' });
  }
  
  const sql = `INSERT INTO suppliers (code, name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [code, name, contact_person, phone, email, address], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: '供应商编码已存在' });
      }
      return res.status(500).json({ error: '创建供应商失败' });
    }
    res.status(201).json({ id: this.lastID, message: '供应商创建成功' });
  });
});

router.put('/:id', (req, res) => {
  const { name, contact_person, phone, email, address, status } = req.body;
  
  const sql = `UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  
  db.run(sql, [name, contact_person, phone, email, address, status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: '更新供应商失败' });
    if (this.changes === 0) return res.status(404).json({ error: '供应商不存在' });
    res.json({ message: '供应商更新成功' });
  });
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM suppliers WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: '删除供应商失败' });
    if (this.changes === 0) return res.status(404).json({ error: '供应商不存在' });
    res.json({ message: '供应商删除成功' });
  });
});

export default router; 