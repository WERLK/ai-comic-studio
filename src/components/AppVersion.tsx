import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

// 从 package.json 读取的版本号
const APP_VERSION = '1.11.3';

const VERSION_HISTORY = [
  {
    version: '1.11.3',
    date: '2026-06-10',
    features: [
      '修复注册/登录功能，database.ts 统一管理用户数据',
      'registerUser/loginUser 新增完整API',
      'authStore 优先后端API，失败回退本地database'
    ]
  },
  {
    version: '1.11.2',
    date: '2026-06-10',
    features: [
      '帮助页面新增AI平台导航板块',
      '7个已对接平台官网直达链接+获取API Key链接',
      '推荐平台标注+新手推荐提示',
      'FAQ新增「如何获取AI平台API Key」条目',
      '优化部分FAQ内容（VIP、数据保存等）'
    ]
  },
  {
    version: '1.11.1',
    date: '2026-06-10',
    features: [
      '对接百度千帆AI服务平台',
      '后端支持百度千帆OAuth 2.0鉴权（access_token自动获取和缓存）',
      '剧本分析支持ERNIE-4.0/ERNIE-3.5模型',
      '前端API配置已支持百度千帆（API Key + Secret Key）',
      '百度千帆调用优先级：硅基流动→智谱→阿里云→百度千帆'
    ]
  },
  {
    version: '1.11.0',
    date: '2026-06-10',
    features: [
      'AI智能创作服务后端化',
      'server/services/aiService.ts 真实AI API调用',
      '支持硅基流动/智谱/阿里云百炼等真实大模型',
      '剧本分析调用DeepSeek/GLM/Qwen真实模型',
      '图像生成调用FLUX/通义万相真实文生图',
      '语音合成调用CosyVoice真实TTS',
      '创作任务队列管理（pending/processing/completed/failed）',
      '前端优先调用后端API，失败自动回退本地'
    ]
  },
  {
    version: '1.10.1',
    date: '2026-06-10',
    features: [
      '会员权限真正生效',
      'Studio分镜数根据会员等级限制（5-100格）',
      'Preview导出分辨率根据会员等级锁定（720p-4K）',
      '积分任务自动应用VIP倍数（x1.2-x3）',
      '积分中心显示当前VIP倍数',
      '非会员看到升级提示和锁定标识'
    ]
  },
  {
    version: '1.10.0',
    date: '2026-06-10',
    features: [
      '完整会员系统上线',
      '5级会员体系：青铜/白银/黄金/铂金/钻石',
      '会员积分与普通积分双轨制',
      '会员中心页面：权益/升级/积分获取',
      '个人中心新增会员入口',
      '任务积分倍数、每日额外积分等权益'
    ]
  },
  {
    version: '1.9.0',
    date: '2026-06-10',
    features: [
      'UI全面重新设计',
      '底部Tab导航：创作/积分/API/我的',
      'API密钥配置提升为一级入口',
      '顶部栏简化，更清爽',
      '个人中心菜单精简优化',
      '全屏页面自动隐藏底部导航'
    ]
  },
  {
    version: '1.8.2',
    date: '2026-06-10',
    features: [
      '个人中心菜单导航全部可用（设置/通知/成就/隐私/帮助）',
      'API配置平台名称可点击跳转官网',
      '添加B站视频推荐的5个免费AI聚合网关',
      'RelayFreeLLM / FreeLLMAPI / OpenRouter / One-API / New-API',
      '修复Profile.tsx缺失handleComingSoon函数'
    ]
  },
  {
    version: '1.8.1',
    date: '2026-06-09',
    features: [
      '任务系统全面重写',
      '成就/社交/创作/探索/特殊/会员/等级任务逻辑修复',
      '真实行为驱动任务进度',
      '任务领取状态区分（可领取/进行中/已领取/需VIP）',
      '视觉优化：可领取任务高亮闪烁'
    ]
  },
  {
    version: '1.8.0',
    date: '2026-06-09',
    features: [
      '真实短剧生成引擎',
      '角色智能识别角色和场景',
      '故事板视图展示角色/场景/分镜',
      '三视图：故事板/漫画视图/视频预览',
      '配音同步播放'
    ]
  },
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
