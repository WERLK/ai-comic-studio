import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Sparkles, 
  Crown, 
  Award, 
  RotateCw,
  Flame,
  TrendingUp,
  Heart,
  MessageSquare,
  Share2,
  Rocket,
  MapPin,
  Wrench,
  Globe,
  Calendar,
  DollarSign,
  ZapOff
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { AppVersion } from '@/components/AppVersion';
import { LuckyWheel } from '@/components/LuckyWheel';
import { ResponsiveIcon } from '@/components/ResponsiveIcon';
import { TaskType } from '@/types';

const TaskIcon = ({ type, completed }: { type: TaskType; completed?: boolean }) => {
  const className = `${completed ? 'text-gray-400' : 'text-white'}`;
  
  let iconComponent;
  switch (type) {
    case 'daily':
      iconComponent = Calendar;
      break;
    case 'achievement':
      iconComponent = Trophy;
      break;
    case 'social':
      iconComponent = Users;
      break;
    case 'creation':
      iconComponent = Palette;
      break;
    case 'explore':
      iconComponent = Compass;
      break;
    case 'special':
      iconComponent = Zap;
      break;
    case 'member':
      iconComponent = Crown;
      break;
    case 'level':
      iconComponent = Award;
      break;
    default:
      iconComponent = Trophy;
  }
  
  return <ResponsiveIcon icon={iconComponent} className={className} mobileSize={16} desktopSize={20} />;
};

const PrizeIcon = ({ index }: { index: number }) => {
  const icons = [Sparkles, Gift, Rocket, Star, Crown, Heart, Award, Zap];
  const Icon = icons[index % icons.length];
  const colors = ['text-cyber-yellow', 'text-cyber-pink', 'text-cyber-blue', 'text-purple-400', 'text-pink-400', 'text-red-400', 'text-orange-400', 'text-cyan-400'];
  return <ResponsiveIcon icon={Icon} className={colors[index % colors.length]} mobileSize={18} desktopSize={24} />;
};

