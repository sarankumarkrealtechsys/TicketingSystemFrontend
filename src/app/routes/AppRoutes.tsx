import React, { useEffect, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useMeQuery } from "@/features/auth/api";
import {
  setSession,
  clearSession,
  useAppDispatch,
  useAppSelector,
} from "@/features/auth/authSlice";
import { PERMISSIONS } from "@/features/auth/permissions";
import { LoadingSpinner, ErrorBoundary } from "@/shared/components";
import { AppLayout } from "@/layout/AppLayout";
import { ROUTES } from "./routePaths";
import { ProtectedRoute } from "./ProtectedRoute";

// ── Route-Level Lazy Loaded Pages (Code-Split) ──
const LoginPage = React.lazy(() => import("@/pages/auth/LoginPage"));
const AdminDashboardPage = React.lazy(
  () => import("@/pages/dashboard/AdminDashboardPage"),
);
const UserDashboardPage = React.lazy(
  () => import("@/pages/dashboard/UserDashboardPage"),
);
const DepartmentManagementPage = React.lazy(
  () => import("@/pages/departments/DepartmentManagementPage"),
);
const MyDepartmentPage = React.lazy(
  () => import("@/pages/departments/MyDepartmentPage"),
);
const TeamManagementPage = React.lazy(
  () => import("@/pages/teams/TeamManagementPage"),
);
const MyTeamPage = React.lazy(() => import("@/pages/teams/MyTeamPage"));
const ProjectManagementPage = React.lazy(
  () => import("@/pages/projects/ProjectManagementPage"),
);
const RolesPermissionsPage = React.lazy(
  () => import("@/pages/roles/RolesPermissionsPage"),
);
const MyPermissionsPage = React.lazy(
  () => import("@/pages/roles/MyPermissionsPage"),
);
const UserManagementPage = React.lazy(
  () => import("@/pages/users/UserManagementPage"),
);
const UserPerformanceProfilePage = React.lazy(
  () => import("@/pages/users/UserPerformanceProfilePage"),
);
const CreateTicketPage = React.lazy(
  () => import("@/pages/tickets/CreateTicketPage"),
);
const AdminMyTicketsPage = React.lazy(
  () => import("@/pages/tickets/AdminMyTicketsPage"),
);
const PriorityStatusManagementPage = React.lazy(
  () => import("@/pages/priorities/PriorityStatusManagementPage"),
);
const AuditReportsPage = React.lazy(
  () => import("@/pages/reports/AuditReportsPage"),
);
const MyTicketReportsPage = React.lazy(
  () => import("@/pages/reports/MyTicketReportsPage"),
);
const SettingsPage = React.lazy(() => import("@/pages/settings/SettingsPage"));
const NotificationHistoryPage = React.lazy(
  () => import("@/pages/notifications/NotificationHistoryPage"),
);
const NotFoundPage = React.lazy(() => import("@/pages/error/NotFoundPage"));

/**
 * Root index redirector — driven by resolved DASHBOARD_VIEW scope.
 * GLOBAL → Admin operational hub, otherwise → User personal workspace.
 */
const RootRedirect: React.FC = () => {
  const { status, permissions, user } = useAppSelector((state) => state.auth);

  if (status === "loading" && !user) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (status === "authenticated" || user) {
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
 * Renders immediately when a cached session is hydrated, avoiding full-screen flicker.
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
      // ONLY clear session if HTTP 401 Unauthorized
      // Do not destroy session on temporary network timeouts, 429 rate limits, or 500 errors
      const errStatus = (error as any)?.response?.status;
      if (errStatus === 401) {
        dispatch(clearSession());
      }
    }
  }, [data, error, dispatch]);

  // Idle prefetch: warm chunk cache in the background once authenticated
  useEffect(() => {
    if (!user) return;

    const idleCallback =
      (window as any).requestIdleCallback ||
      ((cb: () => void) => setTimeout(cb, 1000));

    const handle = idleCallback(() => {
      import("@/pages/tickets/AdminMyTicketsPage");
      import("@/pages/tickets/CreateTicketPage");
      import("@/pages/dashboard/AdminDashboardPage");
      import("@/pages/dashboard/UserDashboardPage");
      import("@/pages/teams/TeamManagementPage");
      import("@/pages/departments/DepartmentManagementPage");
      import("@/pages/settings/SettingsPage");
      import("@/pages/reports/AuditReportsPage");
      import("@/pages/notifications/NotificationHistoryPage");
    });

    return () => {
      const cancelIdle =
        (window as any).cancelIdleCallback || ((id: any) => clearTimeout(id));
      cancelIdle(handle);
    };
  }, [user]);

  // If user session is already present (hydrated from localStorage), render immediately!
  // Only show the loading spinner if there is no user AND the query is actively loading for the first time
  if (!user && (isLoading || status === "loading")) {
    return <LoadingSpinner message="Loading session..." />;
  }

  return <>{children}</>;
};

/**
 * Route Loading Fallback
 * Preserves the enterprise layout shell (Sidebar + Navbar) when loading authenticated pages,
 * preventing layout destruction and white flickering between routes.
 */
const RouteLoadingFallback: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  if (user) {
    return (
      <AppLayout>
        <div className="w-full min-h-[60vh] flex flex-col items-center justify-center py-16 animate-fade-in">
          <LoadingSpinner message="Loading page..." fullScreen={false} />
        </div>
      </AppLayout>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F7F8FA] animate-fade-in">
      <LoadingSpinner message="Loading..." fullScreen={true} />
    </div>
  );
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
        <ErrorBoundary>
          <Suspense fallback={<RouteLoadingFallback />}>
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
                fallbackPath={ROUTES.MY_TEAM}
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
                requiredPermission={PERMISSIONS.USER_VIEW}
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
                fallbackPath={ROUTES.USERS}
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
          {/* 5. REPORTS & AUDIT ROUTES                                     */}
          {/* ============================================================= */}
          <Route
            path={ROUTES.AUDIT}
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.TICKET_VIEW}
                requiredScope="GLOBAL"
              >
                <AuditReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.MY_TICKET_REPORTS}
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.TICKET_VIEW}
              >
                <MyTicketReportsPage />
              </ProtectedRoute>
            }
          />

          {/* ============================================================= */}
          {/* 6. SYSTEM SETTINGS ROUTE                                      */}
          {/* Requires SYSTEM_SETTINGS_MANAGE at GLOBAL scope               */}
          {/* ============================================================= */}
          <Route
            path={ROUTES.SETTINGS}
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.SYSTEM_SETTINGS_MANAGE}
                requiredScope="GLOBAL"
              >
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* ============================================================= */}
          {/* 7. IN-APP NOTIFICATIONS & HISTORY                             */}
          {/* ============================================================= */}
          <Route
            path={ROUTES.NOTIFICATIONS_HISTORY}
            element={
              <ProtectedRoute>
                <NotificationHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.NOTIFICATIONS}
            element={
              <Navigate to={ROUTES.NOTIFICATIONS_HISTORY} replace />
            }
          />

          {/* ============================================================= */}
          {/* 8. CATCH-ALL 404 FALLBACK                                     */}
          {/* ============================================================= */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
          </Suspense>
        </ErrorBoundary>
      </SessionBootstrap>
    </BrowserRouter>
  );
};

export default AppRoutes;
