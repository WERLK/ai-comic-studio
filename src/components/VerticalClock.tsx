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

  const year = currentTime.getFullYear();
  const month = formatNumber(currentTime.getMonth() + 1);
  const day = formatNumber(currentTime.getDate());
  const hours = formatNumber(currentTime.getHours());
  const minutes = formatNumber(currentTime.getMinutes());
  const seconds = formatNumber(currentTime.getSeconds());

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-yellow/20 to-cyber-pink/20 border border-cyber-yellow/30 flex items-center justify-center">
        <Clock className="w-4 h-4 text-cyber-yellow animate-spin" style={{ animationDuration: '10s' }} />
      </div>
      
      <div className="font-display text-lg font-bold tracking-wider flex items-center gap-2">
        <span className="text-cyber-yellow">{year}-{month}-{day}</span>
        <span className="text-gray-500">|</span>
        <span className="text-cyber-pink">{hours}:{minutes}:{seconds}</span>
      </div>
    </div>
  );
}
