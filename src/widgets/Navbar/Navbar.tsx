import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAppDispatch,
  useAppSelector,
  clearSession,
} from "@/features/auth/authSlice";
import { useLogoutMutation, authKeys } from "@/features/auth/api";
import { queryClient } from "@/app/providers";
import {
  useNotificationsQuery,
  useNotificationSocket,
  NotificationDropdown,
} from "@/features/notifications";

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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Activate real-time socket lifecycle
  useNotificationSocket();

  // Bell ring and popping callout animation state on real-time notification arrival
  const [isRinging, setIsRinging] = useState(false);
  const [isCalloutDismissed, setIsCalloutDismissed] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleNotificationArrival = () => {
      setIsRinging(true);
      setIsCalloutDismissed(false);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsRinging(false);
      }, 2600);
    };

    window.addEventListener("rts_notification_arrived", handleNotificationArrival);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("rts_notification_arrived", handleNotificationArrival);
    };
  }, []);

  // Fetch live notifications and unread count (unread-only for active bell)
  const { data: notificationsData } = useNotificationsQuery(true, 15);
  const activeUnreadCount =
    notificationCount > 0 ? notificationCount : (notificationsData?.unreadCount ?? 0);

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

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setNotificationsOpen(false);
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
          <div className="relative" ref={notificationRef}>
            {/* Animated Popping Notification Callout Box */}
            {activeUnreadCount > 0 && !isCalloutDismissed && !notificationsOpen && (
              <div className="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 z-40 hidden sm:block pointer-events-auto">
                <div className="animate-bubble-pop">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setNotificationsOpen(true);
                      setProfileOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setNotificationsOpen(true);
                        setProfileOpen(false);
                      }
                    }}
                    className="animate-bubble-float relative flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-gradient-to-r from-[#1F3864] via-[#244377] to-[#1F3864] text-white shadow-lg shadow-[#1F3864]/25 border border-blue-400/30 whitespace-nowrap cursor-pointer group hover:shadow-xl hover:shadow-[#1F3864]/35 transition-all select-none"
                    title="Click to view notifications"
                  >
                    {/* Spinning spiral beacon indicator */}
                    <div className="relative flex items-center justify-center w-4 h-4 flex-shrink-0">
                      <svg
                        className="w-4 h-4 animate-spin-spiral drop-shadow-[0_0_5px_rgba(56,189,248,0.7)]"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Outer spiral arm */}
                        <path
                          d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"
                          stroke="url(#spiral-grad-outer)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        {/* Inner spiral arm */}
                        <path
                          d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12"
                          stroke="url(#spiral-grad-inner)"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient
                            id="spiral-grad-outer"
                            x1="2"
                            y1="2"
                            x2="22"
                            y2="22"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop stopColor="#38BDF8" />
                            <stop offset="0.6" stopColor="#818CF8" />
                            <stop offset="1" stopColor="#38BDF8" stopOpacity="0.1" />
                          </linearGradient>
                          <linearGradient
                            id="spiral-grad-inner"
                            x1="6"
                            y1="6"
                            x2="18"
                            y2="18"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop stopColor="#FFFFFF" />
                            <stop offset="0.7" stopColor="#38BDF8" />
                            <stop offset="1" stopColor="#818CF8" stopOpacity="0.2" />
                          </linearGradient>
                        </defs>
                      </svg>
                      {/* Luminous center spark */}
                      <span className="absolute w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#38BDF8]" />
                    </div>

                    {/* Text content */}
                    <span className="text-[12px] font-medium tracking-tight text-white/95">
                      {activeUnreadCount > 1
                        ? `${activeUnreadCount} new notifications waiting for you`
                        : "New notification waiting for you"}
                    </span>

                    {/* Arrow action affordance */}
                    <span className="material-symbols-outlined text-[16px] text-blue-200 group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                      arrow_forward
                    </span>

                    {/* Dismiss button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCalloutDismissed(true);
                      }}
                      className="ml-1 p-0.5 rounded-full text-white/60 hover:text-white hover:bg-white/20 transition-colors flex items-center justify-center flex-shrink-0"
                      title="Dismiss notification alert"
                      aria-label="Dismiss notification alert"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>

                    {/* Triangular beak pointing towards the bell icon */}
                    <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-l-[6px] border-l-[#1F3864]" />
                  </div>
                </div>
              </div>
            )}

            <button
              aria-label="Notifications"
              className={`relative w-9 h-9 flex items-center justify-center rounded-lg text-[#5F6368] hover:bg-[#F0EDED] hover:text-[#1A1A1A] transition-colors active:scale-[0.98] ${
                notificationsOpen ? "bg-[#F0EDED] text-[#1A1A1A]" : ""
              } ${isRinging ? "text-[#1F3864]" : ""}`}
              type="button"
              onClick={() => {
                if (onNotificationClick) {
                  onNotificationClick();
                } else {
                  setNotificationsOpen((prev) => !prev);
                  setProfileOpen(false);
                }
              }}
            >
              <span
                className={`material-symbols-outlined text-[20px] transition-transform ${
                  isRinging
                    ? "animate-bell-ring text-[#1F3864]"
                    : activeUnreadCount > 0
                    ? "text-[#1F3864]"
                    : "text-[#5F6368]"
                }`}
              >
                {activeUnreadCount > 0 || isRinging ? "notifications_active" : "notifications"}
              </span>
              {activeUnreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[#E53935] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-badge-pulse shadow-xs">
                  {activeUnreadCount > 99 ? "99+" : activeUnreadCount}
                </span>
              )}
            </button>

            <NotificationDropdown
              isOpen={notificationsOpen}
              onClose={() => setNotificationsOpen(false)}
            />
          </div>

          <div className="h-6 w-px bg-[#EEEEEE]" />

          {/* Profile Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group focus:outline-none text-left"
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationsOpen(false);
              }}
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