export function PointsCenter() {
  const navigate = useNavigate();
  const { 
    user, 
    points, 
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
    exchangeItem 
  } = useAuthStore();

  const [activeMainTab, setActiveMainTab] = useState<'tasks' | 'shop' | 'history'>('tasks');
  const [activeTaskType, setActiveTaskType] = useState<TaskType>('daily');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showLuckyWheel, setShowLuckyWheel] = useState(false);

  const getCurrentTasks = () => {
    switch (activeTaskType) {
      case 'daily':
        return dailyRewards;
      case 'achievement':
        return achievementRewards;
      case 'social':
        return socialRewards;
      case 'creation':
        return creationRewards;
      case 'explore':
        return exploreRewards;
      case 'special':
        return specialRewards;
      case 'member':
        return memberRewards;
      case 'level':
        return levelRewards;
    }
  };

  const handleClaimReward = (rewardId: string) => {
    const success = claimReward(rewardId);
    if (success) {
      setMessage({ text: '领取成功！', type: 'success' });
    } else {
      setMessage({ text: '领取失败，任务未完成或已领取', type: 'error' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExchangeItem = (itemId: string) => {
    const success = exchangeItem(itemId);
    if (success) {
      setMessage({ text: '兑换成功！', type: 'success' });
    } else {
      setMessage({ text: '积分不足或库存不足', type: 'error' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const taskTypeLabels: Record<TaskType, string> = {
    daily: '每日任务',
    achievement: '成就任务',
    social: '社交任务',
    creation: '创作任务',
    explore: '探索任务',
    special: '特殊活动',
    member: '会员任务',
    level: '等级任务',
  };

  const taskTypeColors: Record<TaskType, string> = {
    daily: 'from-cyber-blue to-cyber-purple',
    achievement: 'from-cyber-yellow to-cyber-pink',
    social: 'from-cyan-400 to-blue-500',
    creation: 'from-pink-400 to-purple-500',
    explore: 'from-green-400 to-emerald-500',
    special: 'from-orange-400 to-red-500',
    member: 'from-purple-400 to-pink-500',
    level: 'from-yellow-400 to-orange-500',
  };

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid">
      {/* Header */}
      <header className="h-14 bg-cyber-dark2/80 backdrop-blur-xl border-b border-cyber-purple/20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 text-gray-400 hover:text-white transition-colors">
            <ResponsiveIcon icon={ArrowLeft} mobileSize={20} desktopSize={20} />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyber-yellow to-cyber-pink flex items-center justify-center">
            <ResponsiveIcon icon={Coins} className="text-cyber-dark" mobileSize={16} desktopSize={18} />
          </div>
          <h1 className="font-display font-bold text-white text-sm md:text-base">积分中心</h1>
        </div>
        <div className="flex items-center gap-3">
          <AppVersion />
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Points Header Card */}
        <div className="bg-gradient-to-br from-cyber-purple/25 via-cyber-pink/20 to-cyber-yellow/15 border border-cyber-purple/30 rounded-3xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyber-yellow/10 to-cyber-pink/10 rounded-full blur-3xl" />
          <div className="flex items-center gap-4 md:gap-5 relative z-10">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-gradient-to-br from-cyber-yellow via-cyber-pink to-cyber-purple flex items-center justify-center shadow-2xl shadow-cyber-yellow/30">
              <ResponsiveIcon icon={Coins} className="text-cyber-dark" mobileSize={32} desktopSize={40} />
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-sm mb-1">当前积分</p>
              <p className="font-display text-4xl md:text-5xl font-bold neon-text-yellow">{points}</p>
            </div>
            <div className="flex flex-col gap-2">
              {user?.consecutiveLoginDays && user.consecutiveLoginDays > 0 && (
                <div className="bg-cyber-dark/70 backdrop-blur-xl rounded-2xl px-4 py-2 border border-cyber-yellow/20">
                  <p className="text-gray-400 text-xs mb-1">连续登录</p>
                  <p className="font-display text-lg md:text-xl font-bold text-cyber-yellow flex items-center gap-1">
                    <ResponsiveIcon icon={Flame} className="text-orange-400" mobileSize={14} desktopSize={16} />
                    {user.consecutiveLoginDays}天
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-6 rounded-2xl p-4 backdrop-blur-xl ${
            message.type === 'success' 
              ? 'bg-green-500/20 border border-green-500/30' 
              : 'bg-red-500/20 border border-red-500/30'
          }`}>
            <p className={`text-sm ${
              message.type === 'success' ? 'text-green-400' : 'text-red-400'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Lucky Wheel Banner */}
        <button
            onClick={() => setShowLuckyWheel(true)}
            className="w-full mb-6 bg-gradient-to-r from-cyber-yellow via-cyber-pink to-cyber-purple rounded-2xl p-5 text-left shadow-2xl shadow-cyber-pink/30 hover:shadow-cyber-purple/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-cyber-dark/30 flex items-center justify-center animate-pulse">
                  <ResponsiveIcon icon={Gift} className="text-cyber-dark" mobileSize={20} desktopSize={28} />
                </div>
              <div>
                <h3 className="font-display font-bold text-lg text-cyber-dark">幸运大转盘</h3>
                <p className="text-sm text-cyber-dark/80">免费抽奖赢取积分大奖！</p>
              </div>
            </div>
            <div className="bg-cyber-dark/20 rounded-xl px-4 py-2">
              <span className="font-medium text-cyber-dark">立即抽奖 →</span>
            </div>
          </div>
        </button>

        {/* Main Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveMainTab('tasks')}
            className={`px-5 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
              activeMainTab === 'tasks'
                ? 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white shadow-neon'
                : 'bg-cyber-dark2 text-gray-400 hover:text-white hover:bg-cyber-dark2/80'
            }`}
          >
            <ResponsiveIcon icon={Trophy} mobileSize={16} desktopSize={18} />
            任务中心
          </button>
          <button
            onClick={() => setActiveMainTab('shop')}
            className={`px-5 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
              activeMainTab === 'shop'
                ? 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white shadow-neon'
                : 'bg-cyber-dark2 text-gray-400 hover:text-white hover:bg-cyber-dark2/80'
            }`}
          >
            <ResponsiveIcon icon={ShoppingBag} mobileSize={16} desktopSize={18} />
            积分商城
          </button>
          <button
            onClick={() => setActiveMainTab('history')}
            className={`px-5 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
              activeMainTab === 'history'
                ? 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white shadow-neon'
                : 'bg-cyber-dark2 text-gray-400 hover:text-white hover:bg-cyber-dark2/80'
            }`}
          >
            <ResponsiveIcon icon={Sparkles} mobileSize={16} desktopSize={18} />
            积分记录
          </button>
        </div>

        {/* Tasks Tab */}
        {activeMainTab === 'tasks' && (
          <>
            {/* Task Type Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {(Object.keys(taskTypeLabels) as TaskType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveTaskType(type)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                    activeTaskType === type
                      ? `bg-gradient-to-r ${taskTypeColors[type]} text-white shadow-neon`
                      : 'bg-cyber-dark2 text-gray-400 hover:text-white hover:bg-cyber-dark2/80'
                  }`}
                >
                  <TaskIcon type={type} />
                  {taskTypeLabels[type]}
                </button>
              ))}
            </div>

            {/* Task List */}
            <div className="space-y-4">
              {getCurrentTasks().map((reward, index) => {
                const canClaim = !reward.isCompleted && 
                  (reward.target === undefined || (reward.progress !== undefined && reward.progress >= reward.target));
                
                return (
                  <div
                    key={reward.id}
                    className={`bg-cyber-dark2/80 backdrop-blur-xl border ${
                      reward.isCompleted ? 'border-green-500/20' : 'border-cyber-purple/20'
                    } rounded-3xl p-4 md:p-5 transition-all hover:border-cyber-pink/30`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center ${
                          reward.isCompleted 
                            ? 'bg-gray-700/50' 
                            : `bg-gradient-to-br ${taskTypeColors[activeTaskType]} shadow-md shadow-cyber-purple/20`
                        }`}>
                          {reward.isCompleted ? (
                            <ResponsiveIcon icon={CheckCircle} className="text-green-400" mobileSize={16} desktopSize={20} />
                          ) : (
                            <TaskIcon type={activeTaskType} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-lg">{reward.name}</h3>
                          <p className="text-sm text-gray-400 mt-1">{reward.description}</p>
                          {reward.target !== undefined && reward.progress !== undefined && (
                            <div className="mt-3">
                              <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-cyber-purple via-cyber-pink to-cyber-yellow transition-all"
                                  style={{ width: `${Math.min((reward.progress / reward.target) * 100, 100)}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-2 font-medium">
                                进度: {reward.progress}/{reward.target}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <span className="font-display text-xl font-bold neon-text-yellow">
                          +{reward.id === 'daily-login' ? '1-20随机' : reward.points}
                        </span>
                        <button
                          onClick={() => handleClaimReward(reward.id)}
                          disabled={!canClaim}
                          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            reward.isCompleted
                              ? 'bg-green-500/20 text-green-400 cursor-not-allowed border border-green-500/30'
                              : canClaim
                              ? 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white shadow-neon hover:shadow-lg'
                              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {reward.isCompleted ? '已完成 ✓' : canClaim ? '领取' : '进行中'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Shop Tab */}
        {activeMainTab === 'shop' && (
          <div className="grid md:grid-cols-2 gap-5">
            {exchangeItems.map((item, index) => (
              <div
                key={item.id}
                className="bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 rounded-3xl p-4 md:p-5 hover:border-cyber-pink/30 transition-all hover:shadow-lg hover:shadow-cyber-purple/20"
              >
                <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-gradient-to-br from-cyber-blue/20 via-cyber-purple/20 to-cyber-pink/20 border border-cyber-purple/30 flex items-center justify-center flex-shrink-0">
                    <PrizeIcon index={index} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-lg">{item.name}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2 mt-1">{item.description}</p>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <ResponsiveIcon icon={Wrench} mobileSize={14} desktopSize={16} />
                      库存: {item.stock}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ResponsiveIcon icon={Coins} className="text-cyber-yellow" mobileSize={18} desktopSize={20} />
                    <span className="font-display text-2xl font-bold neon-text-yellow">{item.price}</span>
                  </div>
                  <button
                    onClick={() => handleExchangeItem(item.id)}
                    disabled={points < item.price || item.stock <= 0}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      points < item.price || item.stock <= 0
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white shadow-neon hover:shadow-lg'
                    }`}
                  >
                    立即兑换
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History Tab */}
        {activeMainTab === 'history' && (
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-16 bg-cyber-dark2/50 rounded-3xl border border-cyber-purple/20">
                <ResponsiveIcon icon={Sparkles} className="text-gray-600 mx-auto mb-4" mobileSize={48} desktopSize={64} />
                <p className="text-gray-500 text-lg">暂无积分记录</p>
                <p className="text-gray-600 text-sm mt-2">完成任务获取积分吧！</p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 rounded-2xl p-4 md:p-5 hover:border-cyber-pink/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        transaction.type === 'earn'
                          ? 'bg-green-500/20 border border-green-500/30'
                          : 'bg-red-500/20 border border-red-500/30'
                      }`}>
                        {transaction.type === 'earn' ? (
                          <ResponsiveIcon icon={ArrowUpRight} className="text-green-400" mobileSize={16} desktopSize={18} />
                        ) : (
                          <ResponsiveIcon icon={ArrowDownRight} className="text-red-400" mobileSize={16} desktopSize={18} />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{transaction.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(transaction.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`font-display text-2xl font-bold ${
                      transaction.type === 'earn' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.type === 'earn' ? '+' : '-'}{transaction.amount}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showLuckyWheel && <LuckyWheel onClose={() => setShowLuckyWheel(false)} />}
    </div>
  );
}
