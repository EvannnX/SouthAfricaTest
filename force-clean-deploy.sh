#!/bin/bash

echo "🧹 强制清理并重新部署"
echo "======================"

# 删除任何可能的scripts文件残留
echo "🗑️ 清理scripts文件夹..."
find . -name "scripts" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*bootstrap*" -type f -delete 2>/dev/null || true
find . -name "*simulate*" -type f -delete 2>/dev/null || true

# 清理构建缓存
echo "🧹 清理构建缓存..."
rm -rf backend/dist/
rm -rf backend/node_modules/
rm -rf frontend/dist/
rm -rf frontend/node_modules/
rm -rf node_modules/

# 清理Git缓存
echo "🔄 清理Git缓存..."
git rm -r --cached . 2>/dev/null || true
git add .

# 提交更改
echo "📝 提交清理后的代码..."
git commit -m "🧹 强制清理：删除所有scripts文件和缓存"

# 强制推送
echo "🚀 强制推送到GitHub..."
git push origin main --force

echo ""
echo "✅ 清理完成！"
echo "💡 现在可以在Railway中手动触发重新部署"
echo "   或者等待自动部署"
