import React, { useState, useEffect } from "react";
import {
  TicketFieldDefinition,
  TICKET_FIELD_TYPE_CONFIG,
  FieldOption,
} from "../types";
import { useUpdateTicketFieldMutation } from "../api";

interface EditFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: TicketFieldDefinition | null;
  onFieldUpdated?: (updated: TicketFieldDefinition) => void;
}

export const EditFieldModal: React.FC<EditFieldModalProps> = ({
  isOpen,
  onClose,
  field,
  onFieldUpdated,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<FieldOption[]>([]);
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updateMutation = useUpdateTicketFieldMutation();

  useEffect(() => {
    if (field) {
      setName(field.name || "");
      setDescription(field.description || "");
      setIsRequired(Boolean(field.isRequired));
      setOptions(
        Array.isArray(field.options) ? field.options.map((opt) => ({ ...opt })) : []
      );
      setErrorMsg(null);
      setNewOptionLabel("");
    }
  }, [field, isOpen]);

  if (!isOpen || !field) return null;

  const currentTypeConfig = TICKET_FIELD_TYPE_CONFIG[field.fieldType];

  const handleAddOption = () => {
    const trimmed = newOptionLabel.trim();
    if (!trimmed) return;
    const value = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    if (options.some((o) => o.value === value)) {
      setErrorMsg(`Option with value "${value}" already exists.`);
      return;
    }
    setOptions((prev) => [...prev, { label: trimmed, value }]);
    setNewOptionLabel("");
    setErrorMsg(null);
  };

  const handleRemoveOption = (indexToRemove: number) => {
    setOptions((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleOptionChange = (
    index: number,
    optField: "label" | "value",
    val: string
  ) => {
    setOptions((prev) =>
      prev.map((opt, idx) => {
        if (idx !== index) return opt;
        if (optField === "label") {
          return {
            ...opt,
            label: val,
            value:
              opt.value === opt.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")
                ? val.toLowerCase().replace(/[^a-z0-9]+/g, "_")
                : opt.value,
          };
        }
        return { ...opt, [optField]: val };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg("Please enter a field display label.");
      return;
    }

    if (field.fieldType === "SELECT" || field.fieldType === "MULTI_SELECT") {
      if (options.length === 0) {
        setErrorMsg("Please define at least one option for selection menus.");
        return;
      }
      const hasEmpty = options.some((o) => !o.label.trim() || !o.value.trim());
      if (hasEmpty) {
        setErrorMsg("Option labels and values cannot be blank.");
        return;
      }
    }

    try {
      const updated = await updateMutation.mutateAsync({
        id: field.id,
        name: trimmedName,
        description: description.trim() || undefined,
        isRequired,
        options:
          field.fieldType === "SELECT" || field.fieldType === "MULTI_SELECT"
            ? options
            : undefined,
      });

      onFieldUpdated?.(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update custom field."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#121E30] w-full max-w-[540px] rounded-xl shadow-2xl border border-gray-100 dark:border-[#1E2D45] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-[#1E2D45] flex items-center justify-between bg-gray-50/70 dark:bg-[#0e1726]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1F3864]/10 dark:bg-blue-900/40 text-[#1F3864] dark:text-blue-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-[19px]">edit_note</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Edit Custom Field
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Update display label, instructions, requirements, or choices
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-300 font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-red-600 flex-shrink-0">
              error
            </span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Field Type Info Badge */}
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#1F3864] text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px]">
                  {currentTypeConfig?.icon || "tune"}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-[#1F3864] dark:text-blue-200">
                  {currentTypeConfig?.label || field.fieldType}
                </span>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {currentTypeConfig?.description}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-[#1A283E] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              {field.teamId ? (field.team?.name ? `Team: ${field.team.name}` : "Team-Scoped") : "Global"}
            </span>
          </div>

          {/* Display Label */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
              Display Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cluster Node, Build URL, Customer Tier"
              required
              maxLength={100}
              autoFocus
              className="w-full h-9 px-3 bg-gray-50 dark:bg-[#1A283E] border border-gray-300 dark:border-[#283A55] rounded-lg text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864] focus:ring-1 focus:ring-[#1F3864]"
            />
          </div>

          {/* Options Builder (for SELECT and MULTI_SELECT) */}
          {(field.fieldType === "SELECT" || field.fieldType === "MULTI_SELECT") && (
            <div className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">list_alt</span>
                  Menu Options ({options.length})
                </span>
                <span className="text-[11px] text-purple-700 dark:text-purple-400">
                  Label & Key Pair
                </span>
              </div>

              {/* Existing Options List */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => handleOptionChange(idx, "label", e.target.value)}
                      placeholder="Display Label"
                      className="flex-1 h-7 px-2 bg-white dark:bg-[#121E30] border border-gray-300 dark:border-[#283A55] rounded text-xs text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={opt.value}
                      onChange={(e) => handleOptionChange(idx, "value", e.target.value)}
                      placeholder="machine_key"
                      className="w-32 h-7 px-2 font-mono bg-white dark:bg-[#121E30] border border-gray-300 dark:border-[#283A55] rounded text-[11px] text-gray-700 dark:text-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      disabled={options.length <= 1}
                      className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                      title="Remove option"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Option Input */}
              <div className="flex items-center gap-2 pt-1 border-t border-purple-200/60 dark:border-purple-900/40">
                <input
                  type="text"
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                  placeholder="Type new option and click Add..."
                  className="flex-1 h-7 px-2 bg-white dark:bg-[#121E30] border border-gray-300 dark:border-[#283A55] rounded text-xs text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="h-7 px-2.5 bg-purple-700 text-white rounded text-xs font-semibold hover:bg-purple-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>Add</span>
                </button>
              </div>
            </div>
          )}

          {/* Mandatory Checkbox */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1A283E] border border-gray-200 dark:border-[#283A55] rounded-lg">
            <div>
              <span className="block text-xs font-semibold text-gray-800 dark:text-gray-200">
                Required Field
              </span>
              <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                Block submission if this field is empty
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1F3864]"></div>
            </label>
          </div>

          {/* Description / Help text */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
              Help Text / Instructions (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Enter valid Kubernetes cluster identifier..."
              className="w-full h-8 px-3 bg-gray-50 dark:bg-[#1A283E] border border-gray-300 dark:border-[#283A55] rounded-lg text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864]"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-gray-100 dark:border-[#1E2D45] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending || !name.trim()}
              className="h-9 px-4 bg-[#1F3864] hover:bg-[#162847] text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              {updateMutation.isPending && (
                <span className="material-symbols-outlined text-[16px] animate-spin">
                  progress_activity
                </span>
              )}
              <span>Update Field</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
