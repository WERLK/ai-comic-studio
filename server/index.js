const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'ai-comic-studio-secret-key-2024';

// 中间件
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// SQLite 数据库
const DB_PATH = process.env.NODE_ENV === 'production' 
  ? '/tmp/users.db'  // Render 允许写入 /tmp
  : path.join(__dirname, 'users.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('[SQLite] 数据库连接失败:', err.message);
  } else {
    console.log('[SQLite] 数据库连接成功:', DB_PATH);
    initDatabase();
  }
});

// 初始化数据库表
function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT DEFAULT '',
      password TEXT NOT NULL,
      points INTEGER DEFAULT 50,
      total_earned_points INTEGER DEFAULT 50,
      level INTEGER DEFAULT 1,
      projects_count INTEGER DEFAULT 0,
      is_vip INTEGER DEFAULT 0,
      vip_level INTEGER DEFAULT 0,
      vip_points INTEGER DEFAULT 0,
      vip_expire_at TEXT DEFAULT NULL,
      completed_tasks TEXT DEFAULT '[]',
      visited_pages TEXT DEFAULT '[]',
      used_styles TEXT DEFAULT '[]',
      transactions TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_date TEXT DEFAULT '',
      consecutive_login_days INTEGER DEFAULT 1
    )
  `, (err) => {
    if (err) {
      console.error('[SQLite] 创建表失败:', err.message);
    } else {
      console.log('[SQLite] 用户表已就绪');
    }
  });
}

// 健康检查
app.get('/api/health', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    res.json({ 
      ok: true, 
      message: 'AI漫剧工作室后端服务运行中',
      timestamp: new Date().toISOString(),
      dbStatus: err ? 'error' : 'connected',
      usersCount: row ? row.count : 0
    });
  });
});

// 注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    // 检查用户是否已存在
    db.get('SELECT * FROM users WHERE username = ?', [username.toLowerCase()], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      if (row) {
        return res.status(409).json({ error: '该用户名已注册，请直接登录' });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);
      const today = new Date().toISOString().split('T')[0];

      // 创建新用户
      db.run(
        `INSERT INTO users (username, email, password, points, total_earned_points, transactions, last_login_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [username.trim(), email || '', hashedPassword, 50, 50, JSON.stringify([{
          id: Date.now().toString(),
          type: 'earn',
          amount: 50,
          description: '新用户欢迎积分',
          createdAt: new Date().toISOString()
        }]), today],
        function(err) {
          if (err) {
            return res.status(500).json({ error: '创建用户失败' });
          }

          const userId = this.lastID;

          // 生成 JWT
          const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });

          res.json({
            token,
            user: {
              id: userId,
              username: username.trim(),
              email: email || '',
              points: 50,
              totalEarnedPoints: 50,
              level: 1,
              projectsCount: 0,
              isVIP: false,
              vipLevel: 0,
              vipPoints: 0,
              vipExpireAt: null,
              completedTasks: [],
              visitedPages: [],
              usedStyles: [],
              transactions: [{
                id: Date.now().toString(),
                type: 'earn',
                amount: 50,
                description: '新用户欢迎积分',
                createdAt: new Date().toISOString()
              }],
              createdAt: new Date().toISOString(),
              lastLoginDate: today,
              consecutiveLoginDays: 1
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('[注册错误]', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username.toLowerCase()], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      if (!user) {
        return res.status(404).json({ error: '该账号尚未注册' });
      }

      // 验证密码
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: '密码错误' });
      }

      // 更新登录信息
      const today = new Date().toISOString().split('T')[0];
      let consecutive = user.consecutive_login_days || 1;
      if (user.last_login_date && user.last_login_date !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        consecutive = user.last_login_date === yesterday.toISOString().split('T')[0] 
          ? consecutive + 1 
          : 1;
      }

      db.run(
        'UPDATE users SET last_login_date = ?, consecutive_login_days = ? WHERE id = ?',
        [today, consecutive, user.id]
      );

      // 生成 JWT
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          points: user.points,
          totalEarnedPoints: user.total_earned_points,
          level: user.level,
          projectsCount: user.projects_count,
          isVIP: !!user.is_vip,
          vipLevel: user.vip_level,
          vipPoints: user.vip_points,
          vipExpireAt: user.vip_expire_at,
          completedTasks: JSON.parse(user.completed_tasks || '[]'),
          visitedPages: JSON.parse(user.visited_pages || '[]'),
          usedStyles: JSON.parse(user.used_styles || '[]'),
          transactions: JSON.parse(user.transactions || '[]'),
          createdAt: user.created_at,
          lastLoginDate: today,
          consecutiveLoginDays: consecutive
        }
      });
    });
  } catch (error) {
    console.error('[登录错误]', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取用户信息
app.get('/api/users/:id', (req, res) => {
  db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });
});

// 更新用户信息
app.patch('/api/users/:id', (req, res) => {
  const updates = req.body;
  delete updates.password; // 不允许通过此接口修改密码

  const fields = [];
  const values = [];
  
  Object.keys(updates).forEach(key => {
    fields.push(`${key} = ?`);
    values.push(updates[key]);
  });

  if (fields.length === 0) {
    return res.status(400).json({ error: '没有要更新的字段' });
  }

  values.push(req.params.id);

  db.run(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({ error: '更新失败' });
      }
      
      db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, user) => {
        if (err || !user) {
          return res.status(404).json({ error: '用户不存在' });
        }
        const { password, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      });
    }
  );
});

// 获取所有用户（管理员接口）
app.get('/api/admin/users', (req, res) => {
  db.all('SELECT id, username, email, points, level, created_at FROM users', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    res.json({ users: rows, count: rows.length });
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`[服务器] 运行在端口 ${PORT}`);
  console.log(`[API] 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`[数据库] SQLite 文件: ${DB_PATH}`);
});
