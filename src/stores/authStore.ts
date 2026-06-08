import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState, LoginCredentials, RegisterCredentials, PointTransaction, PointReward, PointExchangeItem } from '@/types';

interface AuthStore extends AuthState {
  user: User | null;
  points: number;
  transactions: PointTransaction[];
  dailyRewards: PointReward[];
  exchangeItems: PointExchangeItem[];
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => void;
  addPoints: (amount: number, description: string) => void;
  spendPoints: (amount: number, description: string) => boolean;
  claimReward: (rewardId: string) => boolean;
  exchangeItem: (itemId: string) => boolean;
}

const mockDailyRewards: PointReward[] = [
  { id: 'daily-login', name: '每日签到', description: '每天签到获得积分', points: 10, isDaily: true },
  { id: 'first-project', name: '创建第一个项目', description: '创建第一个漫剧项目获得积分', points: 20, isDaily: false },
  { id: 'share-app', name: '分享应用', description: '分享应用给好友获得积分', points: 30, isDaily: false },
];

const mockExchangeItems: PointExchangeItem[] = [
  { id: 'premium-1', name: '高级风格解锁', description: '解锁所有高级绘画风格', price: 50, image: '', stock: 999 },
  { id: 'export-hd', name: '高清导出权限', description: '导出1080p及以上分辨率', price: 100, image: '', stock: 999 },
  { id: 'frame-boost', name: '额外分镜数', description: '每次生成可多5个分镜', price: 80, image: '', stock: 999 },
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
            const { password, ...userWithoutPassword } = user;
            set({ 
              user: userWithoutPassword, 
              isAuthenticated: true, 
              points: user.points || 0,
              isLoading: false 
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
        const reward = state.dailyRewards.find(r => r.id === rewardId);
        if (!reward || reward.isCompleted) return false;

        get().addPoints(reward.points, reward.name);
        set((state) => ({
          dailyRewards: state.dailyRewards.map(r => 
            r.id === rewardId ? { ...r, isCompleted: true } : r
          ),
        }));
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
    }),
    {
      name: 'ai_comic_auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        points: state.points,
        transactions: state.transactions,
        dailyRewards: state.dailyRewards,
      }),
    }
  )
);
