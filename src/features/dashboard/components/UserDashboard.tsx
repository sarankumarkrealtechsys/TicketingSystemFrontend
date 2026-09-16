import React from "react";
import { DashboardShell } from "./DashboardShell";

export const UserDashboard: React.FC = () => {
  return (
    <DashboardShell title="User Ticket Queue" roleBadge="Standard User">
      <div className="p-4 bg-secondary-container/10 border border-secondary-container/30 rounded-md">
        <h4 className="text-sm font-bold text-secondary mb-1">
          Standard User Session
        </h4>
        <p className="text-xs text-on-surface-variant">
          You have access to create and view tickets within your authorized
          scope (OWN, ASSIGNED, or DEPARTMENT).
        </p>
      </div>
    </DashboardShell>
  );
};

export default UserDashboard;
