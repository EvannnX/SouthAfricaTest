import express from 'express';
import { db } from '../database/init';

const router = express.Router();

// 创建支付记录
router.post('/', (req, res) => {
  const { 
    order_id, 
    order_type = 'sales',
    payment_method, 
    amount, 
    received_amount = 0, 
    change_amount = 0,
    discount_amount = 0,
    round_amount = 0,
    remarks 
  } = req.body;

  if (!order_id || !payment_method || !amount) {
    return res.status(400).json({ error: '订单ID、支付方式和金额不能为空' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // 插入支付记录
    db.run(
      `INSERT INTO payment_records (order_id, order_type, payment_method, amount, received_amount, 
       change_amount, discount_amount, round_amount, remarks) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order_id, order_type, payment_method, amount, received_amount, 
       change_amount, discount_amount, round_amount, remarks],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: '创建支付记录失败' });
        }

        const payment_id = this.lastID;

        // 更新销售订单的支付状态
        const final_amount = amount - discount_amount + round_amount;
        db.run(
          `UPDATE sales_orders SET 
           paid_amount = paid_amount + ?, 
           payment_status = CASE 
             WHEN paid_amount + ? >= final_amount THEN 'paid' 
             ELSE 'partial' 
           END,
           updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [received_amount, received_amount, order_id],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: '更新订单支付状态失败' });
            }

            db.run('COMMIT');
            res.status(201).json({ 
              id: payment_id, 
              message: '支付记录创建成功',
              payment_method,
              amount: received_amount,
              change_amount
            });
          }
        );
      }
    );
  });
});

// 获取订单的支付记录
router.get('/order/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  
  db.all(
    'SELECT * FROM payment_records WHERE order_id = ? ORDER BY created_at DESC',
    [orderId],
    (err, payments) => {
      if (err) return res.status(500).json({ error: '查询支付记录失败' });
      res.json(payments);
    }
  );
});

// 创建分期付款计划
router.post('/installment', (req, res) => {
  const { order_id, total_amount, installments, first_payment = 0 } = req.body;

  if (!order_id || !total_amount || !installments || installments < 2) {
    return res.status(400).json({ error: '参数错误，分期数必须大于等于2' });
  }

  const remaining_amount = total_amount - first_payment;
  const installment_amount = Math.round((remaining_amount / installments) * 100) / 100;
  const last_installment_amount = remaining_amount - (installment_amount * (installments - 1));

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // 更新销售订单为分期付款
    db.run(
      `UPDATE sales_orders SET 
       payment_type = 'installment',
       payment_status = ?,
       paid_amount = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [first_payment > 0 ? 'partial' : 'unpaid', first_payment, order_id],
      (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: '更新订单失败' });
        }

        // 创建分期付款记录
        const installmentPromises = [];
        for (let i = 1; i <= installments; i++) {
          const due_date = new Date();
          due_date.setMonth(due_date.getMonth() + i);
          
          const amount = i === installments ? last_installment_amount : installment_amount;
          
          installmentPromises.push(new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO installment_payments (order_id, installment_no, total_installments, 
               amount, due_date) VALUES (?, ?, ?, ?, ?)`,
              [order_id, i, installments, amount, due_date.toISOString().split('T')[0]],
              (err) => {
                if (err) reject(err);
                else resolve(null);
              }
            );
          }));
        }

        Promise.all(installmentPromises)
          .then(() => {
            db.run('COMMIT');
            res.status(201).json({ 
              message: '分期付款计划创建成功',
              installments,
              installment_amount,
              last_installment_amount
            });
          })
          .catch(() => {
            db.run('ROLLBACK');
            res.status(500).json({ error: '创建分期付款计划失败' });
          });
      }
    );
  });
});

// 分期付款
router.post('/installment/:id/pay', (req, res) => {
  const installmentId = req.params.id;
  const { payment_method, paid_amount, remarks } = req.body;

  if (!payment_method || !paid_amount) {
    return res.status(400).json({ error: '支付方式和金额不能为空' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // 更新分期付款记录
    db.run(
      `UPDATE installment_payments SET 
       paid_amount = paid_amount + ?, 
       status = CASE 
         WHEN paid_amount + ? >= amount THEN 'paid' 
         ELSE 'partial' 
       END,
       payment_method = ?,
       paid_date = CASE 
         WHEN paid_amount + ? >= amount THEN CURRENT_TIMESTAMP 
         ELSE paid_date 
       END,
       remarks = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [paid_amount, paid_amount, payment_method, paid_amount, remarks, installmentId],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: '更新分期付款记录失败' });
        }

        if (this.changes === 0) {
          db.run('ROLLBACK');
          return res.status(404).json({ error: '分期付款记录不存在' });
        }

        // 获取订单ID以更新总的支付状态
        db.get(
          'SELECT order_id FROM installment_payments WHERE id = ?',
          [installmentId],
          (err, installment: any) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: '查询分期付款信息失败' });
            }

            // 更新销售订单的已付金额
            db.run(
              'UPDATE sales_orders SET paid_amount = paid_amount + ? WHERE id = ?',
              [paid_amount, installment.order_id],
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: '更新订单支付金额失败' });
                }

                // 检查是否所有分期都已付清
                db.get(
                  `SELECT COUNT(*) as unpaid FROM installment_payments 
                   WHERE order_id = ? AND status != 'paid'`,
                  [installment.order_id],
                  (err, result: any) => {
                    if (err) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: '检查分期付款状态失败' });
                    }

                    const payment_status = result.unpaid === 0 ? 'paid' : 'partial';
                    db.run(
                      'UPDATE sales_orders SET payment_status = ? WHERE id = ?',
                      [payment_status, installment.order_id],
                      (err) => {
                        if (err) {
                          db.run('ROLLBACK');
                          return res.status(500).json({ error: '更新订单支付状态失败' });
                        }

                        db.run('COMMIT');
                        res.json({ 
                          message: '分期付款成功',
                          payment_method,
                          paid_amount,
                          all_paid: payment_status === 'paid'
                        });
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

// 获取分期付款记录
router.get('/installment/order/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  
  db.all(
    `SELECT * FROM installment_payments 
     WHERE order_id = ? 
     ORDER BY installment_no`,
    [orderId],
    (err, installments) => {
      if (err) return res.status(500).json({ error: '查询分期付款记录失败' });
      res.json(installments);
    }
  );
});

// 获取待还款的分期付款（仪表盘用）
router.get('/installment/pending', (req, res) => {
  db.all(
    `SELECT ip.*, so.order_no, c.name as customer_name
     FROM installment_payments ip
     LEFT JOIN sales_orders so ON ip.order_id = so.id
     LEFT JOIN customers c ON so.customer_id = c.id
     WHERE ip.status != 'paid'
     ORDER BY ip.due_date ASC`,
    [],
    (err, installments) => {
      if (err) return res.status(500).json({ error: '查询待还款记录失败' });
      res.json(installments);
    }
  );
});

export default router;
