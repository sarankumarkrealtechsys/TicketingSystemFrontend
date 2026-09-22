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
  CREATE_TICKET: "/tickets/create",
  TICKETS: "/tickets",
  ROLES: "/roles",
  USERS: "/users",
  USER_PERFORMANCE: "/users/:userId/performance",
  MY_PERMISSIONS: "/my-permissions",
  MY_TICKET_HISTORY: "/my-ticket-history",
  AUDIT: "/audit",
  SETTINGS: "/settings",
  PRIORITIES: "/admin/priorities",
  PRIORITY_LEVELS: "/priority-levels",
  STATUSES: "/admin/statuses",
} as const;


export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
