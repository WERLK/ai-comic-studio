import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Server } from 'lucide-react';

export function ApiConfig() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="h-14 bg-white/5 backdrop-blur-xl border-b border-gray-700/30 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="font-medium text-white text-sm">数据存储说明</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 pt-8">
        <div className="bg-white/5 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Server className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-white font-medium">本地存储模式</h2>
              <p className="text-gray-500 text-sm">所有数据保存在浏览器本地</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-gray-400">
            <p>
              当前版本采用纯本地存储模式，所有用户数据（账号、积分、项目）均保存在浏览器 localStorage 中。
            </p>
            <p className="text-yellow-400/80">
              注意：清除浏览器数据会导致账号和项目丢失，请定期使用导出功能备份。
            </p>
            <p>
              如需跨设备同步，请在登录页面使用「导出数据」和「导入数据」功能。
            </p>
          </div>
        </div>

        <div className="mt-6 bg-white/5 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-6">
          <h3 className="text-white font-medium mb-4">数据备份指南</h3>
          <div className="space-y-3 text-sm text-gray-400">
            <p>1. 登录后点击「导出数据」，下载 JSON 文件</p>
            <p>2. 在新设备登录页面点击「导入数据」，上传文件</p>
            <p>3. 导入后积分、等级、项目数据将自动同步</p>
          </div>
        </div>
      </div>
    </div>
  );
}