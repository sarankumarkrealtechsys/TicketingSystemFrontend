import React from "react";
import { MasterDataItem, UserTicketQueryParams, UserTicketScope } from "../types";
import { SelectDropdown } from "@/shared/components";

export interface UserFilterToolbarProps {
  filters: UserTicketQueryParams;
  onFilterChange: (filters: Partial<UserTicketQueryParams>) => void;
  onClear: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  projects?: MasterDataItem[];
  priorities?: MasterDataItem[];
  statuses?: MasterDataItem[];
  isDateActive?: boolean;
  onToggleDateFilter?: () => void;
}

export const UserFilterToolbar: React.FC<UserFilterToolbarProps> = ({
  filters,
  onFilterChange,
  onClear,
  onRefresh,
  isRefreshing = false,
  projects = [],
  priorities = [],
  statuses = [],
  isDateActive = false,
  onToggleDateFilter,
}) => {
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safePriorities = Array.isArray(priorities) ? priorities : [];
  const safeStatuses = Array.isArray(statuses) ? statuses : [];

  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-[#EEEEEE] space-y-3">
      {/* Row 1: Full-Width Prominent Search Input */}
      <div className="relative w-full">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6368] text-[20px]">
          search
        </span>
        <input
          className="w-full h-10 pl-10 pr-4 bg-[#F6F3F2]/70 border border-[#E0E0E0] rounded-xl text-xs sm:text-sm text-[#1A1A1A] placeholder:text-[#5F6368] focus:outline-none focus:bg-white focus:border-[#1E88E5] focus:ring-1 focus:ring-[#1E88E5] transition-all shadow-xs"
          placeholder="Search your tickets by ID, summary, description, or keyword..."
          type="text"
          value={filters.search || ""}
          onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
        />
      </div>

      {/* Row 2: Dropdown Filters & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        {/* Left Side: Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full xl:w-auto">
          {/* 1. Project Filter Dropdown */}
          <div className="w-full sm:w-36">
            <SelectDropdown<number | "">
              value={filters.projectId || ""}
              onChange={(val) =>
                onFilterChange({
                  projectId: val ? Number(val) : undefined,
                  page: 1,
                })
              }
              options={[
                { value: "", label: "All Projects" },
                ...safeProjects.map((proj) => ({
                  value: proj.id,
                  label: proj.name || `Project #${proj.id}`,
                })),
              ]}
              size="sm"
            />
          </div>

          {/* 2. My Roles Scoped Filter (All My Tickets, Assigned to me, Created by me) */}
          <div className="w-full sm:w-40">
            <SelectDropdown<UserTicketScope>
              value={filters.scope || "personal"}
              onChange={(val) =>
                onFilterChange({
                  scope: val as UserTicketScope,
                  page: 1,
                })
              }
              options={[
                { value: "personal", label: "All My Tickets" },
                { value: "assigned", label: "Assigned to me" },
                { value: "created", label: "Created by me" },
              ]}
              size="sm"
            />
          </div>

          {/* 3. Priority Filter Dropdown */}
          <div className="w-full sm:w-36">
            <SelectDropdown<number | "">
              value={filters.priorityId || ""}
              onChange={(val) =>
                onFilterChange({
                  priorityId: val ? Number(val) : undefined,
                  page: 1,
                })
              }
              options={[
                { value: "", label: "All Priorities" },
                ...safePriorities.map((p) => ({
                  value: p.id,
                  label: p.label || p.name || `Priority #${p.id}`,
                })),
              ]}
              size="sm"
            />
          </div>

          {/* 4. Status Filter Dropdown */}
          <div className="w-full sm:w-36">
            <SelectDropdown<number | "">
              value={filters.statusId || ""}
              onChange={(val) =>
                onFilterChange({
                  statusId: val ? Number(val) : undefined,
                  page: 1,
                })
              }
              options={[
                { value: "", label: "All Statuses" },
                ...safeStatuses.map((st) => ({
                  value: st.id,
                  label: st.label || st.name || `Status #${st.id}`,
                })),
              ]}
              size="sm"
            />
          </div>

          {/* 5. Date Range Picker (Toggle Last 30 Days) */}
          <button
            type="button"
            onClick={onToggleDateFilter}
            className={`h-9 px-3 border rounded-lg text-[12px] font-medium transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] ${
              isDateActive
                ? "bg-[#1E88E5] border-[#1E88E5] text-white shadow-xs"
                : "bg-[#F6F3F2]/70 border-[#E0E0E0] text-[#1A1A1A] hover:bg-white hover:border-[#1E88E5]"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[16px] ${
                isDateActive ? "text-white" : "text-[#5F6368]"
              }`}
            >
              calendar_today
            </span>
            <span>Last 30 Days</span>
          </button>
        </div>

        {/* Right Side: Refresh & Clear Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="h-9 px-3.5 bg-[#2B4C7E] hover:bg-[#1F3864] text-white rounded-lg text-[12px] font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
              title="Refresh tickets list"
            >
              <span className={`material-symbols-outlined text-[16px] ${isRefreshing ? "animate-spin" : ""}`}>
                refresh
              </span>
              <span>Refresh</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClear}
            className="h-9 px-3 text-[12px] font-semibold text-[#5F6368] hover:text-[#E53935] bg-[#F6F3F2]/40 rounded-lg border border-[#E0E0E0]/60 transition-colors flex items-center justify-center gap-1 active:scale-[0.98]"
            title="Reset all filters"
          >
            <span className="material-symbols-outlined text-[16px]">
              restart_alt
            </span>
            <span>Clear</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserFilterToolbar;
