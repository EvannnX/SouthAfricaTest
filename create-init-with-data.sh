#!/bin/bash

echo "🔧 创建包含本地数据的初始化脚本"
echo "=================================="

# 创建新的初始化文件
cat > backend/src/database/init-with-data.ts << 'EOF'
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = process.env.NODE_ENV === 'production' 
  ? ':memory:' // Railway使用内存数据库
  : path.join(__dirname, '../../database/wms.db');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功:', dbPath);
  }
});

export const initDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 创建表结构
    const createTables = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        tax_number TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        tax_number TEXT,
        customer_type TEXT DEFAULT 'retail',
        registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS warehouses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT,
        manager TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        en_name TEXT,
        category TEXT,
        unit TEXT DEFAULT '个',
        purchase_price DECIMAL(10,2) DEFAULT 0,
        sale_price DECIMAL(10,2) DEFAULT 0,
        supplier_id INTEGER,
        min_stock INTEGER DEFAULT 0,
        max_stock INTEGER DEFAULT 1000,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        warehouse_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items (id),
        FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
      );

      CREATE TABLE IF NOT EXISTS sales_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        customer_id INTEGER,
        total_amount DECIMAL(10,2) NOT NULL,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        status TEXT DEFAULT 'pending',
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id),
        FOREIGN KEY (created_by) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS sales_order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        discount DECIMAL(10,2) DEFAULT 0,
        amount DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES sales_orders (id),
        FOREIGN KEY (item_id) REFERENCES items (id)
      );

      CREATE TABLE IF NOT EXISTS purchase_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        supplier_id INTEGER,
        total_amount DECIMAL(10,2) NOT NULL,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        status TEXT DEFAULT 'pending',
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id),
        FOREIGN KEY (created_by) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES purchase_orders (id),
        FOREIGN KEY (item_id) REFERENCES items (id)
      );

      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        warehouse_id INTEGER NOT NULL,
        transaction_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        reference_id INTEGER,
        reference_type TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items (id),
        FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
      );
    `;

    db.exec(createTables, (err) => {
      if (err) {
        console.error('创建表失败:', err);
        reject(err);
        return;
      }

      console.log('数据库表创建成功');

      // 插入默认管理员用户
      db.run(`
        INSERT OR IGNORE INTO users (username, password, email, role) 
        VALUES ('admin', '123456', 'admin@wms.com', 'admin')
      `, (err) => {
        if (err) console.error('插入默认用户失败:', err);
        else console.log('默认用户创建成功');
      });

EOF

# 追加本地数据到初始化脚本
echo "      // 导入本地数据" >> backend/src/database/init-with-data.ts

# 处理每个数据文件
for table in warehouses suppliers customers items inventory purchase_orders purchase_order_items sales_orders sales_order_items inventory_transactions; do
  if [ -f "data-export/${table}.sql" ]; then
    echo "      // 导入 ${table} 数据" >> backend/src/database/init-with-data.ts
    echo "      db.exec(\`" >> backend/src/database/init-with-data.ts
    # 转义反引号和$符号
    sed 's/`/\\`/g; s/\$/\\$/g' "data-export/${table}.sql" >> backend/src/database/init-with-data.ts
    echo "      \`, (err) => {" >> backend/src/database/init-with-data.ts
    echo "        if (err) console.error('导入${table}数据失败:', err);" >> backend/src/database/init-with-data.ts
    echo "        else console.log('${table}数据导入成功');" >> backend/src/database/init-with-data.ts
    echo "      });" >> backend/src/database/init-with-data.ts
    echo "" >> backend/src/database/init-with-data.ts
  fi
done

# 完成初始化脚本
cat >> backend/src/database/init-with-data.ts << 'EOF'
      console.log('数据库初始化完成，包含所有本地数据');
      resolve();
    });
  });
};
EOF

echo "✅ 包含数据的初始化脚本创建完成！"
echo "💡 现在可以替换原来的 init.ts 文件"
