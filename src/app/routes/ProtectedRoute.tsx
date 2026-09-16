import React, { ReactNode } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAppSelector } from "@/features/auth/authSlice";
import { LoadingSpinner } from "@/shared/components";

interface ProtectedRouteProps {
  children?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { status } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (status === "loading") {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
