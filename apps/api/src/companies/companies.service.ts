import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { OnboardCompanyDto } from './dto/onboard-company.dto';
import { UpdateCostSettingsDto } from './dto/update-cost-settings.dto';

@Injectable()
export class CompaniesService {
  private readonly supabaseAdmin: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly cache: CacheService,
  ) {
    // Instantiate after ConfigModule has resolved env vars
    this.supabaseAdmin = createClient(
      this.config.getOrThrow<string>('SUPABASE_URL'),
      this.config.getOrThrow<string>('SUPABASE_SERVICE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }

  async onboard(dto: OnboardCompanyDto) {
    // Create Company + User in a single transaction
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const company = await tx.company.create({
        data: { name: dto.company_name },
      });

      const user = await tx.user.create({
        data: {
          id: dto.auth_user_id, // align Prisma user id with Supabase auth uid
          company_id: company.id,
          email: dto.email,
          full_name: dto.full_name,
          role: 'OWNER',
        },
      });

      return { company, user };
    });

    // Stamp JWT custom claims so the frontend can read company_id + role
    const { error } = await this.supabaseAdmin.auth.admin.updateUserById(
      dto.auth_user_id,
      {
        app_metadata: {
          company_id: result.company.id,
          role: result.user.role,
        },
      },
    );

    if (error) {
      throw new InternalServerErrorException(
        'Company created but failed to set JWT claims: ' + error.message,
      );
    }

    return {
      company_id: result.company.id,
      role: result.user.role,
    };
  }

  async getSettings(companyId: string) {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: { settings: true },
    });
    const settings = company.settings as Record<string, unknown>;
    return { costs: (settings['costs'] as UpdateCostSettingsDto | undefined) ?? null };
  }

  async updateCostSettings(companyId: string, dto: UpdateCostSettingsDto) {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: { settings: true },
    });

    const existing = (company.settings as Record<string, unknown>) ?? {};
    const merged: Record<string, unknown> = { ...existing, costs: dto };

    await this.prisma.company.update({
      where: { id: companyId },
      data: { settings: merged as Prisma.InputJsonValue },
    });

    await this.cache.del(`company:${companyId}:settings`);

    return { costs: dto };
  }
}
