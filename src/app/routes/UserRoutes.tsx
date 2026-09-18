import React from "react";
import { Route } from "react-router-dom";
import { UserDashboardPage } from "@/pages";
import { ProtectedRoute } from "./ProtectedRoute";
import { ROUTES } from "./routePaths";

/**
 * Standard User Workspace Routes definition.
 * Guarded by authentication and session scope.
 */
export const UserRoutes = (
  <>
    <Route
      path={ROUTES.USER_DASHBOARD}
      element={
        <ProtectedRoute>
          <UserDashboardPage />
        </ProtectedRoute>
      }
    />
  </>
);

export default UserRoutes;
