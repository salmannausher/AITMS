import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Postgres-backed cache service. No Redis required.
 *
 * Key conventions:
 *   'eia:diesel_price'                            TTL 86400  (24 h)
 *   'lane:{originState}:{destState}:{companyId}'  TTL 3600   (1 h)
 *   'company:{companyId}:settings'                TTL 300    (5 min)
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(private readonly prisma: PrismaService) {}

  async get<T>(key: string): Promise<T | null> {
    const row = await this.prisma.cache.findUnique({ where: { key } });

    if (!row || row.expires_at <= new Date()) {
      return null;
    }

    try {
      return JSON.parse(row.value) as T;
    } catch {
      this.logger.warn(`Cache parse error for key "${key}" — evicting`);
      await this.prisma.cache.deleteMany({ where: { key } });
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const expires_at = new Date(Date.now() + ttlSeconds * 1000);
    await this.prisma.cache.upsert({
      where: { key },
      create: { key, value: JSON.stringify(value), expires_at },
      update: { value: JSON.stringify(value), expires_at },
    });
  }

  async del(key: string): Promise<void> {
    await this.prisma.cache.deleteMany({ where: { key } });
  }
}
