import React from "react";
import { TicketFieldDefinition, TICKET_FIELD_TYPE_CONFIG } from "../types";

interface DynamicCustomFieldsRendererProps {
  fields: TicketFieldDefinition[];
  values: Record<number, any>;
  onChange: (fieldId: number, value: any) => void;
  onOpenAddFieldModal: () => void;
  teamName?: string | null;
  errors?: Record<number, string>;
  disabled?: boolean;
  compact?: boolean;
  sectionNumber?: string | number;
}

export const DynamicCustomFieldsRenderer: React.FC<
  DynamicCustomFieldsRendererProps
> = ({
  fields,
  values,
  onChange,
  onOpenAddFieldModal,
  teamName,
  errors = {},
  disabled = false,
  compact = false,
  sectionNumber = "3",
}) => {
  const activeFields = fields.filter((f) => f.status === "ACTIVE");

  return (
    <section
      className={`bg-white dark:bg-[#121E30] rounded-xl shadow-xs border border-[#E5E7EB] dark:border-[#1E2D45] transition-all ${
        compact ? "p-4 space-y-3" : "p-5 space-y-4"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5] dark:border-[#1E2D45]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#1F3864]/10 dark:bg-blue-900/30 flex items-center justify-center text-[#1F3864] dark:text-blue-300">
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-[#1A1A1A] dark:text-white">
                {sectionNumber ? `${sectionNumber}. ` : ""}Dynamic Custom Fields
              </h2>
              {teamName && (
                <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-[#1F3864] dark:text-blue-300 font-semibold text-[10px] border border-blue-100 dark:border-blue-800">
                  {teamName}
                </span>
              )}
            </div>
            {!compact && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Contextual metadata and parameters defined for this workflow
              </p>
            )}
          </div>
        </div>

        {/* Action Button to add custom field inline */}
        <button
          type="button"
          onClick={onOpenAddFieldModal}
          disabled={disabled}
          className="h-8 px-2.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#1F3864] dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 active:scale-[0.98] cursor-pointer disabled:opacity-50"
          title="Add a new custom field to this ticket"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Add Custom Field</span>
        </button>
      </div>

      {/* Empty State */}
      {activeFields.length === 0 ? (
        <div className="py-6 px-4 text-center bg-gray-50/60 dark:bg-[#16243a]/40 border border-dashed border-gray-200 dark:border-[#243650] rounded-xl">
          <div className="w-9 h-9 mx-auto rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#1F3864] dark:text-blue-300 flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-[20px]">
              playlist_add
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-0.5">
            No custom fields configured for this team yet
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-3">
            Need to capture specific information? You can add a new custom field
            specifically for this ticket or workflow.
          </p>
          <button
            type="button"
            onClick={onOpenAddFieldModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1F3864] hover:bg-[#162847] text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            <span>+ Add Custom Field</span>
          </button>
        </div>
      ) : (
        /* Dynamic Field Inputs Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeFields.map((field) => {
            const val = values[field.id] ?? "";
            const fieldError = errors[field.id];
            const isFullWidth =
              field.fieldType === "LONG_TEXT" ||
              field.fieldType === "MULTI_SELECT";

            return (
              <div
                key={field.id}
                className={isFullWidth ? "col-span-1 md:col-span-2" : "col-span-1"}
              >
                {/* Field Label & Requirement */}
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#1A1A1A] dark:text-gray-200">
                    {field.name}
                    {field.isRequired && (
                      <span className="text-red-500 ml-1 font-bold">*</span>
                    )}
                  </label>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">
                      {TICKET_FIELD_TYPE_CONFIG[field.fieldType]?.icon || "info"}
                    </span>
                    <span>
                      {TICKET_FIELD_TYPE_CONFIG[field.fieldType]?.label ||
                        field.fieldType}
                    </span>
                  </span>
                </div>

                {/* Specific Input Control by Field Type */}
                {renderFieldInput(field, val, (newVal) =>
                  onChange(field.id, newVal)
                )}

                {/* Description helper text */}
                {field.description && !fieldError && (
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    {field.description}
                  </p>
                )}

                {/* Field Error */}
                {fieldError && (
                  <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">
                      error
                    </span>
                    <span>{fieldError}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

/**
 * Helper to render appropriate input control for each data type
 */
function renderFieldInput(
  field: TicketFieldDefinition,
  value: any,
  onChange: (val: any) => void
) {
  switch (field.fieldType) {
    case "TEXT":
      return (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.name.toLowerCase()}...`}
          className="w-full h-9 px-3 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864]"
        />
      );

    case "LONG_TEXT":
      return (
        <textarea
          rows={3}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter detailed ${field.name.toLowerCase()}...`}
          className="w-full p-2.5 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864] resize-y leading-relaxed"
        />
      );

    case "NUMBER":
      return (
        <input
          type="number"
          step="1"
          value={value ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
          placeholder="0"
          className="w-full h-9 px-3 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864]"
        />
      );

    case "DECIMAL":
      return (
        <input
          type="number"
          step="any"
          value={value ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
          placeholder="0.00"
          className="w-full h-9 px-3 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864]"
        />
      );

    case "BOOLEAN": {
      const isChecked = Boolean(value === true || value === "true" || value === 1);
      return (
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#283A55] bg-[#FBFBFC] dark:bg-[#16243A]">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {isChecked ? "Yes (Enabled)" : "No (Disabled)"}
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => onChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-gray-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1F3864]"></div>
          </label>
        </div>
      );
    }

    case "DATE":
      return (
        <input
          type="date"
          value={value ? String(value).slice(0, 10) : ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 px-3 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white focus:outline-none focus:border-[#1F3864] cursor-pointer"
        />
      );

    case "DATETIME":
      return (
        <input
          type="datetime-local"
          value={value ? String(value).slice(0, 16) : ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 px-3 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white focus:outline-none focus:border-[#1F3864] cursor-pointer"
        />
      );

    case "SELECT": {
      const options = (field.options as Array<{ label: string; value: string }>) || [];
      return (
        <div className="relative">
          <select
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-9 pl-3 pr-8 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white focus:outline-none focus:border-[#1F3864] appearance-none cursor-pointer"
          >
            <option value="">Select option...</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px] pointer-events-none">
            expand_more
          </span>
        </div>
      );
    }

    case "MULTI_SELECT": {
      const options = (field.options as Array<{ label: string; value: string }>) || [];
      const selectedList: string[] = Array.isArray(value) ? value : [];

      const toggleOption = (optVal: string) => {
        if (selectedList.includes(optVal)) {
          onChange(selectedList.filter((v) => v !== optVal));
        } else {
          onChange([...selectedList, optVal]);
        }
      };

      return (
        <div className="p-2.5 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg flex flex-wrap gap-1.5 min-h-[42px] items-center">
          {options.length === 0 ? (
            <span className="text-xs text-gray-400 italic">
              No options available
            </span>
          ) : (
            options.map((opt) => {
              const isSelected = selectedList.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleOption(opt.value)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                    isSelected
                      ? "bg-[#1F3864] text-white border-[#1F3864] shadow-2xs"
                      : "bg-white dark:bg-[#121E30] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[13px]">
                      check
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      );
    }

    case "EMAIL":
      return (
        <div className="relative">
          <input
            type="email"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="user@example.com"
            className="w-full h-9 pl-9 pr-3 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864]"
          />
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[17px] pointer-events-none">
            alternate_email
          </span>
        </div>
      );

    case "URL":
      return (
        <div className="relative">
          <input
            type="url"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className="w-full h-9 pl-9 pr-3 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864]"
          />
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[17px] pointer-events-none">
            link
          </span>
        </div>
      );

    default:
      return (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter value...`}
          className="w-full h-9 px-3 bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] rounded-lg text-xs text-[#1A1A1A] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864]"
        />
      );
  }
}
