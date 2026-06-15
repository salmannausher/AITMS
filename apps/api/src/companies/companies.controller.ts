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
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { CompanyGuard, type AuthenticatedRequest } from '../common/guards/company.guard';
import { inngest } from '../inngest/inngest.client';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  /**
   * Called by apps/web signup action immediately after Supabase auth.signUp.
   * Creates the Company + User records and sets JWT custom claims.
   * Intentionally unauthenticated — auth_user_id is validated by the service layer.
   */
  @Post('onboard')
  @HttpCode(HttpStatus.CREATED)
  onboard(@Body() dto: OnboardCompanyDto) {
    return this.companiesService.onboard(dto);
  }

  @Get('me')
  @UseGuards(CompanyGuard)
  getMe(@Req() req: AuthenticatedRequest) {
    return this.companiesService.getMe(req.companyId);
  }

  @Patch('onboarding')
  @UseGuards(CompanyGuard)
  updateOnboarding(@Req() req: AuthenticatedRequest, @Body() dto: UpdateOnboardingDto) {
    return this.companiesService.updateOnboarding(req.companyId, dto);
  }

  @Post('onboarding/complete')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CompanyGuard)
  completeOnboarding(@Req() req: AuthenticatedRequest) {
    return this.companiesService.completeOnboarding(req.companyId);
  }

  @Post('onboarding/test-email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CompanyGuard)
  async sendTestEmail(@Req() req: AuthenticatedRequest) {
    await inngest.send({
      name: 'load/email.received',
      data: {
        messageId: `onboarding-test-${Date.now()}`,
        companyId: req.companyId,
        fromEmail: 'dispatch@echogloballogistics.com',
        subject: 'Rate Confirmation - Chicago to Dallas',
        textBody:
          'Pickup: Chicago, IL on Monday. Delivery: Dallas, TX. Load type: Dry Van. Weight: 42000 lbs. Rate: $2450.',
        attachments: [],
      },
    });
    return { sent: true };
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
