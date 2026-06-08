import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, Gift, Trophy, ArrowLeft, CheckCircle, ArrowUpRight, ArrowDownRight, ShoppingBag, Star, Users, Palette, Compass, Zap, Sparkles, Crown, Award, RotateCw } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { AppVersion } from '@/components/AppVersion';
import { LuckyWheel } from '@/components/LuckyWheel';
import { TaskType } from '@/types';

const TaskIcon = ({ type, completed }: { type: TaskType; completed?: boolean }) => {
  const className = `w-6 h-6 ${completed ? 'text-gray-400' : 'text-white'}`;
  
  switch (type) {
    case 'daily':
      return <Trophy className={className} />;
    case 'achievement':
      return <Star className={className} />;
    case 'social':
      return <Users className={className} />;
    case 'creation':
      return <Palette className={className} />;
    case 'explore':
      return <Compass className={className} />;
    case 'special':
      return <Zap className={className} />;
    case 'member':
      return <Crown className={className} />;
    case 'level':
      return <Award className={className} />;
  }
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
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-display font-medium text-white text-sm md:text-base">AI 漫剧工作室</h1>
        </div>
        <div className="flex items-center gap-3">
          <AppVersion />
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="font-display text-2xl font-bold text-white">积分中心</h1>
        </div>

        <div className="bg-gradient-to-br from-cyber-purple/20 to-cyber-pink/20 border border-cyber-purple/30 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber-yellow to-cyber-pink flex items-center justify-center">
              <Coins className="w-8 h-8 text-cyber-dark" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">当前积分</p>
              <p className="font-display text-4xl font-bold neon-text-yellow">{points}</p>
            </div>
            <div className="flex gap-4 ml-auto">
              {user?.consecutiveLoginDays && user.consecutiveLoginDays > 0 && (
                <div className="bg-cyber-dark/50 rounded-xl px-4 py-2">
                  <p className="text-gray-400 text-xs">连续登录</p>
                  <p className="font-display text-lg font-bold text-cyber-pink">{user.consecutiveLoginDays}天</p>
                </div>
              )}
              {user?.username && (
                <div className="bg-cyber-dark/50 rounded-xl px-4 py-2">
                  <p className="text-gray-400 text-xs">用户</p>
                  <p className="font-display text-lg font-bold text-white">{user.username}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-6 rounded-xl p-4 ${
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

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveMainTab('tasks')}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeMainTab === 'tasks'
                ? 'bg-cyber-pink text-white shadow-neon'
                : 'bg-cyber-dark2 text-gray-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            任务中心
          </button>
          <button
            onClick={() => setActiveMainTab('shop')}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeMainTab === 'shop'
                ? 'bg-cyber-pink text-white shadow-neon'
                : 'bg-cyber-dark2 text-gray-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4 inline mr-2" />
            积分商城
          </button>
          <button
            onClick={() => setActiveMainTab('history')}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeMainTab === 'history'
                ? 'bg-cyber-pink text-white shadow-neon'
                : 'bg-cyber-dark2 text-gray-400 hover:text-white'
            }`}
          >
            <Gift className="w-4 h-4 inline mr-2" />
            积分记录
          </button>
          <button
            onClick={() => setShowLuckyWheel(true)}
            className="px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all bg-gradient-to-r from-cyber-yellow to-cyber-pink text-cyber-dark shadow-neon hover:shadow-lg animate-pulse"
          >
            <RotateCw className="w-4 h-4 inline mr-2" />
            幸运大转盘
          </button>
        </div>

        {activeMainTab === 'tasks' && (
          <>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {(Object.keys(taskTypeLabels) as TaskType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveTaskType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activeTaskType === type
                      ? `bg-gradient-to-r ${taskTypeColors[type]} text-white shadow-neon`
                      : 'bg-cyber-dark2 text-gray-400 hover:text-white'
                  }`}
                >
                  {taskTypeLabels[type]}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {getCurrentTasks().map((reward) => {
                const canClaim = !reward.isCompleted && 
                  (reward.target === undefined || (reward.progress !== undefined && reward.progress >= reward.target));
                
                return (
                  <div
                    key={reward.id}
                    className={`bg-cyber-dark2/80 backdrop-blur-xl border ${
                      reward.isCompleted ? 'border-green-500/20' : 'border-cyber-purple/20'
                    } rounded-2xl p-4 transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          reward.isCompleted 
                            ? 'bg-gray-700/50' 
                            : `bg-gradient-to-br ${taskTypeColors[activeTaskType]}`
                        }`}>
                          {reward.isCompleted ? (
                            <CheckCircle className="w-6 h-6 text-gray-400" />
                          ) : (
                            <TaskIcon type={activeTaskType} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white">{reward.name}</h3>
                          <p className="text-sm text-gray-400">{reward.description}</p>
                          {reward.target !== undefined && reward.progress !== undefined && (
                            <div className="mt-2">
                              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-cyber-purple to-cyber-pink transition-all"
                                  style={{ width: `${Math.min((reward.progress / reward.target) * 100, 100)}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                进度: {reward.progress}/{reward.target}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="font-display text-lg font-bold text-cyber-yellow">+{reward.points}</span>
                        <button
                          onClick={() => handleClaimReward(reward.id)}
                          disabled={!canClaim}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            reward.isCompleted
                              ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                              : canClaim
                              ? 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white shadow-neon hover:shadow-lg'
                              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {reward.isCompleted ? '已完成' : canClaim ? '领取' : '进行中'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeMainTab === 'shop' && (
          <div className="grid md:grid-cols-2 gap-4">
            {exchangeItems.map((item) => (
              <div
                key={item.id}
                className="bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 rounded-2xl p-4"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyber-blue to-cyber-purple flex items-center justify-center flex-shrink-0">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white">{item.name}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2">{item.description}</p>
                    <p className="text-xs text-gray-500 mt-1">库存: {item.stock}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl font-bold text-cyber-yellow">{item.price}</span>
                  <button
                    onClick={() => handleExchangeItem(item.id)}
                    disabled={points < item.price || item.stock <= 0}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      points < item.price || item.stock <= 0
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white shadow-neon hover:shadow-lg'
                    }`}
                  >
                    兑换
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeMainTab === 'history' && (
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">暂无积分记录</p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.type === 'earn'
                          ? 'bg-green-500/20'
                          : 'bg-red-500/20'
                      }`}>
                        {transaction.type === 'earn' ? (
                          <ArrowUpRight className="w-5 h-5 text-green-400" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{transaction.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`font-display text-lg font-bold ${
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
