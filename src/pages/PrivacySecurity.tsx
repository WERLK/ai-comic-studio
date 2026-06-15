import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Calendar,
  Shield,
  Lock,
  Mail,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
  Bell,
  Database,
  Info,
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { AppVersion } from '@/components/AppVersion';

export function PrivacySecurity() {
  const navigate = useNavigate();
  const { user, deleteAccount } = useAuthStore();

  // 修改密码状态
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // 绑定邮箱状态
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  // 隐私设置状态
  const [publicProfile, setPublicProfile] = useState(true);
  const [activityNotifications, setActivityNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  // 账号注销确认
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 格式化邮箱显示（脱敏）
  const maskEmail = (email: string) => {
    if (!email) return '未绑定';
    const [localPart, domain] = email.split('@');
    if (!domain) return email;
    const maskedLocal = localPart.charAt(0) + '***';
    return `${maskedLocal}@${domain}`;
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '未知';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // 获取会员状态
  const getMembershipStatus = () => {
    if (!user) return '普通用户';
    return 'VIP会员';
  };

  // 处理修改密码
  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('请填写所有密码字段');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('新密码长度不能少于6位');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的新密码不一致');
      return;
    }

    // 模拟向后端发送请求
    try {
      // 实际应用中应调用 API: PATCH /api/users/:id
      // 这里模拟成功操作
      await new Promise(resolve => setTimeout(resolve, 1000));

      setPasswordSuccess('密码修改成功');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordError('密码修改失败，请稍后重试');
    }
  };

  // 处理绑定邮箱
  const handleBindEmail = () => {
    setEmailError('');
    setEmailSuccess('');

    if (!newEmail) {
      setEmailError('请输入邮箱地址');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setEmailError('请输入有效的邮箱地址');
      return;
    }

    // 模拟向后端发送请求
    setEmailSuccess('邮箱绑定成功');
    setNewEmail('');
    setShowEmailModal(false);
  };

  // 处理账号注销
  const handleDeleteAccount = () => {
    // 真正删除账号 → 数据同步到云端删除，再清本地，最后跳首页
    deleteAccount();
  };

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid">
      {/* Header */}
      <header className="h-14 bg-cyber-dark2/80 backdrop-blur-xl border-b border-cyber-purple/20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/profile')} className="p-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-medium text-white text-sm md:text-base">隐私安全</h1>
        </div>
        <div className="flex items-center gap-3">
          <AppVersion />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 账号信息卡片 */}
        <div className="bg-gradient-to-br from-cyber-purple/20 to-cyber-pink/20 border border-cyber-purple/30 rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center shadow-2xl shadow-cyber-pink/30">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-bold text-white mb-1">
                {user?.username || '用户'}
              </h2>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  注册于 {formatDate(user?.createdAt)}
                </span>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-gradient-to-r from-cyber-yellow/20 to-cyber-pink/20 border border-cyber-yellow/30 rounded-full">
              <span className="text-xs font-medium text-cyber-yellow">{getMembershipStatus()}</span>
            </div>
          </div>
        </div>

        {/* 安全设置 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-cyber-pink" />
            <h3 className="text-sm font-medium text-gray-200">安全设置</h3>
          </div>

          <div className="bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 rounded-2xl p-4 space-y-4">
            {/* 修改密码 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyber-purple" />
                <span className="text-sm font-medium text-white">修改密码</span>
              </div>

              {passwordSuccess && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3">
                  <p className="text-green-400 text-sm">{passwordSuccess}</p>
                </div>
              )}

              {passwordError && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3">
                  <p className="text-red-400 text-sm">{passwordError}</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="当前密码"
                    className="w-full px-4 py-2.5 bg-cyber-dark/50 border border-cyber-purple/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyber-pink/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="新密码"
                    className="w-full px-4 py-2.5 bg-cyber-dark/50 border border-cyber-purple/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyber-pink/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="确认新密码"
                    className="w-full px-4 py-2.5 bg-cyber-dark/50 border border-cyber-purple/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyber-pink/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  onClick={handleChangePassword}
                  className="w-full py-2.5 bg-gradient-to-r from-cyber-pink to-cyber-purple hover:opacity-90 text-white text-sm font-medium rounded-xl transition-opacity"
                >
                  修改密码
                </button>
              </div>
            </div>

            <div className="h-px bg-cyber-purple/20" />

            {/* 绑定邮箱 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyber-purple" />
                  <span className="text-sm font-medium text-white">绑定邮箱</span>
                </div>
                <button
                  onClick={() => setShowEmailModal(!showEmailModal)}
                  className="text-xs text-cyber-pink hover:text-cyber-blue transition-colors"
                >
                  {showEmailModal ? '取消' : '修改'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{maskEmail(user?.email || '')}</span>
              </div>

              {showEmailModal && (
                <div className="space-y-3">
                  {emailSuccess && (
                    <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3">
                      <p className="text-green-400 text-sm">{emailSuccess}</p>
                    </div>
                  )}

                  {emailError && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3">
                      <p className="text-red-400 text-sm">{emailError}</p>
                    </div>
                  )}

                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="输入新邮箱地址"
                    className="w-full px-4 py-2.5 bg-cyber-dark/50 border border-cyber-purple/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyber-pink/50 transition-colors"
                  />

                  <button
                    onClick={handleBindEmail}
                    className="w-full py-2.5 bg-gradient-to-r from-cyber-pink to-cyber-purple hover:opacity-90 text-white text-sm font-medium rounded-xl transition-opacity"
                  >
                    确认绑定
                  </button>
                </div>
              )}
            </div>

            <div className="h-px bg-cyber-purple/20" />

            {/* 账号注销 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-white">账号注销</span>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                注销账号后，所有个人数据将被永久删除，无法恢复。请谨慎操作。
              </p>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium rounded-xl transition-colors"
              >
                注销账号
              </button>
            </div>
          </div>
        </div>

        {/* 隐私设置 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-cyber-blue" />
            <h3 className="text-sm font-medium text-gray-200">隐私设置</h3>
          </div>

          <div className="bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 rounded-2xl p-4 space-y-4">
            {/* 公开个人资料 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-sm text-white">公开个人资料</span>
                  <p className="text-xs text-gray-500">允许其他用户查看您的基本信息</p>
                </div>
              </div>
              <button
                onClick={() => setPublicProfile(!publicProfile)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  publicProfile ? 'bg-cyber-pink' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    publicProfile ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* 接收活动通知 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-sm text-white">接收活动通知</span>
                  <p className="text-xs text-gray-500">接收平台活动和优惠信息</p>
                </div>
              </div>
              <button
                onClick={() => setActivityNotifications(!activityNotifications)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  activityNotifications ? 'bg-cyber-pink' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    activityNotifications ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* 数据自动同步 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-sm text-white">数据自动同步</span>
                  <p className="text-xs text-gray-500">开启后，创作数据将自动同步到云端</p>
                </div>
              </div>
              <button
                onClick={() => setAutoSync(!autoSync)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  autoSync ? 'bg-cyber-pink' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    autoSync ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 安全提示 */}
        <div className="bg-gradient-to-br from-cyber-blue/10 to-cyber-purple/10 border border-cyber-blue/20 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-cyber-blue flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white mb-2">账号安全建议</h4>
              <ul className="space-y-2">
                <li className="text-xs text-gray-400 leading-relaxed">
                  • 使用强密码，包含字母、数字和特殊字符
                </li>
                <li className="text-xs text-gray-400 leading-relaxed">
                  • 定期更换密码，建议每3个月更换一次
                </li>
                <li className="text-xs text-gray-400 leading-relaxed">
                  • 不要在多个平台使用相同的密码
                </li>
                <li className="text-xs text-gray-400 leading-relaxed">
                  • 绑定邮箱有助于找回密码和接收安全通知
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 注销确认弹窗 */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-cyber-dark2/95 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full">
              <div className="text-center mb-4">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">危险操作</h3>
                <p className="text-sm text-gray-400">
                  账号注销后，所有数据将被永久删除，包括：
                </p>
                <ul className="text-xs text-gray-500 mt-2 text-left list-disc list-inside">
                  <li>积分和会员权益</li>
                  <li>创作记录和草稿</li>
                  <li>个人信息和设置</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 bg-gray-600/30 hover:bg-gray-600/50 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 py-2.5 bg-red-500/30 hover:bg-red-500/50 border border-red-500/50 text-red-400 text-sm font-medium rounded-xl transition-colors"
                >
                  确认注销
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
