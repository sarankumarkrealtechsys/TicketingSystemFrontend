import React from "react";
import { DashboardShell } from "./DashboardShell";

export const AdminDashboard: React.FC = () => {
  return (
    <DashboardShell title="Admin Operations Console" roleBadge="System Admin">
      <div className="p-4 bg-primary-container/10 border border-primary-container/30 rounded-md">
        <h4 className="text-sm font-bold text-primary mb-1">
          Administrator Privileges Active
        </h4>
        <p className="text-xs text-on-surface-variant">
          You have root access across all department queues, SLA configurations,
          role management, and global system settings.
        </p>
      </div>
    </DashboardShell>
  );
};

export default AdminDashboard;
