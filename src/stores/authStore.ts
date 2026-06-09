import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState, LoginCredentials, RegisterCredentials, PointTransaction, PointReward, PointExchangeItem, TaskType } from '@/types';

interface AuthStore extends AuthState {
  user: User | null;
  points: number;
  level: number;
  totalEarnedPoints: number;
  projectsCount: number;
  isVIP: boolean;
  transactions: PointTransaction[];
  completedTasks: string[];
  visitedPages: string[];
  usedStyles: string[];
  dailyLoginDate: string | null;
  dailyRewards: PointReward[];
  achievementRewards: PointReward[];
  socialRewards: PointReward[];
  creationRewards: PointReward[];
  exploreRewards: PointReward[];
  specialRewards: PointReward[];
  memberRewards: PointReward[];
  levelRewards: PointReward[];
  exchangeItems: PointExchangeItem[];
  clearAllData: () => void;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
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
}

const DATA_VERSION = 'v3';

const getTodayKey = () => {
  return new Date().toISOString().split('T')[0];
};

const calcLevel = (totalEarned: number): number => {
  if (totalEarned >= 50000) return 100;
  if (totalEarned >= 10000) return 50;
  if (totalEarned >= 3000) return 20;
  if (totalEarned >= 1000) return 10;
  if (totalEarned >= 500) return 5;
  if (totalEarned >= 100) return Math.max(1, Math.floor(totalEarned / 100));
  return 1;
};

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
  { id: 'social-friend', name: '邀请好友', description: '成功邀请1位好友注册（邀请后自动领取）', points: 50, type: 'social', target: 1, progress: 0, autoUnlockHint: '需要真实邀请好友完成' },
  { id: 'social-friend-5', name: '社交达人', description: '成功邀请5位好友注册', points: 200, type: 'social', target: 5, progress: 0, autoUnlockHint: '需要真实邀请好友完成' },
  { id: 'social-feedback', name: '反馈建议', description: '提交一条有效的反馈建议', points: 20, type: 'social', target: 1, progress: 0, autoUnlockHint: '提交反馈后由管理员审核后领取' },
  { id: 'social-bug', name: 'Bug猎人', description: '报告一个有效的Bug', points: 50, type: 'social', target: 1, progress: 0, autoUnlockHint: '报告Bug后由管理员审核后领取' },
  { id: 'social-share', name: '分享社区', description: '分享应用到社交媒体', points: 30, type: 'social', target: 1, progress: 0, autoUnlockHint: '完成分享操作后自动领取' },
  { id: 'social-weibo', name: '微博分享', description: '分享到微博平台', points: 25, type: 'social', target: 1, progress: 0, autoUnlockHint: '分享到微博后自动领取' },
  { id: 'social-wechat', name: '微信分享', description: '分享到微信朋友圈', points: 25, type: 'social', target: 1, progress: 0, autoUnlockHint: '分享到微信后自动领取' },
  { id: 'social-qq', name: 'QQ分享', description: '分享到QQ空间', points: 25, type: 'social', target: 1, progress: 0, autoUnlockHint: '分享到QQ后自动领取' },
  { id: 'social-douyin', name: '抖音分享', description: '分享到抖音平台', points: 30, type: 'social', target: 1, progress: 0, autoUnlockHint: '分享到抖音后自动领取' },
];

