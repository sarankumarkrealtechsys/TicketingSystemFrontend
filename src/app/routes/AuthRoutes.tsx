import React from "react";
import { Route } from "react-router-dom";
import { LoginPage } from "@/pages";
import { ROUTES } from "./routePaths";

/**
 * Public Authentication Routes definition.
 */
export const AuthRoutes = (
  <>
    <Route path={ROUTES.LOGIN} element={<LoginPage />} />
  </>
);

export default AuthRoutes;
