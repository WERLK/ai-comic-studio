import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState, LoginCredentials, RegisterCredentials, PointTransaction, PointReward, PointExchangeItem, VIP_LEVELS } from '@/types';

interface AuthStore extends AuthState {
  user: User | null;
  points: number;
  level: number;
  totalEarnedPoints: number;
  projectsCount: number;
  isVIP: boolean;
  vipLevel: number;        // VIP等级 0-5
  vipPoints: number;       // 会员积分
  vipExpireAt: string | null; // VIP过期时间
  transactions: PointTransaction[];
  completedTasks: string[];
  visitedPages: string[];
  usedStyles: string[];
  dailyRewards: PointReward[];
  achievementRewards: PointReward[];
  socialRewards: PointReward[];
  creationRewards: PointReward[];
  exploreRewards: PointReward[];
  specialRewards: PointReward[];
  memberRewards: PointReward[];
  levelRewards: PointReward[];
  exchangeItems: PointExchangeItem[];
  serverError?: string;
  clearAllData: () => void;
  login: (credentials: LoginCredentials) => Promise<{ ok: boolean; code?: string; message?: string }>;
  register: (credentials: RegisterCredentials) => Promise<{ ok: boolean; code?: string; message?: string }>;
  logout: () => void;
  addPoints: (amount: number, description: string) => void;
  spendPoints: (amount: number, description: string) => boolean;
  claimReward: (rewardId: string) => boolean;
  exchangeItem: (itemId: string) => boolean;
  markTaskComplete: (taskId: string) => void;
  updateTaskProgress: (taskId: string, progress: number) => void;
  refreshTasks: () => void;
  recordPageVisit: (page: string) => void;
  recordStyleUse: (style: string) => void;
  recordProjectCreation: (frameCount: number, hasCharacters: boolean, hasDialogue: boolean, hasVoice: boolean, style: string) => void;
  // ===== 会员系统 =====
  addVIPPoints: (amount: number, description: string) => void;  // 增加会员积分
  upgradeVIP: (targetLevel: number) => boolean;                 // 升级VIP等级
  checkVIPExpired: () => boolean;                               // 检查VIP是否过期
  getCurrentVIPLevel: () => typeof VIP_LEVELS[number];          // 获取当前VIP等级配置
  getNextVIPLevel: () => typeof VIP_LEVELS[number] | null;      // 获取下一级VIP配置
  // 数据导出导入 (用于跨设备同步，绕过 localStorage 限制)
  exportUserData: () => string;
  importUserData: (json: string) => boolean;
}

const getTodayKey = () => new Date().toISOString().split('T')[0];

const calcLevel = (totalEarned: number): number => {
  if (totalEarned >= 50000) return 100;
  if (totalEarned >= 10000) return 50;
  if (totalEarned >= 3000) return 20;
  if (totalEarned >= 1000) return 10;
  if (totalEarned >= 500) return 5;
  if (totalEarned >= 100) return Math.max(1, Math.floor(totalEarned / 100));
  return 1;
};

// ===== 后端 API 工具 =====
// 后端统一存储用户账号密码和使用数据，确保多端登录数据同步
// API 路径由 vite proxy 转发到 http://localhost:3001

// 生产环境（GitHub Pages）或后端未启动时降级到 localStorage
let API_BASE = '/api';
let apiAvailable = true;
let apiCheckDone = false;

const checkApi = async (): Promise<boolean> => {
  if (apiCheckDone) return apiAvailable;
  apiCheckDone = true;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    clearTimeout(timer);
    apiAvailable = res.ok;
  } catch {
    apiAvailable = false;
  }
  return apiAvailable;
};

// ===== localStorage 后备（后端不可用时使用）=====
const USERS_KEY = 'ai_comic_users_v2';

type StoredUser = User & {
  password: string;
  points: number;
  totalEarnedPoints: number;
  level: number;
  projectsCount: number;
  isVIP: boolean;
  completedTasks: string[];
  visitedPages: string[];
  usedStyles: string[];
  lastLoginDate?: string;
  consecutiveLoginDays: number;
  transactions?: PointTransaction[];
};

const readUsersLocal = (): StoredUser[] => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeUsersLocal = (users: StoredUser[]) => {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
};

// ===== 任务定义（前端计算，数据源为后端返回的用户状态）=====
const makeDailyTasks = (): PointReward[] => [
  { id: 'daily-login', name: '每日签到', description: '每天签到领取随机积分', points: 10, type: 'daily', target: 1, progress: 0 },
  { id: 'daily-create', name: '创作日常', description: '今天创建1个漫剧', points: 25, type: 'daily', target: 1, progress: 0 },
  { id: 'daily-preview', name: '预览作品', description: '预览1个已完成的漫剧', points: 8, type: 'daily', target: 1, progress: 0 },
  { id: 'daily-share', name: '分享作品', description: '分享你的漫剧作品', points: 15, type: 'daily', target: 1, progress: 0 },
  { id: 'daily-comment', name: '每日评论', description: '对1个漫剧发表评论', points: 12, type: 'daily', target: 1, progress: 0 },
  { id: 'daily-favorite', name: '收藏作品', description: '收藏1个喜欢的漫剧', points: 5, type: 'daily', target: 1, progress: 0 },
  { id: 'daily-voice', name: '配音体验', description: '使用配音功能1次', points: 10, type: 'daily', target: 1, progress: 0 },
  { id: 'daily-style', name: '风格切换', description: '尝试不同的绘画风格', points: 8, type: 'daily', target: 1, progress: 0 },
];