const makeCreationTasks = (extra: { projects: number; maxFrames: number; usedStyleCount: number; hasVoice: boolean; hasDialogue: boolean; hasNarration: boolean; exported: number }): PointReward[] => [
  { id: 'creation-5frames', name: '多镜故事', description: '创作包含5个以上分镜的作品', points: 30, type: 'creation', target: 5, progress: extra.maxFrames },
  { id: 'creation-10frames', name: '长篇巨制', description: '创作包含10个以上分镜的作品', points: 60, type: 'creation', target: 10, progress: extra.maxFrames },
  { id: 'creation-char', name: '角色设计师', description: '创建自定义角色（从文本中自动提取角色也算）', points: 15, type: 'creation', target: 1, progress: extra.projects > 0 ? 1 : 0 },
  { id: 'creation-scene', name: '场景创作家', description: '使用场景背景（系统自动场景也算）', points: 15, type: 'creation', target: 1, progress: extra.projects > 0 ? 1 : 0 },
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
  { id: 'member-vip', name: '成为VIP', description: '开通VIP会员（此任务用于解锁VIP功能）', points: 100, type: 'member', target: 1, progress: 0, isVIPOnly: true, autoUnlockHint: '开通VIP后自动领取' },
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
    { id: 'special-welcome', name: '新手礼包', description: '新用户欢迎礼包（首次登录时自动领取）', points: 100, type: 'special', target: 1, progress: 0, autoUnlockHint: '新用户首次登录自动领取' },
  ];

  if (isWeekend) {
    tasks.push({ id: 'special-bonus', name: '周末双倍', description: '周末签到双倍积分', points: 40, type: 'special', target: 1, progress: 0, autoUnlockHint: '周末访问积分中心自动领取' });
  }

  if (month === 1 && day <= 3) tasks.push({ id: 'special-newyear', name: '新年活动', description: '新年特别任务', points: 500, type: 'special', target: 1, progress: 0, autoUnlockHint: '新年期间访问即可领取' });
  if (month === 2) tasks.push({ id: 'special-spring', name: '春节活动', description: '春节期间特殊任务', points: 500, type: 'special', target: 1, progress: 0, autoUnlockHint: '春节期间访问即可领取' });
  if (month === 5 && day >= 1 && day <= 7) tasks.push({ id: 'special-labor', name: '劳动节活动', description: '劳动节特别任务', points: 300, type: 'special', target: 1, progress: 0, autoUnlockHint: '劳动节期间访问即可领取' });
  if (month === 6) tasks.push({ id: 'special-dragon', name: '端午节活动', description: '端午节特别任务', points: 200, type: 'special', target: 1, progress: 0, autoUnlockHint: '端午节期间访问即可领取' });
  if (month === 10) tasks.push({ id: 'special-national', name: '国庆活动', description: '国庆节特别任务', points: 500, type: 'special', target: 1, progress: 0, autoUnlockHint: '国庆节期间访问即可领取' });
  if (month === 12 && day >= 20) tasks.push({ id: 'special-christmas', name: '圣诞活动', description: '圣诞节特别任务', points: 300, type: 'special', target: 1, progress: 0, autoUnlockHint: '圣诞节期间访问即可领取' });

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

// 计算任务状态：基于 completedTasks 标记已领取，基于 progress/target 判断是否可领取
const applyCompletion = (tasks: PointReward[], completed: string[]): PointReward[] => {
  return tasks.map(t => {
    const isCompleted = completed.includes(t.id);
    const hasProgress = t.target !== undefined;
    const canClaimNow = !isCompleted && (!hasProgress || ((t.progress ?? 0) >= (t.target ?? 1)));
    return {
      ...t,
      isCompleted,
      canClaim: canClaimNow,
    };
  });
};

