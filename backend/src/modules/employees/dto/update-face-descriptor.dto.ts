import { IsNotEmpty, IsArray } from 'class-validator';

export class UpdateFaceDescriptorDto {
  @IsNotEmpty()
  @IsArray()
  face_descriptor: number[];
}
