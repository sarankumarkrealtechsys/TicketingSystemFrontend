import React from "react";

export interface FooterProps {
  companyName?: string;
  systemStatus?: string;
  version?: string;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({
  companyName = "RTS Help Desk",
  systemStatus = "Operational",
  version = "v1.0",
  className = "",
}) => {
  const year = new Date().getFullYear();

  return (
    <footer
      className={`bg-white border-t border-[#EEEEEE] px-6 py-3 flex items-center justify-between text-[12px] text-[#5F6368] select-none ${className}`}
    >
      {/* Left: Copyright & Company */}
      <div className="flex items-center gap-1.5">
        <span>
          &copy; {year} {companyName}
        </span>
        <span className="text-[#EEEEEE]">&bull;</span>
        <span className="text-[#999999]">Enterprise Support &amp; IT Operations</span>
      </div>

      {/* Right: System status, Docs link, Version */}
      <div className="flex items-center gap-3">
        {/* System Status Indicator */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-medium text-[#5F6368]">
            System Status:{" "}
            <span className="text-emerald-600 font-semibold">
              {systemStatus}
            </span>
          </span>
        </div>

        <span className="text-[#EEEEEE]">&bull;</span>

        {/* SLA Badge */}
        <span className="text-[#999999]">SLA 99.98%</span>

        <span className="text-[#EEEEEE]">&bull;</span>

        {/* Version */}
        <span className="px-1.5 py-0.5 bg-[#F6F3F2] rounded text-[11px] font-semibold text-[#5F6368] border border-[#EEEEEE]">
          {version}
        </span>
      </div>
    </footer>
  );
};

export default Footer;
