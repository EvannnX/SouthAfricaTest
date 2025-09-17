# 🚂 Railway后端部署指南

## 🎯 部署步骤

### 1. 访问Railway
- 打开 [railway.app](https://railway.app)
- 使用GitHub账户登录

### 2. 创建新项目
- 点击 "New Project"
- 选择 "Deploy from GitHub repo"
- 选择 `EvannnX/SouthAfricaTest`

### 3. 配置环境变量
在Railway项目设置中添加以下环境变量：

```
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-key-change-this-in-production
DATABASE_URL=./database/wms.db
```

### 4. 部署设置
Railway会自动检测到 `nixpacks.toml` 配置文件，使用以下设置：

- **Build Command**: `cd backend && npm install && npm run build`
- **Start Command**: `cd backend && node dist/index.js`
- **Node Version**: 18.x
- **Root Directory**: 自动检测

### 5. 部署
- Railway会自动开始构建和部署
- 等待部署完成（通常2-3分钟）
- 获取部署URL（类似：`https://southafricatest-production.up.railway.app`）

## 🔧 部署配置文件

### nixpacks.toml
```toml
[phases.setup]
nixPkgs = ['nodejs_18', 'npm-9_x']

[phases.install]
cmds = ['cd backend && npm install']

[phases.build]
cmds = ['cd backend && npm run build']

[start]
cmd = 'cd backend && node dist/index.js'
```

### railway.json
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && npm install && npm run build"
  },
  "deploy": {
    "startCommand": "cd backend && node dist/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## ✅ 验证部署

### 1. 检查健康状态
访问：`https://your-railway-url.railway.app/health`

应该返回：
```json
{"status": "ok", "timestamp": "..."}
```

### 2. 测试API
```bash
curl -X POST https://your-railway-url.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

应该返回JWT token。

## 🔗 连接前端

### 1. 获取后端URL
从Railway控制台复制部署URL

### 2. 更新Vercel环境变量
在Vercel项目设置中：
- **Key**: `VITE_API_URL`
- **Value**: `https://your-railway-url.railway.app`

### 3. 重新部署前端
在Vercel中点击 "Redeploy" 重新部署前端

## 🐛 常见问题

### 构建失败
- 检查 `nixpacks.toml` 配置
- 确保 `backend/package.json` 存在
- 检查Node.js版本兼容性

### 运行时错误
- 检查环境变量设置
- 查看Railway部署日志
- 确保数据库文件路径正确

### 数据库问题
- SQLite文件会在首次运行时自动创建
- 默认用户 `admin/123456` 会自动初始化

## 💰 费用说明

Railway免费计划：
- ✅ 512MB RAM
- ✅ 1GB存储
- ✅ 100GB带宽/月
- ✅ $5免费额度/月

适合开发和小规模使用。

---

**🚀 部署完成后，您的BlueLink后端就可以在线访问了！**
