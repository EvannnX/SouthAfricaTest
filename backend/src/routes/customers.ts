import express from 'express';
import { db } from '../database/init';

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, search, customer_type } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);
  
  let sql = 'SELECT * FROM customers WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as total FROM customers WHERE 1=1';
  const params: any[] = [];
  
  if (search) {
    sql += ' AND (code LIKE ? OR name LIKE ?)';
    countSql += ' AND (code LIKE ? OR name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (customer_type) {
    sql += ' AND customer_type = ?';
    countSql += ' AND customer_type = ?';
    params.push(customer_type);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  
  db.get(countSql, params, (err, countResult: any) => {
    if (err) return res.status(500).json({ error: '查询失败' });
    
    db.all(sql, [...params, Number(pageSize), offset], (err, customers) => {
      if (err) return res.status(500).json({ error: '查询客户失败' });
      res.json({ data: customers, total: countResult.total, page: Number(page), pageSize: Number(pageSize) });
    });
  });
});

router.post('/', (req, res) => {
  const { code, name, contact_person, phone, email, address, customer_type, credit_limit } = req.body;
  
  if (!code || !name) {
    return res.status(400).json({ error: '客户编码和名称不能为空' });
  }
  
  const sql = `INSERT INTO customers (code, name, contact_person, phone, email, address, customer_type, credit_limit) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [code, name, contact_person, phone, email, address, customer_type || 'retail', credit_limit || 0], 
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: '客户编码已存在' });
        }
        return res.status(500).json({ error: '创建客户失败' });
      }
      res.status(201).json({ id: this.lastID, message: '客户创建成功' });
    });
});

router.put('/:id', (req, res) => {
  const { name, contact_person, phone, email, address, customer_type, credit_limit, status } = req.body;
  
  const sql = `UPDATE customers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, 
               customer_type = ?, credit_limit = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  
  db.run(sql, [name, contact_person, phone, email, address, customer_type, credit_limit, status, req.params.id], 
    function(err) {
      if (err) return res.status(500).json({ error: '更新客户失败' });
      if (this.changes === 0) return res.status(404).json({ error: '客户不存在' });
      res.json({ message: '客户更新成功' });
    });
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM customers WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: '删除客户失败' });
    if (this.changes === 0) return res.status(404).json({ error: '客户不存在' });
    res.json({ message: '客户删除成功' });
  });
});

export default router; 