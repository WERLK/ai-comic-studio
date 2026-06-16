import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Key, Save, ArrowLeft, Check, AlertCircle, ExternalLink,
  Zap, Globe, Shield, Star, ChevronDown, ChevronUp
} from 'lucide-react';
import { setAIConfig, getAIConfig } from '@/services/aiService';

interface ApiProvider {
  id: string;
  name: string;
  description: string;
  website: string;
  freeQuota: string;
  features: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  placeholder: string;
  model: string;
}

const API_PROVIDERS: ApiProvider[] = [
  {
    id: 'siliconflow',
    name: '硅基流动（推荐）',
    description: '国内领先AI模型聚合平台，100+模型可选',
    website: 'https://cloud.siliconflow.cn/',
    freeQuota: '新用户送2000万token，9B以下模型永久免费',
    features: ['国内直连', '无需翻墙', 'OpenAI兼容', '9B以下免费'],
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    placeholder: 'sk-xxxxxxxxxxxxxxxx',
    model: 'Qwen2.5 / GLM-4 / DeepSeek-R1 / FLUX',
  },
  {
    id: 'jeniya',
    name: '简易API（推荐）',
    description: '专业AI大模型API中转，国内直连高速稳定',
    website: 'https://jeniya.cn/',
    freeQuota: '新用户送200元测试额度',
    features: ['国内直连', '无需翻墙', '7x24稳定', '低延迟'],
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    placeholder: 'sk-xxxxxxxxxxxxxxxx',
    model: 'GPT-4o / Claude-3.5 / DeepSeek',
  },
  {
    id: 'dashscope',
    name: '阿里云百炼',
    description: '阿里云官方大模型平台，通义千问全系',
    website: 'https://dashscope.aliyun.com/',
    freeQuota: '每模型100万token/3个月（可叠加）',
    features: ['阿里云官方', '企业级稳定', 'OpenAI兼容', '通义万相'],
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    placeholder: 'sk-xxxxxxxxxxxxxxxx',
    model: '通义千问Qwen2.5 / DeepSeek / 通义万相',
  },
  {
    id: 'zhipu',
    name: '智谱AI（免费额度大）',
    description: '清华大学KEG实验室出品，GLM-4永久免费',
    website: 'https://open.bigmodel.cn/',
    freeQuota: 'GLM-4-Flash永久免费，新用户2000万token',
    features: ['永久免费额度大', '长文本最强', '中文优化', '清华技术'],
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    placeholder: 'xxxxxxxxxxxxxxxx',
    model: 'GLM-4-Flash / GLM-4.7-Flash / GLM-4',
  },
  {
    id: 'volcengine',
    name: '火山引擎（豆包）',
    description: '字节跳动旗下AI服务平台，豆包大模型',
    website: 'https://www.volcengine.com/',
    freeQuota: '每模型50万token一次性，每日200万token协作奖励',
    features: ['豆包生态', '国内低延迟', '免费额度高', '字节跳动'],
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    placeholder: 'xxxxxxxxxxxxxxxx',
    model: 'Doubao-lite / Seed-OSS-36B',
  },
  {
    id: 'qianfan',
    name: '百度千帆（文心免费）',
    description: '百度智能云大模型平台，文心一言永久免费',
    website: 'https://console.bce.baidu.com/qianfan/',
    freeQuota: 'ERNIE-3.5-8K、ERNIE-Speed-8K永久免费不限量',
    features: ['永久免费小模型', '合规性强', '知识库问答稳', '百度技术'],
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    placeholder: 'API Key / Secret Key',
    model: 'ERNIE-4.0 / ERNIE-3.5 / ERNIE-Speed',
  },
  {
    id: 'lingya',
    name: '灵芽AI',
    description: '国内专业AI API聚合平台，百余模型',
    website: 'https://api.lingyaai.cn/',
    freeQuota: '新用户有测试额度',
    features: ['无需翻墙', '低延迟高并发', 'GPT-5支持', '安全可靠'],
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
    placeholder: 'sk-xxxxxxxxxxxxxxxx',
    model: 'GPT-5 / Claude-3.7/4 / Gemini-2.0/2.5',
  },
  {
    id: 'tencent-hunyuan',
    name: '腾讯混元大模型',
    description: '腾讯自研大语言模型，中文理解能力强',
    website: 'https://cloud.tencent.com/product/hunyuan',
    freeQuota: '新用户有免费测试额度',
    features: ['腾讯生态', '中文优化', '企业级', 'API兼容'],
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    placeholder: 'AKIDxxxxxxxx / SKxxxxxxxx',
    model: 'Hunyuan-Lite / Hunyuan-Pro / Hunyuan-Plus',
  },
  {
    id: 'huawei-pangu',
    name: '华为盘古大模型',
    description: '华为自研大语言模型，支持多模态',
    website: 'https://www.huaweicloud.com/product/pangu.html',
    freeQuota: '新用户有免费测试额度',
    features: ['华为技术', '多模态', '企业级', 'AI计算'],
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    placeholder: 'AKxxxxxxxx / SKxxxxxxxx',
    model: 'Pangu-LLM / Pangu-MultiModal',
  },
  {
    id: 'netease-fuxi',
    name: '网易伏羲大模型',
    description: '网易自研大语言模型，游戏场景优化',
    website: 'https://fuxi.163.com/',
    freeQuota: '新用户有免费测试额度',
    features: ['游戏场景', '网易技术', '娱乐内容', '创意生成'],
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    placeholder: 'AKxxxxxxxx / SKxxxxxxxx',
    model: 'Fuxi-LLM / Fuxi-Audio',
  },
  {
    id: 'openai',
    name: 'OpenAI（原版）',
    description: 'GPT系列模型原创者，全球最先进AI',
    website: 'https://platform.openai.com/',
    freeQuota: '新用户$5免费额度（3个月）',
    features: ['GPT-4o', 'GPT-5', 'DALL-E 3', '语音API'],
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/20',
    placeholder: 'sk-proj-xxxxxxxxxxxxxxxx',
    model: 'GPT-4o / GPT-4o mini / GPT-5 / DALL-E 3',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude系列模型，长文本处理最强',
    website: 'https://www.anthropic.com/',
    freeQuota: '新用户$5免费额度（3个月）',
    features: ['1M token上下文', 'Claude-3.5-Sonnet', 'Claude-3.7', '安全可靠'],
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/20',
    placeholder: 'sk-ant-api03-xxxxxxxx',
    model: 'Claude-3.5-Sonnet / Claude-3.7-Sonnet / Claude-3.7-Opus',
  },
  {
    id: 'google-gemini',
    name: 'Google Gemini',
    description: 'Google自研大模型，多模态能力强',
    website: 'https://ai.google.dev/',
    freeQuota: 'Gemini 1.5 Flash有免费额度',
    features: ['多模态最强', 'Gemini 2.0', 'Gemini 2.5', 'Google技术'],
    color: 'text-blue-600',
    bgColor: 'bg-blue-600/10',
    borderColor: 'border-blue-600/20',
    placeholder: 'AIzaSyxxxxxxxxxxxxxxxx',
    model: 'Gemini 1.5 Flash / Gemini 2.0 / Gemini 2.5 Flash',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    description: '欧洲领先AI公司，开源模型优质',
    website: 'https://mistral.ai/',
    freeQuota: '新用户有免费测试额度',
    features: ['开源友好', 'Mistral Large', 'Mistral Small', 'Mixture of Experts'],
    color: 'text-orange-600',
    bgColor: 'bg-orange-600/10',
    borderColor: 'border-orange-600/20',
    placeholder: 'api-key-xxxxxxxx',
    model: 'Mistral Large / Mistral Small / Mixtral 8x22B',
  },
  {
    id: 'cohere',
    name: 'Cohere AI',
    description: '企业级AI平台，专注文本理解',
    website: 'https://cohere.com/',
    freeQuota: '新用户有免费测试额度',
    features: ['企业级', 'RAG优化', 'Command系列', 'Embeddings'],
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
    placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx',
    model: 'Command R+ / Command R / Embed v3',
  },
  {
    id: 'together',
    name: 'Together AI',
    description: '开源模型API聚合，价格实惠',
    website: 'https://www.together.ai/',
    freeQuota: '新用户有免费测试额度',
    features: ['开源模型', '价格低', 'OpenAI兼容', '多模型'],
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    placeholder: 'api-key-xxxxxxxx',
    model: 'Llama 3.3 / Mistral / Qwen / Yi',
  },
  {
    id: 'groq',
    name: 'Groq AI',
    description: '最快的AI推理API，低延迟',
    website: 'https://groq.com/',
    freeQuota: '新用户有免费测试额度',
    features: ['最快推理', '低延迟', 'Llama 3.3', 'Mistral'],
    color: 'text-purple-600',
    bgColor: 'bg-purple-600/10',
    borderColor: 'border-purple-600/20',
    placeholder: 'gsk_xxxxxxxxxxxxxxxx',
    model: 'Llama 3.3 70B / Mixtral / Gemma',
  },
  {
    id: 'alibaba-tongyi',
    name: '阿里云通义万相（图像）',
    description: '阿里云自研多模态模型，图像生成能力强',
    website: 'https://dashscope.aliyun.com/',
    freeQuota: '新用户有免费测试额度',
    features: ['图像生成', '多模态', '阿里云', '国内直连'],
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    placeholder: 'sk-xxxxxxxxxxxxxxxx',
    model: '通义万相 / Qwen-VL / Qwen-Audio',
  },
  {
    id: 'jd-yaxi',
    name: '京东言犀大模型',
    description: '京东自研大语言模型，电商场景优化',
    website: 'https://www.jd.com/',
    freeQuota: '新用户有免费测试额度',
    features: ['电商场景', '京东生态', '中文优化', '国内直连'],
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    placeholder: 'AKxxxxxxxx / SKxxxxxxxx',
    model: '言犀-Lite / 言犀-Pro / 言犀-Plus',
  },
  {
    id: 'xiaohongshu-ai',
    name: '小红书AI',
    description: '小红书自研AI，生活方式内容优化',
    website: 'https://www.xiaohongshu.com/',
    freeQuota: '新用户有免费测试额度',
    features: ['生活方式', '小红书生态', '内容创作', '国内直连'],
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    placeholder: 'AKxxxxxxxx / SKxxxxxxxx',
    model: '小红书AI助手 / 图文生成',
  },
  {
    id: 'kuaishou-ai',
    name: '快手AI',
    description: '快手自研大模型，短视频场景优化',
    website: 'https://www.kuaishou.com/',
    freeQuota: '新用户有免费测试额度',
    features: ['短视频场景', '快手生态', '国内直连', '创作工具'],
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    placeholder: 'AKxxxxxxxx / SKxxxxxxxx',
    model: '快手AI助手 / 视频生成',
  },
  {
    id: 'xiaomi-ai',
    name: '小米AI（小爱同学）',
    description: '小米自研大模型，智能硬件场景',
    website: 'https://www.mi.com/',
    freeQuota: '新用户有免费测试额度',
    features: ['智能硬件', '小米生态', '国内直连', '语音交互'],
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    borderColor: 'border-orange-400/20',
    placeholder: 'AKxxxxxxxx / SKxxxxxxxx',
    model: '小爱同学AI / 小米大模型',
  },
  {
    id: 'meituan-ai',
    name: '美团AI',
    description: '美团自研大模型，生活服务场景优化',
    website: 'https://www.meituan.com/',
    freeQuota: '新用户有免费测试额度',
    features: ['生活服务', '美团生态', '国内直连', '推荐系统'],
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    placeholder: 'AKxxxxxxxx / SKxxxxxxxx',
    model: '美团AI助手 / 生活服务大模型',
  },
  {
    id: '360-zinao',
    name: '360智脑',
    description: '360自研大模型，安全场景优化',
    website: 'https://www.360.cn/',
    freeQuota: '新用户有免费测试额度',
    features: ['安全场景', '360生态', '国内直连', '搜索优化'],
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    placeholder: 'AKxxxxxxxx / SKxxxxxxxx',
    model: '360智脑 / 360搜索AI',
  },
  {
    id: 'iflytek-spark',
    name: '科大讯飞星火',
    description: '科大讯飞自研大模型，语音交互最强',
    website: 'https://www.xfyun.cn/',
    freeQuota: '新用户有免费测试额度',
    features: ['语音交互', '科大讯飞', '多语种', '国内直连'],
    color: 'text-blue-600',
    bgColor: 'bg-blue-600/10',
    borderColor: 'border-blue-600/20',
    placeholder: 'APPIDxxxx / APISecretxxx',
    model: '星火V3.5 / 星火V4 / 语音大模型',
  },
  {
    id: 'senseauto',
    name: '商汤科技',
    description: '商汤自研大模型，计算机视觉最强',
    website: 'https://www.sensetime.com/',
    freeQuota: '新用户有免费测试额度',
    features: ['计算机视觉', '多模态', '商汤技术', '国内直连'],
    color: 'text-red-600',
    bgColor: 'bg-red-600/10',
    borderColor: 'border-red-600/20',
    placeholder: 'APIKeyxxxxxxxx',
    model: 'SenseNova / 商汤多模态大模型',
  },
  {
    id: 'kunlun',
    name: '昆仑万维',
    description: '昆仑万维自研大模型，海外市场布局',
    website: 'https://www.kunlun.com/',
    freeQuota: '新用户有免费测试额度',
    features: ['海外市场', '多语言', 'AI平台', '国内直连'],
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    placeholder: 'APIKeyxxxxxxxx',
    model: '天工大模型 / 昆仑AI',
  },
  {
    id: 'wenxin-more',
    name: '百度文心一言（更多模型）',
    description: '百度文心一言全系列模型，中文理解最强',
    website: 'https://console.bce.baidu.com/qianfan/',
    freeQuota: 'ERNIE-Speed永久免费',
    features: ['中文理解最强', '多模态', '百度搜索', '国内直连'],
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    placeholder: 'API Key / Secret Key',
    model: 'ERNIE-4.0-Turbo / ERNIE-ViLG 4.0 / ERNIE-Speed',
  },
];

