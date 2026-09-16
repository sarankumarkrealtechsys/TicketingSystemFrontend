import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage, AdminDashboardPage, UserDashboardPage } from "@/pages";
import { useMeQuery } from "@/features/auth/api";
import {
  setSession,
  clearSession,
  useAppDispatch,
  useAppSelector,
} from "@/features/auth/authSlice";
import { LoadingSpinner } from "@/shared/components";

/**
 * Root index redirector based on authentication status and user role.
 */
const RootRedirect: React.FC = () => {
  const { status, user } = useAppSelector((state) => state.auth);

  if (status === "loading") {
    return null;
  }

  if (status === "authenticated" && user) {
    return user.role?.name === "ADMIN" ? (
      <Navigate to="/admin/dashboard" replace />
    ) : (
      <Navigate to="/dashboard" replace />
    );
  }

  return <Navigate to="/login" replace />;
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
      dispatch(setSession(data.data));
    } else if (error) {
      dispatch(clearSession());
    }
  }, [data, error, dispatch]);

  if (isLoading) {
    return <LoadingSpinner message="Loading session..." />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <SessionBootstrap>
        <Routes>
          {/* Public Auth Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Protected Dashboard Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SessionBootstrap>
    </BrowserRouter>
  );
};

export default AppRoutes;
