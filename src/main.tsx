import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

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
      <div style="padding: 40px 20px; color: #fff; background: #1a1a2e; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="color: #ff6b9d;">启动失败</h2>
        <p style="color: #aaa;">请刷新页面重试。如果问题持续，请清除浏览器缓存。</p>
        <pre style="background: #000; padding: 12px; border-radius: 8px; overflow-x: auto; color: #8fd; font-size: 12px;">${error}</pre>
      </div>
    `
  }
}
