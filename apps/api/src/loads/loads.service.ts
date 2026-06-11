import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { LoadStatus } from '@prisma/client';
import { inngest } from '../inngest/inngest.client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoadDto } from './dto/create-load.dto';

const LOAD_DETAIL_INCLUDE = {
  broker: { select: { id: true, name: true } },
  assigned_driver: { select: { id: true, full_name: true } },
  assigned_truck: { select: { id: true, truck_number: true } },
  events: {
    orderBy: { created_at: 'asc' as const },
  },
  messages: {
    orderBy: { created_at: 'asc' as const },
  },
} as const;

const ALLOWED_TRANSITIONS: Partial<Record<LoadStatus, LoadStatus[]>> = {
  SCORED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['CANCELLED'],
};

const ACTIVE_EXCLUDE: LoadStatus[] = ['CANCELLED', 'PAID', 'INVOICED'];

export interface LoadStats {
  total_active: number;
  needs_assignment: number;
  drivers_available: number;
  todays_avg_rpm: number | null;
}

@Injectable()
export class LoadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLoadDto, companyId: string) {
    // 1. Resolve broker_id
    let brokerId: string | null = null;

    if (dto.broker_id) {
      const broker = await this.prisma.broker.findFirst({
        where: { id: dto.broker_id, company_id: companyId },
      });
      if (!broker) throw new BadRequestException('Broker not found');
      brokerId = broker.id;
    } else if (dto.broker_name?.trim()) {
      const existing = await this.prisma.broker.findFirst({
        where: { company_id: companyId, name: dto.broker_name.trim() },
      });
      brokerId = existing
        ? existing.id
        : (
            await this.prisma.broker.create({
              data: {
                company_id: companyId,
                name: dto.broker_name.trim(),
                email_domains: [],
              },
            })
          ).id;
    }

    // 2. Calculate RPM
    const miles = dto.estimated_miles ?? 0;
    const rpm =
      dto.rate && miles > 0
        ? Number((dto.rate / miles).toFixed(3))
        : null;

    // 3. Create Load
    const load = await this.prisma.load.create({
      data: {
        company_id: companyId,
        broker_id: brokerId,
        origin_city: dto.origin_city,
        origin_state: dto.origin_state.toUpperCase(),
        dest_city: dto.dest_city,
        dest_state: dto.dest_state.toUpperCase(),
        pickup_date: new Date(dto.pickup_date),
        delivery_date: dto.delivery_date ? new Date(dto.delivery_date) : null,
        load_type: dto.load_type ?? null,
        weight: dto.weight ?? null,
        commodity: dto.commodity ?? null,
        reference_number: dto.reference_number ?? null,
        rate: dto.rate ?? null,
        rpm,
        estimated_miles: dto.estimated_miles ?? null,
        status: 'PENDING',
        source: 'MANUAL',
        needs_review: false,
      },
    });

    // 4. Trigger AI scoring
    await inngest.send({
      name: 'load/created',
      data: { loadId: load.id, companyId },
    });

    return load;
  }

  async findAll(companyId: string, statusFilter?: string) {
    const where =
      statusFilter === 'ACTIVE'
        ? { company_id: companyId, status: { notIn: ACTIVE_EXCLUDE }, deleted_at: null }
        : { company_id: companyId, deleted_at: null };

    return this.prisma.load.findMany({
      where,
      orderBy: { pickup_date: 'asc' },
      include: {
        broker: { select: { id: true, name: true } },
        assigned_driver: { select: { id: true, full_name: true } },
      },
    });
  }

  async getStats(companyId: string): Promise<LoadStats> {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const [total_active, needs_assignment, drivers_available, acceptedToday] =
      await Promise.all([
        this.prisma.load.count({
          where: { company_id: companyId, status: { notIn: ACTIVE_EXCLUDE }, deleted_at: null },
        }),
        this.prisma.load.count({
          where: {
            company_id: companyId,
            status: { in: ['SCORED', 'ACCEPTED'] },
            assigned_driver_id: null,
            deleted_at: null,
          },
        }),
        this.prisma.driver.count({
          where: { company_id: companyId, status: 'AVAILABLE' },
        }),
        this.prisma.load.findMany({
          where: {
            company_id: companyId,
            status: 'ACCEPTED',
            created_at: { gte: todayStart },
            rate: { not: null },
            estimated_miles: { not: null, gt: 0 },
          },
          select: { rate: true, estimated_miles: true },
        }),
      ]);

    let todays_avg_rpm: number | null = null;
    if (acceptedToday.length > 0) {
      const rpms = acceptedToday
        .map((l) => {
          const miles = l.estimated_miles ?? 0;
          const rate = l.rate ? Number(l.rate) : null;
          return rate && miles > 0 ? rate / miles : null;
        })
        .filter((v): v is number => v !== null);
      todays_avg_rpm =
        rpms.length > 0
          ? Math.round((rpms.reduce((a, b) => a + b, 0) / rpms.length) * 100) / 100
          : null;
    }

    return { total_active, needs_assignment, drivers_available, todays_avg_rpm };
  }

  async findOne(id: string, companyId: string) {
    const load = await this.prisma.load.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
      include: LOAD_DETAIL_INCLUDE,
    });
    if (!load) throw new NotFoundException('Load not found');
    return load;
  }

  async updateStatus(
    id: string,
    companyId: string,
    userId: string,
    newStatus: LoadStatus,
    reason?: string,
  ) {
    const load = await this.prisma.load.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
    });
    if (!load) throw new NotFoundException('Load not found');

    const allowed = ALLOWED_TRANSITIONS[load.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new UnprocessableEntityException(
        `Cannot transition from ${load.status} to ${newStatus}`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.load.update({ where: { id }, data: { status: newStatus } });

      await tx.loadEvent.create({
        data: {
          load_id: id,
          event_type: 'STATUS_CHANGE',
          from_status: load.status,
          to_status: newStatus,
          actor_type: 'user',
          actor_id: userId,
          metadata:
            newStatus === 'CANCELLED'
              ? { reason: reason ?? 'No reason given' }
              : {},
        },
      });
    });

    if (newStatus === 'ACCEPTED') {
      await inngest.send({ name: 'load/accepted', data: { loadId: id, companyId } });
    }

    return this.findOne(id, companyId);
  }

  async markReviewed(id: string, companyId: string, userId: string) {
    const load = await this.prisma.load.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
    });
    if (!load) throw new NotFoundException('Load not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.load.update({ where: { id }, data: { needs_review: false } });
      await tx.loadEvent.create({
        data: {
          load_id: id,
          event_type: 'NOTE',
          actor_type: 'user',
          actor_id: userId,
          metadata: { text: 'Marked as reviewed' },
        },
      });
    });

    return this.prisma.load.findUnique({ where: { id }, select: { id: true, needs_review: true } });
  }
}
