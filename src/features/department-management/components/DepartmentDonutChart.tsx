import React, { useState } from "react";
import { DepartmentItem } from "../types";

interface DepartmentDonutChartProps {
  departments: DepartmentItem[];
}

const PALETTE = [
  "#1F3864", // Deep Navy
  "#0e61a1", // Royal Blue
  "#FB8C00", // Amber
  "#8E24AA", // Purple
  "#43A047", // Emerald Green
  "#00ACC1", // Cyan
  "#E53935", // Coral Red
  "#D81B60", // Rose
];

export const DepartmentDonutChart: React.FC<DepartmentDonutChartProps> = ({
  departments,
}) => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Compute personnel counts per department
  const data = departments.map((d, index) => {
    const userCount = d._count?.users || d.users?.length || 0;
    return {
      id: d.id,
      name: d.name,
      usersCount: userCount,
      color: PALETTE[index % PALETTE.length],
    };
  });

  const totalUsers = data.reduce((sum, item) => sum + item.usersCount, 0);

  // Calculate SVG Donut arcs
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.327

  let cumulativePercent = 0;

  const slices = data.map((item) => {
    const percent = totalUsers > 0 ? item.usersCount / totalUsers : 0;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativePercent * circumference;
    cumulativePercent += percent;

    return {
      ...item,
      percent: Math.round(percent * 100),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeSlice = slices.find((s) => s.id === hoveredId);

  return (
    <div className="bg-white dark:bg-[#121E30] rounded-xl p-5 border border-[#E5E7EB] dark:border-[#1E2D45] shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Donut Visual with Center Dynamic Display */}
      <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Base track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-gray-100 dark:stroke-slate-800"
            strokeWidth="12"
            fill="none"
          />
          {/* Colored Slices */}
          {slices.map(
            (slice) =>
              slice.usersCount > 0 && (
                <circle
                  key={slice.id}
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={slice.color}
                  strokeWidth={hoveredId === slice.id ? 15 : 12}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  fill="none"
                  onMouseEnter={() => setHoveredId(slice.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="transition-all duration-300 ease-in-out cursor-pointer opacity-90 hover:opacity-100"
                >
                  <title>{`${slice.name}: ${slice.usersCount} personnel (${slice.percent}%)`}</title>
                </circle>
              ),
          )}
        </svg>

        {/* Center Label Displaying Department Name on Hover with Smooth Opacity/Scale Transition */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 pointer-events-none select-none">
          {/* Default Total Display */}
          <div
            className={`flex flex-col items-center transition-all duration-300 ease-in-out ${
              activeSlice
                ? "opacity-0 scale-90 pointer-events-none absolute"
                : "opacity-100 scale-100"
            }`}
          >
            <span className="text-2xl font-bold text-[#1A1A1A] dark:text-white leading-none">
              {totalUsers}
            </span>
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mt-1">
              Personnel
            </span>
          </div>

          {/* Active Hover Department Display */}
          <div
            className={`flex flex-col items-center transition-all duration-300 ease-in-out ${
              activeSlice
                ? "opacity-100 scale-100"
                : "opacity-0 scale-90 pointer-events-none absolute"
            }`}
          >
            <span
              className="text-[11px] font-bold text-[#1E88E5] dark:text-blue-400 uppercase tracking-wider line-clamp-1 max-w-[120px]"
              title={activeSlice?.name}
            >
              {activeSlice?.name}
            </span>
            <span className="text-xl font-bold text-[#1A1A1A] dark:text-white leading-tight mt-0.5">
              {activeSlice?.usersCount}
            </span>
            <span className="text-[10px] font-medium text-gray-400">
              {activeSlice?.percent}% share
            </span>
          </div>
        </div>
      </div>

      {/* Legend & Breakdown (Persons per Department) */}
      <div className="flex-1 w-full space-y-2.5">
        <div className="flex items-center justify-between border-b border-[#F0F2F5] dark:border-[#1E2D45] pb-2 mb-1">
          <span className="text-xs font-bold text-[#1A1A1A] dark:text-white uppercase tracking-wider">
            Department Personnel Breakdown
          </span>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {departments.length} Departments
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {slices.map((slice) => {
            const isHovered = hoveredId === slice.id;
            return (
              <div
                key={slice.id}
                onMouseEnter={() => setHoveredId(slice.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer ${
                  isHovered
                    ? "bg-[#1F3864]/10 dark:bg-blue-900/30 ring-1 ring-[#1F3864]/20"
                    : "bg-gray-50/70 dark:bg-slate-800/50 hover:bg-gray-100/80 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span
                    className={`text-xs font-semibold truncate ${
                      isHovered
                        ? "text-[#1F3864] dark:text-blue-300 font-bold"
                        : "text-[#1A1A1A] dark:text-gray-200"
                    }`}
                    title={slice.name}
                  >
                    {slice.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs font-bold text-[#1F3864] dark:text-blue-400">
                    {slice.usersCount} {slice.usersCount === 1 ? "person" : "persons"}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    ({slice.percent}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DepartmentDonutChart;
