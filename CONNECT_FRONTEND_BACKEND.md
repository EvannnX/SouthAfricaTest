# 🔗 前后端连接配置指南

## 📋 步骤清单

### 1. 获取Railway后端URL
1. 登录Railway控制台：https://railway.app/
2. 进入您的项目
3. 点击后端服务
4. 在"Settings" -> "Domains"中找到生成的URL
5. URL格式通常为：`https://your-project-name-production.up.railway.app`

### 2. 更新Vercel配置

需要更新以下文件中的URL：

#### A. vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "YOUR_RAILWAY_URL/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ],
  "env": {
    "VITE_API_URL": "YOUR_RAILWAY_URL"
  }
}
```

#### B. 或者在Vercel控制台设置环境变量
1. 登录Vercel控制台
2. 进入您的项目
3. 进入"Settings" -> "Environment Variables"
4. 添加：
   - Name: `VITE_API_URL`
   - Value: `YOUR_RAILWAY_URL`

### 3. 更新前端API配置（可选）

如果需要，可以修改 `frontend/src/services/api.ts`：

```typescript
// 使用环境变量或直接配置
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'
```

### 4. 重新部署前端

更新配置后，需要重新部署Vercel项目：
1. 推送更新到GitHub
2. Vercel会自动重新部署
3. 或者在Vercel控制台手动触发部署

### 5. 测试连接

部署完成后测试：
1. 访问前端URL
2. 尝试登录（用户名：admin，密码：123456）
3. 检查是否能正常加载数据

## 🔧 常见问题

### CORS错误
如果遇到CORS错误，确保后端已配置CORS：
```javascript
app.use(cors({
  origin: ['https://your-vercel-app.vercel.app', 'http://localhost:3000'],
  credentials: true
}))
```

### 环境变量未生效
1. 确保环境变量名正确：`VITE_API_URL`
2. Vite环境变量必须以`VITE_`开头
3. 重新部署后才会生效

### API路径问题
确保：
1. 后端API路径正确（/api/...）
2. Railway URL可以正常访问
3. 网络连接正常

## 📞 需要帮助？

如果遇到问题，请提供：
1. Railway后端URL
2. Vercel前端URL
3. 具体的错误信息
4. 浏览器控制台日志
