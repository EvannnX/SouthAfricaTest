# 📤 上传代码到GitHub指南

## 🎯 目标
将BlueLink南非销售系统上传到 [https://github.com/EvannnX/SouthAfricaTest](https://github.com/EvannnX/SouthAfricaTest)

## 🚀 方法一：使用GitHub Desktop（推荐）

### 1. 下载GitHub Desktop
- 访问 [https://desktop.github.com/](https://desktop.github.com/)
- 下载并安装GitHub Desktop

### 2. 克隆仓库
- 打开GitHub Desktop
- 点击 "Clone a repository from the Internet"
- 输入URL: `https://github.com/EvannnX/SouthAfricaTest.git`
- 选择本地保存位置

### 3. 复制文件
- 将当前项目文件夹中的所有文件复制到克隆的文件夹
- 覆盖README.md文件

### 4. 提交并推送
- 在GitHub Desktop中查看更改
- 填写提交信息: "BlueLink南非销售系统完整功能"
- 点击 "Commit to main"
- 点击 "Push origin"

## 🌐 方法二：网页上传

### 1. 访问仓库
- 打开 [https://github.com/EvannnX/SouthAfricaTest](https://github.com/EvannnX/SouthAfricaTest)

### 2. 上传文件
- 点击 "uploading an existing file"
- 选择项目文件夹中的所有文件
- 拖拽到上传区域

### 3. 提交更改
- 填写提交信息: "BlueLink南非销售系统完整功能"
- 点击 "Commit changes"

## 🔑 方法三：使用Personal Access Token

### 1. 生成Token
- 访问 [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
- 点击 "Generate new token (classic)"
- 选择权限: `repo` (完整仓库访问)
- 复制生成的token

### 2. 使用Token推送
```bash
# 在终端中运行
git push https://YOUR_TOKEN@github.com/EvannnX/SouthAfricaTest.git main
```

## ✅ 验证上传成功

上传完成后，访问 [https://github.com/EvannnX/SouthAfricaTest](https://github.com/EvannnX/SouthAfricaTest) 确认：

- ✅ 看到所有项目文件
- ✅ README.md显示正确内容
- ✅ 包含frontend和backend文件夹
- ✅ 包含部署配置文件

## 🚀 下一步：免费云平台部署

上传成功后，按照 `FREE_DEPLOYMENT_GUIDE.md` 进行部署：

1. **前端部署到Vercel**
2. **后端部署到Railway**
3. **连接前后端**
4. **测试在线访问**

---

**💡 推荐**: 使用方法一（GitHub Desktop），最简单可靠！
