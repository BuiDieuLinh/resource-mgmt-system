import { PartialType } from '@nestjs/mapped-types';
import { PositionDto } from './position.dto';

export class UpdatePositionDto extends PartialType(PositionDto) {}
