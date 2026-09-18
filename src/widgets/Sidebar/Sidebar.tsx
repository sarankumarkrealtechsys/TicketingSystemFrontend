import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAppSelector } from "@/features/auth/authSlice";

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
  role?: "ADMIN" | "USER";
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

export const Sidebar: React.FC<SidebarProps> = ({
  role: explicitRole,
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
  const { user } = useAppSelector((state) => state.auth);

  // Determine active role
  const role = explicitRole || (user?.role?.name === "ADMIN" ? "ADMIN" : "USER");
  const isAdmin = role === "ADMIN";

  // Dynamic Workspace Pill defaults
  const workspaceName =
    explicitWorkspaceName || (isAdmin ? "Admin Console" : "User Workspace");
  const workspaceIcon =
    explicitWorkspaceIcon || (isAdmin ? "admin_panel_settings" : "person");

  // Tickets accordion toggle state (open by default if currently on a ticket route)
  const [ticketsOpen, setTicketsOpen] = useState(true);

  const handleNavClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("a")) {
      onCloseMobile?.();
    }
  };

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
        className={`fixed left-0 top-0 h-screen w-[260px] bg-[#1F3864] z-50 flex flex-col justify-between select-none shadow-[2px_0_12px_rgba(3,34,77,0.12)] transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${className}`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Logo Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-sm">
                <img
                  alt="RTS Help Desk Logo"
                  className="w-full h-full object-contain"
                  src="/logo.png"
                />
              </div>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-bold text-[13px] text-white tracking-wider uppercase truncate">
                  {brandTitle}
                </span>
                <span className="text-[11px] text-[#8BA2D5] font-medium">
                  {brandSubtitle}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="hidden lg:flex p-1 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {collapsed ? "chevron_right" : "chevron_left"}
                  </span>
                </button>
              )}

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
          </div>

          {/* Dynamic Console / Workspace Pill Tag */}
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

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-2 space-y-1" onClick={handleNavClick}>
          {customNavItems ? (
            // Render custom navigation items if provided
            customNavItems.map((item, idx) => {
              if ("children" in item) {
                return (
                  <div key={idx} className="pt-0.5">
                    <div className="px-3 py-1 text-[11px] font-bold uppercase text-white/50 tracking-wider">
                      {item.name}
                    </div>
                    {item.children.map((subItem) => (
                      <NavLink
                        key={subItem.href}
                        to={subItem.href}
                        end={subItem.exact}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                            isActive
                              ? "bg-white/15 text-white border-l-4 border-[#1E88E5]"
                              : "text-white/80 hover:bg-white/10 hover:text-white"
                          }`
                        }
                      >
                        <span>{subItem.name}</span>
                      </NavLink>
                    ))}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                      isActive
                        ? "bg-white/15 text-white border-l-4 border-[#1E88E5]"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[20px] text-white/70">
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded bg-white/20 text-white font-semibold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })
          ) : isAdmin ? (
            /* ──────────────── Admin Default Navigation ──────────────── */
            <>
              {/* Dashboard Link */}
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg font-semibold text-[13px] transition-all shadow-sm ${
                    isActive
                      ? "bg-white/15 text-white border-l-4 border-[#1E88E5]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px] text-[#1E88E5]">
                  dashboard
                </span>
                <span>Dashboard</span>
              </NavLink>

              {/* Tickets Accordion */}
              <div className="pt-0.5">
                <button
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors text-[13px] font-medium group"
                  onClick={() => setTicketsOpen(!ticketsOpen)}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] text-white/70 group-hover:text-white transition-colors">
                      confirmation_number
                    </span>
                    <span>Tickets</span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[18px] text-white/60 transition-transform duration-200 ${
                      ticketsOpen ? "rotate-180" : ""
                    }`}
                  >
                    expand_more
                  </span>
                </button>
                {ticketsOpen && (
                  <div className="pl-9 pr-2 py-1 space-y-1 transition-all duration-200">
                    <NavLink
                      to="/tickets/create"
                      className={({ isActive }) =>
                        `block px-2.5 py-1.5 rounded-md text-[12px] transition-colors ${
                          isActive
                            ? "bg-white/15 text-white font-medium"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`
                      }
                    >
                      Create Ticket
                    </NavLink>
                    <NavLink
                      to="/tickets"
                      end
                      className={({ isActive }) =>
                        `block px-2.5 py-1.5 rounded-md text-[12px] transition-colors ${
                          isActive
                            ? "bg-white/15 text-white font-medium"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`
                      }
                    >
                      All Tickets
                    </NavLink>
                    <NavLink
                      to="/tickets?filter=my"
                      className="block px-2.5 py-1.5 rounded-md text-white/70 hover:bg-white/10 hover:text-white text-[12px] transition-colors"
                    >
                      My Tickets
                    </NavLink>
                    <NavLink
                      to="/tickets?filter=assigned"
                      className="block px-2.5 py-1.5 rounded-md text-white/70 hover:bg-white/10 hover:text-white text-[12px] transition-colors"
                    >
                      Assigned Tickets
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Management Links */}
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${
                    isActive
                      ? "bg-white/15 text-white border-l-4 border-[#1E88E5]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px] text-white/70">
                  folder_managed
                </span>
                <span>Projects Management</span>
              </NavLink>

              <NavLink
                to="/teams"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${
                    isActive
                      ? "bg-white/15 text-white border-l-4 border-[#1E88E5]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px] text-white/70">
                  groups
                </span>
                <span>Team Management</span>
              </NavLink>

              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${
                    isActive
                      ? "bg-white/15 text-white border-l-4 border-[#1E88E5]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px] text-white/70">
                  person_search
                </span>
                <span>User Management</span>
              </NavLink>

              <NavLink
                to="/roles"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${
                    isActive
                      ? "bg-white/15 text-white border-l-4 border-[#1E88E5]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px] text-white/70">
                  shield_person
                </span>
                <span>Roles &amp; Permissions</span>
              </NavLink>

              <NavLink
                to="/audit"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${
                    isActive
                      ? "bg-white/15 text-white border-l-4 border-[#1E88E5]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px] text-white/70">
                  history_edu
                </span>
                <span>Audit Reports &amp; History</span>
              </NavLink>

              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${
                    isActive
                      ? "bg-white/15 text-white border-l-4 border-[#1E88E5]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px] text-white/70">
                  settings
                </span>
                <span>Settings</span>
              </NavLink>
            </>
          ) : (
            /* ──────────────── User Default Navigation ──────────────── */
            <>
              {/* Dashboard Link */}
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg font-semibold text-[13px] transition-all shadow-sm ${
                    isActive
                      ? "bg-white/15 text-white border-l-4 border-[#1E88E5]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px] text-[#1E88E5]">
                  dashboard
                </span>
                <span>Dashboard</span>
              </NavLink>

              {/* Tickets Accordion */}
              <div className="pt-0.5">
                <button
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors text-[13px] font-medium group"
                  onClick={() => setTicketsOpen(!ticketsOpen)}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] text-white/70 group-hover:text-white transition-colors">
                      confirmation_number
                    </span>
                    <span>Tickets</span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[18px] text-white/60 transition-transform duration-200 ${
                      ticketsOpen ? "rotate-180" : ""
                    }`}
                  >
                    expand_more
                  </span>
                </button>
                {ticketsOpen && (
                  <div className="pl-9 pr-2 py-1 space-y-1 transition-all duration-200">
                    <NavLink
                      to="/tickets/create"
                      className={({ isActive }) =>
                        `block px-2.5 py-1.5 rounded-md text-[12px] transition-colors ${
                          isActive
                            ? "bg-white/15 text-white font-medium"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`
                      }
                    >
                      Create Ticket
                    </NavLink>
                    <NavLink
                      to="/tickets?filter=my"
                      className="block px-2.5 py-1.5 rounded-md text-white/70 hover:bg-white/10 hover:text-white text-[12px] transition-colors"
                    >
                      My Tickets
                    </NavLink>
                    <NavLink
                      to="/tickets?filter=assigned"
                      className="block px-2.5 py-1.5 rounded-md text-white/70 hover:bg-white/10 hover:text-white text-[12px] transition-colors"
                    >
                      Assigned Tickets
                    </NavLink>
                  </div>
                )}
              </div>

              {/* User Scoped Navigation per DESIGN.md section 2.1 */}
              <NavLink
                to="/my-projects"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${
                    isActive
                      ? "bg-white/15 text-white border-l-4 border-[#1E88E5]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px] text-white/70">
                  folder_managed
                </span>
                <span>My Projects</span>
              </NavLink>

              <NavLink
                to="/my-team"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${
                    isActive
                      ? "bg-white/15 text-white border-l-4 border-[#1E88E5]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px] text-white/70">
                  groups
                </span>
                <span>My Team</span>
              </NavLink>

              <NavLink
                to="/my-history"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${
                    isActive
                      ? "bg-white/15 text-white border-l-4 border-[#1E88E5]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px] text-white/70">
                  history_edu
                </span>
                <span>My Ticket History</span>
              </NavLink>

              <NavLink
                to="/my-permissions"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${
                    isActive
                      ? "bg-white/15 text-white border-l-4 border-[#1E88E5]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px] text-white/70">
                  shield_person
                </span>
                <span>My Permissions</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* Operational Indicator Footer */}
      <div className="p-4 border-t border-white/10 bg-[#03224D]/40">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-[12px] font-medium text-white/80 tracking-wide">
            System Operational
          </span>
        </div>
      </div>
      </aside>
    </>
  );
};

export default Sidebar;
