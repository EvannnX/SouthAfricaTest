import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

const dbPath = path.join(process.cwd(), 'database/wms.db');

// 确保数据库目录存在
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log('数据库路径:', dbPath);

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功:', dbPath);
  }
});

export const initDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('开始初始化数据库...');
    
    db.serialize(() => {
      // 用户表
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(100),
          role VARCHAR(20) DEFAULT 'user',
          warehouse_id INTEGER NULL,
          can_modify_price BOOLEAN DEFAULT FALSE,
          can_discount BOOLEAN DEFAULT FALSE,
          max_discount_percent DECIMAL(5,2) DEFAULT 0,
          can_access_reports BOOLEAN DEFAULT FALSE,
          can_manage_users BOOLEAN DEFAULT FALSE,
          status VARCHAR(20) DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
        )
      `, (err) => {
        if (err) console.error('创建用户表失败:', err);
        else console.log('用户表创建成功');
      });

      // 货品表
      db.run(`
        CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(200) NOT NULL,
          en_name VARCHAR(200),
          category VARCHAR(100),
          unit VARCHAR(20) DEFAULT '个',
          description TEXT,
          purchase_price DECIMAL(10,2) DEFAULT 0,
          sale_price DECIMAL(10,2) DEFAULT 0,
          min_stock INTEGER DEFAULT 0,
          max_stock INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('创建货品表失败:', err);
        else console.log('货品表创建成功');
      });

      // 迁移：如果 items 表缺少 en_name 列，尝试新增（存在则忽略错误）
      db.run(`ALTER TABLE items ADD COLUMN en_name VARCHAR(200)`, (e)=>{
        if (e && !String(e.message||'').includes('duplicate column name')) {
          console.warn('迁移 en_name 列失败：', e.message)
        }
      })

      // 供应商表
      db.run(`
        CREATE TABLE IF NOT EXISTS suppliers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(200) NOT NULL,
          contact_person VARCHAR(100),
          phone VARCHAR(20),
          email VARCHAR(100),
          address TEXT,
          tax_number VARCHAR(50),
          bank_name VARCHAR(100),
          bank_account VARCHAR(50),
          payment_terms VARCHAR(50) DEFAULT 'net_30',
          supplier_type VARCHAR(20) DEFAULT 'manufacturer',
          status VARCHAR(20) DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('创建供应商表失败:', err);
        else console.log('供应商表创建成功');
      });

      // 客户表
      db.run(`
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(200) NOT NULL,
          contact_person VARCHAR(100),
          phone VARCHAR(20),
          email VARCHAR(100),
          address TEXT,
          tax_number VARCHAR(50),
          customer_type VARCHAR(20) DEFAULT 'retail',
          credit_limit DECIMAL(10,2) DEFAULT 0,
          payment_terms VARCHAR(50) DEFAULT 'cash',
          registration_date DATE DEFAULT CURRENT_DATE,
          status VARCHAR(20) DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('创建客户表失败:', err);
        else console.log('客户表创建成功');
      });

      // 仓库表
      db.run(`
        CREATE TABLE IF NOT EXISTS warehouses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(200) NOT NULL,
          address TEXT,
          manager VARCHAR(100),
          status VARCHAR(20) DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('创建仓库表失败:', err);
        else console.log('仓库表创建成功');
      });

      // 采购订单表
      db.run(`
        CREATE TABLE IF NOT EXISTS purchase_orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_no VARCHAR(50) UNIQUE NOT NULL,
          supplier_id INTEGER NOT NULL,
          warehouse_id INTEGER NOT NULL,
          order_date DATE NOT NULL,
          expected_date DATE,
          total_amount DECIMAL(12,2) DEFAULT 0,
          status VARCHAR(20) DEFAULT 'pending',
          remarks TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
          FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
        )
      `, (err) => {
        if (err) console.error('创建采购订单表失败:', err);
        else console.log('采购订单表创建成功');
      });

      // 采购订单明细表
      db.run(`
        CREATE TABLE IF NOT EXISTS purchase_order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          item_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          total_price DECIMAL(12,2) NOT NULL,
          received_quantity INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES purchase_orders(id),
          FOREIGN KEY (item_id) REFERENCES items(id)
        )
      `, (err) => {
        if (err) console.error('创建采购订单明细表失败:', err);
        else console.log('采购订单明细表创建成功');
      });

      // 销售订单表
      db.run(`
        CREATE TABLE IF NOT EXISTS sales_orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_no VARCHAR(50) UNIQUE NOT NULL,
          customer_id INTEGER NOT NULL,
          warehouse_id INTEGER NOT NULL,
          order_date DATE NOT NULL,
          delivery_date DATE,
          total_amount DECIMAL(12,2) DEFAULT 0,
          discount_amount DECIMAL(12,2) DEFAULT 0,
          round_amount DECIMAL(12,2) DEFAULT 0,
          final_amount DECIMAL(12,2) DEFAULT 0,
          paid_amount DECIMAL(12,2) DEFAULT 0,
          total_cost DECIMAL(12,2) DEFAULT 0,
          gross_profit DECIMAL(12,2) DEFAULT 0,
          profit_margin DECIMAL(5,2) DEFAULT 0,
          payment_status VARCHAR(20) DEFAULT 'unpaid',
          payment_type VARCHAR(20) DEFAULT 'full',
          status VARCHAR(20) DEFAULT 'pending',
          remarks TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers(id),
          FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
        )
      `, (err) => {
        if (err) console.error('创建销售订单表失败:', err);
        else console.log('销售订单表创建成功');
      });

      // 销售订单明细表
      db.run(`
        CREATE TABLE IF NOT EXISTS sales_order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          item_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          unit_cost DECIMAL(10,2) NOT NULL,
          total_price DECIMAL(12,2) NOT NULL,
          total_cost DECIMAL(12,2) NOT NULL,
          delivered_quantity INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES sales_orders(id),
          FOREIGN KEY (item_id) REFERENCES items(id)
        )
      `, (err) => {
        if (err) console.error('创建销售订单明细表失败:', err);
        else console.log('销售订单明细表创建成功');
      });

      // 库存表
      db.run(`
        CREATE TABLE IF NOT EXISTS inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id INTEGER NOT NULL,
          warehouse_id INTEGER NOT NULL,
          quantity INTEGER DEFAULT 0,
          available_quantity INTEGER DEFAULT 0,
          reserved_quantity INTEGER DEFAULT 0,
          avg_cost DECIMAL(10,2) DEFAULT 0,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (item_id) REFERENCES items(id),
          FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
          UNIQUE(item_id, warehouse_id)
        )
      `, (err) => {
        if (err) console.error('创建库存表失败:', err);
        else console.log('库存表创建成功');
      });

      // 库存交易流水表
      db.run(`
        CREATE TABLE IF NOT EXISTS inventory_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id INTEGER NOT NULL,
          warehouse_id INTEGER NOT NULL,
          transaction_type VARCHAR(20) NOT NULL,
          reference_no VARCHAR(50),
          reference_type VARCHAR(20),
          quantity INTEGER NOT NULL,
          unit_cost DECIMAL(10,2),
          transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          remarks TEXT,
          FOREIGN KEY (item_id) REFERENCES items(id),
          FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
        )
      `, (err) => {
        if (err) console.error('创建库存交易表失败:', err);
        else console.log('库存交易表创建成功');
      });

      // 支付记录表
      db.run(`
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
        )
      `, (err) => {
        if (err) console.error('创建支付记录表失败:', err);
        else console.log('支付记录表创建成功');
      });

      // 分期付款表
      db.run(`
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
        )
      `, (err) => {
        if (err) console.error('创建分期付款表失败:', err);
        else console.log('分期付款表创建成功');
      });

      // 商品条码表
      db.run(`
        CREATE TABLE IF NOT EXISTS item_barcodes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id INTEGER NOT NULL,
          barcode VARCHAR(100) NOT NULL,
          barcode_type VARCHAR(20) DEFAULT 'custom',
          is_primary BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (item_id) REFERENCES items(id),
          UNIQUE(barcode)
        )
      `, (err) => {
        if (err) console.error('创建商品条码表失败:', err);
        else console.log('商品条码表创建成功');
      });

      // 商品图片表
      db.run(`
        CREATE TABLE IF NOT EXISTS item_images (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id INTEGER NOT NULL,
          image_url VARCHAR(500) NOT NULL,
          image_type VARCHAR(20) DEFAULT 'main',
          sort_order INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (item_id) REFERENCES items(id)
        )
      `, (err) => {
        if (err) console.error('创建商品图片表失败:', err);
        else console.log('商品图片表创建成功');
      });

      // 商品多单位表
      db.run(`
        CREATE TABLE IF NOT EXISTS item_units (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id INTEGER NOT NULL,
          unit_name VARCHAR(20) NOT NULL,
          conversion_rate DECIMAL(10,4) NOT NULL DEFAULT 1,
          is_base_unit BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (item_id) REFERENCES items(id)
        )
      `, (err) => {
        if (err) console.error('创建商品多单位表失败:', err);
        else console.log('商品多单位表创建成功');
      });

      // 商品价格表
      db.run(`
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
        )
      `, (err) => {
        if (err) console.error('创建商品价格表失败:', err);
        else console.log('商品价格表创建成功');
      });

      // 商品供应商关系表
      db.run(`
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
        )
      `, (err) => {
        if (err) console.error('创建商品供应商关系表失败:', err);
        else console.log('商品供应商关系表创建成功');
      });

      // 插入默认管理员用户
      db.run(`
        INSERT OR IGNORE INTO users (username, password, email, role) 
        VALUES ('admin', '123456', 'admin@wms.com', 'admin')
      `, (err) => {
        if (err) console.error('插入默认用户失败:', err);
        else console.log('默认用户创建成功');
      });

      // 插入示例数据
      db.run(`
        INSERT OR IGNORE INTO warehouses (code, name, address, manager) 
        VALUES 
        ('WH001', '主仓库', '北京市朝阳区仓储路1号', '张三'),
        ('WH002', '分仓库', '上海市浦东新区物流大道88号', '李四')
      `, (err) => {
        if (err) console.error('插入示例仓库失败:', err);
        else console.log('示例仓库创建成功');
      });

      db.run(`
        INSERT OR IGNORE INTO suppliers (code, name, contact_person, phone, email, address) 
        VALUES 
        ('SUP001', '格力电器华北总代理', '张总监', '13800138001', 'zhang@gree-north.com', '北京市朝阳区电子城科技大厦'),
        ('SUP002', '美的集团上海分销商', '李经理', '13800138002', 'li@midea-sh.com', '上海市浦东新区家电批发市场')
      `, (err) => {
        if (err) console.error('插入示例供应商失败:', err);
        else console.log('示例供应商创建成功');
      });

      db.run(`
        INSERT OR IGNORE INTO customers (code, name, contact_person, phone, email, address, customer_type) 
        VALUES 
        ('CUS001', '苏宁易购北京旗舰店', '王店长', '13900139001', 'wang@suning-bj.com', '北京市朝阳区建国路苏宁广场', 'retail'),
        ('CUS002', '国美电器批发部', '刘采购', '13900139002', 'liu@gome-wholesale.com', '上海市徐汇区漕河泾开发区', 'wholesale')
      `, (err) => {
        if (err) console.error('插入示例客户失败:', err);
        else console.log('示例客户创建成功');
      });

      db.run(`
        INSERT OR IGNORE INTO items (code, name, en_name, category, unit, purchase_price, sale_price, min_stock, max_stock) 
        VALUES 
        ('AC001', '格力KFR-35GW/NhAa1BAj 1.5匹变频空调', 'GREE KFR-35GW/NhAa1BAj 1.5HP Inverter Air Conditioner', '空调', '台', 2200.00, 2899.00, 8, 80),
        ('TV002', '海信65E3F 65英寸4K智能电视', 'Hisense 65E3F 65-inch 4K Smart TV', '电视', '台', 2800.00, 3599.00, 5, 50),
        ('WM003', '小天鹅TG100V88WMUIADY5 10公斤变频洗衣机', 'Little Swan TG100V88WMUIADY5 10kg Inverter Washing Machine', '洗衣机', '台', 1800.00, 2399.00, 6, 60),
        ('RF004', '美的BCD-516WKPZM(E) 516升对开门冰箱', 'Midea BCD-516WKPZM(E) 516L Side-by-Side Refrigerator', '冰箱', '台', 2400.00, 3199.00, 4, 40)
      `, (err) => {
        if (err) {
          console.error('插入示例货品失败:', err);
          reject(err);
        } else {
          console.log('示例货品创建成功');
          
          // 插入初始库存数据
          db.run(`
            INSERT OR IGNORE INTO inventory (item_id, warehouse_id, quantity, available_quantity, reserved_quantity, avg_cost, last_updated) 
            VALUES 
            (1, 1, 35, 30, 5, 2200.00, CURRENT_TIMESTAMP),
            (1, 2, 12, 12, 0, 2200.00, CURRENT_TIMESTAMP),
            (2, 1, 18, 15, 3, 2800.00, CURRENT_TIMESTAMP),
            (2, 2, 6, 6, 0, 2800.00, CURRENT_TIMESTAMP),
            (3, 1, 28, 24, 4, 1800.00, CURRENT_TIMESTAMP),
            (3, 2, 8, 7, 1, 1800.00, CURRENT_TIMESTAMP),
            (4, 1, 15, 12, 3, 2400.00, CURRENT_TIMESTAMP),
            (4, 2, 3, 3, 0, 2400.00, CURRENT_TIMESTAMP)
          `, (err) => {
            if (err) {
              console.error('插入初始库存失败:', err);
            } else {
              console.log('初始库存数据创建成功');
              
              // 插入一些库存交易记录
              db.run(`
                INSERT OR IGNORE INTO inventory_transactions (item_id, warehouse_id, transaction_type, reference_no, reference_type, quantity, unit_cost, transaction_date, remarks) 
                VALUES 
                (1, 1, 'IN', 'INIT-001', 'ADJUST', 35, 2200.00, datetime('now', '-7 days'), '期初库存-格力空调'),
                (1, 2, 'IN', 'INIT-002', 'ADJUST', 12, 2200.00, datetime('now', '-7 days'), '期初库存-格力空调'),
                (2, 1, 'IN', 'INIT-003', 'ADJUST', 18, 2800.00, datetime('now', '-6 days'), '期初库存-海信电视'),
                (2, 2, 'IN', 'INIT-004', 'ADJUST', 6, 2800.00, datetime('now', '-6 days'), '期初库存-海信电视'),
                (3, 1, 'IN', 'INIT-005', 'ADJUST', 30, 1800.00, datetime('now', '-5 days'), '期初库存-小天鹅洗衣机'),
                (3, 2, 'IN', 'INIT-006', 'ADJUST', 10, 1800.00, datetime('now', '-5 days'), '期初库存-小天鹅洗衣机'),
                (4, 1, 'IN', 'INIT-007', 'ADJUST', 15, 2400.00, datetime('now', '-4 days'), '期初库存-美的冰箱'),
                (4, 2, 'IN', 'INIT-008', 'ADJUST', 3, 2400.00, datetime('now', '-4 days'), '期初库存-美的冰箱'),
                (3, 2, 'OUT', 'TF-001', 'TRANSFER', -2, 1800.00, datetime('now', '-2 days'), '调拨至主仓库'),
                (3, 1, 'IN', 'TF-001', 'TRANSFER', 2, 1800.00, datetime('now', '-2 days'), '从分仓库调入'),
                (1, 1, 'OUT', 'SALE-001', 'SALES', -8, 2200.00, datetime('now', '-1 days'), '销售出库-格力空调'),
                (2, 1, 'OUT', 'SALE-002', 'SALES', -3, 2800.00, datetime('now', '-1 days'), '销售出库-海信电视')
              `, (err) => {
                if (err) {
                  console.error('插入库存交易记录失败:', err);
                } else {
                  console.log('库存交易记录创建成功');
                }
                console.log('数据库初始化完成！');
                resolve();
              });
            }
          });
        }
      });
    });
  });
};

// 如果直接运行此文件，则执行初始化
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('数据库初始化成功！');
      process.exit(0);
    })
    .catch((err) => {
      console.error('数据库初始化失败:', err);
      process.exit(1);
    });
} 