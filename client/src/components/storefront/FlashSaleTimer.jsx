import React from 'react';
import useCountdown from '../../hooks/useCountdown';

export const FlashSaleTimer = ({ endsAt }) => {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(endsAt);

  if (isExpired || !endsAt) return null;

  const totalHours = days * 24 + hours;
  const isUrgent = totalHours === 0 && minutes < 60;

  const formatNum = (num) => String(num).padStart(2, '0');

  return (
    <div className={`inline-flex items-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-155 dark:border-red-900/50 px-3.5 py-1.5 rounded-full shadow-sm text-xs font-bold text-red-600 dark:text-red-400 ${
      isUrgent ? 'animate-pulse' : ''
    }`}>
      <span className="flex items-center gap-1">
        <span>🔥</span>
        <span className="uppercase tracking-wider">Ends In:</span>
      </span>
      <div className="flex items-center gap-1 font-mono text-sm tracking-wide">
        {days > 0 && (
          <>
            <span>{formatNum(days)}</span>
            <span className="text-[10px] font-semibold text-red-400">d</span>
            <span className="text-red-350">:</span>
          </>
        )}
        <span>{formatNum(hours)}</span>
        <span className="text-[10px] font-semibold text-red-400">h</span>
        <span className="text-red-350">:</span>
        <span>{formatNum(minutes)}</span>
        <span className="text-[10px] font-semibold text-red-400">m</span>
        <span className="text-red-350">:</span>
        <span>{formatNum(seconds)}</span>
        <span className="text-[10px] font-semibold text-red-400">s</span>
      </div>
    </div>
  );
};

export default FlashSaleTimer;
