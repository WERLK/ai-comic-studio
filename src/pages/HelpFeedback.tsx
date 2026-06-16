import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Send, Mail, Clock, ExternalLink, Globe, Sparkles, Zap, Crown, MessageSquare } from 'lucide-react';
import { AppVersion } from '@/components/AppVersion';

// 已对接的 AI 平台信息
const AI_PLATFORMS = [
  {
    name: '硅基流动 (SiliconFlow)',
    website: 'https://cloud.siliconflow.cn/',
    consoleUrl: 'https://cloud.siliconflow.cn/console',
    description: '100+模型 · 9B以下模型永久免费 · 新用户送2000万token',
    models: 'DeepSeek-R1, Qwen2.5, GLM-4, FLUX图像生成',
    freeQuota: '9B以下模型永久免费',
    color: 'from-pink-500 to-purple-500',
    recommended: true,
  },
  {
    name: '简易API (Jeniya)',
    website: 'https://jeniya.cn/',
    consoleUrl: 'https://jeniya.cn/user',
    description: '国内直连 · 无需翻墙 · 送200元额度',
    models: 'GPT-4o, Claude-3.5, DeepSeek, Gemini',
    freeQuota: '新用户送200元测试额度',
    color: 'from-blue-500 to-cyan-500',
    recommended: true,
  },
  {
    name: '阿里云百炼 (DashScope)',
    website: 'https://dashscope.aliyun.com/',
    consoleUrl: 'https://dashscope.console.aliyun.com/',
    description: '通义千问全系 · OpenAI兼容 · 模型最全',
    models: 'Qwen2.5, DeepSeek, Kimi, 通义万相图像',
    freeQuota: '每个模型100万token/3个月',
    color: 'from-yellow-500 to-orange-500',
    recommended: true,
  },
  {
    name: '智谱AI (GLM)',
    website: 'https://open.bigmodel.cn/',
    consoleUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    description: 'GLM-4永久免费 · 200K超长上下文 · 中文编程强',
    models: 'GLM-4-Flash(128K), GLM-4.7-Flash(200K)',
    freeQuota: 'GLM-4-Flash永久免费，新用户2000万token',
    color: 'from-purple-500 to-indigo-500',
    recommended: true,
  },
  {
    name: '火山引擎 (Doubao)',
    website: 'https://www.volcengine.com/',
    consoleUrl: 'https://console.volcengine.com/ark',
    description: '字节跳动豆包 · 国内低延迟 · 每日200万token',
    models: 'Doubao-lite, Seed-OSS-36B',
    freeQuota: '每日200万token协作奖励',
    color: 'from-orange-500 to-red-500',
    recommended: false,
  },
  {
    name: '百度千帆 (Qianfan)',
    website: 'https://cloud.baidu.com/product/wenxin',
    consoleUrl: 'https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application',
    description: '文心一言 · ERNIE-3.5永久免费 · 合规性强',
    models: 'ERNIE-4.0, ERNIE-3.5-8K, ERNIE-Speed-8K',
    freeQuota: 'ERNIE-3.5-8K、ERNIE-Speed-8K永久免费',
    color: 'from-green-500 to-emerald-500',
    recommended: false,
  },
  {
    name: '灵芽AI (LingYa)',
    website: 'https://api.lingyaai.cn/',
    consoleUrl: 'https://api.lingyaai.cn/',
    description: '国内直连 · 百余模型 · GPT-5支持',
    models: 'GPT-5, Claude-3.7/4, Gemini-2.5, DeepSeek-R1',
    freeQuota: '新用户有测试额度',
    color: 'from-violet-500 to-purple-500',
    recommended: false,
  },
];

const faqData = [
  {
    question: '如何创建第一个漫剧作品？',
    answer: '在首页点击"创建漫剧"按钮，选择模板后开始创作。您可以通过文字描述场景和对话，AI会自动生成画面和角色。完成后可以在个人中心查看所有作品。',
  },
  {
    question: '如何获取AI平台的API Key？',
    answer: '前往对应平台的官网注册账号，在控制台创建应用即可获取API Key。推荐新手使用硅基流动（9B以下模型永久免费）或智谱AI（GLM-4-Flash永久免费）。详见下方"AI平台导航"板块，点击"前往官网"即可直达。',
  },
  {
    question: '积分如何获得？',
    answer: '完成每日任务可获得积分奖励，包括：每日登录（+10）、分享作品（+20）、作品被点赞（+5）、新手引导（+50）等。更多任务请前往积分中心查看。',
  },
  {
    question: 'VIP会员有哪些特权？',
    answer: 'VIP会员享有：更多分镜数、更高导出分辨率、任务积分倍数加成、每日额外积分、全部风格解锁等特权。详见会员中心。',
  },
  {
    question: '数据会自动保存吗？',
    answer: '是的，所有创作数据会自动保存在本地。您也可以在个人中心通过"导出数据"功能导出JSON文件作为备份，支持跨设备导入恢复。',
  },
  {
    question: '如何联系客服？',
    answer: '您可以通过页面底部的联系方式发送邮件至客服邮箱，也可以在意见反馈表单中提交您的问题，我们会尽快回复您。工作时间：周一至周五 9:00-18:00。',
  },
];

const issueTypes = [
  '功能建议',
  'Bug反馈',
  '内容投诉',
  '其他',
];

