import React, { useState, useRef, useEffect, useId } from "react";

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: string;
  dotColor?: string;
  badge?: {
    text: string;
    className: string;
  };
  disabled?: boolean;
}

export interface SelectDropdownProps<T = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  icon?: string;
  required?: boolean;
  size?: "sm" | "md" | "lg";
  id?: string;
  name?: string;
}

export function SelectDropdown<T extends string | number = string>({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  className = "",
  triggerClassName = "",
  menuClassName = "",
  searchable = false,
  searchPlaceholder = "Search options...",
  icon,
  size = "md",
  id,
}: SelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autoId = useId();
  const selectId = id || autoId;

  // Selected option resolution
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options if searchable
  const filteredOptions = searchable && searchQuery.trim()
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
    if (isOpen && searchable) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen, searchable]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown" && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    } else if (e.key === "Enter" && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const handleSelect = (val: T, optDisabled?: boolean) => {
    if (optDisabled) return;
    onChange(val);
    setIsOpen(false);
  };

  const isSmall = size === "sm";
  const isLarge = size === "lg";

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 text-left transition-all duration-150 cursor-pointer ${
          isLarge
            ? "h-11 px-4 text-sm rounded-xl"
            : isSmall
            ? "h-8.5 px-3 text-xs rounded-lg"
            : "h-9.5 px-3.5 text-xs sm:text-sm rounded-lg"
        } ${
          disabled
            ? "bg-gray-100 dark:bg-slate-800 text-gray-400 border border-gray-200 dark:border-slate-700 cursor-not-allowed"
            : isOpen
            ? "bg-white dark:bg-[#1A283E] border-[#1F3864] ring-2 ring-[#1F3864]/15 text-[#1A1A1A] dark:text-white shadow-xs"
            : "bg-[#F9FAFB] dark:bg-[#1A283E] border border-[#D1D5DB] dark:border-[#283A55] text-[#1A1A1A] dark:text-white hover:bg-white hover:border-gray-400 shadow-2xs"
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 truncate">
          {icon && (
            <span
              className={`material-symbols-outlined text-gray-500 shrink-0 ${
                isLarge ? "text-[20px]" : isSmall ? "text-[16px]" : "text-[18px]"
              }`}
            >
              {icon}
            </span>
          )}

          {selectedOption?.dotColor && (
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${selectedOption.dotColor}`}
            />
          )}

          {selectedOption?.icon && (
            <span
              className={`material-symbols-outlined text-gray-500 shrink-0 ${
                isLarge ? "text-[20px]" : isSmall ? "text-[16px]" : "text-[18px]"
              }`}
            >
              {selectedOption.icon}
            </span>
          )}

          {selectedOption ? (
            <span className="truncate font-semibold text-[#1A1A1A] dark:text-white">
              {selectedOption.label}
            </span>
          ) : (
            <span className="truncate text-gray-400 font-normal">
              {placeholder}
            </span>
          )}

          {selectedOption?.badge && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${selectedOption.badge.className}`}
            >
              {selectedOption.badge.text}
            </span>
          )}
        </div>

        {/* Chevron icon with animated rotation */}
        <span
          className={`material-symbols-outlined shrink-0 text-gray-400 transition-transform duration-200 ${
            isLarge ? "text-[20px]" : isSmall ? "text-[16px]" : "text-[18px]"
          } ${isOpen ? "rotate-180 text-[#1F3864]" : ""}`}
        >
          expand_more
        </span>
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 z-[110] mt-1.5 bg-white dark:bg-[#121E30] border border-[#E5E7EB] dark:border-[#1E2D45] rounded-xl shadow-2xl py-1.5 max-h-60 overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-150 ${menuClassName}`}
        >
          {/* Search Input (if searchable) */}
          {searchable && (
            <div className="p-2 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-[#121E30] z-10">
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

          {/* Options List */}
          <div className="p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 px-3 text-center text-xs text-gray-400">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;

                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt.value, opt.disabled)}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      opt.disabled
                        ? "opacity-50 cursor-not-allowed bg-transparent text-gray-400"
                        : isSelected
                        ? "bg-blue-50/80 dark:bg-blue-900/30 text-[#1F3864] dark:text-blue-300 font-bold"
                        : "hover:bg-gray-50 dark:hover:bg-slate-800/60 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {opt.dotColor && (
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.dotColor}`}
                        />
                      )}

                      {opt.icon && (
                        <span
                          className={`material-symbols-outlined shrink-0 text-[18px] ${
                            isSelected ? "text-[#1F3864] dark:text-blue-300" : "text-gray-400"
                          }`}
                        >
                          {opt.icon}
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs truncate block font-medium">
                            {opt.label}
                          </span>
                          {opt.badge && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-semibold shrink-0 ${opt.badge.className}`}
                            >
                              {opt.badge.text}
                            </span>
                          )}
                        </div>
                        {opt.sublabel && (
                          <span className="text-[11px] text-gray-400 block truncate font-normal mt-0.5">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selected check indicator */}
                    {isSelected && (
                      <span className="material-symbols-outlined text-[16px] text-[#1F3864] dark:text-blue-300 shrink-0 font-bold">
                        check
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SelectDropdown;