const makeAchievementTasks = (extra: { projects: number; consecutiveDays: number; totalEarned: number }): PointReward[] => [
  { id: 'achievement-first', name: '初次创作', description: '完成第一个漫剧作品', points: 50, type: 'achievement', target: 1, progress: Math.min(extra.projects, 1) },
  { id: 'achievement-3proj', name: '创作达人', description: '完成3个漫剧项目', points: 100, type: 'achievement', target: 3, progress: Math.min(extra.projects, 3) },
  { id: 'achievement-10proj', name: '漫剧大师', description: '完成10个漫剧项目', points: 300, type: 'achievement', target: 10, progress: Math.min(extra.projects, 10) },
  { id: 'achievement-50proj', name: '漫剧传奇', description: '完成50个漫剧项目', points: 1000, type: 'achievement', target: 50, progress: Math.min(extra.projects, 50) },
  { id: 'achievement-7days', name: '坚持一周', description: '连续登录7天', points: 80, type: 'achievement', target: 7, progress: Math.min(extra.consecutiveDays, 7) },
  { id: 'achievement-30days', name: '漫剧爱好者', description: '连续登录30天', points: 500, type: 'achievement', target: 30, progress: Math.min(extra.consecutiveDays, 30) },
  { id: 'achievement-100days', name: '铁杆粉丝', description: '连续登录100天', points: 2000, type: 'achievement', target: 100, progress: Math.min(extra.consecutiveDays, 100) },
  { id: 'achievement-1000pts', name: '积分达人', description: '累计获得1000积分', points: 150, type: 'achievement', target: 1000, progress: Math.min(extra.totalEarned, 1000) },
  { id: 'achievement-10000pts', name: '积分富豪', description: '累计获得10000积分', points: 500, type: 'achievement', target: 10000, progress: Math.min(extra.totalEarned, 10000) },
];

const makeSocialTasks = (): PointReward[] => [
  { id: 'social-friend', name: '邀请好友', description: '成功邀请1位好友注册', points: 50, type: 'social', target: 1, progress: 0 },
  { id: 'social-friend-5', name: '社交达人', description: '成功邀请5位好友注册', points: 200, type: 'social', target: 5, progress: 0 },
  { id: 'social-feedback', name: '反馈建议', description: '提交一条有效的反馈建议', points: 20, type: 'social', target: 1, progress: 0 },
  { id: 'social-bug', name: 'Bug猎人', description: '报告一个有效的Bug', points: 50, type: 'social', target: 1, progress: 0 },
  { id: 'social-share', name: '分享社区', description: '分享应用到社交媒体', points: 30, type: 'social', target: 1, progress: 0 },
  { id: 'social-weibo', name: '微博分享', description: '分享到微博平台', points: 25, type: 'social', target: 1, progress: 0 },
  { id: 'social-wechat', name: '微信分享', description: '分享到微信朋友圈', points: 25, type: 'social', target: 1, progress: 0 },
  { id: 'social-qq', name: 'QQ分享', description: '分享到QQ空间', points: 25, type: 'social', target: 1, progress: 0 },
  { id: 'social-douyin', name: '抖音分享', description: '分享到抖音平台', points: 30, type: 'social', target: 1, progress: 0 },
];

const makeCreationTasks = (extra: { projects: number; maxFrames: number; usedStyleCount: number; hasVoice: boolean; hasDialogue: boolean; hasNarration: boolean; exported: number }): PointReward[] => [
  { id: 'creation-5frames', name: '多镜故事', description: '创作包含5个以上分镜的作品', points: 30, type: 'creation', target: 5, progress: extra.maxFrames },
  { id: 'creation-10frames', name: '长篇巨制', description: '创作包含10个以上分镜的作品', points: 60, type: 'creation', target: 10, progress: extra.maxFrames },
  { id: 'creation-char', name: '角色设计师', description: '创建自定义角色', points: 15, type: 'creation', target: 1, progress: extra.projects > 0 ? 1 : 0 },
  { id: 'creation-scene', name: '场景创作家', description: '使用场景背景', points: 15, type: 'creation', target: 1, progress: extra.projects > 0 ? 1 : 0 },
  { id: 'creation-export', name: '作品导出', description: '完成1个漫剧的导出', points: 25, type: 'creation', target: 1, progress: Math.min(extra.exported, 1) },
  { id: 'creation-export-10', name: '导出具匠', description: '累计导出10个作品', points: 100, type: 'creation', target: 10, progress: Math.min(extra.exported, 10) },
  { id: 'creation-style-anime', name: '日系风格', description: '使用日系动漫风格创作', points: 10, type: 'creation', target: 1, progress: extra.usedStyleCount >= 1 ? 1 : 0 },
  { id: 'creation-all-style', name: '风格收集者', description: '使用多种风格各创作一次', points: 50, type: 'creation', target: 4, progress: extra.usedStyleCount },
  { id: 'creation-voice', name: '配音师', description: '为漫剧添加配音', points: 20, type: 'creation', target: 1, progress: extra.hasVoice ? 1 : 0 },
  { id: 'creation-narration', name: '旁白大师', description: '添加旁白说明', points: 10, type: 'creation', target: 1, progress: extra.hasNarration ? 1 : 0 },
  { id: 'creation-dialogue', name: '对白创作者', description: '添加角色对话', points: 10, type: 'creation', target: 1, progress: extra.hasDialogue ? 1 : 0 },
];

const makeExploreTasks = (extra: { usedStyleCount: number; visitedPages: string[] }): PointReward[] => {
  const pageCount = extra.visitedPages.length;
  return [
    { id: 'explore-style', name: '风格尝试', description: '试用多种绘画风格', points: 20, type: 'explore', target: 3, progress: Math.min(extra.usedStyleCount, 3) },
    { id: 'explore-effect', name: '特效探索', description: '尝试使用多种转场特效', points: 15, type: 'explore', target: 2, progress: Math.min(Math.max(pageCount - 1, 0), 2) },
    { id: 'explore-tutorial', name: '教程学习', description: '查看帮助教程', points: 10, type: 'explore', target: 1, progress: extra.visitedPages.includes('tutorial') ? 1 : 0 },
    { id: 'explore-settings', name: '设置达人', description: '访问设置页面', points: 5, type: 'explore', target: 1, progress: extra.visitedPages.includes('settings') ? 1 : 0 },
    { id: 'explore-points', name: '积分中心', description: '访问积分中心', points: 5, type: 'explore', target: 1, progress: extra.visitedPages.includes('points') ? 1 : 0 },
    { id: 'explore-history', name: '历史记录', description: '查看历史创作记录', points: 5, type: 'explore', target: 1, progress: extra.visitedPages.includes('profile') ? 1 : 0 },
    { id: 'explore-all', name: '探索者', description: '访问多个功能页面', points: 30, type: 'explore', target: 5, progress: Math.min(pageCount, 5) },
  ];
};

