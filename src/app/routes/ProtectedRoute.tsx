import React, { ReactNode, useMemo } from "react";
import { Navigate, useLocation, useParams, Outlet } from "react-router-dom";
import { useAppSelector } from "@/features/auth/authSlice";
import { AuthUser } from "@/features/auth/types";
import { PermissionKey } from "@/features/auth/permissions";
import { LoadingSpinner } from "@/shared/components";
import { ROUTES } from "./routePaths";

export interface ProtectedRouteProps {
  children?: ReactNode;
  /** Optional granular permission requirement (e.g. "DASHBOARD_VIEW", "ROLE_MANAGE" or array of keys) */
  requiredPermission?: PermissionKey | PermissionKey[] | string | string[];
  /** Optional required scope — when set, user must hold the permission at this exact scope */
  requiredScope?: string;
  /** Custom scope resolver callback mirroring backend scope resolvers */
  resolveScope?: (
    user: AuthUser | null,
    params: Record<string, string | undefined>,
    scopes: string[],
  ) => boolean;
  /** Custom fallback redirect path if permission check fails */
  fallbackPath?: string;
}

/**
 * Unified ProtectedRoute Guard
 * Handles authentication status and granular BRD permission + scope checks.
 * No longer uses role-name string matching — all access is permission-driven.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredScope,
  resolveScope,
  fallbackPath,
}) => {
  const { status, user, permissions } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const params = useParams();

  // Evaluate granular BRD permissions safely without violating hook rules
  const hasPermission = useMemo(() => {
    if (!requiredPermission) return true;
    if (!permissions) return false;

    const keys = Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission];

    const scopes = keys.flatMap((k) => permissions[k] || []);
    if (scopes.length === 0) return false;

    // If custom scope resolver provided, delegate to it
    if (resolveScope) {
      return resolveScope(user, params, scopes);
    }

    // If a specific scope is required, check for that exact scope
    if (requiredScope) {
      return scopes.includes(requiredScope);
    }

    // Otherwise, any scope grants access
    return true;
  }, [requiredPermission, requiredScope, resolveScope, permissions, user, params]);

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

  // Permission enforcement check
  if (requiredPermission && !hasPermission) {
    // Determine safe fallback based on user's DASHBOARD_VIEW scope
    const hasDashboardGlobal = permissions?.DASHBOARD_VIEW?.includes("GLOBAL");
    const defaultRedirect = hasDashboardGlobal
      ? ROUTES.ADMIN_DASHBOARD
      : ROUTES.USER_DASHBOARD;
    return <Navigate to={fallbackPath || defaultRedirect} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

/** Compatibility alias */
export const PermissionRoute = ProtectedRoute;

export default ProtectedRoute;
