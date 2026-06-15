import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateOnboardingDto {
  @IsOptional()
  @IsString()
  mc_number?: string;

  @IsOptional()
  @IsString()
  dot_number?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  state?: string;
}
