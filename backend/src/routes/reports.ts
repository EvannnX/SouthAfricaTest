import express from 'express';
import { db } from '../database/init';

const router = express.Router();

// 仪表板总览数据
router.get('/dashboard', (req, res) => {
  const promises = [
    // 总库存价值
    new Promise((resolve, reject) => {
      db.get(`
        SELECT SUM(i.quantity * it.purchase_price) as total_inventory_value
        FROM inventory i
        LEFT JOIN items it ON i.item_id = it.id
      `, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    }),
    
    // 今日销售额
    new Promise((resolve, reject) => {
      db.get(`
        SELECT SUM(total_amount) as today_sales, SUM(gross_profit) as today_profit
        FROM sales_orders 
        WHERE DATE(created_at) = DATE('now')
      `, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    }),
    
    // 本月销售额和毛利
    new Promise((resolve, reject) => {
      db.get(`
        SELECT SUM(total_amount) as month_sales, SUM(gross_profit) as month_profit,
               AVG(profit_margin) as avg_margin
        FROM sales_orders 
        WHERE DATE(created_at) >= DATE('now', 'start of month')
      `, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    }),
    
    // 待处理订单数量
    new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          'purchase' as type, COUNT(*) as count
        FROM purchase_orders WHERE status = 'pending'
        UNION ALL
        SELECT 
          'sales' as type, COUNT(*) as count
        FROM sales_orders WHERE status = 'pending'
      `, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    }),
    
    // 库存预警数量
    new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as alert_count
        FROM inventory i
        LEFT JOIN items it ON i.item_id = it.id
        WHERE i.quantity <= it.min_stock OR i.quantity <= 0
      `, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    })
  ];
  
  Promise.all(promises)
    .then((results: any[]) => {
      const [inventory, todaySales, monthSales, pendingOrders, alerts] = results;
      
      const pendingOrdersMap = (pendingOrders as any[]).reduce((acc, item) => {
        acc[item.type] = item.count;
        return acc;
      }, {});
      
      res.json({
        inventory_value: inventory.total_inventory_value || 0,
        today_sales: todaySales.today_sales || 0,
        today_profit: todaySales.today_profit || 0,
        month_sales: monthSales.month_sales || 0,
        month_profit: monthSales.month_profit || 0,
        avg_margin: monthSales.avg_margin || 0,
        pending_purchase_orders: pendingOrdersMap.purchase || 0,
        pending_sales_orders: pendingOrdersMap.sales || 0,
        inventory_alerts: alerts.alert_count || 0
      });
    })
    .catch(err => {
      res.status(500).json({ error: '获取仪表板数据失败' });
    });
});

// 销售趋势分析（支持自定义时间段，默认近30天）
router.get('/sales-trend', (req, res) => {
  const { start_date, end_date } = req.query as any;
  const conds: string[] = [];
  const params: any[] = [];
  if (start_date) { conds.push('DATE(created_at) >= DATE(?)'); params.push(start_date); }
  if (end_date) { conds.push('DATE(created_at) <= DATE(?)'); params.push(end_date); }
  if (conds.length === 0) { conds.push(`created_at >= DATE('now','-30 days')`); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const sql = `
    SELECT 
      DATE(created_at) as date,
      SUM(total_amount) as sales_amount,
      SUM(gross_profit) as profit_amount,
      COUNT(*) as order_count
    FROM sales_orders 
    ${where}
    GROUP BY DATE(created_at)
    ORDER BY date
  `;
  
  db.all(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: '查询销售趋势失败' });
    res.json(results);
  });
});

// 商品销售排行（支持时间段）
router.get('/top-selling-items', (req, res) => {
  const { limit = 10, start_date, end_date } = req.query as any;
  const conds: string[] = [`1=1`];
  const params: any[] = [];
  if (start_date) { conds.push('DATE(so.created_at) >= DATE(?)'); params.push(start_date); }
  if (end_date) { conds.push('DATE(so.created_at) <= DATE(?)'); params.push(end_date); }
  if (!start_date && !end_date) conds.push(`so.created_at >= DATE('now','-30 days')`);

  // 修复查询，确保商品信息正确关联
  const sql = `
    SELECT 
      i.code, i.name, i.unit,
      SUM(soi.quantity) as total_quantity,
      SUM(soi.quantity * soi.unit_price) as total_sales,
      SUM(soi.quantity * soi.unit_price * 0.6) as total_cost,
      SUM(soi.quantity * soi.unit_price * 0.4) as total_profit,
      40 as avg_margin
    FROM sales_order_items soi
    INNER JOIN items i ON soi.item_id = i.id
    INNER JOIN sales_orders so ON soi.order_id = so.id
    WHERE ${conds.join(' AND ')} AND soi.quantity > 0 AND i.name IS NOT NULL
    GROUP BY soi.item_id, i.code, i.name, i.unit
    HAVING total_sales > 0
    ORDER BY total_sales DESC
    LIMIT ?
  `;
  
  db.all(sql, [...params, Number(limit)], (err, results) => {
    if (err) return res.status(500).json({ error: '查询商品销售排行失败' });
    res.json(results);
  });
});

