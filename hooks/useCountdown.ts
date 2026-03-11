import { useState, useEffect } from 'react';

const ANNIVERSARY_DATE = new Date('2026-05-06T00:00:00');

export const useCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const diff = ANNIVERSARY_DATE.getTime() - new Date().getTime();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / 864e5),
          hours: Math.floor((diff / 36e5) % 24),
          mins: Math.floor((diff / 6e4) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, mins: 0 });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return timeLeft;
};