const FREE_PROVIDERS: ApiProvider[] = [
  {
    id: 'relayfreellm',
    name: 'RelayFreeLLM（完全免费）',
    description: '开源免费AI网关，聚合Gemini/Groq/Mistral等免费模型',
    website: 'https://github.com/msmarkgu/RelayFreeLLM',
    freeQuota: '完全免费，聚合多家免费额度',
    features: ['完全开源免费', 'OpenAI兼容', '自动容灾', '智能路由'],
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    placeholder: 'http://localhost:8000/v1（本地部署）',
    model: 'Gemini 2.5 Flash / Llama 3.3 / GPT-OSS / Qwen3',
  },
  {
    id: 'freellmapi',
    name: 'FreeLLMAPI（每月13亿Token）',
    description: '聚合11家大模型平台免费额度，开源项目',
    website: 'https://github.com/tashfeenahmed/freellmapi',
    freeQuota: '每月约13亿Token免费额度',
    features: ['11家平台聚合', 'OpenAI兼容', '自动路由', '故障转移'],
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    placeholder: 'http://localhost:3001/v1（本地部署）',
    model: 'Gemini 2.5 Flash / GPT-4.1 / DeepSeek V3 / GLM-4.7',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter（免费模型）',
    description: '全球最大AI模型聚合平台，400+模型部分免费',
    website: 'https://openrouter.ai',
    freeQuota: '部分模型完全免费，每日有免费额度',
    features: ['400+模型', '免费模型可用', '自动fallback', 'OpenAI兼容'],
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
    placeholder: 'sk-or-v1-xxxxxxxxxxxxxxxx',
    model: 'DeepSeek / Llama / Qwen / Gemma / Mistral',
  },
];

