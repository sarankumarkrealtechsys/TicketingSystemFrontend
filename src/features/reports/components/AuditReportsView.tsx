import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppSelector } from "@/features/auth/authSlice";
import { FilterToolbar } from "@/features/admin/components/FilterToolbar";
import { TicketsTable } from "@/features/admin/components/TicketsTable";
import { StatCard } from "@/shared/components";
import { TicketDetailsOverlay } from "@/features/ticket-management";
import {
  useProjectsQuery,
  useTeamsQuery,
  useUsersQuery,
  usePrioritiesQuery,
  useStatusesQuery,
} from "@/features/admin/api";
import {
  ReportQueryParams,
  useReportTicketsQuery,
  fetchAllTicketsForExport,
  useSystemAuditLogsQuery,
  fetchSystemAuditLogsForExport,
} from "../api";
import {
  exportTicketsToCSV,
  exportTicketsToExcel,
  exportTicketsToPDF,
  exportAuditLogsToCSV,
  exportAuditLogsToExcel,
  exportAuditLogsToPDF,
  ReportMetadata,
} from "../utils/exportUtils";
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileCode,
  Loader2,
  ChevronDown,
  ShieldAlert,
  Layers,
  Inbox,
  Wrench,
  PauseCircle,
  CheckCircle,
  Archive,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export interface AuditReportsViewProps {
  isGlobal?: boolean;
}

