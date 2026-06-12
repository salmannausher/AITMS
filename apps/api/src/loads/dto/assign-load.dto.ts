import { IsUUID } from 'class-validator';

export class AssignLoadDto {
  @IsUUID()
  driver_id!: string;

  @IsUUID()
  truck_id!: string;
}