export function AIConfigPage() {
  const navigate = useNavigate();
  const config = getAIConfig();

  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    siliconflow: config.siliconflowApiKey || '',
    jeniya: config.jeniyaApiKey || '',
    dashscope: config.dashscopeApiKey || '',
    zhipu: config.zhipuApiKey || '',
    volcengine: config.volcengineApiKey || '',
    qianfan: config.qianfanApiKey || '',
    lingya: config.lingyaApiKey || '',
    'tencent-hunyuan': config.tencentHunyuanApiKey || '',
    'huawei-pangu': config.huaweiPanguApiKey || '',
    'netease-fuxi': config.neteaseFuxiApiKey || '',
    openai: config.openaiApiKey || '',
    anthropic: config.anthropicApiKey || '',
    'google-gemini': config.googleGeminiApiKey || '',
    mistral: config.mistralApiKey || '',
    cohere: config.cohereApiKey || '',
    together: config.togetherApiKey || '',
    groq: config.groqApiKey || '',
    'alibaba-tongyi': config.alibabaTongyiApiKey || '',
    'jd-yaxi': config.jdYaxiApiKey || '',
    'xiaohongshu-ai': config.xiaohongshuAiApiKey || '',
    'kuaishou-ai': config.kuaishouAiApiKey || '',
    'xiaomi-ai': config.xiaomiAiApiKey || '',
    'meituan-ai': config.meituanAiApiKey || '',
    '360-zinao': config.sanliulingZinaoApiKey || '',
    'iflytek-spark': config.iflytekSparkApiKey || '',
    'senseauto': config.senseautoApiKey || '',
    'kunlun': config.kunlunApiKey || '',
    'wenxin-more': config.wenxinMoreApiKey || '',
  });

  const [customBaseUrls, setCustomBaseUrls] = useState<Record<string, string>>({
    siliconflow: config.siliconflowBaseUrl || '',
    jeniya: config.jeniyaBaseUrl || '',
    dashscope: config.dashscopeBaseUrl || '',
    zhipu: config.zhipuBaseUrl || '',
    volcengine: config.volcengineBaseUrl || '',
    lingya: config.lingyaBaseUrl || '',
    'tencent-hunyuan': config.tencentHunyuanBaseUrl || '',
    'huawei-pangu': config.huaweiPanguBaseUrl || '',
    'netease-fuxi': config.neteaseFuxiBaseUrl || '',
    openai: config.openaiBaseUrl || '',
    anthropic: config.anthropicBaseUrl || '',
    'google-gemini': config.googleGeminiBaseUrl || '',
    mistral: config.mistralBaseUrl || '',
    cohere: config.cohereBaseUrl || '',
    together: config.togetherBaseUrl || '',
    groq: config.groqBaseUrl || '',
    'alibaba-tongyi': config.alibabaTongyiBaseUrl || '',
    'jd-yaxi': config.jdYaxiBaseUrl || '',
    'xiaohongshu-ai': config.xiaohongshuAiBaseUrl || '',
    'kuaishou-ai': config.kuaishouAiBaseUrl || '',
    'xiaomi-ai': config.xiaomiAiBaseUrl || '',
    'meituan-ai': config.meituanAiBaseUrl || '',
    '360-zinao': config.sanliulingZinaoBaseUrl || '',
    'iflytek-spark': config.iflytekSparkBaseUrl || '',
    'senseauto': config.senseautoBaseUrl || '',
    'kunlun': config.kunlunBaseUrl || '',
    'wenxin-more': config.wenxinMoreBaseUrl || '',
  });

  const [showFree, setShowFree] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  const handleSave = () => {
    setError('');
    const newConfig: any = {};
    for (const [key, value] of Object.entries(apiKeys)) {
      if (value) newConfig[`${key}ApiKey`] = value;
    }
    for (const [key, value] of Object.entries(customBaseUrls)) {
      if (value) newConfig[`${key}BaseUrl`] = value;
    }
    setAIConfig(newConfig);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const hasAnyKey = Object.values(apiKeys).some(v => v);

  return (
    <div className="min-h-screen bg-cyber-bg text-white">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-30 bg-cyber-bg/90 backdrop-blur-xl border-b border-cyber-purple/20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-xl hover:bg-cyber-purple/20 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyber-pink flex-shrink-0" />
              AI 服务配置
            </h1>
            <p className="text-[10px] text-gray-500 mt-0.5 truncate">
              配置 AI 平台 API 密钥，支持多平台聚合
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasAnyKey && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-400 font-medium">已配置</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 说明横幅 */}
        <div className="bg-gradient-to-r from-cyber-pink/10 to-cyber-purple/10 border border-cyber-pink/20 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-pink to-rose-500 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-white mb-1">密钥安全说明</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                所有 API 密钥仅保存在您浏览器的本地存储中，不会发送到任何第三方服务器。配置后即可使用 AI 漫剧生成、剧本创作等功能。
              </p>
            </div>
          </div>
        </div>

        {/* 付费 API 配置 */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            国内 AI 平台（推荐配置）
          </h3>
          <div className="space-y-3">
            {API_PROVIDERS.map(provider => (
              <div
                key={provider.id}
                className={`${provider.bgColor} border ${provider.borderColor} rounded-2xl overflow-hidden`}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedProvider(expandedProvider === provider.id ? null : provider.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Key className={`w-4 h-4 ${provider.color}`} />
                      <span className="text-white font-medium text-sm">{provider.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={provider.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className={`text-xs ${provider.color} hover:underline flex items-center gap-1`}
                      >
                        获取密钥 <ExternalLink className="w-3 h-3" />
                      </a>
                      {expandedProvider === provider.id ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{provider.description}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {provider.features.map(f => (
                      <span key={f} className="px-2 py-0.5 bg-black/20 rounded text-[10px] text-gray-400">
                        {f}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-green-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {provider.freeQuota}
                  </p>
                </div>

                {expandedProvider === provider.id && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3">
                    <p className="text-[10px] text-gray-500 mb-2">支持的模型：{provider.model}</p>
                    <input
                      type="password"
                      value={apiKeys[provider.id] || ''}
                      onChange={e => setApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                      placeholder={provider.placeholder}
                      className="w-full px-3 py-2 bg-cyber-bg border border-white/10 rounded-xl text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-cyber-pink/50 mb-2"
                    />
                    <input
                      type="text"
                      value={customBaseUrls[provider.id] || ''}
                      onChange={e => setCustomBaseUrls(prev => ({ ...prev, [provider.id]: e.target.value }))}
                      placeholder="自定义 Base URL（可选，留空使用默认）"
                      className="w-full px-3 py-2 bg-cyber-bg border border-white/10 rounded-xl text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-cyber-pink/50"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 免费 API */}
        <div className="mb-6">
          <button
            onClick={() => setShowFree(!showFree)}
            className="w-full flex items-center justify-between p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl hover:border-yellow-500/40 transition-all"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-medium text-sm">免费 AI 聚合平台</span>
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] rounded-lg">完全免费</span>
            </div>
            {showFree ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showFree && (
            <div className="space-y-3 mt-3">
              {FREE_PROVIDERS.map(provider => (
                <div
                  key={provider.id}
                  className={`${provider.bgColor} border ${provider.borderColor} rounded-2xl overflow-hidden`}
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedProvider(expandedProvider === provider.id ? null : provider.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Key className={`w-4 h-4 ${provider.color}`} />
                        <span className="text-white font-medium text-sm">{provider.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className={`text-xs ${provider.color} hover:underline flex items-center gap-1`}
                        >
                          项目地址 <ExternalLink className="w-3 h-3" />
                        </a>
                        {expandedProvider === provider.id ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{provider.description}</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {provider.features.map(f => (
                        <span key={f} className="px-2 py-0.5 bg-black/20 rounded text-[10px] text-gray-400">
                          {f}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-green-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {provider.freeQuota}
                    </p>
                  </div>

                  {expandedProvider === provider.id && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-3">
                      <p className="text-[10px] text-gray-500 mb-2">支持的模型：{provider.model}</p>
                      <div className="bg-black/20 rounded-xl p-3 mb-2">
                        <p className="text-[10px] text-yellow-400 mb-2">⚠️ 免费平台需要本地部署后使用</p>
                        <input
                          type="text"
                          value={apiKeys[provider.id] || ''}
                          onChange={e => setApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                          placeholder={provider.placeholder}
                          className="w-full px-3 py-2 bg-cyber-bg border border-white/10 rounded-xl text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-cyber-pink/50 mb-2"
                        />
                      </div>
                      <input
                        type="text"
                        value={customBaseUrls[provider.id] || ''}
                        onChange={e => setCustomBaseUrls(prev => ({ ...prev, [provider.id]: e.target.value }))}
                        placeholder="自定义 Base URL（可选，留空使用默认）"
                        className="w-full px-3 py-2 bg-cyber-bg border border-white/10 rounded-xl text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-cyber-pink/50"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 保存按钮 */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 text-green-400 text-sm mb-4">
            <Check className="w-4 h-4" />
            配置已保存，AI 生成功能已启用
          </div>
        )}

        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyber-pink to-cyber-purple hover:from-cyber-pink/80 hover:to-cyber-purple/80 text-white rounded-xl transition-all"
        >
          <Save className="w-4 h-4" />
          保存配置
        </button>

        {/* 使用说明 */}
        <div className="mt-6 bg-cyber-dark/60 border border-cyber-purple/20 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyber-blue" />
            使用说明
          </h3>
          <div className="space-y-2 text-xs text-gray-400">
            <p>1. 至少配置一个 AI 平台的 API 密钥即可使用</p>
            <p>2. <strong className="text-purple-400">硅基流动</strong>和<strong className="text-green-400">智谱AI</strong>免费额度大，推荐优先配置</p>
            <p>3. 如需使用免费平台，需要本地部署对应项目后填入本地地址</p>
            <p>4. 配置后即可使用 AI 漫剧生成、剧本创作等功能</p>
            <p>5. API 密钥仅保存在本地浏览器，不会上传到服务器</p>
          </div>
        </div>
      </div>
    </div>
  );
}
