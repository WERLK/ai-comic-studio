import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ExternalLink, Bookmark, Star, Zap, Users, Gift,
  BookOpen, TrendingUp, Megaphone, ChevronRight, Search, Filter,
  Copy, Check, Smartphone, Globe, Building, Sparkles, Trophy, DollarSign, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/common';
import { AppVersion } from '@/components/AppVersion';

interface PlatformInfo {
  id: string;
  name: string;
  brand: string;
  description: string;
  platforms: string[];
  categories: string[];
  urls: { label: string; url: string }[];
  highlights: string[];
  tips: string[];
  features: string[];
  contact: { email?: string; phone?: string; wechat?: string };
  audience: string;
  joinTips: string;
  commissionRate: string;
}

const PLATFORMS: PlatformInfo[] = [
  {
    id: 'qidian',
    name: '起点读书',
    brand: '阅文集团',
    description: '中国最大的正版网络文学平台之一，拥有海量原创作者资源和完整的推广达人体系。起点读书的达人中心支持阅读推广、书评分享、书单推荐等多种变现方式。',
    platforms: ['iOS', 'Android', 'Web', 'iPad'],
    categories: ['玄幻', '都市', '科幻', '历史', '言情', '仙侠', '军事', '游戏', '竞技', '现实', '悬疑', '轻小说'],
    urls: [
      { label: '起点达人中心', url: 'https://www.qidian.com/author/' },
      { label: '作者入驻', url: 'https://author.qidian.com/' },
      { label: '推广计划', url: 'https://www.qidian.com/' },
      { label: '作家助手 App', url: 'https://www.qidian.com/' },
    ],
    highlights: ['大神作者签约', '月票榜推广', '年度作家榜', '新人创作扶持'],
    tips: ['阅读量高的作品分成比例更优', '书评达人月榜可获得官方推荐位', '新书可申请官方推荐位'],
    features: ['作者端 App', '大数据推荐', '电子版权', '有声书合作', '影视IP开发'],
    contact: { email: 'contact@qidian.com' },
    audience: '原创作者、书评达人、推广机构',
    joinTips: '注册起点账号后在作者中心申请成为签约作者',
    commissionRate: '50%-70% 分成',
  },
  {
    id: 'fanqie',
    name: '番茄小说',
    brand: '抖音集团 / 字节跳动',
    description: '抖音旗下的免费阅读平台，背靠字节跳动的流量和技术优势，番茄小说的推广达人计划整合了抖音短视频推广能力，达人可获得丰厚的广告分成和推广奖励。',
    platforms: ['iOS', 'Android', 'Web', '抖音小程序'],
    categories: ['都市', '玄幻', '历史', '言情', '脑洞', '悬疑', '科幻', '二次元', '轻小说', '体育'],
    urls: [
      { label: '番茄小说官网', url: 'https://fanqienovel.com/' },
      { label: '番茄作家助手', url: 'https://fanqienovel.com/' },
      { label: '作者签约入口', url: 'https://fanqienovel.com/' },
      { label: '抖音达人推广', url: 'https://creator.douyin.com/' },
      { label: '巨量引擎合作', url: 'https://e.oceanengine.com/' },
    ],
    highlights: ['免费小说阅读', '短视频联合推广', '全勤奖励丰厚', '作品影视化机会多'],
    tips: ['抖音流量加持更容易爆', '新人也有机会拿到官方推广位', '番茄的全勤奖力度大'],
    features: ['免费阅读模式', '广告分成', '短视频联动', 'AI推荐系统', 'IP衍生开发'],
    contact: { email: 'contact@fanqienovel.com' },
    audience: '原创作者、抖音达人、短视频创作者',
    joinTips: '注册番茄账号后下载番茄作家助手App申请签约',
    commissionRate: '全勤 + 广告分成 + 推广奖励',
  },
  {
    id: 'qimao',
    name: '七猫中文网',
    brand: '七猫文化传媒',
    description: '国内领先的中文免费阅读平台，拥有完整的作者招募体系和推广达人合作计划。七猫的推广平台与微信生态深度整合，适合朋友圈/公众号等私域推广。',
    platforms: ['iOS', 'Android', 'Web', '微信公众号', '微信小程序'],
    categories: ['都市', '玄幻', '言情', '历史', '军事', '悬疑', '科幻', '同人'],
    urls: [
      { label: '七猫中文网', url: 'https://www.qimao.com/' },
      { label: '作者入驻通道', url: 'https://author.qimao.com/' },
      { label: '推广达人中心', url: 'https://www.qimao.com/' },
      { label: '合作推广计划', url: 'https://www.qimao.com/' },
    ],
    highlights: ['免费阅读模式', '微信生态整合', '私域推广分成', 'AI技术辅助创作'],
    tips: ['七猫的分成机制对新人友好', '私域流量推广效果明显', '与公众号联动是优势'],
    features: ['免费阅读', '广告分成', '微信推广', '作者社区', '免费创作工具'],
    contact: { email: 'bd@qimao.com' },
    audience: '原创作者、自媒体人、微信公众号运营者',
    joinTips: '通过七猫中文网作者入驻通道注册并签约',
    commissionRate: '40%-60% 广告分成',
  },
  {
    id: 'zongheng',
    name: '纵横中文网',
    brand: '百度集团 / 完美世界',
    description: '老牌网络文学平台，由完美世界和百度联合运营。纵横中文网拥有完善的作者签约体系和推广达人计划，尤其在男频网文领域有深厚积累。',
    platforms: ['iOS', 'Android', 'Web', 'iPadOS'],
    categories: ['玄幻', '奇幻', '都市', '历史', '军事', '科幻', '游戏', '竞技', '同人', '二次元'],
    urls: [
      { label: '纵横中文网', url: 'https://www.zongheng.com/' },
      { label: '作者中心', url: 'https://author.zongheng.com/' },
      { label: '签约申请', url: 'https://www.zongheng.com/' },
      { label: '推广合作', url: 'https://www.zongheng.com/' },
    ],
    highlights: ['老牌平台口碑好', '男频资源强', '作者奖励稳定', '与百度搜索联动'],
    tips: ['纵横在男频读者中认可度高', '大神作家资源丰富', '百度搜索流量加持'],
    features: ['作者社区', '月度榜单', '大神计划', '有声书开发', '漫画改编'],
    contact: { email: 'contact@zongheng.com' },
    audience: '原创作者、资深网文读者、男频推广达人',
    joinTips: '在纵横作者中心注册后提交签约申请',
    commissionRate: '签约作者 50%-80% 分成',
  },
  {
    id: 'jjwxc',
    name: '晋江文学城',
    brand: '晋江原创',
    description: '国内最具影响力的女频文学原创平台，晋江文学城以高品质的原创言情、纯爱、同人作品闻名，是女频作者首选的发表平台之一。晋江的推广体系与读者深度绑定。',
    platforms: ['iOS', 'Android', 'Web', 'iPadOS'],
    categories: ['言情', '纯爱', '原创', '同人', '古代言情', '现代言情', '幻想言情', '未来架空'],
    urls: [
      { label: '晋江文学城', url: 'https://www.jjwxc.net/' },
      { label: '作者申请', url: 'https://www.jjwxc.net/register.php' },
      { label: '读者推广计划', url: 'https://www.jjwxc.net/' },
      { label: 'VIP 作品中心', url: 'https://www.jjwxc.net/' },
    ],
    highlights: ['女频文学领头羊', '读者付费意愿高', '作品IP开发丰富', '社区氛围浓厚'],
    tips: ['晋江的读者忠诚度高', 'V文订阅分成可长期收益', '同人作品在晋江有特色优势'],
    features: ['VIP订阅', '评论互动', '作者专栏', '编辑签约', '作品排行榜'],
    contact: { email: 'help@jjwxc.com' },
    audience: '女频作者、纯爱创作者、言情推广达人',
    joinTips: '注册晋江账号后申请成为作者并签约',
    commissionRate: '订阅分成 + 霸王票等奖励',
  },
  {
    id: 'feilu',
    name: '飞卢小说网',
    brand: '飞卢信息科技',
    description: '以读者投稿和快速更新著称的网文平台，飞卢的推广达人体系非常完善，特别适合脑洞文、爽文类作品的推广。飞卢的分成机制对新人作者非常友好。',
    platforms: ['iOS', 'Android', 'Web'],
    categories: ['都市', '玄幻', '脑洞', '同人', '科幻', '历史', '网游', '动漫', '轻小说'],
    urls: [
      { label: '飞卢小说网', url: 'https://b.faloo.com/' },
      { label: '作者中心', url: 'https://b.faloo.com/author/' },
      { label: '飞卢推广', url: 'https://b.faloo.com/' },
      { label: '推广达人', url: 'https://b.faloo.com/' },
    ],
    highlights: ['读者投稿量大', '更新速度快', '新人友好', '分成机制透明'],
    tips: ['飞卢的读者对脑洞文接受度高', '推荐榜单位置对新人友好', '日更新量影响排名'],
    features: ['日更新推荐', '读者投票', '榜单系统', '订阅分成', '作者社区'],
    contact: { email: 'service@faloo.com' },
    audience: '脑洞文作者、爽文创作者、快速更新达人',
    joinTips: '注册飞卢账号后在作者中心申请签约',
    commissionRate: '45%-65% 订阅分成',
  },
  {
    id: 'shuqi',
    name: '书旗小说',
    brand: '阿里巴巴 / 阿里文学',
    description: '阿里文学旗下的阅读品牌，书旗小说的推广达人计划与阿里电商生态深度绑定，达人不仅可以推广作品，还能通过淘宝、天猫等渠道实现多场景变现。',
    platforms: ['iOS', 'Android', 'Web', '淘宝', 'UC浏览器'],
    categories: ['都市', '玄幻', '言情', '历史', '科幻', '军事', '悬疑', '二次元', '游戏', '同人'],
    urls: [
      { label: '书旗小说官网', url: 'https://www.shuqi.com/' },
      { label: '阿里文学合作', url: 'https://www.shuqi.com/' },
      { label: '作者入驻', url: 'https://www.shuqi.com/' },
      { label: 'UC推广计划', url: 'https://www.uc.cn/' },
    ],
    highlights: ['阿里生态资源', '多渠道流量入口', '淘宝推广联动', 'UC浏览器加持'],
    tips: ['书旗可通过淘宝、UC等多端入口获得流量', '阿里生态推广分成叠加收益', '适合电商+小说的跨界推广'],
    features: ['阿里电商联动', 'UC信息流', '多媒体合作', '内容电商', 'IP衍生'],
    contact: { email: 'service@aliwenxue.com' },
    audience: '原创作者、电商达人、内容创作者',
    joinTips: '在书旗小说官网的作者入口注册并签约',
    commissionRate: '50%-70% + 电商推广收益',
  },
  {
    id: '17k',
    name: '17K小说网',
    brand: '中文在线',
    description: '中文在线旗下的大型原创文学平台，17K小说网拥有完善的作者培养体系和推广达人计划。17K特别注重对新人作者的扶持，提供从创作培训到签约推广的一条龙服务。',
    platforms: ['iOS', 'Android', 'Web', 'iPadOS'],
    categories: ['都市', '玄幻', '历史', '军事', '科幻', '言情', '游戏', '竞技', '悬疑', '同人'],
    urls: [
      { label: '17K 小说网', url: 'https://www.17k.com/' },
      { label: '作者签约', url: 'https://author.17k.com/' },
      { label: '推广中心', url: 'https://www.17k.com/' },
      { label: '网大公开课', url: 'https://www.17k.com/' },
    ],
    highlights: ['新人扶持力度大', '作者培训体系完善', '中文在线资源', 'IP孵化成熟'],
    tips: ['17K的网大公开课免费教写作', '新人福利体系完善', '适合从零基础起步'],
    features: ['作者培训', '网大公开课', '编辑指导', '全勤奖励', 'IP开发'],
    contact: { email: 'service@17k.com' },
    audience: '新人作者、网文爱好者、培训学员',
    joinTips: '注册17K账号后在作者中心申请签约',
    commissionRate: '50%-70% 作品分成',
  },
  {
    id: 'yuewen',
    name: '阅文作家专区',
    brand: '阅文集团',
    description: '阅文集团旗下统一的作者服务平台，涵盖起点、创世、云起、潇湘书院等多个子品牌的作者服务。阅文的推广达人体系提供跨平台的推广能力和IP开发机会。',
    platforms: ['iOS', 'Android', 'Web', '作家助手'],
    categories: ['男频', '女频', '青春', '玄幻', '都市', '科幻', '历史', '军事', '游戏', '竞技', '悬疑', '体育', '现实', '轻小说'],
    urls: [
      { label: '阅文作家专区', url: 'https://yc.qq.com/' },
      { label: '作家助手', url: 'https://www.qidian.com/' },
      { label: '作家培训计划', url: 'https://yc.qq.com/' },
      { label: 'IP 开发合作', url: 'https://yc.qq.com/' },
      { label: '微信读书推广', url: 'https://weread.qq.com/' },
      { label: 'QQ阅读', url: 'https://ubook.qq.com/' },
    ],
    highlights: ['国内最大文学IP库', '影视化改编机会多', '腾讯生态资源', '多平台联动'],
    tips: ['阅文的IP开发体系成熟，优秀作品有机会影视化', '腾讯系流量加持', '作家助手提供全场景创作体验'],
    features: ['多平台联动', '作家助手', 'IP开发', '影视化', '有声书', '漫画改编'],
    contact: { email: 'author@yuewen.com' },
    audience: '原创作者、IP开发者、内容创业者',
    joinTips: '通过阅文作家专区或作家助手App申请签约',
    commissionRate: '50%-75% 分成 + IP收益',
  },
  {
    id: 'chuangshi',
    name: '创世中文网',
    brand: '阅文集团 / 腾讯',
    description: '阅文集团旗下的综合性原创文学平台，创世中文网的作者招募和推广体系与QQ阅读、微信读书等腾讯系产品深度整合，推广达人可获得多端流量加持。',
    platforms: ['iOS', 'Android', 'Web', '微信读书', 'QQ阅读'],
    categories: ['玄幻', '都市', '历史', '军事', '科幻', '游戏', '竞技', '现实', '悬疑', '言情', '同人'],
    urls: [
      { label: '创世中文网', url: 'https://chuangshi.qq.com/' },
      { label: '作者中心', url: 'https://chuangshi.qq.com/' },
      { label: '推广计划', url: 'https://chuangshi.qq.com/' },
      { label: 'QQ阅读推广', url: 'https://ubook.qq.com/' },
    ],
    highlights: ['腾讯生态加持', '微信读书联动', 'QQ阅读流量', '新人作者友好'],
    tips: ['创世在男频都市和游戏文方面有优势', '腾讯系产品引流效果明显', '适合与微信生态结合推广'],
    features: ['腾讯生态', '多端阅读', '榜单系统', '作者社区', '编辑签约'],
    contact: { email: 'contact@chuangshi.qq.com' },
    audience: '男频作者、腾讯生态推广达人',
    joinTips: '注册创世中文网账号后在作者中心申请签约',
    commissionRate: '50%-70% 作品分成',
  },
  {
    id: 'yunqi',
    name: '云起书院',
    brand: '阅文集团',
    description: '阅文集团旗下的女频原创文学平台，云起书院专注于为女性读者和作者服务，提供从创作、编辑到推广、签约、分成的一条龙服务，女频资源丰富。',
    platforms: ['iOS', 'Android', 'Web'],
    categories: ['言情', '玄幻言情', '古代言情', '现代言情', '浪漫青春', '科幻未来', '悬疑推理', '同人'],
    urls: [
      { label: '云起书院', url: 'https://yunqi.qq.com/' },
      { label: '作者入驻', url: 'https://yunqi.qq.com/' },
      { label: '推广计划', url: 'https://yunqi.qq.com/' },
      { label: 'VIP签约', url: 'https://yunqi.qq.com/' },
    ],
    highlights: ['女频文学专业平台', '言情资源丰富', '读者付费意愿强', '编辑资源完善'],
    tips: ['云起在古言、现言、青春言情领域有深厚积累', '言情读者付费习惯好', '编辑一对一指导'],
    features: ['VIP订阅', '作者专栏', '女频推广', '编辑指导', '言情IP开发'],
    contact: { email: 'service@yunqi.qq.com' },
    audience: '女频作者、言情作家、青春文学推广达人',
    joinTips: '在云起书院作者入口注册并签约',
    commissionRate: '50%-70% 分成',
  },
  {
    id: 'hongxiu',
    name: '红袖读书',
    brand: '阅文集团',
    description: '专注于女性文学的在线阅读平台，红袖读书汇集了大量原创言情、都市、古代、悬疑等作品，是女频作者推广作品的重要渠道之一，推广体系完善。',
    platforms: ['iOS', 'Android', 'Web'],
    categories: ['言情', '都市', '古代', '现代', '悬疑', '玄幻', '奇幻', '同人'],
    urls: [
      { label: '红袖读书', url: 'https://www.hongxiu.com/' },
      { label: '作者入驻', url: 'https://www.hongxiu.com/' },
      { label: '推广中心', url: 'https://www.hongxiu.com/' },
      { label: 'VIP作品', url: 'https://www.hongxiu.com/' },
    ],
    highlights: ['女性读者为主', '言情作品资源丰富', '订阅分成稳定', '社区氛围活跃'],
    tips: ['红袖读书的言情读者群体稳定', '订阅分成适合长期收益', '作者社区活跃，可互相推广'],
    features: ['VIP订阅', '读者评论', '作者社区', '订阅分成', '榜单推荐'],
    contact: { email: 'service@hongxiu.com' },
    audience: '女频作者、言情推广达人',
    joinTips: '注册红袖读书账号后在作者中心申请签约',
    commissionRate: '45%-65% 订阅分成',
  },
  {
    id: 'xiaoxiang',
    name: '潇湘书院',
    brand: '阅文集团',
    description: '历史悠久的女频原创文学平台，潇湘书院以古代言情和宫斗文闻名。潇湘书院的推广体系与阅文集团资源深度整合，提供从签约、推广到IP开发的全流程服务。',
    platforms: ['iOS', 'Android', 'Web'],
    categories: ['古代言情', '宫斗', '玄幻言情', '现代言情', '穿越', '重生', '历史', '悬疑推理'],
    urls: [
      { label: '潇湘书院', url: 'https://www.xxsy.net/' },
      { label: '作者中心', url: 'https://www.xxsy.net/' },
      { label: '推广计划', url: 'https://www.xxsy.net/' },
      { label: '签约申请', url: 'https://www.xxsy.net/' },
    ],
    highlights: ['女频老牌平台', '古言宫斗特色', '阅文资源加持', '读者忠诚度高'],
    tips: ['潇湘书院的古言读者非常专业', '宫斗、权谋文在潇湘有天然优势', '编辑对新人有耐心指导'],
    features: ['VIP订阅', '作者社区', '编辑指导', '榜单推荐', 'IP孵化'],
    contact: { email: 'service@xxsy.net' },
    audience: '古言作者、宫斗权谋文作者、女频推广达人',
    joinTips: '在潇湘书院作者入口注册后申请签约',
    commissionRate: '50%-70% 作品分成',
  },
  {
    id: 'haokan',
    name: '好看小说',
    brand: '阅文集团',
    description: '阅文集团旗下的全品类小说阅读平台，好看小说提供简洁的阅读体验和多维度的推广体系，特别适合新人作者尝试网络文学创作，推广门槛低。',
    platforms: ['iOS', 'Android', 'Web'],
    categories: ['全品类', '都市', '玄幻', '言情', '历史', '科幻', '悬疑', '游戏', '竞技'],
    urls: [
      { label: '好看小说', url: 'https://www.haokan.com/' },
      { label: '作者入驻', url: 'https://www.haokan.com/' },
      { label: '推广计划', url: 'https://www.haokan.com/' },
    ],
    highlights: ['全品类覆盖', '新人友好', '推广门槛低', '简洁阅读体验'],
    tips: ['好看小说适合快速试水网络文学', '推广门槛不高，新人容易起步', '全品类覆盖可尝试不同题材'],
    features: ['全品类收录', '简洁界面', '推广入口', '作者服务', '榜单推荐'],
    contact: { email: 'service@haokan.com' },
    audience: '新人作者、全品类推广达人',
    joinTips: '在好看小说官网的作者入口注册并签约',
    commissionRate: '40%-60% 作品分成',
  },
  {
    id: 'zhuishu',
    name: '追书神器',
    brand: '追书神器',
    description: '追书神器是国内用户量最大的小说搜索和阅读工具之一。其开放平台允许第三方开发者和推广达人接入搜索API，实现小说内容的聚合推广。适合做小说搜索类产品。',
    platforms: ['iOS', 'Android', 'Web', '开放 API'],
    categories: ['全品类搜索', '玄幻', '都市', '言情', '历史', '科幻', '军事', '悬疑', '游戏', '竞技', '轻小说', '同人'],
    urls: [
      { label: '追书神器官网', url: 'https://www.zhuishushenqi.com/' },
      { label: 'API 开放平台', url: 'https://api.zhuishushenqi.com/' },
      { label: '作者中心', url: 'https://www.zhuishushenqi.com/' },
      { label: '推广合作', url: 'https://www.zhuishushenqi.com/' },
    ],
    highlights: ['聚合搜索能力强', '开放API接口', '海量书籍收录', '用户基数大'],
    tips: ['追书神器的API适合做搜索推广类产品', '用户量大但需注意版权问题', '建议结合原创内容推广'],
    features: ['小说搜索', '开放API', '阅读推荐', '排行榜'],
    contact: { email: 'contact@zhuishushenqi.com' },
    audience: '开发者、搜索推广达人、API接入者',
    joinTips: '通过追书神器开放平台申请API接入',
    commissionRate: '按API调用计费/合作分成',
  },
];

