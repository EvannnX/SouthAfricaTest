#!/bin/bash

echo "🚀 BlueLink 南非销售系统 - 生产环境部署脚本"
echo "=================================================="

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

echo "✅ Node.js 环境检查通过"

# 设置环境变量
export NODE_ENV=production
export PATH="/usr/local/bin:$PATH"

echo "📦 安装项目依赖..."
npm run install:all

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "🏗️ 构建前端应用..."
cd frontend
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 前端构建失败"
    exit 1
fi

cd ..

echo "🏗️ 构建后端应用..."
cd backend
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 后端构建失败"
    exit 1
fi

echo "🗄️ 初始化生产数据库..."
npm run db:init

if [ $? -ne 0 ]; then
    echo "❌ 数据库初始化失败"
    exit 1
fi

cd ..

echo "📁 创建部署目录..."
mkdir -p deploy
cp -r backend/dist deploy/backend
cp -r frontend/dist deploy/frontend
cp -r backend/database deploy/
cp backend/package.json deploy/backend/
cp backend/package-lock.json deploy/backend/

echo "📝 创建生产环境配置..."
cat > deploy/backend/.env << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=../database/wms.db
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=*
EOF

echo "📝 创建启动脚本..."
cat > deploy/start-production.sh << 'EOF'
#!/bin/bash
echo "启动 BlueLink 生产环境..."

# 安装生产依赖
cd backend
npm install --production

# 启动后端服务
echo "启动后端服务..."
node index.js &
BACKEND_PID=$!

echo "后端服务已启动 (PID: $BACKEND_PID)"
echo "前端文件位于: ./frontend/"
echo ""
echo "📱 访问方式:"
echo "   本地访问: http://localhost:3001 (API)"
echo "   前端文件: 需要配置Web服务器指向 ./frontend/ 目录"
echo ""
echo "💡 生产环境建议:"
echo "   1. 使用 Nginx 作为反向代理"
echo "   2. 配置 HTTPS 证书"
echo "   3. 设置防火墙规则"
echo "   4. 定期备份数据库"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
trap "echo '正在停止服务...'; kill $BACKEND_PID 2>/dev/null; exit 0" INT
wait
EOF

chmod +x deploy/start-production.sh

echo "📝 创建Nginx配置模板..."
cat > deploy/nginx.conf << 'EOF'
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名
    
    # 前端静态文件
    location / {
        root /path/to/deploy/frontend;  # 替换为实际路径
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
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
        
        # API限流
        limit_req zone=api burst=10 nodelay;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://localhost:3001/health;
    }
}

# API限流配置
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
EOF

echo "📝 创建Docker配置..."
cat > deploy/Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

# 复制后端文件
COPY backend/ ./backend/
COPY database/ ./database/

# 安装生产依赖
WORKDIR /app/backend
RUN npm install --production

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "index.js"]
EOF

cat > deploy/docker-compose.yml << 'EOF'
version: '3.8'

services:
  bluelink-backend:
    build: .
    ports:
      - "3001:3001"
    volumes:
      - ./database:/app/database
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - PORT=3001
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./frontend:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - bluelink-backend
    restart: unless-stopped
EOF

echo "📝 创建部署说明..."
cat > deploy/README.md << 'EOF'
# BlueLink 生产环境部署

## 快速启动
```bash
# 本地测试
./start-production.sh

# Docker部署
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 云服务器部署步骤

1. 上传 deploy 文件夹到服务器
2. 安装 Node.js 和 Nginx
3. 修改 nginx.conf 中的域名和路径
4. 运行 ./start-production.sh
5. 配置 Nginx: sudo cp nginx.conf /etc/nginx/sites-available/bluelink
6. 启用配置: sudo ln -s /etc/nginx/sites-available/bluelink /etc/nginx/sites-enabled/
7. 重启 Nginx: sudo systemctl restart nginx

## 访问地址
- 前端: http://your-domain.com
- API: http://your-domain.com/api
- 健康检查: http://your-domain.com/health

## 默认账户
- 用户名: admin
- 密码: 123456

## 注意事项
- 生产环境请修改默认密码
- 定期备份数据库文件
- 监控服务器资源使用
- 配置HTTPS证书
EOF

echo ""
echo "🎉 生产环境部署包创建完成！"
echo ""
echo "📁 部署文件位置: ./deploy/"
echo ""
echo "🚀 部署选项:"
echo "   1. 本地测试: cd deploy && ./start-production.sh"
echo "   2. 云服务器: 上传 deploy 文件夹，按说明配置"
echo "   3. Docker: cd deploy && docker-compose up -d"
echo ""
echo "📖 详细说明请查看: ./deploy/README.md"
echo "📖 完整指南请查看: ./DEPLOYMENT_GUIDE.md"
