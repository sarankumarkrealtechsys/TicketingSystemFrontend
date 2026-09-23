import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAppDispatch,
  useAppSelector,
  clearSession,
} from "@/features/auth/authSlice";
import { useLogoutMutation, authKeys } from "@/features/auth/api";
import { queryClient } from "@/app/providers";

export interface NavbarProps {
  role?: "ADMIN" | "USER";
  userName?: string;
  userRoleSubtitle?: string;
  userEmail?: string;
  userInitials?: string;
  userAvatarBg?: string;
  notificationCount?: number;
  onNotificationClick?: () => void;
  className?: string;
  onToggleMobileMenu?: () => void;
  collapsed?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  role: explicitRole,
  userName: explicitUserName,
  userRoleSubtitle: explicitUserRoleSubtitle,
  userEmail: explicitUserEmail,
  userInitials: explicitUserInitials,
  userAvatarBg: explicitUserAvatarBg,
  notificationCount = 0,
  onNotificationClick,
  className = "",
  onToggleMobileMenu,
  collapsed = false,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const logoutMutation = useLogoutMutation();

  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Determine active role (case-insensitive)
  const userRoleName = (user?.role?.name || "").toUpperCase();
  const role = explicitRole || (userRoleName === "ADMIN" ? "ADMIN" : "USER");
  const isAdmin = role === "ADMIN";

  // Dynamic user details
  const displayName =
    explicitUserName ||
    user?.name ||
    user?.username ||
    (isAdmin ? "Alex Mercer" : "Marcus Vance");

  const displayRoleSubtitle =
    explicitUserRoleSubtitle ||
    (isAdmin
      ? "System Administrator"
      : user?.department?.name
        ? `${user.department.name} Specialist`
        : "Support Engineer");

  const displayEmail =
    explicitUserEmail ||
    user?.email ||
    `${user?.username || (isAdmin ? "admin" : "user")}@rts.internal`;

  const initials =
    explicitUserInitials ||
    displayName
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() ||
    (isAdmin ? "AM" : "MV");

  const avatarBg =
    explicitUserAvatarBg || (isAdmin ? "bg-[#1F3864]" : "bg-violet-700");

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        dispatch(clearSession());
        queryClient.cancelQueries();
        queryClient.clear();
        navigate("/login", { replace: true, state: null });
      },
    });
  };

  return (
    <header
      className={`fixed top-0 left-0 ${
        collapsed ? "lg:left-[68px]" : "lg:left-[260px]"
      } right-0 h-16 bg-white z-30 border-b border-[#EEEEEE] px-3 sm:px-6 flex items-center transition-all duration-300 ease-in-out ${className}`}
    >
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {/* Mobile Hamburger Button */}
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 -ml-1 text-[#5F6368] hover:text-[#1A1A1A] hover:bg-[#F0EDED] rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
              aria-label="Toggle navigation menu"
            >
              <span className="material-symbols-outlined text-[24px]">
                menu
              </span>
            </button>
          )}
        </div>

        {/* Notification Bell & Profile */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <button
            aria-label="Notifications"
            className="relative w-9 h-9 flex items-center justify-center rounded-lg text-[#5F6368] hover:bg-[#F0EDED] hover:text-[#1A1A1A] transition-colors active:scale-[0.98]"
            type="button"
            onClick={onNotificationClick}
          >
            <span className="material-symbols-outlined text-[20px]">
              notifications
            </span>
            {notificationCount !== undefined ? (
              notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[#E53935] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )
            ) : (
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#E53935] rounded-full ring-2 ring-white" />
            )}
          </button>

          <div className="h-6 w-px bg-[#EEEEEE]" />

          {/* Profile Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group focus:outline-none text-left"
              onClick={() => setProfileOpen(!profileOpen)}
              type="button"
            >
              <div
                className={`w-8 h-8 rounded-full ${avatarBg} text-white flex items-center justify-center font-semibold text-[12px] ring-2 ring-[#1E88E5]/20 shadow-sm flex-shrink-0`}
              >
                {initials}
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="font-semibold text-[13px] text-[#1A1A1A] group-hover:text-[#1E88E5] transition-colors">
                  {displayName}
                </span>
                <span className="text-[11px] text-[#5F6368]">
                  {displayRoleSubtitle}
                </span>
              </div>
              <span
                className={`material-symbols-outlined text-[#5F6368] text-[18px] group-hover:text-[#1A1A1A] transition-transform duration-200 ${
                  profileOpen ? "rotate-180" : ""
                }`}
              >
                expand_more
              </span>
            </button>

            {/* Profile Dropdown Menu */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-[#EEEEEE] py-1 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-[#EEEEEE]">
                  <p className="text-xs font-semibold text-[#1A1A1A] truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-[#5F6368] truncate">
                    {displayEmail}
                  </p>
                </div>
                <button
                  className="w-full px-4 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                  disabled={logoutMutation.isPending}
                  onClick={handleLogout}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    logout
                  </span>
                  <span>
                    {logoutMutation.isPending ? "Logging out..." : "Log Out"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
