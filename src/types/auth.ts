export interface User {
  id: string;
  username: string;
  email: string;
  points: number;
  totalEarnedPoints?: number;
  level?: number;
  projectsCount?: number;
  isVIP?: boolean;
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
  email: string;
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
