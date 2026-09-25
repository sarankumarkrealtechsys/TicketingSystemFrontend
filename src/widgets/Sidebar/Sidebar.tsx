import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "@/features/auth/authSlice";
import { PERMISSIONS } from "@/features/auth/permissions";

export interface SidebarNavItem {
  name: string;
  href: string;
  icon: string;
  badge?: string | number;
  exact?: boolean;
}

export interface SidebarNavGroup {
  name: string;
  icon: string;
  children: {
    name: string;
    href: string;
    exact?: boolean;
  }[];
}

export interface SidebarProps {
  workspaceName?: string;
  workspaceIcon?: string;
  brandTitle?: string;
  brandSubtitle?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  customNavItems?: (SidebarNavItem | SidebarNavGroup)[];
  className?: string;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

// ─── Permission Helper Hooks (non-hook inline) ───
function usePermissionScopes(permissionKey: string): string[] {
  const permissions = useAppSelector((state) => state.auth.permissions);
  return permissions?.[permissionKey] ?? [];
}

export const Sidebar: React.FC<SidebarProps> = ({
  workspaceName: explicitWorkspaceName,
  workspaceIcon: explicitWorkspaceIcon,
  brandTitle = "RTS HELP DESK",
  brandSubtitle = "Enterprise Support",
  collapsed = false,
  onToggleCollapse,
  customNavItems,
  className = "",
  mobileOpen = false,
  onCloseMobile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // ── Resolve all permissions at top level (hooks must be unconditional) ──
  const dashboardScopes = usePermissionScopes(PERMISSIONS.DASHBOARD_VIEW);
  const ticketCreateScopes = usePermissionScopes(PERMISSIONS.TICKET_CREATE);
  const ticketViewScopes = usePermissionScopes(PERMISSIONS.TICKET_VIEW);
  const projectViewScopes = usePermissionScopes(PERMISSIONS.PROJECT_VIEW);
  const departmentViewScopes = usePermissionScopes(PERMISSIONS.DEPARTMENT_VIEW);
  const teamViewScopes = usePermissionScopes(PERMISSIONS.TEAM_VIEW);
  const userViewScopes = usePermissionScopes(PERMISSIONS.USER_VIEW);
  const userCreateScopes = usePermissionScopes(PERMISSIONS.USER_CREATE);
  const userUpdateScopes = usePermissionScopes(PERMISSIONS.USER_UPDATE);
  const userDeleteScopes = usePermissionScopes(PERMISSIONS.USER_DELETE);
  const priorityManageScopes = usePermissionScopes(PERMISSIONS.PRIORITY_MANAGE);
  const priorityCreateScopes = usePermissionScopes(PERMISSIONS.PRIORITY_CREATE);
  const priorityUpdateScopes = usePermissionScopes(PERMISSIONS.PRIORITY_UPDATE);
  const priorityRetireScopes = usePermissionScopes(PERMISSIONS.PRIORITY_RETIRE);
  const statusCreateScopes = usePermissionScopes(PERMISSIONS.STATUS_CREATE);
  const statusUpdateScopes = usePermissionScopes(PERMISSIONS.STATUS_UPDATE);
  const statusRetireScopes = usePermissionScopes(PERMISSIONS.STATUS_RETIRE);
  const roleManageScopes = usePermissionScopes(PERMISSIONS.ROLE_MANAGE);
  const ticketHistoryScopes = usePermissionScopes(PERMISSIONS.TICKET_HISTORY_VIEW);
  const settingsScopes = usePermissionScopes(PERMISSIONS.SYSTEM_SETTINGS_MANAGE);
  const emailNotificationScopes = usePermissionScopes(PERMISSIONS.EMAIL_NOTIFICATIONS_MANAGE);
  const inAppNotificationScopes = usePermissionScopes(PERMISSIONS.IN_APP_NOTIFICATIONS_MANAGE);

  // ── Derive visibility flags ──
  const hasGlobalDashboard = dashboardScopes.includes("GLOBAL");

  const canCreateTicket = ticketCreateScopes.length > 0;
  const canViewTickets = ticketViewScopes.length > 0;
  const showTicketsAccordion = canCreateTicket || canViewTickets;

  const canViewProjects = projectViewScopes.length > 0;

  const hasDeptGlobal = departmentViewScopes.includes("GLOBAL");
  const hasDeptAny = departmentViewScopes.length > 0;

  const hasTeamGlobal = teamViewScopes.includes("GLOBAL");
  const hasTeamAny = teamViewScopes.length > 0;

  const hasPriorityOrStatusAccess =
    priorityManageScopes.length > 0 ||
    priorityCreateScopes.length > 0 ||
    priorityUpdateScopes.length > 0 ||
    priorityRetireScopes.length > 0 ||
    statusCreateScopes.length > 0 ||
    statusUpdateScopes.length > 0 ||
    statusRetireScopes.length > 0;

  const hasUserManagementAccess = userViewScopes.includes("GLOBAL");
  const hasRoleManage = roleManageScopes.length > 0;

  const hasHistoryGlobal = ticketHistoryScopes.includes("GLOBAL");
  const hasHistoryAny = ticketHistoryScopes.length > 0;

  const hasSettings =
    settingsScopes.length > 0 ||
    emailNotificationScopes.length > 0 ||
    inAppNotificationScopes.length > 0;

  // ── Determine workspace pill text ──
  const isAdminConsole = hasGlobalDashboard;
  const workspaceName =
    explicitWorkspaceName || (isAdminConsole ? "Admin Console" : "User Workspace");
  const workspaceIcon =
    explicitWorkspaceIcon || (isAdminConsole ? "admin_panel_settings" : "person");

  // Effective collapsed mode: only collapsed on desktop if mobile drawer is not open
  const isCollapsedMode = collapsed && !mobileOpen;

  // ── Route Activity Detection ──
  const isTicketActive = location.pathname.startsWith("/tickets");
  const isManagementActive = [
    "/projects",
    "/admin/departments",
    "/teams",
    "/admin/priorities",
    "/users",
  ].some((p) => location.pathname.startsWith(p));
  const isWorkspaceActive = [
    "/my-team",
    "/my-department",
    "/my-permissions",
    "/my-ticket-reports",
  ].some((p) => location.pathname.startsWith(p));

  // Accordion toggle states (auto-initialized based on current route)
  const [ticketsOpen, setTicketsOpen] = useState(() => isTicketActive);
  const [managementOpen, setManagementOpen] = useState(() => isManagementActive);
  const [workspaceOpen, setWorkspaceOpen] = useState(() => isWorkspaceActive);

  // Sync accordion expansion states on route navigation
  React.useEffect(() => {
    if (isTicketActive) setTicketsOpen(true);
    if (isManagementActive) setManagementOpen(true);
    if (isWorkspaceActive) setWorkspaceOpen(true);
  }, [location.pathname, isTicketActive, isManagementActive, isWorkspaceActive]);

  const handleNavClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("a")) {
      onCloseMobile?.();
    }
  };

