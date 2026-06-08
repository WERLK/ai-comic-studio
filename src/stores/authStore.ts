import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState, LoginCredentials, RegisterCredentials, PointTransaction, PointReward, PointExchangeItem } from '@/types';

interface AuthStore extends AuthState {
  user: User | null;
  points: number;
  transactions: PointTransaction[];
  dailyRewards: PointReward[];
  achievementRewards: PointReward[];
  socialRewards: PointReward[];
  creationRewards: PointReward[];
  exploreRewards: PointReward[];
  specialRewards: PointReward[];
  memberRewards: PointReward[];
  levelRewards: PointReward[];
  exchangeItems: PointExchangeItem[];
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => void;
  addPoints: (amount: number, description: string) => void;
  spendPoints: (amount: number, description: string) => boolean;
  claimReward: (rewardId: string) => boolean;
  exchangeItem: (itemId: string) => boolean;
  markTaskComplete: (taskId: string) => void;
  updateTaskProgress: (taskId: string, progress: number) => void;
  refreshDailyTasks: () => void;
}

const getTodayKey = () => {
  return new Date().toISOString().split('T')[0];
};

// ===== 日常任务（每日刷新）=====
const mockDailyRewards: PointReward[] = [
  { id: 'daily-login', name: '每日签到', description: '每天签到领取奖励', points: 10, type: 'daily', canClaim: true },
  { id: 'daily-create', name: '创作日常', description: '今天创建1个漫剧', points: 25, type: 'daily', progress: 0, target: 1 },
  { id: 'daily-preview', name: '预览作品', description: '预览1个已完成的漫剧', points: 8, type: 'daily', progress: 0, target: 1 },
  { id: 'daily-share', name: '分享作品', description: '分享你的漫剧作品', points: 15, type: 'daily', progress: 0, target: 1 },
  { id: 'daily-comment', name: '每日评论', description: '对1个漫剧发表评论', points: 12, type: 'daily', progress: 0, target: 1 },
  { id: 'daily-favorite', name: '收藏作品', description: '收藏1个喜欢的漫剧', points: 5, type: 'daily', progress: 0, target: 1 },
  { id: 'daily-voice', name: '配音体验', description: '使用配音功能1次', points: 10, type: 'daily', progress: 0, target: 1 },
  { id: 'daily-style', name: '风格切换', description: '尝试不同的绘画风格', points: 8, type: 'daily', progress: 0, target: 1 },
];

// ===== 成就任务（永久）=====
const mockAchievementRewards: PointReward[] = [
  { id: 'achievement-first', name: '初次创作', description: '完成第一个漫剧作品', points: 50, type: 'achievement' },
  { id: 'achievement-3proj', name: '创作达人', description: '完成3个漫剧项目', points: 100, type: 'achievement', progress: 0, target: 3 },
  { id: 'achievement-10proj', name: '漫剧大师', description: '完成10个漫剧项目', points: 300, type: 'achievement', progress: 0, target: 10 },
  { id: 'achievement-50proj', name: '漫剧传奇', description: '完成50个漫剧项目', points: 1000, type: 'achievement', progress: 0, target: 50 },
  { id: 'achievement-7days', name: '坚持一周', description: '连续登录7天', points: 80, type: 'achievement', progress: 0, target: 7 },
  { id: 'achievement-30days', name: '漫剧爱好者', description: '连续登录30天', points: 500, type: 'achievement', progress: 0, target: 30 },
  { id: 'achievement-100days', name: '铁杆粉丝', description: '连续登录100天', points: 2000, type: 'achievement', progress: 0, target: 100 },
  { id: 'achievement-1000pts', name: '积分达人', description: '累计获得1000积分', points: 150, type: 'achievement', progress: 0, target: 1000 },
  { id: 'achievement-10000pts', name: '积分富豪', description: '累计获得10000积分', points: 500, type: 'achievement', progress: 0, target: 10000 },
  { id: 'achievement-first-share', name: '首次分享', description: '首次分享漫剧作品', points: 30, type: 'achievement' },
];

