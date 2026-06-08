import { useState, useEffect, useRef } from 'react';
import { Gift, Star, Coins, Video, Play } from 'lucide-react';
import { useAuthStore } from '@/stores';

const PRIZES = [
  { id: 1, name: '谢谢参与', points: 0, color: '#374151', probability: 30 },
  { id: 2, name: '5积分', points: 5, color: '#6B7280', probability: 25 },
  { id: 3, name: '10积分', points: 10, color: '#10B981', probability: 20 },
  { id: 4, name: '20积分', points: 20, color: '#3B82F6', probability: 12 },
  { id: 5, name: '50积分', points: 50, color: '#8B5CF6', probability: 7 },
  { id: 6, name: '100积分', points: 100, color: '#F59E0B', probability: 4 },
  { id: 7, name: '神秘大奖', points: 200, color: '#EC4899', probability: 2 },
];

const AD_DURATION = 10; // 广告时长10秒

interface LuckyWheelProps {
  onClose?: () => void;
}

// 获取今天的日期字符串
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

// 从 localStorage 加载抽奖状态
function loadWheelState() {
  try {
    const saved = localStorage.getItem('luckyWheelState');
    if (saved) {
      const parsed = JSON.parse(saved);
      const today = getTodayKey();
      if (parsed.date !== today) {
        // 如果不是今天的数据，重置免费次数
        return { dailyFreeSpins: 3, adSpins: parsed.adSpins || 0, date: today };
      }
      return { ...parsed, date: today };
    }
  } catch (e) {
    console.error('Failed to load wheel state:', e);
  }
  return { dailyFreeSpins: 3, adSpins: 0, date: getTodayKey() };
}

// 保存抽奖状态到 localStorage
function saveWheelState(state: { dailyFreeSpins: number; adSpins: number }) {
  try {
    localStorage.setItem('luckyWheelState', JSON.stringify({ ...state, date: getTodayKey() }));
  } catch (e) {
    console.error('Failed to save wheel state:', e);
  }
}

