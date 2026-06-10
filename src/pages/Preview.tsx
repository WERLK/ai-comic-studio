import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Download, 
  Film,
  Image,
  Loader2,
  Check
} from 'lucide-react';
import { useProjectStore, useAuthStore } from '@/stores';
import { Button } from '@/components/common';
import { AppVersion } from '@/components/AppVersion';
import type { ExportFormat, ExportResolution } from '@/types';
import { VIP_LEVELS } from '@/types';

const formatOptions = [
  { value: 'png', label: 'PNG 静态图片', icon: Image },
  { value: 'pdf', label: 'PDF 漫画册', icon: Film },
  { value: 'mp4', label: 'MP4 视频', icon: Film },
  { value: 'gif', label: 'GIF 动画', icon: Film },
];

const resolutionOptions = [
  { value: '720p', label: '720p (HD)' },
  { value: '1080p', label: '1080p (Full HD)' },
  { value: '2k', label: '2K' },
  { value: '4k', label: '4K' },
];

const RESOLUTION_ORDER: ExportResolution[] = ['720p', '1080p', '2k', '4k'];

export function Preview() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { getProject } = useProjectStore();
  const { vipLevel } = useAuthStore();
  const currentVIP = VIP_LEVELS[vipLevel || 0];
  const maxResolution = currentVIP?.maxResolution || '720p';
  const maxResolutionIndex = RESOLUTION_ORDER.indexOf(maxResolution as ExportResolution);
  
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('png');
  const [selectedResolution, setSelectedResolution] = useState<ExportResolution>('720p');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const project = projectId ? getProject(projectId) : null;

  if (!project) {
    return (
      <div className="min-h-screen cyber-grid flex items-center justify-center">
        <div className="text-center">
          <Film className="w-16 h-16 text-cyber-purple/40 mx-auto mb-4" />
          <h2 className="text-xl font-display font-medium text-white mb-2">项目不存在</h2>
          <Button variant="secondary" onClick={() => navigate('/')}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  const handleExport = async () => {
    setIsExporting(true);
    setExportComplete(false);
    
    // Simulate export
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setIsExporting(false);
    setExportComplete(true);
    
    setTimeout(() => setExportComplete(false), 3000);
  };

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid">
      {/* Header */}
      <header className="h-14 bg-cyber-dark2/80 backdrop-blur-xl border-b border-cyber-purple/20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-medium text-white">{project.title} - 导出</h1>
        </div>
        <div className="flex items-center gap-3">
          <AppVersion />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 rounded-2xl p-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber-blue to-cyber-purple flex items-center justify-center">
              <Download className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-white">导出设置</h2>
              <p className="text-gray-500">选择导出格式和分辨率</p>
            </div>
          </div>

          {/* Format Selection */}
          <div className="mb-8">
            <label className="text-sm font-medium text-cyber-blue mb-4 block">导出格式</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formatOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setSelectedFormat(value as ExportFormat)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedFormat === value
                      ? 'border-cyber-pink bg-cyber-pink/10 shadow-neon'
                      : 'border-cyber-purple/20 hover:border-cyber-pink/50'
                  }`}
                >
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${selectedFormat === value ? 'text-cyber-pink' : 'text-gray-500'}`} />
                  <span className={`text-sm ${selectedFormat === value ? 'text-white' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Resolution Selection */}
          <div className="mb-8">
            <label className="text-sm font-medium text-cyber-blue mb-4 block">
              分辨率
              <span className="ml-2 text-xs text-amber-400">
                (当前会员最高支持 {maxResolution})
              </span>
            </label>
            <div className="flex flex-wrap gap-3">
              {resolutionOptions.map(({ value, label }) => {
                const isLocked = RESOLUTION_ORDER.indexOf(value as ExportResolution) > maxResolutionIndex;
                return (
                  <button
                    key={value}
                    disabled={isLocked}
                    onClick={() => !isLocked && setSelectedResolution(value as ExportResolution)}
                    className={`px-6 py-3 rounded-xl border-2 transition-all ${
                      selectedResolution === value
                        ? 'border-cyber-pink bg-cyber-pink/10 text-white'
                        : isLocked
                        ? 'border-gray-700 text-gray-600 cursor-not-allowed opacity-50'
                        : 'border-cyber-purple/20 hover:border-cyber-pink/50 text-gray-400'
                    }`}
                  >
                    {label}
                    {isLocked && <span className="ml-1 text-[10px]">🔒</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export Preview */}
          <div className="p-6 bg-cyber-purple/10 rounded-xl border border-cyber-purple/20 mb-8">
            <h3 className="text-sm font-medium text-white mb-4">导出预览</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">项目名称</span>
                <p className="text-white mt-1">{project.title}</p>
              </div>
              <div>
                <span className="text-gray-500">分镜数量</span>
                <p className="text-white mt-1">{project.frames.length} 格</p>
              </div>
              <div>
                <span className="text-gray-500">导出格式</span>
                <p className="text-white mt-1">{selectedFormat.toUpperCase()}</p>
              </div>
              <div>
                <span className="text-gray-500">分辨率</span>
                <p className="text-white mt-1">{selectedResolution}</p>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <Button
            variant="primary"
            className="w-full"
            size="lg"
            onClick={handleExport}
            disabled={isExporting}
            isLoading={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                导出中...
              </>
            ) : exportComplete ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                导出完成！
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                开始导出 {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center mt-4">
            注意：这是演示模式，实际导出功能需要后端服务支持
          </p>
        </motion.div>

        {/* Manga Preview */}
        {project.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <h3 className="font-display text-lg font-semibold text-white mb-4">漫剧预览</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {project.frames.map((frame, index) => (
                <div
                  key={frame.id}
                  className="relative rounded-lg overflow-hidden border border-cyber-purple/20"
                >
                  <img
                    src={frame.sceneImageUrl}
                    alt={`Frame ${index + 1}`}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-cyber-dark/90">
                    <span className="text-[10px] text-cyber-blue">{index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
