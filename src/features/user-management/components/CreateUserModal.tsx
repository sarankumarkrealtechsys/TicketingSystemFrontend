import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useCreateUserMutation } from "../api";
import { useDepartmentsQuery } from "@/features/department-management";
import { useRolesQuery } from "@/features/roles-permissions";
import { SelectDropdown } from "@/shared/components";


interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [departmentId, setDepartmentId] = useState<string>("");
  const [roleId, setRoleId] = useState<string>("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: departments = [] } = useDepartmentsQuery({
    includeInactive: false,
  });
  const { data: roles = [] } = useRolesQuery();
  const createMutation = useCreateUserMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Full Name is mandatory.");
      return;
    }
    if (!username.trim() || username.length < 3) {
      setFormError("Username must be at least 3 characters long.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setFormError("Password is mandatory.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~])/;
    if (!passwordRegex.test(password)) {
      setFormError(
        "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character."
      );
      return;
    }
    if (!departmentId) {
      setFormError("Please select a Department.");
      return;
    }
    if (!roleId) {
      setFormError("Please select a Role.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        departmentId: Number(departmentId),
        roleId: Number(roleId),
        status,
      });

      onSuccess?.(`User account "${username}" created successfully!`);
      handleClose();
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create user account."
      );
    }
  };

  const handleClose = () => {
    setName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setDepartmentId("");
    setRoleId("");
    setStatus("ACTIVE");
    setFormError(null);
    onClose();
  };

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
              person_add
            </span>
            <h2 className="text-base font-bold tracking-tight">
              Create New User
            </h2>
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

          {/* Full Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full h-9 px-3 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. janedoe"
                className="w-full h-9 px-3 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864]"
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
              placeholder="e.g. jane.doe@company.com"
              className="w-full h-9 px-3 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864]"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">
              Initial Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special symbol"
                className="w-full h-9 pl-3 pr-10 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            <p className="mt-1 text-[10px] text-gray-500">
              Must include uppercase, lowercase, digit, and special symbol.
            </p>
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
                options={departments
                  .filter((d) => d.status === "ACTIVE")
                  .map((dept) => ({
                    value: dept.id.toString(),
                    label: dept.name,
                    dotColor: "bg-blue-500",
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
                options={roles
                  .filter((r) => r.status === "ACTIVE")
                  .map((role) => ({
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

          {/* Initial Status */}
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

          {/* Modal Footer Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 bg-[#1F3864] hover:bg-[#152747] active:scale-[0.98] text-white rounded-lg font-semibold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating User...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    add_circle
                  </span>
                  <span>Create User</span>
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
