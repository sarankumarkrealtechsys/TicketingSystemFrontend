import React from "react";

export interface PriorityBarChartProps {
  total: number;
  byPriority?: Array<{
    priorityId: number;
    label: string;
    count: number;
  }>;
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
  const highItem = byPriority.find((p) => p.label?.toUpperCase().includes("HIGH"));
  const medItem = byPriority.find((p) => p.label?.toUpperCase().includes("MED"));
  const lowItem = byPriority.find((p) => p.label?.toUpperCase().includes("LOW"));

  const highCount = highItem ? highItem.count : 0;
  const medCount = medItem ? medItem.count : 0;
  const lowCount = lowItem ? lowItem.count : 0;

  const highPct = total > 0 ? ((highCount / total) * 100).toFixed(1) : "0.0";
  const medPct = total > 0 ? ((medCount / total) * 100).toFixed(1) : "0.0";
  const lowPct = total > 0 ? ((lowCount / total) * 100).toFixed(1) : "0.0";

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
          <p className="text-[12px] text-[#5F6368] mb-4">
            {subtitle}
          </p>
        )}

        <div className="space-y-4">
          {/* High Priority */}
          <div>
            <div className="flex items-center justify-between text-[13px] mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E53935]" />
                <span className="font-semibold text-[#1A1A1A]">High Priority</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#E53935]">{highCount}</span>
                <span className="text-[11px] text-[#5F6368]">({highPct}%)</span>
              </div>
            </div>
            <div className="w-full bg-[#F0EDED] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#E53935] h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${highPct}%` }}
              />
            </div>
          </div>

          {/* Medium Priority */}
          <div>
            <div className="flex items-center justify-between text-[13px] mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FB8C00]" />
                <span className="font-semibold text-[#1A1A1A]">Medium Priority</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#FB8C00]">{medCount}</span>
                <span className="text-[11px] text-[#5F6368]">({medPct}%)</span>
              </div>
            </div>
            <div className="w-full bg-[#F0EDED] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#FB8C00] h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${medPct}%` }}
              />
            </div>
          </div>

          {/* Low Priority */}
          <div>
            <div className="flex items-center justify-between text-[13px] mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#43A047]" />
                <span className="font-semibold text-[#1A1A1A]">Low Priority</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#43A047]">{lowCount}</span>
                <span className="text-[11px] text-[#5F6368]">({lowPct}%)</span>
              </div>
            </div>
            <div className="w-full bg-[#F0EDED] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#43A047] h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${lowPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriorityBarChart;
