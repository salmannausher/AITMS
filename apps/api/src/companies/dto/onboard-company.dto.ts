import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class OnboardCompanyDto {
  @IsUUID()
  auth_user_id!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  full_name!: string;

  @IsString()
  @IsNotEmpty()
  company_name!: string;
}
