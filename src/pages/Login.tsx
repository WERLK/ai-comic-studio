import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, User, Mail, Loader2, Eye, EyeOff, Download, Upload, Smartphone, Github } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { AppVersion } from '@/components/AppVersion';
import { registerGitHubUser, loginGitHubUser, checkGitHubService, setGitHubToken, getGitHubToken } from '@/utils/githubDatabase';

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
  const [githubToken, setGithubToken] = useState(getGitHubToken());
  const [showTokenInput, setShowTokenInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('请填写用户名和密码');
      return;
    }

    const token = getGitHubToken();
    if (!token) {
      setError('请先配置 GitHub Token');
      setShowTokenInput(true);
      return;
    }

    try {
      // 检查 GitHub 服务是否可用
      const isHealthy = await checkGitHubService(token);
      if (!isHealthy) {
        setError('GitHub 服务连接失败，请检查 Token 是否有效');
        return;
      }

      // 调用 GitHub 数据库 API
      const result = showRegister
        ? await registerGitHubUser(token, { username, password, email })
        : await loginGitHubUser(token, { username, password });

      if (result.success && result.user) {
        // 更新 store
        useAuthStore.setState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          points: result.user.points ?? 50,
          totalEarnedPoints: result.user.totalEarnedPoints ?? 50,
          level: result.user.level ?? 1,
          projectsCount: result.user.projectsCount ?? 0,
          isVIP: !!result.user.isVIP,
          vipLevel: result.user.vipLevel ?? 0,
          vipPoints: result.user.vipPoints ?? 0,
          vipExpireAt: result.user.vipExpireAt ?? null,
          completedTasks: result.user.completedTasks || [],
          visitedPages: result.user.visitedPages || [],
          usedStyles: result.user.usedStyles || [],
          transactions: result.user.transactions || [],
        });

        navigate('/');
      } else {
        setError(result.error || (showRegister ? '注册失败' : '登录失败'));
      }
    } catch (err: any) {
      setError(err?.message || (showRegister ? '注册失败' : '登录失败'));
    }
  };

  const handleSaveToken = () => {
    if (!githubToken) {
      setError('请输入 GitHub Token');
      return;
    }
    setGitHubToken(githubToken);
    setShowTokenInput(false);
    setSyncMessage('GitHub Token 已保存');
    setTimeout(() => setSyncMessage(null), 3000);
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
      let content = ev.target?.result as string;
      if (content && typeof content === 'string') {
        content = content.replace(/^\uFEFF/, '');
      }
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
    reader.readAsText(file, 'utf-8');
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
            {/* GitHub Token 配置 */}
            <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Github className="w-4 h-4 text-yellow-400" />
                <p className="text-sm font-medium text-yellow-400">GitHub 云端数据库</p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                使用 GitHub Issues 作为云端数据库，无需额外服务器。首次使用需要配置 GitHub Token。
              </p>
              {!showTokenInput ? (
                <button
                  onClick={() => setShowTokenInput(true)}
                  className="w-full py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 text-xs font-medium rounded-lg transition-colors"
                >
                  {getGitHubToken() ? '更新 GitHub Token' : '配置 GitHub Token'}
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 bg-black/30 border border-gray-600/30 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-yellow-500/50"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveToken}
                      className="flex-1 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 text-xs font-medium rounded-lg transition-colors"
                    >
                      保存 Token
                    </button>
                    <button
                      onClick={() => setShowTokenInput(false)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 text-xs rounded-lg transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>

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
              账号数据保存在 GitHub Issues 中，登录后自动同步；也可使用下方手动导出/导入 JSON 文件作为备份。
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
                accept=".json,.txt,.md,application/json,text/plain,application/octet-stream,text/*,application/*"
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
