import React from "react";
import { Link } from "react-router-dom";

export interface StatusDonutChartProps {
  total: number;
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
  byStatusBehavior = {
    OPEN: 0,
    IN_PROGRESS: 0,
    ON_HOLD: 0,
    RESOLVED: 0,
    CLOSED: 0,
  },
  title = "Tickets by Status",
  subtitle = "Complete breakdown across all stages of ticket fulfillment.",
  badgeText = "Live Lifecycle",
  breakdownLink = "/tickets",
}) => {
  const circumference = 2 * Math.PI * 38; // ~238.761

  const statuses = [
    { key: "OPEN", label: "Open", count: byStatusBehavior.OPEN || 0, color: "#1E88E5" },
    { key: "IN_PROGRESS", label: "In Progress", count: byStatusBehavior.IN_PROGRESS || 0, color: "#FB8C00" },
    { key: "ON_HOLD", label: "On Hold", count: byStatusBehavior.ON_HOLD || 0, color: "#8E24AA" },
    { key: "RESOLVED", label: "Resolved", count: byStatusBehavior.RESOLVED || 0, color: "#43A047" },
    { key: "CLOSED", label: "Closed", count: byStatusBehavior.CLOSED || 0, color: "#757575" },
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

  return (
    <div className="bg-white rounded-[10px] p-5 shadow-sm border border-[#EEEEEE] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
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
        <p className="text-[12px] text-[#5F6368] mb-4">
          {subtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-1">
          {/* SVG Donut Chart */}
          <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
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
              {slices.map((slice) => (
                <circle
                  key={slice.key}
                  cx="50"
                  cy="50"
                  fill="none"
                  r="38"
                  stroke={slice.color}
                  strokeDasharray={`${slice.length} ${circumference}`}
                  strokeDashoffset={slice.offset}
                  strokeWidth="12"
                  className="transition-all duration-700 ease-out"
                />
              ))}
            </svg>

            {/* Centered Total Indicator */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <span className="font-bold text-[22px] text-[#1A1A1A] leading-none font-mono">
                {total}
              </span>
              <span className="text-[9px] font-bold text-[#5F6368] tracking-wider uppercase mt-0.5">
                TICKETS
              </span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="flex-1 w-full space-y-2">
            {slices.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between text-[12px]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-[#1A1A1A]">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-[#1A1A1A]">{item.count}</span>
                  <span className="text-[#5F6368] text-[11px]">
                    ({item.pct}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-[#EEEEEE] flex items-center justify-between text-[11px] text-[#5F6368] font-medium">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px] text-[#1E88E5]">
            update
          </span>
          Auto-synced with queue dispatcher
        </span>
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