export const AuditReportsView: React.FC<AuditReportsViewProps> = ({
  isGlobal = true,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useAppSelector((state) => state.auth.user);

  // Active Admin View mode: "tickets" or "systemAudit"
  const [activeAdminTab, setActiveAdminTab] = useState<"tickets" | "systemAudit">(
    "tickets"
  );

  // Export dropdown menu open state (Tickets)
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | "csv" | null>(
    null
  );

  // Export state for System Security Audit Log
  const [isSecurityExportMenuOpen, setIsSecurityExportMenuOpen] = useState(false);
  const [isSecurityExporting, setIsSecurityExporting] = useState<"excel" | "pdf" | "csv" | null>(
    null
  );

  // System Security Audit Log Pagination state
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(20);

  // Toast notification state
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Auto-dismiss toast after 5 seconds
  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Selected Ticket Drawer state synced with URL
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

  // Scope filter: "all" (Global only), "personal", "created", "assigned"
  const [activeScope, setActiveScope] = useState<
    "all" | "personal" | "created" | "assigned"
  >(isGlobal ? "all" : "personal");

  // Query parameters state
  const [filters, setFilters] = useState<ReportQueryParams>({
    page: 1,
    pageSize: 10,
    search: "",
    scope: isGlobal ? "all" : "personal",
    projectId: undefined,
    teamId: undefined,
    assigneeId: undefined,
    priorityId: undefined,
    statusId: undefined,
    ticketType: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  const [isDateActive, setIsDateActive] = useState(false);

  // Queries
  const {
    data: ticketsData,
    isLoading: isTicketsLoading,
    isFetching: isTicketsFetching,
    refetch: refetchTickets,
  } = useReportTicketsQuery({
    ...filters,
    scope: activeScope,
  });

  const { data: projects = [] } = useProjectsQuery();
  const { data: teams = [] } = useTeamsQuery();
  const { data: users = [] } = useUsersQuery();
  const { data: priorities = [] } = usePrioritiesQuery();
  const { data: statuses = [] } = useStatusesQuery();

  // System Security Audit Logs (for admin sub-tab)
  const {
    data: systemAuditData,
    isLoading: isAuditLoading,
    refetch: refetchAuditLogs,
  } = useSystemAuditLogsQuery(
    { page: auditPage, pageSize: auditPageSize },
    isGlobal && activeAdminTab === "systemAudit"
  );

  const auditTotal = systemAuditData?.total || 0;
  const auditTotalPages = systemAuditData?.totalPages || Math.ceil(auditTotal / auditPageSize) || 1;
  const auditStartItem = auditTotal === 0 ? 0 : (auditPage - 1) * auditPageSize + 1;
  const auditEndItem = Math.min(auditPage * auditPageSize, auditTotal);

  const handleScopeChange = (
    newScope: "all" | "personal" | "created" | "assigned"
  ) => {
    setActiveScope(newScope);
    setFilters((prev) => ({
      ...prev,
      scope: newScope,
      page: 1,
    }));
  };

  const handleFilterChange = (newFilters: Partial<ReportQueryParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      pageSize: 10,
      search: "",
      scope: activeScope,
      projectId: undefined,
      teamId: undefined,
      assigneeId: undefined,
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

  // KPI Metrics Calculation from currently loaded tickets
  const totalCount = ticketsData?.total || 0;
  const statusCounts = useMemo(() => {
    const list = ticketsData?.tickets || [];
    const counts = {
      OPEN: 0,
      IN_PROGRESS: 0,
      ON_HOLD: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };
    list.forEach((t) => {
      const b = (t.status?.behavior || "OPEN").toUpperCase() as keyof typeof counts;
      if (counts[b] !== undefined) counts[b]++;
    });
    return counts;
  }, [ticketsData?.tickets]);

  // Export Trigger Handler
  const handleExport = async (formatType: "excel" | "pdf" | "csv") => {
    setIsExporting(formatType);
    setIsExportMenuOpen(false);

    try {
      const rawTickets = await fetchAllTicketsForExport({
        ...filters,
        scope: activeScope,
      });

      const projectName = projects.find((p) => p.id === filters.projectId)?.name;
      const teamName = teams.find((t) => t.id === filters.teamId)?.name;
      const priorityName = priorities.find((p) => p.id === filters.priorityId)?.label;
      const statusName = statuses.find((s) => s.id === filters.statusId)?.label;

      const userName = currentUser?.name || currentUser?.email || "Unknown User";

      const metadata: ReportMetadata = {
        title: isGlobal
          ? "RTS HELP DESK — ORGANIZATION TICKET AUDIT REPORT"
          : `RTS HELP DESK — ${userName.toUpperCase()}'S TICKET REPORT`,
        organizationName: "RTS Help Desk",
        generatedBy: userName,
        scopeLabel:
          activeScope === "all"
            ? `Entire Organization (Total Tickets) — Exported by ${userName}`
            : activeScope === "created"
            ? `Tickets Created by ${userName}`
            : activeScope === "assigned"
            ? `Tickets Assigned to ${userName}`
            : `Personal Tickets — ${userName}`,
        totalCount: rawTickets.length,
        activeFilters: {
          project: projectName,
          team: teamName,
          priority: priorityName,
          status: statusName,
          dateRange: isDateActive ? "Past 30 Days" : undefined,
          search: filters.search ? filters.search : undefined,
        },
      };

      const dateSuffix = new Date().toISOString().slice(0, 10);

      if (formatType === "csv") {
        exportTicketsToCSV(rawTickets, `ticket_audit_report_${dateSuffix}.csv`);
      } else if (formatType === "excel") {
        exportTicketsToExcel(
          rawTickets,
          `ticket_audit_report_${dateSuffix}.xlsx`,
          metadata
        );
      } else if (formatType === "pdf") {
        exportTicketsToPDF(
          rawTickets,
          `ticket_audit_report_${dateSuffix}.pdf`,
          metadata
        );
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

  // System Security Audit Log Export Handler
  const handleSecurityExport = async (formatType: "excel" | "pdf" | "csv") => {
    setIsSecurityExporting(formatType);
    setIsSecurityExportMenuOpen(false);

    try {
      const allLogs = await fetchSystemAuditLogsForExport();
      const logs = allLogs.length > 0 ? allLogs : (systemAuditData?.logs || []);
      if (logs.length === 0) {
        setToast({
          type: "error",
          message: "No security audit log entries to export.",
        });
        return;
      }

      const userName = currentUser?.name || currentUser?.email || "Unknown Admin";
      const metadata: ReportMetadata = {
        title: "RTS HELP DESK — SYSTEM SECURITY AUDIT LOG",
        organizationName: "RTS Help Desk",
        generatedBy: userName,
        scopeLabel: "System Security & Permission Denials — Organization Audit Trail",
        totalCount: logs.length,
      };

      const dateSuffix = new Date().toISOString().slice(0, 10);

      if (formatType === "csv") {
        exportAuditLogsToCSV(logs, `security_audit_logs_${dateSuffix}.csv`);
      } else if (formatType === "excel") {
        exportAuditLogsToExcel(logs, `security_audit_logs_${dateSuffix}.xlsx`, metadata);
      } else if (formatType === "pdf") {
        exportAuditLogsToPDF(logs, `security_audit_logs_${dateSuffix}.pdf`, metadata);
      }

      const formatLabel =
        formatType === "excel" ? "Excel" : formatType === "pdf" ? "PDF" : "CSV";
      setToast({
        type: "success",
        message: `${formatLabel} security audit log exported successfully with ${logs.length} event(s).`,
      });
    } catch (error) {
      console.error("Security audit export failed:", error);
      setToast({
        type: "error",
        message: "Failed to generate security audit export file. Please try again.",
      });
    } finally {
      setIsSecurityExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Styled Toast Notification ── */}
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
      {/* ── Page Header Section ── */}
      <div className="flex flex-row items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-gray-500 font-medium mb-0.5 sm:mb-1">
            <span>Home</span>
            <span className="material-symbols-outlined text-[13px] sm:text-[14px]">
              chevron_right
            </span>
            <span>Reports</span>
            <span className="material-symbols-outlined text-[13px] sm:text-[14px]">
              chevron_right
            </span>
            <span className="text-[#1F3864] dark:text-blue-400 font-semibold">
              {isGlobal ? "Audit Reports & History" : "My Ticket Reports"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] dark:text-white tracking-tight">
            {isGlobal ? "Audit Reports & History" : "My Ticket Reports"}
          </h1>
          {!isGlobal && (
            <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
              Audit trail and downloadable reports for tickets created by or assigned to you.
            </p>
          )}
        </div>
      </div>

      {/* ── Global Admin Sub-Tabs (Tickets vs Security Audit Log) ── */}
      {isGlobal && (
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-[#1E2D45] pb-px">
          <button
            type="button"
            onClick={() => setActiveAdminTab("tickets")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeAdminTab === "tickets"
                ? "border-[#1F3864] text-[#1F3864] dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Ticket Audit Reports</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-extrabold">
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab("systemAudit")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeAdminTab === "systemAudit"
                ? "border-[#1F3864] text-[#1F3864] dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>System Security Audit Log</span>
          </button>
        </div>
      )}

      {/* ── MODE A: TICKET AUDIT REPORTS ── */}
      {activeAdminTab === "tickets" && (
        <>
          {/* Scope Selector Tabs (All / Created / Assigned) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit flex-wrap">
            {isGlobal ? (
              <button
                type="button"
                onClick={() => handleScopeChange("all")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeScope === "all"
                    ? "bg-[#1F3864] text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                }`}
              >
                All Organization Tickets
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleScopeChange("personal")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeScope === "personal"
                    ? "bg-[#1F3864] text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                }`}
              >
                All My Tickets
              </button>
            )}

            <button
              type="button"
              onClick={() => handleScopeChange("created")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeScope === "created"
                  ? "bg-[#1F3864] text-white shadow-xs"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
              }`}
            >
              Created by Me
            </button>

            <button
              type="button"
              onClick={() => handleScopeChange("assigned")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeScope === "assigned"
                  ? "bg-[#1F3864] text-white shadow-xs"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
              }`}
            >
              Assigned to Me
            </button>
          </div>

          {/* ── TOP KPI SUMMARY CARDS (2 per row on mobile) ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
            <StatCard
              title="Total in Report"
              count={totalCount}
              icon="layers"
              accentColor="#1F3864"
            />
            <StatCard
              title="Open"
              count={statusCounts.OPEN}
              icon="inbox"
              accentColor="#1E88E5"
            />
            <StatCard
              title="In Progress"
              count={statusCounts.IN_PROGRESS}
              icon="engineering"
              accentColor="#FB8C00"
            />
            <StatCard
              title="On Hold"
              count={statusCounts.ON_HOLD}
              icon="pause_circle"
              accentColor="#8E24AA"
            />
            <StatCard
              title="Resolved"
              count={statusCounts.RESOLVED}
              icon="check_circle"
              accentColor="#43A047"
            />
            <StatCard
              title="Closed"
              count={statusCounts.CLOSED}
              icon="archive"
              accentColor="#757575"
            />
          </div>

          {/* ── FILTER TOOLBAR (Exact same as Admin Dashboard) ── */}
          <FilterToolbar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClear={handleClearFilters}
            onRefresh={refetchTickets}
            isRefreshing={isTicketsFetching}
            projects={projects}
            teams={teams}
            users={users}
            priorities={priorities}
            statuses={statuses}
            isDateActive={isDateActive}
            onToggleDateFilter={handleToggleDateFilter}
          />

          {/* ── TICKET LIST HEADER WITH EXPORT ── */}
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

          {/* ── TICKETS TABLE & MOBILE CARDS ── */}
          <TicketsTable
            tickets={ticketsData?.tickets || []}
            total={ticketsData?.total || 0}
            page={filters.page || 1}
            pageSize={filters.pageSize || 10}
            totalPages={ticketsData?.totalPages || 1}
            onPageChange={handlePageChange}
            onViewTicket={(ticketId) => setSelectedTicketId(ticketId)}
            isLoading={isTicketsLoading}
            isFetching={isTicketsFetching}
          />
        </>
      )}

      {/* ── MODE B: SYSTEM SECURITY AUDIT LOG ── */}
      {isGlobal && activeAdminTab === "systemAudit" && (
        <div className="bg-white dark:bg-[#121E30] rounded-xl shadow-xs border border-gray-200 dark:border-[#1E2D45] overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-slate-50 dark:bg-[#162234]">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>System Security & Permission Denials</span>
                <span className="text-xs font-semibold text-gray-400">({auditTotal})</span>
              </h3>
              <p className="text-xs text-gray-500">
                Immutable audit trail of RBAC events, permission denials, and critical transactions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => refetchAuditLogs()}
                className="px-3 py-1.5 text-xs font-semibold text-[#1F3864] bg-blue-50 rounded-lg hover:bg-blue-100 transition cursor-pointer"
              >
                Refresh Logs
              </button>

              <div className="relative">
                <button
                  className={`h-8 px-3 text-[12px] font-medium rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-[0.98] ${
                    isSecurityExporting
                      ? "bg-[#1F3864]/60 text-white/70 cursor-not-allowed"
                      : "bg-[#1F3864] text-white hover:bg-[#03224D] cursor-pointer"
                  }`}
                  onClick={() => !isSecurityExporting && setIsSecurityExportMenuOpen(!isSecurityExportMenuOpen)}
                  disabled={!!isSecurityExporting}
                  type="button"
                >
                  {isSecurityExporting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{isSecurityExporting ? "Exporting..." : "Export"}</span>
                  {!isSecurityExporting && <ChevronDown className="w-3 h-3 text-white/80" />}
                </button>

                {isSecurityExportMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsSecurityExportMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-200/80 py-1.5 z-50 animate-[fadeInUp_0.15s_ease-out]">
                      <button
                        className="w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-3 hover:bg-[#F0F4FA] transition-colors"
                        onClick={() => handleSecurityExport("excel")}
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-gray-700">Excel Spreadsheet (.xlsx)</span>
                      </button>
                      <button
                        className="w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-3 hover:bg-[#F0F4FA] transition-colors"
                        onClick={() => handleSecurityExport("pdf")}
                      >
                        <FileText className="w-4 h-4 text-red-500" />
                        <span className="font-medium text-gray-700">PDF Document (.pdf)</span>
                      </button>
                      <button
                        className="w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-3 hover:bg-[#F0F4FA] transition-colors"
                        onClick={() => handleSecurityExport("csv")}
                      >
                        <FileCode className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-gray-700">CSV Spreadsheet (.csv)</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isAuditLoading ? (
              <div className="py-16 flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#1F3864]" />
                <span>Loading system audit logs...</span>
              </div>
            ) : !systemAuditData?.logs || systemAuditData.logs.length === 0 ? (
              <div className="py-16 text-center text-xs text-gray-500">
                No system audit events recorded.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#162234] border-b border-gray-200 dark:border-gray-800 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Performed By</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {systemAuditData.logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-gray-600 font-mono whitespace-nowrap">
                        {new Date(log.performedAt || log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#1F3864]">
                        {log.entityType} #{log.entityId}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.action === "PERMISSION_DENIED"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900 font-medium">
                        {log.performedBy?.name || log.performedBy?.username || `User #${log.performedById}`}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-600 max-w-xs truncate">
                        {log.newValue || log.previousValue || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── SECURITY AUDIT PAGINATION FOOTER ── */}
          {auditTotal > 0 && (
            <div className="p-3 sm:p-4 border-t border-[#EEEEEE] dark:border-[#1E2D45] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] sm:text-[13px] text-[#5F6368] dark:text-gray-400 bg-white dark:bg-[#121E30]">
              <div className="flex items-center gap-3">
                <span>
                  Showing{" "}
                  <strong className="font-semibold text-[#1A1A1A] dark:text-white">
                    {auditStartItem}
                  </strong>{" "}
                  to{" "}
                  <strong className="font-semibold text-[#1A1A1A] dark:text-white">
                    {auditEndItem}
                  </strong>{" "}
                  of{" "}
                  <strong className="font-semibold text-[#1A1A1A] dark:text-white">
                    {auditTotal}
                  </strong>{" "}
                  events
                </span>

                <div className="hidden sm:flex items-center gap-1.5 ml-2 text-xs">
                  <span>Per page:</span>
                  <select
                    value={auditPageSize}
                    onChange={(e) => {
                      setAuditPageSize(Number(e.target.value));
                      setAuditPage(1);
                    }}
                    className="h-7 px-2 border border-[#E0E0E0] dark:border-gray-700 rounded bg-white dark:bg-[#162234] text-[#1A1A1A] dark:text-white text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1F3864]"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
                <button
                  className="px-3 py-1 rounded border border-[#E0E0E0] dark:border-gray-700 text-[12px] font-medium text-[#5F6368] dark:text-gray-300 hover:bg-[#F0EDED] dark:hover:bg-gray-800 transition-colors disabled:opacity-40 active:scale-[0.98] cursor-pointer"
                  disabled={auditPage <= 1}
                  onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))}
                  type="button"
                >
                  Prev
                </button>

                {/* Desktop page buttons */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {Array.from({ length: Math.min(auditTotalPages, 5) }).map((_, i) => {
                    const pageNum = i + 1;
                    const isActive = pageNum === auditPage;
                    return (
                      <button
                        key={pageNum}
                        className={`px-3 py-1 rounded text-[12px] font-semibold transition-all active:scale-[0.98] cursor-pointer ${
                          isActive
                            ? "bg-[#1F3864] text-white shadow-sm"
                            : "border border-[#E0E0E0] dark:border-gray-700 text-[#1A1A1A] dark:text-gray-300 hover:bg-[#F0EDED] dark:hover:bg-gray-800"
                        }`}
                        onClick={() => setAuditPage(pageNum)}
                        type="button"
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {auditTotalPages > 5 && (
                    <span className="px-1 text-[#5F6368] dark:text-gray-400">...</span>
                  )}
                </div>

                <span className="sm:hidden text-xs font-semibold text-[#1A1A1A] dark:text-white">
                  Page {auditPage} of {Math.max(auditTotalPages, 1)}
                </span>

                <button
                  className="px-3 py-1 rounded border border-[#E0E0E0] dark:border-gray-700 text-[12px] font-medium text-[#5F6368] dark:text-gray-300 hover:bg-[#F0EDED] dark:hover:bg-gray-800 transition-colors disabled:opacity-40 active:scale-[0.98] cursor-pointer"
                  disabled={auditPage >= auditTotalPages}
                  onClick={() => setAuditPage((prev) => Math.min(auditTotalPages, prev + 1))}
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TICKET DETAILS OVERLAY DRAWER ── */}
      <TicketDetailsOverlay
        ticketId={selectedTicketId}
        isOpen={selectedTicketId !== null}
        onClose={() => setSelectedTicketId(null)}
        onSelectTicket={(id) => setSelectedTicketId(id)}
      />
    </div>
  );
};

export default AuditReportsView;
