import React from "react";
import { AppLayout } from "@/layout/AppLayout";
import { AdminTeamManagement } from "@/features/team-management";

export const TeamManagementPage: React.FC = () => {
  return (
    <AppLayout role="ADMIN">
      <AdminTeamManagement />
    </AppLayout>
  );
};

export default TeamManagementPage;
