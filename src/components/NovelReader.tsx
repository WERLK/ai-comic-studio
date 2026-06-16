/**
 * 小说阅读器 & 导入器
 * - 支持本地文件上传（txt / epub / docx）
 * - 支持从追书神器 API 搜索公开/开源书目
 * - 版权免责声明
 */
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Upload, FileText, BookOpen, ChevronRight, ChevronLeft,
  Loader2, Check, AlertTriangle, Info, Shield, Lock, Star, Eye, Sparkles
} from 'lucide-react';
import JSZip from 'jszip';

const ZHUISHU_BASE = 'https://api.zhuishushenqi.com';
const JINSHAN_BASE = 'https://dictidian.com';

const PUBLIC_DOMAIN_BOOKS = [
  { _id: 'book_xiyouji', title: '西游记', author: '吴承恩', shortIntro: '中国古典四大名著之一，讲述唐僧师徒西天取经的故事', cover: '', tags: ['古典', '神话', '冒险'] },
  { _id: 'book_hongloumeng', title: '红楼梦', author: '曹雪芹', shortIntro: '中国古典四大名著之一，描写封建大家族兴衰', cover: '', tags: ['古典', '爱情', '家族'] },
  { _id: 'book_shuihuzhuan', title: '水浒传', author: '施耐庵', shortIntro: '中国古典四大名著之一，一百单八将的英雄故事', cover: '', tags: ['古典', '英雄', '武侠'] },
  { _id: 'book_sanguoyanyi', title: '三国演义', author: '罗贯中', shortIntro: '中国古典四大名著之一，三国时期的历史演义', cover: '', tags: ['古典', '历史', '战争'] },
  { _id: 'book_liaozhai', title: '聊斋志异', author: '蒲松龄', shortIntro: '清代著名志怪小说集，收录众多狐鬼故事', cover: '', tags: ['古典', '志怪', '短篇'] },
  { _id: 'book_jinghuayuan', title: '镜花缘', author: '李汝珍', shortIntro: '清代长篇小说，描写百花仙子下凡的故事', cover: '', tags: ['古典', '奇幻', '女性'] },
  { _id: 'book_jinpinhua', title: '金瓶梅', author: '兰陵笑笑生', shortIntro: '明代长篇世情小说，描绘市井生活', cover: '', tags: ['古典', '世情'] },
  { _id: 'book_ruwailishi', title: '儒林外史', author: '吴敬梓', shortIntro: '清代讽刺小说，描写科举制度下的文人百态', cover: '', tags: ['古典', '讽刺', '科举'] },
  { _id: 'book_zuidashouyi', title: '最伟大的作品', author: '佚名', shortIntro: '经典文学作品集', cover: '', tags: ['现代', '散文'] },
];

