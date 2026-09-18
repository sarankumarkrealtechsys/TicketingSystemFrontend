import React from "react";
import { AppLayout } from "@/layout/AppLayout";
import { UserMyTeam } from "@/features/team-management";

export const MyTeamPage: React.FC = () => {
  return (
    <AppLayout role="USER">
      <UserMyTeam />
    </AppLayout>
  );
};

export default MyTeamPage;
