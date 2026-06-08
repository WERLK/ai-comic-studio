import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState, LoginCredentials, RegisterCredentials, PointTransaction, PointReward, PointExchangeItem, TaskType } from '@/types';

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

// 日常任务
const mockDailyRewards: PointReward[] = [
  { id: 'daily-login', name: '每日签到', description: '每天签到领取奖励', points: 10, type: 'daily', canClaim: true },
  { id: 'daily-create', name: '创作日常', description: '今天创建1个漫剧', points: 25, type: 'daily', progress: 0, target: 1 },
  { id: 'daily-preview', name: '预览作品', description: '预览1个已完成的漫剧', points: 8, type: 'daily', progress: 0, target: 1 },
  { id: 'daily-share', name: '分享作品', description: '分享你的漫剧作品', points: 15, type: 'daily', progress: 0, target: 1 },
];

// 成就任务
const mockAchievementRewards: PointReward[] = [
  { id: 'achievement-first', name: '初次创作', description: '完成第一个漫剧作品', points: 50, type: 'achievement' },
  { id: 'achievement-3proj', name: '创作达人', description: '完成3个漫剧项目', points: 100, type: 'achievement', progress: 0, target: 3 },
  { id: 'achievement-10proj', name: '漫剧大师', description: '完成10个漫剧项目', points: 300, type: 'achievement', progress: 0, target: 10 },
  { id: 'achievement-7days', name: '坚持一周', description: '连续登录7天', points: 80, type: 'achievement', progress: 0, target: 7 },
  { id: 'achievement-30days', name: '漫剧爱好者', description: '连续登录30天', points: 500, type: 'achievement', progress: 0, target: 30 },
];

// 社交任务
const mockSocialRewards: PointReward[] = [
  { id: 'social-friend', name: '邀请好友', description: '成功邀请1位好友注册', points: 50, type: 'social', progress: 0, target: 1 },
  { id: 'social-feedback', name: '反馈建议', description: '提交一条有效的反馈建议', points: 20, type: 'social' },
  { id: 'social-share', name: '分享社区', description: '分享应用到社交媒体', points: 30, type: 'social' },
];

// 创作任务
const mockCreationRewards: PointReward[] = [
  { id: 'creation-5frames', name: '多镜故事', description: '创作包含5个以上分镜的作品', points: 30, type: 'creation' },
  { id: 'creation-char', name: '角色设计师', description: '创建自定义角色', points: 15, type: 'creation' },
  { id: 'creation-scene', name: '场景创作家', description: '创建自定义场景', points: 15, type: 'creation' },
  { id: 'creation-export', name: '作品导出', description: '成功导出1个漫剧作品', points: 25, type: 'creation' },
];

// 探索任务
const mockExploreRewards: PointReward[] = [
  { id: 'explore-style', name: '风格尝试', description: '试用所有3种绘画风格', points: 20, type: 'explore', progress: 0, target: 3 },
  { id: 'explore-effect', name: '特效探索', description: '尝试使用2种以上特效', points: 15, type: 'explore', progress: 0, target: 2 },
  { id: 'explore-tutorial', name: '教程学习', description: '查看帮助教程', points: 10, type: 'explore' },
];

// 特殊任务（限时活动）
const mockSpecialRewards: PointReward[] = [
  { id: 'special-welcome', name: '新手礼包', description: '完成新手引导', points: 100, type: 'special' },
  { id: 'special-bonus', name: '周末双倍', description: '周末签到双倍积分', points: 20, type: 'special', canClaim: true },
];

