/**
 * 数据库管理模块
 * 统一管理所有本地存储数据
 */

export type UserRole = 'admin' | 'user';

export interface DatabaseUser {
  id: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  points: number;
  totalEarnedPoints: number;
  level: number;
  projectsCount: number;
  isVIP: boolean;
  vipLevel: number;
  vipPoints: number;
  vipExpireAt: string | null;
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

export interface PublicUser extends Omit<DatabaseUser, 'password'> {}

// 所有存储键名
export const STORAGE_KEYS = {
  // 用户认证
  AUTH: 'ai_comic_auth',
  USERS: 'ai_comic_users_v2',

  // 项目数据
  PROJECTS: 'manga-studio-projects',

  // 抽奖数据
  LUCKY_WHEEL: 'luckyWheelState',
  AD_SPINS: 'lastAdSpins',

  // 积分数据
  POINTS_HISTORY: 'points_history',

  // 设置
  SETTINGS: 'app_settings',
} as const;

// ===== 工具函数 =====
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

const normalize = (s: string) => s.trim().toLowerCase();

const stripPassword = (u: DatabaseUser): PublicUser => {
  const { password, ...rest } = u;
  return rest;
};

// 简单的哈希（前端环境，纯本地存储）
const simpleHash = (s: string): string => {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const chr = s.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + s.length;
};

// ===== 用户表读写 =====
const readUsers = (): DatabaseUser[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeUsers = (users: DatabaseUser[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch {
    // ignore
  }
};

// ===== 核心用户 API =====

/**
 * 注册用户
 */
export function registerUser(params: {
  username: string;
  email?: string;
  password: string;
}): { ok: true; user: PublicUser } | { ok: false; code: string; message: string } {
  const username = params.username?.trim();
  const email = (params.email || '').trim();
  const password = params.password;

  if (!username || !password) {
    return { ok: false, code: 'MISSING_FIELDS', message: '用户名和密码不能为空' };
  }

  const users = readUsers();
  const usernameNorm = normalize(username);

  const existing = users.find((u) => normalize(u.username) === usernameNorm);
  if (existing) {
    if (existing.password === simpleHash(password)) {
      // 用户名密码都相同 → 当作登录
      return loginUser({ username, password });
    }
    return { ok: false, code: 'USER_EXISTS', message: '该用户名已注册，请直接登录' };
  }

  const today = getTodayKey();
  const initialPoints = 50;
  const newUser: DatabaseUser = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    username,
    email,
    password: simpleHash(password),
    role: 'user',
    points: initialPoints,
    totalEarnedPoints: initialPoints,
    level: 1,
    projectsCount: 0,
    isVIP: false,
    vipLevel: 0,
    vipPoints: 0,
    vipExpireAt: null,
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

  writeUsers([...users, newUser]);
  return { ok: true, user: stripPassword(newUser) };
}

/**
 * 用户登录
 */
export function loginUser(params: {
  username: string;
  password: string;
}): { ok: true; user: PublicUser } | { ok: false; code: string; message: string } {
  const username = params.username?.trim();
  const password = params.password;

  if (!username || !password) {
    return { ok: false, code: 'MISSING_FIELDS', message: '用户名和密码不能为空' };
  }

  const users = readUsers();
  const usernameNorm = normalize(username);
  const match = users.find((u) => normalize(u.username) === usernameNorm);

  if (!match) {
    return { ok: false, code: 'USER_NOT_FOUND', message: '该账号尚未注册' };
  }

  if (match.password !== simpleHash(password)) {
    return { ok: false, code: 'WRONG_PASSWORD', message: '密码错误' };
  }

  // 更新连续登录天数
  const today = getTodayKey();
  let consecutive = match.consecutiveLoginDays || 1;
  if (match.lastLoginDate && match.lastLoginDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    consecutive =
      match.lastLoginDate === yesterday.toISOString().split('T')[0] ? consecutive + 1 : 1;
  }

  const updated: DatabaseUser = {
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

  writeUsers(users.map((u) => (u.id === match.id ? updated : u)));
  return { ok: true, user: stripPassword(updated) };
}

/**
 * 根据 ID 查找用户
 */
export function getUserById(id: string): PublicUser | null {
  const users = readUsers();
  const user = users.find((u) => u.id === id);
  return user ? stripPassword(user) : null;
}

/**
 * 更新用户数据
 */
export function updateUser(
  id: string,
  updates: Partial<Omit<DatabaseUser, 'id' | 'password'>>
): PublicUser | null {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) return null;

  const merged: DatabaseUser = { ...users[idx], ...updates };
  users[idx] = merged;
  writeUsers(users);
  return stripPassword(merged);
}

/**
 * 获取所有用户（管理用）
 */
export function getAllUsers(): PublicUser[] {
  return readUsers().map(stripPassword);
}

/**
 * 删除用户
 */
export function deleteUser(id: string): boolean {
  const users = readUsers();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length) return false;
  writeUsers(filtered);
  return true;
}

// ===== 记录类型 =====
// 数据类型
export interface DatabaseRecord {
  key: string;
  value: any;
  timestamp: number;
  size: number;
}

// 数据库状态
export interface DatabaseStatus {
  totalSize: number;
  recordCount: number;
  lastUpdated: number;
}

/**
 * 获取存储大小（字节）
 */
function getStorageSize(): number {
  let total = 0;
  for (const key of Object.values(STORAGE_KEYS)) {
    const value = localStorage.getItem(key);
    if (value) {
      total += key.length + value.length;
    }
  }
  return total;
}

/**
 * 格式化文件大小
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 获取数据库状态
 */
export function getDatabaseStatus(): DatabaseStatus {
  let recordCount = 0;
  let lastUpdated = 0;
  
  for (const key of Object.values(STORAGE_KEYS)) {
    const value = localStorage.getItem(key);
    if (value) {
      recordCount++;
      try {
        const parsed = JSON.parse(value);
        if (parsed._timestamp && parsed._timestamp > lastUpdated) {
          lastUpdated = parsed._timestamp;
        }
      } catch {
        // ignore
      }
    }
  }
  
  return {
    totalSize: getStorageSize(),
    recordCount,
    lastUpdated,
  };
}

/**
 * 获取所有数据库记录
 */
export function getAllRecords(): DatabaseRecord[] {
  const records: DatabaseRecord[] = [];
  
  for (const [name, key] of Object.entries(STORAGE_KEYS)) {
    const value = localStorage.getItem(key);
    if (value) {
      records.push({
        key: name,
        fullKey: key,
        value: value,
        timestamp: Date.now(),
        size: new Blob([value]).size,
      });
    }
  }
  
  return records;
}

/**
 * 获取单个表的数据
 */
export function getTable(tableName: string): any | null {
  const key = STORAGE_KEYS[tableName as keyof typeof STORAGE_KEYS];
  if (!key) return null;
  
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

/**
 * 保存数据到表
 */
export function saveToTable(tableName: string, data: any): boolean {
  const key = STORAGE_KEYS[tableName as keyof typeof STORAGE_KEYS];
  if (!key) return false;
  
  try {
    const wrappedData = {
      ...data,
      _timestamp: Date.now(),
      _version: '1.0',
    };
    localStorage.setItem(key, JSON.stringify(wrappedData));
    return true;
  } catch (error) {
    console.error(`保存数据到 ${tableName} 失败:`, error);
    return false;
  }
}

/**
 * 清空指定表
 */
export function clearTable(tableName: string): boolean {
  const key = STORAGE_KEYS[tableName as keyof typeof STORAGE_KEYS];
  if (!key) return false;
  
  localStorage.removeItem(key);
  return true;
}

/**
 * 清空所有数据库
 */
export function clearDatabase(): {
  success: boolean;
  clearedCount: number;
  errors: string[];
} {
  const errors: string[] = [];
  let clearedCount = 0;
  
  for (const key of Object.values(STORAGE_KEYS)) {
    try {
      localStorage.removeItem(key);
      clearedCount++;
    } catch (error) {
      errors.push(`清空 ${key} 失败: ${error}`);
    }
  }
  
  return {
    success: errors.length === 0,
    clearedCount,
    errors,
  };
}

/**
 * 导出数据库为 JSON 文件
 */
export function exportDatabase(): {
  success: boolean;
  data: any;
  filename: string;
} {
  const data: Record<string, any> = {};
  
  for (const [name, key] of Object.entries(STORAGE_KEYS)) {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        data[name] = JSON.parse(value);
      } catch {
        data[name] = value;
      }
    }
  }
  
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    appName: 'AI漫剧工作室',
    data,
  };
  
  return {
    success: true,
    data: exportData,
    filename: `ai-comic-backup-${new Date().toISOString().split('T')[0]}.json`,
  };
}

/**
 * 从 JSON 文件导入数据
 */
export function importDatabase(jsonString: string): {
  success: boolean;
  importedCount: number;
  errors: string[];
} {
  const errors: string[] = [];
  let importedCount = 0;
  
  try {
    const importData = JSON.parse(jsonString);
    
    if (!importData.data) {
      return {
        success: false,
        importedCount: 0,
        errors: ['无效的导入文件格式'],
      };
    }
    
    for (const [name, value] of Object.entries(importData.data)) {
      const key = STORAGE_KEYS[name as keyof typeof STORAGE_KEYS];
      if (key) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          importedCount++;
        } catch (error) {
          errors.push(`导入 ${name} 失败: ${error}`);
        }
      }
    }
    
    return {
      success: errors.length === 0,
      importedCount,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      importedCount: 0,
      errors: [`解析导入文件失败: ${error}`],
    };
  }
}

/**
 * 下载文件
 */
export function downloadFile(content: string, filename: string, type: string = 'application/json'): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 上传文件
 */
export function uploadFile(callback: (content: string) => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        callback(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };
  input.click();
}
