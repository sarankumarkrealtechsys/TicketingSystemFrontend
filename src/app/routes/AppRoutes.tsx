import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useMeQuery } from "@/features/auth/api";
import {
  setSession,
  clearSession,
  useAppDispatch,
  useAppSelector,
} from "@/features/auth/authSlice";
import { LoadingSpinner } from "@/shared/components";
import { ROUTES } from "./routePaths";
import { AuthRoutes } from "./AuthRoutes";
import { AdminRoutes } from "./AdminRoutes";
import { UserRoutes } from "./UserRoutes";

/**
 * Root index redirector based on authentication status and user role.
 */
const RootRedirect: React.FC = () => {
  const { status, user } = useAppSelector((state) => state.auth);

  if (status === "loading") {
    return null;
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
 * Calls GET /api/auth/me once on mount to verify any active cookie session.
 * Displays a clean loading state to prevent flash of unauthenticated content.
 */
const SessionBootstrap: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useAppDispatch();
  const { data, error, isLoading } = useMeQuery();

  useEffect(() => {
    if (data) {
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
 * Composes modular AuthRoutes, AdminRoutes, and UserRoutes.
 */
export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <SessionBootstrap>
        <Routes>
          {/* Public Auth Routes */}
          {AuthRoutes}

          {/* Root Redirect */}
          <Route path={ROUTES.ROOT} element={<RootRedirect />} />

          {/* Admin Routes (guarded by role + BRD permissions) */}
          {AdminRoutes}

          {/* Standard User Workspace Routes (guarded by session) */}
          {UserRoutes}

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to={ROUTES.ROOT} replace />} />
        </Routes>
      </SessionBootstrap>
    </BrowserRouter>
  );
};

export default AppRoutes;
