import { apiClient } from '@/shared/api';

export interface ColorPreset {
  name: string;
  hex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const PRESET_COLORS: ColorPreset[] = [
  {
    name: 'Black',
    hex: '#000000',
    bgClass: 'bg-zinc-100',
    textClass: 'text-zinc-900',
    borderClass: 'border-zinc-300',
  },
  {
    name: 'Red',
    hex: '#EF4444',
    bgClass: 'bg-red-50',
    textClass: 'text-red-700',
    borderClass: 'border-red-200',
  },
  {
    name: 'Orange',
    hex: '#F97316',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-200',
  },
  {
    name: 'Amber',
    hex: '#F59E0B',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-200',
  },
  {
    name: 'Emerald',
    hex: '#10B981',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200',
  },
  {
    name: 'Teal',
    hex: '#14B8A6',
    bgClass: 'bg-teal-50',
    textClass: 'text-teal-700',
    borderClass: 'border-teal-200',
  },
  {
    name: 'Blue',
    hex: '#3B82F6',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-200',
  },
  {
    name: 'Indigo',
    hex: '#6366F1',
    bgClass: 'bg-indigo-50',
    textClass: 'text-indigo-700',
    borderClass: 'border-indigo-200',
  },
  {
    name: 'Purple',
    hex: '#8B5CF6',
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-700',
    borderClass: 'border-purple-200',
  },
  {
    name: 'Cyan',
    hex: '#06B6D4',
    bgClass: 'bg-cyan-50',
    textClass: 'text-cyan-700',
    borderClass: 'border-cyan-200',
  },
  {
    name: 'Rose',
    hex: '#EC4899',
    bgClass: 'bg-pink-50',
    textClass: 'text-pink-700',
    borderClass: 'border-pink-200',
  },
  {
    name: 'Dark Slate',
    hex: '#1E293B',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-800',
    borderClass: 'border-slate-300',
  },
  {
    name: 'Slate',
    hex: '#64748B',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-300',
  },
];

export interface RemoteColorRegistry {
  priorityColors?: Record<string, string>;
  statusColors?: Record<string, string>;
}

const STORAGE_KEY_PRIORITY_COLORS = 'rts_priority_colors_v2';
const STORAGE_KEY_STATUS_COLORS = 'rts_status_colors_v2';

function getStoredMap(key: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function setStoredMap(key: string, map: Record<string, string>): void {
  try {
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Initializes and merges the remote color registry overrides into local storage and memory,
 * firing an update event across the current application window.
 */
export function initColorRegistry(remoteRegistry?: RemoteColorRegistry): void {
  if (!remoteRegistry) return;

  let changed = false;

  if (remoteRegistry.priorityColors && Object.keys(remoteRegistry.priorityColors).length > 0) {
    const currentP = getStoredMap(STORAGE_KEY_PRIORITY_COLORS);
    const mergedP = { ...currentP, ...remoteRegistry.priorityColors };
    setStoredMap(STORAGE_KEY_PRIORITY_COLORS, mergedP);
    changed = true;
  }

  if (remoteRegistry.statusColors && Object.keys(remoteRegistry.statusColors).length > 0) {
    const currentS = getStoredMap(STORAGE_KEY_STATUS_COLORS);
    const mergedS = { ...currentS, ...remoteRegistry.statusColors };
    setStoredMap(STORAGE_KEY_STATUS_COLORS, mergedS);
    changed = true;
  }

  if (changed && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rts_colors_updated'));
  }
}

/**
 * Background helper to sync local color adjustments to PostgreSQL system_settings and broadcast.
 */
async function syncColorOverrideToServer(payload: {
  priorityColors?: Record<string, string>;
  statusColors?: Record<string, string>;
}): Promise<void> {
  try {
    await apiClient.put('/color-registry', payload);
  } catch (err) {
    console.warn('[colorRegistry] Failed to sync color override to server:', err);
  }
}

let inFlightPromise: Promise<void> | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60000; // 60 seconds throttle cache

/**
 * Fetches the global color registry from the server and hydrates local storage.
 * Also auto-migrates any pre-existing local storage custom colors to the server.
 * Uses promise deduplication and a 60-second in-memory throttle to avoid duplicate HTTP calls.
 */
export async function fetchAndSyncColorRegistry(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastFetchTime < CACHE_TTL_MS) {
    return;
  }

  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    try {
      const { data } = await apiClient.get<{
        status: string;
        data: RemoteColorRegistry;
      }>('/color-registry');

      lastFetchTime = Date.now();
      const remote = data?.data || { priorityColors: {}, statusColors: {} };
      initColorRegistry(remote);

      // If local storage has custom colors that are not yet on the server (e.g. created previously),
      // automatically sync them up to PostgreSQL so all users receive them.
      const localP = getStoredMap(STORAGE_KEY_PRIORITY_COLORS);
      const localS = getStoredMap(STORAGE_KEY_STATUS_COLORS);

      const missingP: Record<string, string> = {};
      for (const [k, v] of Object.entries(localP)) {
        if (!remote.priorityColors?.[k]) {
          missingP[k] = v;
        }
      }

      const missingS: Record<string, string> = {};
      for (const [k, v] of Object.entries(localS)) {
        if (!remote.statusColors?.[k]) {
          missingS[k] = v;
        }
      }

      if (Object.keys(missingP).length > 0 || Object.keys(missingS).length > 0) {
        await syncColorOverrideToServer({
          priorityColors: missingP,
          statusColors: missingS,
        });
      }
    } catch (err) {
      console.warn('[colorRegistry] Failed to fetch remote color registry:', err);
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}

/**
 * Resolves color for a priority item by ID or Label with strict persistence & clean fallbacks.
 */
export function getPriorityColor(priorityId?: number | null, label?: string): string {
  const map = getStoredMap(STORAGE_KEY_PRIORITY_COLORS);

  // 1. Direct ID lookup
  if (priorityId && map[String(priorityId)]) {
    return map[String(priorityId)];
  }

  // 2. Direct Label lookup
  if (label) {
    const labelKey = `label_${label.toLowerCase().trim()}`;
    if (map[labelKey]) return map[labelKey];
    if (map[label.trim()]) return map[label.trim()];
  }

  // 3. Fallbacks for standard legacy keywords only if not customized
  const normalized = (label || '').toUpperCase();
  if (normalized.includes('CRIT') || normalized.includes('URGENT') || normalized.includes('BLOCK')) {
    return '#EF4444'; // Red default
  }
  if (normalized.includes('HIGH')) {
    return '#F97316'; // Orange
  }
  if (normalized.includes('MED') || normalized.includes('NORM')) {
    return '#3B82F6'; // Blue
  }
  if (normalized.includes('LOW')) {
    return '#10B981'; // Green
  }

  return '#3B82F6';
}

/**
 * Saves custom color override for a priority item keyed by both ID and Label,
 * persists to PostgreSQL, and broadcasts to other users in real time.
 */
export function setPriorityColor(priorityId: number, hex: string, label?: string): void {
  const map = getStoredMap(STORAGE_KEY_PRIORITY_COLORS);
  map[String(priorityId)] = hex;
  const updates: Record<string, string> = { [String(priorityId)]: hex };
  if (label) {
    const labelKey = `label_${label.toLowerCase().trim()}`;
    map[labelKey] = hex;
    updates[labelKey] = hex;
  }
  setStoredMap(STORAGE_KEY_PRIORITY_COLORS, map);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rts_colors_updated'));
  }
  // Synchronize to backend for persistence & broadcast
  syncColorOverrideToServer({ priorityColors: updates });
}

/**
 * Resolves color for a ticket status by ID, Behavior, or Label.
 */
export function getStatusColor(
  statusId?: number | null,
  behavior?: string,
  label?: string
): string {
  const map = getStoredMap(STORAGE_KEY_STATUS_COLORS);

  // 1. Direct ID lookup
  if (statusId && map[String(statusId)]) {
    return map[String(statusId)];
  }

  // 2. Direct Label lookup
  if (label) {
    const labelKey = `label_${label.toLowerCase().trim()}`;
    if (map[labelKey]) return map[labelKey];
    if (map[label.trim()]) return map[label.trim()];
  }

  // 3. Behavior-based defaults
  const b = (behavior || '').toUpperCase();
  switch (b) {
    case 'OPEN':
      return '#3B82F6'; // Blue
    case 'IN_PROGRESS':
      return '#F59E0B'; // Amber
    case 'ON_HOLD':
      return '#8B5CF6'; // Purple
    case 'RESOLVED':
      return '#10B981'; // Emerald
    case 'CLOSED':
      return '#64748B'; // Slate
    default:
      break;
  }

  const normalized = (label || '').toUpperCase();
  if (normalized.includes('QA') || normalized.includes('TEST')) return '#06B6D4';
  if (normalized.includes('REVIEW')) return '#8B5CF6';
  if (normalized.includes('HOLD') || normalized.includes('WAIT')) return '#8B5CF6';

  return '#3B82F6';
}

/**
 * Saves custom color override for a ticket status keyed by both ID and Label,
 * persists to PostgreSQL, and broadcasts to other users in real time.
 */
export function setStatusColor(statusId: number, hex: string, label?: string): void {
  const map = getStoredMap(STORAGE_KEY_STATUS_COLORS);
  map[String(statusId)] = hex;
  const updates: Record<string, string> = { [String(statusId)]: hex };
  if (label) {
    const labelKey = `label_${label.toLowerCase().trim()}`;
    map[labelKey] = hex;
    updates[labelKey] = hex;
  }
  setStoredMap(STORAGE_KEY_STATUS_COLORS, map);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rts_colors_updated'));
  }
  // Synchronize to backend for persistence & broadcast
  syncColorOverrideToServer({ statusColors: updates });
}

/**
 * Resolves Tailwind badge classes matching preset or fallback colors for Priority
 */
export function getPriorityBadgeClasses(priorityId?: number | null, label?: string): string {
  const hex = getPriorityColor(priorityId, label);
  const preset = PRESET_COLORS.find((p) => p.hex.toLowerCase() === hex.toLowerCase());
  if (preset) {
    return `${preset.bgClass} ${preset.textClass} ${preset.borderClass}`;
  }
  if (
    hex.toLowerCase() === '#000000' ||
    hex.toLowerCase() === '#000' ||
    hex.toLowerCase() === '#111827' ||
    hex.toLowerCase() === '#1e293b'
  ) {
    return 'bg-zinc-900 text-white border-zinc-700';
  }
  return 'bg-blue-50 text-blue-700 border-blue-200';
}

/**
 * Resolves Tailwind badge classes matching preset or fallback colors for Status
 */
export function getStatusBadgeClasses(
  statusId?: number | null,
  behavior?: string,
  label?: string
): string {
  const hex = getStatusColor(statusId, behavior, label);
  const preset = PRESET_COLORS.find((p) => p.hex.toLowerCase() === hex.toLowerCase());
  if (preset) {
    return `${preset.bgClass} ${preset.textClass} ${preset.borderClass}`;
  }
  return 'bg-blue-50 text-blue-700 border-blue-200';
}

/**
 * Converts a hex code to inline CSS style object for badges with high-contrast handling.
 */
export function getColorBadgeStyles(hex: string) {
  const cleanHex = hex && hex.startsWith('#') ? hex : `#${hex || '3B82F6'}`;

  // Handle pure black / dark charcoal
  if (
    cleanHex.toLowerCase() === '#000000' ||
    cleanHex.toLowerCase() === '#000' ||
    cleanHex.toLowerCase() === '#111827' ||
    cleanHex.toLowerCase() === '#1e293b'
  ) {
    return {
      backgroundColor: 'rgba(15, 23, 42, 0.08)',
      color: '#0F172A',
      borderColor: 'rgba(15, 23, 42, 0.25)',
    };
  }

  return {
    backgroundColor: `${cleanHex}15`,
    color: cleanHex,
    borderColor: `${cleanHex}40`,
  };
}
