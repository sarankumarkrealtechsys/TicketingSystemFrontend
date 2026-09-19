import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/features/auth/authSlice';
import { ROUTES } from '@/app/routes/routePaths';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, status } = useAppSelector((state) => state.auth);

  const handleGoDashboard = () => {
    if (status === 'authenticated' && user) {
      const isAdmin = (user.role?.name || '').toUpperCase() === 'ADMIN';
      navigate(isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.USER_DASHBOARD);
    } else {
      navigate(ROUTES.LOGIN);
    }
  };

  return (
    <div className="bg-[#F7F8FA] min-h-screen flex flex-col items-center justify-center p-4 font-sans text-slate-800 antialiased selection:bg-[#1F3864]/10 selection:text-[#1F3864]">
      <main className="w-full max-w-xl mx-auto flex flex-col items-center">
        {/* Brand Logo Header */}
        <div className="flex items-center gap-3 mb-8">
          <img
            alt="RTS Help Desk Logo"
            className="h-10 w-auto object-contain"
            src="/logo.png"
          />
          <div className="h-6 w-px bg-slate-300" />
          <span className="text-[17px] font-semibold tracking-tight text-[#1F3864]">
            RTS Help Desk
          </span>
        </div>

        {/* Centered Card Container */}
        <div className="w-full bg-white rounded-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 p-8 sm:p-10 flex flex-col items-center text-center transition-all">
          {/* Visual Graphic: Broken Route & 404 Node Topology */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="w-48 h-40 relative flex items-center justify-center">
              <svg
                className="w-full h-full"
                fill="none"
                viewBox="0 0 200 160"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Background Radial Glow */}
                <circle cx="100" cy="80" fill="#F1F4F9" r="70" />
                <circle
                  cx="100"
                  cy="80"
                  r="50"
                  stroke="#E2E8F0"
                  strokeDasharray="3 3"
                  strokeWidth="1.5"
                />
                {/* Connection Lines */}
                <line
                  stroke="#CBD5E1"
                  strokeDasharray="4 4"
                  strokeWidth="2"
                  x1="50"
                  x2="100"
                  y1="52"
                  y2="80"
                />
                <line
                  stroke="#CBD5E1"
                  strokeDasharray="4 4"
                  strokeWidth="2"
                  x1="150"
                  x2="100"
                  y1="52"
                  y2="80"
                />
                <line
                  stroke="#EF4444"
                  strokeDasharray="3 3"
                  strokeWidth="2"
                  x1="100"
                  x2="100"
                  y1="80"
                  y2="128"
                />
                {/* Sub Nodes */}
                <circle cx="50" cy="52" fill="#1F3864" r="10" />
                <circle cx="50" cy="52" fill="#93C5FD" r="4" />
                <circle cx="150" cy="52" fill="#1F3864" r="10" />
                <circle cx="150" cy="52" fill="#93C5FD" r="4" />
                {/* Central Hub Node */}
                <rect fill="#1F3864" height="32" rx="8" width="32" x="84" y="64" />
                <path
                  d="M94 80H106M100 74V86"
                  stroke="#93C5FD"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
                {/* Broken / Missing Target Node (404) */}
                <circle
                  cx="100"
                  cy="128"
                  fill="#FEE2E2"
                  r="14"
                  stroke="#EF4444"
                  strokeDasharray="3 3"
                  strokeWidth="1.5"
                />
                <path
                  d="M95 123L105 133M105 123L95 133"
                  stroke="#EF4444"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              </svg>
              {/* Large 404 Watermark Badge */}
              <div className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200 shadow-xs flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[12px] font-bold tracking-wider text-slate-700 font-mono">
                  STATUS 404
                </span>
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#1F3864] tracking-tight mb-3">
            404 - Page Not Found
          </h1>

          {/* Concise Message */}
          <p className="text-slate-600 text-[14px] sm:text-[15px] leading-relaxed max-w-md mb-8">
            The page or ticket you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs sm:max-w-sm">
            <button
              onClick={handleGoDashboard}
              type="button"
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[8px] bg-[#1F3864] hover:bg-[#142544] text-white text-[14px] font-semibold transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-[#1F3864]/40 cursor-pointer active:scale-98"
            >
              <span className="material-symbols-outlined text-[19px]">arrow_back</span>
              <span>Back to Dashboard</span>
            </button>
            <button
              onClick={() => navigate(-1)}
              type="button"
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[8px] bg-white hover:bg-slate-50 text-[#1F3864] border border-[#1F3864] text-[14px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#1F3864]/20 cursor-pointer active:scale-98"
            >
              <span className="material-symbols-outlined text-[19px]">history</span>
              <span>Go Back</span>
            </button>
          </div>
        </div>

        {/* Subtle Footer Note */}
        <p className="mt-8 text-[13px] text-slate-400">
          Need urgent support? Contact internal IT help desk at{' '}
          <span className="text-slate-600 font-medium font-mono">ext. 4409</span>
        </p>
      </main>
    </div>
  );
};

export default NotFoundPage;
