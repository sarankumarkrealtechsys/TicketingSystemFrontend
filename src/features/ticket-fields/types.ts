export type TicketFieldType =
  | "TEXT"
  | "LONG_TEXT"
  | "NUMBER"
  | "DECIMAL"
  | "BOOLEAN"
  | "DATE"
  | "DATETIME"
  | "SELECT"
  | "MULTI_SELECT"
  | "EMAIL"
  | "URL";

export interface FieldOption {
  label: string;
  value: string;
}

export interface TicketFieldDefinition {
  id: number;
  name: string;
  description?: string | null;
  fieldType: TicketFieldType;
  isRequired: boolean;
  sortOrder: number;
  teamId?: number | null;
  team?: {
    id: number;
    name: string;
  } | null;
  options?: FieldOption[] | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTicketFieldPayload {
  name: string;
  description?: string;
  fieldType: TicketFieldType;
  isRequired?: boolean;
  sortOrder?: number;
  teamId?: number | null;
  options?: FieldOption[] | null;
}

export const TICKET_FIELD_TYPE_CONFIG: Record<
  TicketFieldType,
  {
    label: string;
    description: string;
    icon: string;
    chipBg: string;
    chipText: string;
    chipBorder: string;
  }
> = {
  TEXT: {
    label: "Short Text",
    description: "Single-line string value",
    icon: "short_text",
    chipBg: "bg-blue-50 dark:bg-blue-900/30",
    chipText: "text-blue-700 dark:text-blue-300",
    chipBorder: "border-blue-200 dark:border-blue-800",
  },
  LONG_TEXT: {
    label: "Long Text",
    description: "Multi-line rich or plain text",
    icon: "notes",
    chipBg: "bg-indigo-50 dark:bg-indigo-900/30",
    chipText: "text-indigo-700 dark:text-indigo-300",
    chipBorder: "border-indigo-200 dark:border-indigo-800",
  },
  NUMBER: {
    label: "Integer Number",
    description: "Whole numeric values",
    icon: "pin",
    chipBg: "bg-emerald-50 dark:bg-emerald-900/30",
    chipText: "text-emerald-700 dark:text-emerald-300",
    chipBorder: "border-emerald-200 dark:border-emerald-800",
  },
  DECIMAL: {
    label: "Decimal Number",
    description: "Floating-point numbers",
    icon: "decimal_increase",
    chipBg: "bg-teal-50 dark:bg-teal-900/30",
    chipText: "text-teal-700 dark:text-teal-300",
    chipBorder: "border-teal-200 dark:border-teal-800",
  },
  BOOLEAN: {
    label: "Boolean Toggle",
    description: "Yes / No or True / False",
    icon: "toggle_on",
    chipBg: "bg-amber-50 dark:bg-amber-900/30",
    chipText: "text-amber-700 dark:text-amber-300",
    chipBorder: "border-amber-200 dark:border-amber-800",
  },
  DATE: {
    label: "Date",
    description: "Calendar date (YYYY-MM-DD)",
    icon: "calendar_today",
    chipBg: "bg-sky-50 dark:bg-sky-900/30",
    chipText: "text-sky-700 dark:text-sky-300",
    chipBorder: "border-sky-200 dark:border-sky-800",
  },
  DATETIME: {
    label: "Date & Time",
    description: "Timestamp with hours & minutes",
    icon: "schedule",
    chipBg: "bg-violet-50 dark:bg-violet-900/30",
    chipText: "text-violet-700 dark:text-violet-300",
    chipBorder: "border-violet-200 dark:border-violet-800",
  },
  SELECT: {
    label: "Dropdown Select",
    description: "Single choice from custom options",
    icon: "arrow_drop_down_circle",
    chipBg: "bg-purple-50 dark:bg-purple-900/30",
    chipText: "text-purple-700 dark:text-purple-300",
    chipBorder: "border-purple-200 dark:border-purple-800",
  },
  MULTI_SELECT: {
    label: "Multi-Select",
    description: "Multiple tags from custom options",
    icon: "checklist",
    chipBg: "bg-fuchsia-50 dark:bg-fuchsia-900/30",
    chipText: "text-fuchsia-700 dark:text-fuchsia-300",
    chipBorder: "border-fuchsia-200 dark:border-fuchsia-800",
  },
  EMAIL: {
    label: "Email Address",
    description: "Valid RFC email format",
    icon: "alternate_email",
    chipBg: "bg-rose-50 dark:bg-rose-900/30",
    chipText: "text-rose-700 dark:text-rose-300",
    chipBorder: "border-rose-200 dark:border-rose-800",
  },
  URL: {
    label: "Web URL",
    description: "Valid HTTP or HTTPS link",
    icon: "link",
    chipBg: "bg-cyan-50 dark:bg-cyan-900/30",
    chipText: "text-cyan-700 dark:text-cyan-300",
    chipBorder: "border-cyan-200 dark:border-cyan-800",
  },
};
