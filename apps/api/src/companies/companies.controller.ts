import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { OnboardCompanyDto } from './dto/onboard-company.dto';
import { UpdateCostSettingsDto } from './dto/update-cost-settings.dto';
import { CompanyGuard, type AuthenticatedRequest } from '../common/guards/company.guard';

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

  @Get('settings')
  @UseGuards(CompanyGuard)
  getSettings(@Req() req: AuthenticatedRequest) {
    return this.companiesService.getSettings(req.companyId);
  }

  @Patch('settings')
  @UseGuards(CompanyGuard)
  updateSettings(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateCostSettingsDto,
  ) {
    if (req.userRole !== 'OWNER') {
      throw new ForbiddenException('Only company owners can update settings');
    }
    return this.companiesService.updateCostSettings(req.companyId, dto);
  }
}
