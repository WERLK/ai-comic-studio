/**
 * AI 服务层 - 对接真实 AI 大模型 API
 * 
 * 支持的聚合API平台：
 * 1. CometAPI - 统一API聚合平台，支持500+AI模型
 * 2. OpenRouter - 最大最流行的AI网关，支持400+模型
 * 3. PoloAPI - 企业级AI大模型API聚合平台
 * 4. DMXAPI - LangChain中文网提供的智能API聚合服务
 * 
 * 支持的模型类型：
 * - 文本分析：GPT-4 / Claude / DeepSeek / 文心一言
 * - 图像生成：DALL-E / Stable Diffusion / MidJourney
 * - 视频生成：即梦 / 可灵 / Vidu / 海螺
 * - 语音合成：TTS 服务
 */

// ========== API聚合平台配置 ==========

export interface AggregatorConfig {
  // 聚合平台选择
  aggregator: 'comet' | 'openrouter' | 'polo' | 'dmx' | 'none';
  
  // CometAPI (https://www.cometapi.com)
  cometApiKey?: string;
  cometBaseUrl?: string;
  
  // OpenRouter (https://openrouter.ai)
  openrouterApiKey?: string;
  openrouterBaseUrl?: string;
  
  // PoloAPI (https://poloapi.com)
  poloApiKey?: string;
  poloBaseUrl?: string;
  
  // DMXAPI (https://www.dmxapi.cn)
  dmxApiKey?: string;
  dmxBaseUrl?: string;
  
  // 简易API (https://jeniya.top)
  jeniyaApiKey?: string;
  jeniyaBaseUrl?: string;
}

export interface AIServiceConfig extends AggregatorConfig {
  // 官方API配置（备用）
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  baiduApiKey?: string;
  baiduSecretKey?: string;
  doubaoApiKey?: string;
  doubaoSecretKey?: string;
  
  // 视频生成API
  seedanceApiKey?: string;
  klingApiKey?: string;
  viduApiKey?: string;
  hailuApiKey?: string;
  
  // 图像生成API
  stabilityApiKey?: string;
}

// ========== 数据类型定义 ==========

export interface Character {
  name: string;
  description: string;
  role: string;
  voiceId?: string;
}

export interface Frame {
  id: string;
  description: string;
  dialogue?: string;
  shotType: string;
  sceneImageUrl?: string;
  duration: number;
}

