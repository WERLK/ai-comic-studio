import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Upload, FileText, Wand2, Play, Film, Menu, X, ChevronRight } from 'lucide-react';
import { useProjectStore } from '@/stores';
import { Button } from '@/components/common';
import type { SceneStyle } from '@/types';

const styleOptions = [
  { value: 'anime', label: '日系动漫风格' },
  { value: 'manga', label: '经典漫画风格' },
  { value: 'cyberpunk', label: '赛博朋克风格' },
  { value: 'realistic', label: '写实风格' },
];

export function Studio() {
  const navigate = useNavigate();
  const { projects, createProject, deleteProject, setCurrentProject } = useProjectStore();
  
  const [inputMode, setInputMode] = useState<'text' | 'upload'>('text');
  const [storyText, setStoryText] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<SceneStyle>('anime');
  const [frameCount, setFrameCount] = useState(6);
  const [characterCount, setCharacterCount] = useState(3);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateAndGenerate = () => {
    const title = projectTitle.trim() || '新漫剧项目';
    const content = inputMode === 'text' ? storyText : (uploadedFile ? '上传素材' : '');
    const project = createProject(title, content, inputMode);
    setCurrentProject(project.id);
    navigate(`/generator/${project.id}`);
  };

  const handleProjectClick = (id: string) => {
    setCurrentProject(id);
    navigate(`/generator/${id}`);
  };

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-cyber-dark2/90 backdrop-blur-xl border-b border-cyber-purple/20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-white">AI 漫剧</span>
        </div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-400">
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-cyber-dark2/95 backdrop-blur-xl border-b border-cyber-purple/20 p-4"
        >
          <nav className="space-y-2">
            <a href="/" className="block px-4 py-3 rounded-xl bg-cyber-purple/20 text-cyber-pink font-medium">创建新漫剧</a>
            <a href="/projects" className="block px-4 py-3 rounded-xl text-gray-400 hover:bg-cyber-purple/10 hover:text-white transition-colors">我的项目</a>
          </nav>
        </motion.div>
      )}

      <div className="pt-16 lg:pt-0 lg:flex min-h-screen">
        {/* Left Panel - Input */}
        <div className="lg:w-1/2 p-4 md:p-8 lg:p-12 flex flex-col">
          <div className="flex-1 max-w-2xl mx-auto w-full">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden lg:flex items-center gap-3 mb-8"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center shadow-neon">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold neon-text-pink">AI 漫剧生成器</h1>
                <p className="text-gray-500 text-sm">一键创作你的漫画和视频</p>
              </div>
            </motion.div>

            {/* Input Mode Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-2 mb-6"
            >
              <button
                onClick={() => setInputMode('text')}
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
                onClick={() => setInputMode('upload')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                  inputMode === 'upload'
                    ? 'bg-cyber-pink text-white shadow-neon'
                    : 'bg-cyber-dark2 text-gray-400 border border-cyber-purple/20 hover:border-cyber-purple/40'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                上传素材
              </button>
            </motion.div>

            {/* Input Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 rounded-2xl p-6 mb-6"
            >
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
                    <label className="block text-sm font-medium text-cyber-blue mb-2">上传素材</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-cyber-purple/30 rounded-xl p-8 text-center cursor-pointer hover:border-cyber-pink/50 transition-colors"
                    >
                      {previewImage ? (
                        <div className="relative">
                          <img src={previewImage} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                          <p className="text-sm text-gray-400 mt-2">{uploadedFile?.name}</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 mx-auto mb-3 text-cyber-purple/50" />
                          <p className="text-gray-400 mb-1">点击上传图片或视频</p>
                          <p className="text-xs text-gray-500">支持 PNG, JPG, WEBP, MP4 格式</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Generation Settings */}
              <div className="mt-6 pt-6 border-t border-cyber-purple/20">
                <h3 className="text-sm font-medium text-white mb-4">生成设置</h3>
                <div className="grid grid-cols-2 gap-4">
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
              </div>
            </motion.div>

            {/* Generate Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                variant="primary"
                className="w-full"
                size="lg"
                onClick={handleCreateAndGenerate}
                disabled={inputMode === 'text' && !storyText.trim()}
              >
                <Wand2 className="w-5 h-5 mr-2" />
                一键生成漫剧
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Right Panel - Projects List */}
        <div className="lg:w-1/2 p-4 md:p-8 lg:p-12 lg:pl-0 border-t lg:border-t-0 border-cyber-purple/20">
          <div className="max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-semibold text-white">我的项目</h2>
              <span className="text-sm text-gray-500">{projects.length} 个项目</span>
            </div>

            {projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-cyber-dark2/60 backdrop-blur border border-cyber-purple/20 rounded-xl p-4 hover:border-cyber-pink/50 transition-all cursor-pointer"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-lg bg-cyber-purple/20 flex items-center justify-center flex-shrink-0">
                        {project.status === 'completed' ? (
                          <Film className="w-8 h-8 text-cyber-pink" />
                        ) : project.status === 'generating' ? (
                          <div className="w-6 h-6 border-2 border-cyber-pink border-t-transparent rounded-full animate-spin" />
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
                        className="p-2 text-gray-500 hover:text-cyber-pink opacity-0 group-hover:opacity-100 transition-all"
                      >
                        删除
                      </button>
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 rounded-2xl bg-cyber-purple/10 flex items-center justify-center mx-auto mb-4">
                  <Film className="w-10 h-10 text-cyber-purple/40" />
                </div>
                <h3 className="font-medium text-white mb-2">还没有项目</h3>
                <p className="text-sm text-gray-500">输入故事内容，一键生成你的第一部AI漫剧</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
