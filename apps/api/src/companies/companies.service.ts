import { randomBytes } from 'crypto';
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { OnboardCompanyDto } from './dto/onboard-company.dto';
import { UpdateCostSettingsDto } from './dto/update-cost-settings.dto';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';

@Injectable()
export class CompaniesService {
  private readonly supabaseAdmin: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly cache: CacheService,
  ) {
    this.supabaseAdmin = createClient(
      this.config.getOrThrow<string>('SUPABASE_URL'),
      this.config.getOrThrow<string>('SUPABASE_SERVICE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }

  /**
   * Build the carrier's dedicated dispatch inbox address. The Cloudflare Email
   * Worker is a catch-all for the whole domain, so any new local-part routes to
   * POST /webhooks/email — provisioning is just this DB write, no DNS setup.
   * Format: <name-slug>-<short-suffix>@<domain>, e.g. acme-trucking-k3f9@devshinx.dev
   */
  private buildInboundEmail(companyName: string): string {
    const domain = this.config.get<string>('INBOUND_EMAIL_DOMAIN') ?? 'devshinx.dev';
    const slug =
      companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 24) || 'carrier';
    const suffix = randomBytes(3).toString('hex'); // 6 hex chars — collision-safe vs @unique
    return `${slug}-${suffix}@${domain}`;
  }

  async onboard(dto: OnboardCompanyDto) {
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const company = await tx.company.create({
        data: { name: dto.company_name, inbound_email: this.buildInboundEmail(dto.company_name) },
      });

      const user = await tx.user.create({
        data: {
          id: dto.auth_user_id,
          company_id: company.id,
          email: dto.email,
          full_name: dto.full_name,
          role: 'OWNER',
        },
      });

      return { company, user };
    });

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

  async getMe(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        mc_number: true,
        dot_number: true,
        inbound_email: true,
        onboarding_complete: true,
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async updateOnboarding(companyId: string, dto: UpdateOnboardingDto) {
    const company = await this.prisma.company.findUniqueOrThrow({ where: { id: companyId }, select: { address: true } });
    const existingAddress = (company.address as Record<string, unknown>) ?? {};

    const addressPatch: Record<string, unknown> = { ...existingAddress };
    if (dto.city !== undefined) addressPatch['city'] = dto.city;
    if (dto.state !== undefined) addressPatch['state'] = dto.state;

    return this.prisma.company.update({
      where: { id: companyId },
      data: {
        ...(dto.mc_number !== undefined && { mc_number: dto.mc_number }),
        ...(dto.dot_number !== undefined && { dot_number: dto.dot_number }),
        address: addressPatch as Prisma.InputJsonValue,
      },
      select: { id: true, mc_number: true, dot_number: true, address: true },
    });
  }

  async completeOnboarding(companyId: string) {
    return this.prisma.company.update({
      where: { id: companyId },
      data: { onboarding_complete: true },
      select: { id: true, onboarding_complete: true },
    });
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
