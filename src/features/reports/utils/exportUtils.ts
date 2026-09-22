import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

// Safe constructor instantiation across ESM/CJS bundlers
const createJsPdfDoc = (options: any) => {
  if (typeof jsPDF === "function") {
    return new jsPDF(options);
  }
  const fallback = (jsPDF as any)?.jsPDF || (jsPDF as any)?.default;
  if (typeof fallback === "function") {
    return new fallback(options);
  }
  throw new Error("Unable to initialize PDF generator (jsPDF constructor not found)");
};

// Safe autoTable invocation across bundlers
const runAutoTable = (doc: any, options: any) => {
  if (typeof autoTable === "function") {
    autoTable(doc, options);
  } else if (typeof (doc as any).autoTable === "function") {
    (doc as any).autoTable(options);
  } else if (typeof (autoTable as any)?.default === "function") {
    (autoTable as any).default(doc, options);
  } else {
    throw new Error("Unable to generate PDF table (autoTable plugin not found)");
  }
};

export interface ExportTicketItem {
  id: number;
  ticketNumber: string;
  summary: string;
  description?: string;
  project?: string;
  team?: string;
  priority?: string;
  status?: string;
  assignees?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLogExportItem {
  id: number;
  performedAt?: string;
  createdAt?: string;
  entityType: string;
  entityId: number | string;
  action: string;
  performedBy?: {
    id?: number;
    name?: string;
    username?: string;
    email?: string;
  };
  performedById?: number;
  newValue?: string | null;
  previousValue?: string | null;
}

export interface ReportMetadata {
  title: string;
  subtitle?: string;
  organizationName?: string;
  generatedBy?: string;
  scopeLabel?: string;
  activeFilters?: {
    project?: string;
    team?: string;
    priority?: string;
    status?: string;
    dateRange?: string;
    search?: string;
  };
  totalCount: number;
}

const escapeCell = (val: string | number | undefined | null) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * 1. TICKETS CSV EXPORT
 */
export const exportTicketsToCSV = (
  tickets: ExportTicketItem[],
  filename = `ticket_report_${format(new Date(), "yyyy-MM-dd")}.csv`
) => {
  const headers = [
    "Ticket ID",
    "Summary",
    "Project",
    "Team",
    "Priority",
    "Status",
    "Assignee(s)",
    "Created By",
    "Created Date",
    "Last Updated",
  ];

  const rows = tickets.map((t) => [
    escapeCell(t.ticketNumber),
    escapeCell(t.summary),
    escapeCell(t.project || "—"),
    escapeCell(t.team || "—"),
    escapeCell(t.priority || "Normal"),
    escapeCell(t.status || "Open"),
    escapeCell(t.assignees || "Unassigned"),
    escapeCell(t.createdBy || "—"),
    escapeCell(t.createdAt ? format(new Date(t.createdAt), "yyyy-MM-dd HH:mm") : "—"),
    escapeCell(t.updatedAt ? format(new Date(t.updatedAt), "yyyy-MM-dd HH:mm") : "—"),
  ]);

  const csvString =
    "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * 2. TICKETS EXCEL (.XLSX) EXPORT
 */
export const exportTicketsToExcel = (
  tickets: ExportTicketItem[],
  filename = `ticket_report_${format(new Date(), "yyyy-MM-dd")}.xlsx`,
  metadata?: ReportMetadata
) => {
  const rows = tickets.map((t) => ({
    "Ticket ID": t.ticketNumber,
    "Summary": t.summary,
    "Project": t.project || "—",
    "Team": t.team || "—",
    "Priority": t.priority || "Normal",
    "Status": t.status || "Open",
    "Assignee(s)": t.assignees || "Unassigned",
    "Created By": t.createdBy || "—",
    "Created Date": t.createdAt
      ? format(new Date(t.createdAt), "yyyy-MM-dd HH:mm")
      : "—",
    "Last Updated": t.updatedAt
      ? format(new Date(t.updatedAt), "yyyy-MM-dd HH:mm")
      : "—",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ "Ticket ID": "No tickets found" }]);

  // Auto-calculate column widths with safety padding (+4 characters)
  if (rows.length > 0) {
    const colWidths = Object.keys(rows[0] || {}).map((key) => {
      let maxLen = key.length;
      rows.forEach((row: any) => {
        const cellVal = row[key] ? String(row[key]) : "";
        if (cellVal.length > maxLen) {
          maxLen = cellVal.length;
        }
      });
      return { wch: Math.min(maxLen + 4, 60) };
    });
    worksheet["!cols"] = colWidths;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    metadata?.title?.slice(0, 31) || "Ticket Audit Report"
  );

  XLSX.writeFile(workbook, filename);
};

/**
 * 3. TICKETS PDF (.PDF) EXPORT
 */
export const exportTicketsToPDF = (
  tickets: ExportTicketItem[],
  filename = `ticket_report_${format(new Date(), "yyyy-MM-dd")}.pdf`,
  metadata?: ReportMetadata
) => {
  // A4 Landscape: 297mm x 210mm
  const doc = createJsPdfDoc({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Primary Brand Theme: #1F3864 (RGB: 31, 56, 100)
  const primaryR = 31;
  const primaryG = 56;
  const primaryB = 100;

  // Header Banner Background
  doc.setFillColor(primaryR, primaryG, primaryB);
  doc.rect(0, 0, pageWidth, 22, "F");

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(metadata?.title || "RTS HELP DESK — TICKET AUDIT REPORT", 14, 11);

  // Header Right: Date & Record Count
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const dateStr = `Generated: ${format(new Date(), "MMM dd, yyyy, hh:mm a")}`;
  doc.text(dateStr, pageWidth - 14, 10, { align: "right" });
  const totalStr = `Total Records: ${tickets.length}`;
  doc.text(totalStr, pageWidth - 14, 15, { align: "right" });

  // Scope & Generated By Info
  let currentY = 28;
  doc.setTextColor(31, 56, 100);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");

  if (metadata?.scopeLabel) {
    doc.text(`Report Scope: ${metadata.scopeLabel}`, 14, currentY);
    currentY += 5;
  }

  if (metadata?.generatedBy) {
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated by: ${metadata.generatedBy}`, 14, currentY);
    currentY += 5;
  }

  // Active Filters Subtitle Line
  if (metadata?.activeFilters) {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");

    const filterParts: string[] = [];
    if (metadata.activeFilters?.project) filterParts.push(`Project: ${metadata.activeFilters.project}`);
    if (metadata.activeFilters?.team) filterParts.push(`Team: ${metadata.activeFilters.team}`);
    if (metadata.activeFilters?.priority) filterParts.push(`Priority: ${metadata.activeFilters.priority}`);
    if (metadata.activeFilters?.status) filterParts.push(`Status: ${metadata.activeFilters.status}`);
    if (metadata.activeFilters?.dateRange) filterParts.push(`Date: ${metadata.activeFilters.dateRange}`);
    if (metadata.activeFilters?.search) filterParts.push(`Search: "${metadata.activeFilters.search}"`);

    const filterText = filterParts.length > 0 ? `Active Filters: ${filterParts.join("  |  ")}` : "Showing all unfiltered tickets";
    doc.text(filterText, 14, currentY);
    currentY += 5;
  }

  // Define Table Columns
  const tableHeaders = [
    [
      "Ticket ID",
      "Summary",
      "Project",
      "Team",
      "Priority",
      "Status",
      "Assignees",
      "Created Date",
    ],
  ];

  const tableData = tickets.map((t) => [
    t.ticketNumber,
    t.summary,
    t.project || "—",
    t.team || "—",
    t.priority || "Normal",
    t.status || "Open",
    t.assignees || "Unassigned",
    t.createdAt ? format(new Date(t.createdAt), "yyyy-MM-dd") : "—",
  ]);

  // Generate Table with AutoTable
  runAutoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: currentY + 2,
    margin: { left: 14, right: 14, bottom: 16 },
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 30, 30],
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [primaryR, primaryG, primaryB],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: 3.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // #F8FAFC
    },
    columnStyles: {
      0: { cellWidth: 26, fontStyle: "bold", textColor: [2, 132, 199] }, // Ticket ID
      1: { cellWidth: 70 }, // Summary
      2: { cellWidth: 32 }, // Project
      3: { cellWidth: 30 }, // Team
      4: { cellWidth: 22, halign: "center" }, // Priority
      5: { cellWidth: 24, halign: "center" }, // Status
      6: { cellWidth: 38 }, // Assignees
      7: { cellWidth: 27, halign: "center" }, // Created Date
    },
    didDrawPage: (data: any) => {
      // Footer: Confidentiality & Page Numbers
      const getPagesFn = (doc as any).getNumberOfPages || (doc as any).internal?.getNumberOfPages;
      const pageCount = typeof getPagesFn === "function" ? getPagesFn.call(doc) : 1;
      const currentPage = data.pageNumber;

      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text(
        "RTS Help Desk • Confidential Internal Audit Report",
        14,
        pageHeight - 8
      );
      doc.text(
        `Page ${currentPage} of ${pageCount}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: "right" }
      );
    },
  });

