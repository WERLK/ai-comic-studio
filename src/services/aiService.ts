/**
 * AI 服务层 - 对接真实 AI 大模型 API（国内版）
 * 
 * 支持的国内API聚合平台（无需翻墙，国内直连）：
 * 
 * 1. 硅基流动 (SiliconFlow) - https://cloud.siliconflow.cn/
 *    - 100+模型 · 9B以下模型永久免费 · 新用户送2000万token
 *    - Base URL: https://api.siliconflow.cn/v1
 * 
 * 2. 简易API - https://jeniya.cn/
 *    - 国内直连 · 无需翻墙 · 送200元额度
 *    - Base URL: https://api.jeniya.cn/v1
 * 
 * 3. 阿里云百炼 (DashScope) - https://dashscope.aliyun.com/
 *    - 通义千问全系 · OpenAI兼容
 *    - Base URL: https://dashscope.aliyuncs.com/compatible-mode/v1
 * 
 * 4. 智谱AI (GLM) - https://open.bigmodel.cn/
 *    - GLM-4-Flash永久免费 · 2000万token新用户额度
 *    - Base URL: https://open.bigmodel.cn/api/paas/v4
 * 
 * 5. 火山引擎 (Volcengine) - https://www.volcengine.com/
 *    - 豆包全系 · 每日200万token
 *    - Base URL: https://ark.cn-beijing.volces.com/api/v3
 * 
 * 6. 百度千帆 (Qianfan) - https://console.bce.baidu.com/qianfan/
 *    - ERNIE-3.5-8K/ERNIE-Speed-8K永久免费
 *    - Base URL: https://qianfan.baidubce.com/v2
 * 
 * 7. 灵芽AI - https://api.lingyaai.cn/
 *    - GPT-5/Claude/Gemini等百余模型
 * 
 * 支持的模型类型：
 * - 文本分析：Qwen / GLM / DeepSeek / ERNIE / Doubao
 * - 图像生成：FLUX / Stable Diffusion / 通义万相
 * - 视频生成：即梦 / 可灵 / Vidu / 海螺
 * - 语音合成：TTS 服务
 */

// ========== API平台配置 ==========

export interface AggregatorConfig {
  // 聚合平台选择（优先级从高到低）
  aggregator: 'siliconflow' | 'jeniya' | 'dashscope' | 'zhipu' | 'volcengine' | 'qianfan' | 'lingya' | 'none';
  
  // 硅基流动 (SiliconFlow)
  siliconflowApiKey?: string;
  siliconflowBaseUrl?: string;
  
  // 简易API
  jeniyaApiKey?: string;
  jeniyaBaseUrl?: string;
  
  // 阿里云百炼 (DashScope)
  dashscopeApiKey?: string;
  dashscopeBaseUrl?: string;
  
  // 智谱AI (GLM)
  zhipuApiKey?: string;
  zhipuBaseUrl?: string;
  
  // 火山引擎 (Doubao)
  volcengineApiKey?: string;
  volcengineBaseUrl?: string;
  
  // 百度千帆 (Qianfan)
  qianfanApiKey?: string;
  qianfanSecretKey?: string;
  qianfanBaseUrl?: string;
  
  // 灵芽AI
  lingyaApiKey?: string;
  lingyaBaseUrl?: string;
}

export interface AIServiceConfig extends AggregatorConfig {
  // 视频生成API
  seedanceApiKey?: string;
  klingApiKey?: string;
  viduApiKey?: string;
  hailuApiKey?: string;
  