export function HelpFeedback() {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [issueType, setIssueType] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackContent.trim()) return;

    alert('反馈已提交，感谢您的建议！');
    setSubmitSuccess(true);
    setIssueType('');
    setFeedbackContent('');
    setContactInfo('');

    setTimeout(() => setSubmitSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid">
      {/* Header */}
      <header className="h-14 bg-cyber-dark2/80 backdrop-blur-xl border-b border-cyber-purple/20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-medium text-white text-sm md:text-base">帮助与反馈</h1>
        </div>
        <div className="flex items-center gap-3">
          <AppVersion />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* FAQ Section */}
        <section>
          <h2 className="font-display text-lg font-medium text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-cyber-pink to-cyber-purple rounded-full" />
            常见问题
          </h2>
          <div className="space-y-3">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="bg-cyber-dark2/80 border border-cyber-purple/20 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-cyber-purple/10 transition-colors"
                >
                  <span className="font-medium text-white pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-cyber-pink flex-shrink-0 transition-transform duration-300 ${
                      openFaqIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaqIndex === index ? 'max-h-48' : 'max-h-0'
                  }`}
                >
                  <p className="px-4 pb-4 text-sm text-gray-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI 平台导航 */}
        <section>
          <h2 className="font-display text-lg font-medium text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-cyber-blue to-cyber-purple rounded-full" />
            <Globe className="w-4 h-4 text-cyber-blue" />
            AI 平台导航
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            以下为本应用已对接的 AI 服务平台，点击"前往官网"注册并获取 API Key，然后在「API 配置」页面填入即可使用。
          </p>
          <div className="space-y-3">
            {AI_PLATFORMS.map((platform) => (
              <div
                key={platform.name}
                className={`bg-cyber-dark2/80 border rounded-2xl overflow-hidden transition-all hover:border-opacity-60 ${
                  platform.recommended ? 'border-cyber-pink/30 hover:border-cyber-pink/50' : 'border-cyber-purple/20 hover:border-cyber-purple/40'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-white text-sm">{platform.name}</span>
                          {platform.recommended && (
                            <span className="px-1.5 py-0.5 rounded bg-cyber-yellow/20 text-cyber-yellow text-[10px] font-medium">
                              推荐
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{platform.description}</p>
                  <div className="text-[10px] text-gray-500 mb-3">
                    支持模型：{platform.models}
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={platform.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-cyber-blue/15 hover:bg-cyber-blue/25 border border-cyber-blue/25 rounded-lg text-cyber-blue text-xs font-medium transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      前往官网
                    </a>
                    <a
                      href={platform.consoleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-cyber-pink/15 hover:bg-cyber-pink/25 border border-cyber-pink/25 rounded-lg text-cyber-pink text-xs font-medium transition-colors"
                    >
                      <Crown className="w-3 h-3" />
                      获取API Key
                    </a>
                  </div>
                  <div className="mt-2 text-[10px] text-cyber-green">
                    💰 {platform.freeQuota}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-cyber-yellow/10 border border-cyber-yellow/20 rounded-xl p-3">
            <p className="text-cyber-yellow text-xs font-medium mb-1">💡 新手推荐</p>
            <p className="text-[10px] text-gray-400">
              <strong>硅基流动</strong> — 9B以下模型永久免费，新用户送2000万token，注册即用。<br/>
              <strong>智谱AI</strong> — GLM-4-Flash 永久免费，128K超长上下文，性价比最高。<br/>
              获取 API Key 后，前往底部导航「API」→ 填入 Key → 即可开始AI创作。
            </p>
          </div>
        </section>

        {/* Feedback Form */}
        <section>
          <h2 className="font-display text-lg font-medium text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-cyber-pink to-cyber-purple rounded-full" />
            意见反馈
          </h2>
          <form
            onSubmit={handleSubmit}
            className="bg-cyber-dark2/80 border border-cyber-purple/20 rounded-2xl p-4 space-y-4"
          >
            {/* Issue Type */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">问题类型</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full bg-cyber-dark/60 border border-cyber-purple/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyber-pink/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="" className="bg-cyber-dark">请选择问题类型</option>
                {issueTypes.map((type) => (
                  <option key={type} value={type} className="bg-cyber-dark">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Feedback Content */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">反馈内容</label>
              <textarea
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
                placeholder="请详细描述您遇到的问题或建议..."
                rows={4}
                className="w-full bg-cyber-dark/60 border border-cyber-purple/30 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyber-pink/50 transition-colors resize-none"
              />
            </div>

            {/* Contact Info */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">联系方式（选填）</label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="邮箱或手机号"
                className="w-full bg-cyber-dark/60 border border-cyber-purple/30 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyber-pink/50 transition-colors"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyber-pink to-cyber-purple hover:from-cyber-pink/90 hover:to-cyber-purple/90 text-white font-medium rounded-xl transition-all"
            >
              <Send className="w-4 h-4" />
              提交反馈
            </button>

            {/* Success Message */}
            {submitSuccess && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3">
                <p className="text-green-400 text-sm text-center">反馈已提交，感谢您的建议！</p>
              </div>
            )}
          </form>
        </section>

        {/* Contact Info Card */}
        <section>
          <h2 className="font-display text-lg font-medium text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-cyber-pink to-cyber-purple rounded-full" />
            联系我们
          </h2>
          <div className="bg-cyber-dark2/80 border border-cyber-purple/20 rounded-2xl p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-blue to-cyber-purple flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">客服邮箱</p>
                <p className="text-white text-sm">support@aicomic.example.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-yellow to-cyber-pink flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">工作时间</p>
                <p className="text-white text-sm">周一至周五 9:00-18:00</p>
                <p className="text-xs text-gray-500 mt-1">节假日除外，邮件将在24小时内回复</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
