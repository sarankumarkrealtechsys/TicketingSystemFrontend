import React from "react";
import { Sidebar, SidebarProps } from "@/widgets";

export const AdminSidebar: React.FC<SidebarProps> = (props) => {
  return <Sidebar role="ADMIN" {...props} />;
};

export default AdminSidebar;
