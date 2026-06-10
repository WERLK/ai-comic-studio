import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Moon,
  Palette,
  Globe,
  Trash2,
  Info,
  Download,
  Upload,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { AppVersion } from '@/components/AppVersion';

interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
}

const SettingsGroup = ({ title, children }: SettingsGroupProps) => (
  <div className="mb-6">
    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-1">{title}</h3>
    <div className="bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 rounded-2xl overflow-hidden">
      {children}
    </div>
  </div>
);

interface SettingItemProps {
  icon?: React.ElementType;
  label: string;
  children: React.ReactNode;
  showDivider?: boolean;
}

const SettingItem = ({ icon: Icon, label, children, showDivider }: SettingItemProps) => (
  <div className={`flex items-center gap-4 p-4 ${showDivider ? 'border-t border-cyber-purple/10' : ''}`}>
    {Icon && (
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-purple to-cyber-pink flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-white" />
      </div>
    )}
    <div className="flex-1">
      <p className="text-white text-sm font-medium">{label}</p>
    </div>
    <div className="flex items-center gap-3">
      {children}
    </div>
  </div>
);

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Toggle = ({ checked, onChange }: ToggleProps) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative w-12 h-7 rounded-full transition-colors ${checked ? 'bg-cyber-purple' : 'bg-gray-600'}`}
  >
    <div
      className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);

interface ColorOptionProps {
  color: string;
  gradient: string;
  selected: boolean;
  onClick: () => void;
}

const ColorOption = ({ color, gradient, selected, onClick }: ColorOptionProps) => (
  <button
    onClick={onClick}
    className={`w-10 h-10 rounded-full transition-all ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-cyber-dark' : 'opacity-70 hover:opacity-100'}`}
    style={{ background: `linear-gradient(135deg, ${gradient})` }}
    title={color}
  />
);

