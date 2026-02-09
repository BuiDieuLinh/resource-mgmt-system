import { OmitType } from '@nestjs/mapped-types';
import { EmployeeDto } from './employee.dto';

export class CreateEmployeeDto extends OmitType(EmployeeDto, ['id'] as const) {}