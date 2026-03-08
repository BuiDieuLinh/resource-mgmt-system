export const positionValidationRules = {
  position_name: (value: string) => {
    if (!value || value.trim() === '') return 'Position name is required';
    if (value.length < 2) return 'Position name must be at least 2 characters';
    if (value.length > 100) return 'Position name must not exceed 100 characters';
    return null;
  },

  level: (value: string) => {
    if (!value || value.trim() === '') return 'Level is required';
    if (value.length < 2) return 'Level must be at least 2 characters';
    if (value.length > 50) return 'Level must not exceed 50 characters';
    return null;
  },

  description: (value: string | undefined) => {
    if (value && value.length > 500) return 'Description must not exceed 500 characters';
    return null;
  },

  department_id: (value: string) => {
    if (!value || value.trim() === '') return 'Department is required';
    return null;
  },
};