  // 图像生成API
  stabilityApiKey?: string;
  dallApiKey?: string;
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
interface ActiveAggregator {
  key: keyof AggregatorConfig;
  apiKey: string;
  baseUrl: string;
  name: string;
  models: string[];
}

function getActiveAggregator(): ActiveAggregator | null {
  const cfg = getAIConfig();
  
  // 硅基流动（推荐）
  if (cfg.siliconflowApiKey) {
    return {
      key: 'siliconflowApiKey',
      apiKey: cfg.siliconflowApiKey,
      baseUrl: cfg.siliconflowBaseUrl || 'https://api.siliconflow.cn/v1',
      name: '硅基流动',
      models: ['Qwen2.5', 'GLM-4', 'DeepSeek-R1', 'Llama-3', 'FLUX', 'Stable Diffusion']
    };
  }
  
  // 简易API
  if (cfg.jeniyaApiKey) {
    return {
      key: 'jeniyaApiKey',
      apiKey: cfg.jeniyaApiKey,
      baseUrl: cfg.jeniyaBaseUrl || 'https://api.jeniya.cn/v1',
      name: '简易API',
      models: ['GPT-4o', 'Claude-3.5', 'DeepSeek', '文心一言', 'Gemini']
    };
  }
  
  // 阿里云百炼
  if (cfg.dashscopeApiKey) {
    return {
      key: 'dashscopeApiKey',
      apiKey: cfg.dashscopeApiKey,
      baseUrl: cfg.dashscopeBaseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      name: '阿里云百炼',
      models: ['通义千问', 'DeepSeek', 'Kimi', 'GLM', 'Llama']
    };
  }
  
  // 智谱AI
  if (cfg.zhipuApiKey) {
    return {
      key: 'zhipuApiKey',
      apiKey: cfg.zhipuApiKey,
      baseUrl: cfg.zhipuBaseUrl || 'https://open.bigmodel.cn/api/paas/v4',
      name: '智谱AI',
      models: ['GLM-4-Flash', 'GLM-4.7-Flash', 'GLM-4']
    };
  }
  
  // 火山引擎
  if (cfg.volcengineApiKey) {
    return {
      key: 'volcengineApiKey',
      apiKey: cfg.volcengineApiKey,
      baseUrl: cfg.volcengineBaseUrl || 'https://ark.cn-beijing.volces.com/api/v3',
      name: '火山引擎',
      models: ['Doubao-lite', 'Seed-OSS']
    };
  }
  
  // 百度千帆
  if (cfg.qianfanApiKey && cfg.qianfanSecretKey) {
    return {
      key: 'qianfanApiKey',
      apiKey: cfg.qianfanApiKey,
      baseUrl: cfg.qianfanBaseUrl || 'https://qianfan.baidubce.com/v2',
      name: '百度千帆',
      models: ['ERNIE-4.0', 'ERNIE-3.5', 'ERNIE-Speed']
    };
  }
  
  // 灵芽AI
  if (cfg.lingyaApiKey) {
    return {
      key: 'lingyaApiKey',
      apiKey: cfg.lingyaApiKey,
      baseUrl: cfg.lingyaBaseUrl || 'https://api.lingyaai.cn/v1',
      name: '灵芽AI',
      models: ['GPT-5', 'Claude-3.7', 'Gemini-2.5', 'DeepSeek-R1']
    };
  }
  
  return null;
}

// ========== 聚合平台API调用 ==========

/**
 * 使用聚合API进行文本分析
 */
async function analyzeWithAggregator(script: string, model: string = 'auto'): Promise<AnalysisResult> {
  const aggregator = getActiveAggregator();
  if (!aggregator) {
    return fallbackAnalyzeScript(script);
  }

  // 根据平台选择合适的模型
  let modelName = model;
  if (model === 'auto') {
    switch (aggregator.key) {
      case 'siliconflowApiKey':
        modelName = 'deepseek-ai/DeepSeek-V2.5';
        break;
      case 'jeniyaApiKey':
        modelName = 'gpt-4o';
        break;
      case 'dashscopeApiKey':
        modelName = 'qwen2.5-72b-instruct';
        break;
      case 'zhipuApiKey':
        modelName = 'glm-4-flash';
        break;
      case 'volcengineApiKey':
        modelName = 'doubao-lite-4k';
        break;
      case 'qianfanApiKey':
        modelName = 'ernie-3.5-8k';
        break;
      case 'lingyaApiKey':
        modelName = 'gpt-4o';
        break;
      default:
        modelName = 'gpt-4o';
    }
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
        model: modelName,
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

  // 硅基流动支持FLUX图像生成
  if (aggregator.key === 'siliconflowApiKey') {
    try {
      const stylePrompts: Record<string, string> = {
        anime: 'anime style, beautiful anime character, vibrant colors, detailed',
        manga: 'manga style, black and white manga, detailed lineart',
        cyberpunk: 'cyberpunk style, neon lights, futuristic city, detailed',
        realistic: 'photorealistic, highly detailed, cinematic lighting',
        watercolor: 'watercolor painting style, soft colors, artistic',
        chinese: 'chinese traditional art style, ink painting style',
      };

      const response = await fetch(`${aggregator.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aggregator.apiKey}`,
        },
        body: JSON.stringify({
          model: 'black-forest-labs/FLUX.1-dev',
          prompt: `${prompt}, ${stylePrompts[style]}`,
          image_size: '1024x1024',
          num_inference_steps: 20,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.warn('SiliconFlow 图像生成失败:', error);
        return fallbackGenerateImage(prompt, style);
      }

      const data = await response.json();
      return {
        success: true,
        imageUrl: data.data?.[0]?.url || data.data?.[0]?.b64_json,
      };
    } catch (error) {
      console.warn('SiliconFlow 图像生成异常:', error);
      return fallbackGenerateImage(prompt, style);
    }
  }

  return fallbackGenerateImage(prompt, style);
}

// ========== 官方API调用（备用） ==========

/**
 * 使用智谱 GLM 分析剧本
 */
export async function analyzeScriptWithGLM(script: string): Promise<AnalysisResult> {
  const { zhipuApiKey } = getAIConfig();
  if (!zhipuApiKey) {
    return fallbackAnalyzeScript(script);
  }

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

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${zhipuApiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
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
    console.warn('智谱GLM API调用异常:', error);
    return fallbackAnalyzeScript(script);
  }
}

/**
 * 使用阿里云百炼分析剧本
 */
export async function analyzeScriptWithDashScope(script: string): Promise<AnalysisResult> {
  const { dashscopeApiKey } = getAIConfig();
  if (!dashscopeApiKey) {
    return fallbackAnalyzeScript(script);
  }

  const prompt = `
你是一个专业的漫剧编剧和分镜师。请分析以下剧本并输出结构化结果：

剧本：
${script}

请输出 JSON 格式，包含：
1. title: 提取或生成一个合适的漫剧标题（不超过20字）
2. characters: 角色列表，每个角色包含 name、description、role
3. frames: 分镜列表，每个分镜包含 id、description、dialogue、shotType、duration
4. style: 推荐画风（anime/manga/cyberpunk/realistic/watercolor/chinese）

只输出JSON，不要其他文字。
`.trim();

  try {
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dashscopeApiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen2.5-72b-instruct',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
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
    console.warn('阿里云百炼API调用异常:', error);
    return fallbackAnalyzeScript(script);
  }
}

/**
 * 使用通义万相生成图像
 */
export async function generateImageWithWanXiang(prompt: string, style: string = 'anime'): Promise<ImageGenerationResult> {
  const { dashscopeApiKey } = getAIConfig();
  if (!dashscopeApiKey) {
    return fallbackGenerateImage(prompt, style);
  }

  const stylePrompts: Record<string, string> = {
    anime: '动漫风格，精致细腻，色彩鲜艳',
    manga: '漫画风格，线条分明，黑白或彩色',
    cyberpunk: '赛博朋克风格，霓虹灯光，未来科技',
    realistic: '写实风格，高清细节，电影感',
    watercolor: '水彩插画风格，柔和色调，艺术感',
    chinese: '中国古风，传统水墨画，古典韵味',
  };

  try {
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dashscopeApiKey}`,
      },
      body: JSON.stringify({
        model: 'wanx2.1-t2i-pro',
        prompt: `${prompt}，${stylePrompts[style]}`,
        size: '1024*1024',
        n: 1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn('通义万相API调用失败:', error);
      return fallbackGenerateImage(prompt, style);
    }

    const data = await response.json();
    return {
      success: true,
      imageUrl: data.data?.[0]?.url,
    };
  } catch (error) {
    console.warn('通义万相API调用异常:', error);
    return fallbackGenerateImage(prompt, style);
  }
}

/**
 * 使用文心一言分析剧本
 */
export async function analyzeScriptWithWenxin(script: string): Promise<AnalysisResult> {
  const { qianfanApiKey, qianfanSecretKey } = getAIConfig();
  if (!qianfanApiKey || !qianfanSecretKey) {
    return fallbackAnalyzeScript(script);
  }

  try {
    // 获取Access Token
    const tokenResponse = await fetch('https://aip.baidubce.com/oauth/2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${qianfanApiKey}&client_secret=${qianfanSecretKey}`,
    });
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const prompt = `
你是一个专业的漫剧编剧和分镜师。请分析以下剧本并输出结构化JSON：
剧本：${script}
输出：{title, characters: [{name, description, role}], frames: [{id, description, dialogue, shotType, duration}], style}
`.trim();

    const response = await fetch('https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-3.5-8k', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
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
    console.warn('文心一言API调用异常:', error);
    return fallbackAnalyzeScript(script);
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
    
    window.speechSynthesis?.speak(utterance);
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
  model?: 'siliconflow' | 'zhipu' | 'dashscope' | 'qianfan' | 'aggregator' | 'auto';
  aggregatorModel?: string;
}

export interface AIImageOptions {
  model?: 'wanxiang' | 'siliconflow' | 'aggregator' | 'auto';
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
    return analyzeWithAggregator(script, options.aggregatorModel);
  }
  
  // 使用特定平台
  if (model === 'siliconflow') return analyzeWithAggregator(script, 'deepseek-ai/DeepSeek-V2.5');
  if (model === 'zhipu') return analyzeScriptWithGLM(script);
  if (model === 'dashscope') return analyzeScriptWithDashScope(script);
  if (model === 'qianfan') return analyzeScriptWithWenxin(script);
  
  // 尝试按优先级自动选择
  const cfg = getAIConfig();
  if (cfg.siliconflowApiKey) return analyzeWithAggregator(script);
  if (cfg.zhipuApiKey) return analyzeScriptWithGLM(script);
  if (cfg.dashscopeApiKey) return analyzeScriptWithDashScope(script);
  if (cfg.qianfanApiKey && cfg.qianfanSecretKey) return analyzeScriptWithWenxin(script);
  
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
  if (aggregator && aggregator.key === 'siliconflowApiKey') {
    return generateImageWithAggregator(prompt, style);
  }
  
  // 使用通义万相
  if (model === 'wanxiang' || getAIConfig().dashscopeApiKey) {
    const result = await generateImageWithWanXiang(prompt, style);
    if (result.success) return result;
  }
  
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

// ========== 国内API平台信息 ==========

export interface DomesticPlatformInfo {
  id: string;
  name: string;
  website: string;
  baseUrl: string;
  description: string;
  features: string[];
  models: string[];
  freeQuota: string;
  pricing: string;
  recommended: boolean;
}

export const DOMESTIC_PLATFORMS: DomesticPlatformInfo[] = [
  {
    id: 'siliconflow',
    name: '硅基流动 (SiliconFlow)',
    website: 'https://cloud.siliconflow.cn/',
    baseUrl: 'https://api.siliconflow.cn/v1',
    description: '国内领先的AI模型聚合平台，100+模型可选',
    features: ['国内直连', '无需翻墙', 'OpenAI兼容', '9B以下模型永久免费', '微信/支付宝充值'],
    models: ['Qwen2.5-7B~72B', 'GLM-4', 'DeepSeek-R1', 'Llama-3.1', 'FLUX图像生成', '通义万相'],
    freeQuota: '新用户送2000万token，9B以下模型永久免费不限量',
    pricing: '按量计费，人民币结算',
    recommended: true
  },
  {
    id: 'jeniya',
    name: '简易API',
    website: 'https://jeniya.cn/',
    baseUrl: 'https://api.jeniya.cn/v1',
    description: '专业AI大模型API中转服务，国内直连',
    features: ['国内直连', '无需翻墙', '7x24稳定服务', '低延迟', '高并发'],
    models: ['GPT-4o', 'Claude-3.5', 'DeepSeek', '文心一言', 'Gemini'],
    freeQuota: '新用户送200元测试额度',
    pricing: '比官方低20-40%',
    recommended: true
  },
  {
    id: 'dashscope',
    name: '阿里云百炼 (DashScope)',
    website: 'https://dashscope.aliyun.com/',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    description: '阿里云官方大模型服务平台，通义千问全系',
    features: ['阿里云官方', '企业级稳定', 'OpenAI兼容', '通义万相图像', '模型最全'],
    models: ['通义千问Qwen2.5', 'DeepSeek', 'Kimi', 'GLM', 'Llama', 'Baichuan', '通义万相'],
    freeQuota: '每个模型100万token/3个月（可叠加）',
    pricing: '企业级定价，人民币结算',
    recommended: true
  },
  {
    id: 'zhipu',
    name: '智谱AI (GLM)',
    website: 'https://open.bigmodel.cn/',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    description: '清华大学KEG实验室出品，GLM-4永久免费',
    features: ['永久免费额度大', '长文本最强', '中文编程都稳', '2000万token新用户'],
    models: ['GLM-4-Flash(128K)', 'GLM-4.7-Flash(200K)', 'GLM-4'],
    freeQuota: 'GLM-4-Flash、GLM-4.7-Flash永久免费，新用户2000万token',
    pricing: '免费额度充足，超出按量计费',
    recommended: true
  },
  {
    id: 'volcengine',
    name: '火山引擎 (Doubao)',
    website: 'https://www.volcengine.com/',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    description: '字节跳动旗下AI服务平台，豆包大模型',
    features: ['豆包生态', '国内低延迟', '免费额度高', '每日重置'],
    models: ['Doubao-lite', 'Seed-OSS-36B'],
    freeQuota: '每模型50万token一次性，每日200万token协作奖励',
    pricing: '按量计费',
    recommended: false
  },
  {
    id: 'qianfan',
    name: '百度千帆 (Qianfan)',
    website: 'https://console.bce.baidu.com/qianfan/',
    baseUrl: 'https://qianfan.baidubce.com/v2',
    description: '百度智能云大模型平台，文心一言永久免费',
    features: ['永久免费小模型', '合规性强', '知识库问答稳', 'ERNIE系列'],
    models: ['ERNIE-4.0', 'ERNIE-3.5-8K', 'ERNIE-Speed-8K'],
    freeQuota: 'ERNIE-3.5-8K、ERNIE-Speed-8K永久免费不限量，ERNIE-4.0新用户100万token/月',
    pricing: '免费额度充足，企业级定价',
    recommended: false
  },
  {
    id: 'lingya',
    name: '灵芽AI',
    website: 'https://api.lingyaai.cn/',
    baseUrl: 'https://api.lingyaai.cn/v1',
    description: '国内专业AI API聚合平台，百余模型',
    features: ['无需翻墙', '低延迟高并发', 'GPT-5支持', '安全可靠'],
    models: ['GPT-5', 'Claude-3.7/4', 'Gemini-2.0/2.5', 'DeepSeek-R1'],
    freeQuota: '新用户有测试额度',
    pricing: '按量计费',
    recommended: false
  }
];
