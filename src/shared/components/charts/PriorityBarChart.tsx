import React, { useEffect, useState } from "react";
import { getPriorityColor } from "@/features/priority-status-management/colorRegistry";

export interface PriorityItem {
  priorityId: number;
  label: string;
  count: number;
  sortOrder?: number;
  color?: string;
}

export interface PriorityBarChartProps {
  total: number;
  byPriority?: PriorityItem[];
  title?: string;
  subtitle?: string;
  averageSlaText?: string;
  onSchedulePct?: string;
}

export const PriorityBarChart: React.FC<PriorityBarChartProps> = ({
  total = 0,
  byPriority = [],
  title = "Tickets by Priority",
  subtitle,
}) => {
  // Listen to color changes from colorRegistry to dynamically update live
  const [, setColorTick] = useState(0);

  useEffect(() => {
    const handleColorsUpdated = () => setColorTick((t) => t + 1);
    window.addEventListener("rts_colors_updated", handleColorsUpdated);
    return () => {
      window.removeEventListener("rts_colors_updated", handleColorsUpdated);
    };
  }, []);

  // Sort priorities by sortOrder ascending, falling back to priorityId
  const sortedPriorities = [...byPriority].sort((a, b) => {
    const orderA = a.sortOrder !== undefined ? a.sortOrder : 999;
    const orderB = b.sortOrder !== undefined ? b.sortOrder : 999;
    if (orderA !== orderB) return orderA - orderB;
    return (a.priorityId || 0) - (b.priorityId || 0);
  });

  return (
    <div className="bg-white rounded-[10px] p-5 shadow-sm border border-[#EEEEEE] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1E88E5] text-[20px]">
              bar_chart
            </span>
            <h2 className="font-semibold text-[15px] text-[#1A1A1A]">
              {title}
            </h2>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 bg-[#F0EDED] rounded text-[#5F6368]">
            {total} Total
          </span>
        </div>
        {subtitle && (
          <p className="text-[12px] text-[#5F6368] mb-4">{subtitle}</p>
        )}

        {sortedPriorities.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            No priority data available
          </div>
        ) : (
          <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
            {sortedPriorities.map((item) => {
              const count = item.count || 0;
              const pct =
                total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
              const color =
                item.color || getPriorityColor(item.priorityId, item.label);

              return (
                <div key={item.priorityId || item.label} className="group">
                  <div className="flex items-center justify-between text-[13px] mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-semibold text-[#1A1A1A]">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="font-bold" style={{ color }}>
                        {count}
                      </span>
                      <span className="text-[11px] text-[#5F6368]">
                        ({pct}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-[#F0EDED] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.min(100, Math.max(0, Number(pct)))}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PriorityBarChart;
