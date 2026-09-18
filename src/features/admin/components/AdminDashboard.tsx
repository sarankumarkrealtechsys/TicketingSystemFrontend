import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/layout/AppLayout";
import { FilterToolbar } from "./FilterToolbar";
import { TicketsTable } from "./TicketsTable";
import {
  StatCard,
  PriorityBarChart,
  StatusDonutChart,
} from "@/shared/components";
import {
  useTicketStatsQuery,
  useTicketsTableQuery,
  useProjectsQuery,
  useTeamsQuery,
  useUsersQuery,
  usePrioritiesQuery,
  useStatusesQuery,
} from "../api";
import { TicketQueryParams } from "../types";

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Query parameters state
  const [filters, setFilters] = useState<TicketQueryParams>({
    page: 1,
    pageSize: 10,
    search: "",
    projectId: undefined,
    teamId: undefined,
    assigneeId: undefined,
    priorityId: undefined,
    statusId: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  const [isDateActive, setIsDateActive] = useState(false);

  // Queries
  const { data: statsData } = useTicketStatsQuery();
  const { data: ticketsData, isLoading: isTicketsLoading } = useTicketsTableQuery(filters);
  const { data: projects = [] } = useProjectsQuery();
  const { data: teams = [] } = useTeamsQuery();
  const { data: users = [] } = useUsersQuery();
  const { data: priorities = [] } = usePrioritiesQuery();
  const { data: statuses = [] } = useStatusesQuery();

  const handleFilterChange = (newFilters: Partial<TicketQueryParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      pageSize: 10,
      search: "",
      projectId: undefined,
      teamId: undefined,
      assigneeId: undefined,
      priorityId: undefined,
      statusId: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    setIsDateActive(false);
  };

  const handleToggleDateFilter = () => {
    if (isDateActive) {
      setFilters((prev) => ({
        ...prev,
        startDate: undefined,
        endDate: undefined,
        page: 1,
      }));
      setIsDateActive(false);
    } else {
      const now = new Date();
      const past30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setFilters((prev) => ({
        ...prev,
        startDate: past30Days.toISOString(),
        endDate: now.toISOString(),
        page: 1,
      }));
      setIsDateActive(true);
    }
  };

  const handleViewTicket = (ticketId: number) => {
    navigate(`/tickets/${ticketId}`);
  };

  const total = statsData?.total ?? ticketsData?.total ?? 0;
  const statusBehaviors = statsData?.byStatusBehavior || {
    OPEN: 0,
    IN_PROGRESS: 0,
    ON_HOLD: 0,
    RESOLVED: 0,
    CLOSED: 0,
  };

  return (
    <AppLayout
      role="ADMIN"
      onSearch={(query) => handleFilterChange({ search: query, page: 1 })}
    >
      <div className="space-y-6">
        {/* Page Title & Org-Wide Admin Scope Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-semibold text-[24px] text-[#1A1A1A] tracking-tight">
                Operations Workspace
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#D1E4FF] text-[#001D36] tracking-wide">
                Org-Wide Admin Scope
              </span>
            </div>
            <p className="text-[13px] text-[#5F6368] mt-0.5">
              Org-wide, at-a-glance view of every ticket in the system with
              full triage and drill-down.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="h-9 px-3.5 bg-[#1F3864] text-white text-[13px] font-semibold rounded-lg shadow-sm hover:bg-[#03224D] transition-all flex items-center gap-1.5 active:scale-[0.98]"
              onClick={() => navigate("/tickets/create")}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">
                add
              </span>
              <span>Create Ticket</span>
            </button>
          </div>
        </div>

        {/* TOP ROW: 6 Stat Cards (3 per row on mobile, 6 on desktop) */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          <StatCard
            title="Total Tickets"
            count={total}
            subtitle="All active & archived"
            icon="layers"
            accentColor="#1F3864"
          />
          <StatCard
            title="Open"
            count={statusBehaviors.OPEN}
            subtitle="Awaiting triage"
            icon="inbox"
            accentColor="#1E88E5"
            subtitleColor="#1E88E5"
          />
          <StatCard
            title="In Progress"
            count={statusBehaviors.IN_PROGRESS}
            subtitle="Under investigation"
            icon="engineering"
            accentColor="#FB8C00"
            subtitleColor="#FB8C00"
          />
          <StatCard
            title="On Hold"
            count={statusBehaviors.ON_HOLD}
            subtitle="Vendor / Client wait"
            icon="pause_circle"
            accentColor="#8E24AA"
            subtitleColor="#8E24AA"
          />
          <StatCard
            title="Resolved"
            count={statusBehaviors.RESOLVED}
            subtitle="Solution verified"
            icon="check_circle"
            accentColor="#43A047"
            subtitleColor="#43A047"
          />
          <StatCard
            title="Closed"
            count={statusBehaviors.CLOSED}
            subtitle="Archived SLA met"
            icon="archive"
            accentColor="#757575"
          />
        </div>

        {/* TWO-COLUMN CHART ROW (Priority Bar Chart & Status Donut Chart) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PriorityBarChart
            total={total}
            byPriority={statsData?.byPriority || []}
          />
          <StatusDonutChart
            total={total}
            byStatusBehavior={statusBehaviors}
          />
        </div>

        {/* FILTER TOOLBAR */}
        <FilterToolbar
          filters={filters}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
          projects={projects}
          teams={teams}
          users={users}
          priorities={priorities}
          statuses={statuses}
          isDateActive={isDateActive}
          onToggleDateFilter={handleToggleDateFilter}
        />

        {/* DATA TABLE */}
        <TicketsTable
          tickets={ticketsData?.tickets || []}
          total={ticketsData?.total || 0}
          page={filters.page || 1}
          pageSize={filters.pageSize || 10}
          totalPages={ticketsData?.totalPages || 1}
          onPageChange={(newPage) => handleFilterChange({ page: newPage })}
          onViewTicket={handleViewTicket}
          isLoading={isTicketsLoading}
        />
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
