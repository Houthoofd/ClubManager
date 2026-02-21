/**
 * ====================================================================
 * useExport Hook
 * ====================================================================
 *
 * Hook for exporting data to various formats (PDF, CSV, Excel).
 * Provides utility functions for data export with proper formatting.
 *
 * Usage:
 * ```tsx
 * const { exportToPDF, exportToCSV, exportToExcel, isExporting } = useExport();
 * ```
 */

import { useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ExportOptions {
  /** Filename without extension */
  filename: string;
  /** Document title (for PDF) */
  title?: string;
  /** Columns to include (if not all) */
  columns?: string[];
  /** Custom column labels */
  columnLabels?: Record<string, string>;
}

export interface UseExportReturn {
  /** Export data to CSV */
  exportToCSV: <T extends Record<string, any>>(
    data: T[],
    options: ExportOptions
  ) => void;
  /** Export data to Excel (XLSX) */
  exportToExcel: <T extends Record<string, any>>(
    data: T[],
    options: ExportOptions
  ) => void;
  /** Export data to PDF */
  exportToPDF: <T extends Record<string, any>>(
    data: T[],
    options: ExportOptions
  ) => void;
  /** Export data to JSON */
  exportToJSON: <T extends Record<string, any>>(
    data: T[],
    options: Omit<ExportOptions, 'columns' | 'columnLabels'>
  ) => void;
  /** Whether export is in progress */
  isExporting: boolean;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for data export functionality
 *
 * @returns Export functions and state
 *
 * @example
 * ```tsx
 * function UsersTable({ users }: { users: User[] }) {
 *   const { exportToCSV, exportToPDF, isExporting } = useExport();
 *
 *   const handleExportCSV = () => {
 *     exportToCSV(users, {
 *       filename: 'users',
 *       columns: ['first_name', 'last_name', 'email'],
 *       columnLabels: {
 *         first_name: 'Prénom',
 *         last_name: 'Nom',
 *         email: 'Email',
 *       },
 *     });
 *   };
 *
 *   return (
 *     <>
 *       <Button onClick={handleExportCSV} disabled={isExporting}>
 *         Exporter CSV
 *       </Button>
 *       <DataTable data={users} />
 *     </>
 *   );
 * }
 * ```
 */
export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);

  // ============================================================================
  // CSV Export
  // ============================================================================

  const exportToCSV = useCallback(
    <T extends Record<string, any>>(data: T[], options: ExportOptions) => {
      setIsExporting(true);

      try {
        const { filename, columns, columnLabels } = options;

        // Determine columns to export
        const keys = columns || (data.length > 0 ? Object.keys(data[0]) : []);

        // Create header row
        const headers = keys.map((key) => columnLabels?.[key] || key);

        // Create data rows
        const rows = data.map((item) =>
          keys.map((key) => {
            const value = item[key];
            // Handle different data types
            if (value == null) return '';
            if (typeof value === 'object') return JSON.stringify(value);
            // Escape quotes and wrap in quotes if contains comma or newline
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
        );

        // Combine header and rows
        const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join(
          '\n'
        );

        // Create blob and download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, `${filename}.csv`);
      } catch (error) {
        console.error('Error exporting to CSV:', error);
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  // ============================================================================
  // Excel Export (Simple XLSX format)
  // ============================================================================

  const exportToExcel = useCallback(
    <T extends Record<string, any>>(data: T[], options: ExportOptions) => {
      setIsExporting(true);

      try {
        const { filename, columns, columnLabels } = options;

        // For simple Excel export, we'll use CSV format with .xlsx extension
        // For full Excel features, consider using a library like xlsx or exceljs
        const keys = columns || (data.length > 0 ? Object.keys(data[0]) : []);
        const headers = keys.map((key) => columnLabels?.[key] || key);

        const rows = data.map((item) =>
          keys.map((key) => {
            const value = item[key];
            if (value == null) return '';
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value);
          })
        );

        // Create TSV (Tab-separated values) which Excel handles well
        const tsv = [headers.join('\t'), ...rows.map((row) => row.join('\t'))].join(
          '\n'
        );

        const blob = new Blob([tsv], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        downloadBlob(blob, `${filename}.xlsx`);

        console.info(
          '💡 For advanced Excel features, consider installing the "xlsx" library'
        );
      } catch (error) {
        console.error('Error exporting to Excel:', error);
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  // ============================================================================
  // PDF Export (Simple table format)
  // ============================================================================

  const exportToPDF = useCallback(
    <T extends Record<string, any>>(data: T[], options: ExportOptions) => {
      setIsExporting(true);

      try {
        const { filename, title, columns, columnLabels } = options;

        // For simple PDF export, we'll create an HTML table and print it
        // For full PDF features, consider using a library like jsPDF or pdfmake
        const keys = columns || (data.length > 0 ? Object.keys(data[0]) : []);
        const headers = keys.map((key) => columnLabels?.[key] || key);

        // Create HTML table
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>${title || filename}</title>
            <style>
              @page { margin: 1cm; }
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
              }
              h1 {
                color: #333;
                margin-bottom: 20px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
              }
              th {
                background-color: #0066cc;
                color: white;
                font-weight: bold;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              tr:hover {
                background-color: #f5f5f5;
              }
              .footer {
                margin-top: 20px;
                text-align: center;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            ${title ? `<h1>${title}</h1>` : ''}
            <table>
              <thead>
                <tr>
                  ${headers.map((header) => `<th>${header}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${data
                  .map(
                    (item) => `
                  <tr>
                    ${keys
                      .map((key) => {
                        const value = item[key];
                        if (value == null) return '<td></td>';
                        if (typeof value === 'object')
                          return `<td>${JSON.stringify(value)}</td>`;
                        return `<td>${String(value)}</td>`;
                      })
                      .join('')}
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
            <div class="footer">
              Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
            </div>
          </body>
          </html>
        `;

        // Open in new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();

          // Wait for content to load then print
          printWindow.onload = () => {
            printWindow.print();
          };
        } else {
          // Fallback: download as HTML
          const blob = new Blob([htmlContent], { type: 'text/html' });
          downloadBlob(blob, `${filename}.html`);
        }

        console.info(
          '💡 For advanced PDF features, consider installing the "jspdf" library'
        );
      } catch (error) {
        console.error('Error exporting to PDF:', error);
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  // ============================================================================
  // JSON Export
  // ============================================================================

  const exportToJSON = useCallback(
    <T extends Record<string, any>>(
      data: T[],
      options: Omit<ExportOptions, 'columns' | 'columnLabels'>
    ) => {
      setIsExporting(true);

      try {
        const { filename } = options;

        // Pretty print JSON
        const json = JSON.stringify(data, null, 2);

        const blob = new Blob([json], { type: 'application/json' });
        downloadBlob(blob, `${filename}.json`);
      } catch (error) {
        console.error('Error exporting to JSON:', error);
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  return {
    exportToCSV,
    exportToExcel,
    exportToPDF,
    exportToJSON,
    isExporting,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format date for export
 */
export function formatDateForExport(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR');
}

/**
 * Format currency for export
 */
export function formatCurrencyForExport(amount: number | null): string {
  if (amount == null) return '';
  return `${amount.toFixed(2)} €`;
}

/**
 * Sanitize data for export (remove sensitive fields)
 */
export function sanitizeDataForExport<T extends Record<string, any>>(
  data: T[],
  excludeFields: string[] = ['password', 'token', 'secret']
): T[] {
  return data.map((item) => {
    const sanitized = { ...item };
    excludeFields.forEach((field) => {
      delete sanitized[field];
    });
    return sanitized;
  });
}

// Export default
export default useExport;
