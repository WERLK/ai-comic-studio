import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ExternalLink, Bookmark, Star, Zap, Users,
  BookOpen, TrendingUp, Megaphone, Search, Copy, Check,
  Smartphone, Globe, Building, Sparkles, Trophy, DollarSign, HelpCircle
} from 'lucide-react';
import { PLATFORMS, type PlatformInfo } from '@/platforms';
import { AppVersion } from '@/components/AppVersion';

const CATEGORY_FILTERS = ['全部', '综合', '男频', '女频', '玄幻', '都市', '言情', '科幻', '历史', '同人'];

const MALE_CATS = ['玄幻', '都市', '科幻', '历史', '军事', '游戏', '竞技', '悬疑', '同人'];
const FEMALE_CATS = ['言情', '纯爱', '古代言情', '现代言情', '幻想言情', '同人'];

export function NovelPromotionCenter() {
  const navigate = useNavigate();
  const [activePlatform, setActivePlatform] = useState<PlatformInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1500);
  };

  const handleOpen = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const matchesCategory = (platform: PlatformInfo, cat: string): boolean => {
    if (cat === '全部') return true;
    if (cat === '综合') return platform.categories.length >= 8;
    if (cat === '男频') return platform.categories.some(c => MALE_CATS.includes(c));
    if (cat === '女频') return platform.categories.some(c => FEMALE_CATS.includes(c));
    return platform.categories.includes(cat);
  };

  const matchesQuery = (platform: PlatformInfo, query: string): boolean => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      platform.name.toLowerCase().includes(q) ||
      platform.brand.toLowerCase().includes(q) ||
      platform.description.toLowerCase().includes(q) ||
      platform.categories.some(cat => cat.toLowerCase().includes(q))
    );
  };

  const filtered = PLATFORMS.filter(p => matchesCategory(p, activeCategory) && matchesQuery(p, searchQuery));

  return (
    <div className="min-h-screen bg-cyber-bg text-white">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-30 bg-cyber-bg/90 backdrop-blur-xl border-b border-cyber-purple/20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-cyber-purple/20 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-lg flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-cyber-pink flex-shrink-0" />
              小说平台推广达人中心
            </h1>
            <p className="text-[10px] text-gray-500 mt-0.5 truncate">
              正版小说发布平台 · 推广达人入驻 · 官方合作通道
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 px-2.5 py-1 bg-cyber-pink/10 border border-cyber-pink/20 rounded-lg">
              <Bookmark className="w-3.5 h-3.5 text-cyber-pink" />
              <span className="text-xs text-cyber-pink font-medium">{PLATFORMS.length} 个平台</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 说明横幅 */}
        <div className="bg-gradient-to-r from-cyber-pink/10 to-cyber-purple/10 border border-cyber-pink/20 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-pink to-rose-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-white mb-1">为什么要对接小说平台推广达人中心？</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div className="bg-cyber-dark/50 rounded-xl p-3 border border-cyber-purple/10">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-white font-medium">推广分成</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    通过推广小说作品获得丰厚的订阅、广告、全勤等多元化收益分成
                  </p>
                </div>
                <div className="bg-cyber-dark/50 rounded-xl p-3 border border-cyber-purple/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-white font-medium">官方认证</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    成为平台官方认证的推广达人，享受官方推荐位和活动资源
                  </p>
                </div>
                <div className="bg-cyber-dark/50 rounded-xl p-3 border border-cyber-purple/10">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-cyber-blue" />
                    <span className="text-xs text-white font-medium">IP 合作</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    有机会参与影视、有声书、漫画、游戏等 IP 衍生项目的合作开发
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-cyber-dark/60 border border-cyber-purple/20 rounded-2xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索平台或题材..."
                className="w-full pl-10 pr-4 py-2.5 bg-cyber-bg border border-cyber-purple/30 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-cyber-pink/50 transition-colors"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
              {CATEGORY_FILTERS.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white shadow-lg shadow-cyber-pink/20'
                      : 'bg-cyber-purple/10 border border-cyber-purple/20 text-gray-400 hover:text-white hover:border-cyber-pink/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 平台列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {filtered.map(platform => (
            <div
              key={platform.id}
              className="bg-cyber-dark/80 border border-cyber-purple/20 rounded-2xl overflow-hidden hover:border-cyber-pink/40 transition-all cursor-pointer"
              onClick={() => setActivePlatform(platform)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white truncate">{platform.name}</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                        <Building className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{platform.brand}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2">
                  {platform.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {platform.highlights.slice(0, 4).map(h => (
                    <span
                      key={h}
                      className="px-2 py-1 bg-cyber-pink/10 border border-cyber-pink/20 rounded-lg text-[10px] text-cyber-pink"
                    >
                      <Star className="w-3 h-3 inline mr-1" />
                      {h}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-cyber-purple/10">
                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {platform.audience.slice(0, 8)}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span className="hidden sm:inline">{platform.commissionRate}</span>
                      <span className="sm:hidden">分成</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-cyber-purple">查看详情 →</span>
                </div>
              </div>

              {/* 快速入口 */}
              <div className="px-5 pb-5">
                <div className="bg-cyber-purple/5 rounded-xl p-2">
                  <div className="text-[10px] text-gray-500 mb-2">快速入口：</div>
                  <div className="grid grid-cols-2 gap-2">
                    {platform.urls.slice(0, 2).map(urlItem => (
                      <button
                        key={urlItem.label}
                        onClick={e => {
                          e.stopPropagation();
                          handleOpen(urlItem.url);
                        }}
                        className="px-3 py-2 bg-cyber-bg/80 hover:bg-cyber-purple/20 border border-cyber-purple/10 hover:border-cyber-pink/30 rounded-lg text-[11px] text-gray-400 hover:text-white transition-all flex items-center justify-between"
                      >
                        <span className="truncate">{urlItem.label}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 mx-auto text-gray-600 mb-3" />
            <p className="text-sm text-gray-500">未找到匹配的平台</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('全部'); }}
              className="mt-3 px-4 py-2 bg-cyber-purple/20 hover:bg-cyber-purple/30 border border-cyber-purple/30 rounded-xl text-xs text-gray-400 hover:text-white transition-all"
            >
              重置筛选
            </button>
          </div>
        )}

        {/* 底部快速导航 */}
        <div className="bg-cyber-dark/60 border border-cyber-purple/20 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            快速入驻通道
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {PLATFORMS.slice(0, 12).map(p => (
              <button
                key={p.id}
                onClick={() => handleOpen(p.urls[0].url)}
                className="px-3 py-2.5 bg-gradient-to-br from-cyber-purple/20 to-cyber-pink/10 hover:from-cyber-pink/20 hover:to-cyber-purple/20 border border-cyber-purple/20 hover:border-cyber-pink/40 rounded-xl text-xs text-gray-400 hover:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 版权声明 */}
        <div className="bg-cyber-yellow/5 border border-cyber-yellow/10 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-cyber-yellow flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-gray-400 leading-relaxed">
              <p className="mb-2">
                <strong className="text-cyber-yellow">重要声明：</strong>
                本页面仅收集和展示正版小说发布平台的官方推广、作者入驻等链接信息。所有平台链接均指向各平台官方网站。
              </p>
              <p className="mb-2">
                <strong className="text-white">版权提示：</strong>
                改编他人受版权保护的小说作品请先获得原作者或平台的合法授权。建议优先使用原创作品、已获授权作品或公版作品进行创作。
              </p>
              <p>
                <strong className="text-white">入驻建议：</strong>
                各平台推广政策、分成比例和奖励机制会动态调整，请以各平台官方最新公告为准。入驻前建议仔细阅读各平台的作者服务协议和推广规则。
              </p>
            </div>
          </div>
        </div>

        {/* 版本信息 */}
        <AppVersion />
      </div>

      {/* 平台详情弹窗 */}
      {activePlatform && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-8 bg-cyber-dark2 border border-cyber-purple/30 rounded-2xl shadow-2xl">
            {/* 弹窗头部 */}
            <div className="px-6 py-5 border-b border-cyber-purple/20 bg-gradient-to-r from-cyber-pink/10 to-cyber-purple/10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-white">{activePlatform.name}</h2>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" />
                      {activePlatform.brand}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActivePlatform(null)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-cyber-purple/20 rounded-xl transition-all flex-shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {activePlatform.highlights.map(h => (
                  <span
                    key={h}
                    className="px-2.5 py-1 bg-cyber-pink/10 border border-cyber-pink/20 rounded-lg text-[11px] text-cyber-pink"
                  >
                    <Star className="w-3 h-3 inline mr-1" />
                    {h}
                  </span>
                ))}
              </div>
            </div>

            {/* 弹窗内容 */}
            <div className="p-6 space-y-5">
              {/* 平台简介 */}
              <div className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-4">
                <h3 className="text-xs font-bold text-white mb-2">平台简介</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{activePlatform.description}</p>
              </div>

              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-4">
                  <h4 className="text-[11px] text-gray-500 mb-2 flex items-center gap-1.5">
                    <Globe className="w-3 h-3" />
                    支持平台
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activePlatform.platforms.map(pl => (
                      <span key={pl} className="px-2 py-1 bg-cyber-purple/10 rounded-lg text-[11px] text-gray-400">
                        {pl}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-4">
                  <h4 className="text-[11px] text-gray-500 mb-2 flex items-center gap-1.5">
                    <Users className="w-3 h-3" />
                    适合人群
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {activePlatform.audience}
                  </p>
                </div>

                <div className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-4">
                  <h4 className="text-[11px] text-gray-500 mb-2 flex items-center gap-1.5">
                    <DollarSign className="w-3 h-3" />
                    分成比例
                  </h4>
                  <p className="text-sm text-green-400 font-medium">
                    {activePlatform.commissionRate}
                  </p>
                </div>

                <div className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-4">
                  <h4 className="text-[11px] text-gray-500 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" />
                    支持题材
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activePlatform.categories.slice(0, 6).map(cat => (
                      <span key={cat} className="px-2 py-1 bg-cyber-purple/10 rounded-lg text-[10px] text-gray-400">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 推广达人中心链接 */}
              <div className="bg-cyber-dark/60 border border-cyber-pink/20 rounded-xl p-4">
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyber-pink" />
                  推广达人中心 · 官方链接
                </h3>
                <div className="space-y-2">
                  {activePlatform.urls.map(urlItem => (
                    <div
                      key={urlItem.label}
                      className="flex items-center gap-2 bg-cyber-bg/80 border border-cyber-purple/15 rounded-xl p-3 hover:border-cyber-pink/30 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-gray-400 mb-0.5">{urlItem.label}</div>
                        <div className="text-[10px] text-gray-600 font-mono truncate">{urlItem.url}</div>
                      </div>
                      <button
                        onClick={() => handleCopy(urlItem.url)}
                        className="flex-shrink-0 p-1.5 text-gray-500 hover:text-cyber-pink hover:bg-cyber-pink/10 rounded-lg transition-all"
                        title="复制链接"
                      >
                        {copiedUrl === urlItem.url ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpen(urlItem.url)}
                        className="flex-shrink-0 px-3 py-1.5 bg-cyber-pink/20 hover:bg-cyber-pink/30 border border-cyber-pink/30 rounded-lg text-[11px] text-cyber-pink hover:text-white transition-all flex items-center gap-1"
                      >
                        访问
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 入驻建议 */}
              <div className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-4">
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-cyber-blue" />
                  入驻建议
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">
                  {activePlatform.joinTips}
                </p>
                <div className="space-y-1.5">
                  {activePlatform.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-gray-500">
                      <Star className="w-3 h-3 text-cyber-yellow flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 平台特色功能 */}
              <div className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-4">
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  平台特色功能
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activePlatform.features.map(feat => (
                    <div
                      key={feat}
                      className="px-3 py-2 bg-cyber-purple/10 border border-cyber-purple/20 rounded-xl text-[11px] text-gray-400"
                    >
                      ✓ {feat}
                    </div>
                  ))}
                </div>
              </div>

              {/* 联系方式 */}
              <div className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-4">
                <h3 className="text-xs font-bold text-white mb-2">联系方式</h3>
                {activePlatform.contact.email ? (
                  <div className="text-[11px] text-gray-400 flex items-center gap-2">
                    <span className="text-gray-500">邮箱：</span>
                    <span className="font-mono">{activePlatform.contact.email}</span>
                    <button
                      onClick={() => handleCopy(activePlatform.contact.email!)}
                      className="ml-auto text-[10px] text-cyber-purple hover:text-cyber-pink transition-colors"
                    >
                      {copiedUrl === activePlatform.contact.email ? '✓ 已复制' : '复制'}
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500">请通过上方官方链接进入平台获取详细联系方式</p>
                )}
              </div>
            </div>

            {/* 弹窗底部 */}
            <div className="px-6 py-4 border-t border-cyber-purple/20 bg-cyber-dark/50 flex items-center justify-between">
              <p className="text-[10px] text-gray-600">以上链接会在新窗口打开各平台官方网站</p>
              <button
                onClick={() => setActivePlatform(null)}
                className="px-5 py-2 bg-gradient-to-r from-cyber-pink to-cyber-purple rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
