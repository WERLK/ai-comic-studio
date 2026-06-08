/**
 * 数据库管理模块
 * 统一管理所有本地存储数据
 */

// 所有存储键名
export const STORAGE_KEYS = {
  // 用户认证
  AUTH: 'ai_comic_auth',
  USERS: 'ai_comic_users',
  
  // 项目数据
  PROJECTS: 'manga-studio-projects',
  
  // 抽奖数据
  LUCKY_WHEEL: 'luckyWheelState',
  AD_SPINS: 'lastAdSpins',
  
  // 积分数据
  POINTS_HISTORY: 'points_history',
  
  // 设置
  SETTINGS: 'app_settings',
} as const;

// 数据类型
export interface DatabaseRecord {
  key: string;
  value: any;
  timestamp: number;
  size: number;
}

// 数据库状态
export interface DatabaseStatus {
  totalSize: number;
  recordCount: number;
  lastUpdated: number;
}

/**
 * 获取存储大小（字节）
 */
function getStorageSize(): number {
  let total = 0;
  for (const key of Object.values(STORAGE_KEYS)) {
    const value = localStorage.getItem(key);
    if (value) {
      total += key.length + value.length;
    }
  }
  return total;
}

/**
 * 格式化文件大小
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 获取数据库状态
 */
export function getDatabaseStatus(): DatabaseStatus {
  let recordCount = 0;
  let lastUpdated = 0;
  
  for (const key of Object.values(STORAGE_KEYS)) {
    const value = localStorage.getItem(key);
    if (value) {
      recordCount++;
      try {
        const parsed = JSON.parse(value);
        if (parsed._timestamp && parsed._timestamp > lastUpdated) {
          lastUpdated = parsed._timestamp;
        }
      } catch {
        // ignore
      }
    }
  }
  
  return {
    totalSize: getStorageSize(),
    recordCount,
    lastUpdated,
  };
}

/**
 * 获取所有数据库记录
 */
export function getAllRecords(): DatabaseRecord[] {
  const records: DatabaseRecord[] = [];
  
  for (const [name, key] of Object.entries(STORAGE_KEYS)) {
    const value = localStorage.getItem(key);
    if (value) {
      records.push({
        key: name,
        fullKey: key,
        value: value,
        timestamp: Date.now(),
        size: new Blob([value]).size,
      });
    }
  }
  
  return records;
}

/**
 * 获取单个表的数据
 */
export function getTable(tableName: string): any | null {
  const key = STORAGE_KEYS[tableName as keyof typeof STORAGE_KEYS];
  if (!key) return null;
  
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

/**
 * 保存数据到表
 */
export function saveToTable(tableName: string, data: any): boolean {
  const key = STORAGE_KEYS[tableName as keyof typeof STORAGE_KEYS];
  if (!key) return false;
  
  try {
    const wrappedData = {
      ...data,
      _timestamp: Date.now(),
      _version: '1.0',
    };
    localStorage.setItem(key, JSON.stringify(wrappedData));
    return true;
  } catch (error) {
    console.error(`保存数据到 ${tableName} 失败:`, error);
    return false;
  }
}

/**
 * 清空指定表
 */
export function clearTable(tableName: string): boolean {
  const key = STORAGE_KEYS[tableName as keyof typeof STORAGE_KEYS];
  if (!key) return false;
  
  localStorage.removeItem(key);
  return true;
}

/**
 * 清空所有数据库
 */
export function clearDatabase(): {
  success: boolean;
  clearedCount: number;
  errors: string[];
} {
  const errors: string[] = [];
  let clearedCount = 0;
  
  for (const key of Object.values(STORAGE_KEYS)) {
    try {
      localStorage.removeItem(key);
      clearedCount++;
    } catch (error) {
      errors.push(`清空 ${key} 失败: ${error}`);
    }
  }
  
  return {
    success: errors.length === 0,
    clearedCount,
    errors,
  };
}

/**
 * 导出数据库为 JSON 文件
 */
export function exportDatabase(): {
  success: boolean;
  data: any;
  filename: string;
} {
  const data: Record<string, any> = {};
  
  for (const [name, key] of Object.entries(STORAGE_KEYS)) {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        data[name] = JSON.parse(value);
      } catch {
        data[name] = value;
      }
    }
  }
  
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    appName: 'AI漫剧工作室',
    data,
  };
  
  return {
    success: true,
    data: exportData,
    filename: `ai-comic-backup-${new Date().toISOString().split('T')[0]}.json`,
  };
}

/**
 * 从 JSON 文件导入数据
 */
export function importDatabase(jsonString: string): {
  success: boolean;
  importedCount: number;
  errors: string[];
} {
  const errors: string[] = [];
  let importedCount = 0;
  
  try {
    const importData = JSON.parse(jsonString);
    
    if (!importData.data) {
      return {
        success: false,
        importedCount: 0,
        errors: ['无效的导入文件格式'],
      };
    }
    
    for (const [name, value] of Object.entries(importData.data)) {
      const key = STORAGE_KEYS[name as keyof typeof STORAGE_KEYS];
      if (key) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          importedCount++;
        } catch (error) {
          errors.push(`导入 ${name} 失败: ${error}`);
        }
      }
    }
    
    return {
      success: errors.length === 0,
      importedCount,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      importedCount: 0,
      errors: [`解析导入文件失败: ${error}`],
    };
  }
}

/**
 * 下载文件
 */
export function downloadFile(content: string, filename: string, type: string = 'application/json'): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 上传文件
 */
export function uploadFile(callback: (content: string) => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        callback(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };
  input.click();
}
