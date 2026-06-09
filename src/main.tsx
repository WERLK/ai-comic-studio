import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// 版本检测：如果检测到新版本则强制刷新
const CURRENT_VERSION = '1.7.1.17';
const versionKey = 'app_version_cache';
const cachedVersion = localStorage.getItem(versionKey);

if (cachedVersion && cachedVersion !== CURRENT_VERSION) {
  // 版本不一致，清除缓存并强制刷新
  localStorage.removeItem(versionKey);
  // 清除所有可能的缓存键
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key !== versionKey && !key.startsWith('ai_comic_')) {
      // 保留用户数据，只清除缓存相关的
    }
  }
  localStorage.setItem(versionKey, CURRENT_VERSION);
  // 强制刷新，绕过缓存
  window.location.reload(true);
} else if (!cachedVersion) {
  localStorage.setItem(versionKey, CURRENT_VERSION);
}

try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found')
  }
  createRoot(rootElement).render(<App />)
} catch (error) {
  console.error('Failed to render app:', error)
  const rootElement = document.getElementById('root')
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; color: #FF2E63;">
        <h2>App Render Error</h2>
        <pre>${error}</pre>
      </div>
    `
  }
}
