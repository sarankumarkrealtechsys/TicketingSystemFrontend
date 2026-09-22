import React from 'react';
import { getPriorityColor, getColorBadgeStyles } from '@/features/priority-status-management/colorRegistry';

export interface PriorityBadgeProps {
  priority?: string;
  priorityId?: number;
  color?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority = 'Normal',
  priorityId,
  color,
  className = '',
  size = 'sm',
}) => {
  const displayLabel = priority || 'Normal';
  const resolvedColor = color || getPriorityColor(priorityId, displayLabel);
  const badgeStyle = getColorBadgeStyles(resolvedColor);

  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold tracking-tight rounded-full border transition-all duration-150 select-none shadow-2xs ${
        isSmall ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      } ${className}`}
      style={badgeStyle}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0 shadow-2xs"
        style={{ backgroundColor: resolvedColor }}
      />
      <span className="truncate">{displayLabel}</span>
    </span>
  );
};

export default PriorityBadge;