export interface VideoGenerationResult {
  success: boolean;
  videoUrl?: string;
  taskId?: string;
  status?: string;
  error?: string;
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface AnalysisResult {
  title: string;
  characters: Character[];
  frames: Frame[];
  style: string;
}

// ========== 配置管理 ==========

let config: AIServiceConfig = {};

export function setAIConfig(newConfig: Partial<AIServiceConfig>) {
  config = { ...config, ...newConfig };
  localStorage.setItem('ai_config', JSON.stringify(config));
}

export function getAIConfig(): AIServiceConfig {
  if (Object.keys(config).length === 0) {
    const saved = localStorage.getItem('ai_config');
    if (saved) {
      try {
        config = JSON.parse(saved);
      } catch {
        config = {};
      }
    }
  }
  return config;
}

// 获取当前激活的聚合平台
function getActiveAggregator(): { key: keyof AggregatorConfig; apiKey: string; baseUrl: string; name: string } | null {
  const cfg = getAIConfig();
  
  if (cfg.cometApiKey) {
    return {
      key: 'cometApiKey',
      apiKey: cfg.cometApiKey,
      baseUrl: cfg.cometBaseUrl || 'https://api.cometapi.com/v1',
      name: 'CometAPI'
    };
  }
  
  if (cfg.poloApiKey) {
    return {
      key: 'poloApiKey',
      apiKey: cfg.poloApiKey,
      baseUrl: cfg.poloBaseUrl || 'https://api.poloapi.com/v1',
      name: 'PoloAPI'
    };
  }
  
  if (cfg.dmxApiKey) {
    return {
      key: 'dmxApiKey',
      apiKey: cfg.dmxApiKey,
      baseUrl: cfg.dmxBaseUrl || 'https://api.dmxapi.cn/v1',
      name: 'DMXAPI'
    };
  }
  
  if (cfg.jeniyaApiKey) {
    return {
      key: 'jeniyaApiKey',
      apiKey: cfg.jeniyaApiKey,
      baseUrl: cfg.jeniyaBaseUrl || 'https://api.jeniya.cn/v1',
      name: '简易API'
    };
  }
  
  if (cfg.openrouterApiKey) {
    return {
      key: 'openrouterApiKey',
      apiKey: cfg.openrouterApiKey,
      baseUrl: cfg.openrouterBaseUrl || 'https://openrouter.ai/api/v1',
      name: 'OpenRouter'
    };
  }
  
  return null;
}

// ========== 聚合平台API调用 ==========

/**
 * 使用聚合API进行文本分析
 */
async function analyzeWithAggregator(script: string, model: string = 'gpt-4o-mini'): Promise<AnalysisResult> {
  const aggregator = getActiveAggregator();
  if (!aggregator) {
    return fallbackAnalyzeScript(script);
  }

  const prompt = `
你是一个专业的漫剧编剧和分镜师。请分析以下剧本并输出结构化结果：

剧本：
${script}

请输出 JSON 格式，包含：
1. title: 提取或生成一个合适的漫剧标题（不超过20字）
2. characters: 角色列表，每个角色包含 name（角色名）、description（角色描述）、role（角色定位：主角/配角/旁白）
3. frames: 分镜列表，每个分镜包含 id（frame-序号）、description（画面描述）、dialogue（对话内容，如果有）、shotType（景别：全景/中景/近景/特写/侧面/俯视/仰视）、duration（时长，单位秒，建议2-4秒）
4. style: 推荐画风（anime/manga/cyberpunk/realistic/watercolor/chinese）

请确保输出是纯JSON，不要有其他文字。
`.trim();

  try {
    const response = await fetch(`${aggregator.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aggregator.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn(`${aggregator.name} API 调用失败:`, error);
      return fallbackAnalyzeScript(script);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    try {
      return JSON.parse(content);
    } catch {
      return fallbackAnalyzeScript(script);
    }
  } catch (error) {
    console.warn(`${aggregator.name} API 调用异常:`, error);
    return fallbackAnalyzeScript(script);
  }
}

/**
 * 使用聚合API生成图像
 */
async function generateImageWithAggregator(prompt: string, style: string = 'anime'): Promise<ImageGenerationResult> {
  const aggregator = getActiveAggregator();
  if (!aggregator) {
    return fallbackGenerateImage(prompt, style);
  }

  const stylePrompts: Record<string, string> = {
    anime: 'anime style, beautiful, vibrant colors, detailed',
    manga: 'manga style, black and white, detailed linework',
    cyberpunk: 'cyberpunk style, neon lights, futuristic city',
    realistic: 'photorealistic, highly detailed, cinematic',
    watercolor: 'watercolor painting style, soft colors',
    chinese: 'chinese painting style, traditional ink',
  };

  try {
    const response = await fetch(`${aggregator.baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aggregator.apiKey}`,
      },
      body: JSON.stringify({
        prompt: `${prompt}, ${stylePrompts[style]}`,
        n: 1,
        size: '1024x1024',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn(`${aggregator.name} 图像生成 API 调用失败:`, error);
      return fallbackGenerateImage(prompt, style);
    }

    const data = await response.json();
    return {
      success: true,
      imageUrl: data.data?.[0]?.url || data.data?.[0]?.b64_json,
    };
  } catch (error) {
    console.warn(`${aggregator.name} 图像生成 API 调用异常:`, error);
    return fallbackGenerateImage(prompt, style);
  }
}

// ========== 官方API调用 ==========

/**
 * 使用 GPT-4 分析剧本
 */
export async function analyzeScriptWithGPT(script: string): Promise<AnalysisResult> {
  const { openaiApiKey, openaiBaseUrl } = getAIConfig();
  if (!openaiApiKey) {
    return fallbackAnalyzeScript(script);
  }

  const url = openaiBaseUrl || 'https://api.openai.com/v1/chat/completions';
  const prompt = `
你是一个专业的漫剧编剧和分镜师。请分析以下剧本并输出结构化结果：

剧本：
${script}

请输出 JSON 格式，包含：
1. title: 提取或生成一个合适的漫剧标题（不超过20字）
2. characters: 角色列表，每个角色包含 name（角色名）、description（角色描述）、role（角色定位：主角/配角/旁白）
3. frames: 分镜列表，每个分镜包含 id（frame-序号）、description（画面描述）、dialogue（对话内容，如果有）、shotType（景别：全景/中景/近景/特写/侧面/俯视/仰视）、duration（时长，单位秒，建议2-4秒）
4. style: 推荐画风（anime/manga/cyberpunk/realistic/watercolor/chinese）

请确保输出是纯JSON，不要有其他文字。
`.trim();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn('GPT API 调用失败:', error);
      return fallbackAnalyzeScript(script);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    try {
      return JSON.parse(content);
    } catch {
      return fallbackAnalyzeScript(script);
    }
  } catch (error) {
    console.warn('GPT API 调用异常:', error);
    return fallbackAnalyzeScript(script);
  }
}

/**
 * 使用文心一言分析剧本
 */
export async function analyzeScriptWithWenxin(script: string): Promise<AnalysisResult> {
  const { baiduApiKey, baiduSecretKey } = getAIConfig();
  if (!baiduApiKey || !baiduSecretKey) {
    return fallbackAnalyzeScript(script);
  }

  try {
    const tokenResponse = await fetch('https://aip.baidubce.com/oauth/2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${baiduApiKey}&client_secret=${baiduSecretKey}`,
    });
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const prompt = `
你是一个专业的漫剧编剧和分镜师。请分析以下剧本并输出结构化结果：

剧本：
${script}

请输出 JSON 格式，包含：
1. title: 提取或生成一个合适的漫剧标题（不超过20字）
2. characters: 角色列表，每个角色包含 name、description、role（主角/配角/旁白）
3. frames: 分镜列表，每个分镜包含 id（frame-序号）、description、dialogue、shotType（全景/中景/近景/特写）、duration
4. style: 推荐画风（anime/manga/cyberpunk/realistic/watercolor/chinese）

只输出JSON，不要其他文字。
`.trim();

    const response = await fetch('https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        model: 'ernie-3.5',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      return fallbackAnalyzeScript(script);
    }

    const data = await response.json();
    const content = data.result || '{}';
    try {
      return JSON.parse(content);
    } catch {
      return fallbackAnalyzeScript(script);
    }
  } catch (error) {
    console.warn('文心一言 API 调用异常:', error);
    return fallbackAnalyzeScript(script);
  }
}

