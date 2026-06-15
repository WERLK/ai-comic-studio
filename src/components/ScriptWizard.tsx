/**
 * 剧本创作向导 - 帮助没有剧本的用户一步步创作 AI 漫剧
 * 流程：剧本类型 → 导入小说 → 基本信息 → 角色创建 → API 配置 → 生成大纲 → 合成剧本
 */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Sparkles, BookOpen, Users,
  Wand2, Settings2, Plus, Trash, Check, Loader2, ArrowRight,
  FileText, Star, Settings, Zap, Lock, Unlock, Upload, Search
} from 'lucide-react';
import { Button } from '@/components/common';
import { NovelReader } from '@/components/NovelReader';
import { getAIConfig, setAIConfig, type AIServiceConfig } from '@/services/aiService';

const SCRIPT_TYPES = [
  { value: 'comedy', label: '喜剧', emoji: '😂', desc: '轻松幽默，欢乐不断' },
  { value: 'romance', label: '爱情', emoji: '💕', desc: '甜蜜心动，浪漫邂逅' },
  { value: 'scifi', label: '科幻', emoji: '🚀', desc: '未来科技，宇宙探索' },
  { value: 'fantasy', label: '奇幻', emoji: '🧙', desc: '魔法异世界，奇遇冒险' },
  { value: 'thriller', label: '悬疑', emoji: '🔍', desc: '层层悬念，烧脑反转' },
  { value: 'school', label: '校园', emoji: '📚', desc: '青春校园，热血成长' },
  { value: 'workplace', label: '职场', emoji: '💼', desc: '职场风云，人生百态' },
  { value: 'ancient', label: '古风', emoji: '🏮', desc: '古韵古风，穿越时空' },
  { value: 'horror', label: '惊悚', emoji: '😱', desc: '惊险刺激，毛骨悚然' },
  { value: 'action', label: '动作', emoji: '⚡', desc: '热血打斗，燃爆全场' },
  { value: 'daily', label: '日常', emoji: '☀️', desc: '温馨日常，治愈人心' },
  { value: 'drama', label: '剧情', emoji: '🎭', desc: '情感纠葛，人生百味' },
];

const GENDERS = [
  { value: 'male', label: '男', emoji: '♂️' },
  { value: 'female', label: '女', emoji: '♀️' },
  { value: 'neutral', label: '中性/其他', emoji: '⚧️' },
];

const LENGTH_OPTIONS = [
  { value: 'short', label: '短剧', desc: '3-5 分钟（3-6 幕）', scenes: 4 },
  { value: 'medium', label: '中剧', desc: '8-15 分钟（7-12 幕）', scenes: 9 },
  { value: 'long', label: '长剧', desc: '15-30 分钟（13-20 幕）', scenes: 16 },
];

interface WizardCharacter {
  name: string;
  role: 'protagonist' | 'supporting' | 'antagonist' | 'extra';
  gender: 'male' | 'female' | 'neutral';
  age: string;
  personality: string;
  appearance: string;
}

interface ApiPlatformMini {
  key: keyof AIServiceConfig;
  label: string;
  emoji: string;
  hasKey: boolean;
}

interface ScriptWizardProps {
  onClose: () => void;
  // 完成时：把生成的剧本文本传回 Studio
  onComplete: (script: string) => void;
}

