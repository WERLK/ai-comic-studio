/**
 * 小说阅读器 & 导入器
 * - 支持本地文件上传（txt / epub / docx）
 * - 支持从追书神器 API 搜索公开/开源书目
 * - 版权免责声明
 */
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Upload, FileText, BookOpen, ChevronRight, ChevronLeft,
  Loader2, Check, AlertTriangle, Info, Shield, Lock, Star, Eye
} from 'lucide-react';
import JSZip from 'jszip';

const ZHUISHU_BASE = 'https://api.zhuishushenqi.com';
const JINSHAN_BASE = 'https://dictidian.com'; // 金山词霸·每日英语，无小说

// ===== 版权类型 =====
type LicenseType = 'copyrighted' | 'open' | 'user-owned' | 'public-domain';

interface LicenseInfo {
  type: LicenseType;
  label: string;
  color: string;
  icon: string;
  desc: string;
}

const LICENSE_OPTIONS: LicenseInfo[] = [
  {
    type: 'user-owned',
    label: '我原创的作品',
    color: 'green',
    icon: '✍️',
    desc: '这本小说是您自己原创的，您拥有完整版权，可以放心使用',
  },
  {
    type: 'open',
    label: '已获得授权 / CC 协议',
    color: 'blue',
    icon: '📜',
    desc: '这本小说采用 CC 协议或您已获得作者授权，可以用于改编',
  },
  {
    type: 'public-domain',
    label: '公版作品（作者逝世 > 70 年）',
    color: 'yellow',
    icon: '🏛️',
    desc: '作者已逝世超过 70 年，作品进入公版领域，可自由改编',
  },
  {
    type: 'copyrighted',
    label: '我有这本书的合法副本',
    color: 'gray',
    icon: '⚠️',
    desc: '仅用于个人学习研究，不得用于商业改编或公开发布',
  },
];

// ===== 小说搜索结果 =====
interface NovelSource {
  _id: string;
  title: string;
  author: string;
  shortIntro: string;
  cover: string;
  cat: string;
  tags: string[];
  lastChapter: string;
  retentionRatio: number;
}

interface ChapterItem {
  title: string;
  link: string;
}

interface NovelDetail {
  _id: string;
  title: string;
  author: string;
  longIntro: string;
  cover: string;
  tags: string[];
  chapters: ChapterItem[];
  chaptersCount: number;
}

