import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCheck, Trash2, Bell } from 'lucide-react';

type NotificationType = 'all' | 'system' | 'activity' | 'task';

interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  time: string;
  isRead: boolean;
}

const mockNotifications: NotificationItem[] = [
  {
    id: 1,
    type: 'system',
    title: '🎉 新功能上线：AI漫剧创作引擎全面升级！',
    content: '全新AI引擎大幅提升生成速度与画质，支持多风格切换，让您的创作更加得心应手！',
    time: '刚刚',
    isRead: false,
  },
  {
    id: 2,
    type: 'activity',
    title: '📢 端午活动：完成任务额外赠送双倍积分！',
    content: '活动期间（6.10-6.12）完成任意任务均可获得双倍积分奖励，千万别错过！',
    time: '10分钟前',
    isRead: false,
  },
  {
    id: 3,
    type: 'task',
    title: '✅ 任务完成：每日签到奖励已到账 +15积分',
    content: '恭喜您完成今日签到任务，连续签到3天额外奖励即将发放！',
    time: '30分钟前',
    isRead: false,
  },
  {
    id: 4,
    type: 'system',
    title: '🏆 成就解锁：恭喜你解锁「初次创作」成就！',
    content: '您已成功创作第一部漫剧作品，解锁成就奖励 +50积分，继续加油！',
    time: '2小时前',
    isRead: true,
  },
  {
    id: 5,
    type: 'activity',
    title: '📊 周末特惠：VIP会员限时5折优惠',
    content: '周末限定福利，VIP会员年费立减50%，还送独家创作素材包！',
    time: '昨天',
    isRead: true,
  },
  {
    id: 6,
    type: 'task',
    title: '💡 提示：您有3个任务可领取奖励',
    content: '您有未领取的创作任务奖励，请及时领取以免过期。',
    time: '昨天',
    isRead: true,
  },
];

const tabs: { key: NotificationType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'system', label: '系统通知' },
  { key: 'activity', label: '活动公告' },
  { key: 'task', label: '任务提醒' },
];

export function Notifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<NotificationType>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);

  const filteredNotifications = activeTab === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeTab);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid">
      {/* Header */}
      <header className="h-14 bg-cyber-dark2/80 backdrop-blur-xl border-b border-cyber-purple/20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-medium text-white text-sm md:text-base">通知</h1>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-cyber-blue hover:text-white bg-cyber-blue/10 hover:bg-cyber-blue/20 border border-cyber-blue/30 rounded-full transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              全部已读
            </button>
          )}
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 hover:text-red-400 bg-gray-500/10 hover:bg-red-500/10 border border-gray-500/20 hover:border-red-500/30 rounded-full transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white shadow-lg shadow-cyber-pink/20'
                  : 'bg-cyber-dark2/60 text-gray-400 hover:text-white border border-cyber-purple/20 hover:border-cyber-purple/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map(notification => (
              <button
                key={notification.id}
                onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                className={`w-full text-left rounded-2xl p-4 transition-all border ${
                  notification.isRead
                    ? 'bg-cyber-dark2/40 border-cyber-purple/10 hover:border-cyber-purple/20'
                    : 'bg-cyber-dark2/80 border-cyber-purple/20 hover:border-cyber-purple/30'
                }`}
              >
                <div className="flex gap-3">
                  {/* Unread Indicator */}
                  {!notification.isRead && (
                    <div className="w-1 rounded-full bg-gradient-to-b from-cyber-blue to-cyber-purple flex-shrink-0" />
                  )}
                  {notification.isRead && <div className="w-1" />}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`font-medium text-sm leading-snug ${
                        notification.isRead ? 'text-gray-400' : 'text-white'
                      }`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                        {notification.time}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${
                      notification.isRead ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {notification.content}
                    </p>
                    {!notification.isRead && (
                      <div className="mt-2 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyber-blue" />
                        <span className="text-xs text-cyber-blue">点击标记为已读</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-cyber-dark2/60 border border-cyber-purple/20 flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm">暂无通知</p>
          </div>
        )}
      </div>
    </div>
  );
}
