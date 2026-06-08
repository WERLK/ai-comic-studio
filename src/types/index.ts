export type SceneStyle = 'anime' | 'manga' | 'cyberpunk' | 'realistic';

export interface Scene {
  id: string;
  name: string;
  imageUrl: string;
  style: SceneStyle;
  tags: string[];
}

export type CharacterGender = 'male' | 'female' | 'neutral';

export interface Character {
  id: string;
  name: string;
  imageUrl: string;
  gender: CharacterGender;
  tags: string[];
}

export type DialogueType = 'speech' | 'thought' | 'narration' | 'shout';
export type DialogueStyle = 'bubble' | 'box' | 'caption';

export interface Dialogue {
  id: string;
  type: DialogueType;
  text: string;
  position: { x: number; y: number };
  style: DialogueStyle;
  audioUrl?: string;
  characterName?: string;
}

export type TransitionType = 'none' | 'fade' | 'slide' | 'zoom';

export interface Frame {
  id: string;
  sceneId?: string;
  sceneImageUrl?: string;
  characterIds: string[];
  dialogues: Dialogue[];
  duration: number;
  transition: TransitionType;
  position: { x: number; y: number; width: number; height: number };
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  sourceContent: string;
  sourceType: 'text' | 'upload';
  frames: Frame[];
  status: 'draft' | 'generating' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface GenerationPrompt {
  storyText?: string;
  style: SceneStyle;
  characterCount: number;
  frameCount: number;
}

export interface GenerationResult {
  scenes: Scene[];
  characters: Character[];
  frames: Frame[];
  dialogues: Dialogue[];
}

export type ExportFormat = 'png' | 'pdf' | 'mp4' | 'gif';
export type ExportResolution = '720p' | '1080p' | '2k' | '4k';
export type ExportQuality = 'low' | 'medium' | 'high';

export interface ExportSettings {
  format: ExportFormat;
  resolution: ExportResolution;
  quality: ExportQuality;
}

export * from './auth';
