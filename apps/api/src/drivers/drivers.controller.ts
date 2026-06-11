import {
  Body,
  Controller,
  Delete,
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
import { DriverStatus } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { AuthenticatedRequest, CompanyGuard } from '../common/guards/company.guard';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriversService } from './drivers.service';

class UpdateStatusDto {
  @IsEnum(DriverStatus)
  status!: DriverStatus;
}

class UpdateHosDto {
  @IsNumber()
  @Min(0)
  @Max(70)
  hos_remaining_hours!: number;

  @IsOptional()
  @IsString()
  hos_reset_at?: string;
}

@Controller('drivers')
@UseGuards(CompanyGuard)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query('status') status?: string) {
    return this.driversService.findAll(req.companyId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.driversService.findOne(id, req.companyId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateDriverDto, @Req() req: AuthenticatedRequest) {
    return this.driversService.create(dto, req.companyId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDriverDto, @Req() req: AuthenticatedRequest) {
    return this.driversService.update(id, dto, req.companyId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.driversService.softDelete(id, req.companyId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.driversService.updateStatus(id, req.companyId, dto.status);
  }

  @Patch(':id/hos')
  updateHos(@Param('id') id: string, @Body() dto: UpdateHosDto, @Req() req: AuthenticatedRequest) {
    return this.driversService.updateHos(
      id,
      req.companyId,
      dto.hos_remaining_hours,
      dto.hos_reset_at,
    );
  }
}