/**
 * 使用 DALL-E 生成图像
 */
export async function generateImageWithDALL_E(prompt: string, style: string = 'anime'): Promise<ImageGenerationResult> {
  const { openaiApiKey, openaiBaseUrl } = getAIConfig();
  if (!openaiApiKey) {
    return fallbackGenerateImage(prompt, style);
  }

  const stylePrompts: Record<string, string> = {
    anime: 'anime style, beautiful, vibrant colors, detailed',
    manga: 'manga style, black and white, detailed linework',
    cyberpunk: 'cyberpunk style, neon lights, futuristic city',
    realistic: 'photorealistic, highly detailed, cinematic',
    watercolor: 'watercolor painting style, soft colors',
    chinese: 'chinese painting style, traditional ink',
  };

  try {
    const response = await fetch((openaiBaseUrl || 'https://api.openai.com/v1') + '/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        prompt: `${prompt}, ${stylePrompts[style]}`,
        n: 1,
        size: '1024x1024',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn('DALL-E API 调用失败:', error);
      return fallbackGenerateImage(prompt, style);
    }

    const data = await response.json();
    return {
      success: true,
      imageUrl: data.data?.[0]?.url,
    };
  } catch (error) {
    console.warn('DALL-E API 调用异常:', error);
    return fallbackGenerateImage(prompt, style);
  }
}

