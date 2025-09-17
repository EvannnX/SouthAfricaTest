# 📦 分批上传指南

## 🎯 GitHub限制
- 单次上传文件数量限制：< 100个文件
- 需要分批上传

## 🚀 分批上传策略

### 第一批：核心配置文件（约20个文件）
```
✅ 必须上传的核心文件：
- README.md
- package.json
- .gitignore
- vercel.json
- railway.json
- Procfile
- FREE_DEPLOYMENT_GUIDE.md
- MANUAL_UPLOAD_GUIDE.md
- BATCH_UPLOAD_GUIDE.md
- SSH_SETUP_GUIDE.md
- UPLOAD_TO_GITHUB.md
- cloud-deploy-config.json
- DEPLOYMENT_GUIDE.md
- BLUELINK_IMPLEMENTATION_SUMMARY.md
- start-demo.sh
- start-network.sh
- deploy-production.sh
- check-status.sh
- debug-api.sh
- fix-frontend.sh
```

### 第二批：前端核心文件（约30个文件）
```
✅ frontend文件夹中的核心文件：
- frontend/package.json
- frontend/package-lock.json
- frontend/tsconfig.json
- frontend/tsconfig.node.json
- frontend/vite.config.ts
- frontend/index.html
- frontend/src/main.tsx
- frontend/src/App.tsx
- frontend/src/index.css
- frontend/src/services/api.ts
- frontend/src/store/index.ts
- frontend/src/store/authSlice.ts
- frontend/src/utils/currency.ts
- frontend/src/utils/itemNames.ts
- frontend/src/components/Layout.tsx
- frontend/src/components/InstallmentTracker.tsx
- frontend/src/components/ProductImageGallery.tsx
- frontend/src/components/BarcodeManager.tsx
- frontend/src/components/MultiUnitManager.tsx
- frontend/src/pages/Login.tsx
- frontend/src/pages/Dashboard.tsx
- frontend/src/pages/POS.tsx
- frontend/src/pages/Items.tsx
- frontend/src/pages/Customers.tsx
- frontend/src/pages/Suppliers.tsx
- frontend/src/pages/Sales.tsx
- frontend/src/pages/Purchases.tsx
- frontend/src/pages/Inventory.tsx
- frontend/src/pages/Reports.tsx
```

### 第三批：后端核心文件（约25个文件）
```
✅ backend文件夹中的核心文件：
- backend/package.json
- backend/package-lock.json
- backend/tsconfig.json
- backend/nodemon.json
- backend/src/index.ts
- backend/src/database/init.ts
- backend/src/middleware/auth.ts
- backend/src/routes/auth.ts
- backend/src/routes/customers.ts
- backend/src/routes/items.ts
- backend/src/routes/sales.ts
- backend/src/routes/purchases.ts
- backend/src/routes/suppliers.ts
- backend/src/routes/warehouses.ts
- backend/src/routes/inventory.ts
- backend/src/routes/reports.ts
- backend/src/routes/payments.ts
- backend/src/routes/print.ts
- backend/src/scripts/bootstrapLargeStore.ts
- backend/src/scripts/simulateData.ts
```

### 第四批：启动脚本（约10个文件）
```
✅ 启动脚本文件：
- start.sh
- start-customers.sh
- start-sales.sh
- start-suppliers.sh
- update-database.sql
```

## 📋 上传顺序

### 步骤1：上传第一批（核心配置）
1. 访问 [https://github.com/EvannnX/SouthAfricaTest](https://github.com/EvannnX/SouthAfricaTest)
2. 删除现有README.md
3. 上传第一批文件（约20个）
4. 提交："第一批：核心配置文件"

### 步骤2：上传第二批（前端）
1. 继续在仓库页面
2. 上传frontend文件夹中的核心文件（约30个）
3. 提交："第二批：前端核心文件"

### 步骤3：上传第三批（后端）
1. 继续在仓库页面
2. 上传backend文件夹中的核心文件（约25个）
3. 提交："第三批：后端核心文件"

### 步骤4：上传第四批（脚本）
1. 继续在仓库页面
2. 上传剩余的启动脚本（约10个）
3. 提交："第四批：启动脚本"

## ✅ 验证上传成功

每批上传后检查：
- 文件数量是否正确
- 文件内容是否完整
- 没有错误提示

## 🚀 上传完成后

所有文件上传完成后：
1. 访问仓库确认所有文件都在
2. 按照 `FREE_DEPLOYMENT_GUIDE.md` 进行免费云平台部署
3. 前端部署到Vercel，后端部署到Railway

---

**💡 提示**: 分批上传虽然麻烦，但可以确保所有文件都成功上传！
