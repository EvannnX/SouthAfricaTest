# BlueLink 南非销售系统部署指南

## 🚀 部署方案选择

### 方案一：云服务器部署（推荐）
**适用场景**: 正式商业使用，多用户访问
**成本**: 中等（每月$10-50）
**优势**: 稳定、安全、专业

### 方案二：本地网络部署
**适用场景**: 店内局域网使用
**成本**: 免费
**优势**: 成本低、响应快

### 方案三：免费云平台部署
**适用场景**: 演示、测试使用
**成本**: 免费
**优势**: 零成本、快速部署

## 📋 详细部署步骤

### 方案一：云服务器部署（推荐）

#### 1. 选择云服务商
- **阿里云ECS** (推荐中国用户)
- **腾讯云CVM** 
- **AWS EC2**
- **DigitalOcean Droplet**
- **Vultr**

#### 2. 服务器配置要求
```
CPU: 1核心以上
内存: 2GB以上  
存储: 20GB以上
操作系统: Ubuntu 20.04 LTS
```

#### 3. 服务器环境配置
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PM2进程管理器
sudo npm install -g pm2

# 安装Nginx反向代理
sudo apt install nginx -y

# 安装SQLite
sudo apt install sqlite3 -y
```

#### 4. 上传代码
```bash
# 方法1: 使用Git
git clone your-repository-url
cd your-project

# 方法2: 使用SCP上传
scp -r /Users/evan/Desktop/南非软件搭建 user@your-server:/home/user/
```

#### 5. 部署配置
```bash
# 安装依赖
npm run install:all

# 构建前端
cd frontend && npm run build && cd ..

# 构建后端
cd backend && npm run build && cd ..

# 初始化数据库
cd backend && npm run db:init && cd ..

# 使用PM2启动后端服务
pm2 start backend/dist/index.js --name "bluelink-backend"

# 配置Nginx
sudo nano /etc/nginx/sites-available/bluelink
```

#### 6. Nginx配置文件
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名
    
    # 前端静态文件
    location / {
        root /home/user/your-project/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # 后端API代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/bluelink /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 设置开机自启
pm2 startup
pm2 save
```

### 方案二：本地网络部署

#### 1. 获取本机IP地址
```bash
# macOS
ifconfig | grep "inet " | grep -v 127.0.0.1

# 或者
ipconfig getifaddr en0
```

#### 2. 修改配置允许外部访问
```bash
# 修改前端配置
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173

# 修改后端配置（如果需要）
# 在 backend/src/index.ts 中修改
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
});
```

#### 3. 防火墙设置
```bash
# macOS 开放端口（系统偏好设置 > 安全性与隐私 > 防火墙）
# 或使用命令行
sudo pfctl -f /etc/pf.conf
```

#### 4. 局域网访问
其他设备访问: `http://您的IP地址:5173`
例如: `http://192.168.1.100:5173`

### 方案三：免费云平台部署

#### 选项1: Vercel + Railway
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署前端到Vercel
cd frontend
vercel --prod

# 部署后端到Railway
# 访问 railway.app，连接GitHub仓库
```

#### 选项2: Netlify + Heroku
```bash
# 前端部署到Netlify
cd frontend
npm run build
# 将dist文件夹拖拽到netlify.com

# 后端部署到Heroku
# 需要添加Procfile和配置
```

## 🔧 生产环境优化

### 1. 环境变量配置
创建 `backend/.env` 文件:
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=./database/wms.db
JWT_SECRET=your-super-secret-key-here
CORS_ORIGIN=https://your-domain.com
```

### 2. 安全配置
```javascript
// backend/src/index.ts 添加安全中间件
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

app.use(helmet())
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP每15分钟最多100次请求
}))
```

### 3. 数据库备份
```bash
# 定期备份SQLite数据库
crontab -e
# 添加: 0 2 * * * cp /path/to/wms.db /path/to/backup/wms_$(date +\%Y\%m\%d).db
```

### 4. SSL证书配置
```bash
# 使用Let's Encrypt免费SSL
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🌐 域名配置

### 1. 购买域名
推荐域名注册商:
- **Namecheap** (便宜)
- **GoDaddy** (知名)
- **Cloudflare** (免费DNS)

### 2. DNS配置
```
A记录: @ -> 您的服务器IP
A记录: www -> 您的服务器IP
```

## 📱 移动端优化

### 1. PWA配置
```javascript
// frontend/public/manifest.json
{
  "name": "BlueLink 南非销售系统",
  "short_name": "BlueLink",
  "description": "专业的南非销售管理系统",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1890ff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

### 2. 响应式优化
系统已内置响应式设计，支持:
- 📱 手机端 (完整功能)
- 💻 平板电脑
- 🖥️ 桌面电脑
- 🏪 POS终端

## 💰 成本估算

### 云服务器方案
- **基础版** (1核2G): $10-15/月
- **标准版** (2核4G): $20-30/月  
- **专业版** (4核8G): $40-60/月

### 域名费用
- **.com域名**: $10-15/年
- **SSL证书**: 免费 (Let's Encrypt)

### 总成本
- **最低配置**: ~$130/年 (服务器$120 + 域名$10)
- **推荐配置**: ~$250/年 (服务器$240 + 域名$10)

## 🔒 安全建议

1. **定期备份数据库**
2. **使用强密码**
3. **启用HTTPS**
4. **定期更新系统**
5. **监控访问日志**
6. **限制API访问频率**

## 📞 技术支持

部署过程中如有问题，可以:
1. 查看服务器日志
2. 检查防火墙设置
3. 验证域名DNS解析
4. 测试端口连通性

---

**推荐方案**: 使用阿里云或腾讯云的轻量应用服务器，配置简单，价格实惠，适合中小企业使用。
