import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  Gift,
  Trophy,
  ArrowLeft,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Star,
  Users,
  Palette,
  Compass,
  Zap,
  Crown,
  Award,
  Flame,
  Lock,
  Sparkles,
  X
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { AppVersion } from '@/components/AppVersion';
import { LuckyWheel } from '@/components/LuckyWheel';
import type { TaskType, PointReward } from '@/types';

const ICON_MAP: Record<TaskType, any> = {
  daily: Star,
  achievement: Trophy,
  social: Users,
  creation: Palette,
  explore: Compass,
  special: Zap,
  member: Crown,
  level: Award,
};

const LABELS: Record<TaskType, string> = {
  daily: '每日任务',
  achievement: '成就',
  social: '社交',
  creation: '创作',
  explore: '探索',
  special: '活动',
  member: 'VIP',
  level: '等级',
};

const GRADIENTS: Record<TaskType, string> = {
  daily: 'from-cyan-400 to-blue-600',
  achievement: 'from-yellow-400 to-orange-600',
  social: 'from-pink-400 to-purple-600',
  creation: 'from-rose-400 to-red-600',
  explore: 'from-emerald-400 to-teal-600',
  special: 'from-orange-400 to-pink-600',
  member: 'from-purple-400 to-violet-700',
  level: 'from-amber-400 to-yellow-700',
};

