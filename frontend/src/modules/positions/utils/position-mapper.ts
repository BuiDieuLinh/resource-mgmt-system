import type { IPosition, PositionFormValues } from '../types';

export const mapPositionToFormValues = (
  position: IPosition | null,
): Partial<PositionFormValues> => {
  if (!position) {
    return {
      position_name: '',
      level: '',
      description: '',
      department_id: '',
    };
  }

  return {
    position_name: position.position_name,
    level: position.level,
    description: position.description || '',
    department_id: position.department_id,
  };
};
