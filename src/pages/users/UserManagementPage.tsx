import React from "react";
import { AppLayout } from "@/layout/AppLayout";
import { AdminUserManagement } from "@/features/user-management";

export const UserManagementPage: React.FC = () => {
  return (
    <AppLayout role="ADMIN">
      <AdminUserManagement />
    </AppLayout>
  );
};

export default UserManagementPage;
