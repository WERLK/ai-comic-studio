/**
 * AI 漫剧工作室 - Studio 主页
 * 
 * 完整创作流程：
 * Step 1: 剧本输入 → AI 智能分析
 * Step 2: 角色管理（角色卡片+语音配置）
 * Step 3: 分镜规划（自动拆分+手动调整）
 * Step 4: 生成设置（画风+模型+参数）
 * Step 5: 一键生成
 */
import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Upload, FileText, Wand2, Film, Trash2, Check, Loader2,
  Volume2, ChevronRight, ChevronLeft, Users, Image, Video,
  Play, Settings2, BookOpen, ArrowRight, Plus, Edit3, Trash, Mic, Star
} from 'lucide-react';
import { useProjectStore, useAuthStore } from '@/stores';
import { VIP_LEVELS } from '@/types';
import { Button } from '@/components/common';
import { AppVersion } from '@/components/AppVersion';
import { analyzeScript, type AnalysisResult } from '@/services/aiService';
import type { SceneStyle, Character, Frame } from '@/types';
import { ScriptWizard } from '@/components/ScriptWizard';
import { VerticalClock } from '@/components/VerticalClock';

// ========== 工具函数 ==========

const styleOptions = [
  { value: 'anime', label: '日系动漫', emoji: '🎌', desc: '唯美细腻的日系画风' },
  { value: 'manga', label: '经典漫画', emoji: '📖', desc: '传统漫画分镜风格' },
  { value: 'cyberpunk', label: '赛博朋克', emoji: '🤖', desc: '未来科技霓虹风格' },
  { value: 'realistic', label: '写实风格', emoji: '📸', desc: '电影级写实画面' },
  { value: 'watercolor', label: '水彩插画', emoji: '🎨', desc: '温柔水彩艺术风格' },
  { value: 'chinese', label: '国风古韵', emoji: '🏮', desc: '中国传统古风画面' },
];

const aspectOptions = [
  { value: '9:16', label: '竖屏 9:16', desc: '抖音/快手短视频' },
  { value: '16:9', label: '横屏 16:9', desc: 'B站/YouTube' },
  { value: '1:1', label: '方形 1:1', desc: 'Instagram' },
];

const videoModels = [
  { value: 'jimeng', label: '即梦 Seedance', desc: '运镜叙事强，适合文戏', icon: '🎬' },
  { value: 'kling', label: '可灵 3.0', desc: '画质细腻，动作流畅', icon: '✨' },
  { value: 'vidu', label: 'Vidu', desc: '物理模拟真实，适合奇幻', icon: '🌟' },
  { value: 'hailuo', label: '海螺', desc: '风格迁移，美术感强', icon: '🎭' },
];

