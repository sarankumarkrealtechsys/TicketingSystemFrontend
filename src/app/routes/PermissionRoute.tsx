import React, { ReactNode } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAppSelector, useCan } from "@/features/auth/authSlice";
import { PermissionKey } from "@/features/auth/permissions";
import { LoadingSpinner } from "@/shared/components";
import { ROUTES } from "./routePaths";

export interface PermissionRouteProps {
  children?: ReactNode;
  /** Required role (e.g. "ADMIN" or "USER") */
  requiredRole?: "ADMIN" | "USER";
  /** Required BRD permission key (e.g. "DASHBOARD_VIEW", "USER_VIEW") */
  requiredPermission?: PermissionKey | string;
  /** Optional fallback redirect if permission/role check fails */
  fallbackPath?: string;
}

/**
 * PermissionRoute enforces both active authentication and BRD-defined
 * permissions / roles before granting access to protected routes.
 */
export const PermissionRoute: React.FC<PermissionRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallbackPath,
}) => {
  const { status, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // Permission evaluation hook
  const hasPermission = requiredPermission ? useCan(requiredPermission) : true;

  if (status === "loading") {
    return <LoadingSpinner message="Verifying access permissions..." />;
  }

  if (status === "unauthenticated" || !user) {
    const isGenericDashboard =
      location.pathname === "/login" ||
      location.pathname === "/dashboard" ||
      location.pathname === "/admin/dashboard";

    return (
      <Navigate
        to={ROUTES.LOGIN}
        state={isGenericDashboard ? undefined : { from: location }}
        replace
      />
    );
  }

  const userRole = (user.role?.name || "").toUpperCase();

  // 1. Role enforcement
  if (requiredRole && userRole !== requiredRole.toUpperCase()) {
    const defaultRedirect =
      userRole === "ADMIN" ? ROUTES.ADMIN_DASHBOARD : ROUTES.USER_DASHBOARD;
    return <Navigate to={fallbackPath || defaultRedirect} replace />;
  }

  // 2. Granular permission enforcement
  if (requiredPermission && !hasPermission) {
    const defaultRedirect =
      userRole === "ADMIN" ? ROUTES.ADMIN_DASHBOARD : ROUTES.USER_DASHBOARD;
    return <Navigate to={fallbackPath || defaultRedirect} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default PermissionRoute;
