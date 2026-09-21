import React from "react";
import { MasterDataItem, TicketQueryParams } from "../types";
import { SelectDropdown } from "@/shared/components";

export interface FilterToolbarProps {
  filters: TicketQueryParams;
  onFilterChange: (filters: Partial<TicketQueryParams>) => void;
  onClear: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  projects?: MasterDataItem[];
  teams?: MasterDataItem[];
  users?: MasterDataItem[];
  priorities?: MasterDataItem[];
  statuses?: MasterDataItem[];
  isDateActive?: boolean;
  onToggleDateFilter?: () => void;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filters,
  onFilterChange,
  onClear,
  onRefresh,
  isRefreshing = false,
  projects = [],
  teams = [],
  users = [],
  priorities = [],
  statuses = [],
  isDateActive = false,
  onToggleDateFilter,
}) => {
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeTeams = Array.isArray(teams) ? teams : [];
  const safeUsers = Array.isArray(users) ? users : [];
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
          placeholder="Search tickets by ID, summary, description, or keyword..."
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
            <SelectDropdown<string | number>
              value={filters.projectId !== undefined ? filters.projectId : ""}
              onChange={(val) =>
                onFilterChange({
                  projectId: val !== "" ? Number(val) : undefined,
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

          {/* 2. Team Filter Dropdown */}
          <div className="w-full sm:w-36">
            <SelectDropdown<string | number>
              value={filters.teamId !== undefined ? filters.teamId : ""}
              onChange={(val) =>
                onFilterChange({
                  teamId: val !== "" ? Number(val) : undefined,
                  page: 1,
                })
              }
              options={[
                { value: "", label: "All Teams" },
                ...safeTeams.map((team) => ({
                  value: team.id,
                  label: team.name || `Team #${team.id}`,
                })),
              ]}
              size="sm"
            />
          </div>

          {/* 3. Assignee Filter Dropdown */}
          <div className="w-full sm:w-40">
            <SelectDropdown<string | number>
              value={filters.assigneeId !== undefined ? filters.assigneeId : ""}
              onChange={(val) =>
                onFilterChange({
                  assigneeId: val !== "" ? Number(val) : undefined,
                  page: 1,
                })
              }
              options={[
                { value: "", label: "All Assignees" },
                ...safeUsers.map((usr) => ({
                  value: usr.id,
                  label: usr.name || usr.email || `User #${usr.id}`,
                })),
              ]}
              size="sm"
              searchable={safeUsers.length > 5}
              searchPlaceholder="Filter assignee..."
            />
          </div>

          {/* 4. Priority Filter Dropdown */}
          <div className="w-full sm:w-36">
            <SelectDropdown<string | number>
              value={filters.priorityId !== undefined ? filters.priorityId : ""}
              onChange={(val) =>
                onFilterChange({
                  priorityId: val !== "" ? Number(val) : undefined,
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

          {/* 5. Status Filter Dropdown */}
          <div className="w-full sm:w-36">
            <SelectDropdown<string | number>
              value={filters.statusId !== undefined ? filters.statusId : ""}
              onChange={(val) =>
                onFilterChange({
                  statusId: val !== "" ? Number(val) : undefined,
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

          {/* 6. Ticket Type / Hierarchy Filter Dropdown */}
          <div className="w-full sm:w-36">
            <SelectDropdown<string>
              value={filters.ticketType || "all"}
              onChange={(val) =>
                onFilterChange({
                  ticketType: (val === "all" ? undefined : val) as "all" | "main" | "sub" | undefined,
                  page: 1,
                })
              }
              options={[
                { value: "all", label: "All Types" },
                { value: "main", label: "Main Tickets" },
                { value: "sub", label: "Sub-Tickets Only" },
              ]}
              size="sm"
            />
          </div>

          {/* 6. Date Range Picker Button */}
          <button
            className={`w-full sm:w-auto h-9 px-3 border rounded-lg text-[12px] font-medium transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] ${
              isDateActive
                ? "bg-[#1E88E5]/10 border-[#1E88E5] text-[#1E88E5]"
                : "bg-[#F6F3F2]/70 border-[#E0E0E0] text-[#1A1A1A] hover:bg-white hover:border-[#1E88E5]"
            }`}
            onClick={onToggleDateFilter}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#5F6368]">
              calendar_today
            </span>
            <span className="truncate">Last 30 Days</span>
          </button>
        </div>

        {/* Right Side: Refresh & Clear Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          {onRefresh && (
            <button
              className="h-9 px-3.5 bg-[#2B4C7E] hover:bg-[#1F3864] text-white rounded-lg text-[12px] font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
              onClick={onRefresh}
              title="Refresh tickets list"
              type="button"
            >
              <span className={`material-symbols-outlined text-[16px] ${isRefreshing ? "animate-spin" : ""}`}>
                refresh
              </span>
              <span>Refresh</span>
            </button>
          )}

          <button
            className="h-9 px-3 text-[12px] font-semibold text-[#5F6368] hover:text-[#E53935] bg-[#F6F3F2]/40 rounded-lg border border-[#E0E0E0]/60 transition-colors flex items-center justify-center gap-1 active:scale-[0.98]"
            onClick={onClear}
            title="Reset all filters"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">
              restart_alt
            </span>
            <span>Clear Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterToolbar;