  const handleTicketsClick = () => {
    if (isCollapsedMode) {
      navigate("/tickets");
      onCloseMobile?.();
    } else {
      setTicketsOpen((prev) => !prev);
    }
  };

  const handleManagementClick = () => {
    if (isCollapsedMode) {
      if (canViewProjects) navigate("/projects");
      else if (hasDeptGlobal) navigate("/admin/departments");
      else if (hasTeamGlobal) navigate("/teams");
      else if (hasPriorityOrStatusAccess) navigate("/admin/priorities");
      else if (hasUserManagementAccess) navigate("/users");
      onCloseMobile?.();
    } else {
      setManagementOpen((prev) => !prev);
    }
  };

  const handleWorkspaceClick = () => {
    if (isCollapsedMode) {
      if (hasTeamAny && !hasTeamGlobal) navigate("/my-team");
      else if (hasDeptAny && !hasDeptGlobal) navigate("/my-department");
      else if (!hasRoleManage) navigate("/my-permissions");
      else if (hasHistoryAny && !hasHistoryGlobal) navigate("/my-ticket-reports");
      onCloseMobile?.();
    } else {
      setWorkspaceOpen((prev) => !prev);
    }
  };

  // Group Visibility Flags
  const showManagementTab =
    canViewProjects ||
    hasDeptGlobal ||
    hasTeamGlobal ||
    hasPriorityOrStatusAccess ||
    hasUserManagementAccess;