const makeMemberTasks = (isVIP: boolean): PointReward[] => [
  { id: 'member-vip', name: '成为VIP', description: '开通VIP会员', points: 100, type: 'member', target: 1, progress: 0, isVIPOnly: true },
  { id: 'member-daily', name: 'VIP日报', description: 'VIP每日专属积分', points: 20, type: 'member', target: 1, progress: isVIP ? 1 : 0, isVIPOnly: true },
  { id: 'member-weekly', name: 'VIP周刊', description: 'VIP每周专属任务', points: 100, type: 'member', target: 1, progress: isVIP ? 1 : 0, isVIPOnly: true },
  { id: 'member-exclusive', name: '专属风格', description: '使用VIP专属风格', points: 30, type: 'member', target: 1, progress: isVIP ? 1 : 0, isVIPOnly: true },
  { id: 'member-priority', name: '优先体验', description: '优先体验新功能', points: 50, type: 'member', target: 1, progress: isVIP ? 1 : 0, isVIPOnly: true },
];

const makeLevelTasks = (level: number, totalEarned: number): PointReward[] => [
  { id: 'level-1', name: 'Lv.1 入门', description: '达到1级（累计100积分）', points: 20, type: 'level', target: 100, progress: Math.min(totalEarned, 100) },
  { id: 'level-5', name: 'Lv.5 学徒', description: '达到5级（累计500积分）', points: 50, type: 'level', target: 500, progress: Math.min(totalEarned, 500) },
  { id: 'level-10', name: 'Lv.10 创作者', description: '达到10级（累计1000积分）', points: 100, type: 'level', target: 1000, progress: Math.min(totalEarned, 1000) },
  { id: 'level-20', name: 'Lv.20 达人', description: '达到20级（累计3000积分）', points: 200, type: 'level', target: 3000, progress: Math.min(totalEarned, 3000) },
  { id: 'level-50', name: 'Lv.50 大师', description: '达到50级（累计10000积分）', points: 500, type: 'level', target: 10000, progress: Math.min(totalEarned, 10000) },
  { id: 'level-100', name: 'Lv.100 传奇', description: '达到100级（累计50000积分）', points: 2000, type: 'level', target: 50000, progress: Math.min(totalEarned, 50000) },
];

const makeSpecialTasks = (): PointReward[] => {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;
  const tasks: PointReward[] = [
    { id: 'special-welcome', name: '新手礼包', description: '新用户欢迎礼包', points: 100, type: 'special', target: 1, progress: 0 },
  ];
  if (isWeekend) tasks.push({ id: 'special-bonus', name: '周末双倍', description: '周末签到双倍积分', points: 40, type: 'special', target: 1, progress: 0 });
  if (month === 1 && day <= 3) tasks.push({ id: 'special-newyear', name: '新年活动', description: '新年特别任务', points: 500, type: 'special', target: 1, progress: 0 });
  if (month === 2) tasks.push({ id: 'special-spring', name: '春节活动', description: '春节期间特殊任务', points: 500, type: 'special', target: 1, progress: 0 });
  if (month === 5 && day >= 1 && day <= 7) tasks.push({ id: 'special-labor', name: '劳动节活动', description: '劳动节特别任务', points: 300, type: 'special', target: 1, progress: 0 });
  if (month === 6) tasks.push({ id: 'special-dragon', name: '端午节活动', description: '端午节特别任务', points: 200, type: 'special', target: 1, progress: 0 });
  if (month === 10) tasks.push({ id: 'special-national', name: '国庆活动', description: '国庆节特别任务', points: 500, type: 'special', target: 1, progress: 0 });
  if (month === 12 && day >= 20) tasks.push({ id: 'special-christmas', name: '圣诞活动', description: '圣诞节特别任务', points: 300, type: 'special', target: 1, progress: 0 });
  return tasks;
};

