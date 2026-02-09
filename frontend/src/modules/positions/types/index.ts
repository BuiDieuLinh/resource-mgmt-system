export interface IPosition {
  id: string;
  position_name: string;
  level: string;
  description?: string;
  department_id: string;
}

export interface IPositionPayload {
  position_name: string;
  level: string;
  description?: string;
  department_id: string;
}

export type PositionFormValues = IPositionPayload;
