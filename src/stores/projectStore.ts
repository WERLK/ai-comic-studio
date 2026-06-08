import { create } from 'zustand';
import type { Project, Frame, GenerationPrompt, Scene, Character } from '@/types';

const STORAGE_KEY = 'manga-studio-projects';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function loadFromStorage(): Project[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage(projects: Project[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  isGenerating: boolean;
  generationProgress: number;
  createProject: (title: string, sourceContent: string, sourceType: 'text' | 'upload') => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (id: string | null) => void;
  getProject: (id: string) => Project | undefined;
  generateManga: (projectId: string, prompt: GenerationPrompt) => Promise<void>;
  simulateGeneration: (projectId: string, prompt: GenerationPrompt) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: loadFromStorage(),
  currentProject: null,
  isGenerating: false,
  generationProgress: 0,

  createProject: (title: string, sourceContent: string, sourceType: 'text' | 'upload') => {
    const newProject: Project = {
      id: generateId(),
      title,
      sourceContent,
      sourceType,
      frames: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...get().projects, newProject];
    set({ projects: updated, currentProject: newProject });
    saveToStorage(updated);
    return newProject;
  },

  updateProject: (id: string, updates: Partial<Project>) => {
    const updated = get().projects.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    set({ projects: updated });
    saveToStorage(updated);
    if (get().currentProject?.id === id) {
      set({ currentProject: updated.find((p) => p.id === id) || null });
    }
  },

  deleteProject: (id: string) => {
    const updated = get().projects.filter((p) => p.id !== id);
    set({ projects: updated });
    saveToStorage(updated);
    if (get().currentProject?.id === id) {
      set({ currentProject: null });
    }
  },

  setCurrentProject: (id: string | null) => {
    if (id === null) {
      set({ currentProject: null });
    } else {
      const project = get().projects.find((p) => p.id === id);
      set({ currentProject: project || null });
    }
  },

  getProject: (id: string) => {
    return get().projects.find((p) => p.id === id);
  },

  generateManga: async (projectId: string, prompt: GenerationPrompt) => {
    set({ isGenerating: true, generationProgress: 0 });
    
    const project = get().getProject(projectId);
    if (!project) return;

    // Update status to generating
    get().updateProject(projectId, { status: 'generating' });

    // Simulate AI generation process
    await get().simulateGeneration(projectId, prompt);
    
    set({ isGenerating: false, generationProgress: 100 });
    get().updateProject(projectId, { status: 'completed' });
  },

  simulateGeneration: async (projectId: string, prompt: GenerationPrompt) => {
    const { storyText, style, characterCount, frameCount } = prompt;
    
    // Generate characters
    const characters: Character[] = [];
    const characterNames = ['小明', '小红', '老师', '神秘人', '机器人', '武士', '魔法师', '侦探'];
    const genders: ('male' | 'female' | 'neutral')[] = ['male', 'female', 'neutral'];
    
    set({ generationProgress: 10 });
    await new Promise((r) => setTimeout(r, 500));

    for (let i = 0; i < characterCount; i++) {
      const gender = genders[i % 3];
      characters.push({
        id: generateId(),
        name: characterNames[i % characterNames.length] + (i >= characterNames.length ? i : ''),
        imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${generateId()}&backgroundColor=${gender === 'male' ? 'b6e3f4' : gender === 'female' ? 'ffdfbf' : 'c0aede'}`,
        gender,
        tags: [style, gender === 'male' ? '男性' : gender === 'female' ? '女性' : '中性'],
      });
    }

    set({ generationProgress: 30 });
    await new Promise((r) => setTimeout(r, 500));

    // Generate scenes
    const scenes = [
      { name: '城市天际线', url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800', tags: ['城市', '夜景'] },
      { name: '樱花校园', url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800', tags: ['校园', '樱花'] },
      { name: '复古街道', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800', tags: ['街道', '日式'] },
      { name: '未来都市', url: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800', tags: ['未来', '科技'] },
      { name: '海边日落', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', tags: ['海边', '日落'] },
      { name: '神秘森林', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800', tags: ['森林', '神秘'] },
    ];

    const selectedScenes = scenes.slice(0, Math.min(frameCount, scenes.length));

    set({ generationProgress: 50 });
    await new Promise((r) => setTimeout(r, 500));

    // Generate story segments from text
    const storySegments = storyText 
      ? storyText.split(/[.!?。！？]/).filter(s => s.trim())
      : [
          '主角开始了他神秘的旅程',
          '遇到了意想不到的挑战',
          '展现出惊人的能力',
          '做出了重要的决定',
          '故事迎来了转折点',
        ];

    // Generate frames
    const frames: Frame[] = [];
    
    for (let i = 0; i < frameCount; i++) {
      const scene = selectedScenes[i % selectedScenes.length];
      const character = characters[i % characters.length];
      
      frames.push({
        id: generateId(),
        sceneImageUrl: scene.url,
        characterIds: character ? [character.id] : [],
        dialogues: storySegments[i % storySegments.length] ? [{
          id: generateId(),
          type: i % 3 === 0 ? 'narration' : 'speech',
          text: storySegments[i % storySegments.length],
          position: { x: 50, y: 60 },
          style: 'bubble',
        }] : [],
        duration: 3000,
        transition: 'fade',
        position: { x: 0, y: 0, width: 100, height: 100 },
      });
    }

    set({ generationProgress: 80 });
    await new Promise((r) => setTimeout(r, 500));

    // Update project with generated content
    get().updateProject(projectId, { 
      frames,
    });

    set({ generationProgress: 100 });
  },
}));