// ===== 社交任务=====
const mockSocialRewards: PointReward[] = [
  { id: 'social-friend', name: '邀请好友', description: '成功邀请1位好友注册', points: 50, type: 'social', progress: 0, target: 1 },
  { id: 'social-friend-5', name: '社交达人', description: '成功邀请5位好友注册', points: 200, type: 'social', progress: 0, target: 5 },
  { id: 'social-feedback', name: '反馈建议', description: '提交一条有效的反馈建议', points: 20, type: 'social' },
  { id: 'social-bug', name: 'Bug猎人', description: '报告一个有效的Bug', points: 50, type: 'social' },
  { id: 'social-share', name: '分享社区', description: '分享应用到社交媒体', points: 30, type: 'social' },
  { id: 'social-weibo', name: '微博分享', description: '分享到微博平台', points: 25, type: 'social' },
  { id: 'social-wechat', name: '微信分享', description: '分享到微信朋友圈', points: 25, type: 'social' },
  { id: 'social-qq', name: 'QQ分享', description: '分享到QQ空间', points: 25, type: 'social' },
  { id: 'social-douyin', name: '抖音分享', description: '分享到抖音平台', points: 30, type: 'social' },
];

// ===== 创作任务=====
const mockCreationRewards: PointReward[] = [
  { id: 'creation-5frames', name: '多镜故事', description: '创作包含5个以上分镜的作品', points: 30, type: 'creation' },
  { id: 'creation-10frames', name: '长篇巨制', description: '创作包含10个以上分镜的作品', points: 60, type: 'creation' },
  { id: 'creation-char', name: '角色设计师', description: '创建自定义角色', points: 15, type: 'creation' },
  { id: 'creation-scene', name: '场景创作家', description: '创建自定义场景', points: 15, type: 'creation' },
  { id: 'creation-export', name: '作品导出', description: '成功导出1个漫剧作品', points: 25, type: 'creation' },
  { id: 'creation-export-10', name: '导出具匠', description: '累计导出10个作品', points: 100, type: 'creation', progress: 0, target: 10 },
  { id: 'creation-style-anime', name: '日系风格', description: '使用日系动漫风格创作', points: 10, type: 'creation' },
  { id: 'creation-style-manga', name: '漫画风格', description: '使用经典漫画风格创作', points: 10, type: 'creation' },
  { id: 'creation-style-cyber', name: '赛博风格', description: '使用赛博朋克风格创作', points: 10, type: 'creation' },
  { id: 'creation-all-style', name: '风格收集者', description: '使用所有风格各创作一次', points: 50, type: 'creation', progress: 0, target: 3 },
  { id: 'creation-voice', name: '配音师', description: '为漫剧添加配音', points: 20, type: 'creation' },
  { id: 'creation-narration', name: '旁白大师', description: '添加旁白说明', points: 10, type: 'creation' },
  { id: 'creation-dialogue', name: '对白创作者', description: '添加角色对话', points: 10, type: 'creation' },
];

// ===== 探索任务=====
const mockExploreRewards: PointReward[] = [
  { id: 'explore-style', name: '风格尝试', description: '试用所有3种绘画风格', points: 20, type: 'explore', progress: 0, target: 3 },
  { id: 'explore-effect', name: '特效探索', description: '尝试使用2种以上特效', points: 15, type: 'explore', progress: 0, target: 2 },
  { id: 'explore-tutorial', name: '教程学习', description: '查看帮助教程', points: 10, type: 'explore' },
  { id: 'explore-settings', name: '设置达人', description: '访问设置页面并修改配置', points: 5, type: 'explore' },
  { id: 'explore-points', name: '积分中心', description: '访问积分中心', points: 5, type: 'explore' },
  { id: 'explore-history', name: '历史记录', description: '查看历史创作记录', points: 5, type: 'explore' },
  { id: 'explore-all', name: '探索者', description: '访问所有功能页面', points: 30, type: 'explore', progress: 0, target: 5 },
];

