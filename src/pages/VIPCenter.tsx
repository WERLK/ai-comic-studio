import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { VIP_LEVELS, VIP_POINTS_RULES } from '@/types';
import {
  ArrowLeft, Crown, Star, Gem, Award, Diamond, User,
  ChevronRight, Zap, Check, Lock, Sparkles, Coins, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

const VIP_ICONS = [User, Crown, Gem, Star, Award, Diamond];

export function VIPCenter() {
  const navigate = useNavigate();
  const {
    isAuthenticated, user, isVIP, vipLevel, vipPoints,
    getCurrentVIPLevel, getNextVIPLevel, upgradeVIP, points
  } = useAuthStore();

  const current = getCurrentVIPLevel();
  const next = getNextVIPLevel();

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <Crown className="w-16 h-16 text-gray-600" />
        <p className="text-gray-400">请先登录后查看会员中心</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyber-pink to-cyber-purple text-white font-medium"
        >
          去登录
        </button>
      </div>
    );
  }

  const progressPercent = next
    ? Math.min(100, ((vipPoints || 0) / next.minPoints) * 100)
    : 100;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/profile')} className="p-2 rounded-xl bg-cyber-dark2 border border-cyber-purple/20">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <h1 className="text-xl font-bold text-white">会员中心</h1>
      </div>

      {/* 当前会员卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl p-6 mb-6 bg-gradient-to-br ${current.bgColor} border border-white/10`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-8 -mb-8" />

        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            {(() => {
              const Icon = VIP_ICONS[vipLevel || 0];
              return <Icon className="w-8 h-8 text-white" />;
            })()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{current.name}</h2>
              {isVIP && (
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium">
                  Lv.{vipLevel}
                </span>
              )}
            </div>
            <p className="text-white/70 text-sm mt-1">
              {isVIP ? `会员积分: ${vipPoints || 0}` : '升级会员解锁更多权益'}
            </p>
          </div>
        </div>

        {/* 进度条 */}
        {next && (
          <div className="relative mt-4">
            <div className="flex justify-between text-xs text-white/70 mb-1.5">
              <span>当前: {vipPoints || 0}</span>
              <span>下一级: {next.minPoints}</span>
            </div>
            <div className="h-2.5 bg-black/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-white/80 rounded-full"
              />
            </div>
            <p className="text-xs text-white/60 mt-1.5">
              还需 {Math.max(0, next.minPoints - (vipPoints || 0))} 会员积分升级至 {next.name}
            </p>
          </div>
        )}

        {!isVIP && (
          <button
            onClick={() => upgradeVIP(1)}
            disabled={points < VIP_LEVELS[1].minPoints}
            className="mt-4 w-full py-2.5 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
          >
            {points >= VIP_LEVELS[1].minPoints
              ? `消耗 ${VIP_LEVELS[1].minPoints} 积分开通青铜会员`
              : `积分不足（需要 ${VIP_LEVELS[1].minPoints} 积分）`
            }
          </button>
        )}
      </motion.div>

      {/* 当前权益 */}
      <div className="bg-cyber-dark2 rounded-2xl border border-cyber-purple/20 p-5 mb-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyber-yellow" />
          当前权益
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-cyber-dark rounded-xl p-3">
            <p className="text-xs text-gray-500">每日额外积分</p>
            <p className="text-lg font-bold text-cyber-yellow">+{current.dailyBonus}</p>
          </div>
          <div className="bg-cyber-dark rounded-xl p-3">
            <p className="text-xs text-gray-500">任务积分倍数</p>
            <p className="text-lg font-bold text-cyber-pink">x{current.taskMultiplier}</p>
          </div>
          <div className="bg-cyber-dark rounded-xl p-3">
            <p className="text-xs text-gray-500">最大分镜数</p>
            <p className="text-lg font-bold text-cyber-blue">{current.maxFrames}</p>
          </div>
          <div className="bg-cyber-dark rounded-xl p-3">
            <p className="text-xs text-gray-500">导出分辨率</p>
            <p className="text-lg font-bold text-cyber-green">{current.maxResolution}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {current.features.map((feat, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              {feat}
            </div>
          ))}
        </div>
      </div>

      {/* 会员等级列表 */}
      <div className="bg-cyber-dark2 rounded-2xl border border-cyber-purple/20 p-5 mb-6">
        <h3 className="font-bold text-white mb-4">会员等级</h3>
        <div className="space-y-3">
          {VIP_LEVELS.map((lvl) => {
            const Icon = VIP_ICONS[lvl.level];
            const isCurrent = lvl.level === vipLevel;
            const isLocked = (vipLevel || 0) < lvl.level;
            return (
              <div
                key={lvl.level}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-cyber-purple/20 border border-cyber-purple/30'
                    : 'bg-cyber-dark border border-transparent'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isLocked ? 'bg-gray-700' : 'bg-gradient-to-br ' + lvl.bgColor
                }`}>
                  {isLocked ? (
                    <Lock className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Icon className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isCurrent ? 'text-cyber-pink' : 'text-white'}`}>
                      {lvl.name}
                    </span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 rounded bg-cyber-pink/20 text-cyber-pink text-[10px]">
                        当前
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lvl.level === 0 ? '免费用户' : `需 ${lvl.minPoints} 会员积分`}
                  </p>
                </div>
                {lvl.level > 0 && !isLocked && lvl.level > (vipLevel || 0) && (
                  <button
                    onClick={() => upgradeVIP(lvl.level)}
                    disabled={points < lvl.minPoints}
                    className="px-3 py-1.5 rounded-lg bg-cyber-pink/20 text-cyber-pink text-xs font-medium hover:bg-cyber-pink/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    升级
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 会员积分获取方式 */}
      <div className="bg-cyber-dark2 rounded-2xl border border-cyber-purple/20 p-5">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyber-yellow" />
          如何获取会员积分
        </h3>
        <div className="space-y-3">
          {VIP_POINTS_RULES.map((rule, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-cyber-dark rounded-xl">
              <div>
                <p className="text-sm text-white font-medium">{rule.action}</p>
                <p className="text-xs text-gray-500">{rule.desc}</p>
              </div>
              <span className="px-2 py-1 rounded-lg bg-cyber-yellow/10 text-cyber-yellow text-xs font-medium">
                +{rule.points}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
