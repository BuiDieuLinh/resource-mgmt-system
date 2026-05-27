export const getDepartmentValidationRules = (t: (key: string) => string) => ({
  department_code: (value: string) => {
    if (!value || value.trim() === '') return t('department.validate.codeRequired');
    if (value.length < 2) return t('department.validate.codeMin');
    if (value.length > 20) return t('department.validate.codeMax');
    if (!/^[A-Z0-9-]+$/.test(value)) return t('department.validate.codePattern');
    return null;
  },

  department_name: (value: string) => {
    if (!value || value.trim() === '') return t('department.validate.nameRequired');
    if (value.length < 2) return t('department.validate.nameMin');
    if (value.length > 100) return t('department.validate.nameMax');
    return null;
  },

  description: (value: string | undefined) => {
    if (value && value.length > 500) return t('department.validate.descriptionMax');
    return null;
  },
});
