/**
 * AI 创作服务 - 后端真实 AI API 调用
 * 
 * 职责：
 * 1. 接收前端的创作请求
 * 2. 调用真实的 AI 大模型 API
 * 3. 管理创作任务队列
 * 4. 返回创作结果
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== 任务队列 =====
interface AITask {
  id: string;
  type: 'analyze' | 'image' | 'video' | 'speech';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  params: any;
  result?: any;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

const TASKS_DB = path.join(__dirname, '../db/tasks.json');

const readTasks = (): AITask[] => {
  try {
    if (!fs.existsSync(TASKS_DB)) return [];
    const raw = fs.readFileSync(TASKS_DB, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const writeTasks = (tasks: AITask[]) => {
  fs.writeFileSync(TASKS_DB, JSON.stringify(tasks, null, 2), 'utf-8');
};

const addTask = (task: AITask) => {
  const tasks = readTasks();
  tasks.push(task);
  writeTasks(tasks);
  return task;
};

const updateTask = (taskId: string, updates: Partial<AITask>) => {
  const tasks = readTasks();
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx >= 0) {
    tasks[idx] = { ...tasks[idx], ...updates };
    writeTasks(tasks);
    return tasks[idx];
  }
  return null;
};

// ===== API Key 管理 =====
interface APIKeys {
  siliconflow?: string;
  jeniya?: string;
  dashscope?: string;
  zhipu?: string;
  volcengine?: string;
  qianfan?: string;
  qianfanSecret?: string;
  lingya?: string;
}

const KEYS_FILE = path.join(__dirname, '../db/api-keys.json');

export const getAPIKeys = (): APIKeys => {
  try {
    if (!fs.existsSync(KEYS_FILE)) return {};
    return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf-8'));
  } catch {
    return {};
  }
};

export const setAPIKeys = (keys: APIKeys) => {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), 'utf-8');
};

// ===== 百度千帆 Access Token 缓存 =====
let qianfanTokenCache: { token: string; expireAt: number } | null = null;

async function getQianfanAccessToken(apiKey: string, secretKey: string): Promise<string | null> {
  // 检查缓存
  if (qianfanTokenCache && qianfanTokenCache.expireAt > Date.now()) {
    return qianfanTokenCache.token;
  }

  try {
    const response = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' } }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.access_token) {
        // 提前5分钟过期
        qianfanTokenCache = {
          token: data.access_token,
          expireAt: Date.now() + (data.expires_in - 300) * 1000,
        };
        return data.access_token;
      }
    }
  } catch (e) {
    console.warn('获取百度千帆access_token失败:', e);
  }
  return null;
}

// ===== 真实 AI API 调用 =====

/**
 * 分析剧本 - 调用真实大模型
 */
export async function analyzeScript(script: string, userKeys?: APIKeys): Promise<any> {
  const keys = userKeys || getAPIKeys();
  
  // 优先使用硅基流动
  if (keys.siliconflow) {
    try {
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keys.siliconflow}`,
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-V2.5',
          messages: [{
            role: 'user',
            content: `你是一个专业的漫剧编剧和分镜师。请分析以下剧本并输出结构化结果：

剧本：
${script}

请输出 JSON 格式，包含：
1. title: 提取或生成一个合适的漫剧标题（不超过20字）
2. characters: 角色列表，每个角色包含 name、description、role（主角/配角/旁白）
3. frames: 分镜列表，每个分镜包含 id（frame-序号）、description、dialogue、shotType（全景/中景/近景/特写）、duration
4. style: 推荐画风（anime/manga/cyberpunk/realistic/watercolor/chinese）

只输出JSON，不要其他文字。`
          }],
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '{}';
        try {
          const result = JSON.parse(content);
          return { success: true, ...result, source: 'siliconflow' };
        } catch {
          // 尝试从 markdown 代码块中提取 JSON
          const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
          if (jsonMatch) {
            return { success: true, ...JSON.parse(jsonMatch[1]), source: 'siliconflow' };
          }
        }
      }
    } catch (e) {
      console.warn('SiliconFlow API error:', e);
    }
  }

  // 尝试智谱
  if (keys.zhipu) {
    try {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keys.zhipu}`,
        },
        body: JSON.stringify({
          model: 'glm-4-flash',
          messages: [{
            role: 'user',
            content: `分析以下剧本，输出JSON格式：标题、角色列表、分镜列表、推荐画风。\n\n${script}`
          }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '{}';
        try {
          return { success: true, ...JSON.parse(content), source: 'zhipu' };
        } catch {
          const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
          if (jsonMatch) {
            return { success: true, ...JSON.parse(jsonMatch[1]), source: 'zhipu' };
          }
        }
      }
    } catch (e) {
      console.warn('Zhipu API error:', e);
    }
  }

  // 尝试阿里云
  if (keys.dashscope) {
    try {
      const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keys.dashscope}`,
        },
        body: JSON.stringify({
          model: 'qwen2.5-72b-instruct',
          messages: [{
            role: 'user',
            content: `分析以下剧本，输出JSON格式：标题、角色列表、分镜列表、推荐画风。\n\n${script}`
          }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '{}';
        try {
          return { success: true, ...JSON.parse(content), source: 'dashscope' };
        } catch {
          const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
          if (jsonMatch) {
            return { success: true, ...JSON.parse(jsonMatch[1]), source: 'dashscope' };
          }
        }
      }
    } catch (e) {
      console.warn('DashScope API error:', e);
    }
  }

  // 尝试百度千帆
  if (keys.qianfan && keys.qianfanSecret) {
    try {
      const accessToken = await getQianfanAccessToken(keys.qianfan, keys.qianfanSecret);
      if (accessToken) {
        const response = await fetch(
          `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro?access_token=${accessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{
                role: 'user',
                content: `你是一个专业的漫剧编剧和分镜师。请分析以下剧本并输出结构化结果：\n\n剧本：\n${script}\n\n请输出 JSON 格式，包含：\n1. title: 提取或生成一个合适的漫剧标题（不超过20字）\n2. characters: 角色列表，每个角色包含 name、description、role（主角/配角/旁白）\n3. frames: 分镜列表，每个分镜包含 id（frame-序号）、description、dialogue、shotType（全景/中景/近景/特写）、duration\n4. style: 推荐画风（anime/manga/cyberpunk/realistic/watercolor/chinese）\n\n只输出JSON，不要其他文字。`
              }],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const content = data.result || '{}';
          try {
            return { success: true, ...JSON.parse(content), source: 'qianfan' };
          } catch {
            const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
            if (jsonMatch) {
              return { success: true, ...JSON.parse(jsonMatch[1]), source: 'qianfan' };
            }
          }
        }
      }
    } catch (e) {
      console.warn('Qianfan API error:', e);
    }
  }

  return { success: false, error: '没有可用的AI API Key，请在设置中配置' };
}