const mockExchangeItems: PointExchangeItem[] = [
  { id: 'premium-1', name: '高级风格解锁', description: '解锁所有高级绘画风格', price: 50, image: '', stock: 999 },
  { id: 'export-hd', name: '高清导出权限', description: '导出1080p及以上分辨率', price: 100, image: '', stock: 999 },
  { id: 'frame-boost', name: '额外分镜数', description: '每次生成可多5个分镜', price: 80, image: '', stock: 999 },
  { id: 'vip-day', name: 'VIP体验1天', description: '享受24小时VIP功能', price: 150, image: '', stock: 99 },
  { id: 'custom-bg', name: '自定义背景', description: '使用自定义图片作为背景', price: 60, image: '', stock: 999 },
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
      exchangeItems: mockExchangeItems,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          await new Promise(resolve => setTimeout(resolve, 800));
          const storedUsers = JSON.parse(localStorage.getItem('ai_comic_users') || '[]');
          const user = storedUsers.find((u: any) => 
            u.username === credentials.username && 
            u.password === credentials.password
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

            const updatedUsers = storedUsers.map((u: any) => 
              u.id === user.id ? updatedUser : u
            );
            localStorage.setItem('ai_comic_users', JSON.stringify(updatedUsers));

            const { password, ...userWithoutPassword } = updatedUser;
            set((state) => {
              // 刷新每日任务
              const newDailyRewards = state.dailyRewards.map(r => ({
                ...r,
                isCompleted: false,
                progress: 0,
              }));

              // 更新连续登录成就进度
              const newAchievementRewards = state.achievementRewards.map(r => {
                if (r.id === 'achievement-7days' || r.id === 'achievement-30days') {
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
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      register: async (credentials: RegisterCredentials) => {
        set({ isLoading: true });
        try {
          await new Promise(resolve => setTimeout(resolve, 800));
          const storedUsers = JSON.parse(localStorage.getItem('ai_comic_users') || '[]');
          
          const userExists = storedUsers.some((u: any) => 
            u.username === credentials.username || u.email === credentials.email
          );
          
          if (userExists) {
            set({ isLoading: false });
            return false;
          }

          const newUser: User & { password: string } = {
            id: Date.now().toString(),
            username: credentials.username,
            email: credentials.email,
            points: 50,
            createdAt: new Date().toISOString(),
            lastLoginDate: getTodayKey(),
            consecutiveLoginDays: 1,
            completedTasks: [],
            password: credentials.password,
          };

          const updatedUsers = [...storedUsers, newUser];
          localStorage.setItem('ai_comic_users', JSON.stringify(updatedUsers));

          const { password, ...userWithoutPassword } = newUser;
          set({ 
            user: userWithoutPassword, 
            isAuthenticated: true, 
            points: 50,
            isLoading: false 
          });

          return true;
        } catch (error) {
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
            const storedUsers = JSON.parse(localStorage.getItem('ai_comic_users') || '[]');
            const updatedUsers = storedUsers.map((u: any) => 
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
            const storedUsers = JSON.parse(localStorage.getItem('ai_comic_users') || '[]');
            const updatedUsers = storedUsers.map((u: any) => 
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

          const updates: any = {};
          if (taskArray === 'dailyRewards') updates.dailyRewards = updateFn(state.dailyRewards);
          if (taskArray === 'achievementRewards') updates.achievementRewards = updateFn(state.achievementRewards);
          if (taskArray === 'socialRewards') updates.socialRewards = updateFn(state.socialRewards);
          if (taskArray === 'creationRewards') updates.creationRewards = updateFn(state.creationRewards);
          if (taskArray === 'exploreRewards') updates.exploreRewards = updateFn(state.exploreRewards);
          if (taskArray === 'specialRewards') updates.specialRewards = updateFn(state.specialRewards);

          // 更新用户已完成任务
          if (state.user) {
            const updatedUser = {
              ...state.user,
              completedTasks: [...(state.user.completedTasks || []), rewardId],
            };
            updates.user = updatedUser;
            
            const storedUsers = JSON.parse(localStorage.getItem('ai_comic_users') || '[]');
            const updatedUsers = storedUsers.map((u: any) => 
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
        // 标记任务完成并尝试领取奖励
        const state = get();
        
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
      }),
    }
  )
);
