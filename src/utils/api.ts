// API 配置
// 使用 Render 部署的后端地址
const API_BASE = 'https://ai-comic-studio-api.onrender.com/api';

// 获取存储的 token
const getToken = () => {
  try {
    return localStorage.getItem('ai_comic_token') || '';
  } catch {
    return '';
  }
};

// 设置 token
const setToken = (token: string) => {
  try {
    localStorage.setItem('ai_comic_token', token);
  } catch { /* ignore */ }
};

// 清除 token
const clearToken = () => {
  try {
    localStorage.removeItem('ai_comic_token');
  } catch { /* ignore */ }
};

// 通用请求函数
async function request(url: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    throw new Error(data.error || `请求失败: ${res.status}`);
  }

  return data;
}

// 注册
export async function register(username: string, password: string, email?: string) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, email }),
  });
  
  if (data.token) {
    setToken(data.token);
  }
  
  return data;
}

// 登录
export async function login(username: string, password: string) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  
  if (data.token) {
    setToken(data.token);
  }
  
  return data;
}

// 获取用户信息
export async function getUser(userId: string) {
  return request(`/users/${userId}`);
}

// 更新用户信息
export async function updateUser(userId: string, updates: Record<string, any>) {
  return request(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// 检查后端服务是否可用
export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// 导出工具函数
export { getToken, setToken, clearToken };
