import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheService } from './cache.service';

@Module({
  imports: [PrismaModule],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
