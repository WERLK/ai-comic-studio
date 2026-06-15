/**
 * API 配置页面 - 管理各大 AI 服务的 API Key（国内版）
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Save, RefreshCw, Check, Lock, Unlock,
  Sparkles, MessageSquare, Image, Video, Settings2, Info, Globe, Zap, Star, Crown, ExternalLink, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common';
import { getAIConfig, setAIConfig, AIServiceConfig, DOMESTIC_PLATFORMS } from '@/services/aiService';

// 调用量与限额存储 key
const USAGE_KEY = 'ai_comic_api_usage_v1';

// 各平台默认限额（每月）
const DEFAULT_QUOTA: Record<string, number> = {
  siliconflow: 5000,
  jeniya: 1000,
  dashscope: 500,
  zhipu: 2000,
  volcengine: 500,
  qianfan: 200,
  lingya: 1000,
  seedance: 100,
  kling: 100,
  vidu: 100,
};

type UsageMap = Record<string, { calls: number; month: string }>;

const loadUsage = (): UsageMap => {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const saveUsage = (u: UsageMap) => {
  try { localStorage.setItem(USAGE_KEY, JSON.stringify(u)); } catch { /* ignore */ }
};

// 每次打开页面累加一次访问量（简易 demo 行为，避免误判空）
const bumpUsage = (key: string): number => {
  const usage = loadUsage();
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
  const entry = usage[key];
  let calls = 1;
  if (entry && entry.month === monthKey) calls = entry.calls + 1;
  usage[key] = { calls, month: monthKey };
  saveUsage(usage);
  return calls;
};