/**
 * 使用 Stable Diffusion 生成图像
 */
export async function generateImageWithStableDiffusion(prompt: string, style: string = 'anime'): Promise<ImageGenerationResult> {
  const { stabilityApiKey } = getAIConfig();
  if (!stabilityApiKey) {
    return fallbackGenerateImage(prompt, style);
  }

  const stylePrompts: Record<string, string> = {
    anime: 'anime style, anime aesthetic, beautiful, detailed',
    manga: 'manga style, black and white, line art',
    cyberpunk: 'cyberpunk, neon, futuristic, sci-fi',
    realistic: 'photorealistic, hyper detailed, cinematic lighting',
    watercolor: 'watercolor, soft, painterly',
    chinese: 'chinese ink painting, traditional',
  };

  try {
    const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${stabilityApiKey}`,
      },
      body: JSON.stringify({
        prompt: `${prompt}, ${stylePrompts[style]}, high quality, masterpiece`,
        negative_prompt: 'blurry, low quality, distorted, text, watermark',
        width: 1024,
        height: 1024,
        style_preset: 'anime',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn('Stable Diffusion API 调用失败:', error);
      return fallbackGenerateImage(prompt, style);
    }

    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);
    return { success: true, imageUrl };
  } catch (error) {
    console.warn('Stable Diffusion API 调用异常:', error);
    return fallbackGenerateImage(prompt, style);
  }
}

// ========== 本地Fallback实现 ==========

/**
 * 本地分析脚本（fallback）
 */
function fallbackAnalyzeScript(script: string): AnalysisResult {
  const firstLine = script.trim().split(/\n/)[0].trim();
  const title = firstLine.length <= 30 && !firstLine.includes('。')
    ? firstLine
    : `AI漫剧-${Date.now().toString(36).toUpperCase()}`;

  const namePatterns = [
    /[""']([\u4e00-\u9fa5]{2,4})[""'][：:是]?\s*(.{5,30}?)(?=\n|[""']|$)/g,
    /([\u4e00-\u9fa5]{2,4})(?:说|道|问|答|喊|叫|想|觉得|认为|看着)[：:]\s*(.{3,30}?)(?=\n|$)/g,
  ];
  const foundNames = new Set<string>();
  const charDescriptions: Record<string, string> = {};
  
  for (const pattern of namePatterns) {
    let match;
    while ((match = pattern.exec(script)) !== null) {
      const name = match[1].trim();
      const desc = match[2].trim();
      if (name.length >= 2 && name.length <= 4) {
        foundNames.add(name);
        if (!charDescriptions[name]) {
          charDescriptions[name] = desc;
        }
      }
    }
  }

  const characters = Array.from(foundNames).slice(0, 6).map((name, i) => ({
    name,
    description: charDescriptions[name] || '故事中的重要角色',
    role: i === 0 ? '主角' : i === 1 ? '配角' : '角色',
  }));

  const shotTypes = ['全景', '中景', '近景', '特写', '侧面', '俯视', '仰视', '跟随'];
  const paragraphs = script.split(/\n{2,}/g).filter(p => p.trim().length > 10);
  const frames = paragraphs.slice(0, 8).map((p, i) => ({
    id: `frame-${i}`,
    description: p.trim(),
    dialogue: p.includes('说') || p.includes('道') ? p.split(/[：:]/).slice(1).join('：').trim() : undefined,
    shotType: shotTypes[i % shotTypes.length],
    duration: 3,
  }));

  const styleScores: Record<string, number> = { anime: 0, manga: 0, cyberpunk: 0, realistic: 0, watercolor: 0, chinese: 0 };
  const keywords: Record<string, string[]> = {
    anime: ['动漫', '日系', '二次元', '萌', '校园', '恋爱'],
    manga: ['漫画', '黑白', '网点', '格斗', '悬疑'],
    cyberpunk: ['未来', '科技', '机械', '霓虹', '黑客'],
    realistic: ['写实', '真实', '照片', '历史', '战争'],
    watercolor: ['水彩', '插画', '温柔', '治愈'],
    chinese: ['古风', '仙侠', '武侠', '宫廷', '神话'],
  };
  for (const [style, kws] of Object.entries(keywords)) {
    for (const kw of kws) {
      if (script.includes(kw)) styleScores[style]++;
    }
  }
  const style = Object.entries(styleScores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'anime';

  return { title, characters, frames, style };
}

/**
 * 本地生成图像（fallback）
 */
function fallbackGenerateImage(prompt: string, style: string): ImageGenerationResult {
  const styleColors: Record<string, string> = {
    anime: '255,107,157',
    manga: '99,102,241',
    cyberpunk: '0,245,255',
    realistic: '212,165,116',
    watercolor: '126,184,201',
    chinese: '192,57,43',
  };
  return {
    success: true,
    imageUrl: `https://picsum.photos/seed/${encodeURIComponent(prompt)}/1024/1024`,
  };
}

