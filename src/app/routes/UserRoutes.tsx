import React from "react";
import { Route } from "react-router-dom";
import { UserDashboardPage, MyTeamPage, MyDepartmentPage, MyPermissionsPage } from "@/pages";
import { PermissionRoute } from "./PermissionRoute";
import { ROUTES } from "./routePaths";

/**
 * Standard User Workspace Routes definition.
 * Guarded by authentication and role="USER".
 * Admins trying to access user workspace routes are redirected to Admin Console.
 */
export const UserRoutes = (
  <>
    <Route
      path={ROUTES.USER_DASHBOARD}
      element={
        <PermissionRoute
          requiredRole="USER"
          fallbackPath={ROUTES.ADMIN_DASHBOARD}
        >
          <UserDashboardPage />
        </PermissionRoute>
      }
    />
    <Route
      path={ROUTES.MY_DEPARTMENT}
      element={
        <PermissionRoute
          requiredRole="USER"
          fallbackPath={ROUTES.DEPARTMENTS}
        >
          <MyDepartmentPage />
        </PermissionRoute>
      }
    />
    <Route
      path={ROUTES.MY_TEAM}
      element={
        <PermissionRoute
          requiredRole="USER"
          fallbackPath={ROUTES.TEAMS}
        >
          <MyTeamPage />
        </PermissionRoute>
      }
    />
    <Route
      path={ROUTES.MY_PERMISSIONS}
      element={
        <PermissionRoute
          requiredRole="USER"
          fallbackPath={ROUTES.ROLES}
        >
          <MyPermissionsPage />
        </PermissionRoute>
      }
    />
  </>
);

export default UserRoutes;