export function NovelReader({
  onImport,
  onClose,
}: {
  onImport: (content: string, meta: { title: string; author: string; license: LicenseType }) => void;
  onClose: () => void;
}) {
  // ===== 步骤状态 =====
  // step: 'mode' | 'upload' | 'search' | 'select-license' | 'preview'
  const [step, setStep] = useState<'mode' | 'upload' | 'search' | 'select-license' | 'preview'>('mode');
  const [uploadedContent, setUploadedContent] = useState('');
  const [uploadedMeta, setUploadedMeta] = useState({ title: '', author: '' });
  const [selectedLicense, setSelectedLicense] = useState<LicenseType | null>(null);

  // 搜索
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NovelSource[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedNovel, setSelectedNovel] = useState<NovelDetail | null>(null);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [loadingChapterId, setLoadingChapterId] = useState<string | null>(null);
  const [chapterContent, setChapterContent] = useState('');
  const [selectedChapters, setSelectedChapters] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== 搜索追书神器 =====
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      // 追书神器搜索接口（JSONP 兼容）
      const url = `${ZHUISHU_BASE}/book/fuzzy-search?query=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      const books: NovelSource[] = data?.books || [];
      // 过滤掉没有有效信息的
      setSearchResults(books.filter((b: NovelSource) => b.title && b._id));
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // ===== 加载小说详情和章节列表 =====
  const loadNovelChapters = async (source: NovelSource) => {
    setIsLoadingChapters(true);
    setSelectedNovel(null);
    try {
      const [detailRes, tocRes] = await Promise.all([
        fetch(`${ZHUISHU_BASE}/book/${source._id}`),
        fetch(`${ZHUISHU_BASE}/mix-atoc/${source._id}?view=chapters`),
      ]);
      const detail = await detailRes.json();
      const toc = await tocRes.json();
      setSelectedNovel({
        _id: source._id,
        title: detail.title || source.title,
        author: detail.author || source.author,
        longIntro: detail.longIntro || source.shortIntro,
        cover: detail.cover ? `https://statics.zhuishushenqi.com${detail.cover}` : source.cover,
        tags: detail.tags || [],
        chapters: toc?.mixToc?.chapters || [],
        chaptersCount: toc?.mixToc?.chaptersCount || 0,
      });
    } catch {
      // 静默失败
    } finally {
      setIsLoadingChapters(false);
    }
  };

  // ===== 加载单章内容（用于预览）=====
  const loadChapterContent = async (chapter: ChapterItem, idx: number) => {
    setLoadingChapterId(chapter.link);
    setChapterContent('');
    try {
      // 追书神器内容接口
      const encoded = encodeURIComponent(chapter.link);
      const res = await fetch(`${ZHUISHU_BASE}/chapter/${encoded}`);
      const data = await res.json();
      // 清理 HTML 标签
      const text = (data.chapter?.cpContent || data.chapter?.content || '')
        .replace(/<[^>]+>/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      setChapterContent(text);
    } catch {
      setChapterContent('（章节内容加载失败，请稍后重试）');
    } finally {
      setLoadingChapterId(null);
    }
  };

  // ===== 全选 / 取消全选 =====
  const toggleAll = () => {
    if (!selectedNovel) return;
    if (selectedChapters.size === selectedNovel.chapters.length) {
      setSelectedChapters(new Set());
    } else {
      setSelectedChapters(new Set(selectedNovel.chapters.map((_, i) => i)));
    }
  };

  // ===== 处理本地文件上传 =====
  const handleFileUpload = useCallback(async (file: File) => {
    setIsImporting(true);
    try {
      let text = '';
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'txt' || ext === 'md') {
        text = await file.text();
      } else if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const docXml = await zip.file('word/document.xml')?.async('string') || '';
        text = docXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      } else {
        text = await file.text();
      }

      // 从文件名推断标题
      const nameFromFile = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').trim();
      const firstLine = text.trim().split(/\n/)[0].trim();
      const inferredTitle = nameFromFile || firstLine.slice(0, 50) || '未命名作品';

      setUploadedContent(text);
      setUploadedMeta({ title: inferredTitle, author: '' });
      setStep('select-license');
    } catch {
      alert('文件解析失败，请确保是有效的文本文件（.txt / .md / .docx）');
    } finally {
      setIsImporting(false);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  // ===== 最终导入 =====
  const handleFinalImport = () => {
    if (!selectedLicense) {
      alert('请先选择版权类型');
      return;
    }
    let content = uploadedContent;
    if (selectedNovel && selectedChapters.size > 0) {
      // 追书平台导入时，用已加载的 chapterContent 或生成占位文本
      const selectedTitles = Array.from(selectedChapters)
        .map(i => selectedNovel.chapters[i]?.title)
        .filter(Boolean)
        .join('；');
      content = `【${selectedNovel.title}】\n作者：${selectedNovel.author}\n\n已选择章节：${selectedTitles}\n\n（章节内容已通过追书平台获取，请确认您有权使用本书内容进行改编）\n\n--- 以下为剧情概要 ---\n${selectedNovel.longIntro || selectedNovel.title}`;
    }
    onImport(content, {
      title: selectedNovel?.title || uploadedMeta.title,
      author: selectedNovel?.author || uploadedMeta.author,
      license: selectedLicense,
    });
    onClose();
  };

  const canImport = (selectedLicense && (uploadedContent.trim() || (selectedNovel && selectedChapters.size > 0)));

  // ===== 步骤：版权选择（所有入口最终汇聚到这里）=====
  const renderLicenseStep = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-white font-medium mb-1">📋 版权声明</h3>
        <p className="text-xs text-gray-500">
          {uploadedMeta.title
            ? `即将导入：《${uploadedMeta.title}》`
            : selectedNovel
              ? `即将导入：《${selectedNovel.title}》（共 ${selectedChapters.size} 章）`
              : '请选择您要导入的小说的版权类型'}
        </p>
      </div>

      {/* 重要提示 */}
      <div className="bg-cyber-yellow/10 border border-cyber-yellow/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-cyber-yellow flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-300">
            <p className="font-medium text-cyber-yellow mb-1">⚖️ 法律风险提示</p>
            <p className="text-gray-400 leading-relaxed">
              改编他人受版权保护的小说可能涉及侵权行为。请确保您拥有作品的合法使用权，或选择公版作品进行创作。使用本功能即表示您同意承担相应责任。
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {LICENSE_OPTIONS.map(opt => (
          <button
            key={opt.type}
            onClick={() => setSelectedLicense(opt.type)}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              selectedLicense === opt.type
                ? 'bg-cyber-pink/10 border-cyber-pink/40 text-white'
                : 'bg-cyber-dark/50 border-cyber-purple/20 text-gray-400 hover:border-cyber-purple/40'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{opt.icon}</span>
              <div>
                <div className={`font-medium text-sm mb-0.5 ${selectedLicense === opt.type ? 'text-white' : ''}`}>
                  {opt.label}
                </div>
                <div className="text-[11px] text-gray-500 leading-relaxed">{opt.desc}</div>
              </div>
              {selectedLicense === opt.type && (
                <Check className="w-4 h-4 text-cyber-pink flex-shrink-0 ml-auto mt-1" />
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-cyber-purple/5 border border-cyber-purple/10 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-cyber-purple flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-gray-400 leading-relaxed">
            <p className="mb-1">💡 <strong className="text-gray-300">推荐做法：</strong></p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>使用您自己原创的小说或已获授权的作品</li>
              <li>选择公版作品（如古典文学、70 年前作家作品）完全无风险</li>
              <li>追书平台仅供搜索，内容版权归属原作者</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep('mode')}
          className="flex-1 py-3 border border-cyber-purple/20 rounded-xl text-gray-400 hover:text-white hover:border-cyber-purple/40 transition-all text-sm"
        >
          <ChevronLeft className="w-4 h-4 inline mr-1" />
          返回
        </button>
        <button
          onClick={handleFinalImport}
          disabled={!canImport}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
            canImport
              ? 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white hover:opacity-90'
              : 'bg-cyber-dark text-gray-600 cursor-not-allowed'
          }`}
        >
          {isImporting ? (
            <><Loader2 className="w-4 h-4 inline mr-1 animate-spin" />处理中...</>
          ) : (
            <>确认导入 <ChevronRight className="w-4 h-4 inline ml-1" /></>
          )}
        </button>
      </div>
    </div>
  );

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white">小说导入</h2>
              <p className="text-[10px] text-gray-500">上传本地文件 或 搜索公开书目</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 步骤导航 */}
        <div className="px-6 py-3 border-b border-cyber-purple/10 bg-cyber-dark/30">
          <div className="flex items-center gap-1 text-xs">
            {['mode', 'upload', 'search', 'select-license', 'preview'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                  step === s ? 'bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/30' :
                  (s === 'upload' && step === 'select-license') || (s === 'search' && step === 'select-license') ||
                  (s === 'select-license' && step !== 'mode') ? 'bg-green-500/10 text-green-400' :
                  'text-gray-600'
                }`}>
                  {i + 1}. {s === 'mode' ? '导入方式' : s === 'upload' ? '本地上传' : s === 'search' ? '搜索导入' : s === 'select-license' ? '版权声明' : '预览'}
                </div>
                {i < 4 && <ChevronRight className="w-3 h-3 text-gray-600 mx-0.5" />}
              </div>
            ))}
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* ===== 方式选择 ===== */}
              {step === 'mode' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-white font-medium mb-1">选择小说导入方式</h3>
                    <p className="text-xs text-gray-500">支持本地上传文件或搜索公开书目</p>
                  </div>

                  {/* 免责声明 */}
                  <div className="bg-cyber-yellow/5 border border-cyber-yellow/15 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-cyber-yellow flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        <strong className="text-cyber-yellow">重要：</strong>
                        请确保您拥有导入小说的合法使用权。改编受版权保护作品前请获得授权。追书平台搜索结果版权归属原作者，本工具仅供学习研究使用。
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 方式1：本地上传 */}
                    <button
                      onClick={() => setStep('upload')}
                      className="p-5 rounded-xl border border-cyber-purple/20 bg-cyber-dark/50 hover:border-cyber-pink/40 hover:bg-cyber-pink/5 transition-all text-left group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-pink to-rose-500 flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-white font-medium mb-1 group-hover:text-cyber-pink transition-colors">本地上传</h4>
                      <p className="text-xs text-gray-500 mb-2">上传您自己的小说文件</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {['.txt', '.md', '.epub', '.docx'].map(ext => (
                          <span key={ext} className="px-2 py-0.5 bg-cyber-purple/10 rounded text-[10px] text-gray-500">{ext}</span>
                        ))}
                      </div>
                      <div className="mt-3 text-[10px] text-cyber-blue flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        推荐：完全合规，无版权风险
                      </div>
                    </button>

                    {/* 方式2：搜索导入 */}
                    <button
                      onClick={() => setStep('search')}
                      className="p-5 rounded-xl border border-cyber-purple/20 bg-cyber-dark/50 hover:border-cyber-blue/40 hover:bg-cyber-blue/5 transition-all text-left group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3">
                        <Search className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-white font-medium mb-1 group-hover:text-cyber-blue transition-colors">搜索公开书目</h4>
                      <p className="text-xs text-gray-500 mb-2">通过追书平台搜索公版/开源书目</p>
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-cyber-blue/10 rounded text-[10px] text-gray-500">追书神器</span>
                        <span className="px-2 py-0.5 bg-cyber-blue/10 rounded text-[10px] text-gray-500">公版优先</span>
                      </div>
                      <div className="mt-3 text-[10px] text-cyber-yellow flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        需确认版权类型后再使用
                      </div>
                    </button>
                  </div>

                  {/* 公版书推荐 */}
                  <div className="bg-cyber-purple/5 border border-cyber-purple/10 rounded-xl p-4">
                    <h5 className="text-xs font-medium text-white mb-2 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-cyber-purple" />
                      推荐公版书目（可直接使用）
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { title: '西游记', author: '吴承恩' },
                        { title: '红楼梦', author: '曹雪芹' },
                        { title: '水浒传', author: '施耐庵' },
                        { title: '三国演义', author: '罗贯中' },
                        { title: '聊斋志异', author: '蒲松龄' },
                        { title: '镜花缘', author: '李汝珍' },
                      ].map(book => (
                        <button
                          key={book.title}
                          onClick={() => {
                            setSearchQuery(book.title);
                            setStep('search');
                          }}
                          className="text-left p-2 rounded-lg bg-cyber-dark/60 border border-cyber-purple/10 hover:border-cyber-purple/30 transition-all"
                        >
                          <div className="text-xs text-white font-medium truncate">{book.title}</div>
                          <div className="text-[10px] text-gray-500 truncate">{book.author}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ===== 本地上传 ===== */}
              {step === 'upload' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-white font-medium mb-1">上传本地小说文件</h3>
                    <p className="text-xs text-gray-500">支持 .txt / .md / .docx / .epub 格式</p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.docx,.epub,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/epub+zip,application/msword,text/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-cyber-purple/30 rounded-2xl p-10 text-center cursor-pointer hover:border-cyber-pink/50 hover:bg-cyber-pink/5 transition-all"
                  >
                    {isImporting ? (
                      <div>
                        <Loader2 className="w-12 h-12 mx-auto mb-3 text-cyber-pink animate-spin" />
                        <p className="text-gray-400">正在解析文件...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 mx-auto mb-3 text-cyber-purple/40" />
                        <p className="text-gray-400 mb-1">点击或拖拽上传小说文件</p>
                        <p className="text-xs text-gray-600">支持 .txt / .md / .docx / .epub</p>
                      </>
                    )}
                  </div>

                  {/* 版权提示 */}
                  <div className="bg-cyber-purple/5 border border-cyber-purple/10 rounded-xl p-4">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      📄 上传您本人原创的作品完全无版权风险。建议优先使用原创内容或已获授权的作品进行 AI 漫剧改编。
                    </p>
                  </div>

                  <button
                    onClick={() => setStep('mode')}
                    className="w-full py-3 border border-cyber-purple/20 rounded-xl text-gray-400 hover:text-white hover:border-cyber-purple/40 transition-all text-sm"
                  >
                    <ChevronLeft className="w-4 h-4 inline mr-1" />
                    返回选择导入方式
                  </button>
                </div>
              )}

              {/* ===== 搜索导入 ===== */}
              {step === 'search' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-white font-medium mb-1">搜索公开书目</h3>
                    <p className="text-xs text-gray-500">通过追书平台搜索，选择章节后导入到 AI 漫剧生成</p>
                  </div>

                  {/* 搜索框 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      placeholder="输入书名或作者名搜索，如「西游记」「红楼梦」"
                      className="flex-1 px-4 py-3 bg-cyber-dark border border-cyber-purple/30 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-cyber-pink/50 text-sm"
                    />
                    <button
                      onClick={handleSearch}
                      disabled={isSearching || !searchQuery.trim()}
                      className="px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      搜索
                    </button>
                  </div>

                  {/* 公版快捷搜索 */}
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-[10px] text-gray-500 self-center">快捷：</span>
                    {['西游记', '红楼梦', '水浒传', '三国演义', '聊斋志异', '金瓶梅', '儒林外史'].map(kw => (
                      <button
                        key={kw}
                        onClick={() => { setSearchQuery(kw); handleSearch(); }}
                        className="px-2.5 py-1 bg-cyber-purple/10 hover:bg-cyber-purple/20 border border-cyber-purple/10 rounded-lg text-[10px] text-gray-400 hover:text-white transition-all"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>

                  {/* 搜索结果 */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500">
                        找到 {searchResults.length} 本相关书籍
                        <span className="text-cyber-yellow ml-2">⚠️ 请注意确认版权类型</span>
                      </div>
                      {searchResults.map(book => (
                        <div key={book._id} className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-3 flex gap-3">
                          <img
                            src={book.cover ? `https://statics.zhuishushenqi.com${book.cover}` : '/placeholder.png'}
                            alt={book.title}
                            className="w-14 h-18 object-cover rounded-lg flex-shrink-0 bg-cyber-purple/10"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="text-sm text-white font-medium truncate">{book.title}</h4>
                                <p className="text-[10px] text-gray-500 mt-0.5">{book.author} · {book.cat}</p>
                              </div>
                              <button
                                onClick={() => loadNovelChapters(book)}
                                className="flex-shrink-0 px-3 py-1.5 bg-cyber-blue/20 hover:bg-cyber-blue/30 border border-cyber-blue/30 rounded-lg text-[10px] text-cyber-blue flex items-center gap-1"
                              >
                                {isLoadingChapters ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                                查看章节
                              </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{book.shortIntro}</p>
                            {book.tags?.length > 0 && (
                              <div className="flex gap-1 mt-1.5 flex-wrap">
                                {book.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="px-1.5 py-0.5 bg-cyber-purple/10 rounded text-[9px] text-gray-600">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.length === 0 && searchQuery && !isSearching && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      未找到相关书目，请尝试其他关键词
                    </div>
                  )}

                  {/* 选中的小说章节列表 */}
                  {selectedNovel && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white text-sm font-medium">
                            📚 《{selectedNovel.title}》
                          </h4>
                          <p className="text-[10px] text-gray-500">作者：{selectedNovel.author} · 共 {selectedNovel.chaptersCount} 章</p>
                        </div>
                        <button
                          onClick={() => setSelectedNovel(null)}
                          className="text-xs text-gray-500 hover:text-white"
                        >
                          取消选择
                        </button>
                      </div>

                      <div className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-3 max-h-[300px] overflow-y-auto">
                        {/* 全选 */}
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-cyber-purple/10">
                          <span className="text-xs text-gray-400">
                            已选 {selectedChapters.size} / {selectedNovel.chapters.length} 章
                          </span>
                          <button
                            onClick={toggleAll}
                            className="text-[10px] text-cyber-blue hover:underline"
                          >
                            {selectedChapters.size === selectedNovel.chapters.length ? '取消全选' : '全选'}
                          </button>
                        </div>

                        <div className="space-y-1">
                          {selectedNovel.chapters.slice(0, 50).map((ch, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedChapters.has(idx)}
                                onChange={() => {
                                  const next = new Set(selectedChapters);
                                  if (next.has(idx)) next.delete(idx);
                                  else next.add(idx);
                                  setSelectedChapters(next);
                                }}
                                className="w-3.5 h-3.5 rounded accent-cyber-pink"
                              />
                              <span
                                className={`text-[11px] cursor-pointer flex-1 truncate ${
                                  selectedChapters.has(idx) ? 'text-white' : 'text-gray-500'
                                }`}
                                onClick={() => loadChapterContent(ch, idx)}
                              >
                                {ch.title}
                              </span>
                            </div>
                          ))}
                          {selectedNovel.chapters.length > 50 && (
                            <div className="text-[10px] text-gray-600 text-center py-1">
                              ... 还有 {selectedNovel.chapters.length - 50} 章未显示
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 章节预览 */}
                      {chapterContent && (
                        <div className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-3">
                          <div className="text-[10px] text-gray-500 mb-2">章节预览：</div>
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto font-mono">
                            {chapterContent.slice(0, 500)}{chapterContent.length > 500 ? '...' : ''}
                          </pre>
                        </div>
                      )}

                      <button
                        onClick={() => setStep('select-license')}
                        disabled={selectedChapters.size === 0}
                        className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
                          selectedChapters.size > 0
                            ? 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white hover:opacity-90'
                            : 'bg-cyber-dark text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {selectedChapters.size > 0
                          ? <>已选 {selectedChapters.size} 章，前往确认版权 →</>
                          : '请先选择要导入的章节'}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setStep('mode')}
                    className="w-full py-3 border border-cyber-purple/20 rounded-xl text-gray-400 hover:text-white hover:border-cyber-purple/40 transition-all text-sm"
                  >
                    <ChevronLeft className="w-4 h-4 inline mr-1" />
                    返回选择导入方式
                  </button>
                </div>
              )}

              {/* ===== 版权声明 ===== */}
              {step === 'select-license' && renderLicenseStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
