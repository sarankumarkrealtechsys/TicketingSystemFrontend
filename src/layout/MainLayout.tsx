import React, { ReactNode } from "react";

interface LayoutProps {
  children?: ReactNode;
}

export const MainLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-lg">Application Template</span>
      </header>
      <main className="flex-1 container mx-auto px-6 py-8">{children}</main>
      <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Reusable Template. All rights
        reserved.
      </footer>
    </div>
  );
};
