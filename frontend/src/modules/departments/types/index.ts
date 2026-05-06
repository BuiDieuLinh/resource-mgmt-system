export interface IDepartmentPosition {
  id: string;
  position_name: string;
  level: string;
  description?: string;
}

export interface IDepartment {
  id: string;
  department_code: string;
  department_name: string;
  description?: string;
  positions?: IDepartmentPosition[];
  _count?: { positions: number };
}

export interface IDepartmentPayload {
  department_code: string;
  department_name: string;
  description?: string;
}

export type DepartmentFormValues = IDepartmentPayload;