const makeExchangeItems = (): PointExchangeItem[] => [
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

const applyCompletion = (tasks: PointReward[], completed: string[]): PointReward[] => {
  return tasks.map(t => {
    const isCompleted = completed.includes(t.id);
    const hasProgress = t.target !== undefined;
    const canClaimNow = !isCompleted && (!hasProgress || ((t.progress ?? 0) >= (t.target ?? 1)));
    return { ...t, isCompleted, canClaim: canClaimNow };
  });
};

// 根据后端返回的用户对象重建前端任务状态
const initTasksFromUser = (user: User | null) => {
  if (!user) {
    return {
      dailyRewards: makeDailyTasks(),
      achievementRewards: makeAchievementTasks({ projects: 0, consecutiveDays: 1, totalEarned: 0 }),
      socialRewards: makeSocialTasks(),
      creationRewards: makeCreationTasks({ projects: 0, maxFrames: 0, usedStyleCount: 0, hasVoice: false, hasDialogue: false, hasNarration: false, exported: 0 }),
      exploreRewards: makeExploreTasks({ usedStyleCount: 0, visitedPages: [] }),
      specialRewards: makeSpecialTasks(),
      memberRewards: makeMemberTasks(false),
      levelRewards: makeLevelTasks(1, 0),
      exchangeItems: makeExchangeItems(),
    };
  }

  const totalEarned = user.totalEarnedPoints ?? 50;
  const level = calcLevel(totalEarned);
  const projects = user.projectsCount ?? 0;
  const isVIP = !!user.isVIP;
  const consecutiveDays = user.consecutiveLoginDays || 1;
  const usedStyleCount = new Set(user.usedStyles || []).size;
  const visitedPages = user.visitedPages || [];
  const completed = user.completedTasks || [];
  const today = getTodayKey();

  const daily = makeDailyTasks().map(t => {
    const done = completed.includes(t.id);
    if (t.id === 'daily-login') {
      const alreadyLoggedIn = user.lastLoginDate === today;
      return { ...t, isCompleted: done, canClaim: !done && alreadyLoggedIn, progress: alreadyLoggedIn ? 1 : 0, target: 1 };
    }
    return { ...t, isCompleted: done, canClaim: !done };
  });

  return {
    dailyRewards: daily,
    achievementRewards: applyCompletion(makeAchievementTasks({ projects, consecutiveDays, totalEarned }), completed),
    socialRewards: applyCompletion(makeSocialTasks(), completed),
    creationRewards: applyCompletion(makeCreationTasks({ projects, maxFrames: 0, usedStyleCount, hasVoice: false, hasDialogue: false, hasNarration: false, exported: 0 }), completed),
    exploreRewards: applyCompletion(makeExploreTasks({ usedStyleCount, visitedPages }), completed),
    specialRewards: applyCompletion(makeSpecialTasks(), completed),
    memberRewards: applyCompletion(makeMemberTasks(isVIP), completed),
    levelRewards: applyCompletion(makeLevelTasks(level, totalEarned), completed),
    exchangeItems: makeExchangeItems(),
  };
};

// ===== Store =====
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      points: 0,
      level: 1,
      totalEarnedPoints: 0,
      projectsCount: 0,
      isVIP: false,
      vipLevel: 0,
      vipPoints: 0,
      vipExpireAt: null,
      transactions: [],
      completedTasks: [],
      visitedPages: [],
      usedStyles: [],
      dailyRewards: makeDailyTasks(),
      achievementRewards: makeAchievementTasks({ projects: 0, consecutiveDays: 1, totalEarned: 0 }),
      socialRewards: makeSocialTasks(),
      creationRewards: makeCreationTasks({ projects: 0, maxFrames: 0, usedStyleCount: 0, hasVoice: false, hasDialogue: false, hasNarration: false, exported: 0 }),
      exploreRewards: makeExploreTasks({ usedStyleCount: 0, visitedPages: [] }),
      specialRewards: makeSpecialTasks(),
      memberRewards: makeMemberTasks(false),
      levelRewards: makeLevelTasks(1, 0),
      exchangeItems: makeExchangeItems(),

      // ===== 登录：调用后端 API /api/auth/login =====
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        await checkApi();

        try {
          if (apiAvailable) {
            // ===== 后端可用：调用真实的账号数据库 =====
            const res = await fetch(`${API_BASE}/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: credentials.username, password: credentials.password }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
              set({ isLoading: false, serverError: data.error || '登录失败' });
              // 根据 HTTP 状态码区分错误类型
              if (res.status === 404) return { ok: false, code: 'USER_NOT_FOUND', message: data.error || '该账号尚未注册' };
              if (res.status === 401) return { ok: false, code: 'WRONG_PASSWORD', message: data.error || '密码错误' };
              return { ok: false, code: 'LOGIN_FAILED', message: data.error || '登录失败' };
            }

            // 登录成功 - 后端返回的数据是真实账号数据源
            const backendUser = data.user;
            if (!backendUser) {
              set({ isLoading: false });
              return { ok: false, code: 'LOGIN_FAILED', message: '服务器返回数据异常' };
            }

            const tasks = initTasksFromUser(backendUser);
            const savedTransactions: PointTransaction[] = Array.isArray(backendUser.transactions) ? backendUser.transactions : [];

            set({
              user: backendUser,
              isAuthenticated: true,
              isLoading: false,
              serverError: undefined,
              points: backendUser.points ?? 50,
              totalEarnedPoints: backendUser.totalEarnedPoints ?? 50,
              level: backendUser.level ?? 1,
              projectsCount: backendUser.projectsCount ?? 0,
              isVIP: !!backendUser.isVIP,
              completedTasks: backendUser.completedTasks || [],
              visitedPages: backendUser.visitedPages || [],
              usedStyles: backendUser.usedStyles || [],
              transactions: savedTransactions,
              ...tasks,
            });
            return { ok: true, code: 'LOGIN_OK', message: '登录成功' };
          }

          // ===== 后端不可用：降级到 localStorage =====
          const users = readUsersLocal();
          const usernameNormalized = credentials.username.trim().toLowerCase();
          const match = users.find(u => u.username?.trim().toLowerCase() === usernameNormalized);

          if (!match) {
            set({ isLoading: false });
            return { ok: false, code: 'USER_NOT_FOUND', message: '该账号尚未注册' };
          }
          if (match.password !== credentials.password) {
            set({ isLoading: false });
            return { ok: false, code: 'WRONG_PASSWORD', message: '密码错误' };
          }

          const today = getTodayKey();
          let consecutive = match.consecutiveLoginDays || 1;
          if (match.lastLoginDate && match.lastLoginDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            consecutive = match.lastLoginDate === yesterday.toISOString().split('T')[0] ? consecutive + 1 : 1;
          }

          const updated: StoredUser = {
            ...match,
            lastLoginDate: today,
            consecutiveLoginDays: consecutive,
            points: match.points ?? 50,
            totalEarnedPoints: match.totalEarnedPoints ?? 50,
            level: calcLevel(match.totalEarnedPoints ?? 50),
            projectsCount: match.projectsCount ?? 0,
            isVIP: !!match.isVIP,
            completedTasks: match.completedTasks || [],
            visitedPages: match.visitedPages || [],
            usedStyles: match.usedStyles || [],
          };
          writeUsersLocal(users.map(u => (u.id === match.id ? updated : u)));

          const { password, ...safeUser } = updated;
          const tasks = initTasksFromUser(safeUser);
          const savedTransactions: PointTransaction[] = Array.isArray(updated.transactions) ? updated.transactions : [];

          set({
            user: safeUser,
            isAuthenticated: true,
            isLoading: false,
            points: updated.points,
            totalEarnedPoints: updated.totalEarnedPoints,
            level: updated.level,
            projectsCount: updated.projectsCount,
            isVIP: updated.isVIP,
            completedTasks: updated.completedTasks,
            visitedPages: updated.visitedPages,
            usedStyles: updated.usedStyles,
            transactions: savedTransactions,
            ...tasks,
          });
          return { ok: true, code: 'LOGIN_OK', message: '登录成功' };
        } catch (err: any) {
          set({ isLoading: false, serverError: err?.message || '网络错误' });
          return { ok: false, code: 'NETWORK_ERROR', message: '网络连接异常，请稍后重试' };
        }
      },

      // ===== 注册：调用后端 API /api/auth/register =====
      register: async (credentials: RegisterCredentials) => {
        set({ isLoading: true });
        await checkApi();

        try {
          if (apiAvailable) {
            const res = await fetch(`${API_BASE}/auth/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: credentials.username,
                email: credentials.email || '',
                password: credentials.password,
              }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
              set({ isLoading: false, serverError: data.error || '注册失败' });
              if (res.status === 409) return { ok: false, code: 'USER_EXISTS', message: data.error || '该用户名已注册' };
              return { ok: false, code: 'REGISTER_FAILED', message: data.error || '注册失败' };
            }

            const backendUser = data.user;
            if (!backendUser) {
              set({ isLoading: false });
              return { ok: false, code: 'REGISTER_FAILED', message: '服务器返回数据异常' };
            }

            const tasks = initTasksFromUser(backendUser);
            const savedTransactions: PointTransaction[] = Array.isArray(backendUser.transactions) ? backendUser.transactions : [];

            set({
              user: backendUser,
              isAuthenticated: true,
              isLoading: false,
              serverError: undefined,
              points: backendUser.points ?? 50,
              totalEarnedPoints: backendUser.totalEarnedPoints ?? 50,
              level: backendUser.level ?? 1,
              projectsCount: backendUser.projectsCount ?? 0,
              isVIP: !!backendUser.isVIP,
              completedTasks: backendUser.completedTasks || [],
              visitedPages: backendUser.visitedPages || [],
              usedStyles: backendUser.usedStyles || [],
              transactions: savedTransactions,
              ...tasks,
            });
            return { ok: true, code: 'REGISTER_OK', message: '注册成功' };
          }

          // 后端不可用：降级 localStorage
          const users = readUsersLocal();
          const usernameNormalized = credentials.username.trim().toLowerCase();
          const emailNormalized = (credentials.email || '').trim().toLowerCase();
          const existing = users.find(u => u.username?.trim().toLowerCase() === usernameNormalized);

          if (existing) {
            if (existing.password === credentials.password) {
              // 密码相同 - 视为登录（同手机号/用户名多端登录场景）
              const loginResult = await get().login({ username: credentials.username, password: credentials.password });
              set({ isLoading: false });
              return loginResult;
            }
            set({ isLoading: false });
            return { ok: false, code: 'USER_EXISTS', message: '该用户名已注册，请直接登录' };
          }

          const today = getTodayKey();
          const initialPoints = 50;
          const newUser: StoredUser = {
            id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
            username: credentials.username.trim(),
            email: emailNormalized,
            points: initialPoints,
            totalEarnedPoints: initialPoints,
            level: 1,
            projectsCount: 0,
            isVIP: false,
            createdAt: new Date().toISOString(),
            lastLoginDate: today,
            consecutiveLoginDays: 1,
            completedTasks: [],
            visitedPages: [],
            usedStyles: [],
            password: credentials.password,
            transactions: [{
              id: Date.now().toString(),
              type: 'earn',
              amount: initialPoints,
              description: '新用户欢迎积分',
              createdAt: new Date().toISOString(),
            }],
          };

          writeUsersLocal([...users, newUser]);

          const { password, ...safeUser } = newUser;
          const tasks = initTasksFromUser(safeUser);

          set({
            user: safeUser,
            isAuthenticated: true,
            isLoading: false,
            points: initialPoints,
            totalEarnedPoints: initialPoints,
            level: 1,
            projectsCount: 0,
            isVIP: false,
            completedTasks: [],
            visitedPages: [],
            usedStyles: [],
            transactions: (newUser.transactions || []),
            ...tasks,
          });
          return { ok: true, code: 'REGISTER_OK', message: '注册成功' };
        } catch (err: any) {
          set({ isLoading: false, serverError: err?.message || '网络错误' });
          return { ok: false, code: 'NETWORK_ERROR', message: '网络连接异常，请稍后重试' };
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      clearAllData: () => {
        localStorage.removeItem(USERS_KEY);
        localStorage.removeItem('manga-studio-projects-v2');
        localStorage.removeItem('lucky_wheel_state_v2');
        const fresh = initTasksFromUser(null);
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          points: 0,
          level: 1,
          totalEarnedPoints: 0,
          projectsCount: 0,
          isVIP: false,
          transactions: [],
          completedTasks: [],
          visitedPages: [],
          usedStyles: [],
          ...fresh,
        });
      },

      // ===== 积分变更时同步到后端 =====
      addPoints: (amount: number, description: string) => {
        set(state => {
          const newPoints = state.points + amount;
          const newTotal = state.totalEarnedPoints + amount;
          const newLevel = calcLevel(newTotal);
          const tx: PointTransaction = {
            id: Date.now().toString(),
            type: 'earn',
            amount,
            description,
            createdAt: new Date().toISOString(),
          };
          const newTransactions = [tx, ...state.transactions].slice(0, 50);

          // 同步回后端账号数据库
          if (state.user && state.user.id && apiAvailable) {
            fetch(`${API_BASE}/users/${state.user.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                points: newPoints,
                totalEarnedPoints: newTotal,
                level: newLevel,
                transactions: newTransactions,
              }),
            }).catch(() => {});
          }
          // 同步到 localStorage 后备
          if (state.user) {
            const users = readUsersLocal();
            const updatedUsers = users.map(u => u.id === state.user!.id ? ({
              ...u,
              points: newPoints,
              totalEarnedPoints: newTotal,
              level: newLevel,
              transactions: newTransactions,
            }) : u);
            writeUsersLocal(updatedUsers);
          }

          return {
            points: newPoints,
            totalEarnedPoints: newTotal,
            level: newLevel,
            transactions: newTransactions,
            user: state.user ? { ...state.user, points: newPoints, totalEarnedPoints: newTotal, level: newLevel } : null,
          };
        });
        setTimeout(() => get().refreshTasks(), 20);
      },

      spendPoints: (amount: number, description: string) => {
        if (get().points < amount) return false;
        set(state => {
          const newPoints = state.points - amount;
          const tx: PointTransaction = {
            id: Date.now().toString(),
            type: 'spend',
            amount,
            description,
            createdAt: new Date().toISOString(),
          };
          const newTransactions = [tx, ...state.transactions].slice(0, 50);

          if (state.user && state.user.id && apiAvailable) {
            fetch(`${API_BASE}/users/${state.user.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ points: newPoints, transactions: newTransactions }),
            }).catch(() => {});
          }
          if (state.user) {
            const users = readUsersLocal();
            writeUsersLocal(users.map(u => u.id === state.user!.id ? ({ ...u, points: newPoints, transactions: newTransactions }) : u));
          }

          return {
            points: newPoints,
            transactions: newTransactions,
            user: state.user ? { ...state.user, points: newPoints } : null,
          };
        });
        return true;
      },

      claimReward: (rewardId: string) => {
        const state = get();
        if (state.completedTasks.includes(rewardId)) return false;

        const all: PointReward[][] = [
          state.dailyRewards, state.achievementRewards, state.socialRewards, state.creationRewards,
          state.exploreRewards, state.specialRewards, state.memberRewards, state.levelRewards,
        ];
        let found: PointReward | undefined;
        for (const list of all) {
          found = list.find(t => t.id === rewardId);
          if (found) break;
        }
        if (!found) return false;
        if ((found as any).isVIPOnly && !state.isVIP) return false;
        if (found.target !== undefined && (found.progress ?? 0) < found.target) return false;

        let rewardPoints = found.points;
        if (rewardId === 'daily-login') rewardPoints = Math.floor(Math.random() * 20) + 1;

        get().addPoints(rewardPoints, found.name);

        const newCompleted = [...state.completedTasks, rewardId];
        const markFn = (list: PointReward[]): PointReward[] => list.map(t => t.id === rewardId ? { ...t, isCompleted: true, canClaim: false } : t);

        set(s => {
          if (s.user && s.user.id && apiAvailable) {
            fetch(`${API_BASE}/users/${s.user.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ completedTasks: newCompleted }),
            }).catch(() => {});
          }
          if (s.user) {
            const users = readUsersLocal();
            writeUsersLocal(users.map(u => u.id === s.user!.id ? ({ ...u, completedTasks: newCompleted }) : u));
          }
          return {
            completedTasks: newCompleted,
            dailyRewards: markFn(s.dailyRewards),
            achievementRewards: markFn(s.achievementRewards),
            socialRewards: markFn(s.socialRewards),
            creationRewards: markFn(s.creationRewards),
            exploreRewards: markFn(s.exploreRewards),
            specialRewards: markFn(s.specialRewards),
            memberRewards: markFn(s.memberRewards),
            levelRewards: markFn(s.levelRewards),
            user: s.user ? { ...s.user, completedTasks: newCompleted } : null,
          };
        });
        return true;
      },

      exchangeItem: (itemId: string) => {
        const state = get();
        const item = state.exchangeItems.find(i => i.id === itemId);
        if (!item || state.points < item.price || item.stock <= 0) return false;
        const ok = get().spendPoints(item.price, `兑换: ${item.name}`);
        if (ok) {
          set(s => ({
            exchangeItems: s.exchangeItems.map(i => i.id === itemId ? { ...i, stock: i.stock - 1 } : i),
          }));
        }
        return ok;
      },

      markTaskComplete: (taskId: string) => {
        get().updateTaskProgress(taskId, 9999);
      },

      updateTaskProgress: (taskId: string, progress: number) => {
        set(state => {
          const updateFn = (tasks: PointReward[]): PointReward[] => tasks.map(t => {
            if (t.id !== taskId || t.target === undefined) return t;
            const newProgress = Math.min((t.progress || 0) + progress, t.target);
            const reached = newProgress >= t.target;
            const alreadyDone = state.completedTasks.includes(t.id);
            return { ...t, progress: newProgress, canClaim: reached && !alreadyDone };
          });

          if (state.user) {
            const users = readUsersLocal();
            writeUsersLocal(users.map(u => u.id === state.user!.id ? ({
              ...u,
              visitedPages: state.visitedPages,
              usedStyles: state.usedStyles,
              projectsCount: state.projectsCount,
            }) : u));
          }

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

      refreshTasks: () => {
        const state = get();
        const fresh = initTasksFromUser(state.user);
        set(fresh);
      },

      recordPageVisit: (page: string) => {
        set(state => {
          if (state.visitedPages.includes(page)) return {};
          const newVisited = [...state.visitedPages, page];

          if (state.user && state.user.id && apiAvailable) {
            fetch(`${API_BASE}/users/${state.user.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ visitedPages: newVisited }),
            }).catch(() => {});
          }
          if (state.user) {
            const users = readUsersLocal();
            writeUsersLocal(users.map(u => u.id === state.user!.id ? ({ ...u, visitedPages: newVisited }) : u));
          }

          const explore = state.exploreRewards.map(t => {
            if (t.target === undefined) return t;
            let progress = t.progress || 0;
            if (t.id === 'explore-tutorial' && page === 'tutorial') progress = 1;
            if (t.id === 'explore-settings' && page === 'settings') progress = 1;
            if (t.id === 'explore-points' && page === 'points') progress = 1;
            if (t.id === 'explore-history' && page === 'profile') progress = 1;
            if (t.id === 'explore-all') progress = Math.min(newVisited.length, 5);
            progress = Math.min(progress, t.target);
            const reached = progress >= t.target;
            const done = state.completedTasks.includes(t.id);
            return { ...t, progress, canClaim: reached && !done };
          });

          return { visitedPages: newVisited, exploreRewards: explore, user: state.user ? { ...state.user, visitedPages: newVisited } : null };
        });
      },

      recordStyleUse: (style: string) => {
        set(state => {
          if (!style) return {};
          if (state.usedStyles.includes(style)) return {};
          const newStyles = [...state.usedStyles, style];
          const styleCount = new Set(newStyles).size;

          if (state.user && state.user.id && apiAvailable) {
            fetch(`${API_BASE}/users/${state.user.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ usedStyles: newStyles }),
            }).catch(() => {});
          }
          if (state.user) {
            const users = readUsersLocal();
            writeUsersLocal(users.map(u => u.id === state.user!.id ? ({ ...u, usedStyles: newStyles }) : u));
          }

          const daily = state.dailyRewards.map(t => {
            if (t.id === 'daily-style' && t.target !== undefined && !state.completedTasks.includes(t.id)) {
              const p = Math.min((t.progress || 0) + 1, t.target);
              return { ...t, progress: p, canClaim: p >= t.target };
            }
            return t;
          });
          const explore = state.exploreRewards.map(t => {
            if (t.id === 'explore-style' && t.target !== undefined && !state.completedTasks.includes(t.id)) {
              const p = Math.min(styleCount, t.target);
              return { ...t, progress: p, canClaim: p >= t.target };
            }
            return t;
          });
          const creation = state.creationRewards.map(t => {
            if (t.id === 'creation-all-style' && t.target !== undefined && !state.completedTasks.includes(t.id)) {
              const p = Math.min(styleCount, t.target);
              return { ...t, progress: p, canClaim: p >= t.target };
            }
            if (t.id === 'creation-style-anime' && !state.completedTasks.includes(t.id)) {
              return { ...t, progress: 1, canClaim: true };
            }
            return t;
          });

          return {
            usedStyles: newStyles,
            dailyRewards: daily,
            exploreRewards: explore,
            creationRewards: creation,
            user: state.user ? { ...state.user, usedStyles: newStyles } : null,
          };
        });
      },

      recordProjectCreation: (frameCount: number, hasCharacters: boolean, hasDialogue: boolean, hasVoice: boolean, style: string) => {
        set(state => {
          const newCount = state.projectsCount + 1;

          if (state.user && state.user.id && apiAvailable) {
            fetch(`${API_BASE}/users/${state.user.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ projectsCount: newCount }),
            }).catch(() => {});
          }
          if (state.user) {
            const users = readUsersLocal();
            writeUsersLocal(users.map(u => u.id === state.user!.id ? ({ ...u, projectsCount: newCount }) : u));
          }

          const styleCount = new Set([...state.usedStyles, style].filter(Boolean)).size;
          const completed = state.completedTasks;

          const daily = state.dailyRewards.map(t => {
            if (t.id === 'daily-create') return { ...t, progress: 1, canClaim: !completed.includes(t.id) };
            if (t.id === 'daily-voice' && hasVoice) return { ...t, progress: 1, canClaim: !completed.includes(t.id) };
            return t;
          });

          const creation = makeCreationTasks({
            projects: newCount,
            maxFrames: Math.max(frameCount, 0),
            usedStyleCount: styleCount,
            hasVoice,
            hasDialogue,
            hasNarration: hasDialogue,
            exported: 0,
          }).map(t => completed.includes(t.id) ? { ...t, isCompleted: true, canClaim: false } : t);

          const achievement = makeAchievementTasks({
            projects: newCount,
            consecutiveDays: state.user?.consecutiveLoginDays || 1,
            totalEarned: state.totalEarnedPoints,
          }).map(t => completed.includes(t.id) ? { ...t, isCompleted: true, canClaim: false } : t);

          return {
            projectsCount: newCount,
            dailyRewards: daily,
            creationRewards: creation,
            achievementRewards: achievement,
            user: state.user ? { ...state.user, projectsCount: newCount } : null,
          };
        });
      },

      exportUserData: () => {
        const state = get();
        if (!state.user) return '';
        return JSON.stringify({
          version: '1.8.1',
          exportedAt: new Date().toISOString(),
          user: state.user,
          extra: {
            points: state.points,
            totalEarnedPoints: state.totalEarnedPoints,
            level: state.level,
            projectsCount: state.projectsCount,
            isVIP: state.isVIP,
            transactions: state.transactions,
            completedTasks: state.completedTasks,
            visitedPages: state.visitedPages,
            usedStyles: state.usedStyles,
          },
        });
      },

      importUserData: (json: string) => {
        try {
          const data = JSON.parse(json);
          if (!data || !data.user) return false;

          const importedUser = data.user;
          const extra = data.extra || {};
          const updatedUser: User = {
            ...importedUser,
            points: extra.points ?? importedUser.points ?? 50,
            totalEarnedPoints: extra.totalEarnedPoints ?? importedUser.totalEarnedPoints ?? 50,
            level: extra.level ?? calcLevel(extra.totalEarnedPoints ?? importedUser.totalEarnedPoints ?? 50),
            projectsCount: extra.projectsCount ?? importedUser.projectsCount ?? 0,
            isVIP: !!extra.isVIP || !!importedUser.isVIP,
            vipLevel: extra.vipLevel ?? importedUser.vipLevel ?? 0,
            vipPoints: extra.vipPoints ?? importedUser.vipPoints ?? 0,
            vipExpireAt: extra.vipExpireAt ?? importedUser.vipExpireAt ?? null,
            completedTasks: extra.completedTasks ?? importedUser.completedTasks ?? [],
            visitedPages: extra.visitedPages ?? importedUser.visitedPages ?? [],
            usedStyles: extra.usedStyles ?? importedUser.usedStyles ?? [],
          };

          // 如果后端可用，同步导入数据到后端
          if (updatedUser.id && apiAvailable) {
            fetch(`${API_BASE}/users/${updatedUser.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                points: updatedUser.points,
                totalEarnedPoints: updatedUser.totalEarnedPoints,
                level: updatedUser.level,
                projectsCount: updatedUser.projectsCount,
                isVIP: updatedUser.isVIP,
                vipLevel: updatedUser.vipLevel,
                vipPoints: updatedUser.vipPoints,
                vipExpireAt: updatedUser.vipExpireAt,
                completedTasks: updatedUser.completedTasks,
                visitedPages: updatedUser.visitedPages,
                usedStyles: updatedUser.usedStyles,
                transactions: extra.transactions,
              }),
            }).catch(() => {});
          }

          const tasks = initTasksFromUser(updatedUser);
          set({
            user: updatedUser,
            isAuthenticated: true,
            points: updatedUser.points,
            totalEarnedPoints: updatedUser.totalEarnedPoints,
            level: updatedUser.level,
            projectsCount: updatedUser.projectsCount,
            isVIP: updatedUser.isVIP,
            vipLevel: updatedUser.vipLevel ?? 0,
            vipPoints: updatedUser.vipPoints ?? 0,
            vipExpireAt: updatedUser.vipExpireAt ?? null,
            completedTasks: updatedUser.completedTasks,
            visitedPages: updatedUser.visitedPages,
            usedStyles: updatedUser.usedStyles,
            transactions: extra.transactions ?? [],
            ...tasks,
          });
          return true;
        } catch {
          return false;
        }
      },

      // ===== 会员系统 =====
      addVIPPoints: (amount: number, description: string) => {
        set(state => {
          const newVIPPoints = (state.vipPoints || 0) + amount;
          // 自动计算VIP等级
          let newVIPLevel = 0;
          for (let i = VIP_LEVELS.length - 1; i >= 0; i--) {
            if (newVIPPoints >= VIP_LEVELS[i].minPoints) {
              newVIPLevel = VIP_LEVELS[i].level;
              break;
            }
          }
          const newIsVIP = newVIPLevel >= 1;

          if (state.user) {
            const users = readUsersLocal();
            writeUsersLocal(users.map(u => u.id === state.user!.id ? ({
              ...u,
              vipPoints: newVIPPoints,
              vipLevel: newVIPLevel,
              isVIP: newIsVIP,
            }) : u));
          }

          return {
            vipPoints: newVIPPoints,
            vipLevel: newVIPLevel,
            isVIP: newIsVIP,
            user: state.user ? { ...state.user, vipPoints: newVIPPoints, vipLevel: newVIPLevel, isVIP: newIsVIP } : null,
          };
        });
      },

      upgradeVIP: (targetLevel: number) => {
        const state = get();
        if (targetLevel < 1 || targetLevel >= VIP_LEVELS.length) return false;
        const target = VIP_LEVELS[targetLevel];
        if (!target) return false;
        // 升级需要消耗普通积分
        const cost = target.minPoints;
        if (state.points < cost) return false;

        const ok = get().spendPoints(cost, `升级至${target.name}`);
        if (!ok) return false;

        const expireDate = new Date();
        expireDate.setMonth(expireDate.getMonth() + 1); // 默认1个月有效期

        set(s => {
          const newVIPPoints = Math.max(s.vipPoints || 0, target.minPoints);
          if (s.user) {
            const users = readUsersLocal();
            writeUsersLocal(users.map(u => u.id === s.user!.id ? ({
              ...u,
              vipLevel: targetLevel,
              isVIP: true,
              vipPoints: newVIPPoints,
              vipExpireAt: expireDate.toISOString(),
            }) : u));
          }
          return {
            vipLevel: targetLevel,
            isVIP: true,
            vipPoints: newVIPPoints,
            vipExpireAt: expireDate.toISOString(),
            user: s.user ? { ...s.user, vipLevel: targetLevel, isVIP: true, vipPoints: newVIPPoints, vipExpireAt: expireDate.toISOString() } : null,
          };
        });
        return true;
      },

      checkVIPExpired: () => {
        const state = get();
        if (!state.isVIP || !state.vipExpireAt) return false;
        const now = new Date();
        const expire = new Date(state.vipExpireAt);
        if (now > expire) {
          // VIP已过期，降级
          set(s => {
            if (s.user) {
              const users = readUsersLocal();
              writeUsersLocal(users.map(u => u.id === s.user!.id ? ({
                ...u,
                isVIP: false,
                vipLevel: 0,
                vipExpireAt: undefined,
              }) : u));
            }
            return {
              isVIP: false,
              vipLevel: 0,
              vipExpireAt: null,
              user: s.user ? { ...s.user, isVIP: false, vipLevel: 0, vipExpireAt: undefined } : null,
            };
          });
          return true;
        }
        return false;
      },

      getCurrentVIPLevel: () => {
        const state = get();
        return VIP_LEVELS[state.vipLevel || 0] || VIP_LEVELS[0];
      },

      getNextVIPLevel: () => {
        const state = get();
        const next = (state.vipLevel || 0) + 1;
        if (next >= VIP_LEVELS.length) return null;
        return VIP_LEVELS[next];
      },
    }),
    {
      name: 'ai_comic_auth_v2',
      version: 2,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        points: state.points,
        totalEarnedPoints: state.totalEarnedPoints,
        level: state.level,
        projectsCount: state.projectsCount,
        isVIP: state.isVIP,
        vipLevel: state.vipLevel,
        vipPoints: state.vipPoints,
        vipExpireAt: state.vipExpireAt,
        transactions: state.transactions,
        completedTasks: state.completedTasks,
        visitedPages: state.visitedPages,
        usedStyles: state.usedStyles,
      }),
    }
  )
);