// ===== 会员专属任务=====
const mockMemberRewards: PointReward[] = [
  { id: 'member-vip', name: '成为VIP', description: '开通VIP会员', points: 100, type: 'member' },
  { id: 'member-svip', name: '成为SVIP', description: '开通SVIP会员', points: 200, type: 'member' },
  { id: 'member-daily', name: 'VIP日报', description: 'VIP每日专属任务', points: 20, type: 'member', canClaim: true },
  { id: 'member-weekly', name: 'VIP周刊', description: 'VIP每周专属任务', points: 100, type: 'member', canClaim: true },
  { id: 'member-exclusive', name: '专属风格', description: '使用VIP专属风格', points: 30, type: 'member' },
  { id: 'member-priority', name: '优先体验', description: '优先体验新功能', points: 50, type: 'member' },
];

// ===== 等级任务=====
const mockLevelRewards: PointReward[] = [
  { id: 'level-1', name: 'Lv.1 入门', description: '达到1级（100积分）', points: 0, type: 'level', canClaim: true },
  { id: 'level-5', name: 'Lv.5 学徒', description: '达到5级（500积分）', points: 50, type: 'level' },
  { id: 'level-10', name: 'Lv.10 创作者', description: '达到10级（1000积分）', points: 100, type: 'level' },
  { id: 'level-20', name: 'Lv.20 达人', description: '达到20级（3000积分）', points: 200, type: 'level' },
  { id: 'level-50', name: 'Lv.50 大师', description: '达到50级（10000积分）', points: 500, type: 'level' },
  { id: 'level-100', name: 'Lv.100 传奇', description: '达到100级（50000积分）', points: 2000, type: 'level' },
];

// ===== 特殊任务（限时活动）=====
const mockSpecialRewards: PointReward[] = [
  { id: 'special-welcome', name: '新手礼包', description: '完成新手引导', points: 100, type: 'special' },
  { id: 'special-bonus', name: '周末双倍', description: '周末签到双倍积分', points: 20, type: 'special', canClaim: true },
  { id: 'special-spring', name: '春节活动', description: '春节期间特殊任务', points: 500, type: 'special' },
  { id: 'special-lantern', name: '元宵活动', description: '元宵节特别任务', points: 200, type: 'special' },
  { id: 'special-qingming', name: '清明活动', description: '清明节特别任务', points: 150, type: 'special' },
  { id: 'special-labor', name: '劳动节活动', description: '劳动节特别任务', points: 300, type: 'special' },
  { id: 'special-youth', name: '青年节活动', description: '青年节特别任务', points: 100, type: 'special' },
  { id: 'special-dragon', name: '端午节活动', description: '端午节特别任务', points: 200, type: 'special' },
  { id: 'special-midautumn', name: '中秋活动', description: '中秋节特别任务', points: 300, type: 'special' },
  { id: 'special-national', name: '国庆活动', description: '国庆节特别任务', points: 500, type: 'special' },
  { id: 'special-double11', name: '双11活动', description: '双11特别任务', points: 400, type: 'special' },
  { id: 'special-christmas', name: '圣诞活动', description: '圣诞节特别任务', points: 300, type: 'special' },
  { id: 'special-newyear', name: '新年活动', description: '新年特别任务', points: 500, type: 'special' },
];

