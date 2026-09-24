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
  MY_TICKET_REPORTS: "/my-ticket-reports",
  SETTINGS: "/settings",
  PRIORITIES: "/admin/priorities",
  PRIORITY_LEVELS: "/priority-levels",
  STATUSES: "/admin/statuses",
  NOTIFICATIONS: "/notifications",
  NOTIFICATIONS_HISTORY: "/notifications/history",
} as const;


export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
