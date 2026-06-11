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
import { AuthenticatedRequest, CompanyGuard } from '../common/guards/company.guard';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { TrucksService } from './trucks.service';

@Controller('trucks')
@UseGuards(CompanyGuard)
export class TrucksController {
  constructor(private readonly trucksService: TrucksService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query('available') available?: string) {
    return this.trucksService.findAll(req.companyId, available === 'true');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTruckDto, @Req() req: AuthenticatedRequest) {
    return this.trucksService.create(dto, req.companyId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTruckDto, @Req() req: AuthenticatedRequest) {
    return this.trucksService.update(id, dto, req.companyId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.trucksService.softDelete(id, req.companyId);
  }
}
