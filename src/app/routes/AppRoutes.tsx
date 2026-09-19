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
  UserDashboardPage,
  MyDepartmentPage,
  MyTeamPage,
  MyPermissionsPage,
  CreateTicketPage,
  NotFoundPage,
} from "@/pages";

/**
 * Root index redirector based on active session and user role.
 */
const RootRedirect: React.FC = () => {
  const { status, user } = useAppSelector((state) => state.auth);

  if (status === "loading") {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (status === "authenticated" && user) {
    const isAdmin = (user.role?.name || "").toUpperCase() === "ADMIN";
    return isAdmin ? (
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
  const { data, error, isLoading } = useMeQuery();

  useEffect(() => {
    if (data?.data) {
      if (data.data.token && !sessionStorage.getItem("rts_auth_token")) {
        sessionStorage.setItem("rts_auth_token", data.data.token);
      }
      dispatch(setSession(data.data));
    } else if (error) {
      sessionStorage.removeItem("rts_auth_token");
      dispatch(clearSession());
    }
  }, [data, error, dispatch]);

  if (isLoading) {
    return <LoadingSpinner message="Loading session..." />;
  }

  return <>{children}</>;
};

/**
 * Master AppRoutes
 * Declarative route configuration with role and permission guards.
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

          {/* Root Redirect based on role */}
          <Route path={ROUTES.ROOT} element={<RootRedirect />} />

          {/* ============================================================= */}
          {/* 2. SHARED AUTHENTICATED ROUTES                                */}
          {/* ============================================================= */}
          <Route
            path={ROUTES.CREATE_TICKET}
            element={
              <ProtectedRoute>
                <CreateTicketPage />
              </ProtectedRoute>
            }
          />

          {/* ============================================================= */}
          {/* 3. USER WORKSPACE ROUTES                                      */}
          {/* ============================================================= */}
          <Route
            path={ROUTES.USER_DASHBOARD}
            element={
              <ProtectedRoute
                requiredRole="USER"
                fallbackPath={ROUTES.ADMIN_DASHBOARD}
              >
                <UserDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.MY_DEPARTMENT}
            element={
              <ProtectedRoute
                requiredRole="USER"
                fallbackPath={ROUTES.DEPARTMENTS}
              >
                <MyDepartmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.MY_TEAM}
            element={
              <ProtectedRoute
                requiredRole="USER"
                fallbackPath={ROUTES.TEAMS}
              >
                <MyTeamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.MY_PERMISSIONS}
            element={
              <ProtectedRoute
                requiredRole="USER"
                fallbackPath={ROUTES.ROLES}
              >
                <MyPermissionsPage />
              </ProtectedRoute>
            }
          />

          {/* ============================================================= */}
          {/* 4. ADMIN CONSOLE ROUTES                                       */}
          {/* ============================================================= */}
          <Route
            path={ROUTES.ADMIN_DASHBOARD}
            element={
              <ProtectedRoute
                requiredRole="ADMIN"
                requiredPermission={PERMISSIONS.DASHBOARD_VIEW}
              >
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.DEPARTMENTS}
            element={
              <ProtectedRoute
                requiredRole="ADMIN"
                requiredPermission={PERMISSIONS.DEPARTMENT_VIEW}
              >
                <DepartmentManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.TEAMS}
            element={
              <ProtectedRoute
                requiredRole="ADMIN"
                requiredPermission={PERMISSIONS.TEAM_VIEW}
              >
                <TeamManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.PROJECTS}
            element={
              <ProtectedRoute
                requiredRole="ADMIN"
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
                requiredRole="ADMIN"
                requiredPermission={PERMISSIONS.ROLE_MANAGE}
              >
                <RolesPermissionsPage />
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
