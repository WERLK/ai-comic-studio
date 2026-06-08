import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Upload, FileText, Wand2, Film, Trash2, Check, Loader2, Volume2 } from 'lucide-react';
import { useProjectStore, useAuthStore } from '@/stores';
import { Button } from '@/components/common';
import { VoiceSelector } from '@/components/voice/VoiceSelector';
import type { SceneStyle } from '@/types';

const styleOptions = [
  { value: 'anime', label: '日系动漫风格' },
  { value: 'manga', label: '经典漫画风格' },
  { value: 'cyberpunk', label: '赛博朋克风格' },
  { value: 'realistic', label: '写实风格' },
];

const styleKeywords: Record<string, string[]> = {
  anime: ['动漫', '日系', '二次元', '萌', '治愈', '校园', '恋爱', '热血', '冒险', '奇幻', '魔法', '少女', '少年'],
  manga: ['漫画', '黑白', '网点', '分镜', '格斗', '悬疑', '推理', '恐怖', '搞笑', '日常'],
  cyberpunk: ['赛博', '朋克', '未来', '科技', '机械', '霓虹', '黑客', '虚拟', 'AI', '机器人', '都市', '夜'],
  realistic: ['写实', '真实', '照片', '写实主义', '纪录片', '历史', '战争', '现实主义'],
};

interface ParsedContent {
  title: string;
  storyText: string;
  detectedStyle: SceneStyle;
  detectedCharacterCount: number;
  detectedFrameCount: number;
  confidence: number;
}

function detectStyleFromText(text: string): SceneStyle {
  const lowerText = text.toLowerCase();
  let bestStyle: SceneStyle = 'anime';
  let maxScore = 0;

  for (const [style, keywords] of Object.entries(styleKeywords)) {
    const score = keywords.reduce((acc, keyword) => {
      const regex = new RegExp(keyword, 'gi');
      const matches = lowerText.match(regex);
      return acc + (matches ? matches.length : 0);
    }, 0);
    if (score > maxScore) {
      maxScore = score;
      bestStyle = style as SceneStyle;
    }
  }
  return bestStyle;
}

function detectCharacterCount(text: string): number {
  const chineseNamePattern = /[\u4e00-\u9fa5]{2,4}(?:说|道|问|答|喊|叫|想|觉得|认为|看着)/g;
  const names = new Set<string>();
  let match;
  while ((match = chineseNamePattern.exec(text)) !== null) {
    const name = match[0].replace(/(?:说|道|问|答|喊|叫|想|觉得|认为|看着)$/, '');
    if (name.length >= 2 && name.length <= 4) {
      names.add(name);
    }
  }

  const commonNamePattern = /[""']([\u4e00-\u9fa5]{2,4})[""']/g;
  while ((match = commonNamePattern.exec(text)) !== null) {
    names.add(match[1]);
  }

  const andPattern = /([\u4e00-\u9fa5]{2,4})(?:、|和|与|同)([\u4e00-\u9fa5]{2,4})/g;
  while ((match = andPattern.exec(text)) !== null) {
    names.add(match[1]);
    names.add(match[2]);
  }

  const count = names.size;
  if (count >= 5) return 6;
  if (count >= 4) return 5;
  if (count >= 3) return 4;
  if (count >= 2) return 3;
  if (count >= 1) return 2;

  const length = text.length;
  if (length > 2000) return 5;
  if (length > 1000) return 4;
  if (length > 500) return 3;
  return 2;
}

function detectFrameCount(text: string): number {
  const length = text.length;
  const sceneTransitions = (text.match(/(?:场景|画面|镜头|切换|转场|突然|这时|与此同时|接着|然后|后来|之后|不久|过了一会儿)/g) || []).length;

  if (sceneTransitions >= 10 || length > 3000) return 12;
  if (sceneTransitions >= 8 || length > 2000) return 10;
  if (sceneTransitions >= 6 || length > 1500) return 8;
  if (sceneTransitions >= 4 || length > 800) return 6;
  return 4;
}

