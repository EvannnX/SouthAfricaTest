# 🇿🇦 BlueLink 南非销售系统

> 专业的南非销售管理系统，支持多语言、多货币、多仓库管理

## ✨ 功能特色

### 💰 收款与结算
- 💵 现金、转账、刷卡三种结算方式
- 🔄 抹零功能，自动找零计算
- 📊 分期付款管理，待还跟踪

### 📦 商品与库存
- 🏷️ 多条码管理，支持扫描枪
- 🖼️ 多图片存储，点击放大
- 📏 多单位换算（捆/米等）
- 💲 多档位价格系统（至少7个档位）
- 🏪 多仓库管理，库存互通

### 🛒 销售与订单
- 🖥️ POS收银系统
- 📋 订单管理（销售/退货/换货）
- 💳 立即结算/保存订单模式
- 🖨️ 多种打印格式（80mm/A4/A5）

### 👥 客户与会员
- 🎯 客户类型与价格策略
- 📅 注册日期管理
- 📈 交易记录明细
- 💰 往来管理（应收/应付）

### 🔐 权限与安全
- 👨‍💼 管理员权限分配
- 🔒 价格修改权限控制
- 📱 移动端/PC端适配
- 🌐 多语言支持（中文/英文）

## 🚀 快速开始

### 本地开发
```bash
# 安装依赖
npm run install:all

# 启动开发环境
npm run dev

# 或使用脚本
./start-demo.sh
```

### 网络共享
```bash
# 局域网访问
./start-network.sh
```

### 生产部署
```bash
# 构建生产版本
./deploy-production.sh
```

## 🌐 在线部署

### 免费云平台部署
1. **前端**: [Vercel](https://vercel.com) (免费)
2. **后端**: [Railway](https://railway.app) (免费额度)
3. **详细指南**: 查看 `FREE_DEPLOYMENT_GUIDE.md`

### 云服务器部署
- **推荐**: 阿里云轻量服务器 (￥24/月)
- **详细指南**: 查看 `DEPLOYMENT_GUIDE.md`

## 📱 访问方式

### 默认账户
```
用户名: admin
密码: 123456
```

### 设备适配
- 📱 **手机**: 完整功能，响应式设计
- 💻 **平板**: 触控优化界面
- 🖥️ **电脑**: 完整管理功能
- 🏪 **POS终端**: 收银专用界面

## 🛠️ 技术栈

### 前端
- ⚛️ React 18 + TypeScript
- 🎨 Ant Design UI组件库
- 📱 Vite 构建工具
- 🔄 Redux Toolkit 状态管理

### 后端
- 🟢 Node.js + Express
- 🗄️ SQLite 数据库
- 🔐 JWT 身份验证
- 📊 RESTful API

### 部署
- ☁️ Vercel (前端)
- 🚂 Railway (后端)
- 🐳 Docker 支持
- 🔒 HTTPS 自动配置

## 📊 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (Vercel)  │────│   后端 (Railway)  │────│   数据库 (SQLite) │
│                 │    │                 │    │                 │
│ • React SPA     │    │ • Express API   │    │ • 本地文件存储   │
│ • Ant Design    │    │ • JWT 认证      │    │ • 事务支持       │
│ • 响应式设计     │    │ • RESTful       │    │ • 备份恢复       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 开发指南

### 项目结构
```
├── frontend/          # 前端React应用
│   ├── src/
│   │   ├── components/   # 可复用组件
│   │   ├── pages/        # 页面组件
│   │   ├── services/     # API服务
│   │   └── utils/        # 工具函数
├── backend/           # 后端Node.js应用
│   ├── src/
│   │   ├── routes/       # API路由
│   │   ├── database/     # 数据库配置
│   │   └── middleware/   # 中间件
└── database/          # SQLite数据库文件
```

### API文档
- 🔗 **认证**: `/api/auth/*`
- 👥 **客户**: `/api/customers/*`
- 📦 **商品**: `/api/items/*`
- 🛒 **销售**: `/api/sales/*`
- 💰 **支付**: `/api/payments/*`
- 📊 **报表**: `/api/reports/*`

## 🌍 国际化支持

### 支持语言
- 🇨🇳 简体中文
- 🇺🇸 English
- 🇿🇦 Afrikaans (计划中)

### 货币支持
- 💰 南非兰特 (ZAR)
- 💵 美元 (USD)
- 💶 欧元 (EUR)

## 📈 性能优化

- ⚡ 前端代码分割
- 🗜️ 图片压缩优化
- 📱 移动端性能优化
- 🔄 API响应缓存
- 💾 数据库索引优化

## 🔒 安全特性

- 🔐 JWT Token认证
- 🛡️ CORS跨域保护
- 🔒 HTTPS强制加密
- 👤 用户权限控制
- 📝 操作日志记录

## 📞 技术支持

### 问题反馈
- 🐛 Bug报告: [GitHub Issues](https://github.com/EvannnX/SouthAfricaTest/issues)
- 💡 功能建议: [GitHub Discussions](https://github.com/EvannnX/SouthAfricaTest/discussions)

### 文档资源
- 📖 部署指南: `DEPLOYMENT_GUIDE.md`
- 🆓 免费部署: `FREE_DEPLOYMENT_GUIDE.md`
- 🔧 开发指南: `DEVELOPMENT_GUIDE.md`

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**🎯 专为南非市场设计 | 🇿🇦 Made for South Africa**

**💻 现代化技术栈 | 🚀 快速部署 | 📱 多端适配**