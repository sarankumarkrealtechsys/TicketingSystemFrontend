import React, { useMemo } from "react";
import { MasterDataItem, TicketQueryParams } from "../types";
import { SelectDropdown, MultiSelectDropdown, DateFilterPicker } from "@/shared/components";

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

  const safePriorities = useMemo(() => {
    const list = Array.isArray(priorities) ? priorities : [];
    return [...list].sort(
      (a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id
    );
  }, [priorities]);

  const safeStatuses = useMemo(() => {
    const list = Array.isArray(statuses) ? statuses : [];
    return [...list].sort(
      (a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id
    );
  }, [statuses]);

  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-[#EEEEEE] space-y-3">
      {/* Row 1: Full-Width Prominent Search Input */}
      <div className="relative w-full">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-[20px]">
          search
        </span>
        <input
          className="w-full h-10 pl-10 pr-4 bg-white dark:bg-[#1A283E] border border-gray-300 dark:border-[#283A55] rounded-lg text-sm text-[#1A1A1A] dark:text-white placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#1E88E5] focus:ring-1 focus:ring-[#1E88E5] transition-all shadow-2xs"
          placeholder="Search tickets by ID, summary, description, or keyword..."
          type="text"
          value={filters.search || ""}
          onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
        />
      </div>

      {/* Row 2: Dropdown Filters & Action Buttons - Mobile Responsive */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
        {/* Left Side: Filter Dropdowns - Responsive Grid on Mobile, Flex on Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:flex xl:flex-wrap items-center gap-2.5 w-full xl:w-auto">
          {/* 1. Project Filter Dropdown */}
          <div className="w-full xl:w-44">
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
              size="md"
            />
          </div>

          {/* 2. Team Multi-Select Dropdown */}
          <div className="w-full xl:w-44">
            <MultiSelectDropdown<number>
              values={
                filters.teamIds && filters.teamIds.length > 0
                  ? filters.teamIds
                  : filters.teamId !== undefined
                  ? [Number(filters.teamId)]
                  : []
              }
              onChange={(selected) =>
                onFilterChange({
                  teamIds: selected.length > 0 ? selected : undefined,
                  teamId: undefined,
                  page: 1,
                })
              }
              options={safeTeams.map((team) => ({
                value: team.id,
                label: team.name || `Team #${team.id}`,
              }))}
              placeholder="All Teams"
              size="md"
            />
          </div>

          {/* 3. Assignee Filter Dropdown */}
          <div className="w-full xl:w-44">
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
              size="md"
              searchable={safeUsers.length > 5}
              searchPlaceholder="Filter assignee..."
            />
          </div>

          {/* 4. Priority Multi-Select Dropdown */}
          <div className="w-full xl:w-44">
            <MultiSelectDropdown<number>
              values={
                filters.priorityIds && filters.priorityIds.length > 0
                  ? filters.priorityIds
                  : filters.priorityId !== undefined
                  ? [Number(filters.priorityId)]
                  : []
              }
              onChange={(selected) =>
                onFilterChange({
                  priorityIds: selected.length > 0 ? selected : undefined,
                  priorityId: undefined,
                  page: 1,
                })
              }
              options={safePriorities.map((p) => ({
                value: p.id,
                label: p.label || p.name || `Priority #${p.id}`,
              }))}
              placeholder="All Priorities"
              size="md"
            />
          </div>

          {/* 5. Status Multi-Select Dropdown */}
          <div className="w-full xl:w-44">
            <MultiSelectDropdown<number>
              values={
                filters.statusIds && filters.statusIds.length > 0
                  ? filters.statusIds
                  : filters.statusId !== undefined
                  ? [Number(filters.statusId)]
                  : []
              }
              onChange={(selected) =>
                onFilterChange({
                  statusIds: selected.length > 0 ? selected : undefined,
                  statusId: undefined,
                  page: 1,
                })
              }
              options={safeStatuses.map((st) => ({
                value: st.id,
                label: st.label || st.name || `Status #${st.id}`,
              }))}
              placeholder="All Statuses"
              size="md"
            />
          </div>

          {/* 6. Ticket Type / Hierarchy Filter Dropdown */}
          <div className="w-full xl:w-40">
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
              size="md"
            />
          </div>

          {/* 7. Date Filter Picker */}
          <div className="w-full xl:w-auto">
            <DateFilterPicker
              value={{
                date: filters.date,
                startDate: filters.startDate,
                endDate: filters.endDate,
              }}
              onChange={(dateVal) =>
                onFilterChange({
                  date: dateVal.date,
                  startDate: dateVal.startDate,
                  endDate: dateVal.endDate,
                  page: 1,
                })
              }
              size="md"
            />
          </div>
        </div>

        {/* Right Side: Refresh & Clear Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-1 lg:pt-0">
          {onRefresh && (
            <button
              className="h-10 px-4 bg-[#2B4C7E] hover:bg-[#1F3864] text-white rounded-lg text-sm font-semibold shadow-2xs transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer flex-1 sm:flex-initial"
              onClick={onRefresh}
              title="Refresh tickets list"
              type="button"
            >
              <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? "animate-spin" : ""}`}>
                refresh
              </span>
              <span>Refresh</span>
            </button>
          )}

          <button
            className="h-10 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-red-600 bg-white dark:bg-[#1A283E] rounded-lg border border-gray-300 dark:border-[#283A55] hover:border-red-300 transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer shadow-2xs flex-1 sm:flex-initial"
            onClick={onClear}
            title="Reset all filters"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              restart_alt
            </span>
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* Row 3: Active Filter Badges Bar */}
      {(filters.date ||
        (filters.startDate && filters.endDate) ||
        (filters.statusIds && filters.statusIds.length > 0) ||
        filters.statusId !== undefined ||
        (filters.priorityIds && filters.priorityIds.length > 0) ||
        filters.priorityId !== undefined ||
        filters.projectId !== undefined ||
        (filters.teamIds && filters.teamIds.length > 0) ||
        filters.teamId !== undefined ||
        filters.assigneeId !== undefined ||
        filters.ticketType ||
        (filters.search && filters.search.trim().length > 0)) && (
        <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-gray-100 dark:border-gray-800 text-xs">
          <span className="text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider font-bold mr-1">
            Active Filters:
          </span>

          {filters.date && (
            <span className="inline-flex items-center gap-1.5 bg-[#1E88E5]/10 text-[#1E88E5] dark:bg-[#1E88E5]/20 dark:text-blue-300 border border-[#1E88E5]/30 px-2.5 py-1 rounded-lg text-xs font-medium">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              <span>Date: {filters.date}</span>
              <button
                type="button"
                onClick={() =>
                  onFilterChange({
                    date: undefined,
                    startDate: undefined,
                    endDate: undefined,
                    page: 1,
                  })
                }
                className="hover:text-red-500 cursor-pointer ml-1 p-0.5"
                title="Remove date filter"
              >
                ✕
              </button>
            </span>
          )}

          {!filters.date && filters.startDate && filters.endDate && (
            <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2.5 py-1 rounded-lg text-xs font-medium">
              <span className="material-symbols-outlined text-[14px]">date_range</span>
              <span>Range Active</span>
              <button
                type="button"
                onClick={() =>
                  onFilterChange({
                    startDate: undefined,
                    endDate: undefined,
                    page: 1,
                  })
                }
                className="hover:text-red-500 cursor-pointer ml-1 p-0.5"
                title="Remove date range filter"
              >
                ✕
              </button>
            </span>
          )}

          {/* Status Badges */}
          {((filters.statusIds && filters.statusIds.length > 0)
            ? filters.statusIds
            : filters.statusId !== undefined
            ? [Number(filters.statusId)]
            : []
          ).map((sId) => {
            const st = safeStatuses.find((s) => s.id === sId);
            return (
              <span
                key={`status-${sId}`}
                className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg text-xs font-medium"
              >
                <span>Status: {st?.label || `#${sId}`}</span>
                <button
                  type="button"
                  onClick={() => {
                    const current =
                      filters.statusIds && filters.statusIds.length > 0
                        ? filters.statusIds
                        : filters.statusId !== undefined
                        ? [Number(filters.statusId)]
                        : [];
                    const updated = current.filter((id) => id !== sId);
                    onFilterChange({
                      statusIds: updated.length > 0 ? updated : undefined,
                      statusId: undefined,
                      page: 1,
                    });
                  }}
                  className="hover:text-red-500 cursor-pointer ml-1 p-0.5"
                  title="Remove status filter"
                >
                  ✕
                </button>
              </span>
            );
          })}

          {/* Priority Badges */}
          {((filters.priorityIds && filters.priorityIds.length > 0)
            ? filters.priorityIds
            : filters.priorityId !== undefined
            ? [Number(filters.priorityId)]
            : []
          ).map((pId) => {
            const pr = safePriorities.find((p) => p.id === pId);
            return (
              <span
                key={`priority-${pId}`}
                className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-lg text-xs font-medium"
              >
                <span>Priority: {pr?.label || `#${pId}`}</span>
                <button
                  type="button"
                  onClick={() => {
                    const current =
                      filters.priorityIds && filters.priorityIds.length > 0
                        ? filters.priorityIds
                        : filters.priorityId !== undefined
                        ? [Number(filters.priorityId)]
                        : [];
                    const updated = current.filter((id) => id !== pId);
                    onFilterChange({
                      priorityIds: updated.length > 0 ? updated : undefined,
                      priorityId: undefined,
                      page: 1,
                    });
                  }}
                  className="hover:text-red-500 cursor-pointer ml-1 p-0.5"
                  title="Remove priority filter"
                >
                  ✕
                </button>
              </span>
            );
          })}

          {/* Team Badges */}
          {((filters.teamIds && filters.teamIds.length > 0)
            ? filters.teamIds
            : filters.teamId !== undefined
            ? [Number(filters.teamId)]
            : []
          ).map((tId) => {
            const tm = safeTeams.find((t) => t.id === tId);
            return (
              <span
                key={`team-${tId}`}
                className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium"
              >
                <span>Team: {tm?.name || `#${tId}`}</span>
                <button
                  type="button"
                  onClick={() => {
                    const current =
                      filters.teamIds && filters.teamIds.length > 0
                        ? filters.teamIds
                        : filters.teamId !== undefined
                        ? [Number(filters.teamId)]
                        : [];
                    const updated = current.filter((id) => id !== tId);
                    onFilterChange({
                      teamIds: updated.length > 0 ? updated : undefined,
                      teamId: undefined,
                      page: 1,
                    });
                  }}
                  className="hover:text-red-500 cursor-pointer ml-1 p-0.5"
                  title="Remove team filter"
                >
                  ✕
                </button>
              </span>
            );
          })}

          {filters.projectId !== undefined && (
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-[#1F3864] dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-lg text-xs font-medium">
              <span>
                Project:{" "}
                {safeProjects.find((p) => p.id === Number(filters.projectId))?.name ||
                  `#${filters.projectId}`}
              </span>
              <button
                type="button"
                onClick={() => onFilterChange({ projectId: undefined, page: 1 })}
                className="hover:text-red-500 cursor-pointer ml-1 p-0.5"
                title="Remove project filter"
              >
                ✕
              </button>
            </span>
          )}

          {filters.assigneeId !== undefined && (
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-lg text-xs font-medium">
              <span>
                Assignee:{" "}
                {safeUsers.find((u) => u.id === Number(filters.assigneeId))?.name ||
                  `#${filters.assigneeId}`}
              </span>
              <button
                type="button"
                onClick={() => onFilterChange({ assigneeId: undefined, page: 1 })}
                className="hover:text-red-500 cursor-pointer ml-1 p-0.5"
                title="Remove assignee filter"
              >
                ✕
              </button>
            </span>
          )}

          {filters.ticketType && filters.ticketType !== "all" && (
            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700 px-2.5 py-1 rounded-lg text-xs font-medium">
              <span>Type: {filters.ticketType === "main" ? "Main Only" : "Sub-Tickets"}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ ticketType: undefined, page: 1 })}
                className="hover:text-red-500 cursor-pointer ml-1 p-0.5"
                title="Remove type filter"
              >
                ✕
              </button>
            </span>
          )}

          {filters.search && (
            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700 px-2.5 py-1 rounded-lg text-xs font-medium">
              <span>Keyword: "{filters.search}"</span>
              <button
                type="button"
                onClick={() => onFilterChange({ search: "", page: 1 })}
                className="hover:text-red-500 cursor-pointer ml-1 p-0.5"
                title="Remove search query"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterToolbar;
