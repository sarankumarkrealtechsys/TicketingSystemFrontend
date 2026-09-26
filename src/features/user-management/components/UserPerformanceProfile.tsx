import React, { useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUserPerformanceQuery } from "../api";
import {
  StatCard,
  PriorityBarChart,
  StatusDonutChart,
  SelectDropdown,
  SelectOption,
  PriorityBadge,
  StatusBadge,
} from "@/shared/components";
import { ROUTES } from "@/app/routes/routePaths";

const DATE_RANGE_OPTIONS: SelectOption<string>[] = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "ytd", label: "Year to Date" },
  { value: "all", label: "All Time" },
];

const STATUS_FILTER_OPTIONS: SelectOption<string>[] = [
  { value: "all", label: "All Statuses" },
  { value: "OPEN", label: "Open", dotColor: "bg-[#1E88E5]" },
  { value: "IN_PROGRESS", label: "In Progress", dotColor: "bg-[#FB8C00]" },
  { value: "ON_HOLD", label: "On Hold", dotColor: "bg-[#8E24AA]" },
  { value: "RESOLVED", label: "Resolved", dotColor: "bg-[#43A047]" },
  { value: "CLOSED", label: "Closed", dotColor: "bg-[#757575]" },
];

const PRIORITY_FILTER_OPTIONS: SelectOption<string>[] = [
  { value: "all", label: "All Priorities" },
  { value: "HIGH", label: "High Priority", dotColor: "bg-[#E53935]" },
  { value: "MEDIUM", label: "Medium Priority", dotColor: "bg-[#FB8C00]" },
  { value: "LOW", label: "Low Priority", dotColor: "bg-[#43A047]" },
];

