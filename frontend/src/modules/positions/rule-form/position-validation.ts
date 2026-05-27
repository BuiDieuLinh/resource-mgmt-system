export const getPositionValidationRules = (t: (key: string) => string) => ({
  position_name: (value: string) => {
    if (!value || value.trim() === '') return t('position.validation.positionNameRequired');
    if (value.length < 2) return t('position.validation.positionNameMin');
    if (value.length > 100) return t('position.validation.positionNameMax');
    return null;
  },

  level: (value: string) => {
    if (!value || value.trim() === '') return t('position.validation.levelRequired');
    if (value.length < 2) return t('position.validation.levelMin');
    if (value.length > 50) return t('position.validation.levelMax');
    return null;
  },

  description: (value: string | undefined) => {
    if (value && value.length > 500) return t('position.validation.descriptionMax');
    return null;
  },

  department_id: (value: string) => {
    if (!value || value.trim() === '') return t('position.validation.departmentRequired');
    return null;
  },
});
