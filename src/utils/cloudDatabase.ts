/**
 * 免费云端数据库服务 - 使用 JSONBin.io
 * 无需部署服务器，直接对接免费云存储
 */

const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3/b';

// 存储桶 ID（自动创建或从本地存储读取）
let BIN_ID = '';

try {
  BIN_ID = localStorage.getItem('ai_comic_bin_id') || '';
} catch { /* ignore */ }

export function setBinId(id: string) {
  BIN_ID = id;
  try { localStorage.setItem('ai_comic_bin_id', id); } catch { /* ignore */ }
}

export function getBinId(): string {
  return BIN_ID;
}

interface CloudUser {
  id: string;
  username: string;
  email: string;
  password: string; // 哈希后的密码
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
  transactions: Array<{
    id: string;
    type: 'earn' | 'spend';
    amount: number;
    description: string;
    createdAt: string;
  }>;
}

interface CloudDB {
  users: CloudUser[];
  version: string;
  updatedAt: string;
}

// 简单的哈希函数
const simpleHash = (s: string): string => {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const chr = s.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + s.length;
};

// 创建新存储桶（自动使用账户ID）
export async function createBin(apiKey: string): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch(JSONBIN_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey,
        'X-Bin-Private': 'false',
      },
      body: JSON.stringify({
        users: [],
        version: '1.0',
        updatedAt: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      return { success: false, error: '创建存储桶失败' };
    }

    const data = await res.json();
    const id = data.metadata?.id;
    if (id) {
      setBinId(id);
      return { success: true, id };
    }
    return { success: false, error: '无法获取存储桶ID' };
  } catch (err: any) {
    return { success: false, error: err?.message || '网络错误' };
  }
}

// 读取云端数据
export async function readCloudDB(apiKey: string): Promise<{ success: boolean; data?: CloudDB; error?: string }> {
  if (!BIN_ID) {
    return { success: false, error: '未配置存储桶ID' };
  }

  try {
    const res = await fetch(`${JSONBIN_BASE_URL}/${BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': apiKey,
      },
    });

    if (!res.ok) {
      return { success: false, error: '读取数据失败' };
    }

    const result = await res.json();
    return { success: true, data: result.record as CloudDB };
  } catch (err: any) {
    return { success: false, error: err?.message || '网络错误' };
  }
}

// 更新云端数据
export async function updateCloudDB(apiKey: string, data: CloudDB): Promise<{ success: boolean; error?: string }> {
  if (!BIN_ID) {
    return { success: false, error: '未配置存储桶ID' };
  }

  try {
    const res = await fetch(`${JSONBIN_BASE_URL}/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey,
      },
      body: JSON.stringify({
        ...data,
        updatedAt: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      return { success: false, error: '更新数据失败' };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || '网络错误' };
  }
}

// 注册用户到云端
export async function registerCloudUser(
  apiKey: string,
  params: { username: string; email?: string; password: string }
): Promise<{ success: boolean; user?: Omit<CloudUser, 'password'>; error?: string }> {
  const username = params.username?.trim();
  const email = (params.email || '').trim();
  const password = params.password;

  if (!username || !password) {
    return { success: false, error: '用户名和密码不能为空' };
  }

  const dbResult = await readCloudDB(apiKey);
  if (!dbResult.success) {
    return { success: false, error: dbResult.error || '无法读取云端数据' };
  }

  const db = dbResult.data || { users: [], version: '1.0', updatedAt: new Date().toISOString() };
  const usernameNorm = username.toLowerCase();

  const existing = db.users.find((u) => u.username.toLowerCase() === usernameNorm);
  if (existing) {
    if (existing.password === simpleHash(password)) {
      // 密码相同，视为登录
      const { password: _, ...userWithoutPassword } = existing;
      return { success: true, user: userWithoutPassword };
    }
    return { success: false, error: '该用户名已注册，请直接登录' };
  }

  const today = new Date().toISOString().split('T')[0];
  const initialPoints = 50;
  const newUser: CloudUser = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    username,
    email,
    password: simpleHash(password),
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

  db.users.push(newUser);
  const updateResult = await updateCloudDB(apiKey, db);
  if (!updateResult.success) {
    return { success: false, error: updateResult.error || '保存用户失败' };
  }

  const { password: _, ...userWithoutPassword } = newUser;
  return { success: true, user: userWithoutPassword };
}

// 登录验证
export async function loginCloudUser(
  apiKey: string,
  params: { username: string; password: string }
): Promise<{ success: boolean; user?: Omit<CloudUser, 'password'>; error?: string }> {
  const username = params.username?.trim();
  const password = params.password;

  if (!username || !password) {
    return { success: false, error: '用户名和密码不能为空' };
  }

  const dbResult = await readCloudDB(apiKey);
  if (!dbResult.success) {
    return { success: false, error: dbResult.error || '无法读取云端数据' };
  }

  const db = dbResult.data || { users: [], version: '1.0', updatedAt: new Date().toISOString() };
  const usernameNorm = username.toLowerCase();

  const match = db.users.find((u) => u.username.toLowerCase() === usernameNorm);
  if (!match) {
    return { success: false, error: '该账号尚未注册' };
  }

  if (match.password !== simpleHash(password)) {
    return { success: false, error: '密码错误' };
  }

  // 更新登录信息
  const today = new Date().toISOString().split('T')[0];
  let consecutive = match.consecutiveLoginDays || 1;
  if (match.lastLoginDate && match.lastLoginDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    consecutive = match.lastLoginDate === yesterday.toISOString().split('T')[0] ? consecutive + 1 : 1;
  }

  match.lastLoginDate = today;
  match.consecutiveLoginDays = consecutive;

  await updateCloudDB(apiKey, db);

  const { password: _, ...userWithoutPassword } = match;
  return { success: true, user: userWithoutPassword };
}

// 更新用户数据
export async function updateCloudUser(
  apiKey: string,
  userId: string,
  updates: Partial<Omit<CloudUser, 'id' | 'password'>>
): Promise<{ success: boolean; error?: string }> {
  const dbResult = await readCloudDB(apiKey);
  if (!dbResult.success) {
    return { success: false, error: dbResult.error };
  }

  const db = dbResult.data!;
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx < 0) {
    return { success: false, error: '用户不存在' };
  }

  db.users[idx] = { ...db.users[idx], ...updates };
  return updateCloudDB(apiKey, db);
}

// 检查云端服务是否可用
export async function checkCloudService(apiKey: string): Promise<boolean> {
  if (!BIN_ID) return false;
  try {
    const res = await fetch(`${JSONBIN_BASE_URL}/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': apiKey },
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// 自动初始化：尝试创建存储桶（如果还没有）
export async function initCloudDatabase(apiKey: string): Promise<{ success: boolean; error?: string }> {
  if (BIN_ID) {
    // 已有存储桶，检查是否可用
    const isAvailable = await checkCloudService(apiKey);
    if (isAvailable) {
      return { success: true };
    }
  }
  
  // 创建新存储桶
  const result = await createBin(apiKey);
  if (result.success) {
    return { success: true };
  }
  return { success: false, error: result.error || '初始化云端数据库失败' };
}
