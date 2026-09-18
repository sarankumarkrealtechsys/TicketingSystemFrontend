import React, { useEffect, useState } from "react";

export interface StatCardProps {
  title: string;
  count: number;
  subtitle: string;
  icon: string;
  accentColor: string;
  subtitleColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  count,
  subtitle,
  icon,
  accentColor,
  subtitleColor,
}) => {
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 700; // 700ms ease-out matching Stitch

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayCount(Math.round(eased * count));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayCount(count);
      }
    };

    requestAnimationFrame(step);
  }, [count]);

  return (
    <div
      className="bg-white rounded-[10px] p-2 sm:p-3.5 shadow-sm border border-[#EEEEEE] flex flex-col justify-between hover:shadow-md transition-shadow min-w-0"
      style={{ borderTop: `2px solid ${accentColor}` }}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[9px] sm:text-[11px] font-bold tracking-wider uppercase text-[#5F6368] truncate">
          {title}
        </span>
        <div
          className="w-5 h-5 sm:w-7 sm:h-7 rounded flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: `${accentColor}1A`,
            color: accentColor,
          }}
        >
          <span className="material-symbols-outlined text-[13px] sm:text-[18px]">{icon}</span>
        </div>
      </div>
      <div className="mt-1.5 sm:mt-3">
        <span
          className="text-[18px] sm:text-[24px] lg:text-[28px] font-bold leading-none font-mono"
          style={{ color: accentColor }}
        >
          {displayCount}
        </span>
        <span
          className="block text-[8.5px] sm:text-[11px] font-medium mt-0.5 sm:mt-1 truncate"
          style={{ color: subtitleColor || "#5F6368" }}
        >
          {subtitle}
        </span>
      </div>
    </div>
  );
};

export default StatCard;