export function ScriptWizard({ onClose, onComplete }: ScriptWizardProps) {
  // ===== 向导步骤 =====
  const WIZARD_STEPS = [
    { id: 'type', label: '选择类型', icon: BookOpen },
    { id: 'novel', label: '导入小说', icon: Upload },
    { id: 'basic', label: '基本信息', icon: FileText },
    { id: 'chars', label: '创建角色', icon: Users },
    { id: 'api', label: 'API 配置', icon: Settings2 },
    { id: 'outline', label: '生成大纲', icon: Sparkles },
    { id: 'final', label: '合成剧本', icon: Wand2 },
  ];

  const [wizardStep, setWizardStep] = useState(0);
  const totalSteps = WIZARD_STEPS.length;

  // ===== 数据状态 =====
  const [scriptType, setScriptType] = useState('');
  const [importedNovelContent, setImportedNovelContent] = useState('');
  const [importedNovelMeta, setImportedNovelMeta] = useState<{ title: string; author: string }>({ title: '', author: '' });
  const [title, setTitle] = useState('');
  const [setting, setSetting] = useState('');
  const [theme, setTheme] = useState('');
  const [targetLength, setTargetLength] = useState('medium');
  const [characters, setCharacters] = useState<WizardCharacter[]>([]);
  const [outline, setOutline] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // API 配置状态
  const [apiConfigs, setApiConfigs] = useState<AIServiceConfig>(() => getAIConfig());
  const [showApiPanel, setShowApiPanel] = useState(false);
  const [apiSaved, setApiSaved] = useState(false);

  const activeScriptType = SCRIPT_TYPES.find(t => t.value === scriptType);
  const activeLength = LENGTH_OPTIONS.find(l => l.value === targetLength)!;

  // ===== 角色管理 =====
  const addCharacter = () => {
    setCharacters(prev => [
      ...prev,
      {
        name: '',
        role: 'supporting',
        gender: 'male',
        age: '25',
        personality: '',
        appearance: '',
      },
    ]);
  };

  const updateCharacter = (idx: number, updates: Partial<WizardCharacter>) => {
    setCharacters(prev => prev.map((c, i) => (i === idx ? { ...c, ...updates } : c)));
  };

  const removeCharacter = (idx: number) => {
    setCharacters(prev => prev.filter((_, i) => i !== idx));
  };

  // ===== API 配置 =====
  const handleApiChange = (key: keyof AIServiceConfig, value: string) => {
    const updated = { ...apiConfigs, [key]: value };
    setApiConfigs(updated);
    setAIConfig(updated);
    setApiSaved(true);
    setTimeout(() => setApiSaved(false), 800);
  };

  const activeApiPlatforms = [
    { key: 'siliconflowApiKey' as keyof AIServiceConfig, label: '硅基流动', emoji: '⚡' },
    { key: 'jeniyaApiKey' as keyof AIServiceConfig, label: '简易API', emoji: '🔑' },
    { key: 'dashscopeApiKey' as keyof AIServiceConfig, label: '阿里云百炼', emoji: '☁️' },
    { key: 'zhipuApiKey' as keyof AIServiceConfig, label: '智谱AI', emoji: '🧠' },
    { key: 'volcengineApiKey' as keyof AIServiceConfig, label: '火山引擎', emoji: '🌋' },
    { key: 'qianfanApiKey' as keyof AIServiceConfig, label: '百度千帆', emoji: '🦋' },
    { key: 'lingyaApiKey' as keyof AIServiceConfig, label: '灵芽AI', emoji: '🌱' },
  ];

  const configuredCount = activeApiPlatforms.filter(p => !!apiConfigs[p.key]).length;
  const hasAnyApi = configuredCount > 0;

  // ===== 生成剧情大纲 =====
  const generateOutline = async () => {
    setIsGenerating(true);
    try {
      const prompt = `你是资深剧本编剧。请为以下漫剧项目创作一个详细的${activeLength.label}（约${activeLength.scenes}幕）剧情大纲。

项目信息：
- 类型：${activeScriptType?.label || scriptType}
- 标题：${title || '（待定）'}
- 场景设定：${setting || '（未设定）'}
- 主题/核心冲突：${theme || '（未设定）'}

角色（${characters.length}个）：
${characters.map((c, i) => `${i + 1}. ${c.name}（${c.role === 'protagonist' ? '主角' : c.role === 'supporting' ? '配角' : c.role === 'antagonist' ? '反派' : '背景人物'}，${c.gender === 'male' ? '男' : c.gender === 'female' ? '女' : '中性'}，${c.age}岁，性格：${c.personality || '未描述'}）`).join('\n')}

请按以下格式输出大纲（JSON格式，每一幕包含：幕号、场景描述、关键动作、对白要点）：
{
  "outline": [
    {
      "act": 1,
      "scene": "场景/地点",
      "description": "这一幕发生了什么",
      "keyActions": ["关键动作1", "关键动作2"],
      "dialoguePoints": ["对白要点1", "对白要点2"]
    }
  ],
  "estimatedDuration": "预估时长"
}`;

      const apiKey = apiConfigs.siliconflowApiKey || apiConfigs.jeniyaApiKey || apiConfigs.dashscopeApiKey || apiConfigs.zhipuApiKey || apiConfigs.volcengineApiKey || apiConfigs.qianfanApiKey || apiConfigs.lingyaApiKey;

      let response: Response;
      if (apiConfigs.siliconflowApiKey) {
        response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfigs.siliconflowApiKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-ai/DeepSeek-V3-0324',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000,
            temperature: 0.8,
          }),
        });
      } else if (apiConfigs.dashscopeApiKey) {
        response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfigs.dashscopeApiKey}`,
          },
          body: JSON.stringify({
            model: 'qwen2.5-72b-instruct',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000,
            temperature: 0.8,
          }),
        });
      } else if (apiConfigs.zhipuApiKey) {
        response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfigs.zhipuApiKey}`,
          },
          body: JSON.stringify({
            model: 'glm-4-flash',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000,
            temperature: 0.8,
          }),
        });
      } else if (apiKey) {
        response = await fetch('https://api.jeniya.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000,
            temperature: 0.8,
          }),
        });
      } else {
        // 无 API 时生成默认大纲
        const defaultOutline = generateFallbackOutline();
        setOutline(defaultOutline);
        setWizardStep(4); // 跳到大纲确认步骤
        setIsGenerating(false);
        return;
      }

      if (!response?.ok) {
        const defaultOutline = generateFallbackOutline();
        setOutline(defaultOutline);
        setWizardStep(4);
        setIsGenerating(false);
        return;
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || '';
      setOutline(text);
      setWizardStep(4);
    } catch {
      const fallback = generateFallbackOutline();
      setOutline(fallback);
      setWizardStep(4);
    } finally {
      setIsGenerating(false);
    }
  };

  // 无 API 时的默认大纲生成
  function generateFallbackOutline(): string {
    const type = SCRIPT_TYPES.find(t => t.value === scriptType);
    const charList = characters.map(c => `【${c.name}】`).join('、');
    const scenes: string[] = [];
    for (let i = 1; i <= activeLength.scenes; i++) {
      scenes.push(`第${i}幕：
  场景：${setting || '待设定场景'}
  内容：${theme || type?.label || '故事'}剧情推进，${charList || '角色'}参与其中
  对白：关键对话和情感表达`);
    }
    return `【${title || '剧本大纲'}】

类型：${type?.label || scriptType}
时长：${activeLength.desc}
角色：${charList || '待添加'}

${scenes.join('\n\n')}

【剧情概要】
${theme || `这是一个关于${type?.label || ''}的故事，角色们在${setting || '特定场景'}中展开互动。`}`;
  }

  // ===== 合成完整剧本 =====
  const generateFinalScript = async () => {
    setIsGenerating(true);
    try {
      const scriptContent = `【${title || '未命名剧本'}】

【基本信息】
类型：${activeScriptType?.label || scriptType}
设定：${setting || '未设定'}
主题：${theme || '未设定'}
时长：${activeLength.desc}

【登场角色】
${characters.map(c => `・${c.name}（${c.role === 'protagonist' ? '主角' : c.role === 'supporting' ? '配角' : c.role === 'antagonist' ? '反派' : '背景'}）
  性别：${c.gender === 'male' ? '男' : c.gender === 'female' ? '女' : '中性'} | 年龄：${c.age}
  性格：${c.personality || '待补充'}
  外貌：${c.appearance || '待补充'}`).join('\n\n')}

${outline ? `【剧情大纲】\n${outline}\n` : ''}

【完整剧本正文】
${characters.length > 0 && outline
  ? `（以上为 AI 生成的大纲，请参考大纲内容手动编写剧本正文，以下为参考开头...）

---

【第一幕】${setting ? setting.split('，')[0] : '故事开端'}

${characters[0]?.name || '角色A'}：（走进场景）
${characters[1]?.name || '角色B'}：（打招呼）
${characters[0]?.name || '角色A'}："${generateDialogue('opening', scriptType)}"

${characters[1]?.name || '角色B'}："${generateDialogue('response', scriptType)}"

---

【第二幕】（场景切换）

...
（请根据以上大纲和角色设定继续编写，或返回上一页重新生成更详细的大纲）`
  : `（请先在上一页完善角色和剧情大纲，再生成完整剧本）`}
`;
      setGeneratedScript(scriptContent);
      setWizardStep(5);
    } catch {
      alert('剧本生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  function generateDialogue(type: string, genre: string): string {
    const openings: Record<string, string[]> = {
      comedy: ['嘿，今天有什么新鲜事？', '你听说了吗？简直笑死我了！', '这事儿太离谱了！'],
      romance: ['终于见到你了...', '今天的天气真适合散步呢。', '你好像...变漂亮了。'],
      scifi: ['警报！检测到异常信号。', '系统启动完毕，欢迎回来。', '这片星域我们从未探索过。'],
      fantasy: ['魔法阵亮起来了！', '我感应到了远古的力量...', '命运的齿轮开始转动。'],
      thriller: ['你确定这里没人跟踪？', '那个声音...是从哪里传来的？', '不能再等了，必须行动。'],
      school: ['今天的课真无聊啊...', '社团活动要开始了！', '考试结果出来了...'],
      workplace: ['这个月的 KPI 完成了吗？', '老板又在催方案了。', '下班一起去喝一杯？'],
      ancient: ['今日入宫参见陛下。', '小姐，此处不宜久留。', '公子，请留步。'],
      default: ['一切从这里开始...', '故事的主角们登场了。', '命运的安排总是出人意料。'],
    };
    const list = openings[genre] || openings['default'];
    return list[Math.floor(Math.random() * list.length)];
  }

  // ===== 使用剧本 =====
  const handleUseScript = () => {
    if (generatedScript) {
      onComplete(generatedScript);
      onClose();
    }
  };

  const currentStepData = WIZARD_STEPS[wizardStep];
  const IconComponent = currentStepData?.icon || BookOpen;

  const canProceedFromType = !!scriptType;
  const canProceedFromNovel = true; // 小说导入可选（没有导入也能继续手动写）
  const canProceedFromBasic = !!title.trim();
  const canProceedFromChars = characters.length >= 1 && characters.every(c => !!c.name.trim());
  const canProceedFromApi = true; // API 配置可选
  const canProceedFromOutline = !!outline.trim();

  const getCanProceed = () => {
    switch (currentStepData.id) {
      case 'type': return canProceedFromType;
      case 'novel': return canProceedFromNovel;
      case 'basic': return canProceedFromBasic;
      case 'chars': return canProceedFromChars;
      case 'api': return canProceedFromApi;
      case 'outline': return canProceedFromOutline;
      default: return true;
    }
  };

  // 根据新步骤索引调整 handleNext
  // step 0=type, 1=novel, 2=basic, 3=chars, 4=api, 5=outline, 6=final
  const handleNext = async () => {
    if (wizardStep === 4) {
      // 从 API 配置 -> 生成大纲
      await generateOutline();
      return;
    }
    if (wizardStep === 5) {
      // 从大纲 -> 合成剧本
      await generateFinalScript();
      return;
    }
    if (wizardStep < totalSteps - 1) {
      // 如果导入了小说，自动填充标题
      if (wizardStep === 1 && importedNovelMeta.title) {
        setTitle(importedNovelMeta.title);
      }
      setWizardStep(s => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-cyber-dark2 border border-cyber-purple/30 rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-purple/20 bg-cyber-dark/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white">AI 剧本创作向导</h2>
              <p className="text-[10px] text-gray-500">没有剧本？没关系，AI 帮你一步步创作</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 步骤指示器 */}
        <div className="px-6 py-3 border-b border-cyber-purple/10 bg-cyber-dark/30">
          <div className="flex items-center gap-1 overflow-x-auto">
            {WIZARD_STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === wizardStep;
              const isDone = idx < wizardStep;
              return (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive ? 'bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/30' :
                    isDone ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    'bg-cyber-dark text-gray-500 border border-cyber-purple/10'
                  }`}>
                    {isDone ? <Check className="w-3 h-3" /> : <StepIcon className="w-3 h-3" />}
                    <span className="hidden sm:inline">{step.label}</span>
                    {isActive && <span className="text-[10px] opacity-60">({idx + 1}/{totalSteps})</span>}
                  </div>
                  {idx < WIZARD_STEPS.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-gray-600 mx-0.5 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 主体内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={wizardStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 1: 选择剧本类型 */}
              {wizardStep === 0 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-white font-medium mb-1">🎭 选择剧本类型</h3>
                    <p className="text-xs text-gray-500">选择你想要创作的漫剧类型，AI 将据此生成最合适的故事风格</p>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {SCRIPT_TYPES.map(type => (
                      <button
                        key={type.value}
                        onClick={() => setScriptType(type.value)}
                        className={`p-3 rounded-xl border text-center transition-all hover:scale-105 ${
                          scriptType === type.value
                            ? 'bg-cyber-pink/20 border-cyber-pink/50 text-white'
                            : 'bg-cyber-dark/50 border-cyber-purple/20 text-gray-400 hover:border-cyber-purple/40'
                        }`}
                      >
                        <div className="text-2xl mb-1">{type.emoji}</div>
                        <div className="text-xs font-medium">{type.label}</div>
                        <div className="text-[9px] text-gray-600 mt-0.5 hidden sm:block">{type.desc}</div>
                      </button>
                    ))}
                  </div>
                  {scriptType && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-cyber-purple/10 border border-cyber-purple/20 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="w-4 h-4 text-cyber-pink" />
                        <span className="text-sm text-white font-medium">已选择：{activeScriptType?.emoji} {activeScriptType?.label}</span>
                      </div>
                      <p className="text-xs text-gray-400">{activeScriptType?.desc}</p>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Step 2: 导入小说 */}
              {wizardStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-white font-medium mb-1">📚 导入小说（可选）</h3>
                    <p className="text-xs text-gray-500">
                      如果您有一本小说想改编成漫剧，可以在此上传或搜索。暂不导入也可以手动填写故事内容。
                    </p>
                  </div>

                  {importedNovelContent ? (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400 font-medium">已导入：《{importedNovelMeta.title || '未命名'}》</span>
                      </div>
                      {importedNovelMeta.author && (
                        <p className="text-xs text-gray-500 mb-1">作者：{importedNovelMeta.author}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        字数：约 {Math.round(importedNovelContent.length / 2)} 字 · {importedNovelContent.slice(0, 100).replace(/\n/g, ' ')}...
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setImportedNovelContent('')}
                          className="px-3 py-1.5 border border-cyber-purple/20 rounded-lg text-xs text-gray-400 hover:text-white"
                        >
                          重新选择
                        </button>
                        <div className="flex-1" />
                        <div className="text-[10px] text-gray-600 self-center">
                          AI 将根据小说内容自动生成剧本
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-cyber-purple/5 border border-cyber-purple/10 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-400 mb-3">暂未导入小说，可以跳过此步骤</p>
                      <div className="text-[10px] text-gray-600">
                        跳过后可在「基本信息」中手动填写故事内容
                      </div>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {/* 打开 NovelReader 弹窗，由外部状态控制 */}}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {importedNovelContent ? '重新导入小说' : '上传 / 搜索小说'}
                  </Button>

                  {/* NovelReader 弹窗由 showNovelReader 状态控制 */}
                  <NovelReader
                    onImport={(content, meta) => {
                      setImportedNovelContent(content);
                      setImportedNovelMeta({ title: meta.title, author: meta.author });
                    }}
                    onClose={() => {}}
                  />
                </div>
              )}

              {/* Step 3: 基本信息 */}
              {wizardStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-white font-medium mb-1">📝 填写基本信息</h3>
                    <p className="text-xs text-gray-500">告诉 AI 你的剧本想要讲什么故事</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">剧本标题</label>
                      <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder={`给你的漫剧起个名字，如「${['星际迷途', '樱花树下的约定', '城市追凶'][Math.floor(Math.random() * 3)]}」`}
                        className="w-full px-4 py-3 bg-cyber-dark border border-cyber-purple/30 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-cyber-pink/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">故事背景 / 场景设定</label>
                      <textarea
                        value={setting}
                        onChange={e => setSetting(e.target.value)}
                        placeholder="描述故事发生的地点、时代、社会环境等，如「未来都市，霓虹灯闪烁的高楼之间」"
                        rows={3}
                        className="w-full px-4 py-3 bg-cyber-dark border border-cyber-purple/30 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-cyber-pink/50 transition-colors resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">核心主题 / 情感冲突</label>
                      <textarea
                        value={theme}
                        onChange={e => setTheme(e.target.value)}
                        placeholder="你想表达什么？如「科技与人性的碰撞，爱情与责任的抉择」"
                        rows={2}
                        className="w-full px-4 py-3 bg-cyber-dark border border-cyber-purple/30 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-cyber-pink/50 transition-colors resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">目标时长</label>
                      <div className="grid grid-cols-3 gap-2">
                        {LENGTH_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setTargetLength(opt.value)}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              targetLength === opt.value
                                ? 'bg-cyber-pink/20 border-cyber-pink/50 text-white'
                                : 'bg-cyber-dark/50 border-cyber-purple/20 text-gray-400 hover:border-cyber-purple/40'
                            }`}
                          >
                            <div className="text-sm font-medium">{opt.label}</div>
                            <div className="text-[10px] mt-0.5 text-gray-600">{opt.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: 创建角色 */}
              {wizardStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-white font-medium mb-1">👤 创建角色</h3>
                    <p className="text-xs text-gray-500">至少创建 1 个角色，越详细 AI 生成效果越好</p>
                  </div>

                  <div className="space-y-3">
                    {characters.map((char, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-cyber-dark/60 border border-cyber-purple/20 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-sm font-bold">
                              {char.name ? char.name[0] : '?'}
                            </div>
                            <span className="text-sm text-white font-medium">
                              角色 {idx + 1} {char.name && `— ${char.name}`}
                            </span>
                          </div>
                          <button
                            onClick={() => removeCharacter(idx)}
                            className="p-1.5 text-red-400/60 hover:text-red-400 transition-colors"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-1">姓名</label>
                            <input
                              value={char.name}
                              onChange={e => updateCharacter(idx, { name: e.target.value })}
                              placeholder="角色名"
                              className="w-full px-3 py-2 bg-cyber-dark2 border border-cyber-purple/20 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-cyber-pink/50"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-1">定位</label>
                            <select
                              value={char.role}
                              onChange={e => updateCharacter(idx, { role: e.target.value as WizardCharacter['role'] })}
                              className="w-full px-3 py-2 bg-cyber-dark2 border border-cyber-purple/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyber-pink/50"
                            >
                              <option value="protagonist">主角</option>
                              <option value="supporting">配角</option>
                              <option value="antagonist">反派</option>
                              <option value="extra">背景人物</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-1">性别</label>
                            <select
                              value={char.gender}
                              onChange={e => updateCharacter(idx, { gender: e.target.value as WizardCharacter['gender'] })}
                              className="w-full px-3 py-2 bg-cyber-dark2 border border-cyber-purple/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyber-pink/50"
                            >
                              {GENDERS.map(g => (
                                <option key={g.value} value={g.value}>{g.emoji} {g.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-1">年龄</label>
                            <input
                              value={char.age}
                              onChange={e => updateCharacter(idx, { age: e.target.value })}
                              placeholder="如 25"
                              className="w-full px-3 py-2 bg-cyber-dark2 border border-cyber-purple/20 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-cyber-pink/50"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[10px] text-gray-500 mb-1">性格特点</label>
                            <input
                              value={char.personality}
                              onChange={e => updateCharacter(idx, { personality: e.target.value })}
                              placeholder="如 乐观开朗，外表冷漠内心火热"
                              className="w-full px-3 py-2 bg-cyber-dark2 border border-cyber-purple/20 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-cyber-pink/50"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[10px] text-gray-500 mb-1">外貌描述</label>
                            <input
                              value={char.appearance}
                              onChange={e => updateCharacter(idx, { appearance: e.target.value })}
                              placeholder="如 长发飘飘，眼神犀利，穿着一身黑色风衣"
                              className="w-full px-3 py-2 bg-cyber-dark2 border border-cyber-purple/20 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-cyber-pink/50"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <button
                    onClick={addCharacter}
                    className="w-full py-3 border-2 border-dashed border-cyber-purple/30 rounded-xl text-cyber-purple hover:border-cyber-pink/50 hover:text-cyber-pink transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    添加角色
                  </button>

                  {/* 快速添加推荐 */}
                  {characters.length === 0 && (
                    <div className="bg-cyber-purple/5 border border-cyber-purple/10 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-2">💡 不知道创建什么角色？试试这些组合：</p>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { names: '小明,小红', type: 'comedy' },
                          { names: '女主,男主', type: 'romance' },
                          { names: '船长,外星人', type: 'scifi' },
                          { names: '勇者,魔王', type: 'fantasy' },
                        ].map((preset, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              const parts = preset.names.split(',');
                              setCharacters(parts.map((name, j) => ({
                                name: name.trim(),
                                role: j === 0 ? 'protagonist' : 'supporting',
                                gender: j === 0 ? 'male' : 'female',
                                age: '25',
                                personality: '',
                                appearance: '',
                              })));
                            }}
                            className="px-3 py-1.5 bg-cyber-purple/10 hover:bg-cyber-purple/20 border border-cyber-purple/20 rounded-lg text-xs text-gray-400 hover:text-white transition-all"
                          >
                            {preset.names} ({SCRIPT_TYPES.find(t => t.value === preset.type)?.label})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: API 配置 */}
              {wizardStep === 4 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-white font-medium mb-1">⚙️ API 平台配置</h3>
                    <p className="text-xs text-gray-500">
                      配置 API 密钥后，AI 将为你生成详细的剧情大纲。暂不配置也可以继续，但大纲将由系统默认生成。
                    </p>
                  </div>

                  {/* 状态摘要 */}
                  <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                    hasAnyApi
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-cyber-purple/5 border-cyber-purple/10'
                  }`}>
                    {hasAnyApi ? (
                      <Unlock className="w-6 h-6 text-green-400 flex-shrink-0" />
                    ) : (
                      <Lock className="w-6 h-6 text-gray-500 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${hasAnyApi ? 'text-green-400' : 'text-gray-400'}`}>
                        {hasAnyApi ? `已配置 ${configuredCount} 个平台` : '尚未配置 API 密钥'}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {hasAnyApi ? 'AI 将使用你的密钥生成个性化剧情大纲' : '点击下方平台即可快速配置'}
                      </div>
                    </div>
                    {apiSaved && (
                      <span className="text-[10px] text-green-400 animate-pulse">✓ 已保存</span>
                    )}
                  </div>

                  {/* 平台快捷配置 */}
                  <div className="space-y-2">
                    {activeApiPlatforms.map(platform => (
                      <div key={platform.key} className="bg-cyber-dark/60 border border-cyber-purple/20 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{platform.emoji}</span>
                            <span className="text-sm text-white font-medium">{platform.label}</span>
                            {!!apiConfigs[platform.key] && (
                              <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full">已配置</span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              const current = apiConfigs[platform.key] || '';
                              const next = prompt(`${platform.label} API Key：`, current);
                              if (next !== null) handleApiChange(platform.key, next);
                            }}
                            className="text-[10px] text-cyber-blue hover:underline"
                          >
                            {apiConfigs[platform.key] ? '修改' : '添加'}
                          </button>
                        </div>
                        {!!apiConfigs[platform.key] && (
                          <div className="text-[10px] text-gray-500 font-mono truncate">
                            Key: ••••••••{String(apiConfigs[platform.key]).slice(-4)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="bg-cyber-yellow/5 border border-cyber-yellow/10 rounded-xl p-3">
                    <p className="text-[10px] text-cyber-yellow">
                      💡 免费额度推荐：智谱 AI (GLM-4-Flash 永久免费)、硅基流动 (9B 以下模型免费)、阿里云百炼 (100万 token/月)
                    </p>
                  </div>
                </div>
              )}

              {/* Step 6: 剧情大纲 */}
              {wizardStep === 5 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-white font-medium mb-1">✨ 剧情大纲</h3>
                    <p className="text-xs text-gray-500">AI 根据你的设定生成了以下大纲，可直接使用或复制修改</p>
                  </div>
                  <div className="bg-cyber-dark/60 border border-cyber-purple/20 rounded-xl p-4">
                    <textarea
                      value={outline}
                      onChange={e => setOutline(e.target.value)}
                      rows={14}
                      className="w-full bg-transparent text-gray-300 text-sm resize-none focus:outline-none leading-relaxed"
                      placeholder="大纲内容..."
                    />
                  </div>
                  {isGenerating && (
                    <div className="flex items-center gap-3 justify-center py-4">
                      <Loader2 className="w-5 h-5 text-cyber-pink animate-spin" />
                      <span className="text-sm text-gray-400">AI 正在生成大纲...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Step 7: 完整剧本 */}
              {wizardStep === 6 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-white font-medium mb-1">📖 完整剧本</h3>
                    <p className="text-xs text-gray-500">
                      {hasAnyApi
                        ? 'AI 已为你合成完整剧本，可直接使用或复制到上方编辑器中进一步编辑'
                        : '基于你的设定生成的剧本参考，可以此为蓝本继续创作'}
                    </p>
                  </div>
                  <div className="bg-cyber-dark/60 border border-cyber-purple/20 rounded-xl p-4 max-h-[400px] overflow-y-auto">
                    <pre className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed font-mono">
                      {generatedScript}
                    </pre>
                  </div>
                  {isGenerating && (
                    <div className="flex items-center gap-3 justify-center py-4">
                      <Loader2 className="w-5 h-5 text-cyber-pink animate-spin" />
                      <span className="text-sm text-gray-400">合成中...</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer 操作栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-cyber-purple/20 bg-cyber-dark/50">
          <button
            onClick={() => wizardStep > 0 ? setWizardStep(s => s - 1) : onClose()}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            {wizardStep > 0 ? '上一步' : '退出'}
          </button>

          <div className="flex items-center gap-3">
            {wizardStep === 6 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleUseScript}
                disabled={!generatedScript.trim()}
              >
                <ArrowRight className="w-4 h-4 mr-1" />
                使用此剧本
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleNext}
                disabled={!getCanProceed() || isGenerating}
                isLoading={isGenerating}
              >
                {wizardStep === 4 ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-1" />
                    {isGenerating ? '生成中...' : '生成大纲'}
                  </>
                ) : wizardStep === 5 ? (
                  <>
                    <Wand2 className="w-4 h-4 mr-1" />
                    合成剧本
                  </>
                ) : (
                  <>
                    下一步
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