export function PointsCenter() {
  const navigate = useNavigate();
  const {
    user,
    points,
    level,
    totalEarnedPoints,
    projectsCount,
    isVIP,
    vipLevel,
    transactions,
    dailyRewards,
    achievementRewards,
    socialRewards,
    creationRewards,
    exploreRewards,
    specialRewards,
    memberRewards,
    levelRewards,
    exchangeItems,
    claimReward,
    exchangeItem,
    recordPageVisit,
    refreshTasks,
    getCurrentVIPLevel,
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'tasks' | 'shop' | 'history'>('tasks');
  const [activeTaskType, setActiveTaskType] = useState<TaskType>('daily');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showWheel, setShowWheel] = useState(false);
  const [showHint, setShowHint] = useState<string | null>(null);

  useEffect(() => {
    recordPageVisit('points');
    refreshTasks();
  }, []);

  const allLists: Record<TaskType, PointReward[]> = {
    daily: dailyRewards,
    achievement: achievementRewards,
    social: socialRewards,
    creation: creationRewards,
    explore: exploreRewards,
    special: specialRewards,
    member: memberRewards,
    level: levelRewards,
  };

  const currentTasks = allLists[activeTaskType];

  const handleClaim = (t: PointReward) => {
    if (t.isCompleted) return;
    if ((t as any).isVIPOnly && !isVIP) {
      setToast({ text: '需要VIP才能领取此任务', type: 'error' });
      setTimeout(() => setToast(null), 2000);
      return;
    }
    if (t.target !== undefined && (t.progress ?? 0) < t.target) {
      setToast({ text: '任务进度尚未完成', type: 'error' });
      setTimeout(() => setToast(null), 2000);
      return;
    }
    const ok = claimReward(t.id);
    if (ok) {
      setToast({ text: `领取成功！+${t.id === 'daily-login' ? '随机' : t.points}积分`, type: 'success' });
    } else {
      setToast({ text: '领取失败，请稍后再试', type: 'error' });
    }
    setTimeout(() => setToast(null), 2000);
  };

  const handleExchange = (id: string, price: number) => {
    if (points < price) {
      setToast({ text: '积分不足', type: 'error' });
      setTimeout(() => setToast(null), 2000);
      return;
    }
    const ok = exchangeItem(id);
    if (ok) {
      setToast({ text: '兑换成功！', type: 'success' });
    } else {
      setToast({ text: '兑换失败', type: 'error' });
    }
    setTimeout(() => setToast(null), 2000);
  };

  const formatDate = (ds: string) => {
    try {
      return new Date(ds).toLocaleString('zh-CN', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return ds; }
  };

  const progressPct = (t: PointReward) => {
    if (t.target === undefined) return t.isCompleted ? 100 : 0;
    return Math.min(100, Math.round(((t.progress ?? 0) / t.target) * 100));
  };

  const canClaimNow = (t: PointReward): boolean => {
    if (t.isCompleted) return false;
    if ((t as any).isVIPOnly && !isVIP) return false;
    if (t.target === undefined) return false; // 无目标的任务不能直接领取（避免作弊）
    return (t.progress ?? 0) >= t.target;
  };

  // 判断任务卡片的视觉等级：
  // - completed（已完成灰色）
  // - available（可领取：高亮+闪烁）
  // - inProgress（进行中：半透明暗）
  // - locked（未达条件或需要VIP：强暗+锁）
  const cardState = (t: PointReward): 'completed' | 'available' | 'inProgress' | 'locked' => {
    if (t.isCompleted) return 'completed';
    if ((t as any).isVIPOnly && !isVIP) return 'locked';
    if (canClaimNow(t)) return 'available';
    return 'inProgress';
  };

  return (
    <div className="min-h-screen bg-cyber-dark pb-20">
      <header className="sticky top-0 z-30 bg-cyber-dark2/90 backdrop-blur-xl border-b border-cyber-purple/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-cyber-purple/20 transition-colors text-gray-300">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display font-bold text-white text-base md:text-lg">积分中心</h1>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {isVIP && <span className="text-purple-300 font-medium">★ VIP</span>}
              <span>Lv.{level}</span>
              <span>· 累计 {totalEarnedPoints} 分</span>
              {projectsCount > 0 && <span>· 作品 {projectsCount}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 px-3 py-1.5 rounded-xl">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="font-display font-bold text-yellow-300">{points}</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {/* 顶部信息卡 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-cyber-purple/20 via-cyber-pink/10 to-cyber-yellow/20 border border-cyber-purple/30 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">当前积分</p>
              <p className="font-display text-4xl font-bold text-yellow-300 tracking-wide">{points}</p>
              <p className="text-xs text-gray-500 mt-2">
                连续登录 <span className="text-cyan-300 font-medium">{user?.consecutiveLoginDays || 1}</span> 天
                {vipLevel > 0 && (
                  <span className="ml-2 text-amber-400">
                    VIP积分倍数 x{getCurrentVIPLevel().taskMultiplier}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => setShowWheel(true)}
              className="flex flex-col items-center justify-center gap-1 w-20 h-20 rounded-2xl bg-gradient-to-br from-cyber-pink to-cyber-yellow text-white shadow-lg shadow-pink-500/20 hover:scale-105 active:scale-95 transition-transform"
            >
              <Gift className="w-7 h-7" />
              <span className="text-xs font-medium">大转盘</span>
            </button>
          </div>

          {/* 进度条显示距离下一级 */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
              <span>等级进度</span>
              <span>Lv.{level} → Lv.{level + 1}</span>
            </div>
            <div className="h-2 bg-cyber-dark2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyber-pink via-cyber-yellow to-cyan-400 transition-all"
                style={{
                  width: `${Math.min(100, Math.round(((totalEarnedPoints % (level * 1000)) / (level * 1000 || 1000)) * 100))}%`,
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* 主标签切换 */}
        <div className="flex gap-2 bg-cyber-dark2/50 rounded-2xl p-1">
          {([
            ['tasks', '任务中心', Trophy],
            ['shop', '积分商城', ShoppingBag],
            ['history', '兑换记录', Sparkles],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === key
                  ? 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* 任务类型横向 Tab */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                {(Object.keys(LABELS) as TaskType[]).map((t) => {
                  const Icon = ICON_MAP[t];
                  const list = allLists[t];
                  const unclaimedCount = list.filter(x => canClaimNow(x)).length;
                  const active = activeTaskType === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setActiveTaskType(t)}
                      className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                        active
                          ? `bg-gradient-to-r ${GRADIENTS[t]} text-white shadow-lg`
                          : 'bg-cyber-dark2/80 text-gray-400 hover:text-white border border-cyber-purple/10'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {LABELS[t]}
                      {unclaimedCount > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold bg-white text-pink-600 rounded-full">
                          {unclaimedCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 任务列表 */}
              <div className="space-y-3">
                {currentTasks.length === 0 ? (
                  <div className="text-center py-10 bg-cyber-dark2/40 rounded-2xl border border-cyber-purple/10">
                    <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">当前没有可领取的任务</p>
                  </div>
                ) : (
                  currentTasks.map((t, idx) => {
                    const state = cardState(t);
                    const Icon = ICON_MAP[t.type];
                    const pct = progressPct(t);
                    const isAvailable = state === 'available';
                    const isCompleted = state === 'completed';
                    const isLocked = state === 'locked';
                    const dimmed = state !== 'available' && state !== 'completed';

                    return (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className={`relative overflow-hidden rounded-2xl border transition-all ${
                          isCompleted
                            ? 'bg-cyber-dark2/30 border-green-500/30'
                            : isAvailable
                              ? 'bg-gradient-to-br from-cyber-dark2/90 to-cyber-purple/10 border-cyber-pink/50 shadow-lg shadow-cyber-pink/10'
                              : isLocked
                                ? 'bg-cyber-dark2/40 border-purple-500/20 opacity-70'
                                : 'bg-cyber-dark2/60 border-cyber-purple/20'
                        } ${isAvailable ? 'animate-pulse-slow' : ''}`}
                      >
                        {/* 左侧彩色边条 */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${GRADIENTS[t.type]}`} />

                        <div className="flex items-start gap-3 p-4 pl-5">
                          <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                            isCompleted
                              ? 'bg-green-500/10 text-green-400'
                              : isAvailable
                                ? `bg-gradient-to-br ${GRADIENTS[t.type]} text-white shadow-lg`
                                : isLocked
                                  ? 'bg-purple-500/10 text-purple-400'
                                  : 'bg-cyber-dark2/80 text-gray-500'
                          }`}>
                            {isCompleted ? <CheckCircle className="w-5 h-5" /> : isLocked ? <Lock className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className={`font-semibold text-base truncate ${isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>
                                    {t.name}
                                  </h3>
                                  {(t as any).isVIPOnly && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                                      VIP
                                    </span>
                                  )}
                                </div>
                                <p className={`text-xs mt-0.5 leading-relaxed ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                                  {t.description}
                                </p>
                                {(t as any).autoUnlockHint && !isCompleted && (
                                  <button
                                    onClick={() => setShowHint(showHint === t.id ? null : t.id)}
                                    className="text-[10px] text-cyan-400 mt-1 hover:underline"
                                  >
                                    查看解锁条件 →
                                  </button>
                                )}
                                {showHint === t.id && (t as any).autoUnlockHint && (
                                  <div className="mt-2 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-[11px] text-cyan-300 leading-relaxed">
                                    💡 {(t as any).autoUnlockHint}
                                  </div>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="font-display font-bold text-yellow-300 text-lg">
                                  +{t.id === 'daily-login' ? '随机' : t.points}
                                </div>
                              </div>
                            </div>

                            {/* 进度条 */}
                            {t.target !== undefined && !isCompleted && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-1 text-[11px]">
                                  <span className={dimmed ? 'text-gray-500' : 'text-gray-400'}>进度</span>
                                  <span className={dimmed ? 'text-gray-500' : 'text-cyber-blue font-medium'}>
                                    {t.progress ?? 0} / {t.target}
                                  </span>
                                </div>
                                <div className="h-1.5 bg-cyber-dark rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${
                                      isAvailable
                                        ? `bg-gradient-to-r ${GRADIENTS[t.type]}`
                                        : 'bg-gray-600/70'
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* 按钮区域 */}
                            <div className="mt-3">
                              {isCompleted ? (
                                <div className="inline-flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/30">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  已领取
                                </div>
                              ) : isLocked ? (
                                <div className="inline-flex items-center gap-1.5 text-xs text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/30">
                                  <Lock className="w-3.5 h-3.5" />
                                  需开通VIP
                                </div>
                              ) : isAvailable ? (
                                <button
                                  onClick={() => handleClaim(t)}
                                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-gradient-to-r ${GRADIENTS[t.type]} text-white shadow-lg hover:scale-105 active:scale-95 transition-transform`}
                                >
                                  <Gift className="w-3.5 h-3.5" />
                                  立即领取
                                </button>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-cyber-dark/50 px-3 py-1.5 rounded-lg border border-gray-700/50">
                                  <Flame className="w-3.5 h-3.5" />
                                  进行中
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'shop' && (
            <motion.div
              key="shop"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid gap-3"
            >
              {exchangeItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-cyber-dark2/60 border border-cyber-purple/20 rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-cyber-pink/30 to-cyber-yellow/30 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-yellow-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{item.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                    <p className="text-[10px] text-gray-500 mt-1">库存：{item.stock}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-0.5 justify-end">
                        <Coins className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="font-display font-bold text-yellow-300 text-base">{item.price}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleExchange(item.id, item.price)}
                      disabled={points < item.price || item.stock <= 0}
                      className={`ml-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        points >= item.price && item.stock > 0
                          ? 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white shadow-lg hover:scale-105 active:scale-95'
                          : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      兑换
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              {transactions.length === 0 ? (
                <div className="text-center py-16 bg-cyber-dark2/40 rounded-2xl border border-cyber-purple/10">
                  <Sparkles className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">暂无积分记录</p>
                  <p className="text-xs text-gray-600 mt-1">完成任务来获得积分吧！</p>
                </div>
              ) : (
                transactions.map((tx, idx) => (
                  <div
                    key={tx.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      tx.type === 'earn'
                        ? 'bg-green-500/5 border-green-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      tx.type === 'earn' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                    }`}>
                      {tx.type === 'earn' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{tx.description}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className={`font-display font-bold text-base ${tx.type === 'earn' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-xl border flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-green-500/90 border-green-400/50 text-white'
                : 'bg-red-500/90 border-red-400/50 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
            <span className="text-sm font-medium">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lucky Wheel Modal */}
      {showWheel && <LuckyWheel onClose={() => setShowWheel(false)} />}

      {/* App Version */}
      <AppVersion />
    </div>
  );
}