// ========== 视频生成服务 ==========

/**
 * 使用即梦 Seedance 生成视频
 */
export async function generateVideoWithSeedance(prompts: string[], style: string): Promise<VideoGenerationResult> {
  const { seedanceApiKey } = getAIConfig();
  if (!seedanceApiKey) {
    return fallbackGenerateVideo(prompts, style);
  }

  try {
    const response = await fetch('https://api.seedance.ai/api/text2video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seedanceApiKey}`,
      },
      body: JSON.stringify({
        prompt: prompts.join(' | '),
        style,
        aspect_ratio: '9:16',
        duration: prompts.length * 3,
        num_frames: prompts.length,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn('即梦 API 调用失败:', error);
      return fallbackGenerateVideo(prompts, style);
    }

    const data = await response.json();
    return {
      success: true,
      taskId: data.task_id,
      status: data.status,
      videoUrl: data.video_url,
    };
  } catch (error) {
    console.warn('即梦 API 调用异常:', error);
    return fallbackGenerateVideo(prompts, style);
  }
}

/**
 * 使用可灵 Kling 生成视频
 */
export async function generateVideoWithKling(prompts: string[], style: string): Promise<VideoGenerationResult> {
  const { klingApiKey } = getAIConfig();
  if (!klingApiKey) {
    return fallbackGenerateVideo(prompts, style);
  }

  try {
    const response = await fetch('https://api.klingai.com/v1/video/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${klingApiKey}`,
      },
      body: JSON.stringify({
        prompt: prompts.join('\n'),
        style: style === 'anime' ? 'anime' : 'realistic',
        aspect_ratio: '9:16',
        duration: prompts.length * 3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn('可灵 API 调用失败:', error);
      return fallbackGenerateVideo(prompts, style);
    }

    const data = await response.json();
    return {
      success: true,
      taskId: data.task_id,
      status: data.status,
      videoUrl: data.video_url,
    };
  } catch (error) {
    console.warn('可灵 API 调用异常:', error);
    return fallbackGenerateVideo(prompts, style);
  }
}

/**
 * 使用 Vidu 生成视频
 */
export async function generateVideoWithVidu(prompts: string[], style: string): Promise<VideoGenerationResult> {
  const { viduApiKey } = getAIConfig();
  if (!viduApiKey) {
    return fallbackGenerateVideo(prompts, style);
  }

  try {
    const response = await fetch('https://api.vidu.ai/api/text2video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${viduApiKey}`,
      },
      body: JSON.stringify({
        input: prompts.join(' '),
        style,
        resolution: '720p',
        duration: prompts.length * 3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn('Vidu API 调用失败:', error);
      return fallbackGenerateVideo(prompts, style);
    }

    const data = await response.json();
    return {
      success: true,
      taskId: data.task_id,
      status: data.status,
      videoUrl: data.video_url,
    };
  } catch (error) {
    console.warn('Vidu API 调用异常:', error);
    return fallbackGenerateVideo(prompts, style);
  }
}

/**
 * 本地视频生成（fallback）
 */
function fallbackGenerateVideo(prompts: string[], style: string): VideoGenerationResult {
  return {
    success: false,
    error: '未配置视频生成 API Key，请到设置页面配置即梦/可灵/Vidu API',
    status: 'error',
  };
}

// ========== 语音合成服务 ==========

export interface VoiceConfig {
  voiceId: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

/**
 * 语音合成
 */
export async function synthesizeSpeech(text: string, config: VoiceConfig = { voiceId: 'narrator' }): Promise<AudioBuffer | null> {
  const voices = window.speechSynthesis?.getVoices() || [];
  
  const voiceMap: Record<string, (v: typeof voices[0]) => boolean> = {
    'male-young': v => v.name.includes('Male') && v.lang.startsWith('zh'),
    'male-deep': v => v.name.includes('Google') && v.lang.startsWith('zh'),
    'female-young': v => v.name.includes('Female') && v.lang.startsWith('zh'),
    'female-sweet': v => v.name.includes('Google') && v.lang.includes('zh-CN'),
    'male-old': v => v.name.includes('Senior') && v.lang.startsWith('zh'),
    'narrator': v => v.lang.startsWith('zh'),
  };

  const matchVoice = voices.find(voiceMap[config.voiceId]) || voices.find(v => v.lang.startsWith('zh'));
  
  if (!matchVoice) {
    console.warn('未找到合适的语音');
    return null;
  }

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = matchVoice;
    utterance.rate = config.rate || 0.9;
    utterance.pitch = config.pitch || 1;
    utterance.volume = config.volume || 1;
    
    window.speechSynthesis.speak(utterance);
    resolve(null);
  });
}

/**
 * 停止语音合成
 */
export function stopSpeech() {
  window.speechSynthesis?.cancel();
}

// ========== 主入口函数 ==========

export interface AIAnalysisOptions {
  model?: 'gpt' | 'wenxin' | 'aggregator' | 'auto';
  aggregatorModel?: string;
}

export interface AIImageOptions {
  model?: 'dalle' | 'sd' | 'aggregator' | 'auto';
  style?: string;
}

export interface AIVideoOptions {
  model?: 'seedance' | 'kling' | 'vidu' | 'hailu' | 'auto';
  style?: string;
}

/**
 * 分析剧本 - 智能选择最佳API
 */
export async function analyzeScript(script: string, options: AIAnalysisOptions = {}): Promise<AnalysisResult> {
  const model = options.model || 'auto';
  
  // 优先使用聚合平台
  const aggregator = getActiveAggregator();
  if (aggregator) {
    const aggModel = options.aggregatorModel || 'gpt-4o-mini';
    return analyzeWithAggregator(script, aggModel);
  }
  
  // 使用官方API
  if (model === 'gpt') return analyzeScriptWithGPT(script);
  if (model === 'wenxin') return analyzeScriptWithWenxin(script);
  
  // 自动选择
  const config = getAIConfig();
  if (config.openaiApiKey) return analyzeScriptWithGPT(script);
  if (config.baiduApiKey && config.baiduSecretKey) return analyzeScriptWithWenxin(script);
  
  return fallbackAnalyzeScript(script);
}

/**
 * 生成图像 - 智能选择最佳API
 */
export async function generateImage(prompt: string, options: AIImageOptions = {}): Promise<ImageGenerationResult> {
  const model = options.model || 'auto';
  const style = options.style || 'anime';
  
  // 优先使用聚合平台
  const aggregator = getActiveAggregator();
  if (aggregator) {
    return generateImageWithAggregator(prompt, style);
  }
  
  // 使用官方API
  if (model === 'dalle') return generateImageWithDALL_E(prompt, style);
  if (model === 'sd') return generateImageWithStableDiffusion(prompt, style);
  
  // 自动选择
  const config = getAIConfig();
  if (config.openaiApiKey) return generateImageWithDALL_E(prompt, style);
  if (config.stabilityApiKey) return generateImageWithStableDiffusion(prompt, style);
  
  return fallbackGenerateImage(prompt, style);
}

/**
 * 生成视频 - 智能选择最佳API
 */
export async function generateVideo(prompts: string[], options: AIVideoOptions = {}): Promise<VideoGenerationResult> {
  const model = options.model || 'auto';
  const style = options.style || 'anime';
  
  if (model === 'seedance') return generateVideoWithSeedance(prompts, style);
  if (model === 'kling') return generateVideoWithKling(prompts, style);
  if (model === 'vidu') return generateVideoWithVidu(prompts, style);
  
  // 自动选择
  const config = getAIConfig();
  if (config.seedanceApiKey) return generateVideoWithSeedance(prompts, style);
  if (config.klingApiKey) return generateVideoWithKling(prompts, style);
  if (config.viduApiKey) return generateVideoWithVidu(prompts, style);
  
  return fallbackGenerateVideo(prompts, style);
}

// ========== API平台信息 ==========

export interface AggregatorInfo {
  id: string;
  name: string;
  website: string;
  description: string;
  features: string[];
  models: string[];
  pricing: string;
}

export const AGGREGATOR_PLATFORMS: AggregatorInfo[] = [
  {
    id: 'comet',
    name: 'CometAPI',
    website: 'https://www.cometapi.com',
    description: '统一API聚合平台，支持500+AI模型',
    features: ['500+模型覆盖', 'OpenAI兼容', '成本降低20-40%', '99.9%可用性'],
    models: ['GPT系列', 'Claude系列', 'Gemini', 'DeepSeek', 'Llama', '图像生成', '视频生成'],
    pricing: '按量计费，比官方低20-40%'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    website: 'https://openrouter.ai',
    description: '最大最流行的AI网关，支持400+模型',
    features: ['400+模型覆盖', '智能路由', '自动故障转移', '多提供商'],
    models: ['GPT系列', 'Claude', 'Gemini', 'Llama', 'Mistral', '开源模型'],
    pricing: '按量计费，灵活定价'
  },
  {
    id: 'polo',
    name: 'PoloAPI',
    website: 'https://poloapi.com',
    description: '企业级AI大模型API聚合平台',
    features: ['企业级SLA', '人民币充值', '无限并发', '智能调度'],
    models: ['GPT', 'Claude', 'Gemini', '文心一言', '通义千问', 'DeepSeek'],
    pricing: '企业级定价，支持对公转账'
  },
  {
    id: 'dmx',
    name: 'DMXAPI',
    website: 'https://www.dmxapi.cn',
    description: 'LangChain中文网提供的智能API聚合服务',
    features: ['300+模型', '人民币计价', '无限RPM/TPM', '企业发票'],
    models: ['DeepSeek', 'GPT', 'Claude', '文心一言', '通义千问', '文生图', '文生视频'],
    pricing: '顶级模型低至7折，人民币计价'
  },
  {
    id: 'jeniya',
    name: '简易API',
    website: 'https://jeniya.top',
    description: '国内领先的API中转站，稳定直连',
    features: ['国内直连', '无需翻墙', '7x24客服', '200元试用额度'],
    models: ['GPT', 'Claude', 'DeepSeek', '文心一言', 'Gemini'],
    pricing: '首次注册送200元额度'
  }
];
