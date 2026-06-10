export interface User {
  id: string;
  username: string;
  email: string;
  points: number;
  totalEarnedPoints?: number;
  level?: number;
  projectsCount?: number;
  isVIP?: boolean;
  vipLevel?: number;        // VIP等级 1-5
  vipExpireAt?: string;     // VIP过期时间 ISO
  vipPoints?: number;       // 会员积分（用于升级VIP等级）
  createdAt: string;
  lastLoginDate?: string;
  consecutiveLoginDays?: number;
  completedTasks?: string[];
  visitedPages?: string[];
  usedStyles?: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email?: string;
  password: string;
}

export interface PointTransaction {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  description: string;
  createdAt: string;
}

export type TaskType = 
  | 'daily' 
  | 'achievement' 
  | 'social' 
  | 'creation' 
  | 'explore' 
  | 'special'
  | 'member'
  | 'level';

export interface PointReward {
  id: string;
  name: string;
  description: string;
  points: number;
  type: TaskType;
  isCompleted?: boolean;
  canClaim?: boolean;
  progress?: number;
  target?: number;
  icon?: string;
  isVIPOnly?: boolean;
  autoUnlockHint?: string;
}

export interface PointExchangeItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
}

// ===== 会员等级体系 =====
export interface VIPLevel {
  level: number;
  name: string;
  color: string;
  bgColor: string;
  icon: string;
  minPoints: number;      // 升级所需会员积分
  dailyBonus: number;     // 每日签到额外积分
  taskMultiplier: number; // 任务积分倍数
  maxFrames: number;      // 最大分镜数
  maxResolution: string;  // 最大导出分辨率
  features: string[];     // 专属功能列表
}

export const VIP_LEVELS: VIPLevel[] = [
  {
    level: 0,
    name: '普通用户',
    color: '#9CA3AF',
    bgColor: 'from-gray-500 to-gray-600',
    icon: 'User',
    minPoints: 0,
    dailyBonus: 0,
    taskMultiplier: 1,
    maxFrames: 5,
    maxResolution: '720p',
    features: ['基础创作功能', '5个分镜限制', '720p导出'],
  },
  {
    level: 1,
    name: '青铜会员',
    color: '#CD7F32',
    bgColor: 'from-amber-600 to-orange-700',
    icon: 'Crown',
    minPoints: 0,
    dailyBonus: 10,
    taskMultiplier: 1.2,
    maxFrames: 10,
    maxResolution: '1080p',
    features: ['每日额外10积分', '任务积分x1.2', '10个分镜', '1080p导出', '基础风格解锁'],
  },
  {
    level: 2,
    name: '白银会员',
    color: '#C0C0C0',
    bgColor: 'from-gray-300 to-gray-400',
    icon: 'Gem',
    minPoints: 500,
    dailyBonus: 25,
    taskMultiplier: 1.5,
    maxFrames: 20,
    maxResolution: '2K',
    features: ['每日额外25积分', '任务积分x1.5', '20个分镜', '2K导出', '高级风格解锁', '优先队列'],
  },
  {
    level: 3,
    name: '黄金会员',
    color: '#FFD700',
    bgColor: 'from-yellow-400 to-amber-500',
    icon: 'Star',
    minPoints: 2000,
    dailyBonus: 50,
    taskMultiplier: 2,
    maxFrames: 50,
    maxResolution: '4K',
    features: ['每日额外50积分', '任务积分x2', '50个分镜', '4K导出', '全部风格解锁', 'VIP专属客服', '去水印'],
  },
  {
    level: 4,
    name: '铂金会员',
    color: '#E5E4E2',
    bgColor: 'from-slate-300 to-slate-400',
    icon: 'Award',
    minPoints: 5000,
    dailyBonus: 100,
    taskMultiplier: 2.5,
    maxFrames: 100,
    maxResolution: '4K',
    features: ['每日额外100积分', '任务积分x2.5', '100个分镜', '4K导出', '全部功能解锁', '1对1技术支持', '自定义水印'],
  },
  {
    level: 5,
    name: '钻石会员',
    color: '#B9F2FF',
    bgColor: 'from-cyan-300 to-blue-400',
    icon: 'Diamond',
    minPoints: 10000,
    dailyBonus: 200,
    taskMultiplier: 3,
    maxFrames: 999,
    maxResolution: '4K+',
    features: ['每日额外200积分', '任务积分x3', '无限分镜', '最高画质', '全部功能解锁', '专属定制服务', 'API无限调用', '商业授权'],
  },
];

// 会员积分获取方式
export const VIP_POINTS_RULES = [
  { action: '每日签到', points: 5, desc: '每天签到获得会员积分' },
  { action: '完成任务', points: 2, desc: '每完成一个任务获得会员积分' },
  { action: '连续签到7天', points: 50, desc: '连续签到7天额外奖励' },
  { action: '连续签到30天', points: 200, desc: '连续签到30天额外奖励' },
  { action: '消费积分', points: 1, desc: '每消费10普通积分获得1会员积分' },
  { action: '邀请好友', points: 100, desc: '成功邀请一位好友注册' },
  { action: '作品获赞', points: 10, desc: '作品获得10个赞' },
];