/**
 * 生成图像 - 调用真实文生图API
 */
export async function generateImage(prompt: string, style: string, userKeys?: APIKeys): Promise<any> {
  const keys = userKeys || getAPIKeys();
  
  // 使用硅基流动的 FLUX
  if (keys.siliconflow) {
    try {
      const stylePrompt = {
        anime: 'anime style, japanese animation, vibrant colors, detailed',
        manga: 'manga style, black and white, comic book, ink drawing',
        cyberpunk: 'cyberpunk style, neon lights, futuristic, high tech',
        realistic: 'photorealistic, highly detailed, 8k quality',
        watercolor: 'watercolor painting, soft colors, artistic, dreamy',
        chinese: 'chinese traditional painting, ink wash, ancient style',
      }[style] || 'anime style';

      const response = await fetch('https://api.siliconflow.cn/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keys.siliconflow}`,
        },
        body: JSON.stringify({
          model: 'black-forest-labs/FLUX.1-schnell',
          prompt: `${prompt}, ${stylePrompt}`,
          size: '1024x1024',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.[0]?.url) {
          return { success: true, imageUrl: data.data[0].url, source: 'siliconflow-flux' };
        }
      }
    } catch (e) {
      console.warn('SiliconFlow image error:', e);
    }
  }

  return { success: false, error: '图像生成服务暂不可用，请检查API配置' };
}

/**
 * 生成语音 - 调用真实TTS API
 */
export async function synthesizeSpeech(text: string, voiceId: string, userKeys?: APIKeys): Promise<any> {
  const keys = userKeys || getAPIKeys();
  
  // 使用硅基流动的 TTS
  if (keys.siliconflow) {
    try {
      const response = await fetch('https://api.siliconflow.cn/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keys.siliconflow}`,
        },
        body: JSON.stringify({
          model: 'FunAudioLLM/CosyVoice2-0.5B',
          input: text,
          voice: voiceId || 'default',
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        return { success: true, audioUrl, source: 'siliconflow-tts' };
      }
    } catch (e) {
      console.warn('TTS API error:', e);
    }
  }

  return { success: false, error: '语音合成服务暂不可用' };
}

/**
 * 创建创作任务
 */
export function createTask(type: AITask['type'], params: any): AITask {
  const task: AITask = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    type,
    status: 'pending',
    params,
    createdAt: new Date().toISOString(),
  };
  return addTask(task);
}

/**
 * 获取任务状态
 */
export function getTask(taskId: string): AITask | null {
  return readTasks().find(t => t.id === taskId) || null;
}

/**
 * 处理创作任务
 */
export async function processTask(taskId: string, userKeys?: APIKeys): Promise<AITask | null> {
  const task = getTask(taskId);
  if (!task || task.status !== 'pending') return task;

  updateTask(taskId, { status: 'processing' });

  try {
    let result: any;
    
    switch (task.type) {
      case 'analyze':
        result = await analyzeScript(task.params.script, userKeys);
        break;
      case 'image':
        result = await generateImage(task.params.prompt, task.params.style, userKeys);
        break;
      case 'speech':
        result = await synthesizeSpeech(task.params.text, task.params.voiceId, userKeys);
        break;
      default:
        throw new Error('未知的任务类型');
    }

    if (result.success) {
      return updateTask(taskId, {
        status: 'completed',
        result,
        completedAt: new Date().toISOString(),
      });
    } else {
      return updateTask(taskId, {
        status: 'failed',
        error: result.error || '创作失败',
        completedAt: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    return updateTask(taskId, {
      status: 'failed',
      error: error.message || '创作过程中发生错误',
      completedAt: new Date().toISOString(),
    });
  }
}

/**
 * 获取所有任务
 */
export function getAllTasks(): AITask[] {
  return readTasks();
}

/**
 * 清理旧任务
 */
export function cleanupOldTasks(days: number = 7) {
  const tasks = readTasks();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const filtered = tasks.filter(t => {
    const time = new Date(t.createdAt).getTime();
    return time > cutoff;
  });
  writeTasks(filtered);
}
