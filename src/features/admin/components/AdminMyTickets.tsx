import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppSelector } from "@/features/auth/authSlice";
import { AppLayout } from "@/layout/AppLayout";
import { UserFilterToolbar } from "@/features/user-dashboard/components/UserFilterToolbar";
import { TicketsTable } from "./TicketsTable";
import {
  StatCard,
  PriorityBarChart,
  StatusDonutChart,
} from "@/shared/components";
import {
  useUserTicketStatsQuery,
  useUserTicketsTableQuery,
  useProjectsQuery,
  usePrioritiesQuery,
  useStatusesQuery,
} from "@/features/user-dashboard/api";
import { UserTicketQueryParams } from "@/features/user-dashboard/types";
import { TicketDetailsOverlay } from "@/features/ticket-management";

export const AdminMyTickets: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useAppSelector((state) => state.auth.user);

  // Sync selectedTicketId with URL query param so refresh preserves overlay state
  const ticketIdParam = searchParams.get("ticketId");
  const selectedTicketId = ticketIdParam ? Number(ticketIdParam) : null;

  const setSelectedTicketId = (id: number | null) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id !== null) {
          next.set("ticketId", String(id));
        } else {
          next.delete("ticketId");
        }
        return next;
      },
      { replace: true }
    );
  };

  // Query parameters state with strict personal scope
  const [filters, setFilters] = useState<UserTicketQueryParams>({
    page: 1,
    pageSize: 10,
    search: "",
    scope: "personal",
    projectId: undefined,
    priorityId: undefined,
    statusId: undefined,
    ticketType: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  const [isDateActive, setIsDateActive] = useState(false);

  // Queries strictly scoped to active admin's personal tickets
  const { data: statsData } = useUserTicketStatsQuery(currentUser?.id, "personal");
  const {
    data: ticketsData,
    isLoading: isTicketsLoading,
    isFetching: isTicketsFetching,
    refetch: refetchTickets,
  } = useUserTicketsTableQuery(currentUser?.id, filters);
  const { data: projects = [] } = useProjectsQuery();
  const { data: priorities = [] } = usePrioritiesQuery();
  const { data: statuses = [] } = useStatusesQuery();

  const handleFilterChange = (newFilters: Partial<UserTicketQueryParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      pageSize: 10,
      search: "",
      scope: "personal",
      projectId: undefined,
      priorityId: undefined,
      statusId: undefined,
      ticketType: undefined,
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
    setSelectedTicketId(ticketId);
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
    <AppLayout role="ADMIN">
      <div className="space-y-6">
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-semibold text-[24px] text-[#1A1A1A] tracking-tight">
                My Tickets
              </h1>
            </div>
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

        {/* TOP ROW: 6 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
          <StatCard
            title="Total Tickets"
            count={total}
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

        {/* TWO-COLUMN CHART ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PriorityBarChart
            total={total}
            byPriority={statsData?.byPriority || []}
            title="Tickets by Priority"
          />
          <StatusDonutChart
            total={total}
            byStatusBehavior={statusBehaviors}
            title="Tickets by Status"
          />
        </div>

        {/* FILTER TOOLBAR */}
        <UserFilterToolbar
          filters={filters}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
          onRefresh={refetchTickets}
          isRefreshing={isTicketsFetching}
          projects={projects}
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
          isFetching={isTicketsFetching}
        />

        {/* TICKET DETAILS OVERLAY DRAWER */}
        <TicketDetailsOverlay
          ticketId={selectedTicketId}
          isOpen={selectedTicketId !== null}
          onClose={() => setSelectedTicketId(null)}
          onSelectTicket={(id) => setSelectedTicketId(id)}
        />
      </div>
    </AppLayout>
  );
};

export default AdminMyTickets;
