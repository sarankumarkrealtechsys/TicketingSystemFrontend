/**
 * Centralized Route Path Constants
 * Eliminates magic strings and keeps route paths synchronized across layouts, sidebars, and route modules.
 */

export const ROUTES = {
  ROOT: "/",
  LOGIN: "/login",
  ADMIN_DASHBOARD: "/admin/dashboard",
  USER_DASHBOARD: "/dashboard",
  TEAMS: "/teams",
  MY_TEAM: "/my-team",
  DEPARTMENTS: "/admin/departments",
  MY_DEPARTMENT: "/my-department",
  PROJECTS: "/projects",
} as const;


export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
