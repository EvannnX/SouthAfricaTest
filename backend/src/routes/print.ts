import express from 'express';
import { db } from '../database/init';

const router = express.Router();

// 获取打印数据
router.get('/receipt/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  const { format = '80mm', include_tax = 'true' } = req.query;
  
  // 获取订单信息
  db.get(
    `SELECT so.*, c.name as customer_name, c.tax_number as customer_tax, 
     w.name as warehouse_name, w.address as warehouse_address
     FROM sales_orders so 
     LEFT JOIN customers c ON so.customer_id = c.id 
     LEFT JOIN warehouses w ON so.warehouse_id = w.id 
     WHERE so.id = ?`,
    [orderId],
    (err, order: any) => {
      if (err) return res.status(500).json({ error: '查询订单失败' });
      if (!order) return res.status(404).json({ error: '订单不存在' });
      
      // 获取订单明细
      db.all(
        `SELECT soi.*, i.name as item_name, i.code as item_code, i.unit, i.en_name
         FROM sales_order_items soi 
         LEFT JOIN items i ON soi.item_id = i.id 
         WHERE soi.order_id = ?`,
        [orderId],
        (err, items) => {
          if (err) return res.status(500).json({ error: '查询订单明细失败' });
          
          // 获取支付记录
          db.all(
            'SELECT * FROM payment_records WHERE order_id = ?',
            [orderId],
            (err, payments) => {
              if (err) return res.status(500).json({ error: '查询支付记录失败' });
              
              const printData = {
                order,
                items,
                payments,
                print_config: {
                  format,
                  include_tax: include_tax === 'true',
                  print_time: new Date().toLocaleString(),
                  tax_rate: 0.15 // 南非增值税率15%
                }
              };
              
              res.json(printData);
            }
          );
        }
      );
    }
  );
});

// 生成打印HTML
router.post('/generate', (req, res) => {
  const { order, items, payments, print_config } = req.body;
  
  if (!order || !items) {
    return res.status(400).json({ error: '订单数据不完整' });
  }
  
  const { format, include_tax, tax_rate = 0.15 } = print_config;
  
  let html = '';
  
  if (format === '80mm') {
    // 80mm小票格式
    html = generate80mmReceipt(order, items, payments, include_tax, tax_rate);
  } else if (format === 'A4') {
    // A4格式
    html = generateA4Receipt(order, items, payments, include_tax, tax_rate);
  } else if (format === 'A5') {
    // A5格式
    html = generateA5Receipt(order, items, payments, include_tax, tax_rate);
  } else {
    return res.status(400).json({ error: '不支持的打印格式' });
  }
  
  res.json({ html });
});

