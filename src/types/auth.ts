export interface User {
  id: string;
  username: string;
  email: string;
  points: number;
  createdAt: string;
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

export interface PointReward {
  id: string;
  name: string;
  description: string;
  points: number;
  isDaily: boolean;
  isCompleted?: boolean;
}

export interface PointExchangeItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
}
