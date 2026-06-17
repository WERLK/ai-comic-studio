import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import {
  Sparkles,
  Clock,
  Wifi,
  WifiOff,
  Coins,
  Trophy,
  Database,
  Settings2,
  Bell,
  BookOpen,
  Crown,
  Bot,
  Shield,
  HelpCircle,
  ChevronRight,
  User,
  LogOut,
  ArrowLeft,
  Sparkles as SparklesIcon,
} from 'lucide-react';
import { AppVersion } from '@/components/AppVersion';

function VerticalClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-gray-700/30">
      <Clock className="w-4 h-4 text-indigo-400" />
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-white font-bold tabular-nums">{timeStr}</span>
        <span className="text-xs text-gray-400">{dateStr}</span>
        <span className="text-xs text-gray-500">{weekdays[now.getDay()]}</span>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  onClick,
}: {
  icon: any;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-5 rounded-2xl bg-white/5 border border-gray-700/30 hover:border-indigo-500/40 hover:bg-white/10 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-white text-base">{title}</h3>
            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 transition-colors" />
          </div>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
    </button>
  );
}

export function ToolsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, points, apiAvailable, isOnline, logout } = useAuthStore();

  const tools = [
    {
      icon: Coins,
      title: '积分中心',
      description: '查看积分明细，赚取和兑换积分',
      color: 'bg-yellow-500/10 text-yellow-400',
      path: '/points',
      auth: true,
    },
    {
      icon: Trophy,
      title: '成就中心',
      description: '追踪你的成就进度和奖励',
      color: 'bg-orange-500/10 text-orange-400',
      path: '/achievements',
      auth: true,
    },
    {
      icon: Crown,
      title: 'VIP 中心',
      description: '升级会员等级，解锁专属权益',
      color: 'bg-purple-500/10 text-purple-400',
      path: '/vip',
      auth: true,
    },
    {
      icon: Database,
      title: '云端数据库',
      description: '管理云端数据，实现多端同步',
      color: 'bg-blue-500/10 text-blue-400',
      path: '/cloud-database',
      auth: true,
    },
    {
      icon: Bot,
      title: 'AI API 配置',
      description: '配置 AI 模型和 API 密钥',
      color: 'bg-cyan-500/10 text-cyan-400',
      path: '/ai-config',
      auth: false,
    },
    {
      icon: BookOpen,
      title: '短剧推广达人中心',
      description: '推广短剧，赚取佣金收益',
      color: 'bg-pink-500/10 text-pink-400',
      path: '/novel-promotion',
      auth: false,
    },
    {
      icon: Bell,
      title: '通知消息',
      description: '查看系统通知和消息提醒',
      color: 'bg-indigo-500/10 text-indigo-400',
      path: '/notifications',
      auth: true,
    },
    {
      icon: Settings2,
      title: '设置',
      description: '自定义应用设置和偏好',
      color: 'bg-gray-500/10 text-gray-300',
      path: '/settings',
      auth: false,
    },
    {
      icon: Shield,
      title: '隐私与安全',
      description: '管理数据安全和隐私设置',
      color: 'bg-emerald-500/10 text-emerald-400',
      path: '/privacy-security',
      auth: false,
    },
    {
      icon: HelpCircle,
      title: '帮助与反馈',
      description: '使用指南、常见问题和意见反馈',
      color: 'bg-teal-500/10 text-teal-400',
      path: '/help-feedback',
      auth: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="sticky top-16 z-40 bg-white/5 backdrop-blur-xl border-b border-gray-700/30 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-gray-700/30 transition-all flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-white text-lg">功能中心</h1>
                <p className="text-xs text-gray-400 hidden sm:block">所有工具和功能入口</p>
              </div>
            </div>
          </div>
          <VerticalClock />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Status Card */}
        <div className="p-5 rounded-2xl bg-white/5 border border-gray-700/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                  apiAvailable
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : isOnline
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {apiAvailable ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="text-xs font-medium">
                  {apiAvailable ? '服务器已连接' : isOnline ? '网络在线' : '无网络连接'}
                </span>
              </div>

              {isAuthenticated && user && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-gray-700/30">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-gray-300">{user.username}</span>
                </div>
              )}

              {isAuthenticated && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="font-bold text-yellow-400 text-sm">{points}</span>
                  <span className="text-xs text-yellow-400/70">积分</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <button
                  onClick={() => logout()}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-gray-700/30 hover:border-red-500/40 hover:bg-red-500/10 text-gray-300 hover:text-red-400 transition-all flex items-center gap-1.5 text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>退出登录</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
                >
                  登录账号
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="space-y-4">
          {isAuthenticated && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">会员功能</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tools.filter(t => t.auth).map(tool => (
                  <FeatureCard
                    key={tool.path}
                    icon={tool.icon}
                    title={tool.title}
                    description={tool.description}
                    color={tool.color}
                    onClick={() => navigate(tool.path)}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">通用功能</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tools.filter(t => !t.auth).map(tool => (
                <FeatureCard
                  key={tool.path}
                  icon={tool.icon}
                  title={tool.title}
                  description={tool.description}
                  color={tool.color}
                  onClick={() => navigate(tool.path)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Version info */}
        <div className="pt-4 pb-8 flex items-center justify-center">
          <AppVersion />
        </div>
      </div>
    </div>
  );
}
