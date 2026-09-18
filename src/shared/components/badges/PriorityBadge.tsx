import React from "react";

export interface PriorityBadgeProps {
  priority: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const norm = (priority || "").toUpperCase();

  switch (norm) {
    case "HIGH":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-[#E53935] border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E53935]" /> High
        </span>
      );
    case "MEDIUM":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-[#FB8C00] border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FB8C00]" /> Medium
        </span>
      );
    case "LOW":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#43A047] border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#43A047]" /> Low
        </span>
      );
  }
};

export default PriorityBadge;
