PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(200) NOT NULL,
          contact_person VARCHAR(100),
          phone VARCHAR(20),
          email VARCHAR(100),
          address TEXT,
          customer_type VARCHAR(20) DEFAULT 'retail',
          credit_limit DECIMAL(10,2) DEFAULT 0,
          payment_terms VARCHAR(50) DEFAULT '现金',
          status VARCHAR(20) DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
INSERT INTO customers VALUES(1,'CUS001','苏宁易购北京旗舰店','王店长','13900139001','wang@suning-bj.com','北京市朝阳区建国路苏宁广场','retail',0,'现金','active','2025-08-09 15:30:42','2025-08-09 15:30:42');
INSERT INTO customers VALUES(2,'CUS002','国美电器批发部','刘采购','13900139002','liu@gome-wholesale.com','上海市徐汇区漕河泾开发区','wholesale',0,'月结30天','active','2025-08-09 15:30:42','2025-08-09 15:30:42');
INSERT INTO customers VALUES(5,'CUS003','Pick n Pay Retail','Peter','0820000003',NULL,NULL,'retail',0,'现金','active','2025-08-12 15:44:53','2025-08-12 15:44:53');
INSERT INTO customers VALUES(6,'CUS004','Makro Wholesale','Linda','0820000004',NULL,NULL,'wholesale',0,'现金','active','2025-08-12 15:44:53','2025-08-12 15:44:53');
INSERT INTO customers VALUES(7,'CUS005','Massmart Corporate','Ben','0820000005',NULL,NULL,'corporate',0,'现金','active','2025-08-12 15:44:53','2025-08-12 15:44:53');
INSERT INTO customers VALUES(8,'CUS006','Game Store','Lucy','0820000006',NULL,NULL,'retail',0,'现金','active','2025-08-12 15:44:53','2025-08-12 15:44:53');
COMMIT;
