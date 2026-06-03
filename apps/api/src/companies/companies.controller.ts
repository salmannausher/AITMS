import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { OnboardCompanyDto } from './dto/onboard-company.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  /**
   * Called by apps/web signup action immediately after Supabase auth.signUp.
   * Creates the Company + User records and sets JWT custom claims.
   * This endpoint is intentionally unauthenticated — the auth_user_id in the
   * body is validated to be a real Supabase user by the service layer.
   */
  @Post('onboard')
  @HttpCode(HttpStatus.CREATED)
  onboard(@Body() dto: OnboardCompanyDto) {
    return this.companiesService.onboard(dto);
  }
}
