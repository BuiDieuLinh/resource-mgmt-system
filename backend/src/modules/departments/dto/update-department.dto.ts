import { PartialType } from '@nestjs/mapped-types';
import { DepartmentDto } from './department.dto';

export class UpdateDepartmentDto extends PartialType(DepartmentDto) {}