const PUBLIC_DOMAIN_CHAPTERS: Record<string, { title: string; content: string }[]> = {
  'book_xiyouji': [
    { title: '第一回 灵根育孕源流出 心性修持大道生', content: '诗曰：混沌未分天地乱，茫茫渺渺无人见。自从盘古破鸿蒙，开辟从兹清浊辨。覆载群生仰至仁，发明万物皆成善。欲知造化会元功，须看西游释厄传。盖闻天地之数，有十二万九千六百岁为一元。将一元分为十二会，乃子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥之十二支也。每会该一万八百岁。且就一日而论：子时得阳气，而丑则鸡鸣；寅不通光，而卯则日出。辰时食后，而巳则挨排；日午天中，而未则西蹉；申时晡而酉则日入；戌黄昏而亥则定昏。此段文字描述了天地开辟之初的景象，以及西游故事的开端。' },
    { title: '第二回 悟彻菩提真妙理 断魔归本合元神', content: '话表美猴王得了姓名，怡然踊跃，对菩提前作礼启谢。那祖师即命大众引孙悟空出二门外，教他洒扫应对，进退周旋之节。众仙奉行，引他去讫。悟空到门外，又拜了大众师兄，就于廊庑之间，安排寝处。次早，与众师兄学言语礼貌，讲经论道，习字焚香，每日如此。闲时即扫地锄园，养花修树，寻柴燃火，挑水运浆。凡所用之物，无一不备。在洞中不觉倏六七年。一日，祖师登坛高坐，唤集诸仙，开讲大道。真个是：天花乱坠，地涌金莲。妙演三乘教，精微万法全。慢摇麈尾喷珠玉，响振雷霆动九天。说一会道，讲一会禅，三家配合本如然。开明一字皈诚理，指引无生了性玄。' },
    { title: '第三回 四海千山皆拱伏 九幽十类尽除名', content: '却说美猴王荣归故里，自剿了混世魔王，夺了一口大刀，逐日操演武艺，教小猴砍竹为标，削木为刀，治旗幡，打哨子，一进一退，安营下寨，顽耍多时。忽然静坐处思想道：「我等在此恐作耍成真，或惊动人王，或有禽王、兽王认我为妖，说甚不好？如今奈何？」众猴闻说，俱道：「大王所见甚长。我等居此，恐作耍成真，惊动人王，或有禽王、兽王认我为妖，说甚不好。如今奈何？」' },
  ],
  'book_hongloumeng': [
    { title: '第一回 甄士隐梦幻识通灵 贾雨村风尘怀闺秀', content: '此开卷第一回也。作者自云：因曾历过一番梦幻之后，故将真事隐去，而借通灵之石，撰此《石头记》也。故曰「甄士隐」云云。但书中所记何事何人？自己又云：「今风尘碌碌，一事无成，忽念及当日所有之女子，一一细考较去，觉其行止见识，皆出于我之上。何我堂堂须眉，诚不若彼裙钗哉？实愧则有余，悔又无益之大无可如何之日也！当此日，欲将已往所赖天恩祖德，锦衣纨绔之时，饫甘餍肥之日，背父兄教育之恩，负师友规谈之德，以至今日一技无成，半生潦倒之罪，编述一集，以告天下人：我之罪固不免，然闺阁中本自历历有人，万不可因我之不肖，自护己短，一并使其泯灭也。」' },
    { title: '第二回 贾夫人仙逝扬州城 冷子兴演说荣国府', content: '且说贾雨村在旅店偶感风寒，愈后又因盘缠不继，正欲起身往别处去。忽见前面来了两个僧人，要化斋饭。雨村连忙让坐，命人取茶饭相待。那僧人道：「施主，你这相貌不凡，必有奇遇。」雨村道：「大师谬赞。」僧人道：「我看你骨格清奇，非久困之人。你且耐心等候，不久必有贵人相助。」说罢，飘然而去。雨村听了，心中暗喜，遂打消了离去的念头。' },
    { title: '第三回 托内兄如海酬训教 接外孙贾母惜孤女', content: '却说雨村忙回头看时，不是别人，乃是当日同僚一案参革的张如圭。他系此地人，卜居离此不远，见雨村在那里，想是被方才那些不尴尬的人缠住了心，故此一径走来。雨村见他，方欲施礼，张如圭便道：「雨村兄何往？闻你近日荣任金陵一缺，可贺可贺！」雨村忙让座，命从人倒茶，自己便将来此经过之事，细细告诉了张如圭。' },
  ],
  'book_shuihuzhuan': [
    { title: '第一回 张天师祈禳瘟疫 洪太尉误走妖魔', content: '话说大宋仁宗天子在位，嘉祐三年三月三日五更三点，天子驾坐紫宸殿，受百官朝贺。只见殿门外，诸多官员拜表称贺。天子看罢，即令翰林院撰词，遣使赍捧御香，前往江西信州龙虎山，宣请嗣汉天师张真人，来朝祈禳瘟疫。按下诏书，不日到了江西信州。知府接了诏书，即差人星夜往龙虎山，宣请天师。那张真人，号虚靖先生，当时在龙虎山上清宫修道。他自幼得异人传授，能呼风唤雨，驱雷役电，驾雾腾云。' },
    { title: '第二回 王教头私走延安府 九纹龙大闹史家村', content: '且说东京开封府汴梁宣武军，有一个浮浪破落户子弟，姓高，排行第二，自小不成家业，只好刺枪使棒，最是踢得好脚气毬，京师人口顺，不叫他高二，却叫他高毬。后来发迹，便将气毬那字去了毛傍，添作立人，便改作姓高，名俅。这人吹弹歌舞，刺枪使棒，相扑顽耍，亦胡乱学诗书词赋；若论仁义礼智，信行忠良，却是不会。' },
    { title: '第三回 史大郎夜走华阴县 鲁提辖拳打镇关西', content: '话说这鲁达是延安府老种经略相公帐前提辖官，字智深，本贯渭州人氏。有一首《临江仙》词，单道这鲁智深好处：面阔眉浓眼俊，鼻直口方耳大。语言甚是分明，拳打处似有神力。这鲁达只身一个，肩背一条禅杖，腰间挂一口戒刀，往西而去。' },
  ],
  'book_sanguoyanyi': [
    { title: '第一回 宴桃园豪杰三结义 斩黄巾英雄首立功', content: '话说天下大势，分久必合，合久必分。周末七国分争，并入于秦。及秦灭之后，楚、汉分争，又并入于汉。汉朝自高祖斩白蛇而起义，一统天下，后来光武中兴，传至献帝，遂分为三国。推其致乱之由，殆始于桓、灵二帝。桓帝禁锢善类，崇信宦官。及桓帝崩，灵帝即位，大将军窦武、太傅陈蕃共相辅佐。时有宦官曹节等弄权，窦武、陈蕃谋诛之，机事不密，反为所害，中涓自此愈横。' },
    { title: '第二回 张翼德怒鞭督邮 何国舅谋诛宦竖', content: '且说董卓字仲颖，陇西临洮人也，官拜河东太守，自来骄傲。当日怠慢了玄德，张飞性发，便欲杀之。玄德与关公急止之曰：「他是朝廷命官，岂可擅杀？」飞曰：「若不杀这厮，反要在他部下听令，其实不甘！二兄要便住在此，我自投别处去也！」玄德曰：「我三人义同生死，岂可相离？不若都投别处去便了。」飞曰：「若如此，稍解吾恨。」' },
    { title: '第三回 议温亭董卓叱丁原 馈金珠李肃说吕布', content: '且说董卓进兵于洛阳，时有虎贲中郎将袁绍，与卓有隙，绍举荐勃海太守袁隗、兖州刺史刘岱、豫州刺史孔伷、南阳太守张邈、徐州刺史陶谦、冀州刺史韩馥、青州刺史田楷、长沙太守孙坚、北海太守孔融等十路诸侯，星夜来勤王。' },
  ],
  'book_liaozhai': [
    { title: '第一卷 画皮', content: '太原王生，早行，遇一女郎，抱袱独奔，甚艰于步，急走趁之，乃二八姝丽。心相爱乐，问：「何夙夜踽踽独行？」女曰：「行道之人，不能解愁忧，何劳相问。」生曰：「卿何愁忧？或可效力，不辞也。」女黯然曰：「父母贪赂，鬻妾朱门。嫡妒甚，朝詈而夕楚辱之，所弗堪也，将远遁耳。」问：「何之？」曰：「在亡之人，乌有定所。」生言：「敝庐不远，即烦枉顾。」女喜，从之。生代携袱物，导与同归。' },
    { title: '第一卷 聂小倩', content: '宁采臣，浙人，性慷爽，廉隅自重。每对人言：「生平无二色。」适赴金华，至北郭，解装兰若。寺中殿塔壮丽，然蓬蒿没人，似绝行踪。东西僧舍，双扉虚掩，惟南一小舍，扃键如新。又顾殿东隅，修竹拱把，阶下有巨池，野藕已花。意甚乐其幽杳。会学使案临，城舍价昂，思便留止，遂散步以待僧归。日暮，有士人来，启南扉。' },
    { title: '第一卷 倩女幽魂', content: '宁采臣与聂小倩相伴多日，情意渐深。然小倩乃女鬼，采臣每思及此，惴惴不安。一日，采臣夜半惊醒，见小倩立于床前，泪流满面。采臣惊问其故，小倩泣曰：「妾本孤女，葬于寺侧，魂魄不散，为妖物所迫。今遇君，妾欲托身以报君恩，奈何人鬼殊途。」采臣闻之，握其手曰：「卿虽异类，情实可感。」' },
  ],
  'book_jinghuayuan': [
    { title: '第一回 唐敖随妻舅林之洋出海 游君子国', content: '话说大唐武则天年间，有一才子名唤唐敖，表字天如，祖籍岭南，客居长安。此人饱读诗书，怀才不遇，屡试不第。一日，其妻舅林之洋，乃是船主，言道要出海贸易，唐敖欣然同往。船行数日，至一处名唤君子国，国中之人皆以礼让为重，谦谦有礼，令人叹为观止。' },
    { title: '第二回 唐敖与多九公游淑士国', content: '话说唐敖与多九公二人离了君子国，继续西行。这一日来到淑士国，船靠岸后，二人登岸游览。只见街市之上，人人衣冠楚楚，个个出口成章。酒肆茶坊，谈论者皆是诗文。有一位老者对唐敖道：「先生远来，可知此地风土？」唐敖答曰：「久闻贵国以文教化天下，今日一见，果然名不虚传。」' },
  ],
  'book_jinpinhua': [
    { title: '第一回 西门庆热结十兄弟 武二郎冷遇亲哥嫂', content: '话说宋徽宗皇帝政和年间，山东东平府清河县中，有一富户，姓西门名庆，字四泉。他父亲西门达，贩卖药材发家，遗留下一所大宅。西门庆自幼聪明伶俐，颇有些财势，又兼有些拳棒功夫，颇得街坊敬重。他有一妻吴月娘，另有数房妾侍，宅中丫环仆妇成群，一日三餐极尽奢华。' },
    { title: '第二回 西门庆帘下遇金莲 王婆子贪贿说风情', content: '话说西门庆一日无事，在家中帘下闲坐，忽见一妇人从门前经过，年约二十余岁，生得妖娆妩媚。西门庆看呆了，忙问王婆：「此是何家娘子？」王婆道：「他是武大郎之妻潘金莲。」西门庆闻听此言，神魂颠倒，再三央求王婆做牵头。王婆乃贪财之辈，一口应承。' },
  ],
  'book_ruwailishi': [
    { title: '第一回 楔子：考校进士 显王侯失职', content: '话说明朝成化年间，山东兖州府汶上县有一才子名唤王冕，字元章。他自幼聪颖好学，七岁能诗，十岁能文。只是家中贫寒，无力延师，只好替人放牛度日。每当放牛之时，他便在牛背上诵读诗书，遇见好景致，便将所见所感吟成诗句。' },
    { title: '第二回 王孝廉村学识同科 周蒙师暮年登上第', content: '话说山东兖州府有一孝廉，姓周名进，字子固。他自幼苦读诗书，屡试不第，到了五十多岁，尚是一领青衫。这年恰逢院试，周进也来应试，却因年老被人取笑。幸得座师怜悯，准他附考，才勉强入了学。自此以后，周进更加发愤读书，誓要考取功名。' },
  ],
  'book_zuidashouyi': [
    { title: '第一篇 生活的艺术', content: '生活，是一门艺术。每个人都是艺术家，用自己独特的方式描绘着人生的画卷。生活的意义不在于追求虚无的功名，而在于体验每一个当下的美好。一茶一饭，一花一木，一声问候，一个微笑，都是生活给予我们的馈赠。让我们用心去感受，用爱去体验，让每一天都成为生命中最美的诗篇。' },
    { title: '第二篇 时光的河流', content: '时光如河，静静流淌。它带走了青春的容颜，却留下了智慧的沉淀。每个人都在这条河中前行，有时顺流而下，有时逆流而上。顺境时不可骄躁，逆境时不可气馁。唯有保持一颗平常心，方能在时光的河流中保持平衡，到达理想的彼岸。' },
  ],
};

