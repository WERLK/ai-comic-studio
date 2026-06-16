import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { Sparkles, Coins, LogOut, User, Menu, X, Bell, Settings2, Wrench, Database } from 'lucide-react';
import { useState, lazy, Suspense, useEffect } from 'react';
import { AppVersion } from '@/components/AppVersion';
import { getBrowserFixClass } from '@/utils/browserDetector';

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
const CloudDatabaseConfig = lazy(() => import('@/pages/CloudDatabaseConfig').then(m => ({ default: m.CloudDatabaseConfig })));
const VIPCenter = lazy(() => import('@/pages/VIPCenter').then(m => ({ default: m.VIPCenter })));
const NovelPromotionCenter = lazy(() => import('@/pages/NovelPromotionCenter').then(m => ({ default: m.NovelPromotionCenter })));
const AIConfigPage = lazy(() => import('@/pages/AIConfigPage').then(m => ({ default: m.AIConfigPage })));
const ToolsPage = lazy(() => import('@/pages/ToolsPage').then(m => ({ default: m.ToolsPage })));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">加载中...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, points, autoLogin, apiAvailable, isOnline, checkNetworkStatus, refreshNetworkStatus } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [browserFixClass, setBrowserFixClass] = useState('');
  useEffect(() => {
    autoLogin();
    setBrowserFixClass(getBrowserFixClass());
    checkNetworkStatus();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsMenuOpen(false);
      refreshNetworkStatus();
    };
    const handleOffline = () => {
      setIsMenuOpen(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshNetworkStatus]);

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
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 ${browserFixClass}`}>
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/5 backdrop-blur-xl border-b border-gray-700/30 px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-all duration-300">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display font-bold text-white text-lg tracking-tight">AI漫剧工作室</h1>
              <p className="text-[10px] text-gray-500 -mt-0.5">AI Comic Studio</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/tools')}
              className="p-2 rounded-lg bg-black/30 border border-gray-600/30 hover:border-indigo-500/50 hover:bg-black/50 transition-all"
              title="功能中心"
            >
              <Wrench className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>

            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-lg bg-black/30 border border-gray-600/30 hover:border-indigo-500/50 hover:bg-black/50 transition-all"
            >
              <Bell className="w-5 h-5 text-gray-400 hover:text-white" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-lg bg-black/30 border border-gray-600/30 hover:border-indigo-500/50 hover:bg-black/50 transition-all"
            >
              <Settings2 className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>

            <div className="hidden md:block">
              {isAuthenticated ? (
                <div className="flex items-center gap-3 pl-2 border-l border-gray-700/30">
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/30 border border-gray-600/30 hover:border-indigo-500/50 hover:bg-black/50 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-medium text-sm hidden lg:block">{user?.username}</span>
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 ml-2"
                >
                  登录
                </button>
              )}
            </div>

            <button
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-black/30 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-gray-700/30 bg-black/50 backdrop-blur-xl rounded-b-xl overflow-hidden">
            {isAuthenticated ? (
              <div className="space-y-1 px-3 py-2">
                <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-black/30 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{user?.username}</p>
                    <p className="text-xs text-gray-500">已登录 · {points} 积分</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigate('/tools');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-black/30 transition-all flex items-center gap-3"
                >
                  <Wrench className="w-5 h-5" />
                  功能中心
                </button>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-black/30 transition-all flex items-center gap-3"
                >
                  <User className="w-5 h-5" />
                  个人中心
                </button>
                <button
                  onClick={() => {
                    navigate('/notifications');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-black/30 transition-all flex items-center gap-3"
                >
                  <Bell className="w-5 h-5" />
                  通知消息
                </button>
                <button
                  onClick={() => {
                    navigate('/settings');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-black/30 transition-all flex items-center gap-3"
                >
                  <Settings2 className="w-5 h-5" />
                  设置
                </button>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all flex items-center gap-3"
                >
                  <LogOut className="w-5 h-5" />
                  退出登录
                </button>
              </div>
            ) : (
              <div className="px-3 py-3">
                <button
                  onClick={() => {
                    navigate('/login');
                    setIsMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-center shadow-lg"
                >
                  登录
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="pt-16 pb-20">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Studio />} />
            <Route path="/tools" element={<ToolsPage />} />
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
            <Route path="/cloud-database" element={<CloudDatabaseConfig />} />
            <Route path="/vip" element={<VIPCenter />} />
            <Route path="/novel-promotion" element={<NovelPromotionCenter />} />
            <Route path="/ai-config" element={<AIConfigPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-xl border-t border-gray-700/30 px-4 py-3">
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
