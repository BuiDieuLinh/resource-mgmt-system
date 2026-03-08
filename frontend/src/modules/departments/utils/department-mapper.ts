import type { IDepartment, DepartmentFormValues } from '../types';

export const mapDepartmentToFormValues = (
  department: IDepartment | null,
): Partial<DepartmentFormValues> => {
  if (!department) {
    return {
      department_code: '',
      department_name: '',
      description: '',
    };
  }

  return {
    department_code: department.department_code,
    department_name: department.department_name,
    description: department.description || '',
  };
};