export function Settings() {
  const navigate = useNavigate();
  const { exportUserData, importUserData } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('themeColor') || 'purple';
  });

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'zh';
  });

  const [cacheSize, setCacheSize] = useState<string>('计算中...');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('themeColor', themeColor);
  }, [themeColor]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    const calculateCacheSize = () => {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            total += key.length + value.length;
          }
        }
      }
      if (total < 1024) {
        return `${total} B`;
      } else if (total < 1024 * 1024) {
        return `${(total / 1024).toFixed(2)} KB`;
      } else {
        return `${(total / (1024 * 1024)).toFixed(2)} MB`;
      }
    };
    setCacheSize(calculateCacheSize());
  }, []);

  const flashMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleClearCache = () => {
    if (window.confirm('确定要清理缓存吗？这将清除本地存储的非用户关键数据。')) {
      const userKeys = ['auth_token', 'user', 'theme', 'themeColor', 'language'];
      localStorage.clear();
      userKeys.forEach(key => {
        const value = localStorage.getItem(key);
      });
      flashMessage('缓存已清理');
      setCacheSize('0 B');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const handleExportUser = () => {
    const json = exportUserData();
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_comic_user_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flashMessage('用户数据已导出');
  };

  const handleImportUserClick = () => fileInputRef.current?.click();
  const handleImportUserFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      let content = ev.target?.result as string;
      // Android 某些应用把 UTF-8 JSON 以系统默认编码读取，加上手动 BOM 兜底
      if (content && typeof content === 'string') {
        content = content.replace(/^\uFEFF/, '');
      }
      const ok = importUserData(content);
      flashMessage(ok ? '用户数据导入成功' : '导入失败：请确认使用从本站导出的 JSON 文件');
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const themeColors = [
    { name: 'purple', gradient: '#a855f7, #ec4899' },
    { name: 'blue', gradient: '#3b82f6, #06b6d4' },
    { name: 'pink', gradient: '#ec4899, #f43f5e' },
  ];

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid">
      {/* Header */}
      <header className="h-14 bg-cyber-dark2/80 backdrop-blur-xl border-b border-cyber-purple/20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-medium text-white text-sm md:text-base">设置</h1>
        </div>
        <div className="flex items-center gap-3">
          <AppVersion />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 消息提示 */}
        {message && (
          <div className="mb-4 bg-green-500/20 border border-green-500/30 rounded-2xl p-3">
            <p className="text-green-400 text-sm text-center">{message}</p>
          </div>
        )}

        {/* 外观 */}
        <SettingsGroup title="外观">
          <SettingItem icon={Moon} label="深色模式">
            <Toggle checked={darkMode} onChange={setDarkMode} />
          </SettingItem>
          <SettingItem icon={Palette} label="主题色" showDivider>
            <div className="flex gap-2">
              {themeColors.map((c) => (
                <ColorOption
                  key={c.name}
                  color={c.name}
                  gradient={c.gradient}
                  selected={themeColor === c.name}
                  onClick={() => setThemeColor(c.name)}
                />
              ))}
            </div>
          </SettingItem>
        </SettingsGroup>

        {/* 语言 */}
        <SettingsGroup title="语言">
          <SettingItem icon={Globe} label="界面语言">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-cyber-dark/50 border border-cyber-purple/30 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-cyber-purple/60"
            >
              <option value="zh">简体中文</option>
              <option value="en">English</option>
            </select>
          </SettingItem>
        </SettingsGroup>

        {/* 缓存管理 */}
        <SettingsGroup title="缓存管理">
          <SettingItem icon={Trash2} label="本地存储">
            <span className="text-gray-400 text-sm">{cacheSize}</span>
          </SettingItem>
          <SettingItem icon={Trash2} label="清理缓存" showDivider>
            <button
              onClick={handleClearCache}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 text-xs font-medium rounded-xl transition-colors"
            >
              清理缓存
            </button>
          </SettingItem>
        </SettingsGroup>

        {/* 关于 */}
        <SettingsGroup title="关于">
          <SettingItem icon={Info} label="版本号">
            <span className="text-gray-400 text-sm"><AppVersion /></span>
          </SettingItem>
          <SettingItem icon={Info} label="版权信息" showDivider>
            <span className="text-gray-400 text-sm">© 2024 AI Comic</span>
          </SettingItem>
          <SettingItem icon={Info} label="用户协议" showDivider>
            <button className="text-cyber-blue hover:text-cyber-purple text-sm transition-colors">
              查看详情 →
            </button>
          </SettingItem>
          <SettingItem icon={Info} label="隐私政策" showDivider>
            <button className="text-cyber-blue hover:text-cyber-purple text-sm transition-colors">
              查看详情 →
            </button>
          </SettingItem>
        </SettingsGroup>

        {/* 数据 */}
        <SettingsGroup title="数据">
          <SettingItem icon={Download} label="导出所有数据">
            <button
              onClick={handleExportUser}
              className="px-4 py-2 bg-cyber-blue/15 hover:bg-cyber-blue/25 border border-cyber-blue/40 text-cyber-blue text-xs font-medium rounded-xl transition-colors"
            >
              导出
            </button>
          </SettingItem>
          <SettingItem icon={Upload} label="导入数据" showDivider>
            <button
              onClick={handleImportUserClick}
              className="px-4 py-2 bg-cyber-pink/15 hover:bg-cyber-pink/25 border border-cyber-pink/40 text-cyber-pink text-xs font-medium rounded-xl transition-colors"
            >
              导入
            </button>
            <input ref={fileInputRef} type="file" accept=".json,application/json,application/octet-stream,text/plain" onChange={handleImportUserFile} className="hidden" />
          </SettingItem>
        </SettingsGroup>

        {/* AI 服务 */}
        <SettingsGroup title="AI 服务">
          <SettingItem icon={Sparkles} label="API 配置">
            <button
              onClick={() => navigate('/api-config')}
              className="px-4 py-2 bg-cyber-purple/15 hover:bg-cyber-purple/25 border border-cyber-purple/40 text-cyber-purple text-xs font-medium rounded-xl transition-colors"
            >
              配置 →
            </button>
          </SettingItem>
        </SettingsGroup>
      </div>
    </div>
  );
}
