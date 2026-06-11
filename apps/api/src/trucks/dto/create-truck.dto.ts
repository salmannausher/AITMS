import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { TruckType } from '@prisma/client';

export class CreateTruckDto {
  @IsString()
  unit_number!: string;

  @IsEnum(TruckType)
  type!: TruckType;

  @IsOptional()
  @IsInt()
  @Min(1980)
  @Max(2030)
  year?: number;

  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  vin?: string;
}
