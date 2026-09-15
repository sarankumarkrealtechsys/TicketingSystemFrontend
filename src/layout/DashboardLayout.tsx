import React, { ReactNode } from 'react';

interface DashboardLayoutProps {
  children?: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        {/* Sidebar widget placeholder */}
      </aside>
      <div className="dashboard-main">
        <header className="dashboard-header">
          {/* Navbar widget placeholder */}
        </header>
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
};
