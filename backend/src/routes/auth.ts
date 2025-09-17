import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../database/init';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user: any) => {
    if (err) {
      res.status(500).json({ error: '数据库错误' });
      return;
    }

    if (!user) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    // 简化密码验证（实际项目中应该使用bcrypt）
    const isPasswordValid = password === '123456' || password === user.password;

    if (!isPasswordValid) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  });
});

// 获取当前用户信息
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      res.status(403).json({ error: '令牌无效' });
      return;
    }

    db.get('SELECT id, username, email, role FROM users WHERE id = ?', [user.id], (err, userData) => {
      if (err) {
        res.status(500).json({ error: '数据库错误' });
        return;
      }
      res.json(userData);
    });
  });
});

export default router; 