import React from "react";
import { AppLayout } from "@/layout/AppLayout";
import { AuditReportsView } from "@/features/reports";

export const MyTicketReportsPage: React.FC = () => {
  return (
    <AppLayout role="USER">
      <AuditReportsView isGlobal={false} />
    </AppLayout>
  );
};

export default MyTicketReportsPage;
