import React, { useState, useRef, useEffect, useId } from "react";

export interface MultiSelectOption<T = string | number> {
  value: T;
  label: string;
  sublabel?: string;
  dotColor?: string;
  badge?: {
    text: string;
    className: string;
  };
  disabled?: boolean;
}

export interface MultiSelectDropdownProps<T = string | number> {
  values?: T[];
  onChange: (values: T[]) => void;
  options: MultiSelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  size?: "sm" | "md" | "lg";
  id?: string;
  name?: string;
}

export function MultiSelectDropdown<T extends string | number = string | number>({
  values = [],
  onChange,
  options,
  placeholder = "Select options...",
  disabled = false,
  className = "",
  triggerClassName = "",
  menuClassName = "",
  searchable = false,
  searchPlaceholder = "Search options...",
  size = "md",
  id,
}: MultiSelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autoId = useId();
  const selectId = id || autoId;

  const isSmall = size === "sm";
  const isLarge = size === "lg";

  // Filter options if searchable or if options > 5
  const isSearchEnabled = searchable || options.length > 5;
  const filteredOptions = isSearchEnabled && searchQuery.trim()
    ? options.filter((opt) => {
        const q = searchQuery.toLowerCase();
        return (
          opt.label.toLowerCase().includes(q) ||
          (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
        );
      })
    : options;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when menu opens
  useEffect(() => {
    if (isOpen && isSearchEnabled) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen, isSearchEnabled]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown" && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const handleToggle = (val: T, optDisabled?: boolean) => {
    if (optDisabled) return;
    const exists = values.includes(val);
    if (exists) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const available = options.filter((o) => !o.disabled).map((o) => o.value);
    onChange(available);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  // Trigger label summary
  const selectedOptions = options.filter((opt) => values.includes(opt.value));
  const hasSelection = values.length > 0;

  const triggerLabel = (() => {
    if (values.length === 0) {
      return placeholder;
    }
    if (values.length === 1 && selectedOptions[0]) {
      return selectedOptions[0].label;
    }
    if (values.length === 2 && selectedOptions[0] && selectedOptions[1]) {
      return `${selectedOptions[0].label}, ${selectedOptions[1].label}`;
    }
    if (values.length > 2 && selectedOptions[0]) {
      return `${selectedOptions[0].label} +${values.length - 1}`;
    }
    return `${values.length} Selected`;
  })();

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button - Medium Rounded Button Style */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 text-left font-medium transition-all duration-150 cursor-pointer select-none active:scale-[0.99] ${
          isLarge
            ? "h-11 px-4 text-sm rounded-xl"
            : isSmall
            ? "h-9 px-3 text-xs rounded-lg"
            : "h-10 px-3.5 text-sm rounded-lg"
        } ${
          disabled
            ? "bg-gray-100 dark:bg-slate-800 text-gray-400 border border-gray-200 dark:border-slate-700 cursor-not-allowed"
            : isOpen
            ? "bg-white dark:bg-[#1A283E] border-[#1F3864] ring-2 ring-[#1F3864]/20 text-[#1A1A1A] dark:text-white shadow-xs"
            : hasSelection
            ? "bg-blue-50/70 dark:bg-blue-900/30 border-[#1E88E5] text-[#1F3864] dark:text-blue-300 shadow-2xs hover:bg-white dark:hover:bg-[#1A283E]"
            : "bg-white dark:bg-[#1A283E] border border-gray-300 dark:border-[#283A55] text-gray-800 dark:text-gray-100 hover:bg-gray-50/80 dark:hover:bg-[#1F304A] hover:border-gray-400 shadow-2xs"
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
          {hasSelection ? (
            <span className="truncate font-semibold text-[#1F3864] dark:text-blue-200">
              {triggerLabel}
            </span>
          ) : (
            <span className="truncate text-gray-500 dark:text-gray-400 font-normal">
              {placeholder}
            </span>
          )}

          {hasSelection && (
            <span className="px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-[#1E88E5]/15 text-[#1E88E5] dark:bg-[#1E88E5]/25 dark:text-blue-300 shrink-0">
              {values.length}
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          {hasSelection && (
            <span
              onClick={handleClearAll}
              className="material-symbols-outlined text-[15px] text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 p-1 transition-colors cursor-pointer"
              title="Clear selection"
            >
              close
            </span>
          )}

          {/* Chevron icon with animated rotation */}
          <span
            className={`material-symbols-outlined text-gray-400 transition-transform duration-200 ${
              isLarge ? "text-[20px]" : isSmall ? "text-[16px]" : "text-[18px]"
            } ${isOpen ? "rotate-180 text-[#1F3864] dark:text-blue-400" : ""}`}
          >
            expand_more
          </span>
        </div>
      </button>

      {/* Dropdown Menu Panel - Mobile Friendly positioning and scroll */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 min-w-full sm:min-w-[220px] w-full z-[120] mt-1.5 bg-white dark:bg-[#121E30] border border-[#E5E7EB] dark:border-[#1E2D45] rounded-xl shadow-2xl py-1.5 max-h-60 sm:max-h-64 overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-150 ${menuClassName}`}
        >
          {/* Top Header & Actions Bar */}
          <div className="px-2.5 py-1.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs sticky top-0 bg-white dark:bg-[#121E30] z-10">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {values.length > 0 ? `${values.length} selected` : "Select items"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-semibold text-[#1E88E5] dark:text-blue-400 hover:underline cursor-pointer"
              >
                Select all
              </button>
              {hasSelection && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Search Input (if enabled) */}
          {isSearchEnabled && (
            <div className="p-2 border-b border-gray-100 dark:border-gray-800 sticky top-8 bg-white dark:bg-[#121E30] z-10">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]">
                  search
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-8 pl-8 pr-3 bg-gray-50 dark:bg-[#1A283E] border border-gray-200 dark:border-slate-700 rounded-lg text-xs text-[#1A1A1A] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#1F3864] focus:ring-1 focus:ring-[#1F3864]/20 focus:bg-white dark:focus:bg-[#1A283E] transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Options List with Checkboxes */}
          <div className="p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 px-3 text-center text-xs text-gray-400">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = values.includes(opt.value);

                return (
                  <div
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleToggle(opt.value, opt.disabled)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors text-left cursor-pointer group select-none ${
                      opt.disabled
                        ? "opacity-50 cursor-not-allowed text-gray-400"
                        : isSelected
                        ? "bg-blue-50/70 dark:bg-blue-900/30 text-[#1F3864] dark:text-blue-300 font-semibold hover:bg-blue-100/60 dark:hover:bg-blue-900/40"
                        : "text-[#1A1A1A] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800/60 font-normal"
                    }`}
                  >
                    {/* Enterprise Checkbox Icon */}
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? "bg-[#1E88E5] border-[#1E88E5] text-white shadow-2xs"
                          : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-[#1E88E5]"
                      }`}
                    >
                      {isSelected && (
                        <span className="material-symbols-outlined text-[13px] font-bold leading-none">
                          check
                        </span>
                      )}
                    </div>

                    {/* Dot Indicator (e.g. status or priority color) */}
                    {opt.dotColor && (
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.dotColor}`}
                      />
                    )}

                    {/* Label & Sublabel */}
                    <div className="min-w-0 flex-1 truncate flex items-center justify-between gap-1.5">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>

                    {/* Optional Badge */}
                    {opt.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${opt.badge.className}`}
                      >
                        {opt.badge.text}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiSelectDropdown;
