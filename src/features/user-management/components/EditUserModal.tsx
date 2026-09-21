import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useUpdateUserMutation } from "../api";
import { UserListItem } from "../types";
import { useDepartmentsQuery } from "@/features/department-management";
import { useRolesQuery } from "@/features/roles-permissions";
import { SelectDropdown } from "@/shared/components";


interface EditUserModalProps {
  user: UserListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [roleId, setRoleId] = useState<string>("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  // Password reset section toggle
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  const { data: departments = [] } = useDepartmentsQuery({
    includeInactive: false,
  });
  const { data: roles = [] } = useRolesQuery();
  const updateMutation = useUpdateUserMutation();

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setDepartmentId(user.departmentId?.toString() || "");
      setRoleId(user.roleId?.toString() || "");
      setStatus(user.status);
      setIsResettingPassword(false);
      setNewPassword("");
      setFormError(null);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Full Name is mandatory.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (!departmentId) {
      setFormError("Department is mandatory.");
      return;
    }
    if (!roleId) {
      setFormError("Role is mandatory.");
      return;
    }

    if (isResettingPassword) {
      if (!newPassword || newPassword.length < 8) {
        setFormError("New password must be at least 8 characters long.");
        return;
      }
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~])/;
      if (!passwordRegex.test(newPassword)) {
        setFormError(
          "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol."
        );
        return;
      }
    }

    try {
      await updateMutation.mutateAsync({
        userId: user.id,
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          departmentId: Number(departmentId),
          roleId: Number(roleId),
          status,
          password: isResettingPassword ? newPassword : undefined,
        },
      });

      onSuccess?.(`User "${user.username}" updated successfully!`);
      handleClose();
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update user details."
      );
    }
  };

  const handleClose = () => {
    setIsResettingPassword(false);
    setNewPassword("");
    setFormError(null);
    onClose();
  };

  const isDepartmentChanging =
    departmentId && Number(departmentId) !== user.departmentId;

  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-[#121E30] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#1F3864] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[22px] text-blue-300">
              edit_square
            </span>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Update User Details
              </h2>
              <p className="text-[11px] text-blue-200">
                Editing account: @{user.username}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Form Content */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-4 flex-1 text-xs"
        >
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-2.5 text-red-600 dark:text-red-400">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                error
              </span>
              <span>{formError}</span>
            </div>
          )}

          {/* Username (Readonly) & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Username
              </label>
              <input
                type="text"
                value={`@${user.username}`}
                disabled
                className="w-full h-9 px-3 bg-gray-100 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-lg text-xs text-gray-500 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-9 px-3 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white focus:outline-none focus:border-[#1F3864]"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-9 px-3 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white focus:outline-none focus:border-[#1F3864]"
              required
            />
          </div>

          {/* Department & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <SelectDropdown
                value={departmentId}
                onChange={(val) => setDepartmentId(val)}
                options={departments.map((dept) => ({
                  value: dept.id.toString(),
                  label: dept.name,
                  dotColor: dept.status === "ACTIVE" ? "bg-blue-500" : "bg-gray-400",
                }))}
                placeholder="Select Department..."
                searchable
                searchPlaceholder="Search department..."
                size="md"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <SelectDropdown
                value={roleId}
                onChange={(val) => setRoleId(val)}
                options={roles.map((role) => ({
                  value: role.id.toString(),
                  label: role.name,
                  sublabel: role.isSystem ? "System" : undefined,
                  dotColor: role.name === "ADMIN" ? "bg-purple-500" : "bg-indigo-400",
                }))}
                placeholder="Select Role..."
                searchable
                searchPlaceholder="Search role..."
                size="md"
              />
            </div>
          </div>

          {/* Department Change Notice */}
          {isDepartmentChanging && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-800 dark:text-amber-300 text-[11px] flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">
                warning
              </span>
              <span>
                Department changes require the user to have zero active team
                memberships or active ticket assignments.
              </span>
            </div>
          )}

          {/* Account Status */}
          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">
              Account Status
            </label>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={status === "ACTIVE"}
                  onChange={() => setStatus("ACTIVE")}
                  className="accent-[#1F3864]"
                />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Active
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="status"
                  value="INACTIVE"
                  checked={status === "INACTIVE"}
                  onChange={() => setStatus("INACTIVE")}
                  className="accent-[#1F3864]"
                />
                <span className="font-medium text-gray-500">
                  Inactive / Suspended
                </span>
              </label>
            </div>
          </div>

          {/* Expandable Reset Password Section */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                Password Reset
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsResettingPassword((prev) => !prev);
                  if (isResettingPassword) setNewPassword("");
                }}
                className="text-xs text-[#1F3864] dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isResettingPassword ? "close" : "lock_reset"}
                </span>
                <span>
                  {isResettingPassword ? "Cancel Password Reset" : "Reset Password"}
                </span>
              </button>
            </div>

            {isResettingPassword && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700 rounded-xl space-y-2">
                <label className="block font-semibold text-gray-700 dark:text-gray-200 text-[11px]">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special symbol"
                    className="w-full h-8 pl-3 pr-10 bg-white dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white focus:outline-none focus:border-[#1F3864]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                <p className="text-[10px] text-gray-500">
                  Setting a new password will invalidate all existing sessions for
                  this user.
                </p>
              </div>
            )}
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={updateMutation.isPending}
              className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-5 py-2 bg-[#1F3864] hover:bg-[#152747] active:scale-[0.98] text-white rounded-lg font-semibold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    save
                  </span>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
