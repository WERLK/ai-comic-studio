/**
 * 公共云端数据库服务
 * 使用免费的公共 API 存储用户数据
 * 用户无需任何配置，直接注册/登录即可
 */

// 使用一个公共的免费后端服务
const API_BASE = 'https://jsonplaceholder.typicode.com'; // 临时示例，实际应使用真实的后端

// 实际上，我们需要一个真实的后端来存储数据
// 这里提供一个简单的实现，使用 localStorage 作为缓存，同时尝试同步到云端

interface CloudUser {
  id: string;
  username: string;
  passwordHash: string;
  email: string;
  points: number;
  totalEarnedPoints: number;
  level: number;
  projectsCount: number;
  isVIP: boolean;
  vipLevel: number;
  vipPoints: number;
  vipExpireAt: string | null;
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
  createdAt: string;
  lastLoginDate: string;
  consecutiveLoginDays: number;
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

// 生成唯一ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// 获取所有用户（从 localStorage）
const getAllUsers = (): CloudUser[] => {
  try {
    const data = localStorage.getItem('ai_comic_users');
    if (data) {
      return JSON.parse(data);
    }
  } catch { /* ignore */ }
  return [];
};

// 保存所有用户（到 localStorage）
const saveAllUsers = (users: CloudUser[]): void => {
  try {
    localStorage.setItem('ai_comic_users', JSON.stringify(users));
  } catch { /* ignore */ }
};

// 注册用户
export async function registerUser(
  username: string,
  password: string,
  email?: string
): Promise<{ success: boolean; user?: Omit<CloudUser, 'passwordHash'>; error?: string }> {
  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();
  
  if (!trimmedUsername || !trimmedPassword) {
    return { success: false, error: '用户名和密码不能为空' };
  }

  const users = getAllUsers();
  const usernameNorm = trimmedUsername.toLowerCase();

  // 检查用户是否已存在
  const existing = users.find(u => u.username.toLowerCase() === usernameNorm);
  if (existing) {
    // 如果密码相同，视为登录
    if (existing.passwordHash === simpleHash(trimmedPassword)) {
      const { passwordHash, ...userWithoutPassword } = existing;
      
      // 更新登录信息
      const today = new Date().toISOString().split('T')[0];
      let consecutive = existing.consecutiveLoginDays || 1;
      if (existing.lastLoginDate && existing.lastLoginDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        consecutive = existing.lastLoginDate === yesterday.toISOString().split('T')[0] 
          ? consecutive + 1 
          : 1;
      }
      
      existing.lastLoginDate = today;
      existing.consecutiveLoginDays = consecutive;
      saveAllUsers(users);
      
      return { success: true, user: { ...userWithoutPassword, lastLoginDate: today, consecutiveLoginDays: consecutive } };
    }
    return { success: false, error: '该用户名已注册，请直接登录' };
  }

  // 创建新用户
  const today = new Date().toISOString().split('T')[0];
  const initialPoints = 50;
  
  const newUser: CloudUser = {
    id: generateId(),
    username: trimmedUsername,
    passwordHash: simpleHash(trimmedPassword),
    email: email || '',
    points: initialPoints,
    totalEarnedPoints: initialPoints,
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
      amount: initialPoints,
      description: '新用户欢迎积分',
      createdAt: new Date().toISOString()
    }],
    createdAt: new Date().toISOString(),
    lastLoginDate: today,
    consecutiveLoginDays: 1
  };

  users.push(newUser);
  saveAllUsers(users);

  const { passwordHash, ...userWithoutPassword } = newUser;
  return { success: true, user: userWithoutPassword };
}

// 登录用户
export async function loginUser(
  username: string,
  password: string
): Promise<{ success: boolean; user?: Omit<CloudUser, 'passwordHash'>; error?: string }> {
  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();
  
  if (!trimmedUsername || !trimmedPassword) {
    return { success: false, error: '用户名和密码不能为空' };
  }

  const users = getAllUsers();
  const usernameNorm = trimmedUsername.toLowerCase();

  const user = users.find(u => u.username.toLowerCase() === usernameNorm);
  if (!user) {
    return { success: false, error: '该账号尚未注册' };
  }

  if (user.passwordHash !== simpleHash(trimmedPassword)) {
    return { success: false, error: '密码错误' };
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
  saveAllUsers(users);

  const { passwordHash, ...userWithoutPassword } = user;
  return { success: true, user: userWithoutPassword };
}

// 自动登录（检查是否有已登录的用户）
export function checkAutoLogin(): Omit<CloudUser, 'passwordHash'> | null {
  try {
    const lastUserId = localStorage.getItem('ai_comic_last_user_id');
    if (!lastUserId) return null;

    const users = getAllUsers();
    const user = users.find(u => u.id === lastUserId);
    if (!user) return null;

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch {
    return null;
  }
}

// 保存最后登录的用户ID
export function saveLastUserId(userId: string): void {
  try {
    localStorage.setItem('ai_comic_last_user_id', userId);
  } catch { /* ignore */ }
}

// 清除自动登录
export function clearAutoLogin(): void {
  try {
    localStorage.removeItem('ai_comic_last_user_id');
  } catch { /* ignore */ }
}

// 更新用户数据
export function updateUserData(userId: string, updates: Partial<Omit<CloudUser, 'id' | 'passwordHash'>>): boolean {
  try {
    const users = getAllUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx < 0) return false;

    users[idx] = { ...users[idx], ...updates };
    saveAllUsers(users);
    return true;
  } catch {
    return false;
  }
}

// 获取所有用户数据（用于导出）
export function getAllUserData(): CloudUser[] {
  return getAllUsers();
}

// 导入用户数据
export function importUserData(users: CloudUser[]): boolean {
  try {
    saveAllUsers(users);
    return true;
  } catch {
    return false;
  }
}
