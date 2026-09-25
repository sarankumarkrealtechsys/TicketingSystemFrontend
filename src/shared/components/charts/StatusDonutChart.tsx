import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getStatusColor } from "@/features/priority-status-management/colorRegistry";

export interface StatusItem {
  statusId: number;
  label: string;
  count: number;
  behavior?: string;
  color?: string;
  sortOrder?: number;
}

export interface StatusDonutChartProps {
  total: number;
  byStatus?: StatusItem[];
  byStatusBehavior?: {
    OPEN: number;
    IN_PROGRESS: number;
    ON_HOLD: number;
    RESOLVED: number;
    CLOSED: number;
  };
  title?: string;
  subtitle?: string;
  badgeText?: string;
  breakdownLink?: string;
}

export const StatusDonutChart: React.FC<StatusDonutChartProps> = ({
  total = 0,
  byStatus,
  byStatusBehavior = {
    OPEN: 0,
    IN_PROGRESS: 0,
    ON_HOLD: 0,
    RESOLVED: 0,
    CLOSED: 0,
  },
  title = "Tickets by Status",
  subtitle,
  badgeText = "Live",
  breakdownLink = "/tickets",
}) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const [, setColorTick] = useState(0);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (key: string) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setHoveredKey(key);
  };

  const handleMouseLeave = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredKey(null);
    }, 40);
  };

  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleColorsUpdated = () => setColorTick((t) => t + 1);
    window.addEventListener("rts_colors_updated", handleColorsUpdated);
    return () => {
      window.removeEventListener("rts_colors_updated", handleColorsUpdated);
    };
  }, []);

  useEffect(() => {
    setIsAnimated(false);
    const frame = requestAnimationFrame(() => {
      const timer = setTimeout(() => {
        setIsAnimated(true);
      }, 50);
      return () => clearTimeout(timer);
    });
    return () => cancelAnimationFrame(frame);
  }, [total]);

  const circumference = 2 * Math.PI * 38; // ~238.761

  // Always group and display tickets by the 5 canonical lifecycle stages (Open, In Progress, On Hold, Resolved, Closed).
  // Team workflow statuses roll up directly to their selected lifecycle stage count.
  const behaviorCounts = {
    OPEN: byStatusBehavior?.OPEN || 0,
    IN_PROGRESS: byStatusBehavior?.IN_PROGRESS || 0,
    ON_HOLD: byStatusBehavior?.ON_HOLD || 0,
    RESOLVED: byStatusBehavior?.RESOLVED || 0,
    CLOSED: byStatusBehavior?.CLOSED || 0,
  };

  // If byStatusBehavior wasn't provided or all values are 0, but byStatus is passed, roll up counts by behavior
  if (
    byStatus &&
    byStatus.length > 0 &&
    !byStatusBehavior?.OPEN &&
    !byStatusBehavior?.IN_PROGRESS &&
    !byStatusBehavior?.ON_HOLD &&
    !byStatusBehavior?.RESOLVED &&
    !byStatusBehavior?.CLOSED
  ) {
    for (const item of byStatus) {
      const b = (item.behavior || "OPEN").toUpperCase() as keyof typeof behaviorCounts;
      if (behaviorCounts[b] !== undefined) {
        behaviorCounts[b] += item.count || 0;
      }
    }
  }

  const statuses: Array<{
    key: string;
    label: string;
    count: number;
    color: string;
  }> = [
    {
      key: "OPEN",
      label: "Open",
      count: behaviorCounts.OPEN,
      color: getStatusColor(null, "OPEN", "Open"),
    },
    {
      key: "IN_PROGRESS",
      label: "In Progress",
      count: behaviorCounts.IN_PROGRESS,
      color: getStatusColor(null, "IN_PROGRESS", "In Progress"),
    },
    {
      key: "ON_HOLD",
      label: "On Hold",
      count: behaviorCounts.ON_HOLD,
      color: getStatusColor(null, "ON_HOLD", "On Hold"),
    },
    {
      key: "RESOLVED",
      label: "Resolved",
      count: behaviorCounts.RESOLVED,
      color: getStatusColor(null, "RESOLVED", "Resolved"),
    },
    {
      key: "CLOSED",
      label: "Closed",
      count: behaviorCounts.CLOSED,
      color: getStatusColor(null, "CLOSED", "Closed"),
    },
  ];

  let accumulated = 0;
  const slices = statuses.map((item) => {
    const fraction = total > 0 ? item.count / total : 0;
    const length = fraction * circumference;
    const offset = -accumulated;
    accumulated += length;
    const pct = total > 0 ? (fraction * 100).toFixed(1) : "0.0";
    return {
      ...item,
      length,
      offset,
      pct,
    };
  });

  const activeSlice = slices.find((s) => s.key === hoveredKey);

  return (
    <div className="bg-white rounded-[10px] p-5 shadow-sm border border-[#EEEEEE] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1E88E5] text-[20px]">
              donut_large
            </span>
            <h2 className="font-semibold text-[15px] text-[#1A1A1A]">
              {title}
            </h2>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 bg-[#F0EDED] rounded text-[#5F6368]">
            {badgeText}
          </span>
        </div>
        {subtitle && (
          <p className="text-[12px] text-[#5F6368] mb-4">
            {subtitle}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-1">
          {/* SVG Donut Chart */}
          <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                fill="none"
                r="38"
                stroke="#F0EDED"
                strokeWidth="12"
              />
              {/* Data Slices */}
              {slices.map((slice) => {
                if (slice.length <= 0) return null;
                const isHovered = hoveredKey === slice.key;
                const isAnyHovered = hoveredKey !== null;

                return (
                  <circle
                    key={slice.key}
                    cx="50"
                    cy="50"
                    fill="none"
                    r="38"
                    stroke={slice.color}
                    strokeDasharray={
                      isAnimated
                        ? `${slice.length} ${circumference}`
                        : `0 ${circumference}`
                    }
                    strokeDashoffset={isAnimated ? slice.offset : 0}
                    strokeWidth={isHovered ? 16 : 12}
                    onMouseEnter={() => handleMouseEnter(slice.key)}
                    onMouseLeave={handleMouseLeave}
                    style={{
                      transition:
                        "stroke-dasharray 1.4s cubic-bezier(0.16, 1, 0.3, 1), stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1), stroke-width 0.5s ease-out, opacity 0.5s ease-out, filter 0.5s ease-out",
                      filter: isHovered
                        ? `drop-shadow(0 0 5px ${slice.color}99)`
                        : "none",
                    }}
                    className={`cursor-pointer ${
                      isHovered
                        ? "opacity-100"
                        : isAnyHovered
                        ? "opacity-40"
                        : "opacity-95 hover:opacity-100"
                    }`}
                  >
                    <title>{`${slice.label}: ${slice.count} tickets (${slice.pct}%)`}</title>
                  </circle>
                );
              })}
            </svg>

            {/* Centered Count Display: shows total tickets by default, or hovered status available count */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none p-2">
              <span className="font-bold text-[22px] text-[#1A1A1A] leading-none font-mono">
                {activeSlice ? activeSlice.count : total}
              </span>
              <span className="text-[9px] font-bold text-[#5F6368] tracking-wider uppercase mt-1">
                TICKETS
              </span>
            </div>
          </div>

          {/* Legend Items (compact & scrollable) */}
          <div className="flex-1 w-full space-y-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
            {slices.map((item) => {
              const isHovered = hoveredKey === item.key;
              const isAnyHovered = hoveredKey !== null;
              return (
                <div
                  key={item.key}
                  onMouseEnter={() => handleMouseEnter(item.key)}
                  onMouseLeave={handleMouseLeave}
                  className={`flex items-center justify-between text-[12px] p-1.5 rounded-md transition-all duration-500 ease-out cursor-pointer ${
                    isHovered
                      ? "bg-gray-100/90 font-bold ring-1 ring-black/10 scale-[1.01]"
                      : isAnyHovered
                      ? "opacity-50 hover:opacity-100 hover:bg-gray-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 transition-all duration-500 ease-out"
                      style={{
                        backgroundColor: item.color,
                        transform: isHovered ? "scale(1.35)" : "scale(1)",
                        boxShadow: isHovered
                          ? `0 0 8px ${item.color}`
                          : "none",
                      }}
                    />
                    <span
                      className={`truncate transition-colors duration-500 ${
                        isHovered ? "text-[#1A1A1A] font-bold" : "text-[#1A1A1A] font-medium"
                      }`}
                      title={item.label}
                    >
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono shrink-0">
                    <span className="font-bold text-[#1A1A1A]">{item.count}</span>
                    <span className="text-[#5F6368] text-[11px]">
                      ({item.pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-[#EEEEEE] flex items-center justify-end text-[11px] text-[#5F6368] font-medium">
        <Link
          to={breakdownLink}
          className="text-[#1E88E5] hover:underline font-semibold flex items-center gap-0.5"
        >
          <span>Detailed Breakdown</span>
          <span className="material-symbols-outlined text-[14px]">
            arrow_forward
          </span>
        </Link>
      </div>
    </div>
  );
};

export default StatusDonutChart;
