import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Save, ArrowLeft, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { setBinId, getBinId, createBin, checkCloudService } from '@/utils/cloudDatabase';

export function CloudDatabaseConfig() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [binId, setBinIdState] = useState(getBinId());
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const handleCreateBin = async () => {
    setError('');
    if (!apiKey) {
      setError('请输入 JSONBin.io API Key');
      return;
    }

    setTesting(true);
    const result = await createBin(apiKey);
    setTesting(false);

    if (result.success && result.id) {
      setBinIdState(result.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(result.error || '创建存储桶失败');
    }
  };

  const handleTest = async () => {
    setError('');
    if (!apiKey) {
      setError('请输入 API Key');
      return;
    }

    setTesting(true);
    const result = await checkCloudService(apiKey);
    setTesting(false);
    setTestResult(result);

    if (!result) {
      setError('连接失败，请检查 API Key 和存储桶 ID');
    }
  };

  const handleSave = () => {
    if (binId) {
      setBinId(binId);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="h-14 bg-white/5 backdrop-blur-xl border-b border-gray-700/30 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="font-medium text-white text-sm">云端数据库配置</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 pt-8">
        <div className="bg-white/5 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-white font-medium">JSONBin.io 云端数据库</h2>
              <p className="text-gray-500 text-sm">免费云端存储，无需部署服务器</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-yellow-400 text-sm font-medium mb-2">配置步骤：</p>
              <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside">
                <li>访问 <a href="https://jsonbin.io" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline inline-flex items-center gap-1">jsonbin.io <ExternalLink className="w-3 h-3" /></a> 注册账号</li>
                <li>在 API Keys 页面获取 Master Key</li>
                <li>将 Key 填入下方，点击"创建存储桶"</li>
                <li>完成后即可使用云端注册/登录</li>
              </ol>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API Key (Master Key)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="$2a$10$xxxxxxxxxxxxxxxx"
                className="w-full px-4 py-3 bg-black/30 border border-gray-600/30 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                存储桶 ID (Bin ID)
              </label>
              <input
                type="text"
                value={binId}
                onChange={(e) => setBinIdState(e.target.value)}
                placeholder="自动创建或手动填写"
                className="w-full px-4 py-3 bg-black/30 border border-gray-600/30 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
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
                配置已保存
              </div>
            )}

            {testResult !== null && (
              <div className={`flex items-center gap-2 text-sm ${testResult ? 'text-green-400' : 'text-red-400'}`}>
                <Check className="w-4 h-4" />
                {testResult ? '连接成功！云端服务可用' : '连接失败'}
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleCreateBin}
                disabled={testing}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-colors"
              >
                <Database className="w-4 h-4" />
                {testing ? '创建中...' : '创建存储桶'}
              </button>
              <button
                onClick={handleTest}
                disabled={testing}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-gray-400 rounded-xl transition-colors"
              >
                {testing ? '测试中...' : '测试连接'}
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors"
              >
                <Save className="w-4 h-4" />
                保存配置
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white/5 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-6">
          <h3 className="text-white font-medium mb-4">其他方案</h3>
          <div className="space-y-3 text-sm text-gray-400">
            <p>如果 JSONBin.io 无法访问，还可以使用：</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>RestDB.io</strong> - 类似服务，国内可访问</li>
              <li><strong>腾讯云 EdgeOne</strong> - 国内加速，支持 Serverless</li>
              <li><strong>阿里云函数计算</strong> - 免费试用3个月</li>
              <li><strong>华为开发者空间</strong> - 免费容器环境</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