export const UserPerformanceProfile: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const parsedUserId = userId ? Number(userId) : null;

  const [activeTab, setActiveTab] = useState<"assigned" | "created">(
    "assigned",
  );
  const [dateRange, setDateRange] = useState<string>("30d");
  const [ticketSearch, setTicketSearch] = useState<string>("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>("all");
  const [ticketPriorityFilter, setTicketPriorityFilter] =
    useState<string>("all");

  const { data, isLoading, isError, refetch, isFetching } =
    useUserPerformanceQuery(parsedUserId);

  const user = data?.user;
  const metrics = data?.metrics;
  const assignedTickets = data?.assignedTickets || data?.tickets || [];
  const createdTickets = data?.createdTickets || [];
  const activeTicketsList =
    activeTab === "assigned" ? assignedTickets : createdTickets;

  // Filter scoped tickets by Search, Status, and Priority
  const filteredTickets = useMemo(() => {
    return activeTicketsList.filter((t) => {
      // Status filter
      if (ticketStatusFilter !== "all") {
        const behavior = t.status?.behavior || "";
        if (behavior !== ticketStatusFilter) return false;
      }

      // Priority filter
      if (ticketPriorityFilter !== "all") {
        const pLabel = (t.priority?.name || "").toUpperCase();
        if (
          ticketPriorityFilter === "HIGH" &&
          !pLabel.includes("HIGH") &&
          !pLabel.includes("CRITICAL") &&
          !pLabel.includes("URGENT")
        ) {
          return false;
        }
        if (ticketPriorityFilter === "MEDIUM" && !pLabel.includes("MED")) {
          return false;
        }
        if (ticketPriorityFilter === "LOW" && !pLabel.includes("LOW")) {
          return false;
        }
      }

      // Search query
      if (!ticketSearch.trim()) return true;
      const q = ticketSearch.toLowerCase();
      const matchNum = t.ticketNumber.toLowerCase().includes(q);
      const matchTitle = t.title.toLowerCase().includes(q);
      return matchNum || matchTitle;
    });
  }, [
    activeTicketsList,
    ticketStatusFilter,
    ticketPriorityFilter,
    ticketSearch,
  ]);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-xs text-gray-500 gap-3">
        <span className="w-8 h-8 border-3 border-[#1F3864] border-t-transparent rounded-full animate-spin" />
        <span>Loading User Performance Profile...</span>
      </div>
    );
  }

  if (isError || !user || !metrics) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[24px]">error</span>
        </div>
        <h2 className="text-base font-bold text-gray-800 dark:text-white">
          Failed to load user performance profile
        </h2>
        <p className="text-xs text-gray-500">
          The requested user could not be found or performance metrics are
          unavailable.
        </p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.USERS)}
          className="px-4 py-2 bg-[#1F3864] text-white rounded-lg text-xs font-semibold hover:bg-[#152747] transition-all"
        >
          Back to User Directory
        </button>
      </div>
    );
  }

  const { statusBreakdown, priorityBreakdown } = metrics;
  const totalTickets = metrics.totalAssigned;

  const statusBehaviors = {
    OPEN: statusBreakdown.open,
    IN_PROGRESS: statusBreakdown.inProgress,
    ON_HOLD: statusBreakdown.onHold,
    RESOLVED: statusBreakdown.resolved,
    CLOSED: statusBreakdown.closed,
  };

  const byPriorityList = [
    { priorityId: 1, label: "High Priority", count: priorityBreakdown.high },
    {
      priorityId: 2,
      label: "Medium Priority",
      count: priorityBreakdown.medium,
    },
    { priorityId: 3, label: "Low Priority", count: priorityBreakdown.low },
  ];

  const isActive = user.status === "ACTIVE";
  const roleName = user.role?.name || user.legacyRole || "USER";

  return (
    <div className="space-y-6">
      {/* Top Breadcrumbs & Back Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-500 font-medium">
          <Link
            to={ROUTES.ROOT}
            className="hover:text-[#1F3864] dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            Home
          </Link>
          <span className="material-symbols-outlined text-[14px] text-gray-400 select-none">
            chevron_right
          </span>
          <Link
            to={ROUTES.USERS}
            className="hover:text-[#1F3864] dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            User Management
          </Link>
          <span className="material-symbols-outlined text-[14px] text-gray-400 select-none">
            chevron_right
          </span>
          <span className="text-[#1F3864] dark:text-blue-400 font-semibold">
            User Performance Profile
          </span>
        </nav>

        <button
          type="button"
          onClick={() => navigate(ROUTES.USERS)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#1F3864] text-[#1F3864] dark:text-blue-300 dark:border-blue-400 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">
            arrow_back
          </span>
          <span>Back to User Directory</span>
        </button>
      </div>

      {/* SECTION 1: User Identity Header */}
      <section className="bg-white dark:bg-[#121E30] rounded-xl p-5 sm:p-6 shadow-xs border border-[#E5E7EB] dark:border-[#1E2D45] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1F3864] to-[#2B5EA7] text-white flex items-center justify-center font-bold text-xl ring-4 ring-blue-50 dark:ring-blue-950/40 shadow-sm">
              {getInitials(user.name)}
            </div>
            <span
              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-[#121E30] ${
                isActive ? "bg-emerald-500" : "bg-gray-400"
              }`}
              title={isActive ? "Active Account" : "Inactive Account"}
            />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] dark:text-white tracking-tight">
                {user.name}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <span className="material-symbols-outlined text-[14px]">
                  badge
                </span>
                {roleName}
              </span>
              {isActive ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700">
                  Inactive
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-gray-400">
                  corporate_fare
                </span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {user.department?.name || "No Department"}
                </span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-gray-400">
                  mail
                </span>
                <span>{user.email}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-gray-400">
                  groups
                </span>
                <span>
                  {user.teams && user.teams.length > 0
                    ? user.teams.map((t) => t.name).join(", ")
                    : "No Teams"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Date Filter & Refresh */}
        <div className="flex items-center gap-2.5 self-stretch lg:self-auto">
          <div className="w-52">
            <SelectDropdown
              value={dateRange}
              onChange={(val) => setDateRange(val)}
              options={DATE_RANGE_OPTIONS}
              size="md"
            />
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="h-10 px-4 bg-[#2B4C7E] hover:bg-[#1F3864] text-white rounded-lg text-sm font-semibold shadow-xs transition-all flex items-center gap-2 shrink-0 active:scale-[0.98] cursor-pointer"
            title="Refresh Performance Data"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${isFetching ? "animate-spin" : ""}`}
            >
              refresh
            </span>
            <span>Refresh</span>
          </button>
        </div>
      </section>

      {/* SECTION 2: TOP ROW: 6 Standard Stat Cards (Identical to Dashboard) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
        <StatCard
          title="Total Tickets"
          count={totalTickets}
          icon="layers"
          accentColor="#1F3864"
        />
        <StatCard
          title="Open"
          count={statusBehaviors.OPEN}
          icon="inbox"
          accentColor="#1E88E5"
          subtitleColor="#1E88E5"
        />
        <StatCard
          title="In Progress"
          count={statusBehaviors.IN_PROGRESS}
          icon="engineering"
          accentColor="#FB8C00"
          subtitleColor="#FB8C00"
        />
        <StatCard
          title="On Hold"
          count={statusBehaviors.ON_HOLD}
          icon="pause_circle"
          accentColor="#8E24AA"
          subtitleColor="#8E24AA"
        />
        <StatCard
          title="Resolved"
          count={statusBehaviors.RESOLVED}
          icon="check_circle"
          accentColor="#43A047"
          subtitleColor="#43A047"
        />
        <StatCard
          title="Closed"
          count={statusBehaviors.CLOSED}
          icon="archive"
          accentColor="#757575"
        />
      </div>

      {/* SECTION 3: Standard Priority Bar Chart & Status Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PriorityBarChart
          total={totalTickets}
          byPriority={byPriorityList}
          title="Tickets by Priority"
        />
        <StatusDonutChart
          total={totalTickets}
          byStatusBehavior={statusBehaviors}
          title="Tickets by Status"
        />
      </div>

      {/* SECTION 4: Scoped Tickets Table with Status & Priority Filters */}
      <section className="bg-white dark:bg-[#121E30] rounded-xl shadow-xs border border-[#E5E7EB] dark:border-[#1E2D45] overflow-hidden flex flex-col">
        {/* Table Controls Header */}
        <div className="p-4 border-b border-gray-100 dark:border-[#1E2D45] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Dual Tabs: Assigned Tickets vs Created Tickets */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-[#1A283E] rounded-lg self-start">
            <button
              type="button"
              onClick={() => setActiveTab("assigned")}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "assigned"
                  ? "bg-white dark:bg-[#121E30] text-[#1F3864] dark:text-blue-300 shadow-xs"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <span>Assigned Tickets</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === "assigned"
                    ? "bg-blue-50 dark:bg-blue-950/60 text-[#1F3864] dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    : "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                {assignedTickets.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("created")}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "created"
                  ? "bg-white dark:bg-[#121E30] text-[#1F3864] dark:text-blue-300 shadow-xs"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <span>Created Tickets</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === "created"
                    ? "bg-blue-50 dark:bg-blue-950/60 text-[#1F3864] dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    : "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                {createdTickets.length}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]">
                search
              </span>
              <input
                type="search"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                placeholder="Search ticket # or title..."
                className="w-full h-10 pl-8 pr-3 text-sm bg-[#F9FAFB] dark:bg-[#1A283E] border border-gray-200 dark:border-[#283A55] rounded-lg focus:outline-none focus:border-[#1F3864]"
              />
            </div>

            {/* Status Filter */}
            <div className="w-44">
              <SelectDropdown
                value={ticketStatusFilter}
                onChange={(val) => setTicketStatusFilter(val)}
                options={STATUS_FILTER_OPTIONS}
                size="md"
              />
            </div>

            {/* Priority Filter */}
            <div className="w-44">
              <SelectDropdown
                value={ticketPriorityFilter}
                onChange={(val) => setTicketPriorityFilter(val)}
                options={PRIORITY_FILTER_OPTIONS}
                size="md"
              />
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        {filteredTickets.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No tickets match your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAFBFD] dark:bg-[#162234] border-b border-gray-100 dark:border-[#1E2D45] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-[16%] min-w-[120px]">Ticket #</th>
                  <th className="py-3 px-4 w-[32%] min-w-[200px]">Summary</th>
                  <th className="py-3 px-4 w-[16%] min-w-[130px]">
                    Department
                  </th>
                  <th className="py-3 px-4 w-[12%] min-w-[100px]">Team</th>
                  <th className="py-3 px-4 w-[12%] min-w-[100px]">Status</th>
                  <th className="py-3 px-4 w-[12%] min-w-[100px]">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#1E2D45]">
                {filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#1F3864] dark:text-blue-400">
                      {t.ticketNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                      <span className="line-clamp-1" title={t.title}>
                        {t.title}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {t.department?.name || "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {t.team?.name || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={t.status?.name || "Open"}
                        statusId={t.status?.id}
                        behavior={t.status?.behavior}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <PriorityBadge
                        priority={t.priority?.name || "Normal"}
                        priorityId={t.priority?.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
