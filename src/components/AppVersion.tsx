import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { APP_VERSION } from '@/config/version';

const VERSION_HISTORY = [
  {
    version: '1.25.0',
    date: '2026-06-16',
    features: [
      '功能中心页面重构：整合所有次要功能入口到统一页面',
      '多端同步升级：GitHub 云端存储用户数据，真实同步不是导出导入',
      'AI API 配置扩展：新增多个国内可访问的 AI API 平台',
      '短剧推广达人中心扩展：新增更多短剧推广平台和发布流程',
      '简化首页顶部导航：移除拥挤元素，提升用户体验',
      '版本号更新机制优化'
    ]
  },
  {
    version: '1.16.0',
    date: '2026-06-15',
    features: [
      '版本号动态更新：从 package.json 自动读取，不再写死',
      'Vite 构建时自动注入 __APP_VERSION__ 和 __BUILD_TIME__ 全局变量',
      '时间动态显示功能恢复：实时时钟显示日期、星期和时间',
      'UI界面重构：移除赛博朋克风格，采用简洁现代设计',
      '响应式适配增强：支持电脑端、平板端、移动端',
      '浏览器兼容：支持小米/华为/OPPO/vivo厂商浏览器、百度浏览器、夸克浏览器'
    ]
  },
  {
    version: '1.15.0',
    date: '2026-06-15',
    features: [
      '新增「小说平台推广达人中心」：汇集 15+ 正版小说发布平台',
      '支持平台搜索、分类筛选（男频/女频/综合/玄幻/都市/言情等）',
      '每个平台包含：简介、支持平台、分成比例、适合人群、特色功能',
      '一键复制平台链接 + 快速访问各平台达人中心入口',
      '顶部导航栏新增「小说推广中心」快捷入口按钮',
      '平台详情弹窗：完整信息展示 + 入驻建议 + 联系方式'
    ]
  },
  {
    version: '1.14.0',
    date: '2026-06-15',
    features: [
      '新增小说导入功能：支持本地上传（txt/md/docx/epub）+ 追书平台搜索',
      '向导内置版权声明步骤：4 种版权类型选择 + 法律风险提示',
      '支持搜索公版书目（西游记/红楼梦/水浒传/三国演义等）',
      '追书平台章节预览 + 多章节批量选择导入',
      'AI 辅助创作向导升级为 7 步流程：类型→导入小说→基本信息→角色→API→大纲→剧本',
      '版权免责提示：所有导入渠道均要求用户确认版权类型'
    ]
  },
  {
    version: '1.13.0',
    date: '2026-06-15',
    features: [
      '新增「AI 辅助创作」剧本向导：剧本类型选择 + 角色创建 + 剧情大纲生成',
      '向导中内置 API 平台快捷配置（硅基流动/智谱/阿里云/火山等7个平台）',
      '配置 API 后 AI 自动生成个性化剧情大纲和完整剧本',
      'API 配置页新增调用量 / 限额可视化进度条（本月数据统计）',
      'API Key 输入即时保存（秒级响应，无需手动点击保存）',
      '退出登录 / 注销账号强制返回首页',
      '用户账号数据云端同步（登录/注册/积分变更时自动上传）',
      '新增自动登录功能（打开应用自动恢复会话）'
    ]
  },
  {
    version: '1.11.9',
    date: '2026-06-15',
    features: [
      '新增微信浏览器强制刷新机制（HTML层面版本检测）',
      '修复 index.html title 版本号写死问题',
      '当检测到新版本时自动清除缓存并重载页面'
    ]
  },
  {
    version: '1.11.8',
    date: '2026-06-14',
    features: [
      '统一版本号来源：改为从 src/config/version.ts 读取 package.json 的 version 字段',
      'main.tsx / AppVersion.tsx / VersionHistory.tsx 三处都使用同一个 APP_VERSION 常量',
      '彻底消除版本号写死字符串导致"永远显示旧版本"的问题'
    ]
  },
  {
    version: '1.11.7',
    date: '2026-06-10',
    features: [
      '版本号改为从 package.json 通过 Vite define 自动注入，不再手写死字符串',
      '确保每次更新 package.json 后页面自动同步显示最新版本',
      '补齐 1.11.4 / 1.11.5 / 1.11.6 的版本历史记录'
    ]
  },
  {
    version: '1.11.6',
    date: '2026-06-10',
    features: [
      '增强所有文件上传的 accept 属性（新增 text/*/application/* 等通配）',
      'JSON 导入显式 UTF-8 编码并去除 BOM（兼容 Android 某些应用导出的文件）',
      '文件上传处理改为"文件名 + MIME 双重判断"，避免 Android 空 type 导致无法解析'
    ]
  },
  {
    version: '1.11.5',
    date: '2026-06-10',
    features: [
      '修复剧本文件上传在 Android 设备上无法显示的问题',
      '文件选择 accept 属性扩展到常见文本格式与 MIME 通配符',
      '用户数据 JSON 导入增强：UTF-8 编码显式声明，BOM 头自动去除'
    ]
  },
  {
    version: '1.11.4',
    date: '2026-06-10',
    features: [
      '修复用户退出后重新登录密码错误的问题',
      'database.ts 密码校验兼容明文/哈希双模式并自动迁移',
      'authStore checkApi 严格校验 Content-Type，避免 GitHub Pages 静态 fallback 误判'
    ]
  },
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
