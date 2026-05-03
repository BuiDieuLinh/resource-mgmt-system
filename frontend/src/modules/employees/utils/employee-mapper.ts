import type { IEmployee, EmployeeFormValues } from '../types';

export const mapEmployeeToFormValues = (
  employee: IEmployee | null,
): Partial<EmployeeFormValues> => {
  if (!employee) return {};

  return {
    employee_code: employee.employee_code,
    full_name: employee.full_name,
    display_name: employee.display_name ?? '',
    email: employee.email,
    phone: employee.phone ?? '',
    identify_card: employee.identify_card,
    gender: employee.gender ?? '',
    date_of_birth: employee.date_of_birth ? new Date(employee.date_of_birth) : null,
    address: employee.address ?? '',
    hire_date: employee.hire_date ? new Date(employee.hire_date) : null,
    position_id: employee.position.id ?? employee.position?.id ?? '',
    status: employee.status,
    contract_type: employee.contract_type ?? 'probation',
    manager_id: employee.manager_id ?? '',
    terminated_at: employee.terminated_at ? new Date(employee.terminated_at) : null,
    work_schedules: employee.work_schedules ?? undefined,
  };
};