// ====== Store ======
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
      transactions: [],
      completedTasks: [],
      visitedPages: [],
      usedStyles: [],
      dailyLoginDate: null,
      dailyRewards: makeDailyTasks(),
      achievementRewards: makeAchievementTasks({ projects: 0, consecutiveDays: 1, totalEarned: 0 }),
      socialRewards: makeSocialTasks(),
      creationRewards: makeCreationTasks({ projects: 0, maxFrames: 0, usedStyleCount: 0, hasVoice: false, hasDialogue: false, hasNarration: false, exported: 0 }),
      exploreRewards: makeExploreTasks({ usedStyleCount: 0, visitedPages: [] }),
      specialRewards: makeSpecialTasks(),
      memberRewards: makeMemberTasks(false),
      levelRewards: makeLevelTasks(1, 0),
      exchangeItems: makeExchangeItems(),

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          await new Promise(resolve => setTimeout(resolve, 500));

          let storedUsers: (User & { password: string; points?: number; completedTasks?: string[]; totalEarnedPoints?: number; projectsCount?: number; isVIP?: boolean; visitedPages?: string[]; usedStyles?: string[]; consecutiveLoginDays?: number; lastLoginDate?: string })[] = [];
          try {
            const usersData = localStorage.getItem('ai_comic_users');
            if (usersData && usersData.trim()) {
              storedUsers = JSON.parse(usersData);
              if (!Array.isArray(storedUsers)) storedUsers = [];
            }
          } catch {
            storedUsers = [];
          }

          const normalizedUsername = credentials.username.trim().toLowerCase();
          const user = storedUsers.find(u =>
            u.username?.trim().toLowerCase() === normalizedUsername &&
            u.password === credentials.password
          );

          if (user) {
            const today = getTodayKey();
            let consecutiveLoginDays = user.consecutiveLoginDays || 0;

            if (user.lastLoginDate) {
              if (user.lastLoginDate !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayKey = yesterday.toISOString().split('T')[0];
                consecutiveLoginDays = user.lastLoginDate === yesterdayKey ? consecutiveLoginDays + 1 : 1;
              }
            } else {
              consecutiveLoginDays = 1;
            }

            const totalEarned = user.totalEarnedPoints ?? 50;
            const currentPoints = user.points ?? 50;
            const currentLevel = calcLevel(totalEarned);
            const projCount = user.projectsCount ?? 0;
            const isVIP = !!user.isVIP;

            const updatedUser = {
              ...user,
              lastLoginDate: today,
              consecutiveLoginDays,
              points: currentPoints,
              totalEarnedPoints: totalEarned,
              level: currentLevel,
              projectsCount: projCount,
              isVIP,
              completedTasks: user.completedTasks || [],
              visitedPages: user.visitedPages || [],
              usedStyles: user.usedStyles || [],
            };

            const updatedUsers = storedUsers.map(u => u.id === user.id ? updatedUser : u);
            localStorage.setItem('ai_comic_users', JSON.stringify(updatedUsers));

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _password, ...userWithoutPassword } = updatedUser;

            // 刷新每日任务（每天首次登录重置非签到任务）
            const daily = makeDailyTasks().map(t => {
              const done = (updatedUser.completedTasks || []).includes(t.id);
              if (t.id === 'daily-login') {
                // 签到任务：如果今天已经登录过，标记进度为1
                return { ...t, isCompleted: done, canClaim: !done, progress: 1, target: 1 };
              }
              return { ...t, isCompleted: done, canClaim: !done };
            });

            // 构造新的任务列表
            set(state => ({
              user: userWithoutPassword,
              isAuthenticated: true,
              points: currentPoints,
              totalEarnedPoints: totalEarned,
              level: currentLevel,
              projectsCount: projCount,
              isVIP,
              completedTasks: updatedUser.completedTasks || [],
              visitedPages: updatedUser.visitedPages || [],
              usedStyles: updatedUser.usedStyles || [],
              isLoading: false,
              dailyRewards: daily,
              achievementRewards: applyCompletion(makeAchievementTasks({ projects: projCount, consecutiveDays: consecutiveLoginDays, totalEarned }), updatedUser.completedTasks || []),
              socialRewards: applyCompletion(makeSocialTasks(), updatedUser.completedTasks || []),
              creationRewards: applyCompletion(makeCreationTasks({ projects: projCount, maxFrames: 0, usedStyleCount: (updatedUser.usedStyles || []).length, hasVoice: false, hasDialogue: false, hasNarration: false, exported: 0 }), updatedUser.completedTasks || []),
              exploreRewards: applyCompletion(makeExploreTasks({ usedStyleCount: (updatedUser.usedStyles || []).length, visitedPages: updatedUser.visitedPages || [] }), updatedUser.completedTasks || []),
              specialRewards: applyCompletion(makeSpecialTasks(), updatedUser.completedTasks || []),
              memberRewards: applyCompletion(makeMemberTasks(isVIP), updatedUser.completedTasks || []),
              levelRewards: applyCompletion(makeLevelTasks(currentLevel, totalEarned), updatedUser.completedTasks || []),
              dailyLoginDate: today,
              transactions: state.transactions,
            }));

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
          await new Promise(resolve => setTimeout(resolve, 500));

          let storedUsers: any[] = [];
          try {
            const usersData = localStorage.getItem('ai_comic_users');
            if (usersData && usersData.trim()) {
              storedUsers = JSON.parse(usersData);
              if (!Array.isArray(storedUsers)) storedUsers = [];
            }
          } catch {
            storedUsers = [];
          }

          const normalizedUsername = credentials.username.trim().toLowerCase();
          const normalizedEmail = (credentials.email || '').trim().toLowerCase();

          const filteredUsers = storedUsers.filter(u => {
            const usernameMatch = u.username?.trim().toLowerCase() === normalizedUsername;
            const emailMatch = normalizedEmail && u.email?.trim().toLowerCase() === normalizedEmail;
            return !usernameMatch && !emailMatch;
          });

          const today = getTodayKey();
          const initialPoints = 50;

          const newUser = {
            id: Date.now().toString(),
            username: credentials.username.trim(),
            email: normalizedEmail,
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
          };

          const updatedUsers = [...filteredUsers, newUser];
          localStorage.setItem('ai_comic_users', JSON.stringify(updatedUsers));
          localStorage.removeItem('ai_comic_auth');

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password: _password, ...userWithoutPassword } = newUser;

          const daily = makeDailyTasks().map(t => {
            if (t.id === 'daily-login') return { ...t, progress: 1, isCompleted: false, canClaim: true };
            return { ...t, isCompleted: false, canClaim: t.target === undefined };
          });

          set({
            user: userWithoutPassword,
            isAuthenticated: true,
            points: initialPoints,
            totalEarnedPoints: initialPoints,
            level: 1,
            projectsCount: 0,
            isVIP: false,
            isLoading: false,
            completedTasks: [],
            visitedPages: [],
            usedStyles: [],
            dailyRewards: daily,
            achievementRewards: applyCompletion(makeAchievementTasks({ projects: 0, consecutiveDays: 1, totalEarned: initialPoints }), []),
            socialRewards: applyCompletion(makeSocialTasks(), []),
            creationRewards: applyCompletion(makeCreationTasks({ projects: 0, maxFrames: 0, usedStyleCount: 0, hasVoice: false, hasDialogue: false, hasNarration: false, exported: 0 }), []),
            exploreRewards: applyCompletion(makeExploreTasks({ usedStyleCount: 0, visitedPages: [] }), []),
            specialRewards: applyCompletion(makeSpecialTasks(), []),
            memberRewards: applyCompletion(makeMemberTasks(false), []),
            levelRewards: applyCompletion(makeLevelTasks(1, initialPoints), []),
            exchangeItems: makeExchangeItems(),
            transactions: [{
              id: Date.now().toString(),
              type: 'earn',
              amount: initialPoints,
              description: '新用户欢迎积分',
              createdAt: new Date().toISOString(),
            }],
            dailyLoginDate: today,
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

      clearAllData: () => {
        localStorage.removeItem('ai_comic_auth');
        localStorage.removeItem('ai_comic_users');
        localStorage.removeItem('manga-studio-projects');
        localStorage.removeItem('luckyWheelState');
        localStorage.removeItem('lastAdSpins');

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
          dailyLoginDate: null,
          dailyRewards: makeDailyTasks(),
          achievementRewards: makeAchievementTasks({ projects: 0, consecutiveDays: 1, totalEarned: 0 }),
          socialRewards: makeSocialTasks(),
          creationRewards: makeCreationTasks({ projects: 0, maxFrames: 0, usedStyleCount: 0, hasVoice: false, hasDialogue: false, hasNarration: false, exported: 0 }),
          exploreRewards: makeExploreTasks({ usedStyleCount: 0, visitedPages: [] }),
          specialRewards: makeSpecialTasks(),
          memberRewards: makeMemberTasks(false),
          levelRewards: makeLevelTasks(1, 0),
          exchangeItems: makeExchangeItems(),
        });
      },

      addPoints: (amount: number, description: string) => {
        set(state => {
          const newPoints = state.points + amount;
          const newTotalEarned = state.totalEarnedPoints + amount;
          const newLevel = calcLevel(newTotalEarned);

          const newTransaction: PointTransaction = {
            id: Date.now().toString(),
            type: 'earn',
            amount,
            description,
            createdAt: new Date().toISOString(),
          };

          if (state.user) {
            try {
              const storedUsers: any[] = JSON.parse(localStorage.getItem('ai_comic_users') || '[]');
              const updatedUsers = storedUsers.map(u =>
                u.id === state.user!.id ? { ...u, points: newPoints, totalEarnedPoints: newTotalEarned, level: newLevel } : u
              );
              localStorage.setItem('ai_comic_users', JSON.stringify(updatedUsers));
            } catch {}
          }

          return {
            points: newPoints,
            totalEarnedPoints: newTotalEarned,
            level: newLevel,
            transactions: [newTransaction, ...state.transactions].slice(0, 50),
          };
        });

        // 加完积分后刷新等级任务和成就任务进度（基于新的 total）
        setTimeout(() => get().refreshTasks(), 30);
      },

      spendPoints: (amount: number, description: string) => {
        if (get().points < amount) return false;

        set(state => {
          const newPoints = state.points - amount;
          const newTransaction: PointTransaction = {
            id: Date.now().toString(),
            type: 'spend',
            amount,
            description,
            createdAt: new Date().toISOString(),
          };

          if (state.user) {
            try {
              const storedUsers: any[] = JSON.parse(localStorage.getItem('ai_comic_users') || '[]');
              const updatedUsers = storedUsers.map(u =>
                u.id === state.user!.id ? { ...u, points: newPoints } : u
              );
              localStorage.setItem('ai_comic_users', JSON.stringify(updatedUsers));
            } catch {}
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
        if (state.completedTasks.includes(rewardId)) return false;

        // 在所有任务中查找
        const allLists: { key: keyof AuthStore; tasks: PointReward[] }[] = [
          { key: 'dailyRewards', tasks: state.dailyRewards },
          { key: 'achievementRewards', tasks: state.achievementRewards },
          { key: 'socialRewards', tasks: state.socialRewards },
          { key: 'creationRewards', tasks: state.creationRewards },
          { key: 'exploreRewards', tasks: state.exploreRewards },
          { key: 'specialRewards', tasks: state.specialRewards },
          { key: 'memberRewards', tasks: state.memberRewards },
          { key: 'levelRewards', tasks: state.levelRewards },
        ];

        let found: PointReward | undefined;
        let listKey: keyof AuthStore | null = null;
        for (const { key, tasks } of allLists) {
          found = tasks.find(t => t.id === rewardId);
          if (found) { listKey = key; break; }
        }

        if (!found || !listKey) return false;

        // VIP 专属任务检查
        if ((found as any).isVIPOnly && !state.isVIP) return false;

        // 检查进度
        if (found.target !== undefined) {
          const p = found.progress ?? 0;
          if (p < found.target) return false;
        }

        // 领取积分
        let rewardPoints = found.points;
        if (rewardId === 'daily-login') rewardPoints = Math.floor(Math.random() * 20) + 1;
        get().addPoints(rewardPoints, found.name);

        // 更新状态
        set(s => {
          const newCompleted = [...s.completedTasks, rewardId];

          const updates: Partial<AuthStore> = {
            completedTasks: newCompleted,
          };

          const markList = (tasks: PointReward[]): PointReward[] => tasks.map(t =>
            t.id === rewardId ? { ...t, isCompleted: true, canClaim: false } : t
          );

          if (listKey === 'dailyRewards') updates.dailyRewards = markList(s.dailyRewards);
          if (listKey === 'achievementRewards') updates.achievementRewards = markList(s.achievementRewards);
          if (listKey === 'socialRewards') updates.socialRewards = markList(s.socialRewards);
          if (listKey === 'creationRewards') updates.creationRewards = markList(s.creationRewards);
          if (listKey === 'exploreRewards') updates.exploreRewards = markList(s.exploreRewards);
          if (listKey === 'specialRewards') updates.specialRewards = markList(s.specialRewards);
          if (listKey === 'memberRewards') updates.memberRewards = markList(s.memberRewards);
          if (listKey === 'levelRewards') updates.levelRewards = markList(s.levelRewards);

          if (s.user) {
            try {
              const storedUsers: any[] = JSON.parse(localStorage.getItem('ai_comic_users') || '[]');
              const updatedUsers = storedUsers.map(u =>
                u.id === s.user!.id ? { ...u, completedTasks: newCompleted } : u
              );
              localStorage.setItem('ai_comic_users', JSON.stringify(updatedUsers));
            } catch {}
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
          set(s => ({
            exchangeItems: s.exchangeItems.map(i => i.id === itemId ? { ...i, stock: i.stock - 1 } : i),
          }));
        }
        return success;
      },

      markTaskComplete: (taskId: string) => {
        get().updateTaskProgress(taskId, 9999);
      },

      updateTaskProgress: (taskId: string, progress: number) => {
        set(state => {
          const updateFn = (tasks: PointReward[]) => tasks.map(t => {
            if (t.id !== taskId) return t;
            if (t.target === undefined) return t;
            const newProgress = Math.min((t.progress || 0) + progress, t.target);
            const justReached = newProgress >= t.target;
            return {
              ...t,
              progress: newProgress,
              canClaim: justReached && !t.isCompleted ? true : t.canClaim,
            };
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

      refreshTasks: () => {
        const state = get();
        const completed = state.completedTasks;
        const projects = state.projectsCount;
        const totalEarned = state.totalEarnedPoints;
        const consecutiveDays = state.user?.consecutiveLoginDays || 1;
        const usedStyleCount = new Set(state.usedStyles).size;
        const visitedPages = state.visitedPages;
        const isVIP = state.isVIP;
        const level = calcLevel(totalEarned);

        const today = getTodayKey();
        const daily = makeDailyTasks().map(t => {
          const isDone = completed.includes(t.id);
          if (t.id === 'daily-login') {
            return { ...t, progress: 1, isCompleted: isDone, canClaim: !isDone };
          }
          // 其它每日任务：保留之前的进度（如果今日已登录）
          const existing = state.dailyRewards.find(d => d.id === t.id);
          const curProgress = existing?.progress || 0;
          return {
            ...t,
            progress: curProgress,
            isCompleted: isDone,
            canClaim: !isDone && (t.target === undefined ? true : curProgress >= t.target),
          };
        });

        set({
          level,
          dailyRewards: daily,
          achievementRewards: applyCompletion(makeAchievementTasks({ projects, consecutiveDays, totalEarned }), completed),
          socialRewards: applyCompletion(makeSocialTasks(), completed),
          creationRewards: applyCompletion(makeCreationTasks({ projects, maxFrames: 0, usedStyleCount, hasVoice: false, hasDialogue: false, hasNarration: false, exported: 0 }), completed),
          exploreRewards: applyCompletion(makeExploreTasks({ usedStyleCount, visitedPages }), completed),
          specialRewards: applyCompletion(makeSpecialTasks(), completed),
          memberRewards: applyCompletion(makeMemberTasks(isVIP), completed),
          levelRewards: applyCompletion(makeLevelTasks(level, totalEarned), completed),
        });
      },

      recordPageVisit: (page: string) => {
        set(state => {
          const already = state.visitedPages.includes(page);
          const newVisited = already ? state.visitedPages : [...state.visitedPages, page];

          if (state.user) {
            try {
              const storedUsers: any[] = JSON.parse(localStorage.getItem('ai_comic_users') || '[]');
              const updatedUsers = storedUsers.map(u =>
                u.id === state.user!.id ? { ...u, visitedPages: newVisited } : u
              );
              localStorage.setItem('ai_comic_users', JSON.stringify(updatedUsers));
            } catch {}
          }

          // 同时刷新探索任务进度
          return {
            visitedPages: newVisited,
            exploreRewards: state.exploreRewards.map(t => {
              if (t.target === undefined) return t;
              // 根据页面更新特定任务进度
              let newProgress = t.progress || 0;
              if (t.id === 'explore-tutorial' && page === 'tutorial') newProgress = 1;
              if (t.id === 'explore-settings' && page === 'settings') newProgress = 1;
              if (t.id === 'explore-points' && page === 'points') newProgress = 1;
              if (t.id === 'explore-history' && page === 'profile') newProgress = 1;
              if (t.id === 'explore-all') newProgress = Math.min(newVisited.length, 5);
              newProgress = Math.min(newProgress, t.target);

              const reached = newProgress >= t.target;
              const isDone = state.completedTasks.includes(t.id);
              return { ...t, progress: newProgress, canClaim: reached && !isDone };
            }),
          };
        });
      },

      recordStyleUse: (style: string) => {
        set(state => {
          const already = state.usedStyles.includes(style);
          const newUsed = already ? state.usedStyles : [...state.usedStyles, style];

          if (state.user) {
            try {
              const storedUsers: any[] = JSON.parse(localStorage.getItem('ai_comic_users') || '[]');
              const updatedUsers = storedUsers.map(u =>
                u.id === state.user!.id ? { ...u, usedStyles: newUsed } : u
              );
              localStorage.setItem('ai_comic_users', JSON.stringify(updatedUsers));
            } catch {}
          }

          const styleCount = new Set(newUsed).size;

          // 刷新相关任务
          return {
            usedStyles: newUsed,
            dailyRewards: state.dailyRewards.map(t => {
              if (t.id === 'daily-style' && t.target !== undefined) {
                const newProgress = Math.min((t.progress || 0) + 1, t.target);
                const isDone = state.completedTasks.includes(t.id);
                return { ...t, progress: newProgress, canClaim: newProgress >= t.target && !isDone };
              }
              return t;
            }),
            exploreRewards: state.exploreRewards.map(t => {
              if (t.id === 'explore-style' && t.target !== undefined) {
                const newProgress = Math.min(styleCount, t.target);
                const isDone = state.completedTasks.includes(t.id);
                return { ...t, progress: newProgress, canClaim: newProgress >= t.target && !isDone };
              }
              return t;
            }),
            creationRewards: state.creationRewards.map(t => {
              if (t.id === 'creation-all-style' && t.target !== undefined) {
                const newProgress = Math.min(styleCount, t.target);
                const isDone = state.completedTasks.includes(t.id);
                return { ...t, progress: newProgress, canClaim: newProgress >= t.target && !isDone };
              }
              if (t.id === 'creation-style-anime' && (style === 'anime' || style === 'manga' || style === 'cyberpunk' || style === 'realistic')) {
                const isDone = state.completedTasks.includes(t.id);
                return { ...t, progress: 1, canClaim: !isDone };
              }
              return t;
            }),
          };
        });
      },

      recordProjectCreation: (frameCount: number, hasCharacters: boolean, hasDialogue: boolean, hasVoice: boolean, style: string) => {
        set(state => {
          const newCount = state.projectsCount + 1;
          if (state.user) {
            try {
              const storedUsers: any[] = JSON.parse(localStorage.getItem('ai_comic_users') || '[]');
              const updatedUsers = storedUsers.map(u =>
                u.id === state.user!.id ? { ...u, projectsCount: newCount } : u
              );
              localStorage.setItem('ai_comic_users', JSON.stringify(updatedUsers));
            } catch {}
          }

          const completed = state.completedTasks;

          const newDaily = state.dailyRewards.map(t => {
            if (t.id === 'daily-create') {
              const isDone = completed.includes(t.id);
              return { ...t, progress: 1, canClaim: !isDone };
            }
            if (t.id === 'daily-voice' && hasVoice) {
              const isDone = completed.includes(t.id);
              return { ...t, progress: 1, canClaim: !isDone };
            }
            return t;
          });

          const newCreation = makeCreationTasks({
            projects: newCount,
            maxFrames: Math.max(frameCount, 0),
            usedStyleCount: new Set([...state.usedStyles, style]).size,
            hasVoice: hasVoice,
            hasDialogue: hasDialogue,
            hasNarration: hasDialogue,
            exported: 0,
          }).map(t => {
            const isDone = completed.includes(t.id);
            const reached = t.target === undefined ? true : (t.progress ?? 0) >= t.target;
            return { ...t, isCompleted: isDone, canClaim: reached && !isDone };
          });

          const newAchievement = makeAchievementTasks({
            projects: newCount,
            consecutiveDays: state.user?.consecutiveLoginDays || 1,
            totalEarned: state.totalEarnedPoints,
          }).map(t => {
            const isDone = completed.includes(t.id);
            const reached = t.target === undefined ? true : (t.progress ?? 0) >= t.target;
            return { ...t, isCompleted: isDone, canClaim: reached && !isDone };
          });

          return {
            projectsCount: newCount,
            dailyRewards: newDaily,
            creationRewards: newCreation,
            achievementRewards: newAchievement,
          };
        });
      },
    }),
    {
      name: 'ai_comic_auth',
      version: 2,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        points: state.points,
        totalEarnedPoints: state.totalEarnedPoints,
        level: state.level,
        projectsCount: state.projectsCount,
        isVIP: state.isVIP,
        transactions: state.transactions,
        completedTasks: state.completedTasks,
        visitedPages: state.visitedPages,
        usedStyles: state.usedStyles,
        dailyLoginDate: state.dailyLoginDate,
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
