import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { CdlClass, DriverStatus } from '@prisma/client';

export class UpdateDriverDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  whatsapp_phone?: string | null;

  @IsOptional()
  @IsEnum(CdlClass)
  cdl_class?: CdlClass;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  endorsements?: string[];

  @IsOptional()
  @IsString()
  home_city?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  home_state?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(70)
  hos_remaining_hours?: number;

  @IsOptional()
  @IsString()
  hos_reset_at?: string | null;

  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @IsOptional()
  @IsString()
  assigned_truck_id?: string | null;
}
