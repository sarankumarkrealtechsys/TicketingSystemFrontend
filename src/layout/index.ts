export * from "./MainLayout";
export * from "./AuthLayout";
export * from "./DashboardLayout";
export * from "./AppLayout";

// Re-export AppLayout as DashboardLayout alias for backwards compatibility
export { AppLayout as DashboardLayoutV2 } from "./AppLayout";
