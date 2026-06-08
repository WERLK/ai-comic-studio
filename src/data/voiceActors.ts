import type { VoiceActor } from './index';

export const voiceActors: VoiceActor[] = [
  // 中文配音
  {
    id: 'zh-male-young-1',
    name: '阳光少年',
    description: '活泼开朗的年轻男声，适合阳光帅气的男主角',
    gender: 'male',
    age: 'teen',
    tone: 'bright',
    languages: ['zh-CN'],
    tags: ['年轻', '阳光', '活力', '男主角'],
    previewText: '这就是我的回答！让我们一起前进吧！'
  },
  {
    id: 'zh-male-adult-1',
    name: '成熟稳重型',
    description: '低沉有力的成年男性声音，适合英雄或领袖角色',
    gender: 'male',
    age: 'adult',
    tone: 'serious',
    languages: ['zh-CN'],
    tags: ['成熟', '稳重', '领袖', '英雄'],
    previewText: '作为团队的核心，我会保护好每一个人。'
  },
  {
    id: 'zh-male-cool-1',
    name: '冷酷帅哥',
    description: '冷淡酷帅的声音，适合高冷神秘的角色',
    gender: 'male',
    age: 'adult',
    tone: 'cool',
    languages: ['zh-CN'],
    tags: ['冷酷', '神秘', '酷帅', '高冷'],
    previewText: '这不关我的事。别误会，我只是在陈述事实。'
  },
  {
    id: 'zh-male-warm-1',
    name: '温暖大叔',
    description: '温和亲切的声音，适合慈祥的长辈或导师',
    gender: 'male',
    age: 'middle',
    tone: 'warm',
    languages: ['zh-CN'],
    tags: ['温暖', '大叔', '导师', '慈祥'],
    previewText: '孩子，记住，真正的力量来自于内心的善良。'
  },
  {
    id: 'zh-female-young-1',
    name: '元气少女',
    description: '甜美可爱的少女声音，适合活泼的女主角',
    gender: 'female',
    age: 'teen',
    tone: 'bright',
    languages: ['zh-CN'],
    tags: ['可爱', '元气', '少女', '甜美'],
    previewText: '太棒了！我就知道你一定可以的！'
  },
  {
    id: 'zh-female-adult-1',
    name: '知性御姐',
    description: '优雅成熟的女性声音，适合聪明的女强人',
    gender: 'female',
    age: 'adult',
    tone: 'calm',
    languages: ['zh-CN'],
    tags: ['御姐', '知性', '优雅', '成熟'],
    previewText: '理性分析问题，制定最优策略，这就是我的方式。'
  },
  {
    id: 'zh-female-warm-1',
    name: '温柔姐姐',
    description: '柔和温暖的声音，适合善解人意的姐姐角色',
    gender: 'female',
    age: 'adult',
    tone: 'warm',
    languages: ['zh-CN'],
    tags: ['温柔', '姐姐', '善解人意', '柔和'],
    previewText: '别担心，一切都会好起来的，我一直都在这里陪着你。'
  },
  {
    id: 'zh-female-cool-1',
    name: '冰山美人',
    description: '冷淡高傲的声音，适合冷艳的女神或女王',
    gender: 'female',
    age: 'adult',
    tone: 'cool',
    languages: ['zh-CN'],
    tags: ['冰山', '冷艳', '女神', '高傲'],
    previewText: '哼，这种程度还值得我出手吗？'
  },
  // 英文配音
  {
    id: 'en-male-adult-1',
    name: '磁性好莱坞',
    description: '经典的好莱坞男声，适合英雄主角',
    gender: 'male',
    age: 'adult',
    tone: 'serious',
    languages: ['en-US'],
    tags: ['好莱坞', '磁音', '英雄', '电影'],
    previewText: 'This is my answer. Together, we will make history.'
  },
  {
    id: 'en-female-adult-1',
    name: '优雅英伦',
    description: '优雅的英式英语女声，适合贵族女性',
    gender: 'female',
    age: 'adult',
    tone: 'calm',
    languages: ['en-GB'],
    tags: ['英伦', '优雅', '贵族', '淑女'],
    previewText: 'How delightful. I must say, you are quite impressive.'
  },
  // 旁白配音
  {
    id: 'narration-male-1',
    name: '浑厚男旁白',
    description: '深沉的男声旁白，适合纪录片或史诗故事',
    gender: 'male',
    age: 'middle',
    tone: 'serious',
    languages: ['zh-CN'],
    tags: ['旁白', '浑厚', '纪录片', '史诗'],
    previewText: '在很久很久以前，有一个传说...'
  },
  {
    id: 'narration-female-1',
    name: '柔美女旁白',
    description: '柔和的女声旁白，适合浪漫故事或童话',
    gender: 'female',
    age: 'adult',
    tone: 'warm',
    languages: ['zh-CN'],
    tags: ['旁白', '柔美', '童话', '浪漫'],
    previewText: '从前，在遥远的王国里，住着一位美丽的公主...'
  },
];

export const getVoicesByGender = (gender: 'male' | 'female' | 'neutral') => {
  return voiceActors.filter(voice => voice.gender === gender);
};

export const getVoicesByLanguage = (language: string) => {
  return voiceActors.filter(voice => voice.languages.includes(language));
};

export const getVoiceById = (id: string) => {
  return voiceActors.find(voice => voice.id === id);
};

export const narrationVoices = voiceActors.filter(voice => 
  voice.tags.includes('旁白')
);

export const characterVoices = voiceActors.filter(voice => 
  !voice.tags.includes('旁白')
);
