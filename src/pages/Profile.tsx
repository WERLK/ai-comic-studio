import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  ArrowLeft, 
  Settings, 
  Gift, 
  Trophy, 
  Calendar, 
  Coins, 
  LogOut, 
  Palette, 
  Bell, 
  HelpCircle,
  Shield,
  CreditCard,
  Activity,
  Cpu,
  Heart
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { AppVersion } from '@/components/AppVersion';

const MenuItem = ({ 
  icon: Icon, 
  label, 
  onClick, 
  color = 'from-cyber-pink to-cyber-purple',
  subLabel 
}: { 
  icon: any; 
  label: string; 
  onClick?: () => void; 
  color?: string;
  subLabel?: string;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 hover:border-cyber-pink/50 rounded-2xl p-4 transition-all group"
  >
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="flex-1 text-left">
      <p className="font-medium text-white">{label}</p>
      {subLabel && (
        <p className="text-xs text-gray-400">{subLabel}</p>
      )}
    </div>
    <div className="text-gray-500 group-hover:text-cyber-pink transition-colors">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </button>
);

export function Profile() {
  const navigate = useNavigate();
  const { user, points, logout, clearAllData, transactions } = useAuthStore();
  
  const [showSettings, setShowSettings] = useState(false);

  const handleClearAllData = () => {
    if (window.confirm('确定要清空所有数据吗？这将删除您的所有用户数据、积分记录和项目数据！')) {
      clearAllData();
      navigate('/');
      window.location.reload();
    }
  };

  const getLevel = (pts: number) => {
    if (pts >= 50000) return { level: 10, name: '传奇创作者' };
    if (pts >= 10000) return { level: 9, name: '大师级创作' };
    if (pts >= 3000) return { level: 8, name: '创作达人' };
    if (pts >= 1000) return { level: 7, name: '资深创作' };
    if (pts >= 500) return { level: 6, name: '创作新星' };
    if (pts >= 200) return { level: 5, name: '熟练创作' };
    if (pts >= 100) return { level: 4, name: '初级创作' };
    if (pts >= 50) return { level: 3, name: '入门创作' };
    if (pts >= 10) return { level: 2, name: '新手创作' };
    return { level: 1, name: '探索者' };
  };

  const levelData = getLevel(points);

  const getNextLevelPoints = (current: number) => {
    const levels = [10, 50, 100, 200, 500, 1000, 3000, 10000, 50000, Infinity];
    for (const lvl of levels) {
      if (current < lvl) return lvl;
    }
    return Infinity;
  };

  const nextLevelPoints = getNextLevelPoints(points);
  const progressPercent = nextLevelPoints === Infinity ? 100 : (points / nextLevelPoints) * 100;

  const stats = [
    { icon: Trophy, label: '已完成任务', value: transactions.filter(t => t.type === 'earn').length, color: 'from-cyber-yellow to-cyber-pink' },
    { icon: Calendar, label: '注册天数', value: user?.createdAt ? Math.ceil((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 1, color: 'from-cyber-blue to-cyber-purple' },
    { icon: Heart, label: '累计积分', value: points + (user?.totalPointsEarned || 0), color: 'from-pink-400 to-red-500' },
  ];

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid">
      {/* Header */}
      <header className="h-14 bg-cyber-dark2/80 backdrop-blur-xl border-b border-cyber-purple/20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-medium text-white text-sm md:text-base">个人中心</h1>
        </div>
        <div className="flex items-center gap-3">
          <AppVersion />
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-cyber-purple/20 to-cyber-pink/20 border border-cyber-purple/30 rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center shadow-2xl shadow-cyber-pink/30">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold text-white mb-1">
                {user?.username || '用户'}
              </h2>
              <p className="text-gray-400 text-sm">
                Lv.{levelData.level} · {levelData.name}
              </p>
            </div>
          </div>

          {/* Level Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">升级进度</span>
              <span className="text-cyber-yellow font-medium">
                {points}/{nextLevelPoints === Infinity ? 'MAX' : nextLevelPoints}
              </span>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyber-pink to-cyber-purple to-cyber-yellow transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-cyber-dark/50 rounded-2xl p-3 text-center">
                  <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-display text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          <MenuItem 
            icon={Coins} 
            label="积分中心" 
            subLabel="查看任务和商城"
            color="from-cyber-yellow to-cyber-pink"
            onClick={() => navigate('/points')}
          />
          
          <MenuItem 
            icon={Trophy} 
            label="我的成就" 
            subLabel="查看获得的徽章"
            color="from-pink-400 to-purple-500"
          />
          
          <MenuItem 
            icon={Activity} 
            label="创作记录" 
            subLabel="查看漫剧历史"
            color="from-cyan-400 to-blue-500"
          />

          <div className="h-px bg-cyber-purple/20 my-4" />

          <MenuItem 
            icon={Settings} 
            label="设置" 
            subLabel="应用配置"
            color="from-gray-500 to-gray-600"
          />
          
          <MenuItem 
            icon={Bell} 
            label="通知" 
            subLabel="消息提醒"
            color="from-blue-400 to-cyan-500"
          />
          
          <MenuItem 
            icon={Shield} 
            label="隐私安全" 
            subLabel="账号保护"
            color="from-green-400 to-emerald-500"
          />
          
          <MenuItem 
            icon={HelpCircle} 
            label="帮助与反馈" 
            subLabel="常见问题"
            color="from-orange-400 to-red-500"
          />

          <div className="h-px bg-cyber-purple/20 my-4" />

          <button
            onClick={handleClearAllData}
            className="w-full flex items-center gap-4 bg-orange-500/10 border border-orange-500/30 hover:border-orange-500/50 hover:bg-orange-500/20 rounded-2xl p-4 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center flex-shrink-0">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-orange-400">清空所有数据</p>
              <p className="text-xs text-gray-400">删除所有本地存储的数据</p>
            </div>
          </button>

          <div className="h-px bg-cyber-purple/20 my-4" />

          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-4 bg-red-500/10 border border-red-500/30 hover:border-red-500/50 hover:bg-red-500/20 rounded-2xl p-4 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-red-400">退出登录</p>
              <p className="text-xs text-gray-400">安全退出当前账号</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
