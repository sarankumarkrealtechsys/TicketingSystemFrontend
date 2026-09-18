import React from "react";
import { Route } from "react-router-dom";
import { AdminDashboardPage, TeamManagementPage } from "@/pages";
import { PermissionRoute } from "./PermissionRoute";
import { PERMISSIONS } from "@/features/auth/permissions";
import { ROUTES } from "./routePaths";

/**
 * Admin Console Routes definition.
 * Strictly guarded by requiredRole="ADMIN" and BRD permissions.
 */
export const AdminRoutes = (
  <>
    <Route
      path={ROUTES.ADMIN_DASHBOARD}
      element={
        <PermissionRoute
          requiredRole="ADMIN"
          requiredPermission={PERMISSIONS.DASHBOARD_VIEW}
        >
          <AdminDashboardPage />
        </PermissionRoute>
      }
    />
    <Route
      path={ROUTES.TEAMS}
      element={
        <PermissionRoute
          requiredRole="ADMIN"
          requiredPermission={PERMISSIONS.TEAM_VIEW}
        >
          <TeamManagementPage />
        </PermissionRoute>
      }
    />
  </>
);

export default AdminRoutes;
