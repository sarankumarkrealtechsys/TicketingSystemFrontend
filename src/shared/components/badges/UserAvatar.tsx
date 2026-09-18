import React from "react";

export interface UserAvatarProps {
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = "User",
  size = "sm",
  className = "",
}) => {
  const initials =
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const sizeClasses = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-[12px]",
    lg: "w-10 h-10 text-[14px]",
  }[size];

  // Deterministic color assignment based on name
  const colors = [
    "bg-[#1F3864]",
    "bg-[#1E88E5]",
    "bg-[#047857]",
    "bg-[#6D28D9]",
    "bg-[#0F766E]",
    "bg-[#B45309]",
  ];
  const colorIndex = (name.charCodeAt(0) || 0) % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div
      className={`${sizeClasses} ${bgColor} text-white rounded-full flex items-center justify-center font-bold shrink-0 select-none ${className}`}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
