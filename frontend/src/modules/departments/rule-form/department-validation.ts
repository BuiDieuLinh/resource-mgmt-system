export const departmentValidationRules = {
  department_code: (value: string) => {
    if (!value || value.trim() === '') return 'Department code is required';
    if (value.length < 2) return 'Department code must be at least 2 characters';
    if (value.length > 20) return 'Department code must not exceed 20 characters';
    if (!/^[A-Z0-9-]+$/.test(value))
      return 'Department code must contain only uppercase letters, numbers, and hyphens';
    return null;
  },

  department_name: (value: string) => {
    if (!value || value.trim() === '') return 'Department name is required';
    if (value.length < 2) return 'Department name must be at least 2 characters';
    if (value.length > 100) return 'Department name must not exceed 100 characters';
    return null;
  },

  description: (value: string | undefined) => {
    if (value && value.length > 500) return 'Description must not exceed 500 characters';
    return null;
  },
};
