export interface IDepartment {
  id: string;
  department_code: string;
  department_name: string;
  description?: string;
}

export interface IDepartmentPayload {
  department_code: string;
  department_name: string;
  description?: string;
}

export type DepartmentFormValues = IDepartmentPayload;