// 智能分析：从剧本文本中提取信息
function parseScript(text: string): {
  title: string;
  characters: { name: string; description: string; role: string }[];
  scenes: string[];
  recommendedStyle: SceneStyle;
  recommendedFrames: number;
  frames: { description: string; dialogue?: string; shotType: string }[];
} {
  // 提取标题
  const firstLine = text.trim().split(/\n/)[0].trim();
  const title = firstLine.length <= 30 && !firstLine.includes('。')
    ? firstLine
    : `AI漫剧-${Date.now().toString(36).toUpperCase()}`;

  // ========== 角色解析（多策略组合，覆盖常见剧本格式）==========
  const foundNames = new Set<string>();
  const charDescriptions: Record<string, string> = {};
  const charDialogueCount: Record<string, number> = {};

  // 常见非角色关键词（避免误识别）
  const excludeWords = new Set([
    '场景', '地点', '时间', '人物', '角色', '旁白', '作者', '编剧',
    '剧本', '故事', '正文', '序幕', '尾声', '第一幕', '第二幕', '第三幕',
    '幕', '场', '节', '章', '简介', '摘要', '标题', '主题',
    '同时', '与此同时', '这时候', '此时', '突然', '接着', '然后',
  ]);

  // 把"说/道/问/答"等动词词尾去掉，避免"李小明说"被当成完整角色名
  const stripActionSuffix = (n: string) => {
    return n.replace(/(说|道|问|答|喊|叫|自言自语|心想|说道|问道|答道|喊道|叫道|惊呼|低语|低声说|大声说|轻声说|冷笑道|微笑道|怒道|苦笑道|叹了口气|开口道|笑道|回答道|继续说|接着说|又说|说道)$/u, '');
  };

  const addCharacter = (name: string, desc?: string) => {
    let trimmed = stripActionSuffix(String(name || '').trim());
    // 再检查一次词尾（处理"李小明说道"这种组合）
    trimmed = stripActionSuffix(trimmed);
    if (!trimmed || trimmed.length < 2 || trimmed.length > 10) return;
    // 过滤纯数字/符号 或 只含排除词
    if (/^[\d\s\-_,，。！？、·]+$/.test(trimmed)) return;
    if (excludeWords.has(trimmed)) return;
    // 过滤明显是场景/动作/提示语的短语（长度>4时更严格）
    if (trimmed.length > 4 && /(场景|地点|时间|白天|夜晚|室内|室外|街道|房间|客厅|卧室|公园|学校|公司|医院|餐厅|咖啡馆|办公室|会议室|电梯|走廊|大厅|厨房|浴室|阳台|花园|车库|门口|路边|都市|传说|故事|剧本|章节|第一|第二|第三)$/.test(trimmed)) return;
    // 包含全角/半角冒号的通常是标签，不是角色
    if (/[：:]/.test(trimmed)) return;
    // 只含描述性词语（如"神秘的都市"）也排除
    if (/^(神秘的|美丽的|可爱的|可怕的|古老的|热闹的|安静的|昏暗的|明亮的|繁华的|荒芜的)/.test(trimmed) && trimmed.length >= 6) return;

    foundNames.add(trimmed);
    if (desc && !charDescriptions[trimmed]) {
      charDescriptions[trimmed] = desc.slice(0, 80);
    }
    charDialogueCount[trimmed] = (charDialogueCount[trimmed] || 0) + 1;
  };

  // --- 策略1：角色清单（如 "人物：小明、小红、小刚" 或 "登场角色：\n小明\n小红"）---
  const listPattern = /(?:人\s*物|角\s*色|登场角色|主要人物|出场人物|人物表|角色表)\s*[:：]\s*([\s\S]*?)(?=\n\s*(?:场景|地点|时间|第[一二三四五六七八九十]+[幕场章节]|【|$))/i;
  const listMatch = text.match(listPattern);
  if (listMatch) {
    const block = listMatch[1];
    // 支持 、 ， , \n ； 空格 等分隔
    const names = block.split(/[、，,；;\n\r\t]+|\s{2,}/).map(n => n.trim()).filter(n => n && n.length <= 10);
    names.forEach(n => {
      // 支持 "小明（男主角）" 这种带括号的
      const clean = n.replace(/[（(【].*?[）)】]/g, '').trim();
      const metaMatch = n.match(/[（(【](.*?)[）)】]/);
      addCharacter(clean, metaMatch ? metaMatch[1] : '');
    });
  }

  // --- 策略2：对话行首角色（"角色名：" "【角色名】" "角色名\t" 等）---
  const lines = text.split(/\r?\n/);
  // 匹配行首的角色标记，如：
  // 小明：你好
  // 小明 ： 你好
  // 【小明】：你好
  // 小明（惊讶）：你好
  // 小明. 你好
  const dialogueLineRegex = /^\s*(?:[【\[]\s*)?([\u4e00-\u9fa5A-Za-z·]{2,10})(?:\s*[（(][^）)】\]]*[）)])?(?:\s*[】\]])?\s*[:：\.\t、]\s*(.*)$/;

  // 仅用于识别角色名的简版：短行、后续是对话内容
  for (const line of lines) {
    if (!line.trim() || line.trim().length > 120) continue;
    const m = line.match(dialogueLineRegex);
    if (m) {
      const name = m[1].trim();
      const dialogue = (m[2] || '').trim();
      // 必须是对话行（后面有内容），避免把 "第一章：" 之类识别成角色
      if (dialogue && dialogue.length >= 1) {
        addCharacter(name, dialogue);
      }
    }
  }

  // --- 策略3："XX说/道/问/答/喊/叫/自言自语/心想/说道/问道/回答" 模式 ---
  const actionRegex = /([\u4e00-\u9fa5A-Za-z·]{2,10})(?:说|道|问|答|喊|叫|自言自语|心想|说道|问道|回答|答道|喊道|叫道|惊呼|低声说|大声说|轻声说|冷笑道|微笑道|怒道|苦笑道|叹了口气|开口道)(?:[：:]|，|,|\.|。|！|\s)/g;
  let m;
  while ((m = actionRegex.exec(text)) !== null) {
    addCharacter(m[1]);
  }

  // --- 策略4：带引号的角色对话 如 "你好。"小明说 ---
  const quotedSpeakerRegex = /[""""]([^""""\n]{1,60})[""""]([^\n。！？]{0,20})([\u4e00-\u9fa5·A-Za-z]{2,10})(?:说|道|问|答|喊|叫)/g;
  while ((m = quotedSpeakerRegex.exec(text)) !== null) {
    addCharacter(m[3]);
  }

  // 按对话次数排序（出现越多越重要）
  const sortedNames = Array.from(foundNames).sort((a, b) =>
    (charDialogueCount[b] || 0) - (charDialogueCount[a] || 0)
  ).slice(0, 8);

  const characters = sortedNames.map((name, i) => ({
    name,
    description: charDescriptions[name] || `故事中的重要角色，性格独特，形象鲜明`,
    role: i === 0 ? '主角' : i <= 2 ? '配角' : '角色',
  }));

  // 智能识别场景
  const sceneMatches: string[] = [];
  // 场景/地点：XXX
  const sceneLabelRegex = /(?:场景|地点|位置|时间|环境)[：:]\s*([^\n。！？]{2,40})/g;
  while ((m = sceneLabelRegex.exec(text)) !== null) {
    sceneMatches.push(m[1].trim());
  }
  // 【场景：XXX】 或 【XXX】
  const bracketRegex = /[【\[]([^\]】\n]{2,30})[】\]]/g;
  while ((m = bracketRegex.exec(text)) !== null) {
    const content = m[1].replace(/^(场景|地点|时间|环境)[：:]?\s*/, '').trim();
    if (content && !excludeWords.has(content)) sceneMatches.push(content);
  }
  // 去重 & 截断
  const seen = new Set<string>();
  const scenes = sceneMatches.filter(s => {
    if (!s || s.length < 2 || s.length > 40) return false;
    if (seen.has(s)) return false;
    seen.add(s);
    return true;
  }).slice(0, 8);

  // 推荐画风
  const styleScores: Record<string, number> = { anime: 0, manga: 0, cyberpunk: 0, realistic: 0, watercolor: 0, chinese: 0 };
  const keywords: Record<string, string[]> = {
    anime: ['动漫', '日系', '二次元', '萌', '校园', '恋爱', '热血'],
    manga: ['漫画', '黑白', '网点', '格斗', '悬疑', '推理'],
    cyberpunk: ['未来', '科技', '机械', '霓虹', '黑客', '机器人', '都市'],
    realistic: ['写实', '真实', '照片', '历史', '战争'],
    watercolor: ['水彩', '插画', '温柔', '治愈'],
    chinese: ['古风', '仙侠', '武侠', '宫廷', '神话'],
  };
  for (const [style, kws] of Object.entries(keywords)) {
    for (const kw of kws) {
      if (text.includes(kw)) styleScores[style]++;
    }
  }
  const recommendedStyle = (Object.entries(styleScores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'anime') as SceneStyle;

  // 推荐分镜数
  const sceneCount = (text.match(/(?:场景|画面|镜头|切换|突然|这时|与此同时)/g) || []).length;
  const recommendedFrames = sceneCount >= 8 ? 12 : sceneCount >= 5 ? 8 : sceneCount >= 3 ? 6 : 4;

  // 智能拆分分镜
  const paragraphs = text.split(/\n{2,}|\n(?=[\u4e00-\u9fa5])/g).filter(p => p.trim().length > 10);
  const shotTypes = ['全景', '中景', '近景', '特写', '侧面', '俯视', '仰视', '跟随'];
  const frames = paragraphs.slice(0, recommendedFrames).map((p, i) => ({
    description: p.trim(),
    dialogue: p.includes('说') || p.includes('道') ? p.split(/[：:]/).slice(1).join('：').trim() : undefined,
    shotType: shotTypes[i % shotTypes.length],
  }));

  return { title, characters, scenes, recommendedStyle, recommendedFrames, frames };
}

// 读取 docx 文件
async function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(arrayBuffer);
  const docXml = await zip.file('word/document.xml')?.async('string');
  if (!docXml) throw new Error('无法解析文档');
  return docXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ========== 角色编辑卡片 ==========
function CharacterCard({
  char,
  index,
  onUpdate,
  onDelete,
  voiceId,
  onVoiceChange,
}: {
  char: { name: string; description: string; role: string };
  index: number;
  onUpdate: (c: typeof char) => void;
  onDelete: () => void;
  voiceId?: string;
  onVoiceChange: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const roleColors = ['from-pink-500 to-rose-500', 'from-blue-500 to-cyan-500', 'from-green-500 to-emerald-500', 'from-yellow-500 to-orange-500', 'from-purple-500 to-violet-500', 'from-red-500 to-pink-500'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-cyber-dark/60 border border-cyber-purple/20 rounded-xl p-4 hover:border-cyber-pink/30 transition-all"
    >
      <div className="flex items-start gap-3">
        {/* 角色头像 */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${roleColors[index % roleColors.length]} flex items-center justify-center flex-shrink-0 text-white font-bold text-lg`}>
          {char.name.slice(0, 1)}
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input
                value={char.name}
                onChange={e => onUpdate({ ...char, name: e.target.value })}
                className="w-full px-3 py-1.5 bg-cyber-dark2 border border-cyber-purple/30 rounded-lg text-white text-sm"
                placeholder="角色名"
              />
              <input
                value={char.role}
                onChange={e => onUpdate({ ...char, role: e.target.value })}
                className="w-full px-3 py-1.5 bg-cyber-dark2 border border-cyber-purple/30 rounded-lg text-white text-xs"
                placeholder="角色定位（主角/配角）"
              />
              <textarea
                value={char.description}
                onChange={e => onUpdate({ ...char, description: e.target.value })}
                className="w-full px-3 py-1.5 bg-cyber-dark2 border border-cyber-purple/30 rounded-lg text-white text-xs resize-none"
                rows={2}
                placeholder="角色外观描述"
              />
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="px-3 py-1 bg-cyber-pink text-white text-xs rounded-lg">保存</button>
                <button onClick={onDelete} className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-lg">删除</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-white text-sm">{char.name}</h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-purple/20 text-cyber-purple">{char.role}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{char.description}</p>

              {/* 语音配置 */}
              <div className="mt-3 flex items-center gap-2">
                <Mic className="w-3 h-3 text-gray-500" />
                <select
                  value={voiceId || ''}
                  onChange={e => onVoiceChange(e.target.value)}
                  className="flex-1 px-2 py-1 bg-cyber-dark2 border border-cyber-purple/20 rounded text-white text-xs"
                >
                  <option value="">自动分配</option>
                  <option value="male-young">青年男声</option>
                  <option value="male-deep">低沉男声</option>
                  <option value="female-young">少女声音</option>
                  <option value="female-sweet">甜美女声</option>
                  <option value="male-old">老年男声</option>
                  <option value="narrator">旁白</option>
                </select>
                <button onClick={() => setEditing(true)} className="p-1 text-gray-500 hover:text-white">
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ========== 分镜编辑卡片 ==========
function FrameCard({
  frame,
  index,
  onUpdate,
}: {
  frame: { description: string; dialogue?: string; shotType: string };
  index: number;
  onUpdate: (f: typeof frame) => void;
}) {
  const shotTypeOptions = ['全景', '中景', '近景', '特写', '侧面', '俯视', '仰视', '跟随', '推镜', '拉镜'];
  const shotIcons: Record<string, string> = {
    '全景': '🏞️', '中景': '🎭', '近景': '👤', '特写': '🔍',
    '侧面': '↩️', '俯视': '⬇️', '仰视': '⬆️', '跟随': '🚶',
    '推镜': '➡️', '拉镜': '⬅️',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-cyber-dark/40 border border-cyber-purple/10 rounded-xl p-3 hover:border-cyber-blue/30 transition-all"
    >
      <div className="flex items-start gap-3">
        {/* 序号 */}
        <div className="w-8 h-8 rounded-lg bg-cyber-purple/20 flex items-center justify-center flex-shrink-0">
          <span className="text-cyber-purple font-bold text-sm">{index + 1}</span>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {/* 景别 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">景别：</span>
            <select
              value={frame.shotType}
              onChange={e => onUpdate({ ...frame, shotType: e.target.value })}
              className="px-2 py-0.5 bg-cyber-dark2 border border-cyber-purple/20 rounded text-white text-xs"
            >
              {shotTypeOptions.map(s => (
                <option key={s} value={s}>{shotIcons[s]} {s}</option>
              ))}
            </select>
          </div>

          {/* 分镜描述 */}
          <textarea
            value={frame.description}
            onChange={e => onUpdate({ ...frame, description: e.target.value })}
            className="w-full px-3 py-2 bg-cyber-dark2 border border-cyber-purple/20 rounded-lg text-white text-xs resize-none leading-relaxed"
            rows={2}
            placeholder="描述这个镜头的画面内容..."
          />

          {/* 台词 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">💬</span>
            <input
              value={frame.dialogue || ''}
              onChange={e => onUpdate({ ...frame, dialogue: e.target.value })}
              className="flex-1 px-3 py-1.5 bg-cyber-dark2 border border-cyber-purple/20 rounded-lg text-white text-xs"
              placeholder="角色对话/旁白（选填）"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ========== 主组件 ==========
export function Studio() {
  const navigate = useNavigate();
  const { projects, createProject, deleteProject, setCurrentProject } = useProjectStore();
  const { isAuthenticated, vipLevel } = useAuthStore();
  const maxFrames = VIP_LEVELS[vipLevel || 0]?.maxFrames || 5;

  // 工作流步骤
  const steps = [
    { id: 1, label: '剧本输入', icon: BookOpen },
    { id: 2, label: '角色管理', icon: Users },
    { id: 3, label: '分镜规划', icon: Film },
    { id: 4, label: '生成设置', icon: Settings2 },
  ];

  const [currentStep, setCurrentStep] = useState(1);
  const [inputMode, setInputMode] = useState<'text' | 'upload' | 'wizard'>('text');
  const [storyText, setStoryText] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showScriptWizard, setShowScriptWizard] = useState(false);

  // Step 2: 角色
  const [characters, setCharacters] = useState<{ name: string; description: string; role: string }[]>([]);
  const [charVoices, setCharVoices] = useState<Record<string, string>>({});

  // Step 3: 分镜
  const [frames, setFrames] = useState<{ description: string; dialogue?: string; shotType: string }[]>([]);

  // Step 4: 生成设置
  const [selectedStyle, setSelectedStyle] = useState<SceneStyle>('anime');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [videoModel, setVideoModel] = useState('jimeng');
  const [frameCount, setFrameCount] = useState(6);
  const [narratorVoice, setNarratorVoice] = useState('narrator');

  // 分析完成
  const [analysisDone, setAnalysisDone] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件上传
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsAnalyzing(true);

    try {
      let text = '';

      // 基于文件名和 MIME 的双重判断，兼容 Android 文件选择器对 MIME 的误判
      const name = (file.name || '').toLowerCase();
      const type = (file.type || '').toLowerCase();
      const isDocx =
        name.endsWith('.docx') ||
        type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const isDoc = name.endsWith('.doc') || type === 'application/msword';
      const isImage = type.startsWith('image/');
      const isLikelyText =
        name.endsWith('.txt') ||
        name.endsWith('.md') ||
        name.endsWith('.markdown') ||
        name.endsWith('.rtf') ||
        name.endsWith('.htm') ||
        name.endsWith('.html') ||
        name.endsWith('.json') ||
        name.endsWith('.log') ||
        type === 'text/plain' ||
        type === 'text/markdown' ||
        type === 'text/html' ||
        type === 'application/json' ||
        type === 'text/richtext' ||
        type === ''; // Android 常见的空 type（自定义扩展名）

      if (isImage) {
        const reader = new FileReader();
        reader.onload = () => setPreviewImage(reader.result as string);
        reader.readAsDataURL(file);
        setIsAnalyzing(false);
        return;
      }

      if (isDocx || isDoc) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          text = await extractDocxText(arrayBuffer);
        } catch (err) {
          // docx 解析失败时兜底：直接按文本读取，让用户仍能看到内容
          console.warn('按 docx 解析失败，回退为纯文本读取:', err);
          text = await file.text();
        }
      } else if (isLikelyText) {
        text = await file.text();
      } else {
        // 对任何 Android/浏览器识别不出的文件类型都兜底：先尝试文本读取
        text = await file.text();
      }

      if (text) {
        const parsed = parseScript(text);
        setProjectTitle(parsed.title);
        setStoryText(text);
        setCharacters(parsed.characters);
        setFrames(parsed.frames);
        setFrameCount(parsed.recommendedFrames);
        setSelectedStyle(parsed.recommendedStyle);
        setAnalysisDone(true);
        setCurrentStep(2);
      }
    } catch (err) {
      console.error('文件解析失败:', err);
    }
    setIsAnalyzing(false);
  }, []);

  // 手动分析文本（使用真实AI服务）
  const handleAnalyze = async () => {
    if (!storyText.trim()) return;
    setIsAnalyzing(true);

    try {
      const result: AnalysisResult = await analyzeScript(storyText, { model: 'auto' });
      setProjectTitle(prev => prev || result.title);
      setCharacters(result.characters);
      setFrames(result.frames);
      setFrameCount(result.frames.length);
      setSelectedStyle(result.style as SceneStyle);
      setAnalysisDone(true);
      setCurrentStep(2);
    } catch (error) {
      console.error('AI分析失败:', error);
      // Fallback到本地分析
      const parsed = parseScript(storyText);
      setProjectTitle(prev => prev || parsed.title);
      setCharacters(parsed.characters);
      setFrames(parsed.frames);
      setFrameCount(parsed.recommendedFrames);
      setSelectedStyle(parsed.recommendedStyle);
      setAnalysisDone(true);
      setCurrentStep(2);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 开始生成
  const handleGenerate = () => {
    if (!projectTitle.trim()) {
      setProjectTitle('AI漫剧-' + Date.now().toString(36).toUpperCase());
    }
    const content = storyText || '这是一个有趣的漫剧故事';
    const project = createProject(projectTitle || '未命名项目', content, inputMode);

    // 保存角色和分镜数据
    if (characters.length > 0) {
      localStorage.setItem(`project_chars_${project.id}`, JSON.stringify(characters));
      localStorage.setItem(`project_voices_${project.id}`, JSON.stringify(charVoices));
    }
    if (frames.length > 0) {
      localStorage.setItem(`project_frames_${project.id}`, JSON.stringify(frames));
    }

    // 保存生成设置
    localStorage.setItem(`project_settings_${project.id}`, JSON.stringify({
      selectedStyle,
      aspectRatio,
      videoModel,
      frameCount,
      narratorVoice,
    }));

    setCurrentProject(project.id);
    navigate(`/generator/${project.id}`);
  };

  // 跳转到已有项目
  const handleProjectClick = (id: string) => {
    setCurrentProject(id);
    navigate(`/generator/${id}`);
  };

  const canProceedStep2 = characters.length > 0 || analysisDone;
  const canProceedStep3 = frames.length > 0;
  const canProceedStep4 = frames.length > 0 || characters.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="sticky top-16 z-40 bg-white/5 backdrop-blur-xl border-b border-gray-700/30 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-white text-lg">剧本创作</h1>
              <p className="text-xs text-gray-400 hidden sm:block">创建你的专属漫剧故事</p>
            </div>
          </div>

          {/* 步骤指示器 */}
          <div className="flex items-center gap-1">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isDone = currentStep > step.id;
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => {
                      if (isDone || (step.id === 1) || (step.id === 2 && canProceedStep2) || (step.id === 3 && canProceedStep3) || (step.id === 4 && canProceedStep4)) {
                        setCurrentStep(step.id);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive ? 'bg-indigo-600 text-white shadow-lg' :
                      isDone ? 'bg-green-500/20 text-green-400' :
                      'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {isDone ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                  {idx < steps.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-gray-600 mx-1" />
                  )}
                </div>
              );
            })}
          </div>

          {/* 动态时间显示 */}
          <div className="flex items-center">
            <VerticalClock />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/novel-promotion')}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-gray-600/30 hover:border-indigo-500/50 rounded-lg text-xs text-gray-300 hover:text-white transition-all flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">小说推广</span>
              <span className="sm:hidden">推广</span>
            </button>
            <AppVersion />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* ========== Step 1: 剧本输入 ========== */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* 模式切换 */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'text', label: '文字输入', icon: FileText },
                  { key: 'upload', label: '上传素材', icon: Upload },
                  { key: 'wizard', label: 'AI 辅助创作', icon: Wand2 },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      if (tab.key === 'wizard') {
                        setShowScriptWizard(true);
                      } else {
                        setInputMode(tab.key as any);
                        setAnalysisDone(false);
                      }
                    }}
                    className={`py-4 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex flex-col items-center gap-2 ${
                      (inputMode === tab.key && tab.key !== 'wizard')
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                        : tab.key === 'wizard'
                          ? 'bg-white/5 border-2 border-indigo-500/30 text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/10'
                          : 'bg-white/5 border border-gray-700/30 text-gray-400 hover:border-gray-600/50 hover:bg-white/10'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                    {tab.key === 'wizard' && <span className="text-xs bg-indigo-500/20 px-2 py-0.5 rounded">AI</span>}
                  </button>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* 左侧：输入区 */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white/5 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-6">
                    {inputMode === 'text' ? (
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            项目名称
                          </label>
                          <input
                            type="text"
                            value={projectTitle}
                            onChange={e => setProjectTitle(e.target.value)}
                            placeholder="给你的漫剧起个名字..."
                            className="w-full px-4 py-3 bg-black/30 border border-gray-600/30 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            故事剧本
                          </label>
                          <textarea
                            value={storyText}
                            onChange={e => setStoryText(e.target.value)}
                            placeholder="在这里输入你的故事...\n\n例如：\n场景：未来都市的夜晚，霓虹灯闪烁\n小明走在街头，发现了一个神秘的机器人。\n机器人说道：你好，我叫小智。\n小明惊讶地后退一步：你...你会说话？\n\n支持输入完整的剧本，系统会自动识别角色、场景和分镜。"
                            rows={10}
                            className="w-full px-4 py-3 bg-black/30 border border-gray-600/30 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none leading-relaxed"
                          />
                        </div>

                        <Button
                          variant="primary"
                          className="w-full"
                          size="lg"
                          id="analyze-script-btn"
                          onClick={handleAnalyze}
                          disabled={!storyText.trim() || isAnalyzing}
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              AI 智能分析中...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5 mr-2" />
                              AI 智能分析剧本
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* 上传区 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            上传剧本文件
                          </label>
                          <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSelect}
                            className="hidden"
                            accept=".txt,.md,.docx,.doc,.rtf,.json,.htm,.html,text/plain,text/markdown,text/richtext,text/html,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/json,application/octet-stream,text/*,application/*"
                          />
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-600/30 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-300"
                          >
                            {isAnalyzing ? (
                              <div>
                                <Loader2 className="w-10 h-10 mx-auto mb-3 text-indigo-500 animate-spin" />
                                <p className="text-gray-400 text-sm">正在解析文件内容...</p>
                              </div>
                            ) : previewImage ? (
                              <div>
                                <img src={previewImage} alt="Preview" className="max-h-24 mx-auto rounded-lg mb-2" />
                                <p className="text-gray-400 text-sm">{uploadedFile?.name}</p>
                              </div>
                            ) : (
                              <>
                                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-500" />
                                <p className="text-gray-400 text-sm mb-1">点击或拖拽上传文件</p>
                                <p className="text-xs text-gray-500">支持 .txt / .md / .docx</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 分析结果预览 */}
                        {analysisDone && characters.length > 0 && (
                          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Check className="w-4 h-4 text-green-400" />
                              <span className="text-sm font-medium text-green-400">剧本解析完成</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-black/30 rounded-lg p-2">
                                <span className="text-gray-500">识别角色</span>
                                <p className="text-white font-medium">{characters.length} 个</p>
                              </div>
                              <div className="bg-black/30 rounded-lg p-2">
                                <span className="text-gray-500">推荐分镜</span>
                                <p className="text-indigo-400 font-medium">{frames.length} 格</p>
                              </div>
                            </div>
                            <Button
                              variant="primary"
                              className="w-full mt-3"
                              onClick={() => setCurrentStep(2)}
                            >
                              <ArrowRight className="w-4 h-4 mr-2" />
                              继续 → 角色管理
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 右侧：提示 */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white/5 backdrop-blur-xl border border-gray-700/30 rounded-xl p-4">
                    <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      创作小贴士
                    </h3>
                    <ul className="space-y-2 text-xs text-gray-400">
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400">•</span>
                        <span>剧本中包含角色对话（如"xxx说："）可自动识别角色</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400">•</span>
                        <span>场景切换词（突然、这时）有助于智能分镜</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400">•</span>
                        <span>描述越详细，AI 生成效果越好</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400">•</span>
                        <span>建议单集剧本控制在 500-2000 字</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/5 backdrop-blur-xl border border-gray-700/30 rounded-xl p-4">
                    <h3 className="font-medium text-white mb-3">AI 会帮你做什么</h3>
                    <div className="space-y-3">
                      {[
                        { icon: '👤', text: '智能识别剧本中的角色' },
                        { icon: '🎬', text: '自动规划分镜和景别' },
                        { icon: '🖼️', text: '生成角色和场景图片' },
                        { icon: '🎥', text: '合成动态视频片段' },
                        { icon: '🔊', text: '智能配音和音效' },
                        { icon: '📤', text: '一键导出成片' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-lg">{item.icon}</span>
                          <span className="text-gray-400 text-sm">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========== Step 2: 角色管理 ========== */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">👥 角色管理</h2>
                  <p className="text-sm text-gray-500 mt-1">管理剧本中的角色，为每个角色配置外观描述和配音</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCharacters([...characters, { name: `角色${characters.length + 1}`, description: '角色外观描述', role: '角色' }])}
                >
                  <Plus className="w-4 h-4 mr-1" /> 添加角色
                </Button>
              </div>

              {characters.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {characters.map((char, i) => (
                    <CharacterCard
                      key={i}
                      char={char}
                      index={i}
                      onUpdate={c => {
                        const updated = [...characters];
                        updated[i] = c;
                        setCharacters(updated);
                      }}
                      onDelete={() => setCharacters(characters.filter((_, j) => j !== i))}
                      voiceId={charVoices[char.name]}
                      onVoiceChange={id => setCharVoices({ ...charVoices, [char.name]: id })}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-cyber-dark2/40 border border-cyber-purple/10 rounded-2xl">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-500">从剧本中未识别到角色</p>
                  <p className="text-xs text-gray-600 mt-1">可以手动添加角色，或返回修改剧本</p>
                  <Button variant="secondary" className="mt-4" onClick={() => setCharacters([{ name: '主角', description: '故事的主人公，形象阳光积极', role: '主角' }])}>
                    <Plus className="w-4 h-4 mr-1" /> 添加默认角色
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setCurrentStep(1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> 返回剧本
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    if (frames.length === 0 && storyText) {
                      const parsed = parseScript(storyText);
                      setFrames(parsed.frames);
                    }
                    setCurrentStep(3);
                  }}
                >
                  继续 → 分镜规划 <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ========== Step 3: 分镜规划 ========== */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">🎬 分镜规划</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    系统已自动拆分 {frames.length} 个分镜，你可以调整每个镜头的景别和描述
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={frameCount}
                    onChange={e => {
                      const n = Number(e.target.value);
                      setFrameCount(n);
                      if (n > frames.length) {
                        setFrames([...frames, ...Array(n - frames.length).fill(null).map((_, i) => ({
                          description: `分镜 ${frames.length + i + 1}`,
                          dialogue: '',
                          shotType: '中景',
                        }))]);
                      }
                    }}
                    className="px-3 py-1.5 bg-cyber-dark2 border border-cyber-purple/30 rounded-lg text-white text-sm"
                  >
                    {[4, 6, 8, 10, 12, 15, 20, 30, 50, 100].filter(n => n <= maxFrames).map(n => (
                      <option key={n} value={n}>{n} 格分镜</option>
                    ))}
                  </select>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={frames.length >= maxFrames}
                    onClick={() => {
                      if (frames.length < maxFrames) {
                        setFrames([...frames, { description: '', dialogue: '', shotType: '中景' }]);
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> 添加分镜
                  </Button>
                  {frames.length >= maxFrames && (
                    <span className="text-xs text-amber-400">
                      已达上限 ({maxFrames}格)
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {frames.map((frame, i) => (
                  <FrameCard
                    key={i}
                    frame={frame}
                    index={i}
                    onUpdate={f => {
                      const updated = [...frames];
                      updated[i] = f;
                      setFrames(updated);
                    }}
                  />
                ))}
              </div>

              {frames.length === 0 && (
                <div className="text-center py-12 bg-cyber-dark2/40 border border-cyber-purple/10 rounded-2xl">
                  <Film className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-500">暂无分镜数据</p>
                  <Button variant="secondary" className="mt-4" onClick={() => {
                    const parsed = parseScript(storyText || '一个有趣的故事');
                    setFrames(parsed.frames);
                  }}>
                    <Wand2 className="w-4 h-4 mr-1" /> AI 生成分镜
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setCurrentStep(2)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> 返回角色
                </Button>
                <Button variant="primary" className="flex-1" onClick={() => setCurrentStep(4)}>
                  继续 → 生成设置 <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ========== Step 4: 生成设置 ========== */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-white">⚙️ 生成设置</h2>
                <p className="text-sm text-gray-500 mt-1">配置画风、视频模型和导出参数</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* 画风选择 */}
                <div className="bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 rounded-2xl p-5">
                  <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                    <Image className="w-4 h-4 text-cyber-blue" /> 画风选择
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {styleOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedStyle(opt.value as SceneStyle)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedStyle === opt.value
                            ? 'border-cyber-pink bg-cyber-pink/10 shadow-neon'
                            : 'border-cyber-purple/20 bg-cyber-dark/50 hover:border-cyber-purple/40'
                        }`}
                      >
                        <div className="text-2xl mb-1">{opt.emoji}</div>
                        <div className={`font-medium text-sm ${selectedStyle === opt.value ? 'text-white' : 'text-gray-400'}`}>
                          {opt.label}
                        </div>
                        <div className="text-[10px] text-gray-600 mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 视频模型 */}
                <div className="bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 rounded-2xl p-5">
                  <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                    <Video className="w-4 h-4 text-cyber-yellow" /> 视频生成模型
                  </h3>
                  <div className="space-y-2">
                    {videoModels.map(model => (
                      <button
                        key={model.value}
                        onClick={() => setVideoModel(model.value)}
                        className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                          videoModel === model.value
                            ? 'border-cyber-yellow bg-cyber-yellow/10'
                            : 'border-cyber-purple/20 bg-cyber-dark/50 hover:border-cyber-purple/40'
                        }`}
                      >
                        <span className="text-xl">{model.icon}</span>
                        <div className="flex-1">
                          <div className={`font-medium text-sm ${videoModel === model.value ? 'text-white' : 'text-gray-400'}`}>
                            {model.label}
                          </div>
                          <div className="text-[10px] text-gray-600">{model.desc}</div>
                        </div>
                        {videoModel === model.value && <Check className="w-4 h-4 text-cyber-yellow" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 比例和旁白 */}
                <div className="bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 rounded-2xl p-5">
                  <h3 className="font-medium text-white mb-4">📐 输出比例</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {aspectOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setAspectRatio(opt.value)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          aspectRatio === opt.value
                            ? 'border-cyber-pink bg-cyber-pink/10'
                            : 'border-cyber-purple/20 bg-cyber-dark/50 hover:border-cyber-purple/40'
                        }`}
                      >
                        <div className={`font-bold text-lg ${aspectRatio === opt.value ? 'text-white' : 'text-gray-500'}`}>
                          {opt.value}
                        </div>
                        <div className="text-[10px] text-gray-600">{opt.desc}</div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs text-gray-500 mb-2">旁白音色</label>
                    <select
                      value={narratorVoice}
                      onChange={e => setNarratorVoice(e.target.value)}
                      className="w-full px-3 py-2 bg-cyber-dark border border-cyber-purple/30 rounded-lg text-white text-sm"
                    >
                      <option value="narrator">旁白（默认）</option>
                      <option value="male-young">青年男声</option>
                      <option value="female-young">少女声音</option>
                      <option value="female-sweet">甜美女声</option>
                    </select>
                  </div>
                </div>

                {/* 摘要 */}
                <div className="bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 rounded-2xl p-5">
                  <h3 className="font-medium text-white mb-4">📋 创作摘要</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">项目名称</span>
                      <span className="text-white">{projectTitle || '未命名'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">角色数量</span>
                      <span className="text-cyber-pink">{characters.length} 个</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">分镜数量</span>
                      <span className="text-cyber-yellow">{frames.length} 格</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">画风</span>
                      <span className="text-cyber-blue">{styleOptions.find(s => s.value === selectedStyle)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">输出比例</span>
                      <span className="text-white">{aspectRatio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">视频模型</span>
                      <span className="text-white">{videoModels.find(m => m.value === videoModel)?.label}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 开始生成按钮 */}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setCurrentStep(3)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> 返回分镜
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  size="lg"
                  onClick={handleGenerate}
                >
                  <Wand2 className="w-5 h-5 mr-2" />
                  {isAuthenticated ? '开始生成漫剧' : '登录后开始生成'}
                  {!isAuthenticated && (
                    <span className="ml-2 text-xs opacity-70">（登录解锁完整功能）</span>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========== 项目列表 ========== */}
        {projects.length > 0 && (
          <div className="mt-8 pt-8 border-t border-cyber-purple/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-lg">📚 我的项目</h2>
              <span className="text-xs text-gray-500">{projects.length} 个项目</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(project => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-cyber-dark2/60 backdrop-blur border border-cyber-purple/20 rounded-xl p-4 hover:border-cyber-pink/30 transition-all cursor-pointer group"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      project.status === 'completed' ? 'bg-gradient-to-br from-cyber-blue to-cyan-500' :
                      project.status === 'generating' ? 'bg-gradient-to-br from-cyber-yellow to-orange-500' :
                      'bg-cyber-purple/20'
                    }`}>
                      {project.status === 'completed' ? <Film className="w-6 h-6 text-white" /> :
                       project.status === 'generating' ? <Loader2 className="w-6 h-6 text-white animate-spin" /> :
                       <BookOpen className="w-6 h-6 text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate group-hover:text-cyber-pink transition-colors">
                        {project.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {project.sourceType === 'text' ? '📝 文字' : '📁 文件'} · {project.frames.length} 格
                      </p>
                      <div className="mt-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          project.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          project.status === 'generating' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {project.status === 'completed' ? '已完成' :
                           project.status === 'generating' ? '生成中' : '草稿'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteProject(project.id); }}
                      className="p-1.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ===== AI 剧本创作向导 ===== */}
        {showScriptWizard && (
          <ScriptWizard
            onClose={() => setShowScriptWizard(false)}
            onComplete={(generatedScript) => {
              // 将生成的剧本填入编辑器，并自动触发分析
              setStoryText(generatedScript);
              setAnalysisDone(false);
              setInputMode('text');
              setShowScriptWizard(false);
              // 自动触发 AI 分析
              setTimeout(() => {
                const analyzeBtn = document.getElementById('analyze-script-btn');
                if (analyzeBtn) analyzeBtn.click();
              }, 300);
            }}
          />
        )}
      </div>
    </div>
  );
}
