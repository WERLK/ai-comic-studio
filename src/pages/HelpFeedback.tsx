import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Send, Mail, Clock } from 'lucide-react';
import { AppVersion } from '@/components/AppVersion';

const faqData = [
  {
    question: '如何创建第一个漫剧作品？',
    answer: '在首页点击"创建漫剧"按钮，选择模板后开始创作。您可以通过文字描述场景和对话，AI会自动生成画面和角色。完成后可以在个人中心查看所有作品。',
  },
  {
    question: '积分如何获得？',
    answer: '完成每日任务可获得积分奖励，包括：每日登录（+10）、分享作品（+20）、作品被点赞（+5）、新手引导（+50）等。更多任务请前往积分中心查看。',
  },
  {
    question: 'VIP会员有哪些特权？',
    answer: 'VIP会员享有：无限创建漫剧作品、优先使用最新AI模型、专属VIP专属模板、去除水印、专属客服通道、每月赠送500积分等特权。',
  },
  {
    question: '如何成为VIP？',
    answer: '您可以在积分中心或个人中心点击"开通VIP"按钮，选择套餐后完成支付即可成为VIP会员。VIP有效期为开通之日起一个月。',
  },
  {
    question: '数据会自动保存吗？',
    answer: '是的，所有创作数据会自动保存在云端服务器。您可以随时在不同设备登录账号同步数据。也可以手动导出JSON文件作为备份。',
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
          <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-white transition-colors">
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
