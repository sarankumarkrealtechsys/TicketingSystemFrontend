import React from "react";
import { Sidebar, SidebarProps } from "@/widgets";

export const AdminSidebar: React.FC<SidebarProps> = (props) => {
  return <Sidebar {...props} />;
};

export default AdminSidebar;
