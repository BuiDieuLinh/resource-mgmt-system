import type { CheckExistsField } from '../api/check-employee-exists';
import { CONTRACT_TYPE } from '../../../constant';

export const employeeValidationRules = {
  employee_code: (value: string) => {
    if (!value || value.trim() === '') return 'Employee code is required';
    if (value.length < 3) return 'Employee code must be at least 3 characters';
    if (value.length > 20) return 'Employee code must not exceed 20 characters';
    if (!/^[A-Z0-9-]+$/.test(value))
      return 'Employee code must contain only uppercase letters, numbers, and hyphens';
    return null;
  },

  full_name: (value: string) => {
    if (!value || value.trim() === '') return 'Full name is required';
    if (value.length < 2) return 'Full name must be at least 2 characters';
    if (value.length > 100) return 'Full name must not exceed 100 characters';
    return null;
  },

  display_name: (value: string | undefined) => {
    if (value && value.length > 100) return 'Display name must not exceed 100 characters';
    return null;
  },

  email: (value: string) => {
    if (!value || value.trim() === '') return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
    if (value.length > 100) return 'Email must not exceed 100 characters';
    return null;
  },

  phone: (value: string | undefined) => {
    if (value && value.trim() !== '') {
      if (!/^[0-9+\-\s()]+$/.test(value)) return 'Invalid phone number format';
      if (value.length > 20) return 'Phone number must not exceed 20 characters';
    }
    return null;
  },

  identify_card: (value: string) => {
    if (!value || value.trim() === '') return 'Identity card is required';
    if (!/^[0-9]+$/.test(value)) return 'Identity card must contain only numbers';
    if (value.length < 9 || value.length > 20)
      return 'Identity card must be between 9 and 20 digits';
    return null;
  },

  gender: (value: string | undefined) => {
    if (value && !['Male', 'Female', 'Other'].includes(value)) {
      return 'Invalid gender selection';
    }
    return null;
  },

  date_of_birth: (value: Date | string | null | undefined) => {
    if (!value) return null;

    const date = new Date(value);
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();

    if (isNaN(date.getTime())) return 'Invalid date format';
    if (date > today) return 'Date of birth cannot be in the future';
    if (age < 18) return 'Employee must be at least 18 years old';
    if (age > 100) return 'Invalid date of birth';

    return null;
  },

  hire_date: (value: Date | string | null | undefined) => {
    if (!value) return 'Hire date is required';

    const date = new Date(value);

    if (isNaN(date.getTime())) return 'Invalid date format';

    return null;
  },

  department_id: (value: string) => {
    if (!value || value.trim() === '') return 'Department is required';
    return null;
  },

  position_id: (value: string) => {
    if (!value || value.trim() === '') return 'Position is required';
    return null;
  },

  address: (value: string) => {
    if (!value || value.trim() === '') return 'Address is required';
    return null;
  },

  contract_type: (value: string | undefined) => {
    if (!value || value.trim() === '') return 'Contract type is required';
    const validTypes = Object.values(CONTRACT_TYPE);
    if (!validTypes.includes(value as any)) return 'Invalid contract type';
    return null;
  },

  manager_id: (_value: string | undefined | null) => {
    // Manager is optional, so empty or null is valid
    return null;
  },

  terminated_at: (value: Date | string | null | undefined) => {
    if (!value) return null;

    const date = new Date(value);
    const today = new Date();

    if (isNaN(date.getTime())) return 'Invalid date format';
    if (date > today) return 'Terminated date cannot be in the future';

    return null;
  },

  status: (value: string) => {
    if (!value) return 'Status is required';
    if (!['active', 'inactive'].includes(value)) return 'Invalid status';
    return null;
  },
};

export const hireDateRule = (mode: 'add' | 'edit') => (value: Date | string | null | undefined) => {
  if (!value) return 'Hire date is required';

  const date = new Date(value);
  if (isNaN(date.getTime())) return 'Invalid date format';

  if (mode === 'edit' && date > new Date()) return 'Hire date cannot be in the future';

  const dow = date.getDay();
  if (dow === 0 || dow === 6) return 'Hire date cannot be on a weekend';

  return null;
};

export const EXISTS_MSG: Record<CheckExistsField, string> = {
  employee_code: 'Employee code already exists',
  email: 'Email is already in use',
  identify_card: 'Identity card already exists',
};