export function LuckyWheel({ onClose }: LuckyWheelProps) {
  const { addPoints } = useAuthStore();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<typeof PRIZES[0] | null>(null);
  const [showResult, setShowResult] = useState(false);
  const initialState = loadWheelState();
  const [dailyFreeSpins, setDailyFreeSpins] = useState(initialState.dailyFreeSpins);
  const [adSpins, setAdSpins] = useState(initialState.adSpins);
  const [showAd, setShowAd] = useState(false);
  const [adTimeLeft, setAdTimeLeft] = useState(AD_DURATION);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const adIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 保存状态到 localStorage
  useEffect(() => {
    saveWheelState({ dailyFreeSpins, adSpins });
  }, [dailyFreeSpins, adSpins]);

  // 绘制转盘
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const sliceAngle = (2 * Math.PI) / PRIZES.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    PRIZES.forEach((prize, i) => {
      const startAngle = i * sliceAngle - Math.PI / 2;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();

      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(prize.name, radius - 20, 5);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#1F2937';
    ctx.fill();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('抽奖', centerX, centerY);

  }, []);

  // 广告倒计时
  useEffect(() => {
    if (showAd && adTimeLeft > 0) {
      adIntervalRef.current = setInterval(() => {
        setAdTimeLeft(prev => {
          if (prev <= 1) {
            // 广告看完，发放次数并显示成功
            clearInterval(adIntervalRef.current!);
            setAdSpins(prev => prev + 1);
            setAdCompleted(true);
            // 1.5秒后自动关闭广告弹窗
            setTimeout(() => {
              setShowAd(false);
              setIsWatchingAd(false);
              setAdTimeLeft(AD_DURATION);
              setAdCompleted(false);
            }, 1500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (adIntervalRef.current) {
        clearInterval(adIntervalRef.current);
      }
    };
  }, [showAd, adTimeLeft]);

  // 开始看广告
  const startWatchAd = () => {
    setShowAd(true);
    setIsWatchingAd(true);
    setAdTimeLeft(AD_DURATION);
  };

  // 跳过广告（不获得次数）
  const skipAd = () => {
    if (adIntervalRef.current) {
      clearInterval(adIntervalRef.current);
    }
    setShowAd(false);
    setIsWatchingAd(false);
    setAdTimeLeft(AD_DURATION);
  };

  const spin = (useAdSpin: boolean) => {
    if (isSpinning) return;
    if (useAdSpin && adSpins <= 0) return;
    if (!useAdSpin && dailyFreeSpins <= 0) return;

    if (useAdSpin) {
      setAdSpins(prev => prev - 1);
    } else {
      setDailyFreeSpins(prev => prev - 1);
    }

    setIsSpinning(true);
    setShowResult(false);
    setResult(null);

    const random = Math.random() * 100;
    let cumulative = 0;
    let selectedPrize = PRIZES[0];

    for (const prize of PRIZES) {
      cumulative += prize.probability;
      if (random <= cumulative) {
        selectedPrize = prize;
        break;
      }
    }

    const sliceAngle = 360 / PRIZES.length;
    const prizeIndex = PRIZES.findIndex(p => p.id === selectedPrize.id);
    const baseRotation = 360 * 5;
    const prizeRotation = 360 - (prizeIndex * sliceAngle + sliceAngle / 2);
    const totalRotation = baseRotation + prizeRotation + Math.random() * 20 - 10;

    setRotation(prev => prev + totalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setResult(selectedPrize);
      setShowResult(true);

      if (selectedPrize.points > 0) {
        setTimeout(() => {
          addPoints(selectedPrize.points, `大转盘获得: ${selectedPrize.name}`);
        }, 500);
      }
    }, 4000);
  };

  const totalSpins = dailyFreeSpins + adSpins;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-cyber-dark2 rounded-3xl p-6 max-w-md w-full mx-4 border border-cyber-purple/30">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-pink to-cyber-purple flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-display text-xl font-bold text-white">幸运大转盘</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
              ✕
            </button>
          )}
        </div>

        {/* 抽奖次数显示 */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="bg-cyber-dark/50 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-gray-400">免费次数</p>
            <p className="font-display text-2xl font-bold text-cyber-yellow">{dailyFreeSpins}</p>
          </div>
          <div className="bg-cyber-dark/50 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-gray-400">广告次数</p>
            <p className="font-display text-2xl font-bold text-cyber-pink">{adSpins}</p>
          </div>
        </div>

        {/* 转盘 */}
        <div className="relative flex justify-center mb-6">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={280}
              height={280}
              className="transition-transform duration-[4000ms] ease-out"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
            {/* 指针 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1">
              <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-cyber-yellow" />
            </div>
          </div>
        </div>

        {/* 抽奖按钮 */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => spin(false)}
            disabled={isSpinning || dailyFreeSpins <= 0}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              isSpinning || dailyFreeSpins <= 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyber-blue to-cyber-purple text-white shadow-neon hover:shadow-lg'
            }`}
          >
            <Star className="w-5 h-5 inline mr-2" />
            免费抽奖 ({dailyFreeSpins})
          </button>
          <button
            onClick={() => spin(true)}
            disabled={isSpinning || adSpins <= 0}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              isSpinning || adSpins <= 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyber-yellow to-cyber-pink text-cyber-dark shadow-neon hover:shadow-lg'
            }`}
          >
            <Coins className="w-5 h-5 inline mr-2" />
            广告抽奖 ({adSpins})
          </button>
        </div>

        {/* 看广告按钮 */}
        <button
          onClick={startWatchAd}
          disabled={isWatchingAd}
          className="w-full py-3 rounded-xl font-medium transition-all bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-neon hover:shadow-lg mb-4"
        >
          <Video className="w-5 h-5 inline mr-2" />
          {isWatchingAd ? '广告观看中...' : '看广告获取抽奖次数'}
        </button>

        {/* 奖品列表 */}
        <div className="bg-cyber-dark/50 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-2 text-center">奖品列表</p>
          <div className="grid grid-cols-4 gap-2">
            {PRIZES.map((prize) => (
              <div
                key={prize.id}
                className="text-center p-2 rounded-lg"
                style={{ backgroundColor: prize.color + '40' }}
              >
                <p className="text-xs text-white font-medium">{prize.name}</p>
                <p className="text-[10px] text-gray-400">{prize.probability}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* 广告弹窗 */}
        {showAd && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90">
            <div className="bg-cyber-dark2 rounded-3xl p-8 max-w-sm w-full mx-4 text-center border border-cyber-purple/30">
              {adCompleted ? (
                <>
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-bounce">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-white mb-2">获得抽奖次数!</h3>
                  <p className="text-gray-400 mb-4">广告观看完毕，+1次抽奖机会</p>
                  <div className="flex justify-center gap-2 items-center">
                    <Coins className="w-5 h-5 text-cyber-yellow" />
                    <span className="text-cyber-yellow font-bold">+1</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-white mb-2">观看广告</h3>
                  <p className="text-gray-400 mb-4">请完整观看广告获取抽奖次数</p>

                  {/* 倒计时显示 */}
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="#374151"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="#10B981"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={2 * Math.PI * 58}
                        strokeDashoffset={2 * Math.PI * 58 * (1 - (AD_DURATION - adTimeLeft) / AD_DURATION)}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-display text-4xl font-bold text-white">{adTimeLeft}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mb-4">广告剩余 {adTimeLeft} 秒</p>

                  <button
                    onClick={skipAd}
                    className="px-6 py-2 bg-gray-700 text-gray-300 rounded-xl font-medium hover:bg-gray-600 transition-colors"
                  >
                    跳过
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* 结果弹窗 */}
        {showResult && result && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80">
            <div className="bg-cyber-dark2 rounded-3xl p-8 text-center border border-cyber-purple/30 animate-bounce-in">
              <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                result.points > 0 ? 'bg-gradient-to-br from-cyber-yellow to-cyber-pink' : 'bg-gray-700'
              }`}>
                {result.points > 0 ? (
                  <Coins className="w-10 h-10 text-cyber-dark" />
                ) : (
                  <span className="text-3xl">😢</span>
                )}
              </div>
              <h3 className="font-display text-2xl font-bold text-white mb-2">
                {result.points > 0 ? '恭喜获得!' : '谢谢参与'}
              </h3>
              <p className="text-xl font-bold mb-4" style={{ color: result.color }}>
                {result.name}
              </p>
              {result.points > 0 && (
                <p className="text-cyber-yellow text-lg mb-4">+{result.points} 积分</p>
              )}
              <button
                onClick={() => setShowResult(false)}
                className="px-6 py-2 bg-gradient-to-r from-cyber-pink to-cyber-purple text-white rounded-xl font-medium"
              >
                确定
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}