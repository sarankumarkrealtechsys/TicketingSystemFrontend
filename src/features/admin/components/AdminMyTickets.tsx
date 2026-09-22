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
import {
  fetchAllTicketsForExport,
} from "@/features/reports/api";
import {
  exportTicketsToCSV,
  exportTicketsToExcel,
  exportTicketsToPDF,
  ReportMetadata,
} from "@/features/reports/utils/exportUtils";
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileCode,
  Loader2,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

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

  // Export state
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | "csv" | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

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

  // Export Handler
  const handleExport = async (formatType: "excel" | "pdf" | "csv") => {
    setIsExporting(formatType);
    setIsExportMenuOpen(false);

    try {
      const rawTickets = await fetchAllTicketsForExport({
        ...filters,
        scope: "personal",
      });

      const userName = currentUser?.name || currentUser?.email || "Unknown User";
      const projectName = projects.find((p: any) => p.id === filters.projectId)?.name;
      const priorityName = priorities.find((p: any) => p.id === filters.priorityId)?.label;
      const statusName = statuses.find((s: any) => s.id === filters.statusId)?.label;

      const metadata: ReportMetadata = {
        title: `RTS HELP DESK — ${userName.toUpperCase()}'S TICKET REPORT`,
        organizationName: "RTS Help Desk",
        generatedBy: userName,
        scopeLabel: `Personal Tickets — ${userName}`,
        totalCount: rawTickets.length,
        activeFilters: {
          project: projectName,
          priority: priorityName,
          status: statusName,
          dateRange: isDateActive ? "Past 30 Days" : undefined,
          search: filters.search ? filters.search : undefined,
        },
      };

      const dateSuffix = new Date().toISOString().slice(0, 10);

      if (formatType === "csv") {
        exportTicketsToCSV(rawTickets, `my_tickets_${dateSuffix}.csv`);
      } else if (formatType === "excel") {
        exportTicketsToExcel(rawTickets, `my_tickets_${dateSuffix}.xlsx`, metadata);
      } else if (formatType === "pdf") {
        exportTicketsToPDF(rawTickets, `my_tickets_${dateSuffix}.pdf`, metadata);
      }

      const formatLabel =
        formatType === "excel" ? "Excel" : formatType === "pdf" ? "PDF" : "CSV";
      setToast({
        type: "success",
        message: `${formatLabel} report exported successfully with ${rawTickets.length} ticket(s).`,
      });
    } catch (error) {
      console.error("Export failed:", error);
      setToast({
        type: "error",
        message: "Failed to generate export file. Please try again.",
      });
    } finally {
      setIsExporting(null);
    }
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
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-sm transition-all duration-300 animate-[slideInRight_0.3s_ease-out] ${
              toast.type === "error"
                ? "bg-red-50/95 border-red-200 text-red-800"
                : "bg-emerald-50/95 border-emerald-200 text-emerald-800"
            }`}
            style={{ maxWidth: "420px" }}
          >
            {toast.type === "error" ? (
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            )}
            <span className="text-[13px] font-medium leading-snug">
              {toast.message}
            </span>
            <button
              onClick={() => setToast(null)}
              className={`ml-2 p-1 rounded-lg transition-colors shrink-0 ${
                toast.type === "error"
                  ? "hover:bg-red-100 text-red-400 hover:text-red-600"
                  : "hover:bg-emerald-100 text-emerald-400 hover:text-emerald-600"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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

        {/* Ticket List Header with Export */}
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#1A1A1A] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#1F3864]">list_alt</span>
            Ticket List
            <span className="text-xs font-semibold text-gray-400">({ticketsData?.total || 0})</span>
          </h2>
          <div className="relative">
            <button
              className={`h-8 px-3 text-[12px] font-medium rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-[0.98] ${
                isExporting
                  ? "bg-[#1F3864]/60 text-white/70 cursor-not-allowed"
                  : "bg-[#1F3864] text-white hover:bg-[#03224D] cursor-pointer"
              }`}
              onClick={() => !isExporting && setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={!!isExporting}
              type="button"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isExporting ? "Exporting..." : "Export"}</span>
              {!isExporting && <ChevronDown className="w-3 h-3 text-white/80" />}
            </button>

            {isExportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsExportMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-200/80 py-1.5 z-50 animate-[fadeInUp_0.15s_ease-out]">
                  <button
                    className="w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-3 hover:bg-[#F0F4FA] transition-colors"
                    onClick={() => handleExport("excel")}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-gray-700">Excel Spreadsheet (.xlsx)</span>
                  </button>
                  <button
                    className="w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-3 hover:bg-[#F0F4FA] transition-colors"
                    onClick={() => handleExport("pdf")}
                  >
                    <FileText className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-gray-700">PDF Document (.pdf)</span>
                  </button>
                  <button
                    className="w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-3 hover:bg-[#F0F4FA] transition-colors"
                    onClick={() => handleExport("csv")}
                  >
                    <FileCode className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-gray-700">CSV Spreadsheet (.csv)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

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
