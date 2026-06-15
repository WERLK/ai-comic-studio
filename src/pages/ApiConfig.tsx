import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Save, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { setApiBase, getApiBase } from '@/stores/authStore';

export function ApiConfig() {
  const navigate = useNavigate();
  const [apiUrl, setApiUrl] = useState(getApiBase());
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    setError('');
    if (!apiUrl) {
      setError('请输入后端API地址');
      return;
    }
    
    try {
      new URL(apiUrl);
    } catch {
      setError('请输入有效的URL地址');
      return;
    }
    
    setApiBase(apiUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setApiBase('/api');
    setApiUrl('/api');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="h-14 bg-white/5 backdrop-blur-xl border-b border-gray-700/30 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="font-medium text-white text-sm">API 配置</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 pt-8">
        <div className="bg-white/5 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Server className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-white font-medium">后端 API 配置</h2>
              <p className="text-gray-500 text-sm">配置云端后端服务器地址</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                后端 API 地址
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://your-backend.onrender.com/api"
                className="w-full px-4 py-3 bg-black/30 border border-gray-600/30 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
              <p className="text-gray-600 text-xs mt-2">
                默认使用 /api（本地开发环境），生产环境请填写云端后端地址
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {saved && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Check className="w-4 h-4" />
                配置已保存
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors"
              >
                <Save className="w-4 h-4" />
                保存配置
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl transition-colors"
              >
                重置为默认
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white/5 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-6">
          <h3 className="text-white font-medium mb-4">部署指南</h3>
          <div className="space-y-3 text-sm text-gray-400">
            <p>1. 免费后端部署平台推荐：</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Render (render.com) - 免费，支持Node.js</li>
              <li>Railway (railway.app) - 免费额度，支持Docker</li>
              <li>Fly.io - 免费额度，全球CDN</li>
            </ul>
            <p>2. 部署后获取后端URL，填入上方配置</p>
            <p>3. 确保后端配置了 CORS，允许 GitHub Pages 域名访问</p>
          </div>
        </div>
      </div>
    </div>
  );
}
