import i18n from '@/i18n';

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
  contract_type: string;
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

export function getImportColumns(): ColumnDef[] {
  return [
    { key: 'employee_code', label: i18n.t('importPreview.code'), required: true, width: 100 },
    { key: 'full_name', label: i18n.t('importPreview.fullName'), required: true, width: 140 },
    { key: 'display_name', label: i18n.t('importPreview.displayName'), width: 120 },
    { key: 'email', label: i18n.t('importPreview.email'), required: true, width: 180 },
    { key: 'phone', label: i18n.t('importPreview.phone'), width: 110 },
    { key: 'identify_card', label: i18n.t('importPreview.idCard'), required: true, width: 120 },
    { key: 'gender', label: i18n.t('importPreview.gender'), width: 80 },
    { key: 'date_of_birth', label: i18n.t('importPreview.dateOfBirth'), width: 120 },
    { key: 'hire_date', label: i18n.t('importPreview.hireDate'), width: 110 },
    { key: 'contract_type', label: i18n.t('employee.contractType'), width: 110 },
    {
      key: 'department_name',
      label: i18n.t('importPreview.department'),
      required: true,
      width: 130,
    },
    { key: 'position_name', label: i18n.t('importPreview.position'), required: true, width: 130 },
    { key: 'address', label: i18n.t('importPreview.address'), width: 160 },
  ];
}
