import React, { ReactNode, useMemo } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAppSelector } from "@/features/auth/authSlice";
import { PermissionKey } from "@/features/auth/permissions";
import { LoadingSpinner } from "@/shared/components";
import { ROUTES } from "./routePaths";

export interface ProtectedRouteProps {
  children?: ReactNode;
  /** Optional role requirement (e.g. "ADMIN" or "USER") */
  requiredRole?: "ADMIN" | "USER";
  /** Optional granular permission requirement (e.g. "DASHBOARD_VIEW", "ROLE_MANAGE") */
  requiredPermission?: PermissionKey | string;
  /** Custom fallback redirect path if role/permission check fails */
  fallbackPath?: string;
}

/**
 * Unified ProtectedRoute Guard
 * Handles authentication status, user role boundaries, and granular BRD permissions.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallbackPath,
}) => {
  const { status, user, permissions } = useAppSelector((state) => state.auth);
  const location = useLocation();

  const userRole = (user?.role?.name || "").toUpperCase();
  const isAdmin = userRole === "ADMIN";

  // Evaluate granular BRD permissions safely without violating hook rules
  const hasPermission = useMemo(() => {
    if (isAdmin) return true; // Administrators possess comprehensive global access
    if (!requiredPermission) return true;
    if (!permissions) return false;
    const scopes = permissions[requiredPermission];
    if (!scopes) return false;
    if (scopes.includes("GLOBAL")) return true;
    return scopes.length > 0;
  }, [isAdmin, requiredPermission, permissions]);

  if (status === "loading") {
    return <LoadingSpinner message="Verifying authentication & access..." />;
  }

  // If unauthenticated or no user session found
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

  // 1. Role enforcement check
  if (requiredRole && userRole !== requiredRole.toUpperCase()) {
    const defaultRedirect =
      userRole === "ADMIN" ? ROUTES.ADMIN_DASHBOARD : ROUTES.USER_DASHBOARD;
    return <Navigate to={fallbackPath || defaultRedirect} replace />;
  }

  // 2. Granular permission enforcement check
  if (requiredPermission && !hasPermission) {
    const defaultRedirect =
      userRole === "ADMIN" ? ROUTES.ADMIN_DASHBOARD : ROUTES.USER_DASHBOARD;
    return <Navigate to={fallbackPath || defaultRedirect} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

/** Compatibility alias */
export const PermissionRoute = ProtectedRoute;

export default ProtectedRoute;
