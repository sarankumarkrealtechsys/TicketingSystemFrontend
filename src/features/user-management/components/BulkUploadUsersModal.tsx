import React, { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { useDepartmentsQuery } from "@/features/department-management";
import { useRolesQuery } from "@/features/roles-permissions";
import {
  useBulkUploadUsersMutation,
  downloadUserUploadTemplate,
  useUsersListQuery,
} from "../api";
import { BulkUploadResult } from "../types";

interface BulkUploadUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

interface ParsedUserRow {
  excelRowNum: number;
  fullName: string;
  username: string;
  email: string;
  department: string;
  role: string;
  password?: string;
  status: "ACTIVE" | "INACTIVE";
  errors: string[];
}

export const BulkUploadUsersModal: React.FC<BulkUploadUsersModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [defaultPassword, setDefaultPassword] = useState("User@123456");
  const [showPassword, setShowPassword] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  // Frontend Validation States
  const [isValidating, setIsValidating] = useState(false);
  const [validationDone, setValidationDone] = useState(false);
  const [validRows, setValidRows] = useState<ParsedUserRow[]>([]);
  const [invalidRows, setInvalidRows] = useState<ParsedUserRow[]>([]);
  const [activeTab, setActiveTab] = useState<"errors" | "valid">("errors");

  // Server Results
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Master Data & User Queries for Pre-validation
  const { data: departments = [] } = useDepartmentsQuery({
    includeInactive: false,
  });
  const { data: roles = [] } = useRolesQuery();
  const { data: existingUsers = [] } = useUsersListQuery();

  const bulkUploadMutation = useBulkUploadUsersMutation();

  const resetAll = () => {
    setSelectedFile(null);
    setValidationDone(false);
    setValidRows([]);
    setInvalidRows([]);
    setUploadResult(null);
    setErrorMessage(null);
    setDefaultPassword("User@123456");
    setActiveTab("errors");
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setErrorMessage(null);
    setValidationDone(false);
    setValidRows([]);
    setInvalidRows([]);

    if (fileRejections.length > 0) {
      const rej = fileRejections[0];
      if (rej.errors?.[0]?.code === "file-too-large") {
        setErrorMessage("File exceeds 10MB limit. Please choose a smaller file.");
      } else {
        setErrorMessage("Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV file.");
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      await downloadUserUploadTemplate();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to download template. Please try again."
      );
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  /**
   * Validate spreadsheet in the frontend before uploading
   */
  const handleValidateSpreadsheet = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select an Excel or CSV file first.");
      return;
    }

    setErrorMessage(null);
    setIsValidating(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });

      if (!wb.SheetNames || wb.SheetNames.length === 0) {
        throw new Error("The uploaded spreadsheet contains no worksheets.");
      }

      const targetSheetName = wb.SheetNames.includes("Users")
        ? "Users"
        : wb.SheetNames[0];
      const sheet = wb.Sheets[targetSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!rawRows || rawRows.length === 0) {
        throw new Error("The spreadsheet contains no data rows (only headers or empty).");
      }

      // 1. Create lookup maps for fast validation
      const deptMap = new Map<string, string>();
      departments.forEach((d) => deptMap.set(d.name.trim().toLowerCase(), d.name));

      const roleMap = new Map<string, string>();
      roles.forEach((r) => {
        if (r.status === "ACTIVE") {
          roleMap.set(r.name.trim().toLowerCase(), r.name);
        }
      });

      // 2. Existing database users lookup (case-insensitive)
      const dbUsernames = new Set(
        existingUsers.map((u) => u.username.toLowerCase())
      );
      const dbEmails = new Set(
        existingUsers.map((u) => u.email.toLowerCase())
      );

      // 3. Track in-sheet duplicates
      const sheetUsernames = new Map<string, number>();
      const sheetEmails = new Map<string, number>();

      const valids: ParsedUserRow[] = [];
      const invalids: ParsedUserRow[] = [];

      const PASSWORD_REGEX =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~])/;
      const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      rawRows.forEach((rawRow, idx) => {
        const rowNum = idx + 2; // header is Row 1
        const row: Record<string, any> = {};
        for (const [k, v] of Object.entries(rawRow)) {
          const cleanK = k.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");
          row[cleanK] = typeof v === "string" ? v.trim() : v;
        }

        const usernameRaw = row.username || row.user || row.uname || "";
        const emailRaw = row.email || row.emailaddress || row.mail || "";
        const fullNameRaw = row.fullname || row.name || row.displayname || "";
        const deptRaw = row.department || row.dept || "";
        const roleRaw = row.role || row.rolename || "";
        const passwordRaw = row.password || row.pass || row.pwd || "";
        const statusRaw = row.status || "ACTIVE";

        // Ignore completely blank row
        if (!usernameRaw && !emailRaw && !deptRaw && !roleRaw) {
          return;
        }

        const rowErrors: string[] = [];

        // Validate Username
        const username = usernameRaw.toString().trim();
        if (!username) {
          rowErrors.push("Username is mandatory.");
        } else if (username.length < 3 || username.length > 100) {
          rowErrors.push("Username must be between 3 and 100 characters.");
        } else if (dbUsernames.has(username.toLowerCase())) {
          rowErrors.push(`Username "${username}" already exists in the system.`);
        } else if (sheetUsernames.has(username.toLowerCase())) {
          rowErrors.push(
            `Duplicate username "${username}" in spreadsheet (Row ${sheetUsernames.get(
              username.toLowerCase()
            )} & Row ${rowNum}).`
          );
        } else {
          sheetUsernames.set(username.toLowerCase(), rowNum);
        }

        // Validate Email
        const email = emailRaw.toString().trim().toLowerCase();
        if (!email) {
          rowErrors.push("Email is mandatory.");
        } else if (!EMAIL_REGEX.test(email) || email.length > 190) {
          rowErrors.push("Invalid email address format.");
        } else if (dbEmails.has(email)) {
          rowErrors.push(`Email "${email}" is already registered in the system.`);
        } else if (sheetEmails.has(email)) {
          rowErrors.push(
            `Duplicate email "${email}" in spreadsheet (Row ${sheetEmails.get(
              email
            )} & Row ${rowNum}).`
          );
        } else {
          sheetEmails.set(email, rowNum);
        }

        // Validate Department
        const deptKey = deptRaw.toString().trim().toLowerCase();
        let matchedDeptName = "";
        if (!deptKey) {
          rowErrors.push("Department is mandatory.");
        } else if (!deptMap.has(deptKey)) {
          rowErrors.push(`Department "${deptRaw}" does not exist in the system.`);
        } else {
          matchedDeptName = deptMap.get(deptKey)!;
        }

        // Validate Role
        const roleKey = roleRaw.toString().trim().toLowerCase();
        let matchedRoleName = "";
        if (!roleKey) {
          rowErrors.push("Role is mandatory.");
        } else if (!roleMap.has(roleKey)) {
          rowErrors.push(`Role "${roleRaw}" does not exist in the system.`);
        } else {
          matchedRoleName = roleMap.get(roleKey)!;
        }

        // Validate Password (if provided)
        let pass = passwordRaw ? passwordRaw.toString().trim() : "";
        if (pass && pass.length < 8) {
          rowErrors.push("Password must be at least 8 characters long.");
        } else if (pass && !PASSWORD_REGEX.test(pass)) {
          rowErrors.push(
            "Password must contain uppercase, lowercase, digit, and special character."
          );
        }

        const status =
          statusRaw.toString().trim().toUpperCase() === "INACTIVE"
            ? "INACTIVE"
            : "ACTIVE";
        const fullName = fullNameRaw ? fullNameRaw.toString().trim() : username;

        const parsed: ParsedUserRow = {
          excelRowNum: rowNum,
          fullName,
          username,
          email,
          department: matchedDeptName || deptRaw,
          role: matchedRoleName || roleRaw,
          password: pass || undefined,
          status,
          errors: rowErrors,
        };

        if (rowErrors.length > 0) {
          invalids.push(parsed);
        } else {
          valids.push(parsed);
        }
      });

      setValidRows(valids);
      setInvalidRows(invalids);
      setValidationDone(true);
      setActiveTab(invalids.length > 0 ? "errors" : "valid");
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Failed to parse and validate spreadsheet file."
      );
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Submits only the valid, formatted users to the backend
   */
  const handleUploadValidUsers = async () => {
    if (validRows.length === 0) {
      setErrorMessage("There are no valid user records to import.");
      return;
    }

    setErrorMessage(null);

    try {
      let fileToUpload = selectedFile!;

      // If there were invalid rows, generate a clean file with ONLY the valid rows
      if (invalidRows.length > 0) {
        const rowsToExport = validRows.map((r) => ({
          "Full Name": r.fullName,
          Username: r.username,
          Email: r.email,
          Department: r.department,
          Role: r.role,
          Password: r.password || defaultPassword || "User@123456",
          Status: r.status,
        }));

        const ws = XLSX.utils.json_to_sheet(rowsToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Users");
        const wbBuffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        fileToUpload = new File([wbBuffer], selectedFile!.name, {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
      }

      const result = await bulkUploadMutation.mutateAsync({
        file: fileToUpload,
        defaultPassword: defaultPassword.trim() || undefined,
      });

      setUploadResult(result);
      if (result.successfulCount > 0) {
        onSuccess?.(
          `Successfully imported ${result.successfulCount} user account${
            result.successfulCount === 1 ? "" : "s"
          }!`
        );
      }
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to process bulk user creation."
      );
    }
  };

  if (!isOpen) return null;

  const totalEvaluated = validRows.length + invalidRows.length;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (
          e.target === e.currentTarget &&
          !bulkUploadMutation.isPending &&
          !isValidating
        ) {
          handleClose();
        }
      }}
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#152338] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[92vh] overflow-hidden text-gray-900 dark:text-gray-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-[#1A283E]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1F3864]/10 dark:bg-blue-500/20 text-[#1F3864] dark:text-blue-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">
                cloud_upload
              </span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white tracking-tight">
                Bulk User Creation
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Validate spreadsheet records and import user accounts.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={bulkUploadMutation.isPending || isValidating}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Global Alert / Error */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                error
              </span>
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* FINAL RESULT STATE: Upload completed */}
          {uploadResult ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div
                className={`p-4 rounded-xl border flex items-center gap-3 ${
                  uploadResult.failedCount === 0
                    ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/60 text-green-800 dark:text-green-300"
                    : uploadResult.successfulCount > 0
                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300"
                    : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-300"
                }`}
              >
                <span className="material-symbols-outlined text-[28px] shrink-0">
                  {uploadResult.failedCount === 0
                    ? "check_circle"
                    : uploadResult.successfulCount > 0
                    ? "warning"
                    : "cancel"}
                </span>
                <div>
                  <h4 className="font-bold text-sm">
                    {uploadResult.failedCount === 0
                      ? "All users imported successfully!"
                      : uploadResult.successfulCount > 0
                      ? "Partial Import Completed"
                      : "Bulk Import Failed"}
                  </h4>
                  <p className="text-xs opacity-90 mt-0.5">
                    {uploadResult.successfulCount} user account
                    {uploadResult.successfulCount === 1 ? "" : "s"} created out of{" "}
                    {uploadResult.totalRows} record
                    {uploadResult.totalRows === 1 ? "" : "s"}.
                  </p>
                </div>
              </div>

              {/* Counters */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-[#1A283E] border border-gray-200 dark:border-gray-800 rounded-xl text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Total Processed
                  </div>
                  <div className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-0.5">
                    {uploadResult.totalRows}
                  </div>
                </div>
                <div className="p-3 bg-green-50/70 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 rounded-xl text-center">
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Created
                  </div>
                  <div className="text-lg font-bold text-green-700 dark:text-green-300 mt-0.5">
                    {uploadResult.successfulCount}
                  </div>
                </div>
                <div className="p-3 bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-center">
                  <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Failed
                  </div>
                  <div className="text-lg font-bold text-red-700 dark:text-red-300 mt-0.5">
                    {uploadResult.failedCount}
                  </div>
                </div>
              </div>

              {uploadResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                    Server Execution Errors ({uploadResult.errors.length})
                  </h5>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                    {uploadResult.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-[#16233B] flex items-start gap-3"
                      >
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-mono font-semibold rounded-md shrink-0">
                          Row {err.row}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800 dark:text-gray-200">
                            {err.username} {err.email ? `(${err.email})` : ""}
                          </div>
                          <div className="text-red-600 dark:text-red-400 text-[11px] mt-0.5">
                            {err.error}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : validationDone ? (
            /* VALIDATION REVIEW STATE */
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Guidance Alert Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  invalidRows.length === 0
                    ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/60 text-green-800 dark:text-green-300"
                    : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300"
                }`}
              >
                <span className="material-symbols-outlined text-[24px] shrink-0 mt-0.5">
                  {invalidRows.length === 0 ? "verified" : "warning"}
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">
                    {invalidRows.length === 0
                      ? "All Rows Validated Successfully!"
                      : `Found ${invalidRows.length} Issue${
                          invalidRows.length === 1 ? "" : "s"
                        } in Spreadsheet`}
                  </h4>
                  <p className="text-xs opacity-90 mt-1 leading-relaxed">
                    {invalidRows.length === 0
                      ? `All ${validRows.length} user records passed validation and are ready to be imported.`
                      : `Please correct the highlighted mistakes in your Excel file and re-upload, or proceed to import only the ${validRows.length} valid record${
                          validRows.length === 1 ? "" : "s"
                        }.`}
                  </p>
                </div>
              </div>

              {/* Counters */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-[#1A283E] border border-gray-200 dark:border-gray-800 rounded-xl text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Total Evaluated
                  </div>
                  <div className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-0.5">
                    {totalEvaluated}
                  </div>
                </div>
                <div className="p-3 bg-green-50/70 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 rounded-xl text-center">
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Valid Records
                  </div>
                  <div className="text-lg font-bold text-green-700 dark:text-green-300 mt-0.5">
                    {validRows.length}
                  </div>
                </div>
                <div className="p-3 bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-center">
                  <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Invalid Records
                  </div>
                  <div className="text-lg font-bold text-red-700 dark:text-red-300 mt-0.5">
                    {invalidRows.length}
                  </div>
                </div>
              </div>

              {/* Tabs: Errors vs Valid Users */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800">
                  {invalidRows.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("errors")}
                      className={`pb-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                        activeTab === "errors"
                          ? "border-red-600 text-red-600 dark:text-red-400"
                          : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        error
                      </span>
                      <span>Errors to Correct ({invalidRows.length})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab("valid")}
                    className={`pb-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "valid"
                        ? "border-[#1F3864] text-[#1F3864] dark:border-blue-400 dark:text-blue-400"
                        : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      check_circle
                    </span>
                    <span>Ready for Import ({validRows.length})</span>
                  </button>
                </div>

                {/* Tab 1: Errors Breakdown */}
                {activeTab === "errors" && invalidRows.length > 0 && (
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                    {invalidRows.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-red-50/30 dark:bg-red-950/10 flex items-start gap-3"
                      >
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 font-mono font-bold rounded-md shrink-0">
                          Row {item.excelRowNum}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800 dark:text-gray-200">
                            {item.username || "Missing Username"}{" "}
                            {item.email ? `(${item.email})` : ""}
                          </div>
                          <div className="mt-1 space-y-1">
                            {item.errors.map((err, eIdx) => (
                              <div
                                key={eIdx}
                                className="text-red-600 dark:text-red-400 text-[11px] flex items-center gap-1.5"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                <span>{err}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 2: Valid Users Preview Table */}
                {(activeTab === "valid" || invalidRows.length === 0) && (
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 text-xs">
                    {validRows.length === 0 ? (
                      <div className="p-6 text-center text-gray-400">
                        No valid user rows found.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-[#1A283E] text-gray-600 dark:text-gray-300 sticky top-0 border-b border-gray-200 dark:border-gray-800 font-semibold text-[11px]">
                          <tr>
                            <th className="p-2.5">Row</th>
                            <th className="p-2.5">Username</th>
                            <th className="p-2.5">Email</th>
                            <th className="p-2.5">Department</th>
                            <th className="p-2.5">Role</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                          {validRows.map((r, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-gray-50/50 dark:hover:bg-[#1A283E]/50"
                            >
                              <td className="p-2.5 font-mono text-gray-400">
                                {r.excelRowNum}
                              </td>
                              <td className="p-2.5 font-medium text-gray-900 dark:text-white">
                                {r.username}
                              </td>
                              <td className="p-2.5 text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
                                {r.email}
                              </td>
                              <td className="p-2.5">{r.department}</td>
                              <td className="p-2.5">
                                <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-[#1F3864] dark:text-blue-300 font-semibold text-[10px]">
                                  {r.role}
                                </span>
                              </td>
                              <td className="p-2.5">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    r.status === "ACTIVE"
                                      ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                  }`}
                                >
                                  {r.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>

              {/* Fallback Default Password */}
              <div className="p-3 bg-gray-50 dark:bg-[#1A283E]/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Default Password for Empty Spreadsheet Rows
                  </label>
                  <span className="text-[11px] text-gray-400">Optional Fallback</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={defaultPassword}
                    onChange={(e) => setDefaultPassword(e.target.value)}
                    placeholder="User@123456"
                    className="w-full h-8 px-3 pr-9 bg-white dark:bg-[#16233B] border border-gray-300 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#1F3864]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* INITIAL STATE: File Upload & Template Download */
            <div className="space-y-5">
              {/* Template Download Card */}
              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1F3864] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[20px]">
                      table_view
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#1F3864] dark:text-blue-300">
                      Excel Template
                    </h4>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                      Spreadsheet template containing only the column names.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={isDownloadingTemplate}
                  className="px-3.5 py-2 bg-white dark:bg-[#1A283E] hover:bg-blue-50 dark:hover:bg-[#23354E] border border-blue-300 dark:border-blue-700 text-[#1F3864] dark:text-blue-300 text-xs font-semibold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isDownloadingTemplate ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[#1F3864] border-t-transparent rounded-full animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">
                        download
                      </span>
                      <span>Download Template</span>
                    </>
                  )}
                </button>
              </div>

              {/* Drag & Drop Zone */}
              <div
                {...getRootProps()}
                className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? "border-[#1F3864] bg-blue-50/50 dark:bg-blue-950/20"
                    : selectedFile
                    ? "border-[#1F3864] bg-blue-50/20 dark:bg-blue-950/10"
                    : "border-gray-300 dark:border-gray-700 hover:border-[#1F3864] dark:hover:border-blue-400 bg-gray-50/30 dark:bg-[#1A283E]/30"
                }`}
              >
                <input {...getInputProps()} />

                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-[#1F3864] dark:text-blue-300 flex items-center justify-center shadow-xs">
                      <span className="material-symbols-outlined text-[26px]">
                        description
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB &bull; Click Validate to inspect records
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        delete
                      </span>
                      <span>Remove file</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[26px]">
                        upload_file
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {isDragActive
                          ? "Drop the spreadsheet here..."
                          : "Drag & drop your Excel file here, or browse"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Supports .xlsx, .xls, .csv spreadsheets up to 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1A283E]/50 flex items-center justify-between shrink-0">
          {uploadResult ? (
            <div className="w-full flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={resetAll}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A283E] text-xs font-semibold rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#23354E] transition-colors cursor-pointer"
              >
                Upload Another File
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 bg-[#1F3864] hover:bg-[#152747] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : validationDone ? (
            <div className="w-full flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
              {invalidRows.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setValidationDone(false);
                    setSelectedFile(null);
                    setValidRows([]);
                    setInvalidRows([]);
                  }}
                  className="w-full sm:w-auto px-3.5 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A283E] text-xs font-semibold rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#23354E] transition-colors flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    refresh
                  </span>
                  <span>Re-upload Corrected File</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
              )}

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {invalidRows.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 sm:flex-initial px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleUploadValidUsers}
                  disabled={validRows.length === 0 || bulkUploadMutation.isPending}
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#1F3864] hover:bg-[#152747] active:scale-[0.98] text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none touch-manipulation"
                >
                  {bulkUploadMutation.isPending ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Accounts...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[17px]">
                        person_add
                      </span>
                      <span>
                        {invalidRows.length > 0
                          ? `Import ${validRows.length} Valid Users`
                          : `Import All ${validRows.length} Users`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleValidateSpreadsheet}
                disabled={!selectedFile || isValidating}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#1F3864] hover:bg-[#152747] active:scale-[0.98] text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none touch-manipulation"
              >
                {isValidating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Validating Records...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[17px]">
                      fact_check
                    </span>
                    <span>Validate Spreadsheet</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
