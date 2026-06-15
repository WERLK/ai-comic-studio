import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { Sparkles, Coins, LogOut, User, Menu, X, Bell, Settings2 } from 'lucide-react';
import { useState, lazy, Suspense, useEffect } from 'react';
import { AppVersion } from '@/components/AppVersion';
import { VerticalClock } from '@/components/VerticalClock';

// 路由级懒加载 - 按需加载页面组件，大幅提升首屏速度
const Studio = lazy(() => import('@/pages/Studio').then(m => ({ default: m.Studio })));
const Generator = lazy(() => import('@/pages/Generator').then(m => ({ default: m.Generator })));
const Preview = lazy(() => import('@/pages/Preview').then(m => ({ default: m.Preview })));
const Login = lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })));
const PointsCenter = lazy(() => import('@/pages/PointsCenter').then(m => ({ default: m.PointsCenter })));
const Profile = lazy(() => import('@/pages/Profile').then(m => ({ default: m.Profile })));
const Achievements = lazy(() => import('@/pages/Achievements').then(m => ({ default: m.Achievements })));
const Settings = lazy(() => import('@/pages/Settings').then(m => ({ default: m.Settings })));
const Notifications = lazy(() => import('@/pages/Notifications').then(m => ({ default: m.Notifications })));
const PrivacySecurity = lazy(() => import('@/pages/PrivacySecurity').then(m => ({ default: m.PrivacySecurity })));
const HelpFeedback = lazy(() => import('@/pages/HelpFeedback').then(m => ({ default: m.HelpFeedback })));
const ApiConfig = lazy(() => import('@/pages/ApiConfig').then(m => ({ default: m.ApiConfig })));
const VIPCenter = lazy(() => import('@/pages/VIPCenter').then(m => ({ default: m.VIPCenter })));
const NovelPromotionCenter = lazy(() => import('@/pages/NovelPromotionCenter').then(m => ({ default: m.NovelPromotionCenter })));

// 页面加载占位组件
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-cyber-purple/30 border-t-cyber-pink rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">加载中...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, points, autoLogin } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 应用首次加载时尝试自动登录（记住登录状态）
  useEffect(() => {
    autoLogin();
  }, []);

  const isAuthPage = location.pathname === '/login' || location.pathname.startsWith('/#/login');

  if (isAuthPage) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid pb-24">
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-b from-cyber-dark/95 via-cyber-dark2/90 to-cyber-dark2/80 backdrop-blur-xl border-b border-cyber-purple/10 px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-pink via-cyber-purple to-cyber-blue flex items-center justify-center shadow-lg shadow-cyber-purple/20 group-hover:shadow-cyber-pink/30 transition-all duration-300">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display font-bold text-white text-lg tracking-tight">AI漫剧工作室</h1>
              <p className="text-[10px] text-gray-500 -mt-0.5">AI Comic Studio</p>
            </div>
          </div>

          {/* 中间时间显示 */}
          <div className="hidden md:flex items-center">
            <VerticalClock />
          </div>

          <div className="flex items-center gap-2">
            {/* 通知按钮 */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-lg bg-cyber-dark/50 border border-cyber-purple/20 hover:border-cyber-pink/40 hover:bg-cyber-dark transition-all"
            >
              <Bell className="w-5 h-5 text-gray-400 hover:text-white" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-cyber-pink rounded-full"></span>
            </button>

            {/* 设置按钮 */}
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-lg bg-cyber-dark/50 border border-cyber-purple/20 hover:border-cyber-blue/40 hover:bg-cyber-dark transition-all"
            >
              <Settings2 className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>

            {isAuthenticated && (
              <button
                onClick={() => navigate('/points')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-cyber-yellow/10 to-cyber-orange/10 border border-cyber-yellow/30 hover:border-cyber-yellow/50 hover:bg-cyber-yellow/15 transition-all"
              >
                <Coins className="w-4 h-4 text-cyber-yellow" />
                <span className="font-bold text-cyber-yellow text-sm">{points}</span>
              </button>
            )}

            <div className="hidden sm:block">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyber-dark/80 border border-cyber-purple/20 hover:border-cyber-pink/40 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center shadow-sm">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-medium text-sm">{user?.username}</span>
                  </button>
                  <button
                    onClick={() => logout()}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyber-pink via-cyber-purple to-cyber-blue text-white font-medium shadow-lg shadow-cyber-purple/25 hover:shadow-xl hover:shadow-cyber-pink/30 transition-all duration-300"
                >
                  登录
                </button>
              )}
            </div>

            <button
              className="sm:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-cyber-dark transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="sm:hidden mt-3 pt-3 border-t border-cyber-purple/10 bg-cyber-dark/90 backdrop-blur-xl rounded-b-xl overflow-hidden">
            <div className="px-3 py-2">
              <VerticalClock />
            </div>
            {isAuthenticated ? (
              <div className="space-y-1 px-3 py-2">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-cyber-dark/50">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{user?.username}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Coins className="w-3 h-3 text-cyber-yellow" />
                      {points} 积分
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-cyber-dark/50 transition-all flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  个人中心
                </button>
                <button
                  onClick={() => {
                    navigate('/points');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-cyber-dark/50 transition-all flex items-center gap-2"
                >
                  <Coins className="w-4 h-4 text-cyber-yellow" />
                  积分中心
                </button>
                <button
                  onClick={() => {
                    navigate('/notifications');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-cyber-dark/50 transition-all flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  通知消息
                </button>
                <button
                  onClick={() => {
                    navigate('/settings');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-cyber-dark/50 transition-all flex items-center gap-2"
                >
                  <Settings2 className="w-4 h-4" />
                  设置
                </button>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            ) : (
              <div className="px-3 py-2">
                <button
                  onClick={() => {
                    navigate('/login');
                    setIsMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyber-pink via-cyber-purple to-cyber-blue text-white font-medium text-center shadow-lg"
                >
                  登录
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="pt-16">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Studio />} />
            <Route path="/generator/:projectId" element={<Generator />} />
            <Route path="/preview/:projectId" element={<Preview />} />
            <Route path="/login" element={<Login />} />
            <Route path="/points" element={<PointsCenter />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/privacy-security" element={<PrivacySecurity />} />
            <Route path="/help-feedback" element={<HelpFeedback />} />
            <Route path="/api-config" element={<ApiConfig />} />
            <Route path="/vip" element={<VIPCenter />} />
            <Route path="/novel-promotion" element={<NovelPromotionCenter />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>

      {/* Footer with Version */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-cyber-dark2/90 backdrop-blur-xl border-t border-cyber-purple/20 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-xs text-gray-500">
            © 2026 AI漫剧工作室
          </div>
          <AppVersion />
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
