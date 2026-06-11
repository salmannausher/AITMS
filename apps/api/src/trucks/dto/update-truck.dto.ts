import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { TruckType } from '@prisma/client';

export class UpdateTruckDto {
  @IsOptional()
  @IsString()
  unit_number?: string;

  @IsOptional()
  @IsEnum(TruckType)
  type?: TruckType;

  @IsOptional()
  @IsInt()
  @Min(1980)
  @Max(2030)
  year?: number | null;

  @IsOptional()
  @IsString()
  make?: string | null;

  @IsOptional()
  @IsString()
  model?: string | null;

  @IsOptional()
  @IsString()
  vin?: string | null;
}
