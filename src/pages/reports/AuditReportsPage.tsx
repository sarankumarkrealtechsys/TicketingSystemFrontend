import React from "react";
import { AppLayout } from "@/layout/AppLayout";
import { AuditReportsView } from "@/features/reports";

export const AuditReportsPage: React.FC = () => {
  return (
    <AppLayout role="ADMIN">
      <AuditReportsView isGlobal={true} />
    </AppLayout>
  );
};

export default AuditReportsPage;
