import React from "react";
import { MasterDataItem, TicketQueryParams } from "../types";

export interface FilterToolbarProps {
  filters: TicketQueryParams;
  onFilterChange: (filters: Partial<TicketQueryParams>) => void;
  onClear: () => void;
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
    <div className="bg-white rounded-[10px] p-3 sm:p-4 shadow-sm border border-[#EEEEEE] space-y-3">
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Search input on the left - full width on mobile */}
        <div className="relative w-full xl:w-auto xl:flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368] text-[18px]">
            search
          </span>
          <input
            className="w-full h-9 pl-9 pr-3 bg-[#F6F3F2]/70 border border-[#E0E0E0] rounded-lg text-[13px] text-[#1A1A1A] placeholder:text-[#5F6368] focus:outline-none focus:bg-white focus:border-[#1E88E5] focus:ring-1 focus:ring-[#1E88E5] transition-all"
            placeholder="Search by ticket ID, summary, or keyword..."
            type="text"
            value={filters.search || ""}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
          />
        </div>

        {/* Dropdown filters on the right - 2-column grid on mobile, inline wrap on desktop */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full xl:w-auto">
          {/* 1. Project Filter Dropdown */}
          <div className="relative w-full sm:w-auto">
            <select
              className="w-full sm:w-auto h-9 pl-3 pr-8 text-[12px] font-medium bg-[#F6F3F2]/70 border border-[#E0E0E0] rounded-lg text-[#1A1A1A] appearance-none focus:outline-none focus:bg-white focus:border-[#1E88E5] cursor-pointer truncate"
              value={filters.projectId || ""}
              onChange={(e) =>
                onFilterChange({
                  projectId: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                })
              }
            >
              <option value="">All Projects</option>
              {safeProjects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#5F6368] text-[16px] pointer-events-none">
              expand_more
            </span>
          </div>

          {/* 2. Team Filter Dropdown */}
          <div className="relative w-full sm:w-auto">
            <select
              className="w-full sm:w-auto h-9 pl-3 pr-8 text-[12px] font-medium bg-[#F6F3F2]/70 border border-[#E0E0E0] rounded-lg text-[#1A1A1A] appearance-none focus:outline-none focus:bg-white focus:border-[#1E88E5] cursor-pointer truncate"
              value={filters.teamId || ""}
              onChange={(e) =>
                onFilterChange({
                  teamId: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                })
              }
            >
              <option value="">All Teams</option>
              {safeTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#5F6368] text-[16px] pointer-events-none">
              expand_more
            </span>
          </div>

          {/* 3. Assignee Filter Dropdown */}
          <div className="relative w-full sm:w-auto">
            <select
              className="w-full sm:w-auto h-9 pl-3 pr-8 text-[12px] font-medium bg-[#F6F3F2]/70 border border-[#E0E0E0] rounded-lg text-[#1A1A1A] appearance-none focus:outline-none focus:bg-white focus:border-[#1E88E5] cursor-pointer truncate"
              value={filters.assigneeId || ""}
              onChange={(e) =>
                onFilterChange({
                  assigneeId: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                })
              }
            >
              <option value="">All Assignees</option>
              {safeUsers.map((usr) => (
                <option key={usr.id} value={usr.id}>
                  {usr.name || usr.email}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#5F6368] text-[16px] pointer-events-none">
              expand_more
            </span>
          </div>

          {/* 4. Priority Filter Dropdown */}
          <div className="relative w-full sm:w-auto">
            <select
              className="w-full sm:w-auto h-9 pl-3 pr-8 text-[12px] font-medium bg-[#F6F3F2]/70 border border-[#E0E0E0] rounded-lg text-[#1A1A1A] appearance-none focus:outline-none focus:bg-white focus:border-[#1E88E5] cursor-pointer truncate"
              value={filters.priorityId || ""}
              onChange={(e) =>
                onFilterChange({
                  priorityId: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                })
              }
            >
              <option value="">All Priorities</option>
              {safePriorities.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label || p.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#5F6368] text-[16px] pointer-events-none">
              expand_more
            </span>
          </div>

          {/* 5. Status Filter Dropdown */}
          <div className="relative w-full sm:w-auto">
            <select
              className="w-full sm:w-auto h-9 pl-3 pr-8 text-[12px] font-medium bg-[#F6F3F2]/70 border border-[#E0E0E0] rounded-lg text-[#1A1A1A] appearance-none focus:outline-none focus:bg-white focus:border-[#1E88E5] cursor-pointer truncate"
              value={filters.statusId || ""}
              onChange={(e) =>
                onFilterChange({
                  statusId: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                })
              }
            >
              <option value="">All Statuses</option>
              {safeStatuses.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label || st.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#5F6368] text-[16px] pointer-events-none">
              expand_more
            </span>
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

          {/* 7. Clear / Reset Filters Button */}
          <button
            className="col-span-2 sm:col-auto w-full sm:w-auto h-9 px-2.5 text-[12px] font-semibold text-[#5F6368] hover:text-[#E53935] bg-[#F6F3F2]/40 sm:bg-transparent rounded-lg border border-[#E0E0E0]/60 sm:border-transparent transition-colors flex items-center justify-center gap-1 active:scale-[0.98]"
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
