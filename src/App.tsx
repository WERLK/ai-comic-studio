import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Studio, Generator, Preview, Login, PointsCenter } from '@/pages';
import { useAuthStore } from '@/stores';
import { Sparkles, Coins, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { AppVersion } from '@/components/AppVersion';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, points } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAuthPage = location.pathname === '/login' || location.pathname.startsWith('/#/login');

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid pb-16">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cyber-dark2/90 backdrop-blur-xl border-b border-cyber-purple/20 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-white hidden sm:block">AI漫剧</span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                onClick={() => navigate('/points')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyber-purple/20 border border-cyber-purple/30 hover:border-cyber-pink/50 transition-all"
              >
                <Coins className="w-4 h-4 text-cyber-yellow" />
                <span className="font-medium text-cyber-yellow">{points}</span>
              </button>
            )}

            <div className="hidden sm:block">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-medium">{user?.username}</span>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyber-pink to-cyber-purple text-white font-medium shadow-neon hover:shadow-lg transition-all"
                >
                  登录
                </button>
              )}
            </div>

            <button
              className="sm:hidden p-2 text-gray-400 hover:text-white transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="sm:hidden mt-3 pt-3 border-t border-cyber-purple/20">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-medium">{user?.username}</span>
                </div>
                <button
                  onClick={() => {
                    navigate('/points');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Coins className="w-4 h-4" />
                  积分中心
                </button>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-red-400 hover:text-red-300 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  navigate('/login');
                  setIsMenuOpen(false);
                }}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyber-pink to-cyber-purple text-white font-medium text-center"
              >
                登录
              </button>
            )}
          </div>
        )}
      </nav>

      <div className="pt-16">
        <Routes>
          <Route path="/" element={<Studio />} />
          <Route path="/generator/:projectId" element={<Generator />} />
          <Route path="/preview/:projectId" element={<Preview />} />
          <Route path="/login" element={<Login />} />
          <Route path="/points" element={<PointsCenter />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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
