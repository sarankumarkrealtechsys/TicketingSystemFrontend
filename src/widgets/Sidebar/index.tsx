import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
} from "lucide-react";
import {
  useAppDispatch,
  useAppSelector,
  clearSession,
} from "@/features/auth/authSlice";
import { useLogoutMutation } from "@/features/auth/api";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed: externalCollapsed,
  onToggleCollapse,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed =
    externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleCollapse =
    onToggleCollapse || (() => setInternalCollapsed((prev) => !prev));

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const logoutMutation = useLogoutMutation();

  const isAdmin = user?.role?.name === "ADMIN";


  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        dispatch(clearSession());
        navigate("/login", { replace: true });
      },
    });
  };

  const dashboardRoute = isAdmin ? "/admin/dashboard" : "/dashboard";

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-30 bg-surface-container-lowest border-r border-slate-200 flex flex-col justify-between transition-all duration-300 ease-in-out select-none shadow-xs ${
        isCollapsed ? "w-[68px]" : "w-60"
      }`}
    >
      {/* ─── Sidebar Header ─── */}
      <div>
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-md bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden transition-opacity duration-200">
                <span className="font-bold text-sm tracking-tight text-primary font-headline-sm truncate">
                  RTS HELP DESK
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  IT Operations
                </span>
              </div>
            )}
          </div>

          <button
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* ─── Navigation Links ─── */}
        <nav className="p-3 space-y-1">
          {/* Dashboard Link */}
          <NavLink
            to={dashboardRoute}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-50 text-primary font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`
            }
            title={isCollapsed ? "Dashboard" : undefined}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0 text-slate-500 group-hover:text-slate-700" />
            {!isCollapsed && (
              <span className="truncate transition-opacity duration-200">
                Dashboard
              </span>
            )}
          </NavLink>
        </nav>
      </div>

      {/* ─── Footer User Profile & Logout ─── */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold text-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-900 truncate">
                  {user?.name || user?.username}
                </span>
                <span className="text-[10px] text-slate-500 truncate">
                  {user?.role?.name || "USER"} &bull;{" "}
                  {user?.department?.name || "IT"}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors shrink-0 disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
