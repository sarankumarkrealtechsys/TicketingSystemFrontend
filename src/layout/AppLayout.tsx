import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar, SidebarProps } from "@/widgets/Sidebar";
import { Navbar, NavbarProps } from "@/widgets/Navbar";
import { Footer, FooterProps } from "@/widgets/Footer";

export interface AppLayoutProps {
  /** Role override — auto-detected from Redux if omitted */
  role?: "ADMIN" | "USER";

  /* ── Sidebar Props ── */
  workspaceName?: string;
  workspaceIcon?: string;
  brandTitle?: string;
  brandSubtitle?: string;

  /* ── Navbar Props ── */
  userName?: string;
  userRoleSubtitle?: string;
  userEmail?: string;
  userInitials?: string;
  userAvatarBg?: string;
  notificationCount?: number;
  onNotificationClick?: () => void;

  /* ── Footer Props ── */
  showFooter?: boolean;
  companyName?: string;
  systemStatus?: string;
  version?: string;

  /* ── Content ── */
  children?: React.ReactNode;
  className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  // Role
  role,

  // Sidebar
  workspaceName,
  workspaceIcon,
  brandTitle,
  brandSubtitle,

  // Navbar
  userName,
  userRoleSubtitle,
  userEmail,
  userInitials,
  userAvatarBg,
  notificationCount,
  onNotificationClick,

  // Footer
  showFooter = true,
  companyName,
  systemStatus,
  version,

  // Content
  children,
  className = "",
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rts_sidebar_collapsed") === "true";
    }
    return false;
  });

  const handleToggleCollapse = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("rts_sidebar_collapsed", String(next));
      return next;
    });
  }, []);

  // ── Build sub-component props ──
  const sidebarProps: SidebarProps = {
    workspaceName,
    workspaceIcon,
    brandTitle,
    brandSubtitle,
    collapsed,
    onToggleCollapse: handleToggleCollapse,
    mobileOpen: isMobileMenuOpen,
    onCloseMobile: () => setIsMobileMenuOpen(false),
  };

  const navbarProps: NavbarProps = {
    role,
    userName,
    userRoleSubtitle,
    userEmail,
    userInitials,
    userAvatarBg,
    notificationCount,
    onNotificationClick,
    onToggleMobileMenu: () => setIsMobileMenuOpen((prev) => !prev),
    collapsed,
  };

  const footerProps: FooterProps = {
    companyName,
    systemStatus,
    version,
  };

  return (
    <div
      className={`bg-[#F7F8FA] font-sans text-[#1A1A1A] antialiased text-[14px] min-h-screen ${className}`}
    >
      {/* Sidebar (drawer on mobile, fixed on desktop with collapse support) */}
      <Sidebar {...sidebarProps} />

      {/* Content wrapper offset by sidebar width on desktop */}
      <div
        className={`flex flex-col min-h-screen transition-[padding-left] duration-300 ease-in-out pl-0 ${
          collapsed ? "lg:pl-[68px]" : "lg:pl-[260px]"
        }`}
      >
        {/* Top Navbar */}
        <Navbar {...navbarProps} />

        {/* Main Content Area */}
        <main className="pt-20 px-3 sm:px-5 lg:px-6 2xl:px-8 pb-8 flex-1 w-full min-h-[calc(100vh-76px)]">
          <div className="w-full">{children || <Outlet />}</div>
        </main>

        {/* Footer */}
        {showFooter && <Footer {...footerProps} />}
      </div>
    </div>
  );
};

export default AppLayout;
