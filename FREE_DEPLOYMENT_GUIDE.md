# 🆓 BlueLink 免费云平台部署指南

## 📋 方案三：免费云平台部署

### 🎯 部署架构
- **前端**: Vercel (免费)
- **后端**: Railway (免费额度)
- **数据库**: SQLite文件存储

### 🚀 第一步：上传代码到GitHub

#### 方法1：使用GitHub Desktop（推荐）
1. 下载 [GitHub Desktop](https://desktop.github.com/)
2. 登录您的GitHub账户
3. 克隆仓库：`https://github.com/EvannnX/SouthAfricaTest.git`
4. 将项目文件复制到克隆的文件夹
5. 提交并推送更改

#### 方法2：手动上传
1. 访问 [https://github.com/EvannnX/SouthAfricaTest](https://github.com/EvannnX/SouthAfricaTest)
2. 点击 "uploading an existing file"
3. 拖拽项目文件夹中的所有文件
4. 提交更改

#### 方法3：使用Personal Access Token
```bash
# 在GitHub设置中生成Personal Access Token
# 然后使用以下命令：
git push https://YOUR_TOKEN@github.com/EvannnX/SouthAfricaTest.git main
```

### 🌐 第二步：部署前端到Vercel

1. **访问Vercel**
   - 打开 [https://vercel.com](https://vercel.com)
   - 使用GitHub账户登录

2. **导入项目**
   - 点击 "New Project"
   - 选择 "Import Git Repository"
   - 选择 `EvannnX/SouthAfricaTest`

3. **配置前端部署**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **环境变量设置**
   ```
   VITE_API_URL=https://your-railway-backend-url.railway.app
   ```

5. **部署**
   - 点击 "Deploy"
   - 等待构建完成

### 🚂 第三步：部署后端到Railway

1. **访问Railway**
   - 打开 [https://railway.app](https://railway.app)
   - 使用GitHub账户登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择 `EvannnX/SouthAfricaTest`

3. **配置后端部署**
   ```
   Root Directory: backend
   Build Command: npm run build
   Start Command: node dist/index.js
   ```

4. **环境变量设置**
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=./database/wms.db
   JWT_SECRET=your-super-secret-key-here
   CORS_ORIGIN=https://your-vercel-frontend-url.vercel.app
   ```

5. **部署**
   - Railway会自动检测并部署
   - 获取部署URL（类似：`https://xxx.railway.app`）

### 🔗 第四步：连接前后端

1. **更新前端API地址**
   - 在Vercel项目设置中
   - 更新环境变量 `VITE_API_URL` 为Railway后端URL

2. **重新部署前端**
   - Vercel会自动重新部署

### 📱 第五步：测试部署

1. **访问前端地址**
   - 打开Vercel提供的URL
   - 测试登录功能

2. **默认账户**
   ```
   用户名: admin
   密码: 123456
   ```

### 🎉 部署完成！

您的BlueLink系统现在可以通过互联网访问了！

## 🔧 免费平台限制

### Vercel限制
- ✅ 无限静态网站托管
- ✅ 100GB带宽/月
- ✅ 自动HTTPS
- ⚠️ 构建时间限制：45分钟/月

### Railway限制
- ✅ 512MB RAM
- ✅ 1GB存储
- ✅ 100GB带宽/月
- ⚠️ 每月$5免费额度

## 🚀 升级选项

如果需要更多资源，可以考虑：

### 前端升级
- **Vercel Pro**: $20/月，更多构建时间
- **Netlify**: 免费额度更大

### 后端升级
- **Railway Pro**: $5/月，更多资源
- **Render**: 免费额度
- **Heroku**: 付费但稳定

## 📞 技术支持

部署过程中如有问题：

1. **检查构建日志**
   - Vercel: 项目页面 → Functions → View Function Logs
   - Railway: 项目页面 → Deployments → View Logs

2. **常见问题**
   - 环境变量未设置
   - 构建命令错误
   - 端口配置问题

3. **调试步骤**
   - 本地测试：`npm run dev`
   - 检查API连接
   - 查看浏览器控制台错误

---

**🎯 推荐流程**: GitHub → Vercel → Railway → 测试 → 完成！

**⏱️ 预计时间**: 30-60分钟
**💰 总成本**: 完全免费
