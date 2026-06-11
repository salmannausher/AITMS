import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LoadStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AuthenticatedRequest, CompanyGuard } from '../common/guards/company.guard';
import { CreateLoadDto } from './dto/create-load.dto';
import { LoadsService } from './loads.service';

class UpdateStatusDto {
  @IsEnum(LoadStatus)
  status!: LoadStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

@Controller('loads')
@UseGuards(CompanyGuard)
export class LoadsController {
  constructor(private readonly loadsService: LoadsService) {}

  // GET /loads/stats must be declared before GET /loads/:id to avoid NestJS
  // treating "stats" as a dynamic :id segment.
  @Get('stats')
  getStats(@Req() req: AuthenticatedRequest) {
    return this.loadsService.getStats(req.companyId);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query('status') status?: string) {
    return this.loadsService.findAll(req.companyId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.loadsService.findOne(id, req.companyId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.loadsService.updateStatus(
      id,
      req.companyId,
      req.userId,
      dto.status,
      dto.reason,
    );
  }

  @Patch(':id/reviewed')
  markReviewed(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.loadsService.markReviewed(id, req.companyId, req.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateLoadDto, @Req() req: AuthenticatedRequest) {
    return this.loadsService.create(dto, req.companyId);
  }
}
