import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Download,
  Image,
  Video,
  BookOpen,
  Wand2,
  Check,
  Loader2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useProjectStore } from '@/stores';
import { Button } from '@/components/common';
import { AppVersion } from '@/components/AppVersion';
import type { SceneStyle } from '@/types';

const styleOptions = [
  { value: 'anime', label: '日系动漫风格' },
  { value: 'manga', label: '经典漫画风格' },
  { value: 'cyberpunk', label: '赛博朋克风格' },
  { value: 'realistic', label: '写实风格' },
];

export function Generator() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { 
    getProject, 
    updateProject, 
    isGenerating, 
    generationProgress, 
    generateManga,
    currentProject,
    speakDialogue,
    stopSpeaking
  } = useProjectStore();
  
  const [viewMode, setViewMode] = useState<'manga' | 'video'>('video');
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<SceneStyle>('anime');
  const [frameCount, setFrameCount] = useState(6);
  const [characterCount, setCharacterCount] = useState(3);
  const [isMuted, setIsMuted] = useState(false);

  const project = projectId ? getProject(projectId) : null;

  useEffect(() => {
    if (project && project.status === 'draft') {
      // Auto start generation when entering page if draft
      handleGenerate();
    }
  }, [project?.id]);

  // Update play effect to use voiceId
  useEffect(() => {
    let interval: number;
    if (isPlaying && project && project.frames.length > 0) {
      const currentFrameData = project.frames[currentFrame];
      const duration = currentFrameData?.duration || 3000;
      
      // Play voiceover if not muted with specific voice
      if (!isMuted && currentFrameData?.dialogues[0]?.text) {
        speakDialogue(currentFrameData.dialogues[0].text, currentFrameData.dialogues[0].voiceId);
      }
      
      interval = window.setInterval(() => {
        setCurrentFrame((prev) => {
          if (prev >= project.frames.length - 1) {
            setIsPlaying(false);
            stopSpeaking();
            return 0;
          }
          return prev + 1;
        });
      }, duration);
    }
    return () => {
      clearInterval(interval);
      stopSpeaking();
    };
  }, [isPlaying, project?.frames.length, currentFrame, isMuted, speakDialogue, stopSpeaking]);

  if (!project) {
    return (
      <div className="min-h-screen cyber-grid flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyber-purple/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-cyber-purple/40" />
          </div>
          <h2 className="text-xl font-display font-medium text-white mb-2">项目不存在</h2>
          <Button variant="secondary" onClick={() => navigate('/')}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!project) return;
    
    // Read selected voices from localStorage
    const storedVoices = localStorage.getItem(`project_voices_${project.id}`);
    const selectedVoices = storedVoices ? JSON.parse(storedVoices) : [];
    
    await generateManga(project.id, {
      storyText: project.sourceContent,
      style: selectedStyle,
      frameCount,
      characterCount,
      selectedVoices,
    });
  };

  const handlePlay = () => {
    if (currentFrame >= project.frames.length - 1) {
      setCurrentFrame(0);
    }
    setIsPlaying(!isPlaying);
  };

  const currentFrameData = project.frames[currentFrame];

  return (
    <div className="min-h-screen bg-cyber-dark">
      {/* Header */}
      <header className="h-14 bg-cyber-dark2/80 backdrop-blur-xl border-b border-cyber-purple/20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-medium text-white">{project.title}</h1>
          {project.status === 'completed' && (
            <span className="text-xs px-2 py-0.5 bg-cyber-blue/20 text-cyber-blue rounded">已完成</span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {project.status === 'completed' && (
            <Button variant="ghost" size="sm" onClick={() => navigate(`/preview/${project.id}`)}>
              <Download className="w-4 h-4 mr-1" />
              导出
            </Button>
          )}
          <AppVersion />
        </div>
      </header>

      {/* Generation Progress / Content */}
      {project.status === 'generating' || project.status === 'draft' ? (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full mx-4 text-center"
          >
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center mx-auto mb-6 shadow-neon">
              <Wand2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold neon-text-pink mb-2">
              AI 正在生成中...
            </h2>
            <p className="text-gray-400 mb-8">
              正在根据您的故事创作漫剧，请稍候
            </p>
            
            {/* Progress bar */}
            <div className="mb-4">
              <div className="h-2 bg-cyber-dark2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${generationProgress}%` }}
                  className="h-full bg-gradient-to-r from-cyber-pink to-cyber-purple"
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">{generationProgress}%</p>
            
            {/* Generation steps */}
            <div className="mt-8 space-y-3 text-left">
              {[
                { step: 1, label: '分析故事内容', progress: 10 },
                { step: 2, label: '生成角色形象', progress: 25 },
                { step: 3, label: '创作场景背景', progress: 45 },
                { step: 4, label: '生成分镜布局', progress: 65 },
                { step: 5, label: '添加对话旁白', progress: 80 },
                { step: 6, label: '生成配音音频', progress: 95 },
              ].map(({ step, label, progress }) => (
                <div key={step} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    generationProgress >= progress
                      ? 'bg-cyber-pink text-white'
                      : 'bg-cyber-dark2 text-gray-500'
                  }`}>
                    {generationProgress >= progress ? <Check className="w-3 h-3" /> : step}
                  </div>
                  <span className={generationProgress >= progress ? 'text-white' : 'text-gray-500'}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      ) : (
        <>
          {/* View Mode Toggle */}
          <div className="p-4 border-b border-cyber-purple/20">
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setViewMode('manga')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  viewMode === 'manga'
                    ? 'bg-cyber-pink text-white'
                    : 'bg-cyber-dark2 text-gray-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                漫画视图
              </button>
              <button
                onClick={() => setViewMode('video')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  viewMode === 'video'
                    ? 'bg-cyber-pink text-white'
                    : 'bg-cyber-dark2 text-gray-400 hover:text-white'
                }`}
              >
                <Video className="w-4 h-4" />
                视频预览
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)]">
            {/* Main Content */}
            <div className="flex-1 p-4 md:p-8 flex items-center justify-center">
              {viewMode === 'manga' ? (
                // Manga View - Grid of frames
                <div className="w-full max-w-4xl">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {project.frames.map((frame, index) => (
                      <motion.div
                        key={frame.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          currentFrame === index
                            ? 'border-cyber-pink shadow-neon'
                            : 'border-cyber-purple/20 hover:border-cyber-pink/50'
                        }`}
                        onClick={() => setCurrentFrame(index)}
                      >
                        <img
                          src={frame.sceneImageUrl}
                          alt={`Frame ${index + 1}`}
                          className="w-full aspect-[4/3] object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-cyber-dark/90 to-transparent">
                          <span className="text-xs text-cyber-blue font-medium">第 {index + 1} 格</span>
                        </div>
                        {frame.dialogues.length > 0 && (
                          <div className="absolute top-2 right-2">
                            <span className="text-[10px] px-1.5 py-0.5 bg-cyber-pink/80 text-white rounded">有对话</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                // Video View - Single frame preview with playback
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFrame}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="relative w-full max-w-3xl aspect-[4/3] bg-cyber-dark2 rounded-2xl overflow-hidden border border-cyber-purple/30"
                  >
                    {/* Scene background */}
                    <img
                      src={currentFrameData?.sceneImageUrl}
                      alt={`Frame ${currentFrame + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    
                    {/* Speed lines */}
                    <div className="absolute inset-0 speed-lines pointer-events-none" />
                    
                    {/* Frame indicator */}
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-cyber-dark/80 backdrop-blur-sm rounded-lg">
                      <span className="text-sm font-display text-cyber-pink">
                        {currentFrame + 1} / {project.frames.length}
                      </span>
                    </div>

                    {/* Dialogue */}
                    {currentFrameData?.dialogues[0] && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-8 left-8 right-8"
                      >
                        {currentFrameData.dialogues[0].type === 'narration' ? (
                          <div className="bg-cyber-dark/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-cyber-blue/30">
                            <p className="text-sm text-cyber-blue italic">{currentFrameData.dialogues[0].text}</p>
                          </div>
                        ) : (
                          <div className="dialogue-bubble">
                            {currentFrameData.dialogues[0].characterName && (
                              <div className="text-xs text-cyber-pink font-medium mb-1">{currentFrameData.dialogues[0].characterName}</div>
                            )}
                            <p className="text-sm">{currentFrameData.dialogues[0].text}</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* Side Panel - Frame Details */}
            {viewMode === 'manga' && (
              <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-cyber-purple/20 p-4 overflow-y-auto">
                <h3 className="font-medium text-white mb-4">第 {currentFrame + 1} 格详情</h3>
                
                {currentFrameData && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-2 block">场景</label>
                      <img
                        src={currentFrameData.sceneImageUrl}
                        alt="Scene"
                        className="w-full aspect-video object-cover rounded-lg"
                      />
                    </div>
                    
                    {currentFrameData.dialogues.length > 0 && (
                      <div>
                        <label className="text-xs text-gray-500 mb-2 block">对话</label>
                        <div className="space-y-2">
                          {currentFrameData.dialogues.map((dialogue, idx) => (
                            <div key={idx} className="p-3 bg-cyber-dark2 rounded-lg">
                              <span className="text-[10px] px-1.5 py-0.5 bg-cyber-purple/30 text-cyber-blue rounded mb-1 inline-block">
                                {dialogue.type === 'narration' ? '旁白' : dialogue.type === 'speech' ? '对话' : dialogue.type === 'thought' ? '心理' : '喊叫'}
                              </span>
                              <p className="text-sm text-white">{dialogue.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Video Playback Controls */}
          {viewMode === 'video' && (
            <div className="h-20 bg-cyber-dark2/80 backdrop-blur-xl border-t border-cyber-purple/20 px-8 flex items-center justify-center gap-6">
              <button
                onClick={() => setCurrentFrame(0)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <SkipBack className="w-6 h-6" />
              </button>
              <button
                onClick={() => setCurrentFrame((prev) => Math.max(0, prev - 1))}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handlePlay}
                className="p-4 bg-cyber-pink rounded-full text-white hover:shadow-neon transition-all"
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </button>
              <button
                onClick={() => setCurrentFrame((prev) => Math.min(project.frames.length - 1, prev + 1))}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <button
                onClick={() => setCurrentFrame(project.frames.length - 1)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <SkipForward className="w-6 h-6" />
              </button>

              {/* Mute Toggle */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 transition-all ${isMuted ? 'text-cyber-pink' : 'text-gray-400 hover:text-white'}`}
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>

              {/* Timeline */}
              <div className="flex items-center gap-2 ml-4">
                {project.frames.map((frame, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsPlaying(false);
                      stopSpeaking();
                      setCurrentFrame(index);
                    }}
                    className={`w-3 h-3 rounded-full transition-all relative ${
                      index === currentFrame 
                        ? 'bg-cyber-pink shadow-neon' 
                        : index < currentFrame
                        ? 'bg-cyber-purple/50'
                        : 'bg-cyber-purple/20 hover:bg-cyber-purple/40'
                    }`}
                  >
                    {frame.dialogues.length > 0 && !isMuted && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2">
                        <Volume2 className="w-3 h-3 text-cyber-blue" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Re-generate button when completed */}
      {project.status === 'completed' && (
        <div className="fixed bottom-4 right-4">
          <Button variant="secondary" onClick={handleGenerate}>
            <Wand2 className="w-4 h-4 mr-2" />
            重新生成
          </Button>
        </div>
      )}
    </div>
  );
}
