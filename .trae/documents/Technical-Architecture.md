# AI 漫剧制作应用 - 技术架构文档

## 1. 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                     前端应用层 (React)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  创作工作室   │  │  场景生成器  │  │   分镜编辑器    │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  角色创作台   │  │  预览导出    │  │   状态管理      │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                      数据层 (LocalStorage)               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   项目数据   │  │   角色数据   │  │   场景模板数据   │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    外部服务层 (模拟)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  AI场景生成  │  │  AI角色生成  │  │   AI对话生成     │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 2. 技术选型

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 18.x |
| 语言 | TypeScript | 5.x |
| 构建工具 | Vite | 5.x |
| 样式 | Tailwind CSS | 3.x |
| 状态管理 | Zustand | 4.x |
| 路由 | React Router | 6.x |
| 动画 | Framer Motion | 11.x |
| 画布编辑 | Fabric.js | 6.x |
| 图标 | Lucide React | 最新 |
| 数据请求 | React Query | 5.x |

## 3. 路由定义

| 路由 | 页面 | 功能 |
|------|------|------|
| / | 创作工作室 | 项目列表、新建项目 |
| /editor/:projectId | 分镜编辑器 | 编辑漫画分镜 |
| /scene-generator | 场景生成器 | AI 生成场景 |
| /character-creator | 角色创作台 | AI 创建角色 |
| /preview/:projectId | 预览与导出 | 预览和导出作品 |

## 4. 数据模型

### 4.1 项目 (Project)

```typescript
interface Project {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  frames: Frame[];
  createdAt: string;
  updatedAt: string;
}
```

### 4.2 画格 (Frame)

```typescript
interface Frame {
  id: string;
  sceneId?: string;
  characterIds: string[];
  dialogues: Dialogue[];
  duration: number; // 动态漫剧时长(毫秒)
  transition: 'none' | 'fade' | 'slide' | 'zoom';
  position: { x: number; y: number; width: number; height: number };
}
```

### 4.3 场景 (Scene)

```typescript
interface Scene {
  id: string;
  name: string;
  imageUrl: string;
  style: 'anime' | 'manga' | 'cyberpunk' | 'realistic';
  tags: string[];
}
```

### 4.4 角色 (Character)

```typescript
interface Character {
  id: string;
  name: string;
  imageUrl: string;
  gender: 'male' | 'female' | 'neutral';
  tags: string[];
}
```

### 4.5 对话 (Dialogue)

```typescript
interface Dialogue {
  id: string;
  type: 'speech' | 'thought' | 'narration' | 'shout';
  text: string;
  position: { x: number; y: number };
  style: 'bubble' | 'box' | 'caption';
}
```

## 5. 组件架构

```
src/
├── components/
│   ├── common/          # 通用组件
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── Tooltip/
│   ├── layout/          # 布局组件
│   │   ├── Sidebar/
│   │   ├── Header/
│   │   └── MainContent/
│   ├── studio/          # 创作工作室组件
│   │   ├── ProjectCard/
│   │   ├── ProjectList/
│   │   └── CreateProjectModal/
│   ├── editor/          # 分镜编辑器组件
│   │   ├── Canvas/
│   │   ├── FrameGrid/
│   │   ├── DialogueBubble/
│   │   ├── Timeline/
│   │   └── PropertyPanel/
│   ├── scene/           # 场景生成器组件
│   │   ├── SceneInput/
│   │   ├── ScenePreview/
│   │   └── SceneCard/
│   └── character/       # 角色创作台组件
│       ├── CharacterCard/
│       ├── CharacterInput/
│       └── CharacterGrid/
├── pages/
│   ├── Studio/
│   ├── Editor/
│   ├── SceneGenerator/
│   ├── CharacterCreator/
│   └── Preview/
├── stores/              # Zustand stores
│   ├── projectStore.ts
│   ├── sceneStore.ts
│   └── characterStore.ts
├── hooks/               # 自定义 hooks
├── utils/               # 工具函数
└── types/               # TypeScript 类型
```

## 6. 状态管理设计

### 6.1 ProjectStore

```typescript
interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  createProject: (title: string) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (id: string) => void;
}
```

### 6.2 EditorStore

```typescript
interface EditorStore {
  frames: Frame[];
  selectedFrameId: string | null;
  selectedElementId: string | null;
  zoom: number;
  addFrame: () => void;
  updateFrame: (id: string, updates: Partial<Frame>) => void;
  deleteFrame: (id: string) => void;
  selectFrame: (id: string) => void;
}
```

### 6.3 SceneStore

```typescript
interface SceneStore {
  scenes: Scene[];
  generateScene: (prompt: string, style: string) => Promise<Scene>;
  deleteScene: (id: string) => void;
}
```

### 6.4 CharacterStore

```typescript
interface CharacterStore {
  characters: Character[];
  generateCharacter: (prompt: string, gender: string) => Promise<Character>;
  deleteCharacter: (id: string) => void;
}
```

## 7. 模拟数据

### 7.1 初始场景模板

```typescript
const defaultScenes: Scene[] = [
  { id: '1', name: '城市天际线', imageUrl: '/scenes/city.jpg', style: 'cyberpunk', tags: ['城市', '夜景'] },
  { id: '2', name: '樱花校园', imageUrl: '/scenes/school.jpg', style: 'anime', tags: ['校园', '樱花'] },
  { id: '3', name: '复古街道', imageUrl: '/scenes/street.jpg', style: 'manga', tags: ['街道', '日式'] },
];
```

### 7.2 初始角色模板

```typescript
const defaultCharacters: Character[] = [
  { id: '1', name: '小明', imageUrl: '/characters/boy1.png', gender: 'male', tags: ['少年', '学生'] },
  { id: '2', name: '小红', imageUrl: '/characters/girl1.png', gender: 'female', tags: ['少女', '学生'] },
];
```

## 8. 导出功能设计

### 8.1 导出格式

| 格式 | 用途 | 分辨率选项 |
|------|------|-----------|
| PNG | 静态漫画 | 1080p, 2K, 4K |
| PDF | 漫画册打印 | A4, A5 |
| MP4 | 动态漫剧 | 720p, 1080p |
| GIF | 社交分享 | 480p |

### 8.2 导出流程

```
选择格式 → 设置分辨率 → 生成预览 → 开始导出 → 下载/分享
```
