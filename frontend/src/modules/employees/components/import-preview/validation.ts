import type { PreviewEmployee, ColumnDef } from './types';

const SERVER_ERROR_FIELD_MAP: Record<string, string[]> = {
  employee_code: ['employee code'],
  email: ['email'],
  identify_card: ['identify card'],
  position_name: ['position'],
  department_name: ['department'],
  date_of_birth: ['date of birth'],
  hire_date: ['hire date'],
};

const COLUMN_ERROR_MAP: Record<string, string[]> = {
  employee_code: ['employee code', 'duplicate employee code'],
  full_name: ['full name'],
  email: ['email'],
  identify_card: ['identify card', 'id card', 'duplicate identify card'],
  department_name: ['department'],
  position_name: ['position'],
  date_of_birth: ['date of birth', 'dob'],
  hire_date: ['hire date'],
  contract_type: ['contract_type'],
  phone: ['phone'],
  gender: ['gender'],
  display_name: ['display name'],
  address: ['address'],
};

export function validateRow(
  row: PreviewEmployee,
  allRows: PreviewEmployee[],
  rowIdx: number,
): string[] {
  const errors: string[] = [];

  if (!row.employee_code?.trim()) errors.push('Employee Code is required');
  if (!row.full_name?.trim()) errors.push('Full Name is required');
  if (!row.email?.trim()) errors.push('Email is required');
  if (!row.identify_card?.trim()) errors.push('Identify Card is required');
  if (!row.department_name?.trim()) errors.push('Department is required');
  if (!row.position_name?.trim()) errors.push('Position is required');

  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email))
    errors.push('Invalid email format');

  if (row.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(row.date_of_birth))
    errors.push('Date of birth must be YYYY-MM-DD');
  if (row.hire_date && !/^\d{4}-\d{2}-\d{2}$/.test(row.hire_date))
    errors.push('Hire date must be YYYY-MM-DD');

  allRows.forEach((other, i) => {
    if (i === rowIdx) return;
    if (row.employee_code?.trim() && other.employee_code?.trim() === row.employee_code?.trim())
      errors.push('Duplicate employee code in file');
    if (row.email?.trim() && other.email?.trim() === row.email?.trim())
      errors.push('Duplicate email in file');
    if (row.identify_card?.trim() && other.identify_card?.trim() === row.identify_card?.trim())
      errors.push('Duplicate ID card in file');
  });

  return [...new Set(errors)];
}

export function dropServerErrorsForField(serverErrors: string[], field: string): string[] {
  const keywords = SERVER_ERROR_FIELD_MAP[field];
  if (!keywords) return serverErrors;
  return serverErrors.filter((e) => !keywords.some((kw) => e.toLowerCase().includes(kw)));
}

export function getColumnError(errors: string[] | undefined, col: ColumnDef): string | undefined {
  if (!errors?.length) return undefined;
  const keywords = COLUMN_ERROR_MAP[col.key as string] ?? [col.label.toLowerCase()];
  return errors.find((e) => keywords.some((kw) => e.toLowerCase().includes(kw)));
}
