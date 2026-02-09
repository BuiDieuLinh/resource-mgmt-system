import type { IEmployee, EmployeeFormValues } from '../types';

export const mapEmployeeToFormValues = (
  employee: IEmployee | null
): Partial<EmployeeFormValues> => {
  if (!employee) {
    return {
      employee_code: '',
      full_name: '',
      display_name: '',
      email: '',
      phone: '',
      identify_card: '',
      gender: '',
      date_of_birth: null,
      hire_date: new Date(),
      department_id: '',
      position_id: '',
      status: 'active',
    };
  }

  return {
    employee_code: employee.employee_code,
    full_name: employee.full_name,
    display_name: employee.display_name,
    email: employee.email,
    phone: employee.phone,
    identify_card: employee.identify_card,
    gender: employee.gender,
    date_of_birth: employee.date_of_birth ? new Date(employee.date_of_birth) : null,
    hire_date: employee.hire_date ? new Date(employee.hire_date) : null,
    department_id: employee.department_id,
    position_id: employee.position_id,
    status: employee.status,
  };
};
