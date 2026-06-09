import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

// 从 package.json 读取的版本号
const APP_VERSION = '1.7.1.17';

const VERSION_HISTORY = [
  {
    version: '1.7.0',
    date: '2026-06-08',
    features: [
      '修复注册逻辑',
      '添加数据库管理功能',
      '优化响应式图标',
      '修复积分领取逻辑'
    ]
  },
  {
    version: '1.6.0',
    date: '2026-06-08',
    features: [
      '时间显示横屏模式',
      '修复竖屏照片显示问题',
      '优化积分中心图标'
    ]
  },
  {
    version: '1.5.0',
    date: '2026-06-08',
    features: [
      '添加响应式图标组件',
      '修复多端登录问题',
      '优化手机端适配'
    ]
  },
  {
    version: '1.4.0',
    date: '2026-06-07',
    features: [
      '添加幸运大转盘功能',
      '广告抽奖随机次数',
      '签到积分随机1-20'
    ]
  },
  {
    version: '1.3.0',
    date: '2026-06-07',
    features: [
      '上传文件生成漫剧修复',
      '保存生成设置到localStorage'
    ]
  },
  {
    version: '1.2.0',
    date: '2026-06-06',
    features: [
      '积分中心重构',
      '添加个人中心',
      '丰富积分任务种类'
    ]
  },
  {
    version: '1.1.0',
    date: '2026-06-06',
    features: [
      '修复文件上传问题',
      '添加登录注册功能',
      '添加积分系统'
    ]
  },
  {
    version: '1.0.0',
    date: '2026-06-05',
    features: [
      '初始版本发布'
    ]
  }
];

export function AppVersion() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-xs"
      >
        <span className="font-mono font-medium">v{APP_VERSION}</span>
        {isExpanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {isExpanded && (
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-cyber-dark2/95 backdrop-blur-xl border border-cyber-purple/30 rounded-2xl p-4 shadow-2xl z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-white">版本历史</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {VERSION_HISTORY.map((version, index) => (
              <div key={version.version} className="border-l-2 border-cyber-purple/30 pl-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-bold text-cyber-pink">
                    v{version.version}
                  </span>
                  <span className="text-xs text-gray-500">{version.date}</span>
                </div>
                {version.features.map((feature, i) => (
                  <p key={i} className="text-xs text-gray-400 ml-1">• {feature}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
