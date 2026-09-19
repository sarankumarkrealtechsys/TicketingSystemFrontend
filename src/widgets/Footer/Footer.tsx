import React from "react";

export interface FooterProps {
  companyName?: string;
  systemStatus?: string;
  version?: string;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = "" }) => {
  return (
    <footer
      className={`bg-white border-t border-[#EEEEEE] px-6 py-3 flex items-center justify-center text-[12px] text-[#5F6368] select-none ${className}`}
    >
      <span>@2026 RTS help desk All rights received only</span>
    </footer>
  );
};

export default Footer;
