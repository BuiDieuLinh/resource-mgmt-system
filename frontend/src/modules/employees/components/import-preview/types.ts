export interface PreviewEmployee {
  employee_code: string;
  full_name: string;
  display_name: string;
  email: string;
  phone: string;
  identify_card: string;
  gender: string;
  date_of_birth: string;
  hire_date: string;
  department_name: string;
  position_name: string;
  address?: string;
  errors?: string[];
  serverErrors?: string[];
  row_number?: number;
}

export interface ColumnDef {
  key: keyof PreviewEmployee;
  label: string;
  required?: boolean;
  width?: number;
}

export const COLUMNS: ColumnDef[] = [
  { key: 'employee_code', label: 'Code', required: true, width: 100 },
  { key: 'full_name', label: 'Full Name', required: true, width: 140 },
  { key: 'display_name', label: 'Display Name', width: 120 },
  { key: 'email', label: 'Email', required: true, width: 180 },
  { key: 'phone', label: 'Phone', width: 110 },
  { key: 'identify_card', label: 'ID Card', required: true, width: 120 },
  { key: 'gender', label: 'Gender', width: 80 },
  { key: 'date_of_birth', label: 'Date of Birth', width: 120 },
  { key: 'hire_date', label: 'Hire Date', width: 110 },
  { key: 'department_name', label: 'Department', required: true, width: 130 },
  { key: 'position_name', label: 'Position', required: true, width: 130 },
  { key: 'address', label: 'Address', width: 160 },
];
