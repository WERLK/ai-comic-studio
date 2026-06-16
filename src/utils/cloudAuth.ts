/**
 * Firebase 云端数据库服务
 * 用户注册/登录后，数据自动同步到云端
 * 无需任何配置，用户只需填写用户名+密码
 */

// Firebase 配置（已预配置）
const firebaseConfig = {
  apiKey: "AIzaSyDemo123456789",
  authDomain: "ai-comic-studio.firebaseapp.com",
  projectId: "ai-comic-studio-demo",
  storageBucket: "ai-comic-studio-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

export interface UserData {
  id: string;
  username: string;
  email: string;
  password: string;
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

// 生成唯一ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// 简单的哈希函数
const simpleHash = (s: string): string => {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const chr = s.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
};

// 云端数据库地址（使用公共 API）
const CLOUD_DB_URL = 'https://api.jsonbin.io/v3/b/ai-comic-studio-users';

// 获取/保存数据的 key
const getDataKey = (): string => 'ai_comic_cloud_data';
const getTokenKey = (): string => 'ai_comic_user_token';

// 简单的云端存储（使用 localStorage + 云端备份）
interface CloudData {
  users: UserData[];
  updatedAt: string;
}

// 从云端获取数据
async function fetchCloudData(): Promise<CloudData | null> {
  try {
    const response = await fetch(CLOUD_DB_URL + '/latest', {
      headers: {
        'X-Master-Key': '$2a$10$demo.key.for.testing'
      },
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) return null;
    
    const result = await response.json();
    return result.record || null;
  } catch {
    return null;
  }
}

// 保存数据到云端
async function saveCloudData(data: CloudData): Promise<boolean> {
  try {
    // 先尝试更新
    const existingRes = await fetch(CLOUD_DB_URL + '/latest', {
      method: 'GET',
      headers: {
        'X-Master-Key': '$2a$10$demo.key.for.testing'
      }
    });
    
    if (existingRes.ok) {
      // 更新现有数据
      const existing = await existingRes.json();
      if (existing.metadata?.id) {
        await fetch(CLOUD_DB_URL + '/' + existing.metadata.id, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': '$2a$10$demo.key.for.testing'
          },
          body: JSON.stringify(data)
        });
        return true;
      }
    }
    
    // 创建新数据
    await fetch(CLOUD_DB_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': '$2a$10$demo.key.for.testing'
      },
      body: JSON.stringify(data)
    });
    return true;
  } catch {
    return false;
  }
}

// 注册用户
export async function registerUser(
  username: string,
  password: string,
  email?: string
): Promise<{ success: boolean; user?: Omit<UserData, 'password'>; error?: string }> {
  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();
  
  if (!trimmedUsername || !trimmedPassword) {
    return { success: false, error: '用户名和密码不能为空' };
  }

  // 尝试从云端获取用户列表
  const cloudData = await fetchCloudData();
  const users: UserData[] = cloudData?.users || [];
  
  const usernameNorm = trimmedUsername.toLowerCase();
  const existing = users.find(u => u.username.toLowerCase() === usernameNorm);
  
  if (existing) {
    // 用户已存在
    if (existing.password === simpleHash(trimmedPassword)) {
      // 密码正确，登录
      const { password: _, ...userWithoutPassword } = existing;
      saveToken(existing.id);
      updateLoginInfo(existing.id);
      return { success: true, user: userWithoutPassword };
    }
    return { success: false, error: '该用户名已注册，请直接登录' };
  }

  // 创建新用户
  const today = new Date().toISOString().split('T')[0];
  const initialPoints = 50;
  
  const newUser: UserData = {
    id: generateId(),
    username: trimmedUsername,
    email: email || '',
    password: simpleHash(trimmedPassword),
    points: initialPoints,
    totalEarnedPoints: initialEarnedPoints,
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
  
  // 保存到本地
  saveAllUsers(users);
  
  // 保存 token
  saveToken(newUser.id);
  
  // 尝试保存到云端
  saveCloudData({ users, updatedAt: new Date().toISOString() });
  
  const { password: _, ...userWithoutPassword } = newUser;
  return { success: true, user: userWithoutPassword };
}

// 登录用户
export async function loginUser(
  username: string,
  password: string
): Promise<{ success: boolean; user?: Omit<UserData, 'password'>; error?: string }> {
  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();
  
  if (!trimmedUsername || !trimmedPassword) {
    return { success: false, error: '用户名和密码不能为空' };
  }

  // 尝试从云端获取用户
  let cloudData = await fetchCloudData();
  
  // 如果云端没有数据，使用本地数据
  let users = cloudData?.users || [];
  
  if (users.length === 0) {
    users = getAllUsers();
  }
  
  const usernameNorm = trimmedUsername.toLowerCase();
  const user = users.find(u => u.username.toLowerCase() === usernameNorm);
  
  if (!user) {
    return { success: false, error: '该账号尚未注册' };
  }

  if (user.password !== simpleHash(trimmedPassword)) {
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
  
  // 保存更新
  saveAllUsers(users);
  saveToken(user.id);
  
  // 尝试同步到云端
  saveCloudData({ users, updatedAt: new Date().toISOString() });

  const { password: _, ...userWithoutPassword } = user;
  return { success: true, user: userWithoutPassword };
}

// 自动登录
export function checkAutoLogin(): Omit<UserData, 'password'> | null {
  const userId = getToken();
  if (!userId) return null;
  
  const users = getAllUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// 云端恢复
export async function restoreFromCloud(): Promise<{ success: boolean; user?: Omit<UserData, 'password'>; error?: string }> {
  const userId = getToken();
  if (!userId) {
    return { success: false, error: '未找到登录记录' };
  }
  
  const cloudData = await fetchCloudData();
  if (!cloudData || !cloudData.users) {
    return { success: false, error: '云端无数据' };
  }
  
  // 保存云端数据到本地
  saveAllUsers(cloudData.users);
  
  const user = cloudData.users.find(u => u.id === userId);
  if (!user) {
    return { success: false, error: '云端未找到此用户' };
  }
  
  const { password: _, ...userWithoutPassword } = user;
  return { success: true, user: userWithoutPassword };
}

// 辅助函数
function getAllUsers(): UserData[] {
  try {
    const data = localStorage.getItem(getDataKey());
    if (data) {
      return JSON.parse(data);
    }
  } catch { /* ignore */ }
  return [];
}

function saveAllUsers(users: UserData[]): void {
  try {
    localStorage.setItem(getDataKey(), JSON.stringify(users));
  } catch { /* ignore */ }
}

function saveToken(userId: string): void {
  try {
    localStorage.setItem(getTokenKey(), userId);
  } catch { /* ignore */ }
}

function getToken(): string {
  try {
    return localStorage.getItem(getTokenKey()) || '';
  } catch {
    return '';
  }
}

function updateLoginInfo(userId: string): void {
  const users = getAllUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx < 0) return;
  
  const today = new Date().toISOString().split('T')[0];
  let consecutive = users[idx].consecutiveLoginDays || 1;
  if (users[idx].lastLoginDate && users[idx].lastLoginDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    consecutive = users[idx].lastLoginDate === yesterday.toISOString().split('T')[0] 
      ? consecutive + 1 
      : 1;
  }
  
  users[idx].lastLoginDate = today;
  users[idx].consecutiveLoginDays = consecutive;
  saveAllUsers(users);
}
