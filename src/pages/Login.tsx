import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, User, Mail, Loader2, Eye, EyeOff, Download, Upload, Smartphone } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { AppVersion } from '@/components/AppVersion';

export function Login() {
  const navigate = useNavigate();
  const { isLoading, exportUserData, importUserData } = useAuthStore();
  const [showRegister, setShowRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('请填写用户名和密码');
      return;
    }

    const result = showRegister
      ? await useAuthStore.getState().register({ username, email, password })
      : await useAuthStore.getState().login({ username, password });

    if (result.ok) {
      navigate('/');
      return;
    }

    // 根据后端返回的错误码显示不同提示
    const code = result.code;
    if (code === 'USER_NOT_FOUND') {
      setError('该账号尚未注册，请先注册或检查用户名是否正确');
    } else if (code === 'WRONG_PASSWORD') {
      setError('密码错误，请重新输入');
    } else if (code === 'USER_EXISTS') {
      setError('该用户名已注册，请直接登录或更换用户名');
    } else if (code === 'MISSING_FIELDS') {
      setError('用户名和密码不能为空');
    } else if (code === 'NETWORK_ERROR') {
      setError('网络连接异常，请检查网络后重试');
    } else {
      setError(result.message || (showRegister ? '注册失败，请稍后重试' : '登录失败，请稍后重试'));
    }
  };

  const handleExport = () => {
    const json = exportUserData();
    if (!json) {
      setError('请先登录后再导出数据');
      return;
    }
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_comic_user_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSyncMessage('用户数据已导出，请在另一设备登录后导入以同步数据');
    setTimeout(() => setSyncMessage(null), 5000);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const ok = importUserData(content);
      if (ok) {
        setSyncMessage('数据导入成功！已同步积分、任务和等级信息');
        setTimeout(() => {
          setSyncMessage(null);
          navigate('/');
        }, 2000);
      } else {
        setError('导入失败：文件格式不正确或已损坏');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid">
      <header className="h-14 bg-cyber-dark2/80 backdrop-blur-xl border-b border-cyber-purple/20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-display font-medium text-white text-sm md:text-base">AI 漫剧工作室</h1>
        </div>
        <div className="flex items-center gap-3">
          <AppVersion />
        </div>
      </header>

      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-3.5rem)]">
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
                <label className="block text-sm font-medium text-gray-300 mb-2">用户名</label>
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
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    邮箱 <span className="text-gray-500 text-xs">(选填)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="选填，用于找回密码"
                      className="w-full pl-10 pr-4 py-3 bg-cyber-dark/50 border border-cyber-purple/20 rounded-xl text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-cyber-pink/50 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full pl-10 pr-12 py-3 bg-cyber-dark border border-cyber-purple/30 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyber-pink transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              {syncMessage && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3">
                  <p className="text-green-400 text-sm">{syncMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-cyber-pink to-cyber-purple shadow-neon hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (showRegister ? '注册' : '登录')}
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

          <div className="mt-6 bg-cyber-dark2/40 border border-cyber-purple/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-4 h-4 text-cyber-blue" />
              <p className="text-sm font-medium text-gray-300">跨设备数据同步</p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              账号数据保存在后端服务器，登录后自动从云端同步；也可使用下方手动导出/导入 JSON 文件作为备份。
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-cyber-blue/10 hover:bg-cyber-blue/20 border border-cyber-blue/30 text-cyber-blue text-xs font-medium rounded-xl transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                导出数据
              </button>
              <button
                type="button"
                onClick={handleImportClick}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-cyber-pink/10 hover:bg-cyber-pink/20 border border-cyber-pink/30 text-cyber-pink text-xs font-medium rounded-xl transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                导入数据
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          </div>

          <div className="mt-6 text-center">
            <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              ← 继续浏览
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
