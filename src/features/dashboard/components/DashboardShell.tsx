import React from "react";
import { useNavigate } from "react-router-dom";
import {
  useAppDispatch,
  useAppSelector,
  clearSession,
  useCan,
} from "@/features/auth/authSlice";
import { useLogoutMutation } from "@/features/auth/api";

export interface DashboardShellProps {
  title: string;
  roleBadge: string;
  children?: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  title,
  roleBadge,
  children,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, permissions } = useAppSelector((state) => state.auth);
  const logoutMutation = useLogoutMutation();

  const canCreateTicket = useCan("TICKET_CREATE");
  const canManageRoles = useCan("ROLE_MANAGE");
  const canViewUsers = useCan("USER_VIEW");

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        dispatch(clearSession());
        navigate("/login", { replace: true });
      },
      onError: () => {
        dispatch(clearSession());
        navigate("/login", { replace: true });
      },
    });
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Precision IT Operations Header */}
      <header className="bg-surface-container-lowest border-b border-outline-variant/30 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-primary font-headline-md">
            RTS HELP DESK
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-container text-on-primary">
            {user?.role?.name || roleBadge}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-body-md text-on-surface">
            {user?.name || user?.username} (
            {user?.department?.name || "Department"})
          </span>
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {logoutMutation.isPending ? "Logging Out..." : "Log Out"}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/20 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold text-on-surface">{title}</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Phase 3 Auth Verified — Welcome back, {user?.name}! Real dashboards
              will be built in Phase 14.
            </p>
          </div>

          {/* User Profile Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-surface-container-low rounded-md">
              <span className="text-xs font-semibold text-outline uppercase">
                User ID
              </span>
              <p className="text-lg font-bold text-on-surface">{user?.id}</p>
            </div>
            <div className="p-4 bg-surface-container-low rounded-md">
              <span className="text-xs font-semibold text-outline uppercase">
                Username
              </span>
              <p className="text-lg font-bold text-on-surface">
                {user?.username}
              </p>
            </div>
            <div className="p-4 bg-surface-container-low rounded-md">
              <span className="text-xs font-semibold text-outline uppercase">
                Department
              </span>
              <p className="text-lg font-bold text-on-surface">
                {user?.department?.name || "None"}
              </p>
            </div>
          </div>

          {/* Capabilities Check via useCan */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-outline uppercase tracking-wider">
              Permission Capabilities Check (useCan)
            </h3>
            <div className="flex flex-wrap gap-2">
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  canCreateTicket
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                TICKET_CREATE: {canCreateTicket ? "Granted" : "Denied"}
              </span>
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  canViewUsers
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                USER_VIEW: {canViewUsers ? "Granted" : "Denied"}
              </span>
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  canManageRoles
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                ROLE_MANAGE: {canManageRoles ? "Granted" : "Denied"}
              </span>
            </div>
          </div>

          {/* Resolved Permissions Inspector */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-outline uppercase tracking-wider">
              Resolved Permissions ({Object.keys(permissions || {}).length}{" "}
              Total)
            </h3>
            <div className="max-h-48 overflow-y-auto bg-surface-container-low p-3 rounded-md font-mono text-xs space-y-1">
              {Object.keys(permissions || {}).length === 0 ? (
                <p className="text-outline">No permissions resolved</p>
              ) : (
                Object.entries(permissions).map(([key, scopes]) => (
                  <div
                    key={key}
                    className="flex justify-between border-b border-outline-variant/10 py-0.5"
                  >
                    <span className="text-primary font-semibold">{key}</span>
                    <span className="text-on-surface-variant">
                      [{scopes.join(", ")}]
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardShell;
