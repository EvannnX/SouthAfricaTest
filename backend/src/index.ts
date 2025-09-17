import cors from 'cors';
import express from 'express';
import { initDatabase } from './database/init';
import { authenticateToken } from './middleware/auth';
import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import dataImportRoutes from './routes/data-import';
import inventoryRoutes from './routes/inventory';
import itemRoutes from './routes/items';
import paymentRoutes from './routes/payments';
import printRoutes from './routes/print';
import purchaseRoutes from './routes/purchases';
import reportRoutes from './routes/reports';
import salesRoutes from './routes/sales';
import supplierRoutes from './routes/suppliers';
import warehouseRoutes from './routes/warehouses';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: [
    'https://south-africa-test-dvi6.vercel.app',
    'https://south-africa-test-dvi6-dvi2nhfxn-evannn1218s-projects.vercel.app', 
    'http://localhost:3000', 
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 初始化数据库
initDatabase().then(() => {
  console.log('数据库初始化完成');
}).catch(err => {
  console.error('数据库初始化失败:', err);
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/data-import', authenticateToken, dataImportRoutes);
app.use('/api/items', authenticateToken, itemRoutes);
app.use('/api/suppliers', authenticateToken, supplierRoutes);
app.use('/api/customers', authenticateToken, customerRoutes);
app.use('/api/warehouses', authenticateToken, warehouseRoutes);
app.use('/api/purchases', authenticateToken, purchaseRoutes);
app.use('/api/sales', authenticateToken, salesRoutes);
app.use('/api/payments', authenticateToken, paymentRoutes);
app.use('/api/print', authenticateToken, printRoutes);
app.use('/api/inventory', authenticateToken, inventoryRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
}); 