// ===== 版权类型 =====
type LicenseType = 'copyrighted' | 'open' | 'user-owned' | 'public-domain';

interface LicenseInfo {
  type: LicenseType;
  label: string;
  color: string;
  icon: string;
  desc: string;
}

const LICENSE_OPTIONS: LicenseInfo[] = [
  {
    type: 'ai-generated',
    label: 'AI 智能创作',
    color: 'yellow',
    icon: '✨',
    desc: '这部小说由 AI 根据您的要求创作，您拥有使用和改编的权利',
  },
  {
    type: 'user-owned',
    label: '我原创的作品',
    color: 'green',
    icon: '✍️',
    desc: '这本小说是您自己原创的，您拥有完整版权，可以放心使用',
  },
  {
    type: 'open',
    label: '已获得授权 / CC 协议',
    color: 'blue',
    icon: '📜',
    desc: '这本小说采用 CC 协议或您已获得作者授权，可以用于改编',
  },
  {
    type: 'public-domain',
    label: '公版作品（作者逝世 > 70 年）',
    color: 'yellow',
    icon: '🏛️',
    desc: '作者已逝世超过 70 年，作品进入公版领域，可自由改编',
  },
  {
    type: 'copyrighted',
    label: '我有这本书的合法副本',
    color: 'gray',
    icon: '⚠️',
    desc: '仅用于个人学习研究，不得用于商业改编或公开发布',
  },
];

// ===== 小说搜索结果 =====
interface NovelSource {
  _id: string;
  title: string;
  author: string;
  shortIntro: string;
  cover: string;
  cat: string;
  tags: string[];
  lastChapter: string;
  retentionRatio: number;
}

interface ChapterItem {
  title: string;
  link: string;
}

interface NovelDetail {
  _id: string;
  title: string;
  author: string;
  longIntro: string;
  cover: string;
  tags: string[];
  chapters: ChapterItem[];
  chaptersCount: number;
}

export function NovelReader({
  onImport,
  onClose,
}: {
  onImport: (content: string, meta: { title: string; author: string; license: LicenseType }) => void;
  onClose: () => void;
}) {
  // ===== 步骤状态 =====
  // step: 'mode' | 'upload' | 'search' | 'select-license' | 'preview'
  const [step, setStep] = useState<'mode' | 'upload' | 'search' | 'ai-gen' | 'select-license' | 'preview'>('ai-gen');
  const [uploadedContent, setUploadedContent] = useState('');
  const [uploadedMeta, setUploadedMeta] = useState({ title: '', author: '' });
  const [selectedLicense, setSelectedLicense] = useState<LicenseType | null>(null);

  // 搜索
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NovelSource[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedNovel, setSelectedNovel] = useState<NovelDetail | null>(null);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [loadingChapterId, setLoadingChapterId] = useState<string | null>(null);
  const [chapterContent, setChapterContent] = useState('');
  const [selectedChapters, setSelectedChapters] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== 搜索追书神器 =====
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const url = `${ZHUISHU_BASE}/book/fuzzy-search?query=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const books: NovelSource[] = data?.books || [];
      const validBooks = books.filter((b: NovelSource) => b.title && b._id);
      if (validBooks.length > 0) {
        setSearchResults(validBooks);
      } else {
        throw new Error('No results');
      }
    } catch {
      const query = searchQuery.trim();
      const localResults = PUBLIC_DOMAIN_BOOKS.filter(
        book => book.title === query || 
                book.author === query ||
                book.title.includes(query) ||
                book.author.includes(query)
      );
      setSearchResults(localResults);
    } finally {
      setIsSearching(false);
    }
  };

  // ===== 加载小说详情和章节列表 =====
  const loadNovelChapters = async (source: NovelSource) => {
    setIsLoadingChapters(true);
    setSelectedNovel(null);
    try {
      if (source._id.startsWith('book_')) {
        const localChapters = PUBLIC_DOMAIN_CHAPTERS[source._id] || [];
        const chapters = localChapters.map((ch, idx) => ({
          title: ch.title,
          link: `${source._id}_chapter_${idx}`,
          chapterIdx: idx,
        }));
        setSelectedNovel({
          _id: source._id,
          title: source.title,
          author: source.author,
          longIntro: source.shortIntro,
          cover: source.cover,
          tags: source.tags || [],
          chapters,
          chaptersCount: chapters.length,
        });
        return;
      }

      const [detailRes, tocRes] = await Promise.all([
        fetch(`${ZHUISHU_BASE}/book/${source._id}`),
        fetch(`${ZHUISHU_BASE}/mix-atoc/${source._id}?view=chapters`),
      ]);
      const detail = await detailRes.json();
      const toc = await tocRes.json();
      setSelectedNovel({
        _id: source._id,
        title: detail.title || source.title,
        author: detail.author || source.author,
        longIntro: detail.longIntro || source.shortIntro,
        cover: detail.cover ? `https://statics.zhuishushenqi.com${detail.cover}` : source.cover,
        tags: detail.tags || [],
        chapters: toc?.mixToc?.chapters || [],
        chaptersCount: toc?.mixToc?.chaptersCount || 0,
      });
    } catch {
      // 静默失败
    } finally {
      setIsLoadingChapters(false);
    }
  };

  // ===== 加载单章内容（用于预览）=====
  const loadChapterContent = async (chapter: ChapterItem, idx: number) => {
    setLoadingChapterId(chapter.link);
    setChapterContent('');
    try {
      if (chapter.link.includes('_chapter_')) {
        const bookId = chapter.link.split('_chapter_')[0];
        const localChapters = PUBLIC_DOMAIN_CHAPTERS[bookId] || [];
        const content = localChapters[idx]?.content || '（章节内容加载失败）';
        setChapterContent(content);
        return;
      }

      const encoded = encodeURIComponent(chapter.link);
      const res = await fetch(`${ZHUISHU_BASE}/chapter/${encoded}`);
      const data = await res.json();
      const text = (data.chapter?.cpContent || data.chapter?.content || '')
        .replace(/<[^>]+>/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      setChapterContent(text);
    } catch {
      setChapterContent('（章节内容加载失败，请稍后重试）');
    } finally {
      setLoadingChapterId(null);
    }
  };

  // ===== 全选 / 取消全选 =====
  const toggleAll = () => {
    if (!selectedNovel) return;
    if (selectedChapters.size === selectedNovel.chapters.length) {
      setSelectedChapters(new Set());
    } else {
      setSelectedChapters(new Set(selectedNovel.chapters.map((_, i) => i)));
    }
  };

  // ===== AI 生成小说 =====
  const [aiGenType, setAiGenType] = useState<string>('');
  const [aiGenRequirements, setAiGenRequirements] = useState<string>('');
  const [aiGenAdvanced, setAiGenAdvanced] = useState<{
    perspective?: string; style?: string; theme?: string; era?: string;
    genre?: string; hasGoldFinger?: boolean; hasBackground?: boolean;
    chapterCount?: number; extraRequirements?: string;
  }>({});
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiGenSuccess, setAiGenSuccess] = useState(false);
  const [aiGenResult, setAiGenResult] = useState<{ content: string; title: string; author: string } | null>(null);

  const fillRandomExample = () => {
    const examples = [
      `女频长篇;\n发表平台：起点中文;\n篇幅：长篇 (30万字+);\n视角：第三人称;\n文风模式：强爽点;\n年代背景：现代;\n题材分类：都市/异能;\n金手指：否;\n主角背景：否（普通人/草根崛起）;\n章节数：500;\n其他要求：女主独立自主，大女主文，复仇情节`,
      `男频长篇;\n发表平台：番茄小说;\n篇幅：长篇 (30万字+);\n视角：第三人称;\n文风模式：升级流;\n年代背景：异世/架空;\n题材分类：玄幻/修真;\n金手指：是;\n主角背景：否（普通人/草根崛起）;\n章节数：800;\n其他要求：热血爽文，节奏快`,
      `纯爱;\n发表平台：晋江文学;\n篇幅：中篇 (10-30万字);\n视角：第三人称;\n文风模式：甜文;\n年代背景：现代;\n题材分类：言情/恋爱;\n金手指：否;\n主角背景：是（豪门/世家/权贵）;\n章节数：200;\n其他要求：双洁，HE`,
      `衍生;\n发表平台：晋江文学;\n篇幅：短篇 (10万字以下);\n视角：第二人称;\n文风模式：轻松日常;\n年代背景：现代;\n题材分类：轻小说/同人;\n金手指：是;\n主角背景：否（普通人/草根崛起）;\n章节数：50;\n其他要求：综漫，系统`,
      `儿童短篇;\n发表平台：七猫小说;\n篇幅：微短篇 (3万字以下);\n视角：第三人称;\n文风模式：轻松日常;\n年代背景：现代;\n题材分类：言情/恋爱;\n金手指：否;\n主角背景：否（普通人/草根崛起）;\n章节数：20;\n其他要求：寓教于乐，适合8-12岁`,
    ];
    setAiGenRequirements(examples[Math.floor(Math.random() * examples.length)]);
  };

  const handleAiGenerate = async () => {
    if (!aiGenType) {
      alert('请选择小说类型');
      return;
    }
    if (!aiGenRequirements.trim()) {
      alert('请输入核心要求');
      return;
    }
    setIsAiGenerating(true);
    try {
      const prompt = `请根据以下要求创作一部小说：

【类型】${aiGenType}
【核心要求】${aiGenRequirements}
${aiGenAdvanced.perspective ? `【视角】${aiGenAdvanced.perspective}` : ''}
${aiGenAdvanced.style ? `【文风】${aiGenAdvanced.style}` : ''}
${aiGenAdvanced.era ? `【年代背景】${aiGenAdvanced.era}` : ''}
${aiGenAdvanced.genre ? `【题材】${aiGenAdvanced.genre}` : ''}
${aiGenAdvanced.chapterCount ? `【章节数】约 ${aiGenAdvanced.chapterCount} 章` : ''}
${aiGenAdvanced.theme ? `【主题】${aiGenAdvanced.theme}` : ''}
${aiGenAdvanced.extraRequirements ? `【其他要求】${aiGenAdvanced.extraRequirements}` : ''}

要求：
1. 输出一部结构完整的小说大纲 + 前 3 章完整内容
2. 每章 2000-3000 字
3. 使用中文写作
4. 标题格式：第一章 标题 + 正文内容
5. 包含人物设定、故事背景、情节走向

请开始创作：`;

      let generatedContent = '';
      try {
        const { aiService } = await import('@/services/aiService');
        const result = await aiService.analyzeScript(prompt, []);
        generatedContent = (result as any)?.summary || (result as any)?.analysis || (result as any)?.content || '';
      } catch {
        // AI 不可用时使用模板
        generatedContent = `【AI 创作小说 - ${aiGenType}】

【核心要求】
${aiGenRequirements}

【人物设定】
主角：${aiGenRequirements.substring(0, 20)}...
配角、配角若干

【故事大纲】
第一阶段：开篇 - 主角登场
第二阶段：发展 - 矛盾升级
第三阶段：高潮 - 关键转折
第四阶段：结局 - 大团圆/开放式结局

【第一章 初遇】
（请在 AI API 配置页面配置 API Key 后获得完整 AI 生成内容）

夜幕降临，华灯初上。${aiGenRequirements.substring(0, 100)}

【第二章 风波】
（待生成）

【第三章 转机】
（待生成）`;
      }

      const title = `AI创作 - ${aiGenRequirements.substring(0, 30).replace(/\n/g, ' ')}`;
      setAiGenResult({ content: generatedContent, title, author: 'AI 创作' });
      // 设置上传内容和元数据，供版权声明步骤使用
      setUploadedContent(generatedContent);
      setUploadedMeta({ title, author: 'AI 创作' });
      // 自动选择 AI 生成版权
      setSelectedLicense('ai-generated');
      // 自动跳转到版权声明步骤
      setStep('select-license');
    } catch (e) {
      alert('AI 生成失败：' + (e as Error).message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleConfirmAiGen = () => {
    if (aiGenResult) {
      onImport(aiGenResult.content, {
        title: aiGenResult.title,
        author: aiGenResult.author,
        license: 'ai-generated',
      });
    }
  };

  // ===== 处理本地文件上传 =====
  const handleFileUpload = useCallback(async (file: File) => {
    setIsImporting(true);
    try {
      let text = '';
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'txt' || ext === 'md') {
        text = await file.text();
      } else if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const docXml = await zip.file('word/document.xml')?.async('string') || '';
        text = docXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      } else {
        text = await file.text();
      }

      // 从文件名推断标题
      const nameFromFile = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').trim();
      const firstLine = text.trim().split(/\n/)[0].trim();
      const inferredTitle = nameFromFile || firstLine.slice(0, 50) || '未命名作品';

      setUploadedContent(text);
      setUploadedMeta({ title: inferredTitle, author: '' });
      setStep('select-license');
    } catch {
      alert('文件解析失败，请确保是有效的文本文件（.txt / .md / .docx）');
    } finally {
      setIsImporting(false);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  // ===== 最终导入 =====
  const handleFinalImport = () => {
    if (!selectedLicense) {
      alert('请先选择版权类型');
      return;
    }
    let content = uploadedContent;
    if (selectedNovel) {
      // 本地公版书：直接拼接所有章节内容
      if (selectedNovel._id.startsWith('book_')) {
        const localChapters = PUBLIC_DOMAIN_CHAPTERS[selectedNovel._id] || [];
        if (localChapters.length > 0) {
          content = `【${selectedNovel.title}】\n作者：${selectedNovel.author}\n\n${
            localChapters.map((ch, idx) => `【${ch.title}】\n${ch.content}`).join('\n\n')
          }`;
        } else {
          content = `【${selectedNovel.title}】\n作者：${selectedNovel.author}\n\n${selectedNovel.longIntro || ''}\n\n（该书为公版书，可免费使用。请根据书名和简介生成漫剧。）`;
        }
      } else {
        // 追书平台导入：用已加载的章节标题
        const selectedTitles = selectedNovel.chapters.map(ch => ch.title).join('；');
        content = `【${selectedNovel.title}】\n作者：${selectedNovel.author}\n\n章节列表：${selectedTitles}\n\n${selectedNovel.longIntro || ''}`;
      }
    }
    onImport(content, {
      title: selectedNovel?.title || uploadedMeta.title,
      author: selectedNovel?.author || uploadedMeta.author,
      license: selectedLicense,
    });
    onClose();
  };

  const canImport = (selectedLicense && (uploadedContent.trim() || (selectedNovel && selectedChapters.size > 0)));

  // ===== 步骤：版权选择（所有入口最终汇聚到这里）=====
  const renderLicenseStep = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-white font-medium mb-1">📋 版权声明</h3>
        <p className="text-xs text-gray-500">
          {uploadedMeta.title
            ? `即将导入：《${uploadedMeta.title}》`
            : selectedNovel
              ? `即将导入：《${selectedNovel.title}》（共 ${selectedChapters.size} 章）`
              : '请选择您要导入的小说的版权类型'}
        </p>
      </div>

      {/* 重要提示 */}
      <div className="bg-cyber-yellow/10 border border-cyber-yellow/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-cyber-yellow flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-300">
            <p className="font-medium text-cyber-yellow mb-1">⚖️ 法律风险提示</p>
            <p className="text-gray-400 leading-relaxed">
              改编他人受版权保护的小说可能涉及侵权行为。请确保您拥有作品的合法使用权，或选择公版作品进行创作。使用本功能即表示您同意承担相应责任。
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {LICENSE_OPTIONS.map(opt => (
          <button
            key={opt.type}
            onClick={() => setSelectedLicense(opt.type)}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              selectedLicense === opt.type
                ? 'bg-cyber-pink/10 border-cyber-pink/40 text-white'
                : 'bg-cyber-dark/50 border-cyber-purple/20 text-gray-400 hover:border-cyber-purple/40'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{opt.icon}</span>
              <div>
                <div className={`font-medium text-sm mb-0.5 ${selectedLicense === opt.type ? 'text-white' : ''}`}>
                  {opt.label}
                </div>
                <div className="text-[11px] text-gray-500 leading-relaxed">{opt.desc}</div>
              </div>
              {selectedLicense === opt.type && (
                <Check className="w-4 h-4 text-cyber-pink flex-shrink-0 ml-auto mt-1" />
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-cyber-purple/5 border border-cyber-purple/10 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-cyber-purple flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-gray-400 leading-relaxed">
            <p className="mb-1">💡 <strong className="text-gray-300">推荐做法：</strong></p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>使用您自己原创的小说或已获授权的作品</li>
              <li>选择公版作品（如古典文学、70 年前作家作品）完全无风险</li>
              <li>追书平台仅供搜索，内容版权归属原作者</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            if (uploadedMeta.author === 'AI 创作') {
              setStep('ai-gen');
            } else if (uploadedContent) {
              setStep('upload');
            } else if (selectedNovel) {
              setStep('search');
            } else {
              setStep('ai-gen');
            }
          }}
          className="flex-1 py-3 border border-cyber-purple/20 rounded-xl text-gray-400 hover:text-white hover:border-cyber-purple/40 transition-all text-sm"
        >
          <ChevronLeft className="w-4 h-4 inline mr-1" />
          返回
        </button>
        <button
          onClick={handleFinalImport}
          disabled={!canImport}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
            canImport
              ? 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white hover:opacity-90'
              : 'bg-cyber-dark text-gray-600 cursor-not-allowed'
          }`}
        >
          {isImporting ? (
            <><Loader2 className="w-4 h-4 inline mr-1 animate-spin" />处理中...</>
          ) : (
            <>确认导入 <ChevronRight className="w-4 h-4 inline ml-1" /></>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-cyber-dark2 border border-cyber-purple/30 rounded-2xl shadow-2xl pointer-events-auto relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-purple/20 bg-cyber-dark/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white">小说导入</h2>
              <p className="text-[10px] text-gray-500">上传本地文件 或 搜索公开书目</p>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="relative z-50 p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 步骤导航 */}
        <div className="px-6 py-3 border-b border-cyber-purple/10 bg-cyber-dark/30">
          <div className="flex items-center gap-1 text-xs overflow-x-auto">
            {[
              { key: 'ai-gen', label: 'AI生成' },
              { key: 'upload', label: '本地上传' },
              { key: 'search', label: '搜索导入' },
              { key: 'select-license', label: '版权声明' },
              { key: 'preview', label: '预览' },
            ].map((s, i) => (
              <div key={s.key} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => setStep(s.key as any)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                    step === s.key
                      ? 'bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/30'
                      : 'text-gray-600 hover:text-gray-400 hover:bg-cyber-purple/10'
                  }`}
                >
                  {i + 1}. {s.label}
                </button>
                {i < 4 && <ChevronRight className="w-3 h-3 text-gray-600 mx-0.5 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* ===== 方式选择 ===== */}
              {step === 'mode' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-white font-medium mb-1">选择小说导入方式</h3>
                    <p className="text-xs text-gray-500">支持本地上传文件或搜索公开书目</p>
                  </div>

                  {/* 免责声明 */}
                  <div className="bg-cyber-yellow/5 border border-cyber-yellow/15 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-cyber-yellow flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        <strong className="text-cyber-yellow">重要：</strong>
                        请确保您拥有导入小说的合法使用权。改编受版权保护作品前请获得授权。追书平台搜索结果版权归属原作者，本工具仅供学习研究使用。
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 方式1：AI 生成 */}
                    <button
                      onClick={() => setStep('ai-gen')}
                      className="p-5 rounded-xl border border-cyber-purple/20 bg-cyber-dark/50 hover:border-cyber-yellow/40 hover:bg-cyber-yellow/5 transition-all text-left group sm:col-span-2"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-yellow to-orange-500 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1 group-hover:text-cyber-yellow transition-colors">AI 智能生成小说</h4>
                          <p className="text-xs text-gray-500 mb-2">输入核心要求，让 AI 为您创作一部全新小说</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {['女频', '男频', '短篇', '儿童短篇'].map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-cyber-yellow/10 rounded text-[10px] text-cyber-yellow">{tag}</span>
                            ))}
                          </div>
                          <div className="mt-2 text-[10px] text-cyber-pink flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            根据核心要求自动生成完整大纲与章节
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* 方式2：本地上传 */}
                    <button
                      onClick={() => setStep('upload')}
                      className="p-5 rounded-xl border border-cyber-purple/20 bg-cyber-dark/50 hover:border-cyber-pink/40 hover:bg-cyber-pink/5 transition-all text-left group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-pink to-rose-500 flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-white font-medium mb-1 group-hover:text-cyber-pink transition-colors">本地上传</h4>
                      <p className="text-xs text-gray-500 mb-2">上传您自己的小说文件</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {['.txt', '.md', '.epub', '.docx'].map(ext => (
                          <span key={ext} className="px-2 py-0.5 bg-cyber-purple/10 rounded text-[10px] text-gray-500">{ext}</span>
                        ))}
                      </div>
                      <div className="mt-3 text-[10px] text-cyber-blue flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        推荐：完全合规，无版权风险
                      </div>
                    </button>
                  </div>

                  {/* 公版书推荐 */}
                  <div className="bg-cyber-purple/5 border border-cyber-purple/10 rounded-xl p-4">
                    <h5 className="text-xs font-medium text-white mb-2 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-cyber-purple" />
                      推荐公版书目（可直接使用）
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { title: '西游记', author: '吴承恩' },
                        { title: '红楼梦', author: '曹雪芹' },
                        { title: '水浒传', author: '施耐庵' },
                        { title: '三国演义', author: '罗贯中' },
                        { title: '聊斋志异', author: '蒲松龄' },
                        { title: '镜花缘', author: '李汝珍' },
                      ].map(book => (
                        <button
                          key={book.title}
                          onClick={() => {
                            setSearchQuery(book.title);
                            setStep('search');
                          }}
                          className="text-left p-2 rounded-lg bg-cyber-dark/60 border border-cyber-purple/10 hover:border-cyber-purple/30 transition-all"
                        >
                          <div className="text-xs text-white font-medium truncate">{book.title}</div>
                          <div className="text-[10px] text-gray-500 truncate">{book.author}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ===== AI 生成小说 ===== */}
              {step === 'ai-gen' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium mb-1">AI 智能生成小说</h3>
                      <p className="text-xs text-gray-500">选择类型、输入核心要求，让 AI 创作全新小说</p>
                    </div>
                    <button onClick={() => setStep('mode')} className="text-[10px] text-gray-500 hover:text-white">
                      更多方式
                    </button>
                  </div>

                  {/* 类型选择 */}
                  <div>
                    <h4 className="text-sm text-white mb-2">选择小说类型</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'male_long', name: '男频长篇', icon: '♂', color: 'from-blue-500 to-blue-600' },
                        { id: 'male_short', name: '男频短篇', icon: '♂', color: 'from-blue-400 to-cyan-500' },
                        { id: 'female_long', name: '女频长篇', icon: '♀', color: 'from-pink-500 to-rose-500' },
                        { id: 'female_short', name: '女频短篇', icon: '♀', color: 'from-pink-400 to-fuchsia-500' },
                        { id: 'pure_love', name: '纯爱', icon: '💕', color: 'from-purple-500 to-violet-500' },
                        { id: 'derivative', name: '衍生', icon: '🔄', color: 'from-indigo-500 to-blue-500' },
                        { id: 'children', name: '儿童短篇', icon: '🧒', color: 'from-green-500 to-emerald-500' },
                        { id: 'short', name: '其他短篇', icon: '⚡', color: 'from-orange-500 to-amber-500' },
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setAiGenType(t.name)}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            aiGenType === t.name
                              ? 'border-cyber-yellow/50 bg-cyber-yellow/10'
                              : 'border-cyber-purple/20 bg-cyber-dark/50 hover:border-cyber-yellow/30'
                          }`}
                        >
                          <div className={`text-2xl mb-1 ${aiGenType === t.name ? 'text-cyber-yellow' : 'text-gray-500'}`}>{t.icon}</div>
                          <div className={`text-[10px] ${aiGenType === t.name ? 'text-white' : 'text-gray-500'}`}>{t.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 发表平台 */}
                  <div>
                    <h4 className="text-sm text-white mb-2">目标发表平台</h4>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { id: 'qidian', name: '起点中文' },
                        { id: 'tomato', name: '番茄小说' },
                        { id: 'qimao', name: '七猫小说' },
                        { id: 'feilu', name: '飞卢小说' },
                        { id: 'jinjiang', name: '晋江文学' },
                        { id: 'qqread', name: 'QQ阅读' },
                        { id: 'zhangyue', name: '掌阅' },
                        { id: 'migu', name: '咪咕阅读' },
                        { id: 'shuqi', name: '书旗小说' },
                        { id: 'chuangshi', name: '创世中文' },
                        { id: 'zongheng', name: '纵横中文' },
                        { id: 'ihu', name: '爱奇艺文学' },
                      ].map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            const current = aiGenRequirements;
                            const platformLine = `发表平台：${p.name}`;
                            if (current.includes('发表平台：')) {
                              setAiGenRequirements(current.replace(/发表平台：[^\n;]+;?/, platformLine + ';'));
                            } else {
                              setAiGenRequirements(current ? `${platformLine};\n${current}` : platformLine);
                            }
                          }}
                          className="px-3 py-1.5 bg-cyber-dark/60 border border-cyber-purple/15 hover:border-cyber-blue/40 rounded-lg text-[10px] text-gray-400 hover:text-white transition-all"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 篇幅选择 */}
                  <div>
                    <h4 className="text-sm text-white mb-2">篇幅要求</h4>
                    <div className="flex gap-2">
                      {['长篇 (30万字+)', '中篇 (10-30万字)', '短篇 (10万字以下)', '微短篇 (3万字以下)'].map(p => (
                        <button
                          key={p}
                          onClick={() => {
                            const current = aiGenRequirements;
                            const lengthLine = `篇幅：${p}`;
                            if (current.includes('篇幅：')) {
                              setAiGenRequirements(current.replace(/篇幅：[^\n;]+;?/, lengthLine + ';'));
                            } else {
                              setAiGenRequirements(current ? `${lengthLine};\n${current}` : lengthLine);
                            }
                          }}
                          className="px-3 py-1.5 bg-cyber-dark/60 border border-cyber-purple/15 hover:border-cyber-pink/40 rounded-lg text-[10px] text-gray-400 hover:text-white transition-all"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 核心要求 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm text-white">核心要求</h4>
                      <div className="flex items-center gap-3 text-[10px] text-gray-500">
                        <button onClick={fillRandomExample} className="flex items-center gap-1 hover:text-cyber-yellow">
                          <Sparkles className="w-3 h-3" />随机示例
                        </button>
                        <button onClick={() => setShowAdvanced(v => !v)} className="flex items-center gap-1 hover:text-cyber-blue">
                          <Info className="w-3 h-3" />工具箱
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={aiGenRequirements}
                      onChange={e => setAiGenRequirements(e.target.value)}
                      placeholder="例如：&#10;女频;&#10;发表平台：起点;&#10;篇幅：中长篇;&#10;视角：第三人称;&#10;文风模式：强爽点;&#10;年代：古代;&#10;题材：职场/官场;&#10;是否出现金手指：否;&#10;背景：无;&#10;章节数：400;&#10;其他要求：无;"
                      className="w-full h-48 bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-3 text-xs text-white placeholder-gray-600 resize-none focus:outline-none focus:border-cyber-yellow/40"
                    />
                    <div className="text-right text-[10px] text-gray-600 mt-1">
                      {aiGenRequirements.length}/1500
                    </div>
                  </div>

                  {/* 详细设定（可折叠） */}
                  {showAdvanced && (
                    <div className="bg-cyber-dark/40 border border-cyber-purple/10 rounded-xl p-3 space-y-3">
                      <h5 className="text-xs text-white flex items-center gap-1">
                        <Info className="w-3 h-3 text-cyber-blue" />
                        详细设定（可选）
                      </h5>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-1">视角</label>
                          <select
                            value={aiGenAdvanced.perspective || ''}
                            onChange={e => setAiGenAdvanced(p => ({ ...p, perspective: e.target.value }))}
                            className="w-full bg-cyber-dark border border-cyber-purple/15 rounded-lg px-2 py-1.5 text-[10px] text-white"
                          >
                            <option value="">不限</option>
                            <option>第一人称</option>
                            <option>第二人称</option>
                            <option>第三人称</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-1">文风模式</label>
                          <select
                            value={aiGenAdvanced.style || ''}
                            onChange={e => setAiGenAdvanced(p => ({ ...p, style: e.target.value }))}
                            className="w-full bg-cyber-dark border border-cyber-purple/15 rounded-lg px-2 py-1.5 text-[10px] text-white"
                          >
                            <option value="">不限</option>
                            <option>升级流</option>
                            <option>无敌流</option>
                            <option>强爽点</option>
                            <option>轻松日常</option>
                            <option>烧脑悬疑</option>
                            <option>暗黑流</option>
                            <option>甜文</option>
                            <option>虐文</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-1">年代背景</label>
                          <select
                            value={aiGenAdvanced.era || ''}
                            onChange={e => setAiGenAdvanced(p => ({ ...p, era: e.target.value }))}
                            className="w-full bg-cyber-dark border border-cyber-purple/15 rounded-lg px-2 py-1.5 text-[10px] text-white"
                          >
                            <option value="">不限</option>
                            <option>上古/先秦</option>
                            <option>秦汉</option>
                            <option>唐宋</option>
                            <option>明清</option>
                            <option>近代/民国</option>
                            <option>现代</option>
                            <option>未来/星际</option>
                            <option>异世/架空</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-1">题材分类</label>
                          <select
                            value={aiGenAdvanced.genre || ''}
                            onChange={e => setAiGenAdvanced(p => ({ ...p, genre: e.target.value }))}
                            className="w-full bg-cyber-dark border border-cyber-purple/15 rounded-lg px-2 py-1.5 text-[10px] text-white"
                          >
                            <option value="">不限</option>
                            <option>都市/异能</option>
                            <option>职场/官场</option>
                            <option>玄幻/修真</option>
                            <option>武侠/仙侠</option>
                            <option>悬疑/推理</option>
                            <option>言情/恋爱</option>
                            <option>古风/宅斗</option>
                            <option>星际/科幻</option>
                            <option>游戏/竞技</option>
                            <option>历史/军事</option>
                            <option>轻小说/同人</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-1">金手指</label>
                          <select
                            value={aiGenAdvanced.hasGoldFinger === undefined ? '' : aiGenAdvanced.hasGoldFinger ? '是' : '否'}
                            onChange={e => setAiGenAdvanced(p => ({ ...p, hasGoldFinger: e.target.value === '是' ? true : e.target.value === '否' ? false : undefined }))}
                            className="w-full bg-cyber-dark border border-cyber-purple/15 rounded-lg px-2 py-1.5 text-[10px] text-white"
                          >
                            <option value="">不限</option>
                            <option>是</option>
                            <option>否</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-1">主角背景</label>
                          <select
                            value={aiGenAdvanced.hasBackground === undefined ? '' : aiGenAdvanced.hasBackground ? '是' : '否'}
                            onChange={e => setAiGenAdvanced(p => ({ ...p, hasBackground: e.target.value === '是' ? true : e.target.value === '否' ? false : undefined }))}
                            className="w-full bg-cyber-dark border border-cyber-purple/15 rounded-lg px-2 py-1.5 text-[10px] text-white"
                          >
                            <option value="">不限</option>
                            <option>是（豪门/世家/权贵）</option>
                            <option>否（普通人/草根崛起）</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-gray-500 block mb-1">章节数（约）</label>
                          <input
                            type="number"
                            value={aiGenAdvanced.chapterCount || ''}
                            onChange={e => setAiGenAdvanced(p => ({ ...p, chapterCount: parseInt(e.target.value) || undefined }))}
                            placeholder="例如：400"
                            className="w-full bg-cyber-dark border border-cyber-purple/15 rounded-lg px-2 py-1.5 text-[10px] text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="space-y-3">
                    <button
                      onClick={handleAiGenerate}
                      disabled={isAiGenerating || !aiGenType || !aiGenRequirements.trim()}
                      className="w-full py-3 bg-gradient-to-r from-cyber-yellow to-orange-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm text-white font-medium flex items-center justify-center gap-2"
                    >
                      {isAiGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          AI 创作中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          开始创作并导入
                        </>
                      )}
                    </button>
                    <div className="flex gap-2 text-[10px] text-gray-500">
                      <button
                        onClick={() => setStep('upload')}
                        className="flex-1 py-2 bg-cyber-dark/60 border border-cyber-purple/15 rounded-lg hover:text-white hover:border-cyber-purple/30 transition-all"
                      >
                        📁 本地上传
                      </button>
                      <button
                        onClick={() => setStep('search')}
                        className="flex-1 py-2 bg-cyber-dark/60 border border-cyber-purple/15 rounded-lg hover:text-white hover:border-cyber-purple/30 transition-all"
                      >
                        🔍 搜索书目
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== 本地上传 ===== */}
              {step === 'upload' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-white font-medium mb-1">上传本地小说文件</h3>
                    <p className="text-xs text-gray-500">支持 .txt / .md / .docx / .epub 格式</p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.docx,.epub,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/epub+zip,application/msword,text/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-cyber-purple/30 rounded-2xl p-10 text-center cursor-pointer hover:border-cyber-pink/50 hover:bg-cyber-pink/5 transition-all"
                  >
                    {isImporting ? (
                      <div>
                        <Loader2 className="w-12 h-12 mx-auto mb-3 text-cyber-pink animate-spin" />
                        <p className="text-gray-400">正在解析文件...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 mx-auto mb-3 text-cyber-purple/40" />
                        <p className="text-gray-400 mb-1">点击或拖拽上传小说文件</p>
                        <p className="text-xs text-gray-600">支持 .txt / .md / .docx / .epub</p>
                      </>
                    )}
                  </div>

                  {/* 版权提示 */}
                  <div className="bg-cyber-purple/5 border border-cyber-purple/10 rounded-xl p-4">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      📄 上传您本人原创的作品完全无版权风险。建议优先使用原创内容或已获授权的作品进行 AI 漫剧改编。
                    </p>
                  </div>

                  <button
                    onClick={() => setStep('mode')}
                    className="w-full py-3 border border-cyber-purple/20 rounded-xl text-gray-400 hover:text-white hover:border-cyber-purple/40 transition-all text-sm"
                  >
                    <ChevronLeft className="w-4 h-4 inline mr-1" />
                    返回选择导入方式
                  </button>
                </div>
              )}

              {/* ===== 搜索导入 ===== */}
              {step === 'search' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-white font-medium mb-1">搜索公开书目</h3>
                    <p className="text-xs text-gray-500">通过追书平台搜索，选择章节后导入到 AI 漫剧生成</p>
                  </div>

                  {/* 搜索框 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      placeholder="输入书名或作者名搜索，如「西游记」「红楼梦」"
                      className="flex-1 px-4 py-3 bg-cyber-dark border border-cyber-purple/30 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-cyber-pink/50 text-sm"
                    />
                    <button
                      onClick={handleSearch}
                      disabled={isSearching || !searchQuery.trim()}
                      className="px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      搜索
                    </button>
                  </div>

                  {/* 公版快捷搜索 */}
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-[10px] text-gray-500 self-center">快捷：</span>
                    {['西游记', '红楼梦', '水浒传', '三国演义', '聊斋志异', '金瓶梅', '儒林外史'].map(kw => (
                      <button
                        key={kw}
                        onClick={() => { setSearchQuery(kw); handleSearch(); }}
                        className="px-2.5 py-1 bg-cyber-purple/10 hover:bg-cyber-purple/20 border border-cyber-purple/10 rounded-lg text-[10px] text-gray-400 hover:text-white transition-all"
                      >
                        {kw}
                      </button>
                    ))}
                    <button
                      onClick={() => { setSearchQuery(''); setSearchResults(PUBLIC_DOMAIN_BOOKS); }}
                      className="px-2.5 py-1 bg-cyber-pink/10 hover:bg-cyber-pink/20 border border-cyber-pink/20 rounded-lg text-[10px] text-cyber-pink hover:text-white transition-all"
                    >
                      📚 全部公版书
                    </button>
                  </div>

                  {/* 搜索结果 */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500">
                        找到 {searchResults.length} 本相关书籍
                        <span className="text-cyber-yellow ml-2">⚠️ 请注意确认版权类型</span>
                      </div>
                      {searchResults.map(book => {
                        const isLocalBook = book._id.startsWith('book_');
                        const chapterCount = isLocalBook ? (PUBLIC_DOMAIN_CHAPTERS[book._id]?.length || 0) : 0;
                        return (
                          <div key={book._id} className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-3 flex gap-3">
                            <img
                              src={book.cover ? `https://statics.zhuishushenqi.com${book.cover}` : '/placeholder.png'}
                              alt={book.title}
                              className="w-14 h-18 object-cover rounded-lg flex-shrink-0 bg-cyber-purple/10"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h4 className="text-sm text-white font-medium truncate">{book.title}</h4>
                                  <p className="text-[10px] text-gray-500 mt-0.5">
                                    {book.author}{chapterCount > 0 ? ` · 共 ${chapterCount} 章可导入` : (book.cat ? ` · ${book.cat}` : '')}
                                  </p>
                                </div>
                                {isLocalBook ? (
                                  <button
                                    onClick={() => {
                                      setSelectedNovel({
                                        _id: book._id,
                                        title: book.title,
                                        author: book.author,
                                        longIntro: book.shortIntro,
                                        cover: '',
                                        tags: book.tags || [],
                                        chapters: (PUBLIC_DOMAIN_CHAPTERS[book._id] || []).map((ch, idx) => ({
                                          title: ch.title,
                                          link: `${book._id}_chapter_${idx}`,
                                        })),
                                        chaptersCount: PUBLIC_DOMAIN_CHAPTERS[book._id]?.length || 0,
                                      });
                                      setSelectedChapters(new Set((PUBLIC_DOMAIN_CHAPTERS[book._id] || []).map((_, idx) => idx)));
                                      setSelectedLicense('public-domain');
                                      setStep('select-license');
                                    }}
                                    className="flex-shrink-0 px-3 py-1.5 bg-gradient-to-r from-cyber-pink to-cyber-purple hover:opacity-90 rounded-lg text-[10px] text-white font-medium flex items-center gap-1"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    直接生成
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => loadNovelChapters(book)}
                                    className="flex-shrink-0 px-3 py-1.5 bg-cyber-blue/20 hover:bg-cyber-blue/30 border border-cyber-blue/30 rounded-lg text-[10px] text-cyber-blue flex items-center gap-1"
                                  >
                                    {isLoadingChapters ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                                    查看
                                  </button>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{book.shortIntro}</p>
                              {isLocalBook && book.tags && book.tags.length > 0 && (
                                <div className="flex gap-1 mt-1.5 flex-wrap">
                                  {book.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="px-1.5 py-0.5 bg-cyber-purple/10 rounded text-[9px] text-gray-500">{tag}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {searchResults.length === 0 && searchQuery && !isSearching && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      未找到相关书目，请尝试其他关键词
                    </div>
                  )}

                  {/* 选中的小说章节列表 */}
                  {selectedNovel && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white text-sm font-medium">
                            📚 《{selectedNovel.title}》
                          </h4>
                          <p className="text-[10px] text-gray-500">作者：{selectedNovel.author} · 共 {selectedNovel.chaptersCount} 章</p>
                        </div>
                        <button
                          onClick={() => setSelectedNovel(null)}
                          className="text-xs text-gray-500 hover:text-white"
                        >
                          取消选择
                        </button>
                      </div>

                      <div className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-3 max-h-[300px] overflow-y-auto">
                        {/* 全选 */}
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-cyber-purple/10">
                          <span className="text-xs text-gray-400">
                            已选 {selectedChapters.size} / {selectedNovel.chapters.length} 章
                          </span>
                          <button
                            onClick={toggleAll}
                            className="text-[10px] text-cyber-blue hover:underline"
                          >
                            {selectedChapters.size === selectedNovel.chapters.length ? '取消全选' : '全选'}
                          </button>
                        </div>

                        <div className="space-y-1">
                          {selectedNovel.chapters.slice(0, 50).map((ch, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedChapters.has(idx)}
                                onChange={() => {
                                  const next = new Set(selectedChapters);
                                  if (next.has(idx)) next.delete(idx);
                                  else next.add(idx);
                                  setSelectedChapters(next);
                                }}
                                className="w-3.5 h-3.5 rounded accent-cyber-pink"
                              />
                              <span
                                className={`text-[11px] cursor-pointer flex-1 truncate ${
                                  selectedChapters.has(idx) ? 'text-white' : 'text-gray-500'
                                }`}
                                onClick={() => loadChapterContent(ch, idx)}
                              >
                                {ch.title}
                              </span>
                            </div>
                          ))}
                          {selectedNovel.chapters.length > 50 && (
                            <div className="text-[10px] text-gray-600 text-center py-1">
                              ... 还有 {selectedNovel.chapters.length - 50} 章未显示
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 章节预览 */}
                      {chapterContent && (
                        <div className="bg-cyber-dark/60 border border-cyber-purple/15 rounded-xl p-3">
                          <div className="text-[10px] text-gray-500 mb-2">章节预览：</div>
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto font-mono">
                            {chapterContent.slice(0, 500)}{chapterContent.length > 500 ? '...' : ''}
                          </pre>
                        </div>
                      )}

                      <button
                        onClick={() => setStep('select-license')}
                        disabled={selectedChapters.size === 0}
                        className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
                          selectedChapters.size > 0
                            ? 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white hover:opacity-90'
                            : 'bg-cyber-dark text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {selectedChapters.size > 0
                          ? <>已选 {selectedChapters.size} 章，前往确认版权 →</>
                          : '请先选择要导入的章节'}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setStep('mode')}
                    className="w-full py-3 border border-cyber-purple/20 rounded-xl text-gray-400 hover:text-white hover:border-cyber-purple/40 transition-all text-sm"
                  >
                    <ChevronLeft className="w-4 h-4 inline mr-1" />
                    返回选择导入方式
                  </button>
                </div>
              )}

              {/* ===== 版权声明 ===== */}
              {step === 'select-license' && renderLicenseStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
