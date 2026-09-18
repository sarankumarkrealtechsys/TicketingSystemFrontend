import React from "react";

export interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = (status || "").toUpperCase().replace(/\s+/g, "_");

  switch (normalized) {
    case "OPEN":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-[#1E88E5] border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E88E5]" /> Open
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-[#FB8C00] border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FB8C00]" /> In Progress
        </span>
      );
    case "ON_HOLD":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-[#8E24AA] border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8E24AA]" /> On Hold
        </span>
      );
    case "RESOLVED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-[#43A047] border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#43A047]" /> Resolved
        </span>
      );
    case "CLOSED":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-[#757575] border border-neutral-300">
          <span className="w-1.5 h-1.5 rounded-full bg-[#757575]" /> {status || "Closed"}
        </span>
      );
  }
};

export default StatusBadge;