  doc.save(filename);
};

/**
 * 4. SYSTEM SECURITY AUDIT LOG CSV EXPORT
 */
export const exportAuditLogsToCSV = (
  logs: AuditLogExportItem[],
  filename = `security_audit_logs_${format(new Date(), "yyyy-MM-dd")}.csv`
) => {
  const headers = [
    "Timestamp",
    "Entity Type",
    "Entity ID",
    "Action",
    "Performed By",
    "Details",
  ];

  const rows = logs.map((l) => [
    escapeCell(l.performedAt || l.createdAt ? format(new Date(l.performedAt || l.createdAt!), "yyyy-MM-dd HH:mm:ss") : "—"),
    escapeCell(l.entityType),
    escapeCell(String(l.entityId)),
    escapeCell(l.action),
    escapeCell(l.performedBy?.name || l.performedBy?.username || (l.performedById ? `User #${l.performedById}` : "System")),
    escapeCell(l.newValue || l.previousValue || "—"),
  ]);

  const csvString =
    "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * 5. SYSTEM SECURITY AUDIT LOG EXCEL (.XLSX) EXPORT
 */
export const exportAuditLogsToExcel = (
  logs: AuditLogExportItem[],
  filename = `security_audit_logs_${format(new Date(), "yyyy-MM-dd")}.xlsx`,
  metadata?: ReportMetadata
) => {
  const rows = logs.map((l) => ({
    "Timestamp": l.performedAt || l.createdAt
      ? format(new Date(l.performedAt || l.createdAt!), "yyyy-MM-dd HH:mm:ss")
      : "—",
    "Entity Type": l.entityType,
    "Entity ID": String(l.entityId),
    "Action": l.action,
    "Performed By": l.performedBy?.name || l.performedBy?.username || (l.performedById ? `User #${l.performedById}` : "System"),
    "Details": l.newValue || l.previousValue || "—",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ "Timestamp": "No audit events recorded" }]);

  if (rows.length > 0) {
    const colWidths = Object.keys(rows[0] || {}).map((key) => {
      let maxLen = key.length;
      rows.forEach((row: any) => {
        const cellVal = row[key] ? String(row[key]) : "";
        if (cellVal.length > maxLen) {
          maxLen = cellVal.length;
        }
      });
      return { wch: Math.min(maxLen + 4, 80) };
    });
    worksheet["!cols"] = colWidths;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    metadata?.title?.slice(0, 31) || "Security Audit Logs"
  );

  XLSX.writeFile(workbook, filename);
};

/**
 * 6. SYSTEM SECURITY AUDIT LOG PDF (.PDF) EXPORT
 */
export const exportAuditLogsToPDF = (
  logs: AuditLogExportItem[],
  filename = `security_audit_logs_${format(new Date(), "yyyy-MM-dd")}.pdf`,
  metadata?: ReportMetadata
) => {
  const doc = createJsPdfDoc({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryR = 31;
  const primaryG = 56;
  const primaryB = 100;

  // Header Banner
  doc.setFillColor(primaryR, primaryG, primaryB);
  doc.rect(0, 0, pageWidth, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(metadata?.title || "RTS HELP DESK — SYSTEM SECURITY AUDIT LOG", 14, 11);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const dateStr = `Generated: ${format(new Date(), "MMM dd, yyyy, hh:mm a")}`;
  doc.text(dateStr, pageWidth - 14, 10, { align: "right" });
  const totalStr = `Total Events: ${logs.length}`;
  doc.text(totalStr, pageWidth - 14, 15, { align: "right" });

  let currentY = 28;
  doc.setTextColor(31, 56, 100);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");

  if (metadata?.scopeLabel) {
    doc.text(`Scope: ${metadata.scopeLabel}`, 14, currentY);
    currentY += 5;
  }

  if (metadata?.generatedBy) {
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated by: ${metadata.generatedBy}`, 14, currentY);
    currentY += 5;
  }

  const tableHeaders = [
    [
      "Timestamp",
      "Entity",
      "Action",
      "Performed By",
      "Details",
    ],
  ];

  const tableData = logs.map((l) => [
    l.performedAt || l.createdAt ? format(new Date(l.performedAt || l.createdAt!), "yyyy-MM-dd HH:mm:ss") : "—",
    `${l.entityType} #${l.entityId}`,
    l.action,
    l.performedBy?.name || l.performedBy?.username || (l.performedById ? `User #${l.performedById}` : "System"),
    (l.newValue || l.previousValue || "—").slice(0, 120),
  ]);

  runAutoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: currentY + 2,
    margin: { left: 14, right: 14, bottom: 16 },
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 30, 30],
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [primaryR, primaryG, primaryB],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: 3.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 34, fontStyle: "bold", textColor: [31, 56, 100] },
      2: { cellWidth: 42, fontStyle: "bold" },
      3: { cellWidth: 45 },
      4: { cellWidth: 110, fontStyle: "normal" },
    },
    didDrawPage: (data: any) => {
      const getPagesFn = (doc as any).getNumberOfPages || (doc as any).internal?.getNumberOfPages;
      const pageCount = typeof getPagesFn === "function" ? getPagesFn.call(doc) : 1;
      const currentPage = data.pageNumber;

      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text(
        "RTS Help Desk • Confidential System Security Audit Trail",
        14,
        pageHeight - 8
      );
      doc.text(
        `Page ${currentPage} of ${pageCount}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: "right" }
      );
    },
  });

  doc.save(filename);
};

