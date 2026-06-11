import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { CdlClass, DriverStatus } from '@prisma/client';

export class CreateDriverDto {
  @IsString()
  full_name!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  whatsapp_phone?: string;

  @IsEnum(CdlClass)
  cdl_class!: CdlClass;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  endorsements?: string[];

  @IsString()
  home_city!: string;

  @IsString()
  @Length(2, 2)
  home_state!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(70)
  hos_remaining_hours?: number;

  @IsOptional()
  @IsString()
  hos_reset_at?: string;

  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @IsOptional()
  @IsString()
  assigned_truck_id?: string;
}
