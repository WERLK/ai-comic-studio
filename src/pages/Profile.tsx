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
  Heart,
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { AppVersion } from '@/components/AppVersion';
import { 
  clearDatabase, 
  exportDatabase, 
  importDatabase, 
  downloadFile, 
  uploadFile,
  getDatabaseStatus,
  formatBytes 
} from '@/utils/database';

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
  const [showDatabaseManager, setShowDatabaseManager] = useState(false);
  const [dbStatus, setDbStatus] = useState(getDatabaseStatus());

  const handleClearAllData = () => {
    if (window.confirm('确定要清空所有数据吗？这将删除您的所有用户数据、积分记录和项目数据！')) {
      clearAllData();
      setDbStatus(getDatabaseStatus());
      navigate('/');
      window.location.reload();
    }
  };

  // 数据库管理功能
  const handleExportDatabase = () => {
    const result = exportDatabase();
    if (result.success) {
      downloadFile(JSON.stringify(result.data, null, 2), result.filename);
      alert('数据库导出成功！');
    } else {
      alert('数据库导出失败！');
    }
  };

  const handleImportDatabase = () => {
    uploadFile((content) => {
      const result = importDatabase(content);
      if (result.success) {
        setDbStatus(getDatabaseStatus());
        alert(`导入成功！共导入 ${result.importedCount} 条数据`);
        window.location.reload();
      } else {
        alert(`导入失败！\n${result.errors.join('\n')}`);
      }
    });
  };

  const handleClearDatabase = () => {
    if (window.confirm('确定要清空整个数据库吗？这将删除所有本地数据且无法恢复！')) {
      const result = clearDatabase();
      if (result.success) {
        setDbStatus(getDatabaseStatus());
        alert('数据库已清空！');
        window.location.reload();
      } else {
        alert(`清空时出现错误:\n${result.errors.join('\n')}`);
      }
    }
  };

  const handleRefreshStatus = () => {
    setDbStatus(getDatabaseStatus());
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

          <button
            onClick={() => setShowDatabaseManager(!showDatabaseManager)}
            className="w-full flex items-center gap-4 bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 hover:border-cyber-blue/50 rounded-2xl p-4 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-white">数据库管理</p>
              <p className="text-xs text-gray-400">查看和管理本地数据</p>
            </div>
            <div className={`text-gray-500 transition-transform ${showDatabaseManager ? 'rotate-90' : ''}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* 数据库管理面板 */}
          {showDatabaseManager && (
            <div className="bg-cyber-dark/50 border border-cyber-purple/30 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white">数据库状态</h3>
                <button 
                  onClick={handleRefreshStatus}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-cyber-dark2/80 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-cyber-blue">{dbStatus.recordCount}</p>
                  <p className="text-xs text-gray-400">数据表数量</p>
                </div>
                <div className="bg-cyber-dark2/80 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-cyber-yellow">{formatBytes(dbStatus.totalSize)}</p>
                  <p className="text-xs text-gray-400">占用空间</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleExportDatabase}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                >
                  <Download className="w-4 h-4" />
                  导出数据
                </button>
                <button
                  onClick={handleImportDatabase}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                >
                  <Upload className="w-4 h-4" />
                  导入数据
                </button>
              </div>

              <button
                onClick={handleClearDatabase}
                className="w-full py-2 px-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
                清空数据库
              </button>
            </div>
          )}
          
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
