import React from 'react';
import { AppLayout } from '@/layout/AppLayout';
import { MyPermissionsView } from '@/features/roles-permissions';

export const MyPermissionsPage: React.FC = () => {
  return (
    <AppLayout>
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4 py-6">
        <MyPermissionsView />
      </div>
    </AppLayout>
  );
};

export default MyPermissionsPage;
