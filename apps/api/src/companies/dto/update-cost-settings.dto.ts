import { IsNumber, IsPositive, IsString, Length, Max } from 'class-validator';

export class UpdateCostSettingsDto {
  @IsNumber()
  @IsPositive()
  @Max(10)
  cost_per_mile!: number;

  @IsNumber()
  @IsPositive()
  @Max(5)
  fuel_cost_per_mile!: number;

  @IsNumber()
  @IsPositive()
  @Max(5)
  driver_pay_per_mile!: number;

  @IsNumber()
  @IsPositive()
  @Max(20)
  minimum_rpm!: number;

  @IsString()
  @Length(2, 2)
  home_state!: string;
}
