import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetTime: Date | null;
}

const CountdownTimer = ({ targetTime }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!targetTime) {
      setTimeLeft('00:00:00');
      return;
    }

    const tick = () => {
      const diff = targetTime.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return (
    <span className="font-mono text-primary text-glow animate-pulse-glow text-2xl sm:text-3xl tracking-widest">
      {timeLeft}
    </span>
  );
};

export default CountdownTimer;
