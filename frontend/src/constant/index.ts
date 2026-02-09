export const EmployeeStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type EmployeeStatus = typeof EmployeeStatus[keyof typeof EmployeeStatus];
