import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trophy,
  Check,
  Lock,
  Star,
  Zap,
  Flame,
  Target,
  Award,
  Medal,
  Crown,
  Gem,
  Sparkles,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { AppVersion } from '@/components/AppVersion';

type AchievementStatus = 'unlocked' | 'in_progress' | 'locked';

interface Achievement {
  id: string;
  icon: any;
  name: string;
  description: string;
  points: number;
  progress?: number;
  target?: number;
  status: AchievementStatus;
  category: string;
}

const iconMap: Record<string, any> = {
  Trophy,
  Star,
  Zap,
  Flame,
  Target,
  Award,
  Medal,
  Crown,
  Gem,
  TrendingUp,
  Clock,
};

export function Achievements() {
  const navigate = useNavigate();
  const { user, points, totalEarnedPoints, level, completedTasks, achievementRewards } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'in_progress'>('all');

  // 从 achievementRewards 构建成就列表
  const buildAchievements = (): Achievement[] => {
    const achievements: Achievement[] = [];
    
    // 已解锁的成就示例
    const unlockedAchievements = [
      { id: 'first_task', icon: 'Star', name: '初次创作', description: '完成你的第一个漫剧任务', points: 50, status: 'unlocked' as AchievementStatus, category: '创作' },
      { id: 'early_adopter', icon: 'Zap', name: '早期用户', description: '在产品上线初期加入我们', points: 100, status: 'unlocked' as AchievementStatus, category: '身份' },
      { id: 'first_share', icon: 'Award', name: '分享达人', description: '首次分享你的作品', points: 30, status: 'unlocked' as AchievementStatus, category: '社交' },
    ];

    // 进行中的成就示例
    const inProgressAchievements = [
      { id: 'task_master', icon: 'Target', name: '任务大师', description: '累计完成10个任务', points: 200, progress: 3, target: 10, status: 'in_progress' as AchievementStatus, category: '创作' },
      { id: 'streak_7', icon: 'Flame', name: '连续7天', description: '保持7天连续活跃', points: 150, progress: 4, target: 7, status: 'in_progress' as AchievementStatus, category: '活跃' },
      { id: 'point_collector', icon: 'Gem', name: '积分收藏家', description: '累计获得500积分', points: 100, progress: 230, target: 500, status: 'in_progress' as AchievementStatus, category: '积分' },
    ];

    // 未解锁的成就示例
    const lockedAchievements = [
      { id: 'legend', icon: 'Crown', name: '传奇创作者', description: '累计获得50000积分', points: 1000, status: 'locked' as AchievementStatus, category: '成就' },
      { id: 'master', icon: 'Medal', name: '大师级创作', description: '累计获得10000积分', points: 500, status: 'locked' as AchievementStatus, category: '成就' },
      { id: 'influencer', icon: 'TrendingUp', name: '影响力达人', description: '分享作品被点赞10次', points: 200, status: 'locked' as AchievementStatus, category: '社交' },
      { id: 'night_owl', icon: 'Clock', name: '夜猫子', description: '在凌晨完成3个任务', points: 80, status: 'locked' as AchievementStatus, category: '活跃' },
    ];

    achievements.push(...unlockedAchievements, ...inProgressAchievements, ...lockedAchievements);
    return achievements;
  };

  const allAchievements = buildAchievements();

  // 统计计算
  const unlockedCount = allAchievements.filter(a => a.status === 'unlocked').length;
  const totalCount = allAchievements.length;
  const currentLevel = level || 1;
  const levelNames = ['探索者', '新手创作', '入门创作', '初级创作', '熟练创作', '创作新星', '资深创作', '创作达人', '大师级创作', '传奇创作者'];
  const currentLevelName = levelNames[currentLevel - 1] || '探索者';

  // Tab 过滤
  const filteredAchievements = allAchievements.filter(a => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unlocked') return a.status === 'unlocked';
    if (activeTab === 'in_progress') return a.status === 'in_progress';
    return true;
  });

  // 获取成就状态样式
  const getStatusStyle = (status: AchievementStatus) => {
    if (status === 'unlocked') {
      return {
        border: 'border-green-500/50',
        glow: 'shadow-green-500/30 shadow-lg',
        opacity: 'opacity-100',
      };
    }
    if (status === 'in_progress') {
      return {
        border: 'border-cyber-purple/40',
        glow: '',
        opacity: 'opacity-90',
      };
    }
    return {
      border: 'border-gray-700/50',
      glow: '',
      opacity: 'opacity-50',
    };
  };

  // 渲染成就卡片
  const renderAchievementCard = (achievement: Achievement) => {
    const Icon = iconMap[achievement.icon] || Trophy;
    const styles = getStatusStyle(achievement.status);
    const progressPercent = achievement.target ? (achievement.progress || 0) / achievement.target * 100 : 0;

    return (
      <div
        key={achievement.id}
        className={`bg-cyber-dark2/80 backdrop-blur-xl border ${styles.border} ${styles.glow} ${styles.opacity} rounded-2xl p-4 transition-all`}
      >
        <div className="flex items-start gap-3">
          {/* 图标区域 */}
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
            achievement.status === 'unlocked'
              ? 'bg-gradient-to-br from-green-400 to-emerald-600'
              : achievement.status === 'in_progress'
              ? 'bg-gradient-to-br from-cyber-pink to-cyber-purple'
              : 'bg-gray-700'
          }`}>
            {achievement.status === 'locked' ? (
              <Lock className="w-6 h-6 text-gray-500" />
            ) : achievement.status === 'unlocked' ? (
              <Check className="w-6 h-6 text-white" />
            ) : (
              <Icon className="w-6 h-6 text-white" />
            )}
          </div>

          {/* 内容区域 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-white text-sm truncate">{achievement.name}</h3>
              {achievement.status === 'unlocked' && (
                <span className="px-1.5 py-0.5 bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] rounded-full">
                  已解锁
                </span>
              )}
              {achievement.status === 'in_progress' && (
                <span className="px-1.5 py-0.5 bg-cyber-purple/20 border border-cyber-purple/30 text-cyber-pink text-[10px] rounded-full">
                  进行中
                </span>
              )}
              {achievement.status === 'locked' && (
                <span className="px-1.5 py-0.5 bg-gray-600/20 border border-gray-600/30 text-gray-400 text-[10px] rounded-full">
                  未解锁
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-2 line-clamp-2">{achievement.description}</p>

            {/* 进度条 */}
            {achievement.status === 'in_progress' && achievement.target && (
              <div className="mb-2">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-gray-400">进度</span>
                  <span className="text-cyber-pink">{achievement.progress}/{achievement.target}</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyber-pink to-cyber-purple transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* 积分奖励 */}
            <div className="flex items-center gap-1">
              <Gem className="w-3 h-3 text-cyber-yellow" />
              <span className="text-xs text-cyber-yellow font-medium">+{achievement.points}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid">
      {/* Header */}
      <header className="h-14 bg-cyber-dark2/80 backdrop-blur-xl border-b border-cyber-purple/20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/profile')} className="p-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-medium text-white text-sm md:text-base">我的成就</h1>
        </div>
        <div className="flex items-center gap-3">
          <AppVersion />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 统计概览卡片 */}
        <div className="bg-gradient-to-br from-cyber-purple/20 to-cyber-pink/20 border border-cyber-purple/30 rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber-yellow to-cyber-pink flex items-center justify-center shadow-lg shadow-cyber-yellow/20">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-bold text-white mb-1">
                {unlockedCount}/{totalCount} 成就
              </h2>
              <p className="text-gray-400 text-sm">
                Lv.{currentLevel} · {currentLevelName}
              </p>
            </div>
          </div>

          {/* 等级进度 */}
          <div className="mb-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">升级进度</span>
              <span className="text-cyber-yellow font-medium">
                {totalEarnedPoints ?? points ?? 0} 积分
              </span>
            </div>
            <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyber-yellow to-cyber-pink transition-all duration-1000"
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>

          {/* 统计指标 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-cyber-dark/50 rounded-xl p-3 text-center">
              <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <p className="font-display text-lg font-bold text-white">{unlockedCount}</p>
              <p className="text-xs text-gray-400">已解锁</p>
            </div>
            <div className="bg-cyber-dark/50 rounded-xl p-3 text-center">
              <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <p className="font-display text-lg font-bold text-white">{totalCount - unlockedCount - allAchievements.filter(a => a.status === 'in_progress').length}</p>
              <p className="text-xs text-gray-400">未解锁</p>
            </div>
            <div className="bg-cyber-dark/50 rounded-xl p-3 text-center">
              <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-gradient-to-br from-cyber-blue to-cyan-500 flex items-center justify-center">
                <Gem className="w-4 h-4 text-white" />
              </div>
              <p className="font-display text-lg font-bold text-white">{totalEarnedPoints ?? points ?? 0}</p>
              <p className="text-xs text-gray-400">累计积分</p>
            </div>
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-2 mb-6">
          {(['all', 'unlocked', 'in_progress'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white'
                  : 'bg-cyber-dark2/80 border border-cyber-purple/20 text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'all' ? '全部' : tab === 'unlocked' ? '已解锁' : '进行中'}
            </button>
          ))}
        </div>

        {/* 成就网格卡片列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {filteredAchievements.map((achievement) => renderAchievementCard(achievement))}
        </div>

        {/* 成就徽章墙 */}
        <div className="bg-cyber-dark2/60 border border-cyber-purple/20 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-cyber-yellow" />
            <h3 className="font-display text-lg font-medium text-white">成就徽章墙</h3>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {allAchievements.map((achievement) => {
              const Icon = iconMap[achievement.icon] || Trophy;
              const isUnlocked = achievement.status === 'unlocked';
              const isInProgress = achievement.status === 'in_progress';
              
              return (
                <div
                  key={achievement.id}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/20'
                      : isInProgress
                      ? 'bg-gradient-to-br from-cyber-purple/60 to-cyber-pink/60'
                      : 'bg-gray-700/50'
                  }`}
                  title={achievement.name}
                >
                  {achievement.status === 'locked' ? (
                    <Lock className={`w-5 h-5 text-gray-500`} />
                  ) : achievement.status === 'unlocked' ? (
                    <Icon className="w-5 h-5 text-white" />
                  ) : (
                    <Icon className="w-5 h-5 text-white/70" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
