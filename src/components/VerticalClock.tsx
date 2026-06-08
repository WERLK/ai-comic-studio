import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function VerticalClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  const dateStr = currentTime.toISOString().split('T')[0]; // 2026-06-08
  const timeStr = currentTime.toTimeString().split(' ')[0]; // 23:08:07

  const dateParts = dateStr.split('-'); // ['2026', '06', '08']
  const timeParts = timeStr.split(':'); // ['23', '08', '07']

  return (
    <div className="flex flex-col items-center gap-2">
      {/* 时钟图标 */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyber-yellow/20 to-cyber-pink/20 border border-cyber-yellow/30 flex items-center justify-center">
        <Clock className="w-5 h-5 text-cyber-yellow animate-spin" style={{ animationDuration: '10s' }} />
      </div>
      
      {/* 日期时间竖排显示 */}
      <div className="flex flex-col items-center">
        {/* 年 */}
        <div className="font-display text-xl font-bold text-cyber-yellow tracking-wider">
          {dateParts[0]}
        </div>
        
        <div className="w-px h-2 bg-cyber-yellow/30 my-1" />
        
        {/* 月 */}
        <div className="font-display text-xl font-bold text-cyber-yellow tracking-wider">
          {dateParts[1]}
        </div>
        
        <div className="w-px h-2 bg-cyber-yellow/30 my-1" />
        
        {/* 日 */}
        <div className="font-display text-xl font-bold text-cyber-yellow tracking-wider">
          {dateParts[2]}
        </div>
        
        <div className="w-2 h-2 rounded-full bg-cyber-yellow/50 my-2" />
        
        {/* 时 */}
        <div className="font-display text-xl font-bold text-cyber-yellow tracking-wider">
          {timeParts[0]}
        </div>
        
        <div className="w-px h-2 bg-cyber-yellow/30 my-1" />
        
        {/* 分 */}
        <div className="font-display text-xl font-bold text-cyber-yellow tracking-wider">
          {timeParts[1]}
        </div>
        
        <div className="w-px h-2 bg-cyber-yellow/30 my-1" />
        
        {/* 秒 */}
        <div className="font-display text-xl font-bold text-cyber-yellow tracking-wider">
          {timeParts[2]}
        </div>
      </div>
    </div>
  );
}
