#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const RAILWAY_API_URL = 'https://web-production-7a257.up.railway.app/api';
const DATA_DIR = 'data-export';

// 登录获取token
async function login() {
  try {
    const response = await axios.post(`${RAILWAY_API_URL}/auth/login`, {
      username: 'admin',
      password: '123456'
    });
    return response.data.token;
  } catch (error) {
    console.error('登录失败:', error.response?.data || error.message);
    throw error;
  }
}

// 导入单个表的数据
async function importTable(token, tableName, sqlFile) {
  try {
    console.log(`📊 正在导入 ${tableName}...`);
    
    const sqlData = fs.readFileSync(sqlFile, 'utf8');
    
    const response = await axios.post(
      `${RAILWAY_API_URL}/data-import/import`,
      {
        tableName: tableName,
        data: sqlData
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ ${tableName} 导入成功`);
    return response.data;
  } catch (error) {
    console.error(`❌ ${tableName} 导入失败:`, error.response?.data || error.message);
    throw error;
  }
}

// 获取数据统计
async function getStats(token) {
  try {
    const response = await axios.get(`${RAILWAY_API_URL}/data-import/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取统计失败:', error.response?.data || error.message);
    return {};
  }
}

// 主函数
async function main() {
  console.log('🚀 开始数据迁移到Railway...\n');
  
  try {
    // 1. 登录
    console.log('🔐 正在登录...');
    const token = await login();
    console.log('✅ 登录成功\n');
    
    // 2. 获取导入前的统计
    console.log('📊 获取导入前的数据统计...');
    const statsBefore = await getStats(token);
    console.log('导入前:', statsBefore);
    console.log('');
    
    // 3. 导入数据（按依赖顺序）
    const importOrder = [
      'warehouses',
      'suppliers', 
      'customers',
      'items',
      'inventory',
      'purchase_orders',
      'purchase_order_items',
      'sales_orders', 
      'sales_order_items',
      'inventory_transactions'
    ];
    
    for (const tableName of importOrder) {
      const sqlFile = path.join(DATA_DIR, `${tableName}.sql`);
      
      if (fs.existsSync(sqlFile)) {
        await importTable(token, tableName, sqlFile);
      } else {
        console.log(`⚠️  ${tableName}.sql 文件不存在，跳过`);
      }
    }
    
    // 4. 获取导入后的统计
    console.log('\n📊 获取导入后的数据统计...');
    const statsAfter = await getStats(token);
    console.log('导入后:', statsAfter);
    
    console.log('\n🎉 数据迁移完成！');
    console.log('现在您可以在Railway部署的系统中看到所有本地数据了。');
    
  } catch (error) {
    console.error('\n❌ 数据迁移失败:', error.message);
    process.exit(1);
  }
}

// 检查必要文件
if (!fs.existsSync(DATA_DIR)) {
  console.error(`❌ 数据目录 ${DATA_DIR} 不存在！请先运行 ./export-data.sh`);
  process.exit(1);
}

main();