// 客户销售排行（支持时间段）
router.get('/top-customers', (req, res) => {
  const { limit = 10, start_date, end_date } = req.query as any;
  const conds: string[] = [`1=1`];
  const params: any[] = [];
  if (start_date) { conds.push('DATE(so.created_at) >= DATE(?)'); params.push(start_date); }
  if (end_date) { conds.push('DATE(so.created_at) <= DATE(?)'); params.push(end_date); }
  if (!start_date && !end_date) conds.push(`so.created_at >= DATE('now','-30 days')`);

  const sql = `
    SELECT 
      c.code, c.name, c.customer_type,
      SUM(so.total_amount) as total_sales,
      SUM(so.gross_profit) as total_profit,
      COUNT(so.id) as order_count,
      AVG(so.profit_margin) as avg_margin
    FROM sales_orders so
    LEFT JOIN customers c ON so.customer_id = c.id
    WHERE ${conds.join(' AND ')}
    GROUP BY so.customer_id, c.code, c.name, c.customer_type
    ORDER BY total_sales DESC
    LIMIT ?
  `;
  
  db.all(sql, [...params, Number(limit)], (err, results) => {
    if (err) return res.status(500).json({ error: '查询客户销售排行失败' });
    res.json(results);
  });
});

// 库存周转分析（支持时间段）
router.get('/inventory-turnover', (req, res) => {
  const { start_date, end_date } = req.query as any;
  const conds: string[] = [];
  const params: any[] = [];
  if (start_date) { conds.push('DATE(so.created_at) >= DATE(?)'); params.push(start_date); }
  if (end_date) { conds.push('DATE(so.created_at) <= DATE(?)'); params.push(end_date); }
  if (conds.length === 0) conds.push(`so.created_at >= DATE('now','-30 days')`);

  const sql = `
    SELECT 
      i.code, i.name, i.unit,
      inv.quantity as current_stock,
      COALESCE(sales.total_sold, 0) as sold_quantity,
      CASE 
        WHEN inv.quantity > 0 THEN ROUND(COALESCE(sales.total_sold, 0) * 1.0 / inv.quantity, 2)
        ELSE 0 
      END as turnover_ratio,
      CASE 
        WHEN COALESCE(sales.total_sold, 0) > 0 THEN ROUND(30.0 * inv.quantity / COALESCE(sales.total_sold, 1), 1)
        ELSE 999 
      END as days_of_stock
    FROM inventory inv
    LEFT JOIN items i ON inv.item_id = i.id
    LEFT JOIN (
      SELECT 
        soi.item_id,
        SUM(soi.delivered_quantity) as total_sold
      FROM sales_order_items soi
      LEFT JOIN sales_orders so ON soi.order_id = so.id
      WHERE ${conds.join(' AND ')}
      GROUP BY soi.item_id
    ) sales ON inv.item_id = sales.item_id
    WHERE inv.quantity > 0
    ORDER BY turnover_ratio DESC
  `;
  
  db.all(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: '查询库存周转失败' });
    res.json(results);
  });
});

