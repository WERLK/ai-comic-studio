import { useState, useEffect } from 'react';
import { Zap, Sparkles } from 'lucide-react';

// 从 package.json 读取的版本号
const APP_VERSION = '1.2.0';

// 版本历史记录
const VERSION_HISTORY = [
  {
    version: '1.2.0',
    date: '2026-06-08',
    features: ['添加多配音角色数据库和选择功能'],
  },
  {
    version: '1.1.0',
    date: '2026-06-08',
    features: ['添加漫剧配音功能', '支持文字与配音同步'],
  },
  {
    version: '1.0.0',
    date: '2026-06-08',
    features: ['初始发布', '漫剧生成', '登录与积分系统', '多主题支持'],
  },
];

export function AppVersion() {
  const [showChangelog, setShowChangelog] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    // 获取当前时间显示上次更新时间
    const now = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    setLastUpdate(now);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setShowChangelog(!showChangelog)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-dark2/80 border border-cyber-purple/20 hover:border-cyber-pink/50 transition-all text-xs text-gray-400 hover:text-white"
      >
        <Zap className="w-3.5 h-3.5 text-cyber-yellow" />
        <span className="font-mono font-medium">v{APP_VERSION}</span>
      </button>

      {showChangelog && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowChangelog(false)}
          />
          <div className="absolute bottom-full right-0 mb-2 w-80 z-50 bg-cyber-dark2/95 backdrop-blur-xl border border-cyber-purple/30 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyber-pink" />
                <h3 className="font-display font-medium text-white">版本更新</h3>
              </div>
              <button
                onClick={() => setShowChangelog(false)}
                className="p-1 text-gray-500 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>
            
            <div className="text-xs text-gray-500 mb-3">
              最后更新: {lastUpdate}
            </div>

            <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
              {VERSION_HISTORY.map((version, index) => (
                <div key={version.version} className="border-l-2 border-cyber-purple/30 pl-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-cyber-pink">
                      v{version.version}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {version.date}
                    </span>
                    {index === 0 && (
                      <span className="text-[10px] px-2 py-0.5 bg-cyber-yellow/20 text-cyber-yellow rounded-full font-medium">
                        最新
                      </span>
                    )}
                  </div>
                  <ul className="text-xs text-gray-400 space-y-1">
                    {version.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyber-blue/50" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
