import { useEffect, useState } from 'react';
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
  Video,
  BookOpen,
  Wand2,
  Check,
  Volume2,
  VolumeX,
  Users,
  Image,
  Film,
  User
} from 'lucide-react';
import { useProjectStore } from '@/stores';
import { Button } from '@/components/common';
import { getVoiceById } from '@/data/voiceActors';

export function Generator() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { 
    getProject, 
    generationProgress, 
    generateManga,
    speakDialogue,
    stopSpeaking,
    previewVoice
  } = useProjectStore();
  
  const [viewMode, setViewMode] = useState<'manga' | 'video' | 'storyboard'>('video');
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

  const project = projectId ? getProject(projectId) : null;

  useEffect(() => {
    if (project && project.status === 'draft') {
      handleGenerate();
    }
  }, [project?.id]);

  useEffect(() => {
    let interval: number;
    if (isPlaying && project && project.frames.length > 0) {
      const currentFrameData = project.frames[currentFrame];
      const duration = currentFrameData?.duration || 3000;
      
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
    
    const storedVoices = localStorage.getItem(`project_voices_${project.id}`);
    const selectedVoices = storedVoices ? JSON.parse(storedVoices) : [];
    
    const storedSettings = localStorage.getItem(`project_settings_${project.id}`);
    const settings = storedSettings ? JSON.parse(storedSettings) : {
      selectedStyle: 'anime',
      frameCount: 6,
      characterCount: 3
    };
    
    await generateManga(project.id, {
      storyText: project.sourceContent,
      style: settings.selectedStyle,
      frameCount: settings.frameCount,
      characterCount: settings.characterCount,
      selectedVoices,
    });
  };

  const handlePlay = () => {
    if (currentFrame >= project.frames.length - 1) {
      setCurrentFrame(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleVoicePreview = (voiceId?: string) => {
    if (!voiceId) return;
    if (previewingVoice === voiceId) {
      stopSpeaking();
      setPreviewingVoice(null);
    } else {
      stopSpeaking();
      previewVoice(voiceId);
      setPreviewingVoice(voiceId);
      setTimeout(() => {
        setPreviewingVoice(null);
      }, 3000);
    }
  };

  const currentFrameData = project.frames[currentFrame];
  const charInFrame = currentFrameData ? project.characters.filter(c => currentFrameData.characterIds.includes(c.id)) : [];

  return (
    <div className="min-h-screen bg-cyber-dark">
      <header className="h-14 bg-cyber-dark2/80 backdrop-blur-xl border-b border-cyber-purple/20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-medium text-white text-sm md:text-base">{project.title}</h1>
          {project.status === 'completed' && (
            <span className="text-xs px-2 py-0.5 bg-cyber-blue/20 text-cyber-blue rounded">已完成</span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {project.status === 'completed' && (
            <span className="text-xs text-gray-500 hidden sm:inline">
              {project.characters.length}角色 · {project.frames.length}分镜
            </span>
          )}
        </div>
      </header>

      {project.status === 'generating' || project.status === 'draft' ? (
        <div className="flex-1 flex items-center justify-center py-20">
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
          <div className="p-4 border-b border-cyber-purple/20">
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={() => setViewMode('storyboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  viewMode === 'storyboard'
                    ? 'bg-cyber-pink text-white'
                    : 'bg-cyber-dark2 text-gray-400 hover:text-white'
                }`}
              >
                <Film className="w-4 h-4" />
                故事板
              </button>
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

          <div className="pb-28">
            {viewMode === 'storyboard' ? (
              <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
                {project.characters.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-cyber-pink" />
                      <h2 className="font-display font-semibold text-white">角色一览</h2>
                      <span className="text-xs text-gray-500">({project.characters.length}位)</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {project.characters.map((char) => {
                        const voice = char.voiceId ? getVoiceById(char.voiceId) : null;
                        return (
                          <motion.div
                            key={char.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-cyber-dark2/80 rounded-xl p-3 border border-cyber-purple/20"
                          >
                            <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-cyber-purple/30 to-cyber-pink/20 flex items-center justify-center mb-2 overflow-hidden">
                              {char.imageUrl ? (
                                <img 
                                  src={char.imageUrl} 
                                  alt={char.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <User className="w-8 h-8 text-cyber-purple/50" />
                              )}
                            </div>
                            <h3 className="font-medium text-white text-sm truncate">{char.name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {char.gender === 'male' ? '男' : char.gender === 'female' ? '女' : '中性'}
                            </p>
                            {voice && (
                              <button
                                onClick={() => handleVoicePreview(voice.id)}
                                className={`mt-2 w-full py-1.5 rounded text-xs flex items-center justify-center gap-1 transition-all ${
                                  previewingVoice === voice.id
                                    ? 'bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/50'
                                    : 'bg-cyber-dark text-gray-400 hover:text-white hover:bg-cyber-purple/30'
                                }`}
                              >
                                <Volume2 className="w-3 h-3" />
                                {voice.name}
                              </button>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {project.scenes.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Image className="w-5 h-5 text-cyber-blue" />
                      <h2 className="font-display font-semibold text-white">场景背景</h2>
                      <span className="text-xs text-gray-500">({project.scenes.length}个)</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {project.scenes.map((scene) => (
                        <motion.div
                          key={scene.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative rounded-xl overflow-hidden border border-cyber-purple/20 group"
                        >
                          <img
                            src={scene.imageUrl}
                            alt={scene.name}
                            className="w-full aspect-video object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-cyber-dark/90 via-transparent to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-2">
                            <h3 className="font-medium text-white text-sm truncate">{scene.name}</h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {scene.tags.slice(0, 2).map((tag, idx) => (
                                <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-cyber-purple/30 text-cyber-blue rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {project.frames.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Film className="w-5 h-5 text-cyber-yellow" />
                      <h2 className="font-display font-semibold text-white">分镜脚本</h2>
                      <span className="text-xs text-gray-500">({project.frames.length}格)</span>
                    </div>
                    <div className="space-y-4">
                      {project.frames.map((frame, idx) => {
                        const frameChars = project.characters.filter(c => frame.characterIds.includes(c.id));
                        return (
                          <motion.div
                            key={frame.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-cyber-dark2/60 rounded-xl border border-cyber-purple/20 overflow-hidden"
                          >
                            <div className="flex flex-col md:flex-row">
                              <div className="md:w-1/3 relative">
                                <img
                                  src={frame.sceneImageUrl}
                                  alt={`分镜 ${idx + 1}`}
                                  className="w-full aspect-video md:aspect-auto md:h-full object-cover"
                                />
                                <div className="absolute top-2 left-2 px-2 py-1 bg-cyber-dark/80 backdrop-blur-sm rounded-lg">
                                  <span className="text-xs font-display text-cyber-pink">第 {idx + 1} 格</span>
                                </div>
                              </div>
                              <div className="md:w-2/3 p-4">
                                {frameChars.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mb-3">
                                    {frameChars.map((c) => (
                                      <span key={c.id} className="text-xs px-2 py-1 bg-cyber-pink/20 text-cyber-pink rounded-full">
                                        {c.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="space-y-2">
                                  {frame.dialogues.map((dialogue, dIdx) => (
                                    <div key={dIdx} className={`p-3 rounded-lg ${
                                      dialogue.type === 'narration' 
                                        ? 'bg-cyber-blue/10 border-l-2 border-cyber-blue' 
                                        : dialogue.type === 'thought'
                                        ? 'bg-cyber-purple/10 border-l-2 border-cyber-purple'
                                        : 'bg-cyber-dark/50 border-l-2 border-cyber-pink'
                                    }`}>
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-gray-400">
                                          {dialogue.type === 'narration' ? '旁白' 
                                           : dialogue.type === 'thought' ? '内心独白'
                                           : dialogue.characterName || '角色'}
                                        </span>
                                        {dialogue.voiceId && (
                                          <button
                                            onClick={() => handleVoicePreview(dialogue.voiceId)}
                                            className="text-gray-500 hover:text-cyber-blue transition-colors"
                                          >
                                            <Volume2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                      <p className="text-sm text-white leading-relaxed">{dialogue.text}</p>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                  <span>时长: {Math.round(frame.duration / 100) / 10}秒</span>
                                  <span>·</span>
                                  <span>转场: {frame.transition === 'fade' ? '淡入淡出' : frame.transition === 'slide' ? '滑动' : frame.transition === 'zoom' ? '缩放' : '无'}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {project.sourceContent && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="w-5 h-5 text-gray-400" />
                      <h2 className="font-display font-semibold text-white">原始故事</h2>
                    </div>
                    <div className="bg-cyber-dark2/60 rounded-xl border border-cyber-purple/20 p-4">
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{project.sourceContent}</p>
                    </div>
                  </section>
                )}
              </div>
            ) : viewMode === 'manga' ? (
              <div className="max-w-6xl mx-auto px-4 py-6">
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
              <div className="max-w-5xl mx-auto px-4 py-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFrame}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="relative w-full aspect-video bg-cyber-dark2 rounded-2xl overflow-hidden border border-cyber-purple/30 shadow-2xl"
                  >
                    <img
                      src={currentFrameData?.sceneImageUrl}
                      alt={`Frame ${currentFrame + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    
                    <div className="absolute inset-0 speed-lines pointer-events-none opacity-20" />
                    
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-cyber-dark/80 backdrop-blur-sm rounded-lg">
                      <span className="text-sm font-display text-cyber-pink">
                        {currentFrame + 1} / {project.frames.length}
                      </span>
                    </div>

                    {charInFrame.length > 0 && (
                      <div className="absolute top-4 right-4 flex gap-1">
                        {charInFrame.slice(0, 3).map((c) => (
                          <div key={c.id} className="w-8 h-8 rounded-full bg-cyber-dark/80 border border-cyber-pink/50 flex items-center justify-center text-xs text-cyber-pink">
                            {c.name[0]}
                          </div>
                        ))}
                      </div>
                    )}

                    {currentFrameData?.dialogues[0] && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="absolute bottom-6 left-6 right-6"
                      >
                        {currentFrameData.dialogues[0].type === 'narration' ? (
                          <div className="bg-cyber-dark/85 backdrop-blur-sm px-5 py-3 rounded-xl border border-cyber-blue/30 text-center">
                            <p className="text-sm md:text-base text-cyber-blue italic leading-relaxed">{currentFrameData.dialogues[0].text}</p>
                          </div>
                        ) : (
                          <div className="dialogue-bubble">
                            {currentFrameData.dialogues[0].characterName && (
                              <div className="text-xs text-cyber-pink font-medium mb-2 font-display">
                                {currentFrameData.dialogues[0].characterName}
                              </div>
                            )}
                            <p className="text-sm md:text-base leading-relaxed">{currentFrameData.dialogues[0].text}</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {project.frames[currentFrame]?.dialogues.length > 1 && (
                  <div className="mt-4 space-y-2">
                    {project.frames[currentFrame].dialogues.slice(1).map((d, idx) => (
                      <div key={idx} className="bg-cyber-dark2/60 rounded-xl p-3 border border-cyber-purple/20">
                        <span className="text-xs text-cyber-pink font-medium">{d.characterName || '对话'}</span>
                        <p className="text-sm text-gray-300 mt-1">{d.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {viewMode === 'video' && (
            <div className="fixed bottom-0 left-0 right-0 bg-cyber-dark2/95 backdrop-blur-xl border-t border-cyber-purple/20 px-4 py-3">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 mb-3">
                  {project.frames.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setIsPlaying(false);
                        stopSpeaking();
                        setCurrentFrame(index);
                      }}
                      className={`flex-1 h-1.5 rounded-full transition-all relative ${
                        index === currentFrame 
                          ? 'bg-cyber-pink' 
                          : index < currentFrame
                          ? 'bg-cyber-purple/60'
                          : 'bg-cyber-purple/20 hover:bg-cyber-purple/40'
                      }`}
                    />
                  ))}
                </div>
                
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => { setCurrentFrame(0); setIsPlaying(false); stopSpeaking(); }}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => { setCurrentFrame((prev) => Math.max(0, prev - 1)); setIsPlaying(false); stopSpeaking(); }}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handlePlay}
                    className="p-4 bg-cyber-pink rounded-full text-white hover:shadow-neon transition-all hover:scale-105 active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                  </button>
                  <button
                    onClick={() => { setCurrentFrame((prev) => Math.min(project.frames.length - 1, prev + 1)); setIsPlaying(false); stopSpeaking(); }}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => { setCurrentFrame(project.frames.length - 1); setIsPlaying(false); stopSpeaking(); }}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                  <div className="w-px h-6 bg-cyber-purple/30 mx-2" />
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2 transition-all ${isMuted ? 'text-cyber-pink' : 'text-gray-400 hover:text-white'}`}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>
                
                <p className="text-center text-xs text-gray-500 mt-2">
                  第 {currentFrame + 1} 格 / 共 {project.frames.length} 格
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {project.status === 'completed' && viewMode === 'storyboard' && (
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
