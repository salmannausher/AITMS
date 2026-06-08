import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, CompanyGuard } from '../common/guards/company.guard';
import { BrokersService } from './brokers.service';

@Controller('brokers')
@UseGuards(CompanyGuard)
export class BrokersController {
  constructor(private readonly brokersService: BrokersService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.brokersService.findAll(req.companyId);
  }
}