export function NovelPromotionCenter() {
  const navigate = useNavigate();
  const [activePlatform, setActivePlatform] = useState<PlatformInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('全部');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1500);
  };

  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const filteredPlatforms = PLATFORMS.filter(p => {
    const matchQuery = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.categories.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeCategory === '全部') return matchQuery;
    const categoryMap: Record<string, PlatformInfo[]> = {};
    PLATFORMS.forEach(pl => {
      pl.categories.forEach(cat => {
        if (!categoryMap[cat]) categoryMap[cat] = [];
        categoryMap[cat].push(pl);
      });
    });

    const matchCategory = p.categories.some(cat => cat === activeCategory) ||
      (activeCategory === '男频' && ['玄幻', '都市', '科幻', '历史', '军事', '游戏', '竞技', '悬疑', '同人'].some(c => p.categories.includes(c))) ||
      (activeCategory === '女频' && ['言情', '纯爱', '古代言情', '现代言情', '幻想言情', '同人'].some(c => p.categories.includes(c))) ||
      (activeCategory === '综合' && p.categories.length >= 8);

    return matchQuery && matchCategory;
  });

  const categories = ['全部', '综合', '男频', '女频', '玄幻', '都市', '言情', '科幻', '历史', '同人'];

  return (
    <div className="min-h-screen bg-cyber-bg text-white">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-30 bg-cyber-bg/90 backdrop-blur-xl border-b border-cyber-purple/20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-cyber-purple/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-lg flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-cyber-pink" />
              小说平台推广达人中心
            </h1>
            <p className="text-[10px] text-gray-500 mt-0.5">
              正版小说发布平台 · 推广达人入驻 · 官方合作通道
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 bg-cyber-pink/10 border border-cyber-pink/20 rounded-lg">
              <Bookmark className="w-3.5 h-3.5 text-cyber-pink" />
              <span className="text-xs text-cyber-pink font-medium">{PLATFORMS.length} 个平台</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 说明横幅 */}
        <div className="bg-gradient-to-r from-cyber-pink/10 to-cyber-purple/10 border border-cyber-pink/20 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-pink to-rose-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-white mb-1">为什么要对接小说平台推广达人中心？</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div className="bg-cyber-dark/50 rounded-xl p-3 border border-cyber-purple/10">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-white font-medium">推广分成</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    通过推广小说作品获得 40%-80% 的订阅、广告、全勤等多元化收益分成
                  </p>
                </div>
                <div className="bg-cyber-dark/50 rounded-xl p-3 border border-cyber-purple/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-white font-medium">官方认证</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    成为平台官方认证的推广达人，享受官方推荐位、流量扶持和活动资源
                  </p>
                </div>
                <div className="bg-cyber-dark/50 rounded-xl p-3 border border-cyber-purple/10">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-cyber-blue" />
                    <span className="text-xs text-white font-medium">IP 合作</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    有机会参与影视、有声书、漫画、游戏等 IP 衍生项目的合作开发
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-cyber-dark/60 border border-cyber-purple/20 rounded-2xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索平台名称、品牌或题材..."
                className="w-full pl-10 pr-4 py-2.5 bg-cyber-bg border border-cyber-purple/30 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-cyber-pink/50 transition-colors"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white shadow-lg shadow-cyber-pink/20'
                      : 'bg-cyber-purple/10 border border-cyber-purple/20 text-gray-400 hover:text-white hover:border-cyber-pink/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 平台列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {filteredPlatforms.map(platform => (
            <div
              key={platform.id}
              className="bg-cyber-dark/80 border border-cyber-purple/20 rounded-2xl overflow-hidden hover:border-cyber-pink/40 transition-all group cursor-pointer"
              onClick={() => setActivePlatform(platform)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white truncate">{platform.name}</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {platform.brand}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {platform.categories.slice(0, 2).map(cat => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 bg-cyber-purple/10 rounded-lg text-[9px] text-gray-400"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-3">
                  {platform.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {platform.highlights.slice(0, 4).map(h => (
                    <span
                      key={h}
                      className="px-2 py-1 bg-cyber-pink/10 border border-cyber-pink/20 rounded-lg text-[10px] text-cyber-pink"
                    >
                      <Star className="w-3 h-3 inline mr-1" />
                      {h}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-cyber-purple/10">
                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {platform.audience.slice(0, 10)}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {platform.commissionRate}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-cyber-pink transition-colors" />
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5">
                <div className="grid grid-cols-2 gap-2">
                  {platform.urls.slice(0, 2).map(urlItem => (
                    <button
                      key={urlItem.label}
                      onClick={e => {
                        e.stopPropagation();
                        handleOpenUrl(urlItem.url);
                      }}
                      className="px-3 py-2 bg-cyber-purple/10 hover:bg-cyber-purple/20 border border-cyber-purple/20 hover:border-cyber-pink/30 rounded-xl text-[11px] text-gray-400 hover:text-white transition-all flex items-center justify-between group/btn"
                    >
                      <span className="truncate">{urlItem.label}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0 ml-2 text-cyber-purple group-hover/btn:text-cyber-pink transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPlatforms.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 mx-auto text-gray-600 mb-3" />
            <p className="text-sm text-gray-500">未找到匹配的平台，请调整搜索条件</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('全部'); }}
              className="mt-3 px-4 py-2 bg-cyber-purple/20 hover:bg-cyber-purple/30 border border-cyber-purple/30 rounded-xl text-xs text-gray-400 hover:text-white transition-all"
            >
              重置搜索
            </button>
          </div>
        )}

        {/* 底部快速导航 */}
        <div className="bg-cyber-dark/60 border border-cyber-purple/20 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            快速入驻通道
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {PLATFORMS.slice(0, 12).map(p => (
              <button
                key={p.id}
                onClick={() => handleOpenUrl(p.urls[0]?.url || '')}
                className="px-3 py-2.5 bg-gradient-to-br from-cyber-purple/20 to-cyber-pink/10 hover:from-cyber-pink/20 hover:to-cyber-purple/20 border border-cyber-purple/20 hover:border-cyber-pink/40 rounded-xl text-xs text-gray-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 版权和免责声明 */}
        <div className="bg-cyber-yellow/5 border border-cyber-yellow/10 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-cyber-yellow flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-gray-400 leading-relaxed">
              <p className="mb-2">
                <strong className="text-cyber-yellow">重要声明：</strong>
                本页面仅收集和展示正版小说发布平台的官方推广、作者入驻等链接信息。所有平台链接均指向各平台官方网站。
              </p>
              <p className="mb-2">
                <strong className="text-white">版权提示：</strong>
                改编他人受版权保护的小说作品请先获得原作者或平台的合法授权。建议优先使用原创作品、已获授权作品或公版作品进行创作。
              </p>
              <p>
                <strong className="text-white">入驻建议：</strong>
                各平台推广政策、分成比例和奖励机制会动态调整，请以各平台官方最新公告为准。入驻前建议仔细阅读各平台的作者服务协议和推广规则。
              </p>
            </div>
          </div>
        </div>

        {/* 版本信息 */}
        <AppVersion />
      </div>

      {/* 平台详情弹窗 */}
      {activePlatform && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-8 bg-cyber-dark2 border border-cyber-purple/30 rounded-2xl shadow-2xl">
            {/* 弹窗头部 */}
            <div className="px-6 py-5 border-b border-cyber-purple/20 bg-gradient-to-r from-cyber-pink/10 to-cyber-purple/10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-white">{activePlatform.name}</h2>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" />
                      {activePlatform.brand}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActivePlatform(null)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-cyber-purple/20 rounded-xl transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {activePlatform.highlights.map(h => (
                  <span
                    key={h}
                    className="px-2.5 py-1 bg-cyber-pink/10 border border-cyber-pink/20 rounded-lg text-[10px] text-cyber-pink"
                  >
                    <Star className="w-3 h-3 inline mr-1" />
                    {h}
                  </span>
                ))}
              </div>
            </div>

            {/* 弹窗内容 */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* 平台简介 */}
              <div className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-4">
                <h3 className="text-xs font-bold text-white mb-2">平台简介</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{activePlatform.description}</p>
              </div>

              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-4">
                  <h4 className="text-[10px] text-gray-500 mb-2 flex items-center gap-1.5">
                    <Globe className="w-3 h-3" />
                    支持平台
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {activePlatform.platforms.map(pl => (
                      <span
                        key={pl}
                        className="px-2 py-1 bg-cyber-purple/10 rounded-lg text-[10px] text-gray-400"
                      >
                        {pl}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-4">
                  <h4 className="text-[10px] text-gray-500 mb-2 flex items-center gap-1.5">
                    <Users className="w-3 h-3" />
                    适合人群
                  </h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    {activePlatform.audience}
                  </p>
                </div>

                <div className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-4">
                  <h4 className="text-[10px] text-gray-500 mb-2 flex items-center gap-1.5">
                    <DollarSign className="w-3 h-3" />
                    分成比例
                  </h4>
                  <p className="text-sm text-green-400 font-medium">
                    {activePlatform.commissionRate}
                  </p>
                </div>

                <div className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-4">
                  <h4 className="text-[10px] text-gray-500 mb-2 flex items-center gap-1.5">
                    <Smartphone className="w-3 h-3" />
                    支持题材
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {activePlatform.categories.slice(0, 6).map(cat => (
                      <span
                        key={cat}
                        className="px-2 py-1 bg-cyber-purple/10 rounded-lg text-[9px] text-gray-400"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 推广达人中心链接 */}
              <div className="bg-cyber-dark/60 border border-cyber-pink/20 rounded-xl p-4">
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyber-pink" />
                  推广达人中心 · 官方链接
                </h3>
                <div className="space-y-2">
                  {activePlatform.urls.map(urlItem => (
                    <div
                      key={urlItem.label}
                      className="flex items-center gap-2 bg-cyber-bg/50 border border-cyber-purple/15 rounded-xl p-3 hover:border-cyber-pink/30 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-gray-400 mb-0.5">{urlItem.label}</div>
                        <div className="text-[10px] text-gray-600 font-mono truncate">{urlItem.url}</div>
                      </div>
                      <button
                        onClick={() => handleCopyUrl(urlItem.url)}
                        className="flex-shrink-0 p-1.5 text-gray-500 hover:text-cyber-pink hover:bg-cyber-pink/10 rounded-lg transition-all"
                        title="复制链接"
                      >
                        {copiedUrl === urlItem.url ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenUrl(urlItem.url)}
                        className="flex-shrink-0 px-3 py-1.5 bg-cyber-pink/20 hover:bg-cyber-pink/30 border border-cyber-pink/30 rounded-lg text-[10px] text-cyber-pink hover:text-white transition-all flex items-center gap-1"
                      >
                        访问
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 入驻建议 */}
              <div className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-4">
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-cyber-blue" />
                  入驻建议
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-2">
                  {activePlatform.joinTips}
                </p>
                <div className="space-y-1.5 mt-3">
                  {activePlatform.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-gray-500">
                      <Star className="w-3 h-3 text-cyber-yellow flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 平台特色功能 */}
              <div className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-4">
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  平台特色功能
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activePlatform.features.map(feat => (
                    <div
                      key={feat}
                      className="px-3 py-2 bg-cyber-purple/10 border border-cyber-purple/20 rounded-xl text-[11px] text-gray-400"
                    >
                      ✓ {feat}
                    </div>
                  ))}
                </div>
              </div>

              {/* 联系方式 */}
              <div className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-4">
                <h3 className="text-xs font-bold text-white mb-2">联系方式</h3>
                {activePlatform.contact.email && (
                  <div className="text-[11px] text-gray-400 flex items-center gap-2">
                    <span className="text-gray-500">📧 邮箱：</span>
                    <span className="font-mono">{activePlatform.contact.email}</span>
                    <button
                      onClick={() => handleCopyUrl(activePlatform.contact.email!)}
                      className="ml-auto text-[10px] text-cyber-purple hover:text-cyber-pink transition-colors"
                    >
                      {copiedUrl === activePlatform.contact.email ? '✓ 已复制' : '复制'}
                    </button>
                  </div>
                )}
                {!activePlatform.contact.email && (
                  <p className="text-[11px] text-gray-500">请通过上方官方链接进入平台获取详细联系方式</p>
                )}
              </div>
            </div>

            {/* 弹窗底部 */}
            <div className="px-6 py-4 border-t border-cyber-purple/20 bg-cyber-dark/50 flex items-center justify-between">
              <p className="text-[10px] text-gray-600">
                以上链接会在新窗口打开各平台官方网站
              </p>
              <button
                onClick={() => setActivePlatform(null)}
                className="px-5 py-2 bg-gradient-to-r from-cyber-pink to-cyber-purple rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
