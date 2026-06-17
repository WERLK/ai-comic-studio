import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { APP_VERSION } from '@/config/version';

const VERSION_HISTORY = [
  {
    version: '1.27.5',
    date: '2026-06-17',
    features: [
      '完善 AI 生成内容格式，严格匹配截图分镜结构',
      '5种视频风格对应不同分镜字段（漫剧/真人/动漫/国风/电商）',
      '生成内容包含：视觉风格/人物设定/故事大纲/分镜脚本'
    ]
  },
  {
    version: '1.27.4',
    date: '2026-06-17',
    features: [
      '修复 ToolsPage.tsx 导出方式，解决功能中心黑屏',
      '重构 AI 智能生成小说界面：标签按钮式设定',
      '新增视频风格选择和分镜数控制',
      '题材扩充至 22 个类型'
    ]
  },
  {
    version: '1.27.3',
    date: '2026-06-16',
    features: [
      'AI 智能生成小说作为导入第一步：填写提示词后自动跳转版权声明',
      '步骤导航重新编排：AI生成 → 本地上传 → 搜索导入 → 版权声明',
      'AI生成内容自动设置版权类型，导入流程完全闭环'
    ]
  },
  {
    version: '1.27.2',
    date: '2026-06-16',
    features: [
      '修复小说导入弹窗关闭按钮无法点击的问题',
      '增强弹窗交互体验，优化点击区域和样式'
    ]
  },
  {
    version: '1.27.0',
    date: '2026-06-16',
    features: [
      'AI 智能生成小说功能：支持 8 种类型、12 个发表平台',
      '详细设定工具箱：视角、文风模式、年代背景、题材分类',
      '随机示例功能：点击填充完整模板'
    ]
  },
  {
    version: '1.26.0',
    date: '2026-06-16',
    features: [
      '功能中心黑屏问题修复：确保所有功能页面正常渲染',
      '版本号统一更新机制优化'
    ]
  },
  {
    version: '1.25.0',
    date: '2026-06-16',
    features: [
      '功能中心页面重构：整合所有次要功能入口到统一页面',
      '多端同步升级：GitHub 云端存储用户数据',
      'AI API 配置扩展：新增多个国内可访问的 AI API 平台',
      '短剧推广达人中心扩展：新增更多短剧推广平台'
    ]
  },
  {
    version: '1.7.0',
    date: '2026-06-08',
    features: [
      '修复注册逻辑',
      '添加数据库管理功能',
      '优化响应式图标'
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

export function VersionHistory() {
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
