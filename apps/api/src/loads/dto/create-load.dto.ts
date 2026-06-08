import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

const LOAD_TYPES = ['DRY_VAN', 'REEFER', 'FLATBED', 'STEP_DECK'] as const;

export class CreateLoadDto {
  @IsString()
  @IsNotEmpty()
  origin_city!: string;

  @IsString()
  @Length(2, 2)
  origin_state!: string;

  @IsString()
  @IsNotEmpty()
  dest_city!: string;

  @IsString()
  @Length(2, 2)
  dest_state!: string;

  @IsDateString()
  pickup_date!: string;

  @IsOptional()
  @IsDateString()
  delivery_date?: string | null;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  rate?: number | null;

  @IsOptional()
  @IsEnum(LOAD_TYPES)
  load_type?: (typeof LOAD_TYPES)[number] | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  weight?: number | null;

  @IsOptional()
  @IsString()
  commodity?: string | null;

  @IsOptional()
  @IsString()
  reference_number?: string | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  estimated_miles?: number | null;

  @IsOptional()
  @IsUUID()
  broker_id?: string | null;

  @IsOptional()
  @IsString()
  broker_name?: string | null;
}
