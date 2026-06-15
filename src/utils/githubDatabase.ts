/**
 * GitHub 作为云端数据库
 * 使用 GitHub Issues 存储用户数据
 * 无需额外服务器，直接调用 GitHub API
 */

// GitHub 配置（使用您的账号）
const GITHUB_OWNER = 'WERLK';
const GITHUB_REPO = 'ai-comic-studio-db'; // 存储数据的仓库
const GITHUB_TOKEN = 'ghp_xxxxxxxxxxxxxxxx'; // 用户需要提供 Personal Access Token

interface GitHubUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
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

// 存储 GitHub Token
export function setGitHubToken(token: string) {
  try {
    localStorage.setItem('ai_comic_github_token', token);
  } catch { /* ignore */ }
}

export function getGitHubToken(): string {
  try {
    return localStorage.getItem('ai_comic_github_token') || '';
  } catch {
    return '';
  }
}

// 创建数据仓库（如果不存在）
export async function initDatabase(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 检查仓库是否存在
    const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (res.status === 404) {
      // 创建仓库
      const createRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          name: GITHUB_REPO,
          description: 'AI漫剧工作室用户数据库',
          private: true,
          auto_init: true
        })
      });

      if (!createRes.ok) {
        return { success: false, error: '创建仓库失败' };
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || '初始化失败' };
  }
}

// 获取所有用户数据
async function getUsers(token: string): Promise<GitHubUser[]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=all&labels=user-data&per_page=100`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!res.ok) return [];

    const issues = await res.json();
    const users: GitHubUser[] = [];

    for (const issue of issues) {
      try {
        const userData = JSON.parse(issue.body);
        if (userData.type === 'user-data') {
          users.push(userData.data);
        }
      } catch { /* ignore */ }
    }

    return users;
  } catch {
    return [];
  }
}

// 保存用户数据
async function saveUser(token: string, user: GitHubUser): Promise<boolean> {
  try {
    // 查找是否已存在
    const issues = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=all&labels=user-data`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }).then(r => r.ok ? r.json() : []);

    const existingIssue = issues.find((issue: any) => {
      try {
        const data = JSON.parse(issue.body);
        return data.type === 'user-data' && data.data.id === user.id;
      } catch { return false; }
    });

    const body = JSON.stringify({
      type: 'user-data',
      data: user,
      updatedAt: new Date().toISOString()
    }, null, 2);

    if (existingIssue) {
      // 更新现有 issue
      const updateRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${existingIssue.number}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({ body })
      });
      return updateRes.ok;
    } else {
      // 创建新 issue
      const createRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          title: `用户: ${user.username}`,
          body,
          labels: ['user-data']
        })
      });
      return createRes.ok;
    }
  } catch {
    return false;
  }
}

// 注册用户
export async function registerGitHubUser(
  token: string,
  params: { username: string; email?: string; password: string }
): Promise<{ success: boolean; user?: Omit<GitHubUser, 'passwordHash'>; error?: string }> {
  const username = params.username?.trim();
  const email = (params.email || '').trim();
  const password = params.password;

  if (!username || !password) {
    return { success: false, error: '用户名和密码不能为空' };
  }

  const users = await getUsers(token);
  const usernameNorm = username.toLowerCase();

  const existing = users.find((u) => u.username.toLowerCase() === usernameNorm);
  if (existing) {
    if (existing.passwordHash === simpleHash(password)) {
      const { passwordHash, ...userWithoutPassword } = existing;
      return { success: true, user: userWithoutPassword };
    }
    return { success: false, error: '该用户名已注册，请直接登录' };
  }

  const today = new Date().toISOString().split('T')[0];
  const initialPoints = 50;
  const newUser: GitHubUser = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    username,
    email,
    passwordHash: simpleHash(password),
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
    transactions: [
      {
        id: Date.now().toString(),
        type: 'earn',
        amount: initialPoints,
        description: '新用户欢迎积分',
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    lastLoginDate: today,
    consecutiveLoginDays: 1
  };

  const saved = await saveUser(token, newUser);
  if (!saved) {
    return { success: false, error: '保存用户失败' };
  }

  const { passwordHash, ...userWithoutPassword } = newUser;
  return { success: true, user: userWithoutPassword };
}

// 登录
export async function loginGitHubUser(
  token: string,
  params: { username: string; password: string }
): Promise<{ success: boolean; user?: Omit<GitHubUser, 'passwordHash'>; error?: string }> {
  const username = params.username?.trim();
  const password = params.password;

  if (!username || !password) {
    return { success: false, error: '用户名和密码不能为空' };
  }

  const users = await getUsers(token);
  const usernameNorm = username.toLowerCase();

  const match = users.find((u) => u.username.toLowerCase() === usernameNorm);
  if (!match) {
    return { success: false, error: '该账号尚未注册' };
  }

  if (match.passwordHash !== simpleHash(password)) {
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

  await saveUser(token, match);

  const { passwordHash, ...userWithoutPassword } = match;
  return { success: true, user: userWithoutPassword };
}

// 更新用户
export async function updateGitHubUser(
  token: string,
  userId: string,
  updates: Partial<Omit<GitHubUser, 'id' | 'passwordHash'>>
): Promise<{ success: boolean; error?: string }> {
  const users = await getUsers(token);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) {
    return { success: false, error: '用户不存在' };
  }

  users[idx] = { ...users[idx], ...updates };
  const saved = await saveUser(token, users[idx]);
  return saved ? { success: true } : { success: false, error: '更新失败' };
}

// 检查服务是否可用
export async function checkGitHubService(token: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.github.com/user`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      signal: AbortSignal.timeout(5000)
    });
    return res.ok;
  } catch {
    return false;
  }
}
