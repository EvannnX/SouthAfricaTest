# 🔑 SSH密钥配置指南

## 📋 您的SSH公钥

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEl+UkJO0yhmvidg1WrMLDm7ZiTMoscBxhNzlCtI8VK6 evan@github.com
```

## 🚀 配置GitHub SSH密钥

### 1. 复制SSH公钥
上面的公钥已经复制到剪贴板，如果没有，请手动复制：
```bash
cat ~/.ssh/id_ed25519.pub
```

### 2. 添加到GitHub
1. 访问 [GitHub SSH设置页面](https://github.com/settings/ssh/new)
2. 点击 "New SSH key"
3. 填写信息：
   - **Title**: `MacBook Pro - BlueLink开发`
   - **Key**: 粘贴上面的SSH公钥
4. 点击 "Add SSH key"

### 3. 验证SSH连接
```bash
ssh -T git@github.com
```

应该看到类似信息：
```
Hi EvannnX! You've successfully authenticated, but GitHub does not provide shell access.
```

## 🔄 重新推送代码

SSH配置完成后，运行：
```bash
git push -u origin main
```

## 🆘 如果遇到问题

### 问题1：权限被拒绝
```bash
# 检查SSH代理
ssh-add -l

# 如果没有密钥，重新添加
ssh-add ~/.ssh/id_ed25519
```

### 问题2：主机密钥验证失败
```bash
# 清除known_hosts中的GitHub条目
ssh-keygen -R github.com
```

### 问题3：仍然无法连接
```bash
# 测试SSH连接
ssh -vT git@github.com
```

## ✅ 成功标志

当您看到以下信息时，说明SSH配置成功：
```
Hi EvannnX! You've successfully authenticated, but GitHub does not provide shell access.
```

然后就可以成功推送代码了！

---

**💡 提示**: SSH密钥配置是一次性的，配置完成后就可以正常使用Git了。
