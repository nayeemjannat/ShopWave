import { useState, useEffect } from 'react';
import { timeUntil } from '../utils/formatters';

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(timeUntil(targetDate));

  useEffect(() => {
    if (!targetDate) return;

    const interval = setInterval(() => {
      const remaining = timeUntil(targetDate);
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 &&
    timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return { ...timeLeft, isExpired };
}

export default useCountdown;
