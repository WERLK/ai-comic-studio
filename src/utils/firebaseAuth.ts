import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// Firebase 配置（已预配置，用户无需操作）
const firebaseConfig = {
  apiKey: "AIzaSyAI_Comic_Studio_2024",
  authDomain: "ai-comic-studio.firebaseapp.com",
  projectId: "ai-comic-studio",
  storageBucket: "ai-comic-studio.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export interface UserData {
  id: string;
  username: string;
  email: string;
  points: number;
  totalEarnedPoints: number;
  level: number;
  projectsCount: number;
  isVIP: boolean;
  vipLevel: number;
  vipPoints: number;
  vipExpireAt: string | null;
  completedTasks: string[];
  visitedPages: string[];
  usedStyles: string[];
  transactions: Array<{
    id: string;
    type: 'earn' | 'spend';
    amount: number;
    description: string;
    createdAt: string;
  }>;
  createdAt: string;
  lastLoginDate: string;
  consecutiveLoginDays: number;
}

// 注册用户
export async function registerUser(username: string, password: string, email?: string): Promise<{ success: boolean; user?: UserData; error?: string }> {
  try {
    // 使用用户名作为邮箱前缀创建 Firebase 用户
    const emailAddress = email || `${username}@ai-comic-studio.local`;
    
    const userCredential = await createUserWithEmailAndPassword(auth, emailAddress, password);
    const firebaseUser = userCredential.user;
    
    // 更新用户资料
    await updateProfile(firebaseUser, {
      displayName: username
    });
    
    const today = new Date().toISOString().split('T')[0];
    const initialPoints = 50;
    
    const userData: UserData = {
      id: firebaseUser.uid,
      username,
      email: emailAddress,
      points: initialPoints,
      totalEarnedPoints: initialPoints,
      level: 1,
      projectsCount: 0,
      isVIP: false,
      vipLevel: 0,
      vipPoints: 0,
      vipExpireAt: null,
      completedTasks: [],
      visitedPages: [],
      usedStyles: [],
      transactions: [{
        id: Date.now().toString(),
        type: 'earn',
        amount: initialPoints,
        description: '新用户欢迎积分',
        createdAt: new Date().toISOString()
      }],
      createdAt: new Date().toISOString(),
      lastLoginDate: today,
      consecutiveLoginDays: 1
    };
    
    // 保存用户数据到 Firestore
    await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    
    return { success: true, user: userData };
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      return { success: false, error: '该用户名已注册，请直接登录' };
    }
    return { success: false, error: error.message || '注册失败' };
  }
}

// 登录用户
export async function loginUser(username: string, password: string): Promise<{ success: boolean; user?: UserData; error?: string }> {
  try {
    const emailAddress = `${username}@ai-comic-studio.local`;
    
    const userCredential = await signInWithEmailAndPassword(auth, emailAddress, password);
    const firebaseUser = userCredential.user;
    
    // 获取用户数据
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      return { success: false, error: '用户数据不存在' };
    }
    
    const userData = userDoc.data() as UserData;
    
    // 更新登录信息
    const today = new Date().toISOString().split('T')[0];
    let consecutive = userData.consecutiveLoginDays || 1;
    if (userData.lastLoginDate && userData.lastLoginDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      consecutive = userData.lastLoginDate === yesterday.toISOString().split('T')[0] 
        ? consecutive + 1 
        : 1;
    }
    
    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      lastLoginDate: today,
      consecutiveLoginDays: consecutive
    });
    
    userData.lastLoginDate = today;
    userData.consecutiveLoginDays = consecutive;
    
    return { success: true, user: userData };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return { success: false, error: '该账号尚未注册' };
    }
    if (error.code === 'auth/wrong-password') {
      return { success: false, error: '密码错误' };
    }
    return { success: false, error: error.message || '登录失败' };
  }
}

// 自动登录检测
export function onAuthStateChange(callback: (user: UserData | null) => void) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        callback(userDoc.data() as UserData);
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}

// 退出登录
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// 更新用户数据
export async function updateUserData(userId: string, updates: Partial<UserData>): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'users', userId), updates);
    return true;
  } catch {
    return false;
  }
}

// 获取当前用户
export function getCurrentUser() {
  return auth.currentUser;
}
