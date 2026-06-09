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

  const pad = (num: number) => String(num).padStart(2, '0');

  const year = currentTime.getFullYear();
  const month = pad(currentTime.getMonth() + 1);
  const day = pad(currentTime.getDate());
  const hours = pad(currentTime.getHours());
  const minutes = pad(currentTime.getMinutes());
  const seconds = pad(currentTime.getSeconds());

  const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];
  const weekday = weekdayNames[currentTime.getDay()];

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-cyber-dark2/60 border border-cyber-purple/20">
      <Clock className="w-4 h-4 text-cyber-yellow" />
      <div className="font-mono text-sm md:text-base flex items-center gap-2 leading-tight">
        <span className="text-cyber-yellow">{year}.{month}.{day}</span>
        <span className="text-gray-500 text-xs">周{weekday}</span>
        <span className="text-cyber-pink font-semibold">{hours}:{minutes}:{seconds}</span>
      </div>
    </div>
  );
}
