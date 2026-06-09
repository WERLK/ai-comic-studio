import express, { Request, Response, json } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, 'db');
const DB_PATH = path.join(DB_DIR, 'users.json');
const PORT = 3001;

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, '[]', 'utf-8');
}

const hashPassword = (password: string): string =>
  createHash('sha256').update(password).digest('hex');

interface StoredUser {
  id: string;
  username: string;
  email: string;
  password: string;
  points: number;
  totalEarnedPoints: number;
  level: number;
  projectsCount: number;
  isVIP: boolean;
  createdAt: string;
  lastLoginDate: string;
  consecutiveLoginDays: number;
  completedTasks: string[];
  visitedPages: string[];
  usedStyles: string[];
  transactions?: Array<{ id: string; type: 'earn' | 'spend'; amount: number; description: string; createdAt: string }>;
}

const readDB = (): StoredUser[] => {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeDB = (users: StoredUser[]) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf-8');
};

const stripPassword = (u: StoredUser) => {
  const { password, ...rest } = u;
  return rest;
};

const getTodayKey = () => new Date().toISOString().split('T')[0];

const calcLevel = (totalEarned: number): number => {
  if (totalEarned >= 50000) return 100;
  if (totalEarned >= 10000) return 50;
  if (totalEarned >= 3000) return 20;
  if (totalEarned >= 1000) return 10;
  if (totalEarned >= 500) return 5;
  if (totalEarned >= 100) return Math.max(1, Math.floor(totalEarned / 100));
  return 1;
};

const normalizeUsername = (s: string) => s.trim().toLowerCase();
const normalizeEmail = (s: string) => (s || '').trim().toLowerCase();

const app = express();
app.use(cors());
app.use(json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, dbPath: DB_PATH, usersCount: readDB().length });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const body = req.body || {};
  const username: string = body.username;
  const email: string = body.email || '';
  const password: string = body.password;

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }

  const usernameNorm = normalizeUsername(username);
  const emailNorm = normalizeEmail(email);
  const users = readDB();

  const existing = users.find(
    (u) => normalizeUsername(u.username) === usernameNorm
  );

  if (existing) {
    if (existing.password === hashPassword(password)) {
      const today = getTodayKey();
      let consecutive = existing.consecutiveLoginDays || 1;
      if (existing.lastLoginDate) {
        if (existing.lastLoginDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          consecutive =
            existing.lastLoginDate === yesterday.toISOString().split('T')[0]
              ? consecutive + 1
              : 1;
        }
      }
      const updated: StoredUser = {
        ...existing,
        lastLoginDate: today,
        consecutiveLoginDays: consecutive,
        points: existing.points ?? 50,
        totalEarnedPoints: existing.totalEarnedPoints ?? 50,
        level: calcLevel(existing.totalEarnedPoints ?? 50),
        projectsCount: existing.projectsCount ?? 0,
        isVIP: !!existing.isVIP,
        completedTasks: existing.completedTasks || [],
        visitedPages: existing.visitedPages || [],
        usedStyles: existing.usedStyles || [],
      };
      writeDB(users.map((u) => (u.id === existing.id ? updated : u)));
      res.json({ user: stripPassword(updated) });
      return;
    }
    res.status(409).json({ error: '该用户名已注册，请直接登录或使用其他用户名' });
    return;
  }

  const today = getTodayKey();
  const initialPoints = 50;
  const newUser: StoredUser = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    username: username.trim(),
    email: emailNorm,
    password: hashPassword(password),
    points: initialPoints,
    totalEarnedPoints: initialPoints,
    level: 1,
    projectsCount: 0,
    isVIP: false,
    createdAt: new Date().toISOString(),
    lastLoginDate: today,
    consecutiveLoginDays: 1,
    completedTasks: [],
    visitedPages: [],
    usedStyles: [],
    transactions: [
      {
        id: Date.now().toString(),
        type: 'earn',
        amount: initialPoints,
        description: '新用户欢迎积分',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  writeDB([...users, newUser]);
  res.json({ user: stripPassword(newUser) });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const body = req.body || {};
  const username: string = body.username;
  const password: string = body.password;

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }

  const usernameNorm = normalizeUsername(username);
  const users = readDB();

  const match = users.find((u) => normalizeUsername(u.username) === usernameNorm);

  if (!match) {
    res.status(404).json({ error: '该用户名未注册，请先注册' });
    return;
  }

  if (match.password !== hashPassword(password)) {
    res.status(401).json({ error: '密码错误，请重新输入' });
    return;
  }

  const today = getTodayKey();
  let consecutive = match.consecutiveLoginDays || 1;
  if (match.lastLoginDate) {
    if (match.lastLoginDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      consecutive =
        match.lastLoginDate === yesterday.toISOString().split('T')[0]
          ? consecutive + 1
          : 1;
    }
  } else {
    consecutive = 1;
  }

  const updated: StoredUser = {
    ...match,
    lastLoginDate: today,
    consecutiveLoginDays: consecutive,
    points: match.points ?? 50,
    totalEarnedPoints: match.totalEarnedPoints ?? 50,
    level: calcLevel(match.totalEarnedPoints ?? 50),
    projectsCount: match.projectsCount ?? 0,
    isVIP: !!match.isVIP,
    completedTasks: match.completedTasks || [],
    visitedPages: match.visitedPages || [],
    usedStyles: match.usedStyles || [],
  };

  writeDB(users.map((u) => (u.id === match.id ? updated : u)));
  res.json({ user: stripPassword(updated) });
});

app.get('/api/users/:id', (req: Request, res: Response) => {
  const users = readDB();
  const user = users.find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  res.json({ user: stripPassword(user) });
});

app.patch('/api/users/:id', (req: Request, res: Response) => {
  const users = readDB();
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx < 0) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }

  const body = req.body || {};
  const prev = users[idx];

  const merged: StoredUser = {
    ...prev,
    ...(body.username !== undefined ? { username: body.username } : {}),
    ...(body.email !== undefined ? { email: body.email || '' } : {}),
    ...(body.points !== undefined ? { points: body.points } : {}),
    ...(body.totalEarnedPoints !== undefined
      ? { totalEarnedPoints: body.totalEarnedPoints }
      : {}),
    ...(body.level !== undefined ? { level: body.level } : {}),
    ...(body.projectsCount !== undefined
      ? { projectsCount: body.projectsCount }
      : {}),
    ...(body.isVIP !== undefined ? { isVIP: !!body.isVIP } : {}),
    ...(body.completedTasks !== undefined
      ? { completedTasks: Array.isArray(body.completedTasks) ? body.completedTasks : prev.completedTasks }
      : {}),
    ...(body.visitedPages !== undefined
      ? { visitedPages: Array.isArray(body.visitedPages) ? body.visitedPages : prev.visitedPages }
      : {}),
    ...(body.usedStyles !== undefined
      ? { usedStyles: Array.isArray(body.usedStyles) ? body.usedStyles : prev.usedStyles }
      : {}),
    ...(body.transactions !== undefined
      ? { transactions: body.transactions }
      : {}),
    ...(body.lastLoginDate !== undefined
      ? { lastLoginDate: body.lastLoginDate }
      : {}),
    ...(body.consecutiveLoginDays !== undefined
      ? { consecutiveLoginDays: body.consecutiveLoginDays }
      : {}),
  };

  users[idx] = merged;
  writeDB(users);
  res.json({ user: stripPassword(merged) });
});

app.listen(PORT, () => {
  console.log(`[server] running on http://localhost:${PORT}`);
});
