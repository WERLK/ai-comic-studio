import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Key, Save, ArrowLeft, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { setAIConfig, getAIConfig } from '@/services/aiService';

export function AIConfigPage() {
  const navigate = useNavigate();
  const config = getAIConfig();
  
  const [siliconflowKey, setSiliconflowKey] = useState(config.siliconflowApiKey || '');
  const [jeniyaKey, setJeniyaKey] = useState(config.jeniyaApiKey || '');
  const [dashscopeKey, setDashscopeKey] = useState(config.dashscopeApiKey || '');
  const [zhipuKey, setZhipuKey] = useState(config.zhipuApiKey || '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    setError('');
    
    const newConfig: any = {};
    
    if (siliconflowKey) newConfig.siliconflowApiKey = siliconflowKey;
    if (jeniyaKey) newConfig.jeniyaApiKey = jeniyaKey;
    if (dashscopeKey) newConfig.dashscopeApiKey = dashscopeKey;
    if (zhipuKey) newConfig.zhipuApiKey = zhipuKey;
    
    setAIConfig(newConfig);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="h-14 bg-white/5 backdrop-blur-xl border-b border-gray-700/30 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/settings')} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="font-medium text-white text-sm">AI 服务配置</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 pt-8">
        <div className="bg-white/5 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h2 className="text-white font-medium">AI 生成服务配置</h2>
              <p className="text-gray-500 text-sm">配置 AI 平台 API 密钥</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* 硅基流动 */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-medium text-sm">硅基流动（推荐）</span>
                </div>
                <a 
                  href="https://cloud.siliconflow.cn/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  获取密钥 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                100+模型 · 9B以下模型永久免费 · 新用户送2000万token
              </p>
              <input
                type="password"
                value={siliconflowKey}
                onChange={(e) => setSiliconflowKey(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 bg-black/30 border border-gray-600/30 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {/* 简易API */}
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-medium text-sm">简易API</span>
                </div>
                <a 
                  href="https://jeniya.cn/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  获取密钥 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                国内直连 · 无需翻墙 · 送200元额度
              </p>
              <input
                type="password"
                value={jeniyaKey}
                onChange={(e) => setJeniyaKey(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 bg-black/30 border border-gray-600/30 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* 阿里云百炼 */}
            <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-orange-400" />
                  <span className="text-white font-medium text-sm">阿里云百炼</span>
                </div>
                <a 
                  href="https://dashscope.aliyun.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
                >
                  获取密钥 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                通义千问全系 · OpenAI兼容
              </p>
              <input
                type="password"
                value={dashscopeKey}
                onChange={(e) => setDashscopeKey(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 bg-black/30 border border-gray-600/30 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-orange-500/50"
              />
            </div>

            {/* 智谱AI */}
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-green-400" />
                  <span className="text-white font-medium text-sm">智谱AI</span>
                </div>
                <a 
                  href="https://open.bigmodel.cn/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
                >
                  获取密钥 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                GLM-4-Flash永久免费 · 2000万token新用户额度
              </p>
              <input
                type="password"
                value={zhipuKey}
                onChange={(e) => setZhipuKey(e.target.value)}
                placeholder="xxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 bg-black/30 border border-gray-600/30 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-green-500/50"
              />
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
                配置已保存，AI 生成功能已启用
              </div>
            )}

            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white rounded-xl transition-all"
            >
              <Save className="w-4 h-4" />
              保存配置
            </button>
          </div>
        </div>

        <div className="mt-6 bg-white/5 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-6">
          <h3 className="text-white font-medium mb-4">使用说明</h3>
          <div className="space-y-3 text-sm text-gray-400">
            <p>1. 至少配置一个 AI 平台的 API 密钥</p>
            <p>2. 推荐使用 <strong className="text-purple-400">硅基流动</strong>，性价比最高</p>
            <p>3. 配置后即可使用 AI 漫剧生成、剧本创作等功能</p>
            <p>4. API 密钥仅保存在本地浏览器，不会上传到服务器</p>
          </div>
        </div>
      </div>
    </div>
  );
}