  const showMyDepartment = hasDeptAny && !hasDeptGlobal;
  const showMyTeam = hasTeamAny && !hasTeamGlobal;
  const showMyPermissions = !hasRoleManage;
  const showMyTicketReports = hasHistoryAny && !hasHistoryGlobal;

  const showWorkspaceTab =
    showMyTeam || showMyDepartment || showMyPermissions || showMyTicketReports;

  // Sub-link class builder for accordion children
  const subLinkClass = (isActive: boolean) =>
    `block px-2.5 py-1.5 rounded-md text-[12px] transition-colors ${
      isActive
        ? "bg-white/15 text-white font-medium"
        : "text-white/70 hover:bg-white/10 hover:text-white"
    }`;

  // Tooltip wrapper for collapsed mode
  const TooltipWrap: React.FC<{ label: string; children: React.ReactNode }> = ({
    label,
    children,
  }) =>
    isCollapsedMode ? (
      <div className="relative group flex items-center justify-center w-full">
        {children}
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-[#0D1F3C] text-white text-xs font-medium rounded-lg shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap z-[200]">
          {label}
        </div>
      </div>
    ) : (
      <>{children}</>
    );

  // Reusable SidebarLink component guaranteeing 100% pixel-perfect center alignment
  const SidebarLink: React.FC<{
    to: string;
    exact?: boolean;
    icon: string;
    label: string;
    badge?: string | number;
    isBold?: boolean;
  }> = ({ to, exact, icon, label, badge, isBold }) => {
    return (
      <TooltipWrap label={label}>
        <NavLink
          to={to}
          end={exact}
          className={({ isActive }) =>
            isCollapsedMode
              ? `relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 ${
                  isActive
                    ? "bg-white/15 text-white ring-1 ring-white/20 shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              : `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-[13px] ${
                  isBold ? "font-semibold shadow-sm" : "font-medium"
                } ${
                  isActive
                    ? "bg-white/15 text-white border-l-4 border-[#1E88E5]"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`
          }
        >
          {({ isActive }) => (
            <>
              {/* Left Edge Active Indicator in Collapsed Mode */}
              {isActive && isCollapsedMode && (
                <span className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-1 h-6 bg-[#1E88E5] rounded-r-full shadow-[0_0_8px_rgba(30,136,229,0.6)]" />
              )}

              <span
                className={`material-symbols-outlined text-[20px] transition-colors shrink-0 ${
                  isActive
                    ? "text-[#1E88E5]"
                    : "text-white/70 group-hover:text-white"
                }`}
              >
                {icon}
              </span>

              {!isCollapsedMode && <span className="truncate">{label}</span>}

              {!isCollapsedMode && badge && (
                <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded bg-white/20 text-white font-semibold">
                  {badge}
                </span>
              )}
            </>
          )}
        </NavLink>
      </TooltipWrap>
    );
  };

  // Sub-Link component for clean, accessible accordion children
  const SubLinkItem: React.FC<{
    to: string;
    icon: string;
    label: string;
    exact?: boolean;
  }> = ({ to, icon, label, exact }) => (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
          isActive
            ? "bg-white/15 text-white font-semibold border-l-2 border-[#1E88E5] pl-2.5 shadow-xs"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`material-symbols-outlined text-[16px] transition-colors shrink-0 ${
              isActive ? "text-[#1E88E5]" : "text-white/60"
            }`}
          >
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );

  // ── 1. Tickets Accordion block ──
  const TicketsAccordion = () => (
    <div
      className={`pt-0.5 ${
        isCollapsedMode ? "w-full flex flex-col items-center" : ""
      }`}
    >
      <TooltipWrap label="Tickets">
        <button
          onClick={handleTicketsClick}
          type="button"
          className={
            isCollapsedMode
              ? `relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 ${
                  isTicketActive
                    ? "bg-white/15 text-white ring-1 ring-white/20 shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              : `w-full flex items-center justify-between px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors text-[13px] font-medium group cursor-pointer ${
                  isTicketActive && !ticketsOpen ? "bg-white/10 text-white" : ""
                }`
          }
        >
          {isTicketActive && isCollapsedMode && (
            <span className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-1 h-6 bg-[#1E88E5] rounded-r-full shadow-[0_0_8px_rgba(30,136,229,0.6)]" />
          )}

          <span
            className={`material-symbols-outlined text-[20px] transition-colors shrink-0 ${
              isTicketActive
                ? "text-[#1E88E5]"
                : "text-white/70 group-hover:text-white"
            }`}
          >
            confirmation_number
          </span>

          {!isCollapsedMode && (
            <div className="flex items-center justify-between flex-1 ml-3">
              <span>Tickets</span>
              <span
                className={`material-symbols-outlined text-[18px] text-white/60 transition-transform duration-200 ${
                  ticketsOpen ? "rotate-180" : ""
                }`}
              >
                expand_more
              </span>
            </div>
          )}
        </button>
      </TooltipWrap>

      {/* Sub-items (expanded mode only) */}
      {ticketsOpen && !isCollapsedMode && (
        <div className="pl-6 pr-2 py-1 space-y-1 transition-all duration-200">
          {canCreateTicket && (
            <SubLinkItem
              to="/tickets/create"
              icon="add_circle"
              label="Create Ticket"
            />
          )}
          {canViewTickets && (
            <SubLinkItem
              to="/tickets"
              exact
              icon="inbox"
              label="My Tickets"
            />
          )}
        </div>
      )}
    </div>
  );

  // ── 2. Management Accordion block (Organization Administration) ──
  const ManagementAccordion = () => (
    <div
      className={`pt-0.5 ${
        isCollapsedMode ? "w-full flex flex-col items-center" : ""
      }`}
    >
      <TooltipWrap label="Management">
        <button
          onClick={handleManagementClick}
          type="button"
          className={
            isCollapsedMode
              ? `relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 ${
                  isManagementActive
                    ? "bg-white/15 text-white ring-1 ring-white/20 shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              : `w-full flex items-center justify-between px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors text-[13px] font-medium group cursor-pointer ${
                  isManagementActive && !managementOpen
                    ? "bg-white/10 text-white"
                    : ""
                }`
          }
        >
          {isManagementActive && isCollapsedMode && (
            <span className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-1 h-6 bg-[#1E88E5] rounded-r-full shadow-[0_0_8px_rgba(30,136,229,0.6)]" />
          )}

          <span
            className={`material-symbols-outlined text-[20px] transition-colors shrink-0 ${
              isManagementActive
                ? "text-[#1E88E5]"
                : "text-white/70 group-hover:text-white"
            }`}
          >
            business_center
          </span>

          {!isCollapsedMode && (
            <div className="flex items-center justify-between flex-1 ml-3">
              <span>Management</span>
              <span
                className={`material-symbols-outlined text-[18px] text-white/60 transition-transform duration-200 ${
                  managementOpen ? "rotate-180" : ""
                }`}
              >
                expand_more
              </span>
            </div>
          )}
        </button>
      </TooltipWrap>

      {/* Sub-items (expanded mode only) */}
      {managementOpen && !isCollapsedMode && (
        <div className="pl-6 pr-2 py-1 space-y-1 transition-all duration-200">
          {canViewProjects && (
            <SubLinkItem
              to="/projects"
              icon="folder_managed"
              label="Projects Management"
            />
          )}
          {hasDeptGlobal && (
            <SubLinkItem
              to="/admin/departments"
              icon="corporate_fare"
              label="Department Management"
            />
          )}
          {hasTeamGlobal && (
            <SubLinkItem
              to="/teams"
              icon="groups"
              label="Team Management"
            />
          )}
          {hasPriorityOrStatusAccess && (
            <SubLinkItem
              to="/admin/priorities"
              icon="tune"
              label="Priorities & Statuses"
            />
          )}
          {hasUserManagementAccess && (
            <SubLinkItem
              to="/users"
              icon="person_search"
              label="User Management"
            />
          )}
        </div>
      )}
    </div>
  );

  // ── 3. My Workspace Accordion block (Personal/Member Views) ──
  const WorkspaceAccordion = () => (
    <div
      className={`pt-0.5 ${
        isCollapsedMode ? "w-full flex flex-col items-center" : ""
      }`}
    >
      <TooltipWrap label="My Workspace">
        <button
          onClick={handleWorkspaceClick}
          type="button"
          className={
            isCollapsedMode
              ? `relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 ${
                  isWorkspaceActive
                    ? "bg-white/15 text-white ring-1 ring-white/20 shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              : `w-full flex items-center justify-between px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors text-[13px] font-medium group cursor-pointer ${
                  isWorkspaceActive && !workspaceOpen
                    ? "bg-white/10 text-white"
                    : ""
                }`
          }
        >
          {isWorkspaceActive && isCollapsedMode && (
            <span className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-1 h-6 bg-[#1E88E5] rounded-r-full shadow-[0_0_8px_rgba(30,136,229,0.6)]" />
          )}

          <span
            className={`material-symbols-outlined text-[20px] transition-colors shrink-0 ${
              isWorkspaceActive
                ? "text-[#1E88E5]"
                : "text-white/70 group-hover:text-white"
            }`}
          >
            workspaces
          </span>

          {!isCollapsedMode && (
            <div className="flex items-center justify-between flex-1 ml-3">
              <span>My Workspace</span>
              <span
                className={`material-symbols-outlined text-[18px] text-white/60 transition-transform duration-200 ${
                  workspaceOpen ? "rotate-180" : ""
                }`}
              >
                expand_more
              </span>
            </div>
          )}
        </button>
      </TooltipWrap>

      {/* Sub-items (expanded mode only) */}
      {workspaceOpen && !isCollapsedMode && (
        <div className="pl-6 pr-2 py-1 space-y-1 transition-all duration-200">
          {showMyTeam && (
            <SubLinkItem
              to="/my-team"
              icon="groups"
              label="My Team"
            />
          )}
          {showMyDepartment && (
            <SubLinkItem
              to="/my-department"
              icon="domain"
              label="My Department"
            />
          )}
          {showMyPermissions && (
            <SubLinkItem
              to="/my-permissions"
              icon="verified_user"
              label="My Permissions"
            />
          )}
          {showMyTicketReports && (
            <SubLinkItem
              to="/my-ticket-reports"
              icon="description"
              label="My Ticket Reports"
            />
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen ${
          collapsed ? "w-[68px]" : "w-[260px]"
        } bg-[#1F3864] z-50 flex flex-col justify-between select-none shadow-[2px_0_12px_rgba(3,34,77,0.12)] transition-all duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0 !w-[260px]" : "-translate-x-full lg:translate-x-0"
        } ${className}`}
      >
        {/* Floating expand toggle button when collapsed on desktop */}
        {isCollapsedMode && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex absolute -right-3.5 top-5 z-50 w-7 h-7 rounded-full bg-[#1F3864] border border-white/25 shadow-lg items-center justify-center text-white/80 hover:text-white hover:bg-[#284980] hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <span className="material-symbols-outlined text-[16px] leading-none">
              chevron_right
            </span>
          </button>
        )}

        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Brand Logo Header */}
          <div
            className={`h-16 flex items-center border-b border-white/10 transition-all duration-200 ${
              isCollapsedMode
                ? "justify-center px-0 relative"
                : "justify-between px-4"
            }`}
          >
            {/* Logo & Brand Info */}
            <div
              className={`flex items-center gap-3 min-w-0 ${
                isCollapsedMode ? "justify-center" : ""
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center flex-shrink-0 shadow-sm transition-transform hover:scale-105 ${
                  isCollapsedMode ? "cursor-pointer" : ""
                }`}
                onClick={isCollapsedMode ? onToggleCollapse : undefined}
                title={isCollapsedMode ? "Click to expand sidebar" : brandTitle}
              >
                <img
                  alt="RTS Help Desk Logo"
                  className="w-full h-full object-contain"
                  src="/logo.png"
                />
              </div>

              {!isCollapsedMode && (
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="font-bold text-[13px] text-white tracking-wider uppercase truncate">
                    {brandTitle}
                  </span>
                  <span className="text-[11px] text-[#8BA2D5] font-medium">
                    {brandSubtitle}
                  </span>
                </div>
              )}
            </div>

            {/* Header Collapse Button (Expanded Desktop Mode) */}
            {!isCollapsedMode && onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-150 cursor-pointer"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <span className="material-symbols-outlined text-[18px]">
                  chevron_left
                </span>
              </button>
            )}

            {/* Mobile Drawer Close Button */}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close sidebar"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            )}
          </div>

          {/* Dynamic Console / Workspace Pill Tag */}
          {!isCollapsedMode ? (
            <div className="px-4 pt-3.5 pb-2">
              <div className="bg-white/10 px-3 py-1.5 rounded-md flex items-center gap-2 border border-white/10">
                <span className="material-symbols-outlined text-[#1E88E5] text-[18px]">
                  {workspaceIcon}
                </span>
                <span className="text-[11px] font-bold text-white tracking-widest uppercase truncate">
                  {workspaceName}
                </span>
              </div>
            </div>
          ) : (
            <div className="pt-3 pb-2 flex justify-center w-full">
              <TooltipWrap label={workspaceName}>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-xs">
                  <span className="material-symbols-outlined text-[#1E88E5] text-[20px]">
                    {workspaceIcon}
                  </span>
                </div>
              </TooltipWrap>
            </div>
          )}

          {/* ────────── Navigation Items ────────── */}
          <nav
            className={`flex-1 py-2 space-y-1.5 ${
              isCollapsedMode ? "px-0 flex flex-col items-center" : "px-3"
            }`}
            onClick={handleNavClick}
          >
            {customNavItems ? (
              // Custom Navigation Items (pass-through)
              customNavItems.map((item, idx) => {
                if ("children" in item) {
                  return (
                    <div
                      key={idx}
                      className={`pt-0.5 ${
                        isCollapsedMode ? "w-full flex flex-col items-center" : ""
                      }`}
                    >
                      {!isCollapsedMode && (
                        <div className="px-3 py-1 text-[11px] font-bold uppercase text-white/50 tracking-wider">
                          {item.name}
                        </div>
                      )}
                      {item.children.map((subItem) => (
                        <SidebarLink
                          key={subItem.href}
                          to={subItem.href}
                          exact={subItem.exact}
                          icon="circle"
                          label={subItem.name}
                        />
                      ))}
                    </div>
                  );
                }

                return (
                  <SidebarLink
                    key={item.href}
                    to={item.href}
                    exact={item.exact}
                    icon={item.icon}
                    label={item.name}
                    badge={item.badge}
                  />
                );
              })
            ) : (
              /* ──────────────── Unified Permission-Based Navigation ──────────────── */
              <>
                {/* ── 1. Core Top-Level Navigation: Dashboard & Tickets ── */}
                {hasGlobalDashboard ? (
                  <SidebarLink
                    to="/admin/dashboard"
                    exact
                    icon="dashboard"
                    label="Dashboard"
                    isBold
                  />
                ) : (
                  <SidebarLink
                    to="/dashboard"
                    exact
                    icon="dashboard"
                    label="Dashboard"
                    isBold
                  />
                )}

                {showTicketsAccordion && <TicketsAccordion />}

                {/* ── 2. Management Tab (Organization Administration) ── */}
                {showManagementTab && <ManagementAccordion />}

                {/* ── 3. My Workspace Tab (Member / Personal Operations) ── */}
                {showWorkspaceTab && <WorkspaceAccordion />}

                {/* ── 4. Standalone Enterprise Governance Modules (Outside) ── */}
                {hasRoleManage && (
                  <SidebarLink
                    to="/roles"
                    icon="shield_person"
                    label="Roles & Permissions"
                  />
                )}

                {hasHistoryGlobal && (
                  <SidebarLink
                    to="/audit"
                    icon="history_edu"
                    label="Audit Reports & History"
                  />
                )}

                {hasSettings && (
                  <SidebarLink
                    to="/settings"
                    icon="settings"
                    label="Settings"
                  />
                )}
              </>
            )}
          </nav>
        </div>

        {/* Operational Indicator Footer */}
        <div
          className={`border-t border-white/10 bg-[#03224D]/40 ${
            isCollapsedMode
              ? "p-0 h-14 flex items-center justify-center"
              : "p-4"
          }`}
        >
          <TooltipWrap label="System Operational">
            <div
              className={`flex items-center gap-2.5 ${
                isCollapsedMode
                  ? "w-10 h-10 rounded-xl justify-center hover:bg-white/5 transition-colors"
                  : ""
              }`}
            >
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              {!isCollapsedMode && (
                <span className="text-[12px] font-medium text-white/80 tracking-wide">
                  System Operational
                </span>
              )}
            </div>
          </TooltipWrap>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
