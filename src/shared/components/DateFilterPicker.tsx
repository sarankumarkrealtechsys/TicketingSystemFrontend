import React, { useState, useRef, useEffect } from "react";
import { format, isToday, isYesterday } from "date-fns";

export interface DateFilterValues {
  date?: string; // YYYY-MM-DD
  startDate?: string; // ISO
  endDate?: string; // ISO
}

export interface DateFilterPickerProps {
  value?: DateFilterValues;
  onChange: (val: DateFilterValues) => void;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Creates start-of-day and end-of-day Date objects in the user's local timezone
 * from a YYYY-MM-DD string.
 */
function getLocalDateBounds(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Formats a Date object to YYYY-MM-DD in local time.
 */
function toLocalYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const DateFilterPicker: React.FC<DateFilterPickerProps> = ({
  value,
  onChange,
  className = "",
  size = "md",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const hasFilter = Boolean(value?.date || value?.startDate || value?.endDate);

  // Determine button display text
  const displayText = (() => {
    if (value?.date) {
      const { start } = getLocalDateBounds(value.date);
      if (isToday(start)) return `Today (${format(start, "MMM dd")})`;
      if (isYesterday(start)) return `Yesterday (${format(start, "MMM dd")})`;
      return format(start, "MMM dd, yyyy");
    }
    if (value?.startDate && value?.endDate) {
      const s = new Date(value.startDate);
      const e = new Date(value.endDate);
      const daysDiff = Math.round(
        (e.getTime() - s.getTime()) / (24 * 60 * 60 * 1000),
      );
      if (daysDiff >= 28 && daysDiff <= 31) return "Last 30 Days";
      if (daysDiff >= 6 && daysDiff <= 8) return "Last 7 Days";
      return `${format(s, "MMM dd")} - ${format(e, "MMM dd")}`;
    }
    return "Filter by Date";
  })();

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange({
      date: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    setIsOpen(false);
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.value; // YYYY-MM-DD
    if (!chosen) {
      handleClear();
      return;
    }
    const { start, end } = getLocalDateBounds(chosen);
    onChange({
      date: chosen,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    setIsOpen(false);
  };

  const handlePresetSelect = (preset: "today" | "yesterday" | "last7" | "last30") => {
    const now = new Date();
    if (preset === "today") {
      const ymd = toLocalYMD(now);
      const { start, end } = getLocalDateBounds(ymd);
      onChange({
        date: ymd,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
    } else if (preset === "yesterday") {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const ymd = toLocalYMD(yesterday);
      const { start, end } = getLocalDateBounds(ymd);
      onChange({
        date: ymd,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
    } else if (preset === "last7") {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      past7.setHours(0, 0, 0, 0);
      const endNow = new Date(now);
      endNow.setHours(23, 59, 59, 999);
      onChange({
        date: undefined,
        startDate: past7.toISOString(),
        endDate: endNow.toISOString(),
      });
    } else if (preset === "last30") {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      past30.setHours(0, 0, 0, 0);
      const endNow = new Date(now);
      endNow.setHours(23, 59, 59, 999);
      onChange({
        date: undefined,
        startDate: past30.toISOString(),
        endDate: endNow.toISOString(),
      });
    }
    setIsOpen(false);
  };

  const sizeClasses =
    size === "sm"
      ? "h-9 px-3 text-xs"
      : "h-10 px-3.5 text-sm";

  return (
    <div ref={containerRef} className={`relative inline-block w-full sm:w-auto ${className}`}>
      {/* Trigger Button - Medium Rounded Button Style */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full sm:w-auto rounded-lg font-medium transition-all flex items-center justify-between gap-2.5 active:scale-[0.99] cursor-pointer select-none shadow-2xs ${sizeClasses} ${
          hasFilter
            ? "bg-blue-50/70 dark:bg-blue-900/30 border border-[#1E88E5] text-[#1F3864] dark:text-blue-200"
            : "bg-white dark:bg-[#1A283E] border border-gray-300 dark:border-[#283A55] text-gray-800 dark:text-gray-100 hover:bg-gray-50/80 dark:hover:bg-[#1F304A] hover:border-gray-400"
        }`}
        title="Filter tickets by specific date or range"
      >
        <div className="flex items-center gap-2 truncate">
          <span
            className={`material-symbols-outlined text-[17px] ${
              hasFilter ? "text-[#1E88E5]" : "text-gray-400"
            }`}
          >
            calendar_today
          </span>
          <span className="truncate">{displayText}</span>
        </div>

        {hasFilter ? (
          <span
            onClick={handleClear}
            className="material-symbols-outlined text-[15px] text-[#1E88E5] hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 p-1 transition-colors"
            title="Clear date filter"
          >
            close
          </span>
        ) : (
          <span className="material-symbols-outlined text-[16px] text-gray-400">
            arrow_drop_down
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel - Mobile Optimized */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-72 max-w-[calc(100vw-32px)] bg-white dark:bg-[#121E30] rounded-xl shadow-2xl border border-gray-200 dark:border-[#1E2D45] p-3.5 z-[130] animate-[fadeInUp_0.15s_ease-out] space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#1F3864]">
                event
              </span>
              Select Ticket Date
            </span>
            {hasFilter && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Specific Single Day Input */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
              Filter by Specific Day
            </label>
            <div className="relative">
              <input
                type="date"
                value={value?.date || ""}
                onChange={handleDateInputChange}
                className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1E88E5] focus:border-[#1E88E5] transition-all cursor-pointer"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Shows tickets created strictly on this selected date.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="pt-2 border-t border-gray-100">
            <span className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Quick Presets
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handlePresetSelect("today")}
                className="px-2.5 py-1.5 text-left text-xs rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Today
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect("yesterday")}
                className="px-2.5 py-1.5 text-left text-xs rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect("last7")}
                className="px-2.5 py-1.5 text-left text-xs rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect("last30")}
                className="px-2.5 py-1.5 text-left text-xs rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                Last 30 Days
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateFilterPicker;
