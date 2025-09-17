PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE warehouses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(200) NOT NULL,
          address TEXT,
          manager VARCHAR(100),
          status VARCHAR(20) DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
INSERT INTO warehouses VALUES(1,'WH001','主仓库','北京市朝阳区仓储路1号','张三','active','2025-08-09 15:30:42','2025-08-09 15:30:42');
INSERT INTO warehouses VALUES(2,'WH002','分仓库','上海市浦东新区物流大道88号','李四','active','2025-08-09 15:30:42','2025-08-09 15:30:42');
COMMIT;