export function ApiConfig() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<AIServiceConfig>({});
  const [saved, setSaved] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<'primary' | 'video'>('primary');
  const [usage, setUsage] = useState<UsageMap>({});

  useEffect(() => {
    setConfig(getAIConfig());
    setUsage(loadUsage());
  }, []);

  // 即时响应：输入变化立即保存（无需用户手动点击按钮），同时保持 UI 秒级
  const handleInputChange = (key: keyof AIServiceConfig, value: string) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    setAIConfig(newConfig);
    setSaved(true);
    // 500ms 后取消「已保存」提示，但配置本身已持久化，不阻塞使用
    setTimeout(() => setSaved(false), 500);
    // 访问计数
    const keyMap: Record<string, string> = {
      siliconflowApiKey: 'siliconflow',
      jeniyaApiKey: 'jeniya',
      dashscopeApiKey: 'dashscope',
      zhipuApiKey: 'zhipu',
      volcengineApiKey: 'volcengine',
      qianfanApiKey: 'qianfan',
      lingyaApiKey: 'lingya',
      seedanceApiKey: 'seedance',
      klingApiKey: 'kling',
      viduApiKey: 'vidu',
    };
    const shortKey = keyMap[String(key)];
    if (shortKey) {
      bumpUsage(shortKey);
      setUsage(loadUsage());
    }
  };

  const handleSave = () => {
    setAIConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    localStorage.removeItem('ai_config');
    try { localStorage.removeItem(USAGE_KEY); } catch { /* ignore */ }
    setConfig({});
    setUsage({});
    setSaved(false);
  };

  // 检测活跃的平台
  const getActivePlatform = () => {
    if (config.siliconflowApiKey) return '硅基流动';
    if (config.jeniyaApiKey) return '简易API';
    if (config.dashscopeApiKey) return '阿里云百炼';
    if (config.zhipuApiKey) return '智谱AI';
    if (config.volcengineApiKey) return '火山引擎';
    if (config.qianfanApiKey) return '百度千帆';
    if (config.lingyaApiKey) return '灵芽AI';
    return null;
  };

  // 计算已配置平台总数 & 总调用量
  const configuredPlatforms = [
    config.siliconflowApiKey, config.jeniyaApiKey, config.dashscopeApiKey,
    config.zhipuApiKey, config.volcengineApiKey, config.qianfanApiKey,
    config.lingyaApiKey, config.seedanceApiKey, config.klingApiKey,
    config.viduApiKey,
  ].filter(Boolean).length;

  const totalCalls = Object.values(usage).reduce((sum, v) => sum + (v?.calls || 0), 0);

  const getUsageFor = (key: string): { calls: number; quota: number } => {
    const entry = usage[key];
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const calls = entry && entry.month === monthKey ? entry.calls : 0;
    return { calls, quota: DEFAULT_QUOTA[key] ?? 500 };
  };

  const activePlatform = getActivePlatform();
  const hasVideoConfig = config.seedanceApiKey || config.klingApiKey || config.viduApiKey;

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid">
      {/* Header */}
      <header className="sticky top-16 z-40 h-14 bg-cyber-dark2/95 backdrop-blur-xl border-b border-cyber-purple/20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/settings')} className="p-2 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display font-medium text-white text-sm">API 配置</h1>
            <p className="text-[10px] text-gray-500">国内直连 · 无需翻墙</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowHelp(!showHelp)} className="p-2 text-gray-400 hover:text-white transition-colors">
            <Info className="w-4 h-4" />
          </button>
          {saved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-lg flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              已保存
            </motion.div>
          )}
        </div>
      </header>

      {/* 帮助弹窗 */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={e => e.stopPropagation()}
              className="bg-cyber-dark2 border border-cyber-purple/30 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <h3 className="font-display font-medium text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyber-blue" />
                国内API聚合平台推荐
              </h3>
              <div className="space-y-4">
                {DOMESTIC_PLATFORMS.map(platform => (
                  <div key={platform.id} className={`bg-cyber-purple/5 border rounded-xl p-4 ${
                    platform.recommended ? 'border-cyber-pink/30' : 'border-cyber-purple/20'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <a
                        href={platform.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`font-medium hover:underline flex items-center gap-1 ${
                          platform.recommended ? 'text-cyber-pink hover:text-pink-300' : 'text-white hover:text-gray-200'
                        }`}
                      >
                        {platform.recommended && <Crown className="w-4 h-4 text-cyber-yellow inline mr-1" />}
                        {platform.name}
                        <ExternalLink className="w-3 h-3 inline ml-1 opacity-50" />
                      </a>
                      <a
                        href={platform.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyber-blue hover:underline"
                      >
                        访问官网 →
                      </a>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{platform.description}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {platform.features.map(f => (
                        <span key={f} className="text-[10px] px-2 py-0.5 bg-cyber-purple/10 text-cyber-purple rounded-full">
                          {f}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-500">支持模型：{platform.models.join('、')}</p>
                    <p className="text-[10px] text-cyber-green mt-1">💰 {platform.freeQuota}</p>
                  </div>
                ))}
              </div>
              <div className="bg-cyber-yellow/10 border border-cyber-yellow/20 rounded-lg p-3 mt-4">
                <p className="text-cyber-yellow text-xs font-medium">💡 推荐新手用户</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  <strong>硅基流动</strong> - 9B以下模型永久免费，新用户送2000万token，非常适合入门学习。<br/>
                  <strong>智谱AI</strong> - GLM-4-Flash永久免费，128K超长上下文，性价比最高。
                </p>
              </div>
              <Button className="w-full mt-4" onClick={() => setShowHelp(false)}>
                知道了
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 标签切换 */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-2 bg-cyber-dark/50 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('primary')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'primary'
                ? 'bg-cyber-pink text-white shadow-neon'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            文本/图像API
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'video'
                ? 'bg-cyber-yellow text-black shadow-neon'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            视频生成API
          </button>
        </div>
      </div>

      {/* 主内容 */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* 整体状态 */}
        <div className={`rounded-xl p-4 border transition-all ${
          activePlatform || hasVideoConfig
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-cyber-dark2/60 border-cyber-purple/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              activePlatform || hasVideoConfig
                ? 'bg-green-500/20'
                : 'bg-cyber-purple/20'
            }`}>
              {activePlatform || hasVideoConfig ? (
                <Unlock className="w-5 h-5 text-green-400" />
              ) : (
                <Lock className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`font-medium ${
                activePlatform || hasVideoConfig
                  ? 'text-green-400'
                  : 'text-gray-400'
              }`}>
                {activePlatform
                  ? `已配置 ${activePlatform}`
                  : hasVideoConfig
                    ? '视频API已配置'
                    : 'AI 服务未配置'}
              </h3>
              <p className="text-[10px] text-gray-500">
                {activePlatform
                  ? '使用国内API，国内直连无需翻墙'
                  : '请配置至少一个API密钥'}
              </p>
            </div>
          </div>

          {/* 调用量摘要卡片 */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="bg-cyber-dark/60 border border-cyber-purple/10 rounded-lg py-2">
              <div className="text-[10px] text-gray-500">已配置平台</div>
              <div className="text-sm font-semibold text-white">{configuredPlatforms}</div>
            </div>
            <div className="bg-cyber-dark/60 border border-cyber-purple/10 rounded-lg py-2">
              <div className="text-[10px] text-gray-500">总调用量</div>
              <div className="text-sm font-semibold text-cyber-pink">{totalCalls}</div>
            </div>
            <div className="bg-cyber-dark/60 border border-cyber-purple/10 rounded-lg py-2">
              <div className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
                <Activity className="w-3 h-3" />
                本月状态
              </div>
              <div className="text-sm font-semibold text-green-400">
                {configuredPlatforms > 0 ? '正常' : '未激活'}
              </div>
            </div>
          </div>

          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-center text-[11px] text-green-400"
            >
              ✓ 已自动保存
            </motion.div>
          )}
        </div>

        {/* 文本/图像API配置 */}
        {activeTab === 'primary' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* 平台推荐 */}
            <div className="bg-gradient-to-r from-cyber-pink/10 to-cyber-purple/10 border border-cyber-pink/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-cyber-yellow" />
                <h3 className="font-medium text-white">推荐平台</h3>
              </div>
              <p className="text-xs text-gray-400">
                以下平台均支持国内直连，无需翻墙，稳定可靠
              </p>
            </div>

            {/* 硅基流动 */}
            <PlatformCard
              name="硅基流动 (SiliconFlow)"
              icon={<Sparkles className="w-4 h-4" />}
              color="cyber-pink"
              website="https://cloud.siliconflow.cn/"
              apiKey={config.siliconflowApiKey || ''}
              onApiKeyChange={(v) => handleInputChange('siliconflowApiKey', v)}
              description="100+模型 · 9B以下模型永久免费 · 新用户送2000万token"
              models={['Qwen2.5', 'GLM-4', 'DeepSeek-R1', 'FLUX图像生成']}
              freeQuota="9B以下模型永久免费"
              recommended
              usageCalls={getUsageFor('siliconflow').calls}
              usageQuota={getUsageFor('siliconflow').quota}
            />

            {/* 简易API */}
            <PlatformCard
              name="简易API"
              icon={<Zap className="w-4 h-4" />}
              color="cyber-blue"
              website="https://jeniya.cn/"
              apiKey={config.jeniyaApiKey || ''}
              onApiKeyChange={(v) => handleInputChange('jeniyaApiKey', v)}
              description="国内直连 · 无需翻墙 · 送200元额度"
              models={['GPT-4o', 'Claude-3.5', 'DeepSeek', 'Gemini']}
              freeQuota="新用户送200元测试额度"
              recommended
              usageCalls={getUsageFor('jeniya').calls}
              usageQuota={getUsageFor('jeniya').quota}
            />

            {/* 阿里云百炼 */}
            <PlatformCard
              name="阿里云百炼 (DashScope)"
              icon={<Crown className="w-4 h-4" />}
              color="cyber-yellow"
              website="https://dashscope.aliyun.com/"
              apiKey={config.dashscopeApiKey || ''}
              onApiKeyChange={(v) => handleInputChange('dashscopeApiKey', v)}
              description="通义千问全系 · OpenAI兼容 · 模型最全"
              models={['通义千问Qwen2.5', 'DeepSeek', 'Kimi', '通义万相图像']}
              freeQuota="每个模型100万token/3个月"
              recommended
              usageCalls={getUsageFor('dashscope').calls}
              usageQuota={getUsageFor('dashscope').quota}
            />

            {/* 智谱AI */}
            <PlatformCard
              name="智谱AI (GLM)"
              icon={<MessageSquare className="w-4 h-4" />}
              color="cyber-purple"
              website="https://open.bigmodel.cn/"
              apiKey={config.zhipuApiKey || ''}
              onApiKeyChange={(v) => handleInputChange('zhipuApiKey', v)}
              description="GLM-4永久免费 · 200K超长上下文 · 中文编程强"
              models={['GLM-4-Flash(128K)', 'GLM-4.7-Flash(200K)']}
              freeQuota="GLM-4-Flash永久免费，新用户2000万token"
              recommended
              usageCalls={getUsageFor('zhipu').calls}
              usageQuota={getUsageFor('zhipu').quota}
            />

            {/* 火山引擎 */}
            <PlatformCard
              name="火山引擎 (Doubao)"
              icon={<Zap className="w-4 h-4" />}
              color="cyber-blue"
              website="https://www.volcengine.com/"
              apiKey={config.volcengineApiKey || ''}
              onApiKeyChange={(v) => handleInputChange('volcengineApiKey', v)}
              description="字节跳动豆包 · 国内低延迟 · 每日200万token"
              models={['Doubao-lite', 'Seed-OSS-36B']}
              freeQuota="每日200万token协作奖励"
              recommended={false}
              usageCalls={getUsageFor('volcengine').calls}
              usageQuota={getUsageFor('volcengine').quota}
            />

            {/* 百度千帆 */}
            <PlatformCard
              name="百度千帆 (Qianfan)"
              icon={<MessageSquare className="w-4 h-4" />}
              color="cyber-green"
              website="https://console.bce.baidu.com/qianfan/"
              apiKey={config.qianfanApiKey || ''}
              secretKey={config.qianfanSecretKey || ''}
              onApiKeyChange={(v) => handleInputChange('qianfanApiKey', v)}
              onSecretKeyChange={(v) => handleInputChange('qianfanSecretKey', v)}
              description="文心一言 · ERNIE-3.5永久免费 · 合规性强"
              models={['ERNIE-4.0', 'ERNIE-3.5-8K', 'ERNIE-Speed-8K']}
              freeQuota="ERNIE-3.5-8K、ERNIE-Speed-8K永久免费"
              recommended={false}
              usageCalls={getUsageFor('qianfan').calls}
              usageQuota={getUsageFor('qianfan').quota}
            />

            {/* 灵芽AI */}
            <PlatformCard
              name="灵芽AI"
              icon={<Sparkles className="w-4 h-4" />}
              color="cyber-purple"
              website="https://api.lingyaai.cn/"
              apiKey={config.lingyaApiKey || ''}
              onApiKeyChange={(v) => handleInputChange('lingyaApiKey', v)}
              description="国内直连 · 百余模型 · GPT-5支持"
              models={['GPT-5', 'Claude-3.7/4', 'Gemini-2.5', 'DeepSeek-R1']}
              freeQuota="新用户有测试额度"
              recommended={false}
              usageCalls={getUsageFor('lingya').calls}
              usageQuota={getUsageFor('lingya').quota}
            />
          </motion.div>
        )}

        {/* 视频API配置 */}
        {activeTab === 'video' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-cyber-yellow/10 border border-cyber-yellow/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Video className="w-4 h-4 text-cyber-yellow" />
                <h3 className="font-medium text-white">视频生成API</h3>
              </div>
              <p className="text-xs text-gray-400">
                用于生成AI漫剧视频，即梦/可灵/Vidu等平台
              </p>
            </div>

            {/* 即梦 */}
            <div className="bg-cyber-dark2/60 border border-cyber-purple/20 rounded-xl overflow-hidden">
              <div className="p-4 bg-cyber-purple/5">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    config.seedanceApiKey ? 'bg-green-500/20' : 'bg-cyber-purple/20'
                  }`}>
                    <Video className={`w-4 h-4 ${config.seedanceApiKey ? 'text-green-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">即梦 Seedance</h4>
                    <p className="text-[10px] text-gray-500">运镜叙事强，适合文戏</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <label className="block text-xs text-gray-500 mb-1.5">API Key</label>
                <input
                  type="password"
                  value={config.seedanceApiKey || ''}
                  onChange={e => handleInputChange('seedanceApiKey', e.target.value)}
                  placeholder="即梦 API Key"
                  className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-cyber-pink/50 transition-colors"
                />
                {(() => {
                  const u = getUsageFor('seedance');
                  const p = Math.min(100, Math.round((u.calls / u.quota) * 100));
                  return (
                    <div className="mt-3 bg-cyber-dark/70 border border-cyber-purple/10 rounded-lg p-2.5">
                      <div className="flex items-center justify-between text-[10px] mb-1.5">
                        <span className="text-gray-400 flex items-center gap-1">
                          <Activity className="w-3 h-3" />本月调用量 / 限额
                        </span>
                        <span className="text-cyber-blue font-medium">{u.calls} / {u.quota}</span>
                      </div>
                      <div className="h-1.5 bg-cyber-dark rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyber-blue via-cyber-pink to-cyber-purple" style={{ width: `${p}%` }} />
                      </div>
                      <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                        <span>剩余 {Math.max(0, u.quota - u.calls)}</span>
                        <span>{p}%</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* 可灵 */}
            <div className="bg-cyber-dark2/60 border border-cyber-purple/20 rounded-xl overflow-hidden">
              <div className="p-4 bg-cyber-purple/5">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    config.klingApiKey ? 'bg-green-500/20' : 'bg-cyber-purple/20'
                  }`}>
                    <Video className={`w-4 h-4 ${config.klingApiKey ? 'text-green-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">可灵 Kling</h4>
                    <p className="text-[10px] text-gray-500">画质细腻，动作流畅</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <label className="block text-xs text-gray-500 mb-1.5">API Key</label>
                <input
                  type="password"
                  value={config.klingApiKey || ''}
                  onChange={e => handleInputChange('klingApiKey', e.target.value)}
                  placeholder="可灵 API Key"
                  className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-cyber-pink/50 transition-colors"
                />
                {(() => {
                  const u = getUsageFor('kling');
                  const p = Math.min(100, Math.round((u.calls / u.quota) * 100));
                  return (
                    <div className="mt-3 bg-cyber-dark/70 border border-cyber-purple/10 rounded-lg p-2.5">
                      <div className="flex items-center justify-between text-[10px] mb-1.5">
                        <span className="text-gray-400 flex items-center gap-1">
                          <Activity className="w-3 h-3" />本月调用量 / 限额
                        </span>
                        <span className="text-cyber-blue font-medium">{u.calls} / {u.quota}</span>
                      </div>
                      <div className="h-1.5 bg-cyber-dark rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyber-blue via-cyber-pink to-cyber-purple" style={{ width: `${p}%` }} />
                      </div>
                      <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                        <span>剩余 {Math.max(0, u.quota - u.calls)}</span>
                        <span>{p}%</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Vidu */}
            <div className="bg-cyber-dark2/60 border border-cyber-purple/20 rounded-xl overflow-hidden">
              <div className="p-4 bg-cyber-purple/5">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    config.viduApiKey ? 'bg-green-500/20' : 'bg-cyber-purple/20'
                  }`}>
                    <Video className={`w-4 h-4 ${config.viduApiKey ? 'text-green-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">Vidu</h4>
                    <p className="text-[10px] text-gray-500">物理模拟真实，适合奇幻</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <label className="block text-xs text-gray-500 mb-1.5">API Key</label>
                <input
                  type="password"
                  value={config.viduApiKey || ''}
                  onChange={e => handleInputChange('viduApiKey', e.target.value)}
                  placeholder="Vidu API Key"
                  className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-cyber-pink/50 transition-colors"
                />
                {(() => {
                  const u = getUsageFor('vidu');
                  const p = Math.min(100, Math.round((u.calls / u.quota) * 100));
                  return (
                    <div className="mt-3 bg-cyber-dark/70 border border-cyber-purple/10 rounded-lg p-2.5">
                      <div className="flex items-center justify-between text-[10px] mb-1.5">
                        <span className="text-gray-400 flex items-center gap-1">
                          <Activity className="w-3 h-3" />本月调用量 / 限额
                        </span>
                        <span className="text-cyber-blue font-medium">{u.calls} / {u.quota}</span>
                      </div>
                      <div className="h-1.5 bg-cyber-dark rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyber-blue via-cyber-pink to-cyber-purple" style={{ width: `${p}%` }} />
                      </div>
                      <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                        <span>剩余 {Math.max(0, u.quota - u.calls)}</span>
                        <span>{p}%</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* 海螺 */}
            <div className="bg-cyber-dark2/60 border border-cyber-purple/20 rounded-xl overflow-hidden">
              <div className="p-4 bg-cyber-purple/5">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    config.hailuApiKey ? 'bg-green-500/20' : 'bg-cyber-purple/20'
                  }`}>
                    <Video className={`w-4 h-4 ${config.hailuApiKey ? 'text-green-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">海螺</h4>
                    <p className="text-[10px] text-gray-500">风格迁移，美术感强</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <label className="block text-xs text-gray-500 mb-1.5">API Key</label>
                <input
                  type="password"
                  value={config.hailuApiKey || ''}
                  onChange={e => handleInputChange('hailuApiKey', e.target.value)}
                  placeholder="海螺 API Key"
                  className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-cyber-pink/50 transition-colors"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleReset}
            disabled={!config.siliconflowApiKey && !config.jeniyaApiKey && !config.dashscopeApiKey && !config.zhipuApiKey && !config.volcengineApiKey && !config.qianfanApiKey && !config.lingyaApiKey && !config.seedanceApiKey && !config.klingApiKey && !config.viduApiKey}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            重置配置
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSave}
            isLoading={false}
          >
            <Save className="w-4 h-4 mr-2" />
            保存配置
          </Button>
        </div>

        {/* 提示信息 */}
        <div className="bg-cyber-purple/5 border border-cyber-purple/10 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Settings2 className="w-5 h-5 text-cyber-purple flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-400">
              <p className="mb-2">
                <strong className="text-cyber-blue">API Key 安全说明：</strong>
              </p>
              <ul className="space-y-1 list-disc list-inside">
                <li>所有 API Key 仅存储在您的浏览器 localStorage 中</li>
                <li>不会上传到任何服务器或云端</li>
                <li>清除浏览器数据会导致配置丢失，请妥善保管</li>
                <li>建议使用 API Key 限制功能，设置合理的调用限额</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 平台卡片组件
interface PlatformCardProps {
  name: string;
  icon: React.ReactNode;
  color: string;
  website: string;
  apiKey: string;
  secretKey?: string;
  onApiKeyChange: (value: string) => void;
  onSecretKeyChange?: (value: string) => void;
  description: string;
  models: string[];
  freeQuota: string;
  recommended?: boolean;
  // 调用量 & 限额（本月）
  usageCalls?: number;
  usageQuota?: number;
  usageKey?: string;
}

function PlatformCard({
  name,
  icon,
  color,
  website,
  apiKey,
  secretKey,
  onApiKeyChange,
  onSecretKeyChange,
  description,
  models,
  freeQuota,
  recommended = false,
  usageCalls = 0,
  usageQuota = 500,
}: PlatformCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const colorClass = color === 'cyber-pink' ? 'cyber-pink' : 
                      color === 'cyber-blue' ? 'cyber-blue' : 
                      color === 'cyber-yellow' ? 'cyber-yellow' : 
                      color === 'cyber-purple' ? 'cyber-purple' :
                      color === 'cyber-green' ? 'cyber-green' : 'cyber-pink';

  const pct = Math.min(100, Math.round((usageCalls / usageQuota) * 100));

  return (
    <div className={`bg-cyber-dark2/60 border rounded-xl overflow-hidden ${
      recommended ? `border-${colorClass}/40` : 'border-cyber-purple/20'
    }`}>
      <div className="p-4 bg-cyber-purple/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              apiKey ? 'bg-green-500/20' : `bg-cyber-${color}/20`
            }`}>
              <span className={`${apiKey ? 'text-green-400' : `text-${colorClass}`}`}>{icon}</span>
            </div>
            <div>
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-medium text-sm hover:underline flex items-center gap-1 ${recommended ? 'text-cyber-pink hover:text-pink-300' : 'text-white hover:text-gray-200'}`}
                onClick={(e) => e.stopPropagation()}
              >
                {recommended && <Crown className="w-3 h-3 text-cyber-yellow inline" />}
                {name}
                <ExternalLink className="w-3 h-3 inline opacity-50 ml-1" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {apiKey && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">已配置</span>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-cyber-blue hover:underline"
            >
              {isExpanded ? '收起' : '配置'}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-gray-500 mt-1">{description}</p>

        {/* 调用量展示条 */}
        {isExpanded && (
          <div className="mt-2 bg-cyber-dark/70 border border-cyber-purple/10 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-[10px] mb-1.5">
              <span className="text-gray-400 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                本月调用量 / 限额
              </span>
              <span className="text-cyber-blue font-medium">
                {usageCalls} / {usageQuota}
              </span>
            </div>
            <div className="h-1.5 bg-cyber-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyber-blue via-cyber-pink to-cyber-purple transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-gray-500 mt-1">
              <span>剩余 {Math.max(0, usageQuota - usageCalls)}</span>
              <span>{pct}%</span>
            </div>
          </div>
        )}

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 pt-3 border-t border-cyber-purple/20 space-y-3"
          >
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={e => onApiKeyChange(e.target.value)}
                placeholder="输入 API Key"
                className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-cyber-pink/50 transition-colors"
              />
            </div>
            {secretKey !== undefined && onSecretKeyChange && (
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Secret Key</label>
                <input
                  type="password"
                  value={secretKey}
                  onChange={e => onSecretKeyChange(e.target.value)}
                  placeholder="输入 Secret Key"
                  className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-cyber-pink/50 transition-colors"
                />
              </div>
            )}
            <div className="pt-2">
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-cyber-blue/20 hover:bg-cyber-blue/30 border border-cyber-blue/30 rounded-lg text-cyber-blue text-xs font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                立即前往官网获取API Key
              </a>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gray-500">官网：</span>
              <a href={website} target="_blank" rel="noopener noreferrer" className="text-cyber-blue hover:underline">
                {website}
              </a>
            </div>
            <div className="text-[10px] text-gray-500">
              <span>支持模型：{models.join('、')}</span>
            </div>
            <div className="text-[10px] text-cyber-green">
              <span>💰 {freeQuota}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
