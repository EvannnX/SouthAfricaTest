PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE suppliers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(200) NOT NULL,
          supplier_type VARCHAR(20) DEFAULT 'manufacturer',
          contact_person VARCHAR(100),
          phone VARCHAR(20),
          email VARCHAR(100),
          address TEXT,
          tax_number VARCHAR(50),
          bank_account VARCHAR(100),
          payment_terms VARCHAR(50) DEFAULT '现金',
          status VARCHAR(20) DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
INSERT INTO suppliers VALUES(1,'SUP001','格力电器华北总代理','manufacturer','张总监','13800138001','zhang@gree-north.com','北京市朝阳区电子城科技大厦','110108198001011234','6222023602001234567','月结30天','active','2025-08-09 15:30:42','2025-08-09 15:30:42');
INSERT INTO suppliers VALUES(2,'SUP002','美的集团上海分销商','distributor','李经理','13800138002','li@midea-sh.com','上海市浦东新区家电批发市场','310115198502022345','6222023603002345678','月结60天','active','2025-08-09 15:30:42','2025-08-09 15:30:42');
INSERT INTO suppliers VALUES(5,'SUP003','Hisense 南非分公司','manufacturer','Lee','011-100-1003',NULL,NULL,NULL,NULL,'现金','active','2025-08-12 15:44:53','2025-08-12 15:44:53');
INSERT INTO suppliers VALUES(6,'SUP004','Samsung Africa','manufacturer','Kim','011-100-1004',NULL,NULL,NULL,NULL,'现金','active','2025-08-12 15:44:53','2025-08-12 15:44:53');
COMMIT;
