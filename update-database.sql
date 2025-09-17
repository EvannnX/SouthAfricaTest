-- 更新用户表，添加权限字段
ALTER TABLE users ADD COLUMN warehouse_id INTEGER NULL;
ALTER TABLE users ADD COLUMN can_modify_price BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN can_discount BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN max_discount_percent DECIMAL(5,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN can_access_reports BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN can_manage_users BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- 更新客户表，添加税号和注册日期
ALTER TABLE customers ADD COLUMN tax_number VARCHAR(50);
ALTER TABLE customers ADD COLUMN payment_terms VARCHAR(50) DEFAULT 'cash';
ALTER TABLE customers ADD COLUMN registration_date DATE DEFAULT CURRENT_DATE;

-- 更新供应商表，添加银行信息
ALTER TABLE suppliers ADD COLUMN tax_number VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN bank_name VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN bank_account VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN payment_terms VARCHAR(50) DEFAULT 'net_30';
ALTER TABLE suppliers ADD COLUMN supplier_type VARCHAR(20) DEFAULT 'manufacturer';

-- 更新销售订单表，添加支付相关字段
ALTER TABLE sales_orders ADD COLUMN discount_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE sales_orders ADD COLUMN round_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE sales_orders ADD COLUMN final_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE sales_orders ADD COLUMN paid_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE sales_orders ADD COLUMN payment_status VARCHAR(20) DEFAULT 'unpaid';
ALTER TABLE sales_orders ADD COLUMN payment_type VARCHAR(20) DEFAULT 'full';

-- 创建支付记录表
CREATE TABLE IF NOT EXISTS payment_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  order_type VARCHAR(20) DEFAULT 'sales',
  payment_method VARCHAR(20) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  received_amount DECIMAL(12,2) DEFAULT 0,
  change_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  round_amount DECIMAL(12,2) DEFAULT 0,
  payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'completed',
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES sales_orders(id)
);

-- 创建分期付款表
CREATE TABLE IF NOT EXISTS installment_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  installment_no INTEGER NOT NULL,
  total_installments INTEGER NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  paid_date DATETIME NULL,
  status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(20) NULL,
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES sales_orders(id)
);

-- 创建商品条码表
CREATE TABLE IF NOT EXISTS item_barcodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  barcode VARCHAR(100) NOT NULL,
  barcode_type VARCHAR(20) DEFAULT 'custom',
  is_primary BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id),
  UNIQUE(barcode)
);

-- 创建商品图片表
CREATE TABLE IF NOT EXISTS item_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  image_type VARCHAR(20) DEFAULT 'main',
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

-- 创建商品多单位表
CREATE TABLE IF NOT EXISTS item_units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  unit_name VARCHAR(20) NOT NULL,
  conversion_rate DECIMAL(10,4) NOT NULL DEFAULT 1,
  is_base_unit BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

-- 创建商品价格表
CREATE TABLE IF NOT EXISTS item_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  price_type VARCHAR(20) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER NULL,
  customer_type VARCHAR(20) DEFAULT 'all',
  effective_date DATE DEFAULT CURRENT_DATE,
  expire_date DATE NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

-- 创建商品供应商关系表
CREATE TABLE IF NOT EXISTS item_suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  supplier_id INTEGER NOT NULL,
  supplier_code VARCHAR(50),
  purchase_price DECIMAL(10,2) NOT NULL,
  min_order_qty INTEGER DEFAULT 1,
  lead_time INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- 插入示例数据
INSERT OR IGNORE INTO item_barcodes (item_id, barcode, barcode_type, is_primary) VALUES
(1, '8888888888881', 'ean13', TRUE),
(2, '8888888888882', 'ean13', TRUE),
(3, '8888888888883', 'ean13', TRUE),
(4, '8888888888884', 'ean13', TRUE);

INSERT OR IGNORE INTO item_prices (item_id, price_type, price, customer_type) VALUES
(1, 'retail', 2899.00, 'retail'),
(1, 'wholesale', 2699.00, 'wholesale'),
(1, 'vip', 2799.00, 'vip'),
(2, 'retail', 3599.00, 'retail'),
(2, 'wholesale', 3399.00, 'wholesale'),
(2, 'vip', 3499.00, 'vip'),
(3, 'retail', 2399.00, 'retail'),
(3, 'wholesale', 2199.00, 'wholesale'),
(3, 'vip', 2299.00, 'vip'),
(4, 'retail', 3199.00, 'retail'),
(4, 'wholesale', 2999.00, 'wholesale'),
(4, 'vip', 3099.00, 'vip');