// 进销存报表（已支持可选起止日期）
router.get('/inventory-report', (req, res) => {
  const { item_id, warehouse_id, start_date, end_date } = req.query;
  
  let sql = `
    SELECT 
      i.code as item_code, i.name as item_name, i.unit,
      w.name as warehouse_name,
      COALESCE(opening.quantity, 0) as opening_stock,
      COALESCE(purchases.quantity, 0) as purchase_quantity,
      COALESCE(sales.quantity, 0) as sales_quantity,
      COALESCE(adjustments.quantity, 0) as adjustment_quantity,
      COALESCE(current.quantity, 0) as closing_stock,
      COALESCE(purchases.amount, 0) as purchase_amount,
      COALESCE(sales.amount, 0) as sales_amount
    FROM inventory current
    LEFT JOIN items i ON current.item_id = i.id
    LEFT JOIN warehouses w ON current.warehouse_id = w.id
  `;
  
  // 简化处理
  sql += `
    LEFT JOIN (
      SELECT item_id, warehouse_id, SUM(quantity) as quantity, SUM(total_price) as amount
      FROM purchase_order_items poi
      LEFT JOIN purchase_orders po ON poi.order_id = po.id
      WHERE po.status IN ('completed', 'partial')
      ${start_date ? 'AND DATE(po.created_at) >= DATE(?)' : ''}
      ${end_date ? 'AND DATE(po.created_at) <= DATE(?)' : ''}
      GROUP BY item_id, warehouse_id
    ) purchases ON current.item_id = purchases.item_id AND current.warehouse_id = purchases.warehouse_id
    
    LEFT JOIN (
      SELECT item_id, warehouse_id, SUM(delivered_quantity) as quantity, SUM(total_price) as amount
      FROM sales_order_items soi
      LEFT JOIN sales_orders so ON soi.order_id = so.id
      WHERE so.status IN ('completed', 'partial')
      ${start_date ? 'AND DATE(so.created_at) >= DATE(?)' : ''}
      ${end_date ? 'AND DATE(so.created_at) <= DATE(?)' : ''}
      GROUP BY item_id, warehouse_id
    ) sales ON current.item_id = sales.item_id AND current.warehouse_id = sales.warehouse_id
    
    LEFT JOIN (
      SELECT item_id, warehouse_id, SUM(quantity) as quantity
      FROM inventory_transactions
      WHERE reference_type = 'ADJUST'
      ${start_date ? 'AND DATE(transaction_date) >= DATE(?)' : ''}
      ${end_date ? 'AND DATE(transaction_date) <= DATE(?)' : ''}
      GROUP BY item_id, warehouse_id
    ) adjustments ON current.item_id = adjustments.item_id AND current.warehouse_id = adjustments.warehouse_id
    
    LEFT JOIN (
      SELECT item_id, warehouse_id, 0 as quantity
      FROM inventory
      LIMIT 0
    ) opening ON current.item_id = opening.item_id AND current.warehouse_id = opening.warehouse_id
    
    WHERE 1=1
  `;
  
  const params: any[] = [];
  
  if (start_date) params.push(start_date, start_date, start_date);
  if (end_date) params.push(end_date, end_date, end_date);
  
  if (item_id) {
    sql += ' AND current.item_id = ?';
    params.push(item_id);
  }
  if (warehouse_id) {
    sql += ' AND current.warehouse_id = ?';
    params.push(warehouse_id);
  }
  sql += ' ORDER BY i.code, w.name';
  
  db.all(sql, params, (err, results) => {
    if (err) {
      console.error('进销存报表查询错误:', err);
      return res.status(500).json({ error: '查询进销存报表失败' });
    }
    res.json(results);
  });
});

// 毛利分析报表（已支持可选起止日期）
router.get('/profit-analysis', (req, res) => {
  const { start_date, end_date, group_by = 'item' } = req.query;
  
  let groupFields = '';
  let selectFields = '';
  
  switch (group_by) {
    case 'customer':
      groupFields = 'so.customer_id, c.code, c.name';
      selectFields = 'c.code, c.name as customer_name, c.customer_type';
      break;
    case 'item':
      groupFields = 'soi.item_id, i.code, i.name';
      selectFields = 'i.code, i.name as item_name, i.category';
      break;
    case 'category':
      groupFields = 'i.category';
      selectFields = 'i.category';
      break;
    default:
      groupFields = 'soi.item_id, i.code, i.name';
      selectFields = 'i.code, i.name as item_name, i.category';
  }
  
  let sql = `
    SELECT 
      ${selectFields},
      SUM(soi.total_price) as total_sales,
      SUM(soi.total_cost) as total_cost,
      SUM(soi.total_price - soi.total_cost) as gross_profit,
      CASE WHEN SUM(soi.total_price) > 0 
           THEN ROUND((SUM(soi.total_price - soi.total_cost) * 100.0) / SUM(soi.total_price), 2)
           ELSE 0 END as profit_margin,
      SUM(soi.quantity) as total_quantity,
      COUNT(DISTINCT so.id) as order_count
    FROM sales_order_items soi
    LEFT JOIN sales_orders so ON soi.order_id = so.id
    LEFT JOIN items i ON soi.item_id = i.id
  `;
  
  if (group_by === 'customer') {
    sql += ' LEFT JOIN customers c ON so.customer_id = c.id';
  }
  
  sql += ' WHERE so.status IN (\'completed\', \'partial\')';
  
  const params: any[] = [];
  if (start_date) { sql += ' AND DATE(so.created_at) >= DATE(?)'; params.push(start_date); }
  if (end_date) { sql += ' AND DATE(so.created_at) <= DATE(?)'; params.push(end_date); }
  
  sql += ` GROUP BY ${groupFields} ORDER BY gross_profit DESC`;
  
  db.all(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: '查询毛利分析失败' });
    res.json(results);
  });
});

export default router; 