import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedRequest, CompanyGuard } from '../common/guards/company.guard';
import { CreateLoadDto } from './dto/create-load.dto';
import { LoadsService } from './loads.service';

@Controller('loads')
@UseGuards(CompanyGuard)
export class LoadsController {
  constructor(private readonly loadsService: LoadsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateLoadDto, @Req() req: AuthenticatedRequest) {
    return this.loadsService.create(dto, req.companyId);
  }
}
