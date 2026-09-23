import React from 'react';
import { getStatusColor, getColorBadgeStyles } from '@/features/priority-status-management/colorRegistry';

export interface StatusBadgeProps {
  status?: string;
  statusId?: number;
  behavior?: string;
  color?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status = 'Open',
  statusId,
  behavior,
  color,
  className = '',
  size = 'sm',
}) => {
  const displayLabel = status || 'Open';
  const resolvedColor = color || getStatusColor(statusId, behavior, displayLabel);
  const badgeStyle = getColorBadgeStyles(resolvedColor);

  const isSmall = size === 'sm';

  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const handleUpdate = () => setTick((v) => v + 1);
    window.addEventListener('rts_colors_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('rts_colors_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

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

export default StatusBadge;

