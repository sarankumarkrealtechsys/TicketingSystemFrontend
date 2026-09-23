import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/features/auth/authSlice";
import { UserDashboard } from "@/features/user-dashboard";
import { ROUTES } from "@/app/routes/routePaths";

export const UserDashboardPage: React.FC = () => {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const isGlobalDashboard = Array.isArray(permissions?.DASHBOARD_VIEW) && permissions.DASHBOARD_VIEW.includes("GLOBAL");

  if (isGlobalDashboard) {
    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  }

  return <UserDashboard />;
};

export default UserDashboardPage;