// 生成80mm小票HTML
function generate80mmReceipt(order: any, items: any[], payments: any[], include_tax: boolean, tax_rate: number) {
  const tax_amount = include_tax ? (order.final_amount * tax_rate) / (1 + tax_rate) : 0;
  const net_amount = order.final_amount - tax_amount;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>销售小票</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            width: 72mm; 
            margin: 0; 
            padding: 2mm;
            font-size: 12px;
            line-height: 1.2;
        }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 2px 0; }
        .double-line { border-top: 2px solid #000; margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 1px 2px; font-size: 11px; }
        .item-line { display: flex; justify-content: space-between; }
    </style>
</head>
<body>
    <div class="center bold">BlueLink 销售系统</div>
    <div class="center">南非销售小票</div>
    <div class="line"></div>
    
    <div>单号: ${order.order_no}</div>
    <div>时间: ${new Date(order.created_at).toLocaleString()}</div>
    <div>客户: ${order.customer_name || '散客'}</div>
    <div class="line"></div>
    
    <table>
        <tr>
            <th style="text-align:left">商品</th>
            <th>数量</th>
            <th>单价</th>
            <th style="text-align:right">小计</th>
        </tr>
        ${items.map(item => `
        <tr>
            <td style="text-align:left">${item.item_name}</td>
            <td>${item.quantity}</td>
            <td>R${item.unit_price.toFixed(2)}</td>
            <td style="text-align:right">R${item.total_price.toFixed(2)}</td>
        </tr>
        `).join('')}
    </table>
    
    <div class="line"></div>
    <div class="item-line">
        <span>小计:</span>
        <span>R${order.total_amount.toFixed(2)}</span>
    </div>
    
    ${order.discount_amount > 0 ? `
    <div class="item-line">
        <span>折扣:</span>
        <span>-R${order.discount_amount.toFixed(2)}</span>
    </div>
    ` : ''}
    
    ${order.round_amount !== 0 ? `
    <div class="item-line">
        <span>抹零:</span>
        <span>${order.round_amount > 0 ? '+' : ''}R${order.round_amount.toFixed(2)}</span>
    </div>
    ` : ''}
    
    ${include_tax ? `
    <div class="item-line">
        <span>净额:</span>
        <span>R${net_amount.toFixed(2)}</span>
    </div>
    <div class="item-line">
        <span>增值税(15%):</span>
        <span>R${tax_amount.toFixed(2)}</span>
    </div>
    ` : ''}
    
    <div class="double-line"></div>
    <div class="item-line bold">
        <span>应付:</span>
        <span>R${order.final_amount.toFixed(2)}</span>
    </div>
    
    ${payments.map(payment => `
    <div class="item-line">
        <span>${getPaymentMethodText(payment.payment_method)}:</span>
        <span>R${payment.received_amount.toFixed(2)}</span>
    </div>
    ${payment.change_amount > 0 ? `
    <div class="item-line">
        <span>找零:</span>
        <span>R${payment.change_amount.toFixed(2)}</span>
    </div>
    ` : ''}
    `).join('')}
    
    <div class="line"></div>
    <div class="center">谢谢惠顾！</div>
    <div class="center">Thank you!</div>
    
    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>`;
}

// 生成A4格式HTML
function generateA4Receipt(order: any, items: any[], payments: any[], include_tax: boolean, tax_rate: number) {
  const tax_amount = include_tax ? (order.final_amount * tax_rate) / (1 + tax_rate) : 0;
  const net_amount = order.final_amount - tax_amount;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>销售发票</title>
    <style>
        body { 
            font-family: Arial, 'Microsoft YaHei', sans-serif; 
            margin: 20px;
            font-size: 14px;
            line-height: 1.4;
        }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .invoice-title { font-size: 18px; margin-bottom: 20px; }
        .info-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .info-box { flex: 1; margin-right: 20px; }
        .info-box:last-child { margin-right: 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .right { text-align: right; }
        .center { text-align: center; }
        .total-section { margin-top: 20px; }
        .total-line { display: flex; justify-content: space-between; margin: 5px 0; }
        .total-line.final { font-weight: bold; font-size: 16px; border-top: 2px solid #000; padding-top: 5px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">BlueLink 销售系统</div>
        <div class="invoice-title">销售发票 / Sales Invoice</div>
    </div>
    
    <div class="info-section">
        <div class="info-box">
            <h3>发票信息 / Invoice Info</h3>
            <p><strong>发票号:</strong> ${order.order_no}</p>
            <p><strong>开票日期:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
            <p><strong>交货日期:</strong> ${order.delivery_date || '即时'}</p>
        </div>
        <div class="info-box">
            <h3>客户信息 / Customer Info</h3>
            <p><strong>客户名称:</strong> ${order.customer_name || '散客'}</p>
            ${order.customer_tax ? `<p><strong>税号:</strong> ${order.customer_tax}</p>` : ''}
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>商品编码 / Item Code</th>
                <th>商品名称 / Item Name</th>
                <th class="center">数量 / Qty</th>
                <th class="right">单价 / Unit Price (R)</th>
                <th class="right">小计 / Subtotal (R)</th>
            </tr>
        </thead>
        <tbody>
            ${items.map(item => `
            <tr>
                <td>${item.item_code}</td>
                <td>${item.item_name}${item.en_name ? `<br><small>${item.en_name}</small>` : ''}</td>
                <td class="center">${item.quantity} ${item.unit}</td>
                <td class="right">${item.unit_price.toFixed(2)}</td>
                <td class="right">${item.total_price.toFixed(2)}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="total-section">
        <div class="total-line">
            <span>小计 / Subtotal:</span>
            <span>R ${order.total_amount.toFixed(2)}</span>
        </div>
        
        ${order.discount_amount > 0 ? `
        <div class="total-line">
            <span>折扣 / Discount:</span>
            <span>-R ${order.discount_amount.toFixed(2)}</span>
        </div>
        ` : ''}
        
        ${order.round_amount !== 0 ? `
        <div class="total-line">
            <span>抹零 / Rounding:</span>
            <span>${order.round_amount > 0 ? '+' : ''}R ${order.round_amount.toFixed(2)}</span>
        </div>
        ` : ''}
        
        ${include_tax ? `
        <div class="total-line">
            <span>净额 / Net Amount:</span>
            <span>R ${net_amount.toFixed(2)}</span>
        </div>
        <div class="total-line">
            <span>增值税 / VAT (15%):</span>
            <span>R ${tax_amount.toFixed(2)}</span>
        </div>
        ` : ''}
        
        <div class="total-line final">
            <span>总计 / Total:</span>
            <span>R ${order.final_amount.toFixed(2)}</span>
        </div>
    </div>
    
    ${payments.length > 0 ? `
    <div class="total-section">
        <h3>支付信息 / Payment Info</h3>
        ${payments.map(payment => `
        <div class="total-line">
            <span>${getPaymentMethodText(payment.payment_method)}:</span>
            <span>R ${payment.received_amount.toFixed(2)}</span>
        </div>
        ${payment.change_amount > 0 ? `
        <div class="total-line">
            <span>找零 / Change:</span>
            <span>R ${payment.change_amount.toFixed(2)}</span>
        </div>
        ` : ''}
        `).join('')}
    </div>
    ` : ''}
    
    <div class="footer">
        <p>本发票一式两份，买卖双方各执一份</p>
        <p>This invoice is made in duplicate, one copy for each party</p>
        <p>所有价格均以南非兰特(ZAR)结算 / All prices are in South African Rand (ZAR)</p>
    </div>
    
    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>`;
}

// 生成A5格式HTML
function generateA5Receipt(order: any, items: any[], payments: any[], include_tax: boolean, tax_rate: number) {
  // A5格式类似A4但更紧凑
  return generateA4Receipt(order, items, payments, include_tax, tax_rate)
    .replace('margin: 20px;', 'margin: 15px;')
    .replace('font-size: 14px;', 'font-size: 12px;')
    .replace('font-size: 24px;', 'font-size: 20px;')
    .replace('font-size: 18px;', 'font-size: 16px;');
}

// 支付方式文本
function getPaymentMethodText(method: string): string {
  switch (method) {
    case 'cash': return '现金/Cash';
    case 'card': return '刷卡/Card';
    case 'transfer': return '转账/EFT';
    default: return method;
  }
}

export default router;
