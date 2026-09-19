import React from "react";
import { Route } from "react-router-dom";
import { AdminDashboardPage, TeamManagementPage, DepartmentManagementPage, ProjectManagementPage, RolesPermissionsPage } from "@/pages";
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
      path={ROUTES.DEPARTMENTS}
      element={
        <PermissionRoute
          requiredRole="ADMIN"
          requiredPermission={PERMISSIONS.DEPARTMENT_VIEW}
        >
          <DepartmentManagementPage />
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
    <Route
      path={ROUTES.PROJECTS}
      element={
        <PermissionRoute
          requiredRole="ADMIN"
          requiredPermission={PERMISSIONS.PROJECT_VIEW}
        >
          <ProjectManagementPage />
        </PermissionRoute>
      }
    />
    <Route
      path={ROUTES.ROLES}
      element={
        <PermissionRoute
          requiredRole="ADMIN"
          requiredPermission={PERMISSIONS.ROLE_MANAGE}
        >
          <RolesPermissionsPage />
        </PermissionRoute>
      }
    />
  </>
);


export default AdminRoutes;
