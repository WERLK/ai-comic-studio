// 单一版本号来源：直接从 package.json 读取
// Vite 原生支持 JSON 导入，tree-shaking 只保留 version 字段
import pkg from '../../package.json';

export const APP_VERSION = pkg.version;

// 给 main.tsx 的版本检测逻辑用
export const CURRENT_VERSION = pkg.version;
