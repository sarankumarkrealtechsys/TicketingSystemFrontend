import React from 'react';
import { PRESET_COLORS, getColorBadgeStyles } from '../colorRegistry';

interface ColorPickerSectionProps {
  selectedColor: string;
  onChange: (hex: string) => void;
  previewLabel: string;
  previewType?: 'priority' | 'status';
  previewRank?: number;
}

export const ColorPickerSection: React.FC<ColorPickerSectionProps> = ({
  selectedColor,
  onChange,
  previewLabel,
  previewType = 'priority',
  previewRank = 1,
}) => {
  const badgeStyle = getColorBadgeStyles(selectedColor);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider">
          Color Accent Theme
        </label>
        <span className="text-[11px] font-mono text-gray-500 uppercase font-bold">
          {selectedColor}
        </span>
      </div>

      {/* Preset Swatches */}
      <div className="flex items-center gap-2 flex-wrap">
        {PRESET_COLORS.map((preset) => {
          const isSelected = selectedColor.toUpperCase() === preset.hex.toUpperCase();
          return (
            <button
              key={preset.hex}
              type="button"
              onClick={() => onChange(preset.hex)}
              className={`w-7 h-7 rounded-xl transition-all cursor-pointer flex items-center justify-center relative shadow-xs hover:scale-110 active:scale-95 ${
                isSelected
                  ? 'ring-2 ring-[#1F3864] ring-offset-2 scale-105'
                  : 'hover:opacity-90'
              }`}
              style={{ backgroundColor: preset.hex }}
              title={preset.name}
            >
              {isSelected && (
                <span className="material-symbols-outlined text-white text-[16px] leading-none drop-shadow-sm font-bold">
                  check
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Hex Input + Live Badge Preview */}
      <div className="flex items-center justify-between gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl mt-1">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => onChange(e.target.value)}
            className="w-7 h-7 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
            title="Choose custom color"
          />
          <input
            type="text"
            maxLength={7}
            value={selectedColor}
            onChange={(e) => {
              const val = e.target.value;
              if (val.startsWith('#') || val === '') {
                onChange(val);
              } else {
                onChange(`#${val}`);
              }
            }}
            placeholder="#3B82F6"
            className="w-24 h-7 px-2 bg-white border border-[#D1D5DB] rounded-lg text-xs font-mono font-bold text-gray-800 uppercase focus:outline-none focus:border-[#1F3864]"
          />
        </div>

        {/* Live Preview Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
            Preview:
          </span>
          {previewType === 'priority' ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs"
              style={badgeStyle}
            >
              <span
                className="w-4 h-4 rounded-md text-[10px] font-extrabold flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: selectedColor }}
              >
                {previewRank}
              </span>
              <span>{previewLabel || 'Priority'}</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs"
              style={badgeStyle}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: selectedColor }}
              />
              <span>{previewLabel || 'Status'}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
