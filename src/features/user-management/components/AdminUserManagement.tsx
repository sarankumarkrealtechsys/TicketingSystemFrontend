import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUsersListQuery } from "../api";
import { UserListItem } from "../types";
import { useDepartmentsQuery } from "@/features/department-management";
import { useRolesQuery } from "@/features/roles-permissions";
import { PERMISSIONS, useCanAtScope } from "@/features/auth";
import { StatCard, SelectDropdown, SelectOption, Can } from "@/shared/components";
import { CreateUserModal } from "./CreateUserModal";
import { EditUserModal } from "./EditUserModal";
import { ManageUserTeamsModal } from "./ManageUserTeamsModal";
import { DeactivateUserConfirmModal } from "./DeactivateUserConfirmModal";
import { DeleteUserConfirmModal } from "./DeleteUserConfirmModal";
import { ROUTES } from "@/app/routes/routePaths";

export const AdminUserManagement: React.FC = () => {
  const navigate = useNavigate();
  const hasUserViewGlobal = useCanAtScope(PERMISSIONS.USER_VIEW, "GLOBAL");
  const canViewPerformance = useCanAtScope(PERMISSIONS.USER_PERFORMANCE_VIEW, "GLOBAL");
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Bottom Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserListItem | null>(null);
  const [selectedUserForTeams, setSelectedUserForTeams] = useState<UserListItem | null>(null);
  const [selectedUserForDeactivate, setSelectedUserForDeactivate] = useState<UserListItem | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<UserListItem | null>(null);

  // Active popover state for permissions preview
  const [activePermissionsUser, setActivePermissionsUser] = useState<UserListItem | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Queries
  const {
    data: users = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useUsersListQuery(undefined, { enabled: hasUserViewGlobal });

  const { data: departments = [] } = useDepartmentsQuery({
    includeInactive: false,
  });

  const { data: roles = [] } = useRolesQuery();

  // Department Dropdown Options
  const departmentOptions = useMemo<SelectOption<string>[]>(() => {
    const opts: SelectOption<string>[] = [
      { value: "all", label: "All Departments" },
    ];
    departments.forEach((d) => {
      opts.push({
        value: d.id.toString(),
        label: d.name,
        dotColor: d.status === "ACTIVE" ? "bg-blue-500" : "bg-gray-400",
      });
    });
    return opts;
  }, [departments]);

  // Role Dropdown Options
  const roleOptions = useMemo<SelectOption<string>[]>(() => {
    const opts: SelectOption<string>[] = [
      { value: "all", label: "All Roles" },
    ];
    roles.forEach((r) => {
      opts.push({
        value: r.id.toString(),
        label: r.name,
        sublabel: r.isSystem ? "System" : undefined,
        dotColor: r.name === "ADMIN" ? "bg-purple-500" : "bg-indigo-400",
      });
    });
    return opts;
  }, [roles]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Department filter
      if (
        departmentFilter !== "all" &&
        user.departmentId !== Number(departmentFilter) &&
        user.department?.id !== Number(departmentFilter)
      ) {
        return false;
      }

      // Role filter
      if (
        roleFilter !== "all" &&
        user.roleId !== Number(roleFilter) &&
        user.role?.id !== Number(roleFilter)
      ) {
        return false;
      }

      // Status filter
      if (statusFilter !== "ALL" && user.status !== statusFilter) {
        return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const nameMatch = user.name.toLowerCase().includes(q);
      const usernameMatch = user.username.toLowerCase().includes(q);
      const emailMatch = user.email.toLowerCase().includes(q);
      const deptMatch = user.department?.name?.toLowerCase().includes(q);
      const roleMatch = user.role?.name?.toLowerCase().includes(q);

      return nameMatch || usernameMatch || emailMatch || deptMatch || roleMatch;
    });
  }, [users, departmentFilter, roleFilter, statusFilter, searchQuery]);

  // KPI Metrics Calculation
  const totalUsers = users.length;
  const activeUsers = useMemo(
    () => users.filter((u) => u.status === "ACTIVE").length,
    [users]
  );
  const inactiveUsers = useMemo(
    () => users.filter((u) => u.status === "INACTIVE").length,
    [users]
  );
  const uniqueDepartmentsCovered = useMemo(() => {
    const deptIds = new Set(
      users.filter((u) => u.status === "ACTIVE").map((u) => u.departmentId)
    );
    return deptIds.size;
  }, [users]);

  // Initials generator
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleOpenPerformanceProfile = (userId: number) => {
    if (!canViewPerformance) return;
    navigate(`/users/${userId}/performance`);
  };

  return (
    <div className="space-y-6">
      {/* Bottom Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[120] flex items-center gap-2 px-4 py-2.5 bg-[#1F3864] text-white rounded-lg shadow-xl text-xs font-semibold animate-in slide-in-from-bottom">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-row items-center justify-between gap-3 sm:gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-gray-500 font-medium mb-0.5 sm:mb-1">
            <Link
              to={ROUTES.ROOT}
              className="hover:text-[#1F3864] dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              Home
            </Link>
            <span className="material-symbols-outlined text-[13px] sm:text-[14px] text-gray-400 select-none">
              chevron_right
            </span>
            <Link
              to={ROUTES.ADMIN_DASHBOARD}
              className="hover:text-[#1F3864] dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              Management
            </Link>
            <span className="material-symbols-outlined text-[13px] sm:text-[14px] text-gray-400 select-none">
              chevron_right
            </span>
            <span className="text-[#1F3864] dark:text-blue-400 font-semibold">
              Users
            </span>
          </nav>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] dark:text-white tracking-tight">
            User Management
          </h1>
        </div>

        <Can permission="USER_CREATE">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1F3864] hover:bg-[#152747] active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">
              person_add
            </span>
            <span>Create User</span>
          </button>
        </Can>
      </div>

      {/* 4 Quick KPI Stat Cards (fluid responsive grid scaling) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 2xl:gap-6 w-full">
        <StatCard
          title="Active Users"
          count={activeUsers}
          icon="check_circle"
          accentColor="#43A047"
        />
        <StatCard
          title="Total Users"
          count={totalUsers}
          icon="group"
          accentColor="#1F3864"
        />
        <StatCard
          title="Departments Covered"
          count={uniqueDepartmentsCovered}
          icon="corporate_fare"
          accentColor="#0284C7"
        />
        <StatCard
          title="Inactive Accounts"
          count={inactiveUsers}
          icon="person_off"
          accentColor="#757575"
        />
      </div>

      {/* USERS TABLE & TOOLBAR SECTION */}
      <div className="bg-white dark:bg-[#121E30] rounded-xl shadow-xs border border-[#E5E7EB] dark:border-[#1E2D45] overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 flex flex-col gap-3 bg-white dark:bg-[#121E30] border-b border-[#F0F2F5] dark:border-[#1E2D45]">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 w-full">
            {/* Search Input */}
            <div className="relative w-full lg:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                search
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, username, email..."
                className="w-full h-9 pl-9 pr-3 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864] transition-all"
              />
            </div>

            {/* Custom Dropdown Filters Row */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Department SelectDropdown */}
              <div className="w-48">
                <SelectDropdown
                  value={departmentFilter}
                  onChange={(val) => setDepartmentFilter(val)}
                  options={departmentOptions}
                  size="sm"
                  searchable
                  searchPlaceholder="Filter department..."
                />
              </div>

              {/* Role SelectDropdown */}
              <div className="w-40">
                <SelectDropdown
                  value={roleFilter}
                  onChange={(val) => setRoleFilter(val)}
                  options={roleOptions}
                  size="sm"
                  searchable
                  searchPlaceholder="Filter role..."
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    statusFilter === "ALL"
                      ? "bg-[#1F3864] text-white shadow-xs"
                      : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                  }`}
                >
                  All ({totalUsers})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("ACTIVE")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    statusFilter === "ACTIVE"
                      ? "bg-[#1F3864] text-white shadow-xs"
                      : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Active ({activeUsers})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("INACTIVE")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    statusFilter === "INACTIVE"
                      ? "bg-[#1F3864] text-white shadow-xs"
                      : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Inactive ({inactiveUsers})
                </button>
              </div>
            </div>
          </div>

          {/* Refresh Action */}
          <div className="pt-2 flex justify-end border-t border-gray-100 dark:border-[#1E2D45]/60 w-full">
            <button
              type="button"
              onClick={() => {
                refetch();
                showToast("Refreshed users list!");
              }}
              className="h-8 px-3.5 bg-[#2B4C7E] hover:bg-[#1F3864] text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 shrink-0 active:scale-[0.98] cursor-pointer"
              title="Refresh Users List"
            >
              <span
                className={`material-symbols-outlined text-[16px] ${
                  isFetching ? "animate-spin" : ""
                }`}
              >
                refresh
              </span>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Users Table & Mobile Cards */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
            <span className="w-6 h-6 border-2 border-[#1F3864] border-t-transparent rounded-full animate-spin" />
            Loading users directory...
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-xs text-red-500 font-medium">
            Failed to load users.
            <button
              type="button"
              onClick={() => refetch()}
              className="ml-2 underline text-[#1F3864] dark:text-blue-400 font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-500 dark:text-gray-400">
            <span className="material-symbols-outlined text-[36px] text-gray-300 dark:text-gray-600 block mb-1">
              group_off
            </span>
            No users found matching your criteria.
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden lg:block overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAFBFD] dark:bg-[#162234] border-b border-[#F0F2F5] dark:border-[#1E2D45] text-gray-500 dark:text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 w-[24%] min-w-[200px]">User</th>
                    <th className="py-3 px-4 w-[18%] min-w-[170px]">Email</th>
                    <th className="py-3 px-4 w-[14%] min-w-[130px]">Department</th>
                    <th className="py-3 px-4 w-[16%] min-w-[150px]">Teams</th>
                    <th className="py-3 px-4 w-[14%] min-w-[130px]">Role & Perms</th>
                    <th className="py-3 px-4 w-[8%] min-w-[90px]">Status</th>
                    <th className="py-3 px-4 w-[6%] min-w-[90px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F2F5] dark:divide-[#1E2D45] text-xs">
                  {filteredUsers.map((u) => {
                    const isActive = u.status === "ACTIVE";
                    const roleName = u.role?.name || u.legacyRole || "USER";
                    const permsCount = u.role?.rolePermissions?.length ?? 0;

                    return (
                      <tr
                        key={u.id}
                        onClick={() => handleOpenPerformanceProfile(u.id)}
                        className={`transition-colors ${
                          canViewPerformance
                            ? "hover:bg-blue-50/40 dark:hover:bg-slate-800/60 cursor-pointer group"
                            : "cursor-default"
                        }`}
                        title={canViewPerformance ? "View user performance profile" : undefined}
                      >
                        {/* User (Name + Username + Avatar) */}
                        <td className="py-3.5 px-4 font-bold text-sm text-[#1A1A1A] dark:text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1F3864] to-[#2B5EA7] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                              {getInitials(u.name)}
                            </div>
                            <div className="min-w-0">
                              <span className="truncate block font-semibold text-xs text-gray-900 dark:text-white group-hover:text-[#1F3864] dark:group-hover:text-blue-300 transition-colors">
                                {u.name}
                              </span>
                              <span className="text-[11px] text-gray-400 font-mono font-normal">
                                @{u.username}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="material-symbols-outlined text-[14px] text-gray-400">
                              mail
                            </span>
                            <span className="truncate" title={u.email}>
                              {u.email}
                            </span>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-900/30 text-[#0e61a1] dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                            <span className="material-symbols-outlined text-[13px]">
                              corporate_fare
                            </span>
                            <span className="truncate">
                              {u.department?.name || "Unassigned"}
                            </span>
                          </span>
                        </td>

                        {/* Teams */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1">
                            {u.teams && u.teams.length > 0 ? (
                              u.teams.map((t) => (
                                <span
                                  key={t.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700"
                                >
                                  {t.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">
                                No teams
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Role & Permissions */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                roleName === "ADMIN"
                                  ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                {roleName === "ADMIN" ? "admin_panel_settings" : "shield"}
                              </span>
                              {roleName}
                            </span>

                            {permsCount > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivePermissionsUser(
                                    activePermissionsUser?.id === u.id ? null : u
                                  );
                                }}
                                className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-[#1F3864] dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800 cursor-pointer"
                                title="Click to view role permissions"
                              >
                                {permsCount} perms
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Can permission="USER_UPDATE">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUserForEdit(u);
                                }}
                                className="p-1.5 text-gray-500 hover:text-[#1F3864] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Edit user details"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  edit
                                </span>
                              </button>
                            </Can>
                            <Can permission="TEAM_MEMBERSHIP_MANAGE">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUserForTeams(u);
                                }}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Manage team memberships"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  groups
                                </span>
                              </button>
                            </Can>
                            <Can permission="USER_DELETE">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUserForDeactivate(u);
                                }}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isActive
                                    ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                    : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                }`}
                                title={
                                  isActive
                                    ? "Deactivate user account"
                                    : "Reactivate user account"
                                }
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  {isActive ? "person_off" : "person_check"}
                                </span>
                              </button>
                              {!isActive && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUserForDelete(u);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                                  title="Delete user permanently"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    delete
                                  </span>
                                </button>
                              )}
                            </Can>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="lg:hidden divide-y divide-[#F0F2F5] dark:divide-[#1E2D45] p-3 space-y-3">
              {filteredUsers.map((u) => {
                const isActive = u.status === "ACTIVE";
                const roleName = u.role?.name || u.legacyRole || "USER";

                return (
                  <div
                    key={u.id}
                    onClick={() => handleOpenPerformanceProfile(u.id)}
                    className={`p-3 bg-gray-50/60 dark:bg-[#162234] rounded-xl border border-gray-200 dark:border-[#1E2D45] space-y-2.5 transition-colors ${
                      canViewPerformance
                        ? "cursor-pointer hover:border-blue-300"
                        : "cursor-default"
                    }`}
                    title={canViewPerformance ? "View user performance profile" : undefined}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1F3864] to-[#2B5EA7] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-gray-900 dark:text-white block">
                            {u.name}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            @{u.username}
                          </span>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-gray-400">
                          mail
                        </span>
                        <span className="truncate">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-blue-500">
                          corporate_fare
                        </span>
                        <span>{u.department?.name || "No Department"}</span>
                        <span className="text-gray-300">•</span>
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          {roleName}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {u.teams && u.teams.length > 0 ? (
                        u.teams.map((t) => (
                          <span
                            key={t.id}
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700"
                          >
                            {t.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">
                          No teams assigned
                        </span>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-200 dark:border-slate-700">
                      <Can permission="USER_UPDATE">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserForEdit(u);
                          }}
                          className="px-2.5 py-1 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            edit
                          </span>
                          <span>Edit</span>
                        </button>
                      </Can>
                      <Can permission="TEAM_MEMBERSHIP_MANAGE">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserForTeams(u);
                          }}
                          className="px-2.5 py-1 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg hover:bg-blue-100 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            groups
                          </span>
                          <span>Teams</span>
                        </button>
                      </Can>
                      <Can permission="USER_DELETE">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserForDeactivate(u);
                          }}
                          className={`px-2.5 py-1 text-xs rounded-lg border flex items-center gap-1 ${
                            isActive
                              ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 hover:bg-amber-100"
                              : "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {isActive ? "person_off" : "person_check"}
                          </span>
                          <span>{isActive ? "Deactivate" : "Activate"}</span>
                        </button>
                        {!isActive && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUserForDelete(u);
                            }}
                            className="px-2.5 py-1 text-xs rounded-lg border flex items-center gap-1 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 hover:bg-red-100"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              delete
                            </span>
                            <span>Delete</span>
                          </button>
                        )}
                      </Can>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Permissions Popover Modal */}
      {activePermissionsUser && (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          onClick={() => setActivePermissionsUser(null)}
        >
          <div
            className="bg-white dark:bg-[#121E30] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-[#1F3864] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  Role Permissions: {activePermissionsUser.role?.name}
                </h3>
                <p className="text-[11px] text-blue-200">
                  Account: @{activePermissionsUser.username}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePermissionsUser(null)}
                className="p-1 rounded text-white/70 hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
              </button>
            </div>
            <div className="p-4 max-h-72 overflow-y-auto space-y-1.5 text-xs">
              {activePermissionsUser.role?.rolePermissions &&
              activePermissionsUser.role.rolePermissions.length > 0 ? (
                activePermissionsUser.role.rolePermissions.map((rp) => (
                  <div
                    key={rp.id}
                    className="p-2 bg-gray-50 dark:bg-slate-800/60 rounded-lg border border-gray-100 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 block">
                        {rp.permission?.key}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {rp.permission?.category || "General"}
                      </span>
                    </div>
                    {rp.scope && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-[#1F3864] dark:text-blue-300">
                        {rp.scope}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-6">
                  No specific permissions configured for this role.
                </div>
              )}
            </div>
            <div className="p-3 bg-gray-50 dark:bg-slate-800/40 flex justify-end border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setActivePermissionsUser(null)}
                className="px-3.5 py-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={showToast}
      />

      {/* EDIT USER MODAL */}
      <EditUserModal
        user={selectedUserForEdit}
        isOpen={!!selectedUserForEdit}
        onClose={() => setSelectedUserForEdit(null)}
        onSuccess={showToast}
      />

      {/* MANAGE TEAMS MODAL */}
      <ManageUserTeamsModal
        user={selectedUserForTeams}
        isOpen={!!selectedUserForTeams}
        onClose={() => setSelectedUserForTeams(null)}
        onSuccess={showToast}
      />

      {/* DEACTIVATE / REACTIVATE CONFIRM MODAL */}
      <DeactivateUserConfirmModal
        user={selectedUserForDeactivate}
        isOpen={!!selectedUserForDeactivate}
        onClose={() => setSelectedUserForDeactivate(null)}
        onSuccess={showToast}
      />

      {/* DELETE USER CONFIRM MODAL */}
      <DeleteUserConfirmModal
        user={selectedUserForDelete}
        isOpen={!!selectedUserForDelete}
        onClose={() => setSelectedUserForDelete(null)}
        onSuccess={showToast}
      />
    </div>
  );
};
