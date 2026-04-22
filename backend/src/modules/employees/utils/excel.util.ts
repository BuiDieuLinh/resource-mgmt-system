import * as ExcelJS from 'exceljs';

export function getCellValue(cell: any): string {
  if (!cell || !cell.value) return '';

  const value = cell.value;

  if (value instanceof Date) {
    return formatDateToString(value);
  }

  if (typeof value === 'object' && value.text) {
    return value.text;
  }

  if (typeof value === 'object' && value.result) {
    if (value.result instanceof Date) {
      return formatDateToString(value.result);
    }
    return value.result.toString();
  }

  if (typeof value === 'number' && cell.type === ExcelJS.ValueType.Date) {
    const date = new Date((value - 25569) * 86400 * 1000);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return value.toString();
}

export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(dateStr: string): Date | string {
  if (!dateStr || dateStr.trim() === '') return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (isNaN(date.getTime())) return '';
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return '';
    }

    return date;
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  return date;
}

export function validateHeaders(
  worksheet: ExcelJS.Worksheet,
  requiredHeaders: string[],
): { valid: boolean; missing: string[]; found: string[] } {
  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];

  headerRow.eachCell((cell) => {
    const headerValue = cell.value?.toString() || '';
    headers.push(headerValue.toLowerCase().replace(/\s+/g, ''));
  });

  const normalizedRequired = requiredHeaders.map((h) =>
    h.toLowerCase().replace(/\s+/g, ''),
  );

  const missingHeaders: string[] = [];
  normalizedRequired.forEach((required, index) => {
    if (!headers.includes(required)) {
      missingHeaders.push(requiredHeaders[index]);
    }
  });

  return {
    valid: missingHeaders.length === 0,
    missing: missingHeaders,
    found: headers,
  };
}
