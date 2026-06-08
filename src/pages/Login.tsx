import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, User, Mail, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores';

export function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [showRegister, setShowRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (showRegister) {
      if (!email) {
        setError('请填写邮箱');
        return;
      }
    }

    if (!username || !password) {
      setError('请填写所有必填项');
      return;
    }

    const success = showRegister 
      ? await useAuthStore.getState().register({ username, email, password })
      : await login({ username, password });

    if (success) {
      navigate('/');
    } else {
      setError(showRegister ? '用户名或邮箱已存在' : '用户名或密码错误');
    }
  };

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center shadow-neon">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold neon-text-pink mb-2">
            {showRegister ? '注册账户' : '欢迎回来'}
          </h1>
          <p className="text-gray-400">
            {showRegister ? '创建您的AI漫剧制作账户' : '登录继续您的创作之旅'}
          </p>
        </div>

        <div className="bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full pl-10 pr-4 py-3 bg-cyber-dark border border-cyber-purple/30 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyber-pink transition-colors"
                />
              </div>
            </div>

            {showRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  邮箱
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入邮箱"
                    className="w-full pl-10 pr-4 py-3 bg-cyber-dark border border-cyber-purple/30 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyber-pink transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-10 pr-4 py-3 bg-cyber-dark border border-cyber-purple/30 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyber-pink transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-cyber-pink to-cyber-purple shadow-neon hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                showRegister ? '注册' : '登录'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {showRegister ? '已有账户？' : '还没有账户？'}{' '}
              <button
                onClick={() => {
                  setShowRegister(!showRegister);
                  setError('');
                }}
                className="text-cyber-pink hover:text-cyber-blue transition-colors font-medium"
              >
                {showRegister ? '立即登录' : '免费注册'}
              </button>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            ← 继续浏览
          </button>
        </div>
      </div>
    </div>
  );
}
