/**
 * API 配置页面 - 管理各大 AI 服务的 API Key
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Save, RefreshCw, Check, Lock, Unlock,
  Sparkles, MessageSquare, Image, Video, Settings2, Info, Globe, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common';
import { getAIConfig, setAIConfig, AIServiceConfig, AGGREGATOR_PLATFORMS } from '@/services/aiService';

export function ApiConfig() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<AIServiceConfig>({});
  const [saved, setSaved] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<'aggregator' | 'official' | 'video'>('aggregator');

  useEffect(() => {
    setConfig(getAIConfig());
  }, []);

  const handleInputChange = (key: keyof AIServiceConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setAIConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    localStorage.removeItem('ai_config');
    setConfig({});
    setSaved(false);
  };

  // 检测活跃的聚合平台
  const getActiveAggregator = () => {
    if (config.cometApiKey) return 'CometAPI';
    if (config.poloApiKey) return 'PoloAPI';
    if (config.dmxApiKey) return 'DMXAPI';
    if (config.jeniyaApiKey) return '简易API';
    if (config.openrouterApiKey) return 'OpenRouter';
    return null;
  };

  const activeAggregator = getActiveAggregator();
  const hasOfficialConfig = config.openaiApiKey || (config.baiduApiKey && config.baiduSecretKey);
  const hasVideoConfig = config.seedanceApiKey || config.klingApiKey || config.viduApiKey;

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid">
      {/* Header */}
      <header className="sticky top-0 z-50 h-14 bg-cyber-dark2/95 backdrop-blur-xl border-b border-cyber-purple/20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/settings')} className="p-2 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display font-medium text-white text-sm">API 配置</h1>
            <p className="text-[10px] text-gray-500">管理 AI 服务密钥</p>
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
                API 聚合平台推荐
              </h3>
              <div className="space-y-4">
                {AGGREGATOR_PLATFORMS.map(platform => (
                  <div key={platform.id} className="bg-cyber-purple/5 border border-cyber-purple/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-cyber-pink">{platform.name}</h4>
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
                    <p className="text-[10px] text-cyber-yellow mt-1">💰 {platform.pricing}</p>
                  </div>
                ))}
              </div>
              <div className="bg-cyber-yellow/10 border border-cyber-yellow/20 rounded-lg p-3 mt-4">
                <p className="text-cyber-yellow text-xs font-medium">💡 推荐国内用户</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  DMXAPI 和简易API 支持人民币充值，国内直连无需翻墙，适合国内开发者使用。
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
          {[
            { key: 'aggregator', label: '聚合平台', icon: Zap, color: 'cyber-pink' },
            { key: 'official', label: '官方API', icon: MessageSquare, color: 'cyber-blue' },
            { key: 'video', label: '视频API', icon: Video, color: 'cyber-yellow' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-cyber-pink text-white shadow-neon'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 主内容 */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* 整体状态 */}
        <div className={`rounded-xl p-4 border transition-all ${
          activeAggregator || hasOfficialConfig || hasVideoConfig
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-cyber-dark2/60 border-cyber-purple/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              activeAggregator || hasOfficialConfig || hasVideoConfig
                ? 'bg-green-500/20'
                : 'bg-cyber-purple/20'
            }`}>
              {activeAggregator || hasOfficialConfig || hasVideoConfig ? (
                <Unlock className="w-5 h-5 text-green-400" />
              ) : (
                <Lock className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div>
              <h3 className={`font-medium ${
                activeAggregator || hasOfficialConfig || hasVideoConfig
                  ? 'text-green-400'
                  : 'text-gray-400'
              }`}>
                {activeAggregator
                  ? `已配置 ${activeAggregator}`
                  : hasOfficialConfig || hasVideoConfig
                    ? '部分API已配置'
                    : 'AI 服务未配置'}
              </h3>
              <p className="text-[10px] text-gray-500">
                {activeAggregator
                  ? '使用聚合平台，API调用更稳定'
                  : '请配置至少一个API密钥'}
              </p>
            </div>
          </div>
        </div>

        {/* 聚合平台配置 */}
        {activeTab === 'aggregator' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-r from-cyber-pink/10 to-cyber-purple/10 border border-cyber-pink/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-cyber-pink" />
                <h3 className="font-medium text-white">聚合API平台（推荐）</h3>
              </div>
              <p className="text-xs text-gray-400">
                一个API Key调用所有模型，价格更低，稳定性更好，国内用户推荐使用
              </p>
            </div>

            {/* CometAPI */}
            <div className="bg-cyber-dark2/60 border border-cyber-purple/20 rounded-xl overflow-hidden">
              <div className="p-4 bg-cyber-purple/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      config.cometApiKey ? 'bg-green-500/20' : 'bg-cyber-purple/20'
                    }`}>
                      <Globe className={`w-4 h-4 ${config.cometApiKey ? 'text-green-400' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm">CometAPI</h4>
                      <p className="text-[10px] text-gray-500">500+模型 · 比官方低20-40%</p>
                    </div>
                  </div>
                  {config.cometApiKey && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">已配置</span>
                  )}
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">API Key</label>
                  <input
                    type="password"
                    value={config.cometApiKey || ''}
                    onChange={e => handleInputChange('cometApiKey', e.target.value)}
                    placeholder="sk-xxx..."
                    className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-cyber-pink/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">自定义Base URL（可选）</label>
                  <input
                    type="text"
                    value={config.cometBaseUrl || ''}
                    onChange={e => handleInputChange('cometBaseUrl', e.target.value)}
                    placeholder="https://api.cometapi.com/v1"
                    className="w-full px-3 py-2 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-xs focus:outline-none focus:border-cyber-pink/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* PoloAPI */}
            <div className="bg-cyber-dark2/60 border border-cyber-purple/20 rounded-xl overflow-hidden">
              <div className="p-4 bg-cyber-purple/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      config.poloApiKey ? 'bg-green-500/20' : 'bg-cyber-purple/20'
                    }`}>
                      <Zap className={`w-4 h-4 ${config.poloApiKey ? 'text-green-400' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm">PoloAPI</h4>
                      <p className="text-[10px] text-gray-500">企业级 · 人民币充值 · 支持对公转账</p>
                    </div>
                  </div>
                  {config.poloApiKey && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">已配置</span>
                  )}
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">API Key</label>
                  <input
                    type="password"
                    value={config.poloApiKey || ''}
                    onChange={e => handleInputChange('poloApiKey', e.target.value)}
                    placeholder="polo-xxx..."
                    className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-cyber-pink/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">自定义Base URL（可选）</label>
                  <input
                    type="text"
                    value={config.poloBaseUrl || ''}
                    onChange={e => handleInputChange('poloBaseUrl', e.target.value)}
                    placeholder="https://api.poloapi.com/v1"
                    className="w-full px-3 py-2 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-xs focus:outline-none focus:border-cyber-pink/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* DMXAPI */}
            <div className="bg-cyber-dark2/60 border border-cyber-purple/20 rounded-xl overflow-hidden">
              <div className="p-4 bg-cyber-purple/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      config.dmxApiKey ? 'bg-green-500/20' : 'bg-cyber-purple/20'
                    }`}>
                      <Sparkles className={`w-4 h-4 ${config.dmxApiKey ? 'text-green-400' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm">DMXAPI</h4>
                      <p className="text-[10px] text-gray-500">LangChain中文网 · 顶级模型7折</p>
                    </div>
                  </div>
                  {config.dmxApiKey && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">已配置</span>
                  )}
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">API Key</label>
                  <input
                    type="password"
                    value={config.dmxApiKey || ''}
                    onChange={e => handleInputChange('dmxApiKey', e.target.value)}
                    placeholder="dmx-xxx..."
                    className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-cyber-pink/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">自定义Base URL（可选）</label>
                  <input
                    type="text"
                    value={config.dmxBaseUrl || ''}
                    onChange={e => handleInputChange('dmxBaseUrl', e.target.value)}
                    placeholder="https://api.dmxapi.cn/v1"
                    className="w-full px-3 py-2 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-xs focus:outline-none focus:border-cyber-pink/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 简易API */}
            <div className="bg-cyber-dark2/60 border border-cyber-purple/20 rounded-xl overflow-hidden">
              <div className="p-4 bg-cyber-purple/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      config.jeniyaApiKey ? 'bg-green-500/20' : 'bg-cyber-purple/20'
                    }`}>
                      <Zap className={`w-4 h-4 ${config.jeniyaApiKey ? 'text-green-400' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm">简易API</h4>
                      <p className="text-[10px] text-gray-500">国内直连 · 无需翻墙 · 送200元额度</p>
                    </div>
                  </div>
                  {config.jeniyaApiKey && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">已配置</span>
                  )}
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">API Key</label>
                  <input
                    type="password"
                    value={config.jeniyaApiKey || ''}
                    onChange={e => handleInputChange('jeniyaApiKey', e.target.value)}
                    placeholder="jeniya-xxx..."
                    className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-cyber-pink/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">自定义Base URL（可选）</label>
                  <input
                    type="text"
                    value={config.jeniyaBaseUrl || ''}
                    onChange={e => handleInputChange('jeniyaBaseUrl', e.target.value)}
                    placeholder="https://api.jeniya.cn/v1"
                    className="w-full px-3 py-2 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-xs focus:outline-none focus:border-cyber-pink/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* OpenRouter */}
            <div className="bg-cyber-dark2/60 border border-cyber-purple/20 rounded-xl overflow-hidden">
              <div className="p-4 bg-cyber-purple/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      config.openrouterApiKey ? 'bg-green-500/20' : 'bg-cyber-purple/20'
                    }`}>
                      <Globe className={`w-4 h-4 ${config.openrouterApiKey ? 'text-green-400' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm">OpenRouter</h4>
                      <p className="text-[10px] text-gray-500">400+模型 · 全球最流行</p>
                    </div>
                  </div>
                  {config.openrouterApiKey && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">已配置</span>
                  )}
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">API Key</label>
                  <input
                    type="password"
                    value={config.openrouterApiKey || ''}
                    onChange={e => handleInputChange('openrouterApiKey', e.target.value)}
                    placeholder="sk-or-xxx..."
                    className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-cyber-pink/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">自定义Base URL（可选）</label>
                  <input
                    type="text"
                    value={config.openrouterBaseUrl || ''}
                    onChange={e => handleInputChange('openrouterBaseUrl', e.target.value)}
                    placeholder="https://openrouter.ai/api/v1"
                    className="w-full px-3 py-2 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-xs focus:outline-none focus:border-cyber-pink/50 transition-colors"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 官方API配置 */}
        {activeTab === 'official' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-cyber-blue/10 border border-cyber-blue/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-cyber-blue" />
                <h3 className="font-medium text-white">官方API（备用）</h3>
              </div>
              <p className="text-xs text-gray-400">
                如果没有配置聚合平台，将使用官方API。建议优先使用聚合平台，价格更低更稳定。
              </p>
            </div>

            {/* OpenAI */}
            <div className="bg-cyber-dark2/60 border border-cyber-purple/20 rounded-xl overflow-hidden">
              <div className="p-4 bg-cyber-purple/5">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    config.openaiApiKey ? 'bg-green-500/20' : 'bg-cyber-purple/20'
                  }`}>
                    <Sparkles className={`w-4 h-4 ${config.openaiApiKey ? 'text-green-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">OpenAI API</h4>
                    <p className="text-[10px] text-gray-500">GPT-4 / DALL-E</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">API Key</label>
                  <input
                    type="password"
                    value={config.openaiApiKey || ''}
                    onChange={e => handleInputChange('openaiApiKey', e.target.value)}
                    placeholder="sk-xxx..."
                    className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-cyber-pink/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">自定义 API 地址（可选）</label>
                  <input
                    type="text"
                    value={config.openaiBaseUrl || ''}
                    onChange={e => handleInputChange('openaiBaseUrl', e.target.value)}
                    placeholder="如使用代理"
                    className="w-full px-3 py-2 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-xs focus:outline-none focus:border-cyber-pink/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 文心一言 */}
            <div className="bg-cyber-dark2/60 border border-cyber-purple/20 rounded-xl overflow-hidden">
              <div className="p-4 bg-cyber-purple/5">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    config.baiduApiKey ? 'bg-green-500/20' : 'bg-cyber-purple/20'
                  }`}>
                    <MessageSquare className={`w-4 h-4 ${config.baiduApiKey ? 'text-green-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">百度文心一言</h4>
                    <p className="text-[10px] text-gray-500">ERNIE 4.0 / ERNIE 3.5</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">API Key</label>
                  <input
                    type="password"
                    value={config.baiduApiKey || ''}
                    onChange={e => handleInputChange('baiduApiKey', e.target.value)}
                    placeholder="百度 API Key"
                    className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-cyber-pink/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Secret Key</label>
                  <input
                    type="password"
                    value={config.baiduSecretKey || ''}
                    onChange={e => handleInputChange('baiduSecretKey', e.target.value)}
                    placeholder="百度 Secret Key"
                    className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-cyber-pink/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Stability AI */}
            <div className="bg-cyber-dark2/60 border border-cyber-purple/20 rounded-xl overflow-hidden">
              <div className="p-4 bg-cyber-purple/5">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    config.stabilityApiKey ? 'bg-green-500/20' : 'bg-cyber-purple/20'
                  }`}>
                    <Image className={`w-4 h-4 ${config.stabilityApiKey ? 'text-green-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">Stability AI</h4>
                    <p className="text-[10px] text-gray-500">Stable Diffusion XL</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">API Key</label>
                  <input
                    type="password"
                    value={config.stabilityApiKey || ''}
                    onChange={e => handleInputChange('stabilityApiKey', e.target.value)}
                    placeholder="sk-xxx..."
                    className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-purple/20 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-cyber-pink/50 transition-colors"
                  />
                </div>
              </div>
            </div>
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
            disabled={!config.cometApiKey && !config.poloApiKey && !config.dmxApiKey && !config.jeniyaApiKey && !config.openrouterApiKey && !config.openaiApiKey && !config.baiduApiKey && !config.seedanceApiKey && !config.klingApiKey && !config.viduApiKey}
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
