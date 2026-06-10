import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ArrowLeft,
  Settings,
  Trophy,
  Calendar,
  Coins,
  LogOut,
  Bell,
  HelpCircle,
  Shield,
  Activity,
  Heart,
  Download,
  Upload,
  Sparkles,
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
  const { user, points, totalEarnedPoints, logout, transactions, exportUserData, importUserData } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const flashMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleComingSoon = (name: string) => {
    flashMessage(`${name}功能即将上线，敬请期待！`);
  };


  const handleExportUser = () => {
    const json = exportUserData();
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_comic_user_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flashMessage('用户数据已导出，请在新设备登录后导入以同步');
  };

  const handleImportUserClick = () => fileInputRef.current?.click();
  const handleImportUserFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const ok = importUserData(content);
      flashMessage(ok ? '用户数据导入成功，账号信息已同步！' : '导入失败：文件格式不正确');
    };
    reader.readAsText(file);
    e.target.value = '';
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

  const earnCount = Array.isArray(transactions) ? transactions.filter((t: any) => t.type === 'earn').length : 0;
  const daysSinceCreated = user?.createdAt ? Math.max(1, Math.ceil((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))) : 1;

  const stats = [
    { icon: Trophy, label: '已完成任务', value: earnCount, color: 'from-cyber-yellow to-cyber-pink' },
    { icon: Calendar, label: '注册天数', value: daysSinceCreated, color: 'from-cyber-blue to-cyber-purple' },
    { icon: Heart, label: '累计积分', value: totalEarnedPoints ?? points ?? 0, color: 'from-pink-400 to-red-500' },
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

        {/* 消息提示 */}
        {message && (
          <div className="mb-4 bg-green-500/20 border border-green-500/30 rounded-2xl p-3">
            <p className="text-green-400 text-sm text-center">{message}</p>
          </div>
        )}

        {/* 跨设备同步 */}
        <div className="bg-cyber-dark2/60 border border-cyber-purple/20 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-cyber-blue" />
            <p className="text-sm font-medium text-gray-200">跨设备同步账号</p>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">
            账号数据保存在后端服务器，登录后自动从云端同步。也可手动导出/导入 JSON 文件作为备份。
          </p>
          <div className="flex gap-2">
            <button onClick={handleExportUser} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-cyber-blue/15 hover:bg-cyber-blue/25 border border-cyber-blue/40 text-cyber-blue text-xs font-medium rounded-xl transition-colors">
              <Download className="w-3.5 h-3.5" /> 导出数据
            </button>
            <button onClick={handleImportUserClick} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-cyber-pink/15 hover:bg-cyber-pink/25 border border-cyber-pink/40 text-cyber-pink text-xs font-medium rounded-xl transition-colors">
              <Upload className="w-3.5 h-3.5" /> 导入数据
            </button>
            <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleImportUserFile} className="hidden" />
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
            onClick={() => navigate('/achievements')}
          />

          <MenuItem
            icon={Activity}
            label="创作记录"
            subLabel="查看漫剧历史"
            color="from-cyan-400 to-blue-500"
            onClick={() => navigate('/')}
          />

          <MenuItem
            icon={Settings}
            label="系统设置"
            subLabel="应用配置与API"
            color="from-gray-500 to-gray-600"
            onClick={() => navigate('/settings')}
          />

          <MenuItem
            icon={Bell}
            label="消息通知"
            subLabel="系统消息与提醒"
            color="from-blue-400 to-cyan-500"
            onClick={() => navigate('/notifications')}
          />

          <MenuItem
            icon={Shield}
            label="隐私安全"
            subLabel="账号保护与权限"
            color="from-green-400 to-emerald-500"
            onClick={() => navigate('/privacy-security')}
          />

          <MenuItem
            icon={HelpCircle}
            label="帮助与反馈"
            subLabel="常见问题与客服"
            color="from-orange-400 to-red-500"
            onClick={() => navigate('/help-feedback')}
          />

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
