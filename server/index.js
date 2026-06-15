const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'ai-comic-studio-secret-key-2024';

// MongoDB 连接（使用 MongoDB Atlas 免费集群）
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/ai-comic-studio?retryWrites=true&w=majority';

// 中间件
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 用户模型
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, default: '' },
  password: { type: String, required: true },
  points: { type: Number, default: 50 },
  totalEarnedPoints: { type: Number, default: 50 },
  level: { type: Number, default: 1 },
  projectsCount: { type: Number, default: 0 },
  isVIP: { type: Boolean, default: false },
  vipLevel: { type: Number, default: 0 },
  vipPoints: { type: Number, default: 0 },
  vipExpireAt: { type: String, default: null },
  completedTasks: { type: [String], default: [] },
  visitedPages: { type: [String], default: [] },
  usedStyles: { type: [String], default: [] },
  transactions: [{
    id: String,
    type: { type: String, enum: ['earn', 'spend'] },
    amount: Number,
    description: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  lastLoginDate: { type: String, default: '' },
  consecutiveLoginDays: { type: Number, default: 1 }
});

const User = mongoose.model('User', userSchema);

// 连接 MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('[MongoDB] 连接成功'))
  .catch(err => console.error('[MongoDB] 连接失败:', err.message));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'AI漫剧工作室后端服务运行中',
    timestamp: new Date().toISOString(),
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
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
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: '该用户名已注册，请直接登录' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const newUser = new User({
      username: username.trim(),
      email: email || '',
      password: hashedPassword,
      points: 50,
      totalEarnedPoints: 50,
      transactions: [{
        id: Date.now().toString(),
        type: 'earn',
        amount: 50,
        description: '新用户欢迎积分'
      }]
    });

    await newUser.save();

    // 生成 JWT
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        points: newUser.points,
        totalEarnedPoints: newUser.totalEarnedPoints,
        level: newUser.level,
        projectsCount: newUser.projectsCount,
        isVIP: newUser.isVIP,
        vipLevel: newUser.vipLevel,
        vipPoints: newUser.vipPoints,
        vipExpireAt: newUser.vipExpireAt,
        completedTasks: newUser.completedTasks,
        visitedPages: newUser.visitedPages,
        usedStyles: newUser.usedStyles,
        transactions: newUser.transactions,
        createdAt: newUser.createdAt,
        lastLoginDate: newUser.lastLoginDate,
        consecutiveLoginDays: newUser.consecutiveLoginDays
      }
    });
  } catch (error) {
    console.error('[注册错误]', error);
    res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    // 查找用户
    const user = await User.findOne({ username: username.toLowerCase() });
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
    let consecutive = user.consecutiveLoginDays || 1;
    if (user.lastLoginDate && user.lastLoginDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      consecutive = user.lastLoginDate === yesterday.toISOString().split('T')[0] 
        ? consecutive + 1 
        : 1;
    }

    user.lastLoginDate = today;
    user.consecutiveLoginDays = consecutive;
    await user.save();

    // 生成 JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        points: user.points,
        totalEarnedPoints: user.totalEarnedPoints,
        level: user.level,
        projectsCount: user.projectsCount,
        isVIP: user.isVIP,
        vipLevel: user.vipLevel,
        vipPoints: user.vipPoints,
        vipExpireAt: user.vipExpireAt,
        completedTasks: user.completedTasks,
        visitedPages: user.visitedPages,
        usedStyles: user.usedStyles,
        transactions: user.transactions,
        createdAt: user.createdAt,
        lastLoginDate: user.lastLoginDate,
        consecutiveLoginDays: user.consecutiveLoginDays
      }
    });
  } catch (error) {
    console.error('[登录错误]', error);
    res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
});

// 获取用户信息（需要认证）
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新用户信息
app.patch('/api/users/:id', async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // 不允许通过此接口修改密码

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取所有用户（管理员接口）
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ users, count: users.length });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`[服务器] 运行在端口 ${PORT}`);
  console.log(`[API] 健康检查: http://localhost:${PORT}/api/health`);
});
