import React, { useState, useEffect } from "react";
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
  const [, setColorTick] = useState(0);

  useEffect(() => {
    const handleColorsUpdated = () => setColorTick((t) => t + 1);
    window.addEventListener("rts_colors_updated", handleColorsUpdated);
    return () => {
      window.removeEventListener("rts_colors_updated", handleColorsUpdated);
    };
  }, []);

  const circumference = 2 * Math.PI * 38; // ~238.761

  // Use dynamic byStatus if provided, otherwise fallback to byStatusBehavior
  let statuses: Array<{
    key: string;
    label: string;
    count: number;
    color: string;
  }> = [];

  if (byStatus && byStatus.length > 0) {
    const sorted = [...byStatus].sort((a, b) => {
      const orderA = a.sortOrder !== undefined ? a.sortOrder : 999;
      const orderB = b.sortOrder !== undefined ? b.sortOrder : 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.statusId || 0) - (b.statusId || 0);
    });

    statuses = sorted.map((s) => ({
      key: String(s.statusId),
      label: s.label,
      count: s.count || 0,
      color: s.color || getStatusColor(s.statusId, s.behavior, s.label),
    }));
  } else {
    statuses = [
      { key: "OPEN", label: "Open", count: byStatusBehavior.OPEN || 0, color: getStatusColor(null, "OPEN", "Open") },
      { key: "IN_PROGRESS", label: "In Progress", count: byStatusBehavior.IN_PROGRESS || 0, color: getStatusColor(null, "IN_PROGRESS", "In Progress") },
      { key: "ON_HOLD", label: "On Hold", count: byStatusBehavior.ON_HOLD || 0, color: getStatusColor(null, "ON_HOLD", "On Hold") },
      { key: "RESOLVED", label: "Resolved", count: byStatusBehavior.RESOLVED || 0, color: getStatusColor(null, "RESOLVED", "Resolved") },
      { key: "CLOSED", label: "Closed", count: byStatusBehavior.CLOSED || 0, color: getStatusColor(null, "CLOSED", "Closed") },
    ];
  }

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
              {slices.map((slice) =>
                slice.length > 0 ? (
                  <circle
                    key={slice.key}
                    cx="50"
                    cy="50"
                    fill="none"
                    r="38"
                    stroke={slice.color}
                    strokeDasharray={`${slice.length} ${circumference}`}
                    strokeDashoffset={slice.offset}
                    strokeWidth={hoveredKey === slice.key ? 15 : 12}
                    onMouseEnter={() => setHoveredKey(slice.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    className="transition-all duration-300 ease-in-out cursor-pointer opacity-90 hover:opacity-100"
                  >
                    <title>{`${slice.label}: ${slice.count} tickets (${slice.pct}%)`}</title>
                  </circle>
                ) : null
              )}
            </svg>

            {/* Centered Dynamic Status Display on Hover */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none p-2">
              <div
                className={`flex flex-col items-center transition-all duration-300 ease-in-out ${
                  activeSlice
                    ? "opacity-0 scale-90 pointer-events-none absolute"
                    : "opacity-100 scale-100"
                }`}
              >
                <span className="font-bold text-[22px] text-[#1A1A1A] leading-none font-mono">
                  {total}
                </span>
                <span className="text-[9px] font-bold text-[#5F6368] tracking-wider uppercase mt-0.5">
                  TICKETS
                </span>
              </div>

              <div
                className={`flex flex-col items-center transition-all duration-300 ease-in-out ${
                  activeSlice
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-90 pointer-events-none absolute"
                }`}
              >
                <span
                  className="text-[10px] font-bold uppercase tracking-wider line-clamp-1 max-w-[100px] truncate"
                  style={{ color: activeSlice?.color }}
                >
                  {activeSlice?.label}
                </span>
                <span className="font-bold text-[20px] text-[#1A1A1A] leading-tight font-mono mt-0.5">
                  {activeSlice?.count}
                </span>
                <span className="text-[10px] font-mono text-gray-500">
                  {activeSlice?.pct}%
                </span>
              </div>
            </div>
          </div>

          {/* Legend Items (compact & scrollable) */}
          <div className="flex-1 w-full space-y-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
            {slices.map((item) => {
              const isHovered = hoveredKey === item.key;
              return (
                <div
                  key={item.key}
                  onMouseEnter={() => setHoveredKey(item.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  className={`flex items-center justify-between text-[12px] p-1.5 rounded-md transition-all cursor-pointer ${
                    isHovered
                      ? "bg-gray-100/80 font-bold ring-1 ring-black/5"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span
                      className={`truncate ${
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
