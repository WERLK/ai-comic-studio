import { create } from 'zustand';
import type { Project, Frame, GenerationPrompt, Character, Scene, Dialogue } from '@/types';
import { voiceActors, getVoiceById } from '@/data/voiceActors';

const STORAGE_KEY = 'manga-studio-projects-v2';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function loadFromStorage(): Project[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage(projects: Project[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

// ============ 角色名池 ============
const MALE_NAMES = ['林一', '陈默', '赵子轩', '李浩然', '王云飞', '孙明', '周凯', '吴彦', '郑子豪', '徐文', '秦风', '高翔'];
const FEMALE_NAMES = ['苏雪', '林小月', '陈可欣', '赵若曦', '李梦琪', '王晓琳', '孙欣怡', '周婷', '吴雅', '郑雨晴', '徐薇', '高慧'];
const NEUTRAL_NAMES = ['神秘人', '影子', '老者', '智者', '导师', '先知', '旁白之声'];

// ============ 场景描述 / 场景图像池 ============
const SCENE_IMAGES: { name: string; url: string; tags: string[] }[] = [
  { name: '校园清晨', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800', tags: ['校园', '学校', '清晨', '白天', '室外'] },
  { name: '教室', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800', tags: ['教室', '课堂', '学校', '室内', '白天'] },
  { name: '樱花树下', url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800', tags: ['樱花', '春天', '公园', '室外', '浪漫'] },
  { name: '城市街道', url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800', tags: ['街道', '城市', '都市', '室外', '白天'] },
  { name: '夜晚街道', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800', tags: ['夜晚', '街道', '都市', '黑暗', '神秘'] },
  { name: '咖啡馆', url: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800', tags: ['咖啡', '室内', '温馨', '约会', '休闲'] },
  { name: '公园长椅', url: 'https://images.unsplash.com/photo-1473445361085-b9a07f556085?w=800', tags: ['公园', '长椅', '室外', '白天', '安静'] },
  { name: '家中客厅', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800', tags: ['家', '客厅', '室内', '温馨', '晚上'] },
  { name: '图书馆', url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800', tags: ['图书馆', '书', '安静', '室内', '知识'] },
  { name: '海边日落', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', tags: ['海边', '日落', '沙滩', '海', '黄昏'] },
  { name: '山顶夜景', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800', tags: ['山顶', '夜景', '星空', '天空', '神秘'] },
  { name: '雨中街道', url: 'https://images.unsplash.com/photo-1515694346937-9436fa394736?w=800', tags: ['雨', '街道', '夜晚', '浪漫', '潮湿'] },
  { name: '未来城市', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800', tags: ['未来', '科技', '城市', '霓虹', '赛博'] },
  { name: '森林小路', url: 'https://images.unsplash.com/photo-1448375240586-48248438c89f?w=800', tags: ['森林', '小路', '自然', '神秘', '冒险'] },
  { name: '办公室', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', tags: ['办公室', '工作', '室内', '商务'] },
  { name: '火车站', url: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800', tags: ['火车', '车站', '出发', '离别', '交通'] },
  { name: '古老建筑', url: 'https://images.unsplash.com/photo-1533154681864-04621532fdc1?w=800', tags: ['古老', '建筑', '历史', '神秘', '遗迹'] },
  { name: '空房间', url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800', tags: ['房间', '室内', '空旷', '安静', '思考'] },
];

// ============ 智能故事解析 ============

// 从文本里提取中文人名（2-4个字，前后有「"''」、冒号、说话标记）
function extractCharacters(text: string, requestedCount: number): { name: string; gender: 'male' | 'female' | 'neutral' }[] {
  const found = new Map<string, 'male' | 'female' | 'neutral'>();

  // 规则1: "XXX说/道/问/答/喊/叫/想/说道/问道" 模式
  const speakerPattern = /([\u4e00-\u9fa5]{2,4})(?:说|道|问|答|喊|叫|想|笑|说道|问道|答道|喊道|叫道|笑道|思考|自言自语|回答)/g;
  let match;
  while ((match = speakerPattern.exec(text)) !== null) {
    const name = match[1];
    if (!found.has(name)) found.set(name, detectGender(name));
  }

  // 规则2: "「XXX」" 或 "『XXX』" 引号中的角色名
  const quotePattern = /[「【『]([\u4e00-\u9fa5]{2,4})[」】』]/g;
  while ((match = quotePattern.exec(text)) !== null) {
    const name = match[1];
    if (!found.has(name)) found.set(name, detectGender(name));
  }

  // 规则3: "XXX，XXX" 并列关系
  const andPattern = /([\u4e00-\u9fa5]{2,4})(?:、|和|与|同|跟)([\u4e00-\u9fa5]{2,4})/g;
  while ((match = andPattern.exec(text)) !== null) {
    if (!found.has(match[1])) found.set(match[1], detectGender(match[1]));
    if (!found.has(match[2])) found.set(match[2], detectGender(match[2]));
  }

  // 规则4: "XXX 对 YYY" 或 "XXX看着YYY"
  const interactPattern = /([\u4e00-\u9fa5]{2,4})(?:对|看着|望着|看向|走向|拉住|抱住|拥抱|推|打|拍了拍)([\u4e00-\u9fa5]{2,4})/g;
  while ((match = interactPattern.exec(text)) !== null) {
    if (!found.has(match[1])) found.set(match[1], detectGender(match[1]));
    if (!found.has(match[2])) found.set(match[2], detectGender(match[2]));
  }

  // 转换为数组
  const result = Array.from(found.entries()).map(([name, gender]) => ({ name, gender }));

  // 如果不够，自动补齐角色
  if (result.length < requestedCount) {
    const maleIdx = { i: 0 };
    const femaleIdx = { i: 0 };
    const existingNames = new Set(result.map(r => r.name));

    while (result.length < requestedCount) {
      const needFemale = result.length % 2 === 1; // 交替补角色，保证性别多样性
      let nextName: string;
      let gender: 'male' | 'female';
      if (needFemale) {
        nextName = FEMALE_NAMES[femaleIdx.i % FEMALE_NAMES.length];
        gender = 'female';
        femaleIdx.i++;
      } else {
        nextName = MALE_NAMES[maleIdx.i % MALE_NAMES.length];
        gender = 'male';
        maleIdx.i++;
      }
      if (!existingNames.has(nextName)) {
        result.push({ name: nextName, gender });
        existingNames.add(nextName);
      }
    }
  }

  // 如果超出请求数量，截取前 N 个（优先选择出现次数多的角色）
  return result.slice(0, Math.max(requestedCount, Math.min(result.length, 6)));
}

// 根据中文人名猜测性别（基于常见用字）
function detectGender(name: string): 'male' | 'female' | 'neutral' {
  const femaleChars = ['雪', '月', '花', '丽', '欣', '婷', '娜', '芳', '慧', '敏', '静', '丽', '玲', '晶', '欣', '怡', '佳', '琳', '琪', '瑶', '薇', '欣', '若', '小', '雅', '梦', '琪', '菲', '萱'];
  const maleChars = ['强', '伟', '刚', '勇', '军', '杰', '磊', '涛', '鹏', '飞', '龙', '虎', '子', '轩', '博', '文', '明', '天', '云', '风', '默', '子', '凯', '浩', '然', '豪', '俊', '飞'];

  let femaleScore = 0;
  let maleScore = 0;
  for (const ch of name) {
    if (femaleChars.includes(ch)) femaleScore++;
    if (maleChars.includes(ch)) maleScore++;
  }
  if (femaleScore > maleScore) return 'female';
  if (maleScore > femaleScore) return 'male';
  // 默认给男女交替
  return (Math.random() > 0.5 ? 'male' : 'female');
}

// 基于内容选择合适的场景图像
function pickSceneForText(text: string, style: string): { name: string; url: string; tags: string[] } {
  const lowerText = text.slice(0, 100);
  // 关键词匹配
  const keywordMap: Record<string, number> = {};
  SCENE_IMAGES.forEach((scene) => {
    scene.tags.forEach(tag => {
      if (lowerText.includes(tag)) {
        keywordMap[scene.name] = (keywordMap[scene.name] || 0) + 1;
      }
    });
  });

  // 挑出匹配最多的
  let best = SCENE_IMAGES[0];
  let bestScore = -1;
  for (const [sceneName, score] of Object.entries(keywordMap)) {
    if (score > bestScore) {
      bestScore = score;
      best = SCENE_IMAGES.find(s => s.name === sceneName) || best;
    }
  }
  // 如果没有关键词匹配，根据风格随机选一张
  if (bestScore <= 0) {
    const pool = style === 'cyberpunk'
      ? SCENE_IMAGES.filter(s => s.tags.some(t => ['未来', '科技', '城市', '夜晚'].includes(t)))
      : style === 'realistic'
        ? SCENE_IMAGES.filter(s => s.tags.some(t => ['家', '办公室', '教室', '街道'].includes(t)))
        : SCENE_IMAGES.filter(s => s.tags.some(t => ['校园', '樱花', '公园', '客厅'].includes(t)));
    best = pool[Math.floor(Math.random() * pool.length)] || SCENE_IMAGES[0];
  }
  return best;
}

// 将故事内容拆分成若干"剧情单元"（scene/frame 级别）
function splitIntoStoryUnits(text: string, frameCount: number): { narration: string; dialogue: { speaker: string; content: string }[] }[] {
  // 按段落、对话切分
  const rawSentences: string[] = [];

  // 先按换行分段，再对长段落按句号分
  const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(Boolean);
  paragraphs.forEach(para => {
    // 按句号、感叹号、问号拆分
    const parts = para.split(/(?<=[。！？!?\.])/).map(s => s.trim()).filter(Boolean);
    parts.forEach(part => {
      if (part.length > 0 && part.length < 300) rawSentences.push(part);
    });
  });

  // 如果句子太少，直接整个文本分成几段
  if (rawSentences.length < frameCount) {
    const step = Math.max(1, Math.ceil(text.length / frameCount));
    for (let i = 0; i < frameCount; i++) {
      const chunk = text.slice(i * step, (i + 1) * step).trim();
      if (chunk) rawSentences.push(chunk);
    }
  }

  // 从每个句子里，提取对话和旁白
  const units: { narration: string; dialogue: { speaker: string; content: string }[] }[] = [];

  // 把 rawSentences 合并后重新均匀分段，得到 frameCount 个单元
  const mergedLength = Math.max(rawSentences.length, frameCount);
  const sentencesPerFrame = Math.ceil(mergedLength / frameCount);

  for (let i = 0; i < frameCount; i++) {
    const startIdx = i * sentencesPerFrame;
    const frameSentences = rawSentences.slice(startIdx, startIdx + sentencesPerFrame);

    if (frameSentences.length === 0) {
      units.push({ narration: '...', dialogue: [] });
      continue;
    }

    // 在这些句子里，区分"对话"（被引号括起来的）和"旁白"
    let narrationParts: string[] = [];
    let dialogueList: { speaker: string; content: string }[] = [];

    frameSentences.forEach(sentence => {
      // 寻找对话模式： "XXX说：""内容"" 或 中文引号包裹
      const directTalk = sentence.match(/([\u4e00-\u9fa5]{2,4})(?:说|道|问|答|喊|叫|道|想|说道|问道|答道|喊道|叫道|笑道)[:：]?[^\u4e00-\u9fa5]*[「"『]([^」"』]{2,100})[」"』]/);
      const directTalk2 = sentence.match(/[「"『]([^」"』]{2,100})[」"』]/);
      const speakerMatch = sentence.match(/([\u4e00-\u9fa5]{2,4})(?:说|道|问|答|喊|叫)/);

      if (directTalk && speakerMatch) {
        dialogueList.push({ speaker: speakerMatch[1], content: directTalk[2] });
      } else if (directTalk2) {
        // 没找到说话人：用前一段的说话人或标为"对话"
        const speaker = speakerMatch ? speakerMatch[1] : '';
        dialogueList.push({ speaker, content: directTalk2[1] });
      } else {
        narrationParts.push(sentence);
      }
    });

    // 如果没有旁白，用对话拼接成一个简略描述
    units.push({
      narration: narrationParts.join(' ') || (dialogueList.length > 0 ? `${dialogueList[0].speaker || '角色'}开口了` : '场景继续'),
      dialogue: dialogueList,
    });
  }

  return units;
}

// 把剧情单元转为 Frame
function unitsToFrames(
  units: { narration: string; dialogue: { speaker: string; content: string }[] }[],
  characters: Character[],
  scenes: Scene[],
): Frame[] {
  const nameToChar = new Map(characters.map(c => [c.name, c]));
  const nameArr = characters.map(c => c.name);

  return units.map((unit, idx) => {
    const scene = scenes[idx % scenes.length];

    // 构建 dialogue
    const dialogues: Dialogue[] = [];
    const duration = 4000 + unit.narration.length * 40 + unit.dialogue.reduce((s, d) => s + d.content.length * 60, 0);

    // 如果有对话
    if (unit.dialogue.length > 0) {
      unit.dialogue.forEach((d, dIdx) => {
        // 尝试找到对应的角色
        let charName = d.speaker;
        if (!charName && nameArr.length > 0) {
          charName = nameArr[idx % nameArr.length];
        }
        let voiceId: string | undefined;
        let matchingChar = nameToChar.get(charName);
        if (!matchingChar) {
          // 尝试模糊匹配（包含关系）
          for (const [key, value] of nameToChar.entries()) {
            if (charName && key.includes(charName)) {
              matchingChar = value;
              break;
            }
          }
        }
        if (matchingChar) voiceId = matchingChar.voiceId;

        const yPos = 55 + dIdx * 15;
        dialogues.push({
          id: generateId(),
          type: 'speech',
          text: d.content,
          position: { x: 50, y: yPos },
          style: 'bubble',
          characterName: charName || undefined,
          voiceId,
        });
      });
    } else {
      // 纯旁白
      const narrationVoice = voiceActors.find(v => v.tags.includes('旁白')) || voiceActors[0];
      dialogues.push({
        id: generateId(),
        type: 'narration',
        text: unit.narration,
        position: { x: 50, y: 80 },
        style: 'caption',
        voiceId: narrationVoice.id,
      });
    }

    // 确定本帧出现的角色
    const presentCharIds: string[] = [];
    const speakersInFrame = new Set(unit.dialogue.map(d => d.speaker).filter(Boolean));
    for (const ch of characters) {
      if (speakersInFrame.has(ch.name)) {
        presentCharIds.push(ch.id);
      }
    }
    if (presentCharIds.length === 0 && characters.length > 0) {
      presentCharIds.push(characters[idx % characters.length].id);
    }

    return {
      id: generateId(),
      sceneId: scene.id,
      sceneImageUrl: scene.imageUrl,
      characterIds: presentCharIds,
      dialogues,
      duration,
      transition: idx === 0 ? 'fade' : (['fade', 'slide', 'zoom'][idx % 3] as any),
      position: { x: 0, y: 0, width: 100, height: 100 },
    };
  });
}

// 根据字符分配配音
function assignVoices(characters: { name: string; gender: 'male' | 'female' | 'neutral' }[], userVoices?: string[]): Character[] {
  const charColors: Record<string, string> = {
    male: 'b6e3f4',
    female: 'ffdfbf',
    neutral: 'c0aede',
  };

  return characters.map((c, idx) => {
    // 如果用户给了配音选择，优先使用
    if (userVoices && userVoices[idx]) {
      return {
        id: generateId(),
        name: c.name,
        gender: c.gender,
        imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.name)}&backgroundColor=${charColors[c.gender]}`,
        tags: [c.gender === 'male' ? '男性' : c.gender === 'female' ? '女性' : '中性'],
        voiceId: userVoices[idx],
      };
    }

    // 根据性别智能分配
    const candidates = voiceActors.filter(v =>
      v.gender === c.gender && !v.tags.includes('旁白')
    );
    const fallback = voiceActors.filter(v => !v.tags.includes('旁白'));
    const pool = candidates.length > 0 ? candidates : fallback;
    const chosen = pool[idx % pool.length];

    return {
      id: generateId(),
      name: c.name,
      gender: c.gender,
      imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.name)}&backgroundColor=${charColors[c.gender]}`,
      tags: [c.gender === 'male' ? '男性' : c.gender === 'female' ? '女性' : '中性', chosen?.tone || 'normal'],
      voiceId: chosen?.id,
    };
  });
}

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  isGenerating: boolean;
  generationProgress: number;
  createProject: (title: string, sourceContent: string, sourceType: 'text' | 'upload') => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (id: string | null) => void;
  getProject: (id: string) => Project | undefined;
  generateManga: (projectId: string, prompt: GenerationPrompt) => Promise<void>;
  simulateGeneration: (projectId: string, prompt: GenerationPrompt) => Promise<void>;
  speakDialogue: (text: string, voiceId?: string) => void;
  stopSpeaking: () => void;
  previewVoice: (voiceId: string) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: loadFromStorage(),
  currentProject: null,
  isGenerating: false,
  generationProgress: 0,

  createProject: (title, sourceContent, sourceType) => {
    const newProject: Project = {
      id: generateId(),
      title,
      sourceContent,
      sourceType,
      characters: [],
      scenes: [],
      frames: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...get().projects, newProject];
    set({ projects: updated, currentProject: newProject });
    saveToStorage(updated);
    return newProject;
  },

  updateProject: (id, updates) => {
    const updated = get().projects.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    set({ projects: updated });
    saveToStorage(updated);
    if (get().currentProject?.id === id) {
      set({ currentProject: updated.find((p) => p.id === id) || null });
    }
  },

  deleteProject: (id) => {
    const updated = get().projects.filter((p) => p.id !== id);
    set({ projects: updated });
    saveToStorage(updated);
    if (get().currentProject?.id === id) {
      set({ currentProject: null });
    }
  },

  setCurrentProject: (id) => {
    if (id === null) {
      set({ currentProject: null });
    } else {
      const project = get().projects.find((p) => p.id === id);
      set({ currentProject: project || null });
    }
  },

  getProject: (id) => get().projects.find((p) => p.id === id),

  generateManga: async (projectId, prompt) => {
    set({ isGenerating: true, generationProgress: 0 });
    const project = get().getProject(projectId);
    if (!project) return;

    get().updateProject(projectId, { status: 'generating' });
    await get().simulateGeneration(projectId, prompt);

    set({ isGenerating: false, generationProgress: 100 });
    get().updateProject(projectId, { status: 'completed' });
  },

  simulateGeneration: async (projectId, prompt) => {
    const { storyText, style, characterCount, frameCount, selectedVoices } = prompt;
    const project = get().getProject(projectId);
    if (!project) return;

    // 确保 storyText 可用：如果用户没填，使用项目里存储的
    const effectiveStory = (storyText || project.sourceContent || '这是一段默认的故事内容。').trim();

    // === 步骤 1：解析角色 ===
    set({ generationProgress: 10 });
    await new Promise((r) => setTimeout(r, 300));

    const detected = extractCharacters(effectiveStory, characterCount);
    const characters = assignVoices(detected, selectedVoices);

    // === 步骤 2：生成场景 ===
    set({ generationProgress: 30 });
    await new Promise((r) => setTimeout(r, 300));

    const sceneCount = Math.min(Math.max(Math.ceil(frameCount / 2), 3), SCENE_IMAGES.length);
    const sceneOrder: Scene[] = [];
    const unitArr = splitIntoStoryUnits(effectiveStory, frameCount);

    // 基于每个单元的内容挑一个场景
    const usedSceneIdx = new Set<number>();
    for (let i = 0; i < frameCount; i++) {
      const text = unitArr[i]?.narration || '';
      // 每 1-2 帧换一次场景（控制换场景数量）
      if (i === 0 || i % 2 === 0) {
        // 按关键词挑一个新场景
        let bestIdx = 0;
        let bestScore = -1;
        SCENE_IMAGES.forEach((scene, idx) => {
          if (usedSceneIdx.has(idx)) return;
          let score = 0;
          for (const tag of scene.tags) {
            if (text.includes(tag)) score++;
          }
          score += Math.random() * 0.5; // 加些随机性
          if (score > bestScore) { bestScore = score; bestIdx = idx; }
        });
        if (usedSceneIdx.size >= SCENE_IMAGES.length) usedSceneIdx.clear();
        usedSceneIdx.add(bestIdx);
        const chosen = SCENE_IMAGES[bestIdx];
        sceneOrder.push({
          id: generateId(),
          name: chosen.name,
          imageUrl: chosen.url,
          style,
          tags: chosen.tags,
        });
      } else {
        // 复用前一个场景
        sceneOrder.push(sceneOrder[sceneOrder.length - 1]);
      }
    }

    // === 步骤 3：生成分镜 ===
    set({ generationProgress: 55 });
    await new Promise((r) => setTimeout(r, 400));

    const units = splitIntoStoryUnits(effectiveStory, frameCount);
    const frames = unitsToFrames(units, characters, sceneOrder);

    // === 步骤 4：摘要描述 ===
    set({ generationProgress: 80 });
    await new Promise((r) => setTimeout(r, 200));

    const description = `${project.title} · ${characterCount}位角色 · ${frameCount}组分镜 · ${style}风格`;

    get().updateProject(projectId, {
      characters,
      scenes: sceneOrder.filter((v, i, a) => a.findIndex(t => t.imageUrl === v.imageUrl) === i), // 去重
      frames,
      description,
      style,
    });

    set({ generationProgress: 100 });
  },

  speakDialogue: (text, voiceId) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);

      const voiceActor = voiceId ? getVoiceById(voiceId) : null;
      if (voiceActor && voiceActor.languages.length > 0) {
        utterance.lang = voiceActor.languages[0];
      } else {
        utterance.lang = 'zh-CN';
      }

      if (voiceActor) {
        switch (voiceActor.tone) {
          case 'bright':
          case 'energetic':
            utterance.rate = 0.95;
            utterance.pitch = 1.2;
            break;
          case 'warm':
            utterance.rate = 0.85;
            utterance.pitch = 1.1;
            break;
          case 'calm':
            utterance.rate = 0.8;
            utterance.pitch = 1;
            break;
          case 'cool':
          case 'serious':
            utterance.rate = 0.75;
            utterance.pitch = 0.85;
            break;
          default:
            utterance.rate = 0.85;
        }
      } else {
        utterance.rate = 0.85;
      }

      const availableVoices = window.speechSynthesis.getVoices();
      if (voiceActor) {
        const matching = availableVoices.find(v =>
          voiceActor.languages.some(lang => v.lang.startsWith(lang.split('-')[0]))
        );
        if (matching) utterance.voice = matching;
      } else {
        const def = availableVoices.find(v => v.lang.startsWith('zh') || v.lang.startsWith('en'));
        if (def) utterance.voice = def;
      }

      window.speechSynthesis.speak(utterance);
    }
  },

  stopSpeaking: () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  },

  previewVoice: (voiceId) => {
    const va = getVoiceById(voiceId);
    if (va && va.previewText) get().speakDialogue(va.previewText, va.id);
  },
}));
