import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/features/auth/authSlice";
import { AdminDashboard } from "@/features/admin";
import { ROUTES } from "@/app/routes/routePaths";

export const AdminDashboardPage: React.FC = () => {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const isGlobalDashboard = Array.isArray(permissions?.DASHBOARD_VIEW) && permissions.DASHBOARD_VIEW.includes("GLOBAL");

  if (!isGlobalDashboard) {
    return <Navigate to={ROUTES.USER_DASHBOARD} replace />;
  }

  return <AdminDashboard />;
};

export default AdminDashboardPage;
