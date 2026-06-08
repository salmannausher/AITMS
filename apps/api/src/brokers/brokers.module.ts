import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BrokersController } from './brokers.controller';
import { BrokersService } from './brokers.service';
import { CompanyGuard } from '../common/guards/company.guard';

@Module({
  imports: [PrismaModule],
  controllers: [BrokersController],
  providers: [BrokersService, CompanyGuard],
})
export class BrokersModule {}
