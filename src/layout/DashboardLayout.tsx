import React, { ReactNode, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/widgets/Sidebar";
import { useAppSelector } from "@/features/auth/authSlice";

interface DashboardLayoutProps {
  children?: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  // Derive page title for top bar
  const getPageTitle = () => {
    if (location.pathname.startsWith("/users")) {
      if (location.pathname.includes("/users/")) {
        return "User Profile & Membership";
      }
      return "User Management";
    }
    if (location.pathname.includes("/admin/dashboard")) {
      return "Admin Operations Console";
    }
    return "User Workspace";
  };

  return (
    <div className="min-h-screen bg-surface flex text-on-surface">
      {/* ─── Global Left Sidebar ─── */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />

      {/* ─── Main Content Container ─── */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          collapsed ? "pl-[68px]" : "pl-60"
        }`}
      >
        {/* ─── Topbar ─── */}
        <header className="h-16 px-8 border-b border-slate-200 bg-surface-container-lowest flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold tracking-tight text-slate-900 font-headline-sm">
              {getPageTitle()}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Operational
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.name || user?.username}
              </p>
              <p className="text-[11px] text-slate-500 leading-tight">
                {user?.department?.name || "Department"} &bull;{" "}
                {user?.role?.name || "Role"}
              </p>
            </div>
            <div className="w-8 h-8 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs uppercase">
              {user?.role?.name?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        {/* ─── Content Body ─── */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
