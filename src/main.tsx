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
      <div style="padding: 20px; color: #FF2E63;">
        <h2>App Render Error</h2>
        <pre>${error}</pre>
      </div>
    `
  }
}