function extractTitle(text: string): string {
  const firstLine = text.trim().split(/\n/)[0].trim();
  if (firstLine.length >= 2 && firstLine.length <= 30 && !firstLine.includes('。')) {
    return firstLine;
  }
  const quoted = text.match(/[""']([^""']{2,20})[""']/);
  if (quoted) return quoted[1];
  return text.trim().substring(0, 20).replace(/\s+/g, '');
}

function parseStoryContent(text: string): ParsedContent {
  const detectedStyle = detectStyleFromText(text);
  const detectedCharacterCount = detectCharacterCount(text);
  const detectedFrameCount = detectFrameCount(text);
  const title = extractTitle(text);

  return {
    title,
    storyText: text,
    detectedStyle,
    detectedCharacterCount,
    detectedFrameCount,
    confidence: Math.min(0.95, 0.5 + (detectedCharacterCount > 0 ? 0.2 : 0) + (detectedFrameCount > 4 ? 0.15 : 0)),
  };
}

export function Studio() {
  const navigate = useNavigate();
  const { projects, createProject, deleteProject, setCurrentProject } = useProjectStore();
  const { addPoints } = useAuthStore();

  const [inputMode, setInputMode] = useState<'text' | 'upload'>('text');
  const [storyText, setStoryText] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<SceneStyle>('anime');
  const [frameCount, setFrameCount] = useState(6);
  const [characterCount, setCharacterCount] = useState(3);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedContent, setParsedContent] = useState<ParsedContent | null>(null);
  const [showAnalysisResult, setShowAnalysisResult] = useState(false);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [selectedVoices, setSelectedVoices] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyParsedContent = useCallback((parsed: ParsedContent) => {
    setProjectTitle(parsed.title);
    setStoryText(parsed.storyText);
    setSelectedStyle(parsed.detectedStyle);
    setCharacterCount(parsed.detectedCharacterCount);
    setFrameCount(parsed.detectedFrameCount);
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsAnalyzing(true);
    setParsedContent(null);
    setShowAnalysisResult(false);

    try {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPreviewImage(ev.target?.result as string);
          setIsAnalyzing(false);
        };
        reader.readAsDataURL(file);

        const fileName = file.name.replace(/\.[^/.]+$/, '');
        if (fileName.length >= 2) {
          setProjectTitle(fileName);
        }
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const text = await file.text();
        const parsed = parseStoryContent(text);
        setParsedContent(parsed);
        setShowAnalysisResult(true);
        applyParsedContent(parsed);
        setIsAnalyzing(false);
      } else {
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error('文件读取失败:', error);
      setIsAnalyzing(false);
    }
  }, [applyParsedContent]);

  const handleCreateAndGenerate = () => {
    const title = projectTitle.trim() || '新漫剧项目';
    const content = inputMode === 'text' ? storyText : (uploadedFile ? (storyText || '上传素材') : '');
    const project = createProject(title, content, inputMode);
    
    // Store selected voices for this project
    if (selectedVoices.length > 0) {
      localStorage.setItem(`project_voices_${project.id}`, JSON.stringify(selectedVoices));
    }
    
    setCurrentProject(project.id);
    navigate(`/generator/${project.id}`);
  };

  const handleProjectClick = (id: string) => {
    setCurrentProject(id);
    navigate(`/generator/${id}`);
  };

  const clearUpload = () => {
    setUploadedFile(null);
    setPreviewImage(null);
    setParsedContent(null);
    setShowAnalysisResult(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex gap-2">
              <button
                onClick={() => { setInputMode('text'); clearUpload(); }}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                  inputMode === 'text'
                    ? 'bg-cyber-pink text-white shadow-neon'
                    : 'bg-cyber-dark2 text-gray-400 border border-cyber-purple/20 hover:border-cyber-purple/40'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                文字输入
              </button>
              <button
                onClick={() => { setInputMode('upload'); setStoryText(''); }}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                  inputMode === 'upload'
                    ? 'bg-cyber-pink text-white shadow-neon'
                    : 'bg-cyber-dark2 text-gray-400 border border-cyber-purple/20 hover:border-cyber-purple/40'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                上传素材
              </button>
            </div>

            <div className="bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 rounded-2xl p-6">
              {inputMode === 'text' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-cyber-blue mb-2">项目名称</label>
                    <input
                      type="text"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      placeholder="给你的作品起个名字..."
                      className="w-full px-4 py-3 bg-cyber-dark border border-cyber-purple/30 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyber-pink transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cyber-blue mb-2">故事内容</label>
                    <textarea
                      value={storyText}
                      onChange={(e) => setStoryText(e.target.value)}
                      placeholder="在这里输入你的故事... 例如：在一个未来的城市里，年轻的机器人工程师小明发现了一个神秘的能量核心..."
                      rows={8}
                      className="w-full px-4 py-3 bg-cyber-dark border border-cyber-purple/30 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyber-pink transition-colors resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-cyber-blue mb-2">上传素材</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,text/plain,image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-cyber-purple/30 rounded-xl p-8 text-center cursor-pointer hover:border-cyber-pink/50 transition-colors"
                    >
                      {isAnalyzing ? (
                        <div>
                          <Loader2 className="w-10 h-10 mx-auto mb-3 text-cyber-pink animate-spin" />
                          <p className="text-gray-400">正在智能分析文件内容...</p>
                        </div>
                      ) : previewImage ? (
                        <div className="relative">
                          <img src={previewImage} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                          <p className="text-sm text-gray-400 mt-2">{uploadedFile?.name}</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); clearUpload(); }}
                            className="absolute top-2 right-2 p-1 bg-cyber-dark/80 rounded-full text-gray-400 hover:text-cyber-pink"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                          </button>
                        </div>
                      ) : uploadedFile && parsedContent ? (
                        <div>
                          <FileText className="w-10 h-10 mx-auto mb-3 text-cyber-blue" />
                          <p className="text-gray-400 font-medium">{uploadedFile.name}</p>
                          <p className="text-xs text-gray-500 mt-1">已识别内容</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 mx-auto mb-3 text-cyber-purple/50" />
                          <p className="text-gray-400 mb-1">点击上传文件</p>
                          <p className="text-xs text-gray-500">支持 .txt 文本文件、图片</p>
                          <p className="text-xs text-gray-600 mt-1">上传故事文本可自动识别角色和风格</p>
                        </>
                      )}
                    </div>
                  </div>

                  {showAnalysisResult && parsedContent && (
                    <div className="bg-cyber-purple/10 border border-cyber-purple/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Check className="w-4 h-4 text-cyber-blue" />
                        <span className="text-sm font-medium text-white">智能分析结果</span>
                        <span className="text-xs text-gray-500">(置信度: {Math.round(parsedContent.confidence * 100)}%)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-cyber-dark/50 rounded-lg p-2">
                          <span className="text-gray-500 text-xs">检测标题</span>
                          <p className="text-white truncate">{parsedContent.title}</p>
                        </div>
                        <div className="bg-cyber-dark/50 rounded-lg p-2">
                          <span className="text-gray-500 text-xs">推荐风格</span>
                          <p className="text-cyber-blue">{styleOptions.find(s => s.value === parsedContent.detectedStyle)?.label}</p>
                        </div>
                        <div className="bg-cyber-dark/50 rounded-lg p-2">
                          <span className="text-gray-500 text-xs">角色数量</span>
                          <p className="text-cyber-pink">{parsedContent.detectedCharacterCount} 个</p>
                        </div>
                        <div className="bg-cyber-dark/50 rounded-lg p-2">
                          <span className="text-gray-500 text-xs">分镜数量</span>
                          <p className="text-cyber-yellow">{parsedContent.detectedFrameCount} 格</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-cyber-purple/20">
                        <p className="text-xs text-gray-500 mb-2">故事预览:</p>
                        <p className="text-xs text-gray-400 line-clamp-3">{parsedContent.storyText.substring(0, 120)}...</p>
                      </div>
                    </div>
                  )}

                  {!parsedContent && (
                    <div>
                      <label className="block text-sm font-medium text-cyber-blue mb-2">项目名称</label>
                      <input
                        type="text"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        placeholder="给你的作品起个名字..."
                        className="w-full px-4 py-3 bg-cyber-dark border border-cyber-purple/30 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyber-pink transition-colors"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-cyber-purple/20">
                <h3 className="text-sm font-medium text-white mb-4">生成设置</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">画风格式</label>
                    <select
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value as SceneStyle)}
                      className="w-full px-3 py-2 bg-cyber-dark border border-cyber-purple/30 rounded-lg text-white text-sm focus:outline-none focus:border-cyber-pink"
                    >
                      {styleOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">分镜数量</label>
                    <select
                      value={frameCount}
                      onChange={(e) => setFrameCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-cyber-dark border border-cyber-purple/30 rounded-lg text-white text-sm focus:outline-none focus:border-cyber-pink"
                    >
                      {[4, 6, 8, 10, 12].map((n) => (
                        <option key={n} value={n}>{n} 格</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">角色数量</label>
                    <select
                      value={characterCount}
                      onChange={(e) => setCharacterCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-cyber-dark border border-cyber-purple/30 rounded-lg text-white text-sm focus:outline-none focus:border-cyber-pink"
                    >
                      {[2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>{n} 个角色</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Voice Selection */}
                <div className="mt-4">
                  <button
                    onClick={() => setShowVoiceSelector(!showVoiceSelector)}
                    className="w-full py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-cyber-purple/20 to-cyber-pink/20 border border-cyber-purple/30 hover:border-cyber-pink/50 text-white"
                  >
                    <Volume2 className="w-4 h-4" />
                    {showVoiceSelector ? '收起配音设置' : '设置角色配音'}
                    {selectedVoices.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-cyber-pink text-white text-xs rounded-full">
                        {selectedVoices.length}
                      </span>
                    )}
                  </button>
                  
                  {showVoiceSelector && (
                    <div className="mt-4">
                      <VoiceSelector
                        selectedVoices={selectedVoices}
                        onChange={setSelectedVoices}
                        characterCount={characterCount}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full"
              size="lg"
              onClick={handleCreateAndGenerate}
              disabled={
                (inputMode === 'text' && !storyText.trim()) ||
                (inputMode === 'upload' && !uploadedFile)
              }
            >
              <Wand2 className="w-5 h-5 mr-2" />
              一键生成漫剧
            </Button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-semibold text-white">我的项目</h2>
              <span className="text-sm text-gray-500">{projects.length} 个项目</span>
            </div>

            {projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-cyber-dark2/60 backdrop-blur border border-cyber-purple/20 rounded-xl p-4 hover:border-cyber-pink/50 transition-all cursor-pointer"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-cyber-purple/20 flex items-center justify-center flex-shrink-0">
                        {project.status === 'completed' ? (
                          <Film className="w-8 h-8 text-cyber-pink" />
                        ) : project.status === 'generating' ? (
                          <Loader2 className="w-6 h-6 text-cyber-yellow animate-spin" />
                        ) : (
                          <FileText className="w-8 h-8 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{project.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {project.sourceType === 'text' ? '文字输入' : '上传素材'} · {project.frames.length} 格
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded ${
                            project.status === 'completed'
                              ? 'bg-cyber-blue/20 text-cyber-blue'
                              : project.status === 'generating'
                              ? 'bg-cyber-yellow/20 text-cyber-yellow'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {project.status === 'completed' ? '已完成' : project.status === 'generating' ? '生成中' : '草稿'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.id);
                        }}
                        className="p-2 text-gray-500 hover:text-cyber-pink transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-cyber-purple/10 flex items-center justify-center mx-auto mb-4">
                  <Film className="w-8 h-8 text-cyber-purple/40" />
                </div>
                <h3 className="font-medium text-white mb-2">还没有项目</h3>
                <p className="text-sm text-gray-500">输入故事内容，一键生成你的第一部AI漫剧</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
