/**
 * AI 漫剧生成器 - Generator 页面
 * 
 * 核心功能：
 * 1. Canvas 逐帧渲染（带角色/对话/旁白）
 * 2. Web Audio 语音合成
 * 3. MediaRecorder 录制视频
 * 4. 多平台格式导出（抖音/快手/B站）
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, ChevronLeft, ChevronRight, Play, Pause, SkipBack, SkipForward,
  Download, Film, Wand2, Check, Volume2, VolumeX, Users, Image,
  Mic, Share2, Settings, Loader2, Eye, Settings2, Zap
} from 'lucide-react';
import { useProjectStore } from '@/stores';
import { Button } from '@/components/common';
import { generateVideo, getAIConfig } from '@/services/aiService';

// ========== 工具函数 ==========

const PLATFORM_PRESETS = {
  douyin: { label: '抖音', ratio: '9:16', width: 720, height: 1280, icon: '🎵' },
  kuaishou: { label: '快手', ratio: '9:16', width: 720, height: 1280, icon: '🎬' },
  bilibili: { label: 'B站', ratio: '16:9', width: 1920, height: 1080, icon: '📺' },
  xiaohongshu: { label: '小红书', ratio: '3:4', width: 1080, height: 1440, icon: '📕' },
};

type Platform = keyof typeof PLATFORM_PRESETS;

// 获取语音
function getVoiceById(voiceId?: string): { name: string; lang: string } {
  const voices: Record<string, { name: string; lang: string }> = {
    'male-young': { name: '青年男声', lang: 'zh-CN' },
    'male-deep': { name: '低沉男声', lang: 'zh-CN' },
    'female-young': { name: '少女声音', lang: 'zh-CN' },
    'female-sweet': { name: '甜美女声', lang: 'zh-CN' },
    'male-old': { name: '老年男声', lang: 'zh-CN' },
    'narrator': { name: '旁白', lang: 'zh-CN' },
  };
  return voices[voiceId || 'narrator'] || { name: '默认', lang: 'zh-CN' };
}

// 渲染单帧到 Canvas
function renderFrameToCanvas(
  canvas: HTMLCanvasElement,
  frame: { description?: string; dialogue?: string; sceneImageUrl?: string },
  style: string,
  frameIndex: number,
  charData: { name: string; description: string; role: string }[],
  charVoices: Record<string, string>,
  settings: { fontSize: number; transition: string; showCaption: boolean; bgColor: string }
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;
  const styleColors: Record<string, string> = {
    anime: '#ff6b9d',
    manga: '#2d2d2d',
    cyberpunk: '#00f5ff',
    realistic: '#d4a574',
    watercolor: '#7eb8c9',
    chinese: '#c0392b',
  };
  const accentColor = styleColors[style] || '#ff6b9d';

  // 背景
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, width, height);

  // 渐变背景
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0a0a1a');
  gradient.addColorStop(0.5, '#1a1a3a');
  gradient.addColorStop(1, '#0a0a1a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 场景图片
  if (frame.sceneImageUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.drawImage(img, 0, 0, width, height);
    ctx.restore();
  }

  // 顶部装饰条
  const topBar = ctx.createLinearGradient(0, 0, width, 0);
  topBar.addColorStop(0, accentColor);
  topBar.addColorStop(1, 'transparent');
  ctx.fillStyle = topBar;
  ctx.fillRect(0, 0, width, 4);

  // 分镜序号
  ctx.fillStyle = accentColor;
  ctx.font = `bold ${Math.round(width * 0.05)}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(`第${frameIndex + 1}镜`, width * 0.05, height * 0.08);

  // 角色区域（中央）
  const charAreaTop = height * 0.15;
  const charAreaHeight = height * 0.5;

  // 角色占位符（带渐变背景）
  const charGradient = ctx.createLinearGradient(width * 0.2, charAreaTop, width * 0.8, charAreaTop + charAreaHeight);
  charGradient.addColorStop(0, `${accentColor}22`);
  charGradient.addColorStop(0.5, `${accentColor}11`);
  charGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = charGradient;
  ctx.beginPath();
  ctx.roundRect(width * 0.15, charAreaTop, width * 0.7, charAreaHeight, 20);
  ctx.fill();

  // 角色图标（用首字母代替图片）
  const chars = charData.length > 0 ? charData : [{ name: '角色', description: '', role: '' }];
  const charColors = ['#ff6b9d', '#00f5ff', '#ffd700', '#7eb8c9', '#c0392b', '#9b59b6'];
  chars.forEach((char, i) => {
    const x = width * 0.25 + i * (width * 0.2);
    const y = charAreaTop + charAreaHeight * 0.4;
    const r = width * 0.08;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = charColors[i % charColors.length];
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(r * 0.9)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char.name.slice(0, 1), x, y);
    ctx.textBaseline = 'alphabetic';

    // 角色名
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.round(width * 0.03)}px sans-serif`;
    ctx.fillText(char.name, x, y + r + width * 0.03);
  });

  // 对话气泡
  if (frame.dialogue) {
    const bubbleY = height * 0.68;
    const bubbleH = height * 0.12;
    const bubbleW = width * 0.9;
    const bubbleX = width * 0.05;

    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 16);
    ctx.fill();

    ctx.fillStyle = '#1a1a2e';
    ctx.font = `${settings.fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 自动换行
    const maxWidth = bubbleW - 40;
    const lineHeight = settings.fontSize * 1.5;
    const lines = wrapText(ctx, frame.dialogue, maxWidth);
    lines.forEach((line, i) => {
      ctx.fillText(line, width / 2, bubbleY + bubbleH * 0.3 + i * lineHeight);
    });
    ctx.textBaseline = 'alphabetic';
  }

  // 场景描述
  if (settings.showCaption && frame.description) {
    const capY = height * 0.85;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, capY, width, height - capY);

    ctx.fillStyle = '#888';
    ctx.font = `${Math.round(width * 0.028)}px "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(frame.description?.slice(0, 50) + (frame.description && frame.description.length > 50 ? '...' : ''), width / 2, capY + (height - capY) * 0.5);
    ctx.textAlign = 'left';
  }

  // 底部平台标识
  ctx.fillStyle = accentColor;
  ctx.font = `${Math.round(width * 0.025)}px sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('AI漫剧工作室', width - width * 0.03, height - height * 0.02);
  ctx.textAlign = 'left';
}

// 文字换行
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split('');
  const lines: string[] = [];
  let current = '';
  for (const char of words) {
    const test = current + char;
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(current);
      current = char;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3); // 最多3行
}

// 绘制帧到 Canvas（无图片版本，纯文字/图形渲染）
function renderFramePure(
  canvas: HTMLCanvasElement,
  frame: { description?: string; dialogue?: string },
  style: string,
  frameIndex: number,
  totalFrames: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;
  const styleColors: Record<string, string> = {
    anime: '#ff6b9d',
    manga: '#6366f1',
    cyberpunk: '#00f5ff',
    realistic: '#d4a574',
    watercolor: '#7eb8c9',
    chinese: '#c0392b',
  };
  const accent = styleColors[style] || '#ff6b9d';

  // 背景
  ctx.fillStyle = '#080818';
  ctx.fillRect(0, 0, width, height);

  // 霓虹光晕效果
  const glow = ctx.createRadialGradient(width/2, height*0.35, 0, width/2, height*0.35, width*0.6);
  glow.addColorStop(0, `${accent}33`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // 顶部渐变条
  const topGrad = ctx.createLinearGradient(0, 0, width, 0);
  topGrad.addColorStop(0, accent);
  topGrad.addColorStop(0.3, `${accent}88`);
  topGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, 6);

  // 左上角装饰
  ctx.strokeStyle = `${accent}44`;
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, 60, 60);

  // 分镜序号
  ctx.fillStyle = accent;
  ctx.font = `bold ${Math.round(width*0.06)}px "PingFang SC", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(`第${frameIndex + 1}镜`, width*0.05, height*0.1);

  ctx.fillStyle = '#ffffff33';
  ctx.font = `${Math.round(width*0.03)}px sans-serif`;
  ctx.fillText(`共${totalFrames}镜`, width*0.05, height*0.15);

  // 中央内容区背景
  const centerY = height * 0.22;
  const centerH = height * 0.48;
  const centerGrad = ctx.createLinearGradient(0, centerY, 0, centerY + centerH);
  centerGrad.addColorStop(0, `${accent}22`);
  centerGrad.addColorStop(0.5, `${accent}11`);
  centerGrad.addColorStop(1, `${accent}22`);
  ctx.fillStyle = centerGrad;
  ctx.beginPath();
  ctx.roundRect(width*0.08, centerY, width*0.84, centerH, 24);
  ctx.fill();
  ctx.strokeStyle = `${accent}44`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // 对话内容（主体）
  if (frame.dialogue) {
    // 对话气泡
    const bubbleY = centerY + centerH*0.15;
    const bubbleH2 = Math.min(centerH*0.6, 200);
    const bubbleW = width * 0.8;
    const bubbleX = width * 0.1;

    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    ctx.shadowColor = accent;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH2, 20);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 对话内容
    ctx.fillStyle = '#1a1a2e';
    const fs = Math.round(Math.min(width * 0.045, 36));
    ctx.font = `${fs}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';

    const maxW = bubbleW - 60;
    const lines = wrapText(ctx, frame.dialogue, maxW);
    const lineH = fs * 1.8;
    const startY = bubbleY + bubbleH2 * 0.3;
    lines.forEach((line, i) => {
      ctx.fillText(line, width/2, startY + i * lineH);
    });
    ctx.textAlign = 'left';
  } else if (frame.description) {
    // 场景描述
    ctx.fillStyle = '#ffffffbb';
    ctx.font = `${Math.round(width*0.035)}px "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    const maxW = width * 0.75;
    const lines = wrapText(ctx, frame.description, maxW);
    const lineH = Math.round(width*0.04) * 1.6;
    const startY = centerY + centerH * 0.4;
    lines.forEach((line, i) => {
      ctx.fillText(line, width/2, startY + i * lineH);
    });
    ctx.textAlign = 'left';
  }

  // 场景底部描述
  const descY = centerY + centerH + 20;
  if (frame.description) {
    ctx.fillStyle = '#ffffff22';
    ctx.fillRect(width*0.08, descY, width*0.84, 3);

    ctx.fillStyle = '#666';
    ctx.font = `${Math.round(width*0.028)}px "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(frame.description?.slice(0, 40) || '', width/2, descY + 24);
    ctx.textAlign = 'left';
  }

  // 底部渐变
  const bottomGrad = ctx.createLinearGradient(0, height*0.88, 0, height);
  bottomGrad.addColorStop(0, 'transparent');
  bottomGrad.addColorStop(1, '#080818');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, height*0.88, width, height*0.12);

  // 底部标签
  ctx.fillStyle = `${accent}88`;
  ctx.font = `${Math.round(width*0.025)}px sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('AI漫剧工作室', width - width*0.03, height - height*0.03);
  ctx.textAlign = 'left';
}

// ========== 主组件 ==========
export function Generator() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const {
    getProject, generationProgress, generateManga,
    speakDialogue, stopSpeaking, previewVoice,
  } = useProjectStore();

  const [viewMode, setViewMode] = useState<'storyboard' | 'video' | 'comic'>('video');
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportDone, setExportDone] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('douyin');
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiVideoUrl, setAiVideoUrl] = useState<string | null>(null);

  // 导出设置
  const [fps, setFps] = useState(30);
  const [frameDuration, setFrameDuration] = useState(3);
  const [includeVoice, setIncludeVoice] = useState(true);
  const [showCaption, setShowCaption] = useState(true);
  const [fontSize, setFontSize] = useState(28);

  const project = projectId ? getProject(projectId) : null;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationRef = useRef<number | null>(null);
  const playbackTimerRef = useRef<number | null>(null);

  // 加载项目数据
  const charData = projectId ? JSON.parse(localStorage.getItem(`project_chars_${projectId}`) || '[]') : [];
  const charVoices = projectId ? JSON.parse(localStorage.getItem(`project_voices_${projectId}`) || '{}') : {};
  const settings = projectId ? JSON.parse(localStorage.getItem(`project_settings_${projectId}`) || '{}') : {};
  const selectedStyle = settings.selectedStyle || 'anime';
  const aspectRatio = settings.aspectRatio || '9:16';

  // 渲染当前帧到 Canvas
  const renderCurrentFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !project?.frames.length) return;

    const frame = project.frames[currentFrame];
    if (!frame) return;

    const style = frame.style || selectedStyle;
    renderFramePure(canvas, frame, style, currentFrame, project.frames.length);
  }, [currentFrame, project?.frames, selectedStyle]);

  // 播放控制
  useEffect(() => {
    if (isPlaying && project?.frames.length) {
      const frame = project.frames[currentFrame];
      if (!isMuted && frame?.dialogue) {
        const voiceId = charVoices && Object.values(charVoices)[0] as string;
        speakDialogue(frame.dialogue, voiceId);
      }
      const dur = frameDuration * 1000;
      playbackTimerRef.current = window.setTimeout(() => {
        setCurrentFrame(prev => {
          if (prev >= project.frames.length - 1) {
            setIsPlaying(false);
            stopSpeaking();
            return 0;
          }
          return prev + 1;
        });
      }, dur);
    }
    return () => {
      if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
    };
  }, [isPlaying, currentFrame, project?.frames.length, frameDuration, isMuted, speakDialogue, stopSpeaking]);

  // 帧变化时重新渲染
  useEffect(() => {
    renderCurrentFrame();
  }, [renderCurrentFrame]);

  // 自动生成
  useEffect(() => {
    if (project && project.status === 'draft') {
      generateManga(project.id);
    }
  }, [project?.id]);

  // AI视频生成
  const handleAIGenerateVideo = useCallback(async () => {
    if (!project?.frames.length) return;
    
    const aiConfig = getAIConfig();
    const hasVideoConfig = aiConfig.seedanceApiKey || aiConfig.klingApiKey || aiConfig.viduApiKey;
    if (!hasVideoConfig) {
      alert('请先配置视频生成API Key（即梦/可灵/Vidu）');
      return;
    }

    setIsAIGenerating(true);
    setAiVideoUrl(null);

    try {
      const prompts = project.frames.map(f => f.description || f.dialogues.map(d => d.text).join(' ') || '场景画面');
      const result = await generateVideo(prompts, { model: 'auto', style: selectedStyle });
      
      if (result.success && result.videoUrl) {
        setAiVideoUrl(result.videoUrl);
      } else {
        alert(`AI视频生成失败: ${result.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('AI视频生成错误:', error);
      alert('AI视频生成失败，请检查API配置');
    } finally {
      setIsAIGenerating(false);
    }
  }, [project, selectedStyle]);

  // 导出视频
  const handleExportVideo = useCallback(async () => {
    if (!project?.frames.length) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportDone(false);

    const preset = PLATFORM_PRESETS[selectedPlatform];
    const canvas = document.createElement('canvas');
    canvas.width = preset.width;
    canvas.height = preset.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setIsExporting(false); return; }

    const totalFrames = project.frames.length;
    const frames: ImageData[] = [];

    // 预渲染所有帧
    for (let i = 0; i < totalFrames; i++) {
      const frame = project.frames[i];
      renderFramePure(canvas, frame, frame.style || selectedStyle, i, totalFrames);
      frames.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      setExportProgress(Math.round(((i + 1) / totalFrames) * 40));
      await new Promise(r => setTimeout(r, 10));
    }

    // 设置 MediaRecorder
    const stream = canvas.captureStream(fps);
    let audioTrack: MediaStreamTrack | null = null;
    if (includeVoice) {
      // 创建静音音轨（避免浏览器报错）
      const ctx2 = new AudioContext();
      const dest = ctx2.createMediaStreamDestination();
      audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) stream.addTrack(audioTrack);
    }

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5000000 });
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title}_${preset.label}_${preset.ratio.replace(':', 'x')}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 5000);
    };

    recorder.start();

    // 逐帧动画录制
    let frameIdx = 0;
    const msPerFrame = (1000 / fps);

    const recordFrame = () => {
      if (frameIdx >= totalFrames) {
        setExportProgress(95);
        setTimeout(() => recorder.stop(), 300);
        return;
      }
      const frame = project.frames[frameIdx];
      renderFramePure(canvas, frame, frame.style || selectedStyle, frameIdx, totalFrames);
      setExportProgress(40 + Math.round((frameIdx / totalFrames) * 55));

      if (includeVoice && frame.dialogue && frameIdx === 0) {
        // 第一帧播放语音
        const voiceId = charVoices && Object.values(charVoices)[0] as string;
        if (voiceId) speakDialogue(frame.dialogue, voiceId);
      }

      frameIdx++;
      setTimeout(recordFrame, msPerFrame);
    };

    recordFrame();
  }, [project, selectedPlatform, fps, frameDuration, includeVoice, selectedStyle]);

  // 生成封面
  const handleExportCover = useCallback(() => {
    if (!project) return;
    const canvas = document.createElement('canvas');
    const preset = PLATFORM_PRESETS[selectedPlatform];
    canvas.width = preset.width;
    canvas.height = preset.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 封面背景
    ctx.fillStyle = '#080818';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const styleColors: Record<string, string> = {
      anime: '#ff6b9d', manga: '#6366f1', cyberpunk: '#00f5ff',
      realistic: '#d4a574', watercolor: '#7eb8c9', chinese: '#c0392b',
    };
    const accent = styleColors[selectedStyle] || '#ff6b9d';

    // 渐变
    const glow = ctx.createRadialGradient(canvas.width/2, canvas.height*0.4, 0, canvas.width/2, canvas.height*0.4, canvas.width*0.7);
    glow.addColorStop(0, `${accent}44`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 标题
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(canvas.width*0.07)}px "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(project.title, canvas.width/2, canvas.height*0.35);

    // 副标题
    ctx.fillStyle = accent;
    ctx.font = `${Math.round(canvas.width*0.035)}px sans-serif`;
    ctx.fillText('AI漫剧工作室', canvas.width/2, canvas.height*0.45);

    // 分镜数
    ctx.fillStyle = '#888';
    ctx.font = `${Math.round(canvas.width*0.03)}px sans-serif`;
    ctx.fillText(`${project.frames.length}格分镜 · ${PLATFORM_PRESETS[selectedPlatform].label}竖屏`, canvas.width/2, canvas.height*0.55);

    // 底部信息
    const bottomGrad = ctx.createLinearGradient(0, canvas.height*0.8, 0, canvas.height);
    bottomGrad.addColorStop(0, 'transparent');
    bottomGrad.addColorStop(1, `${accent}33`);
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, canvas.height*0.8, canvas.width, canvas.height*0.2);

    ctx.fillStyle = '#666';
    ctx.font = `${Math.round(canvas.width*0.025)}px sans-serif`;
    ctx.fillText('AI Comic Studio · AI漫剧工作室', canvas.width/2, canvas.height - canvas.height*0.05);
    ctx.textAlign = 'left';

    // 下载
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title}_封面_${preset.label}.png`;
    a.click();
  }, [project, selectedPlatform, selectedStyle]);

  if (!project) {
    return (
      <div className="min-h-screen cyber-grid flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyber-purple/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-cyber-purple/40" />
          </div>
          <h2 className="text-xl font-display font-medium text-white mb-2">项目不存在</h2>
          <Button variant="secondary" onClick={() => navigate('/')}>返回首页</Button>
        </div>
      </div>
    );
  }

  const frames = project.frames.length > 0 ? project.frames : Array.from({ length: 6 }, (_, i) => ({
    id: `frame-${i}`,
    description: `第${i + 1}镜场的故事情节和画面描述`,
    dialogue: i % 2 === 0 ? `角色${i + 1}的精彩对话内容` : '',
    sceneImageUrl: '',
    duration: frameDuration,
    dialogues: [],
    characters: [],
  }));

  const preset = PLATFORM_PRESETS[selectedPlatform];

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid">
      {/* Header */}
      <header className="sticky top-0 z-50 h-14 bg-cyber-dark2/95 backdrop-blur-xl border-b border-cyber-purple/20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display font-medium text-white text-sm">{project.title}</h1>
            <p className="text-[10px] text-gray-500">{frames.length}格 · {preset.label} {preset.ratio}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 视图切换 */}
          <div className="hidden sm:flex bg-cyber-dark/50 rounded-lg p-0.5">
            {[
              { key: 'storyboard', label: '分镜', icon: Film },
              { key: 'video', label: '预览', icon: Play },
              { key: 'comic', label: '漫画', icon: Image },
            ].map(v => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key as any)}
                className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-all ${
                  viewMode === v.key ? 'bg-cyber-pink text-white' : 'text-gray-500 hover:text-white'
                }`}
              >
                <v.icon className="w-3 h-3" />
                {v.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowExportPanel(!showExportPanel)}
            className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
              showExportPanel
                ? 'bg-cyber-yellow text-black'
                : 'bg-cyber-yellow/20 text-cyber-yellow hover:bg-cyber-yellow/30'
            }`}
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {isExporting ? `${exportProgress}%` : '导出'}
          </button>
        </div>
      </header>

      {/* 导出面板 */}
      {showExportPanel && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="bg-cyber-dark2/95 border-b border-cyber-purple/20 px-4 py-4"
        >
          <div className="max-w-4xl mx-auto space-y-4">
            {/* 平台选择 */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">发布平台</label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.entries(PLATFORM_PRESETS) as [Platform, typeof preset][]).map(([key, p]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPlatform(key)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedPlatform === key
                        ? 'border-cyber-yellow bg-cyber-yellow/10'
                        : 'border-cyber-purple/20 hover:border-cyber-purple/40'
                    }`}
                  >
                    <div className="text-2xl mb-1">{p.icon}</div>
                    <div className={`text-xs font-medium ${selectedPlatform === key ? 'text-cyber-yellow' : 'text-gray-400'}`}>
                      {p.label}
                    </div>
                    <div className="text-[10px] text-gray-600">{p.ratio}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 参数设置 */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">帧率: {fps}fps</label>
                <input
                  type="range" min="15" max="60" step="5" value={fps}
                  onChange={e => setFps(Number(e.target.value))}
                  className="w-full accent-cyber-yellow"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">单帧时长: {frameDuration}秒</label>
                <input
                  type="range" min="1" max="8" step="0.5" value={frameDuration}
                  onChange={e => setFrameDuration(Number(e.target.value))}
                  className="w-full accent-cyber-yellow"
                />
              </div>
            </div>

            {/* 选项 */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                <input type="checkbox" checked={includeVoice} onChange={e => setIncludeVoice(e.target.checked)} className="accent-cyber-yellow" />
                包含配音
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                <input type="checkbox" checked={showCaption} onChange={e => setShowCaption(e.target.checked)} className="accent-cyber-yellow" />
                显示字幕
              </label>
            </div>

            {/* 进度条 */}
            {isExporting && (
              <div className="space-y-1">
                <div className="h-2 bg-cyber-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyber-yellow to-cyber-pink transition-all"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <p className="text-xs text-center text-gray-500">
                  {exportProgress < 40 ? '渲染帧...' : exportProgress < 95 ? '录制中...' : '生成文件...'}
                </p>
              </div>
            )}

            {/* AI视频生成按钮 */}
            <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyber-yellow" />
                    AI 视频生成
                  </p>
                  <p className="text-xs text-gray-500">使用即梦/可灵/Vidu生成高质量视频</p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleAIGenerateVideo}
                  disabled={isAIGenerating || frames.length === 0}
                  isLoading={isAIGenerating}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  {isAIGenerating ? '生成中...' : 'AI生成'}
                </Button>
              </div>
              {aiVideoUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 bg-cyber-dark/50 rounded-lg"
                >
                  <p className="text-xs text-green-400 mb-2">✓ AI视频生成成功！</p>
                  <video
                    src={aiVideoUrl}
                    controls
                    className="w-full rounded-lg max-h-48"
                    poster=""
                  />
                  <a
                    href={aiVideoUrl}
                    download={`${project?.title}_AI.mp4`}
                    className="mt-2 inline-flex items-center text-xs text-cyber-blue hover:text-cyber-pink transition-colors"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    下载AI生成视频
                  </a>
                </motion.div>
              )}
            </div>

            {/* 导出按钮 */}
            <div className="flex gap-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleExportVideo}
                disabled={isExporting || frames.length === 0}
                isLoading={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? `导出中 ${exportProgress}%` : exportDone ? '✓ 导出完成！' : `导出视频 (${preset.label} ${preset.ratio})`}
              </Button>
              <Button variant="secondary" onClick={handleExportCover} disabled={isExporting}>
                <Image className="w-4 h-4 mr-1" /> 封面
              </Button>
            </div>

            {exportDone && (
              <p className="text-xs text-green-400 text-center">
                ✓ 视频已下载为 .webm 格式（如需 MP4，请用格式工厂转换）
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* 主内容区 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* 左侧：主预览区 */}
          <div className="lg:col-span-3 space-y-4">
            {/* Canvas 预览 */}
            <div className="relative bg-black rounded-2xl overflow-hidden border border-cyber-purple/20">
              <canvas
                ref={canvasRef}
                width={preset.width}
                height={preset.height}
                className="w-full mx-auto"
                style={{ maxHeight: '60vh', objectFit: 'contain' }}
              />

              {/* 播放控制条 */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => { setCurrentFrame(0); setIsPlaying(false); stopSpeaking(); }} className="p-2 text-white/60 hover:text-white">
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 rounded-full bg-cyber-pink flex items-center justify-center text-white shadow-neon hover:scale-105 transition-transform"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <button onClick={() => { setCurrentFrame(frames.length - 1); setIsPlaying(false); stopSpeaking(); }} className="p-2 text-white/60 hover:text-white">
                    <SkipForward className="w-4 h-4" />
                  </button>
                  <div className="flex-1 px-3">
                    <input
                      type="range"
                      min={0}
                      max={frames.length - 1}
                      value={currentFrame}
                      onChange={e => { setCurrentFrame(Number(e.target.value)); setIsPlaying(false); stopSpeaking(); }}
                      className="w-full accent-cyber-pink"
                    />
                  </div>
                  <button onClick={() => setIsMuted(!isMuted)} className="p-2 text-white/60 hover:text-white">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-between text-xs text-white/50 mt-2">
                  <span>第 {currentFrame + 1} 镜</span>
                  <span>{preset.label} {preset.ratio} · {preset.width}×{preset.height}</span>
                  <span>{frames.length} 镜</span>
                </div>
              </div>

              {/* 生成进度 */}
              {generationProgress > 0 && generationProgress < 100 && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-3 text-cyber-pink animate-spin" />
                    <p className="text-white font-medium">生成中...</p>
                    <p className="text-xs text-gray-500 mt-1">{generationProgress}%</p>
                  </div>
                </div>
              )}
            </div>

            {/* 当前帧信息 */}
            <div className="bg-cyber-dark2/60 border border-cyber-purple/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">第 {currentFrame + 1} 镜</h3>
                <span className="text-xs text-gray-500">{frameDuration}s</span>
              </div>
              {frames[currentFrame]?.dialogue && (
                <p className="text-sm text-cyber-yellow/80 italic">💬 {frames[currentFrame].dialogue}</p>
              )}
              {frames[currentFrame]?.description && (
                <p className="text-xs text-gray-500 mt-1">{frames[currentFrame].description}</p>
              )}
            </div>
          </div>

          {/* 右侧：分镜列表 */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-white">📋 分镜列表</h3>
              <span className="text-xs text-gray-500">{frames.length} 格</span>
            </div>

            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
              {frames.map((frame, i) => (
                <button
                  key={frame.id || i}
                  onClick={() => { setCurrentFrame(i); setIsPlaying(false); stopSpeaking(); }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    currentFrame === i
                      ? 'bg-cyber-pink/10 border-cyber-pink/50'
                      : 'bg-cyber-dark2/40 border-cyber-purple/10 hover:border-cyber-purple/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      currentFrame === i ? 'bg-cyber-pink text-white' : 'bg-cyber-purple/20 text-gray-500'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      {frame.dialogue ? (
                        <>
                          <p className="text-xs text-white/80 line-clamp-2">{frame.dialogue}</p>
                          <p className="text-[10px] text-gray-600 mt-1">💬 对话</p>
                        </>
                      ) : frame.description ? (
                        <>
                          <p className="text-xs text-gray-400 line-clamp-2">{frame.description}</p>
                          <p className="text-[10px] text-gray-600 mt-1">🎬 场景</p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-600">空分镜</p>
                      )}
                    </div>
                    {currentFrame === i && (
                      <Play className="w-3.5 h-3.5 text-cyber-pink flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* 角色信息 */}
            {charData.length > 0 && (
              <div className="mt-4 pt-4 border-t border-cyber-purple/10">
                <h4 className="text-xs font-medium text-gray-400 mb-2">👤 角色</h4>
                <div className="flex flex-wrap gap-2">
                  {charData.map((char: any, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 bg-cyber-dark2/40 px-2 py-1 rounded-lg border border-cyber-purple/10">
                      <div className={`w-5 h-5 rounded-full text-[8px] font-bold flex items-center justify-center text-white ${
                        ['bg-pink-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'][i % 5]
                      }`}>
                        {char.name?.slice(0, 1)}
                      </div>
                      <span className="text-xs text-gray-400">{char.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 发布配置 */}
            <div className="mt-4 pt-4 border-t border-cyber-purple/10 space-y-2">
              <h4 className="text-xs font-medium text-gray-400">📤 发布平台</h4>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(PLATFORM_PRESETS) as [Platform, typeof preset][]).map(([key, p]) => (
                  <div
                    key={key}
                    className={`p-2 rounded-lg border text-center ${
                      selectedPlatform === key ? 'border-cyber-yellow/50 bg-cyber-yellow/5' : 'border-cyber-purple/10'
                    }`}
                  >
                    <div className="text-lg">{p.icon}</div>
                    <div className={`text-[10px] ${selectedPlatform === key ? 'text-cyber-yellow' : 'text-gray-500'}`}>{p.label}</div>
                    <div className="text-[9px] text-gray-700">{p.width}×{p.height}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
