import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CompanyGuard } from '../common/guards/company.guard';
import { LoadsController } from './loads.controller';
import { LoadsService } from './loads.service';

@Module({
  imports: [PrismaModule],
  controllers: [LoadsController],
  providers: [LoadsService, CompanyGuard],
})
export class LoadsModule {}
