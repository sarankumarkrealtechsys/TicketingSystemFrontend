import React from "react";
import { Navbar, NavbarProps } from "@/widgets";

export interface AdminHeaderProps extends NavbarProps {}

export const AdminHeader: React.FC<AdminHeaderProps> = (props) => {
  return <Navbar role="ADMIN" userRoleSubtitle="System Administrator" {...props} />;
};

export default AdminHeader;