// ===== 积分商城商品=====
const mockExchangeItems: PointExchangeItem[] = [
  { id: 'premium-1', name: '高级风格解锁', description: '解锁所有高级绘画风格', price: 50, image: '', stock: 999 },
  { id: 'export-hd', name: '高清导出权限', description: '导出1080p及以上分辨率', price: 100, image: '', stock: 999 },
  { id: 'frame-boost', name: '额外分镜数', description: '每次生成可多5个分镜', price: 80, image: '', stock: 999 },
  { id: 'vip-day', name: 'VIP体验1天', description: '享受24小时VIP功能', price: 150, image: '', stock: 99 },
  { id: 'vip-week', name: 'VIP体验7天', description: '享受7天VIP功能', price: 800, image: '', stock: 50 },
  { id: 'vip-month', name: 'VIP体验30天', description: '享受30天VIP功能', price: 3000, image: '', stock: 20 },
  { id: 'custom-bg', name: '自定义背景', description: '使用自定义图片作为背景', price: 60, image: '', stock: 999 },
  { id: 'avatar-frame', name: '头像框', description: '获得一个独特的头像框', price: 200, image: '', stock: 100 },
  { id: 'title-badge', name: '称号徽章', description: '获得"创作达人"称号', price: 300, image: '', stock: 50 },
  { id: 'theme-skin', name: '主题皮肤', description: '解锁一个独特的主题', price: 500, image: '', stock: 30 },
  { id: 'sound-effect', name: '音效包', description: '解锁各种有趣的音效', price: 150, image: '', stock: 200 },
  { id: 'sticker-pack', name: '贴纸包', description: '获得一套可爱的贴纸', price: 100, image: '', stock: 500 },
];

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      points: 0,
      transactions: [],
      dailyRewards: mockDailyRewards,
      achievementRewards: mockAchievementRewards,
      socialRewards: mockSocialRewards,
      creationRewards: mockCreationRewards,
      exploreRewards: mockExploreRewards,
      specialRewards: mockSpecialRewards,
      memberRewards: mockMemberRewards,
      levelRewards: mockLevelRewards,
      exchangeItems: mockExchangeItems,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          await new Promise(resolve => setTimeout(resolve, 800));
          const storedUsers: (User & { password: string })[] = JSON.parse(localStorage.getItem('ai_comic_users') || '[]');
          
          // 规范化用户名和密码（去除空白字符）
          const normalizedUsername = credentials.username.trim();
          const normalizedPassword = credentials.password;
          
          // 匹配用户（忽略用户名大小写）
          const user = storedUsers.find((u) => 
            u.username.trim().toLowerCase() === normalizedUsername.toLowerCase() && 
            u.password === normalizedPassword
          );
          
          if (user) {
            const today = getTodayKey();
            let consecutiveLoginDays = user.consecutiveLoginDays || 0;
            const lastLoginDate = user.lastLoginDate;
            
            // 检查是否连续登录
            if (lastLoginDate) {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayKey = yesterday.toISOString().split('T')[0];
              
              if (lastLoginDate === yesterdayKey) {
                consecutiveLoginDays++;
              } else if (lastLoginDate !== today) {
                consecutiveLoginDays = 1;
              }
            } else {
              consecutiveLoginDays = 1;
            }

            const updatedUser = {
              ...user,
              lastLoginDate: today,
              consecutiveLoginDays,
            };

            const updatedUsers = storedUsers.map((u) => 
              u.id === user.id ? updatedUser : u
            );
            localStorage.setItem('ai_comic_users', JSON.stringify(updatedUsers));

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _password, ...userWithoutPassword } = updatedUser;
            set((state) => {
              // 刷新每日任务
              const newDailyRewards = state.dailyRewards.map(r => ({
                ...r,
                isCompleted: false,
                progress: 0,
              }));

              // 更新连续登录成就进度
              const newAchievementRewards = state.achievementRewards.map(r => {
                if (r.id === 'achievement-7days' || r.id === 'achievement-30days' || r.id === 'achievement-100days') {
                  return { ...r, progress: consecutiveLoginDays };
                }
                return r;
              });

              return {
                user: userWithoutPassword,
                isAuthenticated: true,
                points: user.points || 0,
                isLoading: false,
                dailyRewards: newDailyRewards,
                achievementRewards: newAchievementRewards,
              };
            });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch {
          set({ isLoading: false });
          return false;
        }
      },

      register: async (credentials: RegisterCredentials) => {
        set({ isLoading: true });
        try {
          await new Promise(resolve => setTimeout(resolve, 800));
          const storedUsers: (User & { password: string })[] = JSON.parse(localStorage.getItem('ai_comic_users') || '[]');
          
          // 规范化用户名和邮箱
          const normalizedUsername = credentials.username.trim();
          const normalizedEmail = credentials.email.trim().toLowerCase();
          
          // 检查用户是否已存在（忽略大小写）
          const userExists = storedUsers.some((u) => 
            u.username.trim().toLowerCase() === normalizedUsername.toLowerCase() || 
            u.email.trim().toLowerCase() === normalizedEmail
          );
          
          if (userExists) {
            set({ isLoading: false });
            return false;
          }

          const newUser: User & { password: string } = {
            id: Date.now().toString(),
            username: normalizedUsername,
            email: normalizedEmail,
            points: 50,
            createdAt: new Date().toISOString(),
            lastLoginDate: getTodayKey(),
            consecutiveLoginDays: 1,
            completedTasks: [],
            password: credentials.password,
          };

          const updatedUsers = [...storedUsers, newUser];
          localStorage.setItem('ai_comic_users', JSON.stringify(updatedUsers));

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password: _password, ...userWithoutPassword } = newUser;
          set({ 
            user: userWithoutPassword, 
            isAuthenticated: true, 
            points: 50,
            isLoading: false 
          });

          return true;
        } catch {
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      addPoints: (amount: number, description: string) => {
        set((state) => {
          const newPoints = state.points + amount;
          const newTransaction: PointTransaction = {
            id: Date.now().toString(),
            type: 'earn',
            amount,
            description,
            createdAt: new Date().toISOString(),
          };

          if (state.user) {
            const updatedUser = { ...state.user, points: newPoints };
            const storedUsers: (User & { password: string })[] = JSON.parse(localStorage.getItem('ai_comic_users') || '[]');
            const updatedUsers = storedUsers.map((u) => 
              u.id === updatedUser.id ? { ...u, points: newPoints } : u
            );
            localStorage.setItem('ai_comic_users', JSON.stringify(updatedUsers));
          }

          return {
            points: newPoints,
            transactions: [newTransaction, ...state.transactions].slice(0, 50),
          };
        });
      },

      spendPoints: (amount: number, description: string) => {
        const currentPoints = get().points;
        if (currentPoints < amount) return false;

        set((state) => {
          const newPoints = state.points - amount;
          const newTransaction: PointTransaction = {
            id: Date.now().toString(),
            type: 'spend',
            amount,
            description,
            createdAt: new Date().toISOString(),
          };

          if (state.user) {
            const updatedUser = { ...state.user, points: newPoints };
            const storedUsers: (User & { password: string })[] = JSON.parse(localStorage.getItem('ai_comic_users') || '[]');
            const updatedUsers = storedUsers.map((u) => 
              u.id === updatedUser.id ? { ...u, points: newPoints } : u
            );
            localStorage.setItem('ai_comic_users', JSON.stringify(updatedUsers));
          }

          return {
            points: newPoints,
            transactions: [newTransaction, ...state.transactions].slice(0, 50),
          };
        });
        return true;
      },

      claimReward: (rewardId: string) => {
        const state = get();
        let reward: PointReward | undefined;
        let taskArray: string | null = null;

        // 查找奖励
        reward = state.dailyRewards.find(r => r.id === rewardId);
        if (reward) taskArray = 'dailyRewards';
        
        if (!reward) {
          reward = state.achievementRewards.find(r => r.id === rewardId);
          if (reward) taskArray = 'achievementRewards';
        }
        
        if (!reward) {
          reward = state.socialRewards.find(r => r.id === rewardId);
          if (reward) taskArray = 'socialRewards';
        }
        
        if (!reward) {
          reward = state.creationRewards.find(r => r.id === rewardId);
          if (reward) taskArray = 'creationRewards';
        }
        
        if (!reward) {
          reward = state.exploreRewards.find(r => r.id === rewardId);
          if (reward) taskArray = 'exploreRewards';
        }
        
        if (!reward) {
          reward = state.specialRewards.find(r => r.id === rewardId);
          if (reward) taskArray = 'specialRewards';
        }

        if (!reward) {
          reward = state.memberRewards.find(r => r.id === rewardId);
          if (reward) taskArray = 'memberRewards';
        }

        if (!reward) {
          reward = state.levelRewards.find(r => r.id === rewardId);
          if (reward) taskArray = 'levelRewards';
        }

        if (!reward || reward.isCompleted) return false;

        // 检查进度条件
        if (reward.target && reward.progress !== undefined && reward.progress < reward.target) {
          return false;
        }

        get().addPoints(reward.points, reward.name);
        
        // 更新任务状态
        set((state) => {
          const updateFn = (rewards: PointReward[]) => 
            rewards.map(r => 
              r.id === rewardId ? { ...r, isCompleted: true } : r
            );

          const updates: Partial<AuthStore> = {};
          if (taskArray === 'dailyRewards') updates.dailyRewards = updateFn(state.dailyRewards);
          if (taskArray === 'achievementRewards') updates.achievementRewards = updateFn(state.achievementRewards);
          if (taskArray === 'socialRewards') updates.socialRewards = updateFn(state.socialRewards);
          if (taskArray === 'creationRewards') updates.creationRewards = updateFn(state.creationRewards);
          if (taskArray === 'exploreRewards') updates.exploreRewards = updateFn(state.exploreRewards);
          if (taskArray === 'specialRewards') updates.specialRewards = updateFn(state.specialRewards);
          if (taskArray === 'memberRewards') updates.memberRewards = updateFn(state.memberRewards);
          if (taskArray === 'levelRewards') updates.levelRewards = updateFn(state.levelRewards);

          // 更新用户已完成任务
          if (state.user) {
            const updatedUser = {
              ...state.user,
              completedTasks: [...(state.user.completedTasks || []), rewardId],
            };
            updates.user = updatedUser;
            
            const storedUsers: (User & { password: string })[] = JSON.parse(localStorage.getItem('ai_comic_users') || '[]');
            const updatedUsers = storedUsers.map((u) => 
              u.id === updatedUser.id ? updatedUser : u
            );
            localStorage.setItem('ai_comic_users', JSON.stringify(updatedUsers));
          }

          return updates;
        });
        
        return true;
      },

      exchangeItem: (itemId: string) => {
        const state = get();
        const item = state.exchangeItems.find(i => i.id === itemId);
        if (!item || state.points < item.price || item.stock <= 0) return false;

        const success = get().spendPoints(item.price, `兑换: ${item.name}`);
        if (success) {
          set((state) => ({
            exchangeItems: state.exchangeItems.map(i => 
              i.id === itemId ? { ...i, stock: i.stock - 1 } : i
            ),
          }));
        }
        return success;
      },

      markTaskComplete: (taskId: string) => {
        // 先更新进度
        get().updateTaskProgress(taskId, 1);
        
        // 尝试领取奖励
        get().claimReward(taskId);
      },

      updateTaskProgress: (taskId: string, progress: number) => {
        set((state) => {
          const updateFn = (rewards: PointReward[]) => 
            rewards.map(r => {
              if (r.id === taskId && r.target !== undefined) {
                const newProgress = Math.min((r.progress || 0) + progress, r.target);
                return { ...r, progress: newProgress };
              }
              return r;
            });

          return {
            dailyRewards: updateFn(state.dailyRewards),
            achievementRewards: updateFn(state.achievementRewards),
            socialRewards: updateFn(state.socialRewards),
            creationRewards: updateFn(state.creationRewards),
            exploreRewards: updateFn(state.exploreRewards),
            specialRewards: updateFn(state.specialRewards),
            memberRewards: updateFn(state.memberRewards),
            levelRewards: updateFn(state.levelRewards),
          };
        });
      },

      refreshDailyTasks: () => {
        set((state) => ({
          dailyRewards: state.dailyRewards.map(r => ({
            ...r,
            isCompleted: false,
            progress: 0,
            canClaim: true,
          })),
        }));
      },
    }),
    {
      name: 'ai_comic_auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        points: state.points,
        transactions: state.transactions,
        dailyRewards: state.dailyRewards,
        achievementRewards: state.achievementRewards,
        socialRewards: state.socialRewards,
        creationRewards: state.creationRewards,
        exploreRewards: state.exploreRewards,
        specialRewards: state.specialRewards,
        memberRewards: state.memberRewards,
        levelRewards: state.levelRewards,
      }),
    }
  )
);
