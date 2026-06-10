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

  // 智能识别角色
  const namePatterns = [
    /[""']([\u4e00-\u9fa5]{2,4})[""'][：:是]?\s*(.{5,30}?)(?=\n|[""']|$)/g,
    /([\u4e00-\u9fa5]{2,4})(?:说|道|问|答|喊|叫|想|觉得|认为|看着)[：:]\s*(.{3,30}?)(?=\n|$)/g,
  ];
  const foundNames = new Set<string>();
  const charDescriptions: Record<string, string> = {};
  
  for (const pattern of namePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      const desc = match[2].trim();
      if (name.length >= 2 && name.length <= 4) {
        foundNames.add(name);
        if (!charDescriptions[name]) {
          charDescriptions[name] = desc;
        }
      }
    }
  }

  const characters = Array.from(foundNames).slice(0, 6).map((name, i) => ({
    name,
    description: charDescriptions[name] || `故事中的重要角色，性格独特，形象鲜明`,
    role: i === 0 ? '主角' : i === 1 ? '配角' : '角色',
  }));

  // 智能识别场景
  const sceneKeywords = ['场景', '地点', '在', '来到', '走进', '回到', '来到'];
  const sceneMatches = text.match(/(?:场景[：:]\s*)?([^。！？\n]{3,30}?)/g) || [];
  const scenes = sceneMatches.slice(0, 8).map(s => s.replace(/场景[：:]\s*/, '').trim()).filter(Boolean);

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
  const [inputMode, setInputMode] = useState<'text' | 'upload'>('text');
  const [storyText, setStoryText] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
    <div className="min-h-screen bg-cyber-dark cyber-grid">
      {/* Header */}
      <header className="sticky top-16 z-40 h-16 bg-cyber-dark2/95 backdrop-blur-xl border-b border-cyber-purple/20 px-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center shadow-neon">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-base">AI 漫剧工作室</h1>
            <p className="text-[10px] text-gray-500 hidden sm:block">智能生成 · 专业品质 · 零门槛创作</p>
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive ? 'bg-cyber-pink text-white shadow-neon' :
                    isDone ? 'bg-cyber-purple/30 text-cyber-purple' :
                    'text-gray-500'
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
                {idx < steps.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-gray-600 mx-0.5" />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <AppVersion />
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
              <div className="flex gap-3">
                {[
                  { key: 'text', label: '文字输入', icon: FileText },
                  { key: 'upload', label: '上传素材', icon: Upload },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => { setInputMode(tab.key as any); setAnalysisDone(false); }}
                    className={`flex-1 py-3 px-5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                      inputMode === tab.key
                        ? 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white shadow-neon'
                        : 'bg-cyber-dark2 text-gray-400 border border-cyber-purple/20 hover:border-cyber-purple/40'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid lg:grid-cols-5 gap-6">
                {/* 左侧：输入区 */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 rounded-2xl p-6">
                    {inputMode === 'text' ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-cyber-blue mb-2">
                            📝 项目名称
                          </label>
                          <input
                            type="text"
                            value={projectTitle}
                            onChange={e => setProjectTitle(e.target.value)}
                            placeholder="给你的漫剧起个名字..."
                            className="w-full px-4 py-3 bg-cyber-dark border border-cyber-purple/30 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyber-pink transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-cyber-blue mb-2">
                            📖 故事剧本
                          </label>
                          <textarea
                            value={storyText}
                            onChange={e => setStoryText(e.target.value)}
                            placeholder={`在这里输入你的故事...\n\n例如：\n场景：未来都市的夜晚，霓虹灯闪烁\n小明走在街头，发现了一个神秘的机器人。\n"你好，我叫小智。"机器人说道。\n小明惊讶地后退一步，"你...你会说话？"...\n\n支持输入完整的剧本，系统会自动识别角色、场景和分镜。`}
                            rows={12}
                            className="w-full px-4 py-3 bg-cyber-dark border border-cyber-purple/30 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyber-pink transition-colors resize-none leading-relaxed"
                          />
                        </div>

                        <Button
                          variant="primary"
                          className="w-full"
                          size="lg"
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
                          <label className="block text-sm font-medium text-cyber-blue mb-2">
                            📁 上传剧本文件
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
                            className="border-2 border-dashed border-cyber-purple/30 rounded-xl p-10 text-center cursor-pointer hover:border-cyber-pink/50 transition-colors"
                          >
                            {isAnalyzing ? (
                              <div>
                                <Loader2 className="w-12 h-12 mx-auto mb-3 text-cyber-pink animate-spin" />
                                <p className="text-gray-400">正在解析文件内容...</p>
                              </div>
                            ) : previewImage ? (
                              <div>
                                <img src={previewImage} alt="Preview" className="max-h-32 mx-auto rounded-lg mb-3" />
                                <p className="text-gray-400 text-sm">{uploadedFile?.name}</p>
                              </div>
                            ) : (
                              <>
                                <Upload className="w-12 h-12 mx-auto mb-3 text-cyber-purple/40" />
                                <p className="text-gray-400 mb-1">点击上传剧本文件</p>
                                <p className="text-xs text-gray-600">支持 .txt / .md / .docx</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 分析结果预览 */}
                        {analysisDone && characters.length > 0 && (
                          <div className="bg-cyber-purple/10 border border-cyber-purple/20 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Check className="w-4 h-4 text-green-400" />
                              <span className="text-sm font-medium text-white">剧本解析完成</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-cyber-dark/50 rounded-lg p-2">
                                <span className="text-gray-500">识别角色</span>
                                <p className="text-white font-medium">{characters.length} 个</p>
                              </div>
                              <div className="bg-cyber-dark/50 rounded-lg p-2">
                                <span className="text-gray-500">推荐分镜</span>
                                <p className="text-cyber-yellow font-medium">{frames.length} 格</p>
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
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-gradient-to-br from-cyber-purple/10 to-cyber-pink/10 border border-cyber-purple/20 rounded-2xl p-5">
                    <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-cyber-yellow" />
                      创作小贴士
                    </h3>
                    <ul className="space-y-2 text-xs text-gray-400">
                      <li>• 剧本中包含角色对话（如"xxx说："）可自动识别角色</li>
                      <li>• 场景切换词（突然、这时、与此同时）有助于智能分镜</li>
                      <li>• 描述越详细，AI 生成效果越好</li>
                      <li>• 可上传 .docx / .txt 格式的完整剧本</li>
                      <li>• 建议单集剧本控制在 500-2000 字</li>
                    </ul>
                  </div>

                  <div className="bg-cyber-dark2/60 border border-cyber-purple/20 rounded-2xl p-5">
                    <h3 className="font-medium text-white mb-3">✨ AI 会帮你做什么</h3>
                    <div className="space-y-3">
                      {[
                        { icon: '👤', text: '智能识别剧本中的角色' },
                        { icon: '🎬', text: '自动规划分镜和景别' },
                        { icon: '🖼️', text: '生成角色和场景图片' },
                        { icon: '🎥', text: '合成动态视频片段' },
                        { icon: '🔊', text: '智能配音和音效' },
                        { icon: '📤', text: '一键导出成片' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <span className="text-lg">{item.icon}</span>
                          <span className="text-gray-400">{item.text}</span>
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
      </div>
    </div>
  );
}
