import React from "react";
import { AppLayout } from "@/layout/AppLayout";
import { UserPerformanceProfile } from "@/features/user-management";

export const UserPerformanceProfilePage: React.FC = () => {
  return (
    <AppLayout>
      <UserPerformanceProfile />
    </AppLayout>
  );
};

export default UserPerformanceProfilePage;
