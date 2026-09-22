import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useMeQuery } from "@/features/auth/api";
import {
  setSession,
  clearSession,
  useAppDispatch,
  useAppSelector,
} from "@/features/auth/authSlice";
import { PERMISSIONS } from "@/features/auth/permissions";
import { LoadingSpinner } from "@/shared/components";
import { ROUTES } from "./routePaths";
import { ProtectedRoute } from "./ProtectedRoute";
import {
  LoginPage,
  AdminDashboardPage,
  DepartmentManagementPage,
  TeamManagementPage,
  ProjectManagementPage,
  RolesPermissionsPage,
  UserManagementPage,
  UserPerformanceProfilePage,
  UserDashboardPage,
  MyDepartmentPage,
  MyTeamPage,
  MyPermissionsPage,
  CreateTicketPage,
  AdminMyTicketsPage,
  PriorityStatusManagementPage,
  NotFoundPage,
} from "@/pages";

/**
 * Root index redirector — driven by resolved DASHBOARD_VIEW scope.
 * GLOBAL → Admin operational hub, otherwise → User personal workspace.
 */
const RootRedirect: React.FC = () => {
  const { status, permissions } = useAppSelector((state) => state.auth);

  if (status === "loading") {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (status === "authenticated") {
    const dashboardScopes = permissions?.DASHBOARD_VIEW;
    const hasGlobalDashboard =
      Array.isArray(dashboardScopes) && dashboardScopes.includes("GLOBAL");
    return hasGlobalDashboard ? (
      <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />
    ) : (
      <Navigate to={ROUTES.USER_DASHBOARD} replace />
    );
  }

  return <Navigate to={ROUTES.LOGIN} replace />;
};

/**
 * Session Bootstrap Wrapper
 * Restores user session from /api/auth/me on initial page load.
 */
const SessionBootstrap: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useAppDispatch();
  const { user, status } = useAppSelector((state) => state.auth);
  const { data, error, isLoading } = useMeQuery();

  useEffect(() => {
    if (data?.data) {
      dispatch(setSession(data.data));
    } else if (error) {
      dispatch(clearSession());
    }
  }, [data, error, dispatch]);

  if (isLoading || status === "loading" || (data?.data && !user)) {
    return <LoadingSpinner message="Loading session..." />;
  }

  return <>{children}</>;
};

/**
 * Master AppRoutes
 * Declarative route configuration with permission + scope guards.
 * No role-name string matching — all access is permission-driven.
 */
export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <SessionBootstrap>
        <Routes>
          {/* ============================================================= */}
          {/* 1. PUBLIC ROUTES                                              */}
          {/* ============================================================= */}
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />

          {/* Root Redirect based on DASHBOARD_VIEW scope */}
          <Route path={ROUTES.ROOT} element={<RootRedirect />} />

          {/* ============================================================= */}
          {/* 2. SHARED AUTHENTICATED ROUTES                                */}
          {/* ============================================================= */}
          <Route
            path={ROUTES.CREATE_TICKET}
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.TICKET_CREATE}>
                <CreateTicketPage />
              </ProtectedRoute>
            }
          />

          {/* ============================================================= */}
          {/* 3. USER WORKSPACE ROUTES                                      */}
          {/* Accessible to anyone with DASHBOARD_VIEW at any scope.        */}
          {/* ============================================================= */}
          <Route
            path={ROUTES.USER_DASHBOARD}
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.DASHBOARD_VIEW}
              >
                <UserDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.MY_DEPARTMENT}
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.DEPARTMENT_VIEW}
              >
                <MyDepartmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.MY_TEAM}
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.TEAM_VIEW}
              >
                <MyTeamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.MY_PERMISSIONS}
            element={
              <ProtectedRoute>
                <MyPermissionsPage />
              </ProtectedRoute>
            }
          />

          {/* ============================================================= */}
          {/* 4. ADMIN CONSOLE ROUTES                                       */}
          {/* Require permission at GLOBAL scope specifically.              */}
          {/* ============================================================= */}
          <Route
            path={ROUTES.ADMIN_DASHBOARD}
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.DASHBOARD_VIEW}
                requiredScope="GLOBAL"
              >
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.DEPARTMENTS}
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.DEPARTMENT_VIEW}
                requiredScope="GLOBAL"
              >
                <DepartmentManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.TEAMS}
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.TEAM_VIEW}
                requiredScope="GLOBAL"
              >
                <TeamManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.PROJECTS}
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.PROJECT_VIEW}
              >
                <ProjectManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ROLES}
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.ROLE_MANAGE}
              >
                <RolesPermissionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.USERS}
            element={
              <ProtectedRoute
                requiredPermission={[
                  PERMISSIONS.USER_VIEW,
                  PERMISSIONS.USER_CREATE,
                  PERMISSIONS.USER_UPDATE,
                  PERMISSIONS.USER_DELETE,
                ]}
                requiredScope="GLOBAL"
              >
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.USER_PERFORMANCE}
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.USER_PERFORMANCE_VIEW}
                requiredScope="GLOBAL"
              >
                <UserPerformanceProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.PRIORITIES}
            element={
              <ProtectedRoute
                requiredPermission={[
                  PERMISSIONS.PRIORITY_MANAGE,
                  PERMISSIONS.STATUS_CREATE,
                  PERMISSIONS.STATUS_UPDATE,
                  PERMISSIONS.STATUS_RETIRE,
                ]}
              >
                <PriorityStatusManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.PRIORITY_LEVELS}
            element={
              <Navigate to={ROUTES.PRIORITIES} replace />
            }
          />
          <Route
            path={ROUTES.STATUSES}
            element={
              <Navigate to={ROUTES.PRIORITIES} replace />
            }
          />
          <Route
            path={ROUTES.TICKETS}
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.TICKET_VIEW}
              >
                <AdminMyTicketsPage />
              </ProtectedRoute>
            }
          />

          {/* ============================================================= */}
          {/* 5. CATCH-ALL 404 FALLBACK                                     */}
          {/* ============================================================= */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </SessionBootstrap>
    </BrowserRouter>
  );
};

export default AppRoutes;
