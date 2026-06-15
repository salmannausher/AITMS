import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { LoadStatus } from '@prisma/client';
import { inngest } from '../inngest/inngest.client';
import { PrismaService } from '../prisma/prisma.service';
import { AssignLoadDto } from './dto/assign-load.dto';
import { CreateLoadDto } from './dto/create-load.dto';

const LOAD_DETAIL_INCLUDE = {
  broker: { select: { id: true, name: true } },
  assigned_driver: { select: { id: true, full_name: true } },
  assigned_truck: { select: { id: true, unit_number: true } },
  events: {
    orderBy: { created_at: 'desc' as const },
  },
  messages: {
    orderBy: { created_at: 'asc' as const },
  },
} as const;

const ALLOWED_TRANSITIONS: Partial<Record<LoadStatus, LoadStatus[]>> = {
  PENDING: ['SCORED', 'CANCELLED'],
  SCORED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['CANCELLED'],
  ASSIGNED: ['AT_PICKUP'],
  AT_PICKUP: ['LOADED'],
  LOADED: ['EN_ROUTE'],
  EN_ROUTE: ['DELIVERED'],
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
  private readonly logger = new Logger(LoadsService.name);

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
    const rpm = dto.rate && miles > 0 ? Number((dto.rate / miles).toFixed(3)) : null;

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

    const [total_active, needs_assignment, drivers_available, acceptedToday] = await Promise.all([
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
    podUrl?: string,
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
      const loadData: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'DELIVERED' && podUrl) {
        loadData['pod_document_url'] = podUrl;
      }
      await tx.load.update({ where: { id }, data: loadData });

      const isLegacyTransition =
        newStatus === 'ACCEPTED' || newStatus === 'CANCELLED' || newStatus === 'SCORED';

      await tx.loadEvent.create({
        data: {
          load_id: id,
          company_id: companyId,
          event_type: isLegacyTransition ? 'STATUS_CHANGE' : newStatus,
          from_status: load.status,
          to_status: newStatus,
          actor_type: 'USER',
          actor_id: userId,
          metadata:
            newStatus === 'CANCELLED'
              ? { reason: reason ?? 'No reason given' }
              : newStatus === 'DELIVERED'
                ? { pod_url: podUrl ?? null }
                : {},
        },
      });
    });

    if (newStatus === 'ACCEPTED') {
      await inngest.send({ name: 'load/accepted', data: { loadId: id, companyId } });
    }

    if (newStatus === 'DELIVERED') {
      void inngest.send({
        name: 'load/delivered',
        data: { loadId: id, companyId, pod_url: podUrl ?? null },
      });
    }

    return this.findOne(id, companyId);
  }

  async assignLoad(id: string, dto: AssignLoadDto, companyId: string, userId: string) {
    // Pre-flight: load
    const load = await this.prisma.load.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
    });
    if (!load) throw new NotFoundException('Load not found');
    if (load.status !== 'ACCEPTED') {
      throw new ConflictException('Load must be in ACCEPTED status to assign a driver');
    }

    // Pre-flight: driver
    const driver = await this.prisma.driver.findFirst({
      where: { id: dto.driver_id, company_id: companyId, deleted_at: null },
    });
    if (!driver || driver.status !== 'AVAILABLE') {
      throw new ConflictException('Driver is not available');
    }
    if (driver.hos_remaining_hours <= 0) {
      throw new ConflictException('Driver has insufficient HOS hours');
    }

    // Pre-flight: truck
    const truck = await this.prisma.truck.findFirst({
      where: { id: dto.truck_id, company_id: companyId, deleted_at: null },
    });
    if (!truck || truck.status === 'OUT_OF_SERVICE') {
      throw new ConflictException('Truck is not available for assignment');
    }

    // Warn if dispatcher overrode the AI-recommended truck
    if (driver.assigned_truck_id && dto.truck_id !== driver.assigned_truck_id) {
      this.logger.warn(
        `Dispatcher overriding truck for driver ${dto.driver_id}: ` +
          `expected ${driver.assigned_truck_id}, got ${dto.truck_id}`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.load.update({
        where: { id },
        data: {
          assigned_driver_id: dto.driver_id,
          assigned_truck_id: dto.truck_id,
          assigned_by_user_id: userId,
          assigned_at: new Date(),
          status: 'ASSIGNED',
        },
      }),
      this.prisma.driver.update({
        where: { id: dto.driver_id },
        data: { status: 'ON_LOAD' },
      }),
      this.prisma.truck.update({
        where: { id: dto.truck_id },
        data: { status: 'IN_USE' },
      }),
      this.prisma.loadEvent.create({
        data: {
          load_id: id,
          company_id: companyId,
          event_type: 'ASSIGNED',
          actor_type: 'USER',
          actor_id: userId,
          actor_name: null,
          metadata: { driver_id: dto.driver_id, truck_id: dto.truck_id },
        },
      }),
    ]);

    await inngest.send({
      name: 'load/assigned',
      data: {
        loadId: id,
        companyId,
        driverId: dto.driver_id,
        truckId: dto.truck_id,
        assignedByUserId: userId,
      },
    });

    return this.findOne(id, companyId);
  }

  async assignDriver(id: string, companyId: string, userId: string, driverId: string) {
    const [load, driver] = await Promise.all([
      this.prisma.load.findFirst({ where: { id, company_id: companyId, deleted_at: null } }),
      this.prisma.driver.findFirst({ where: { id: driverId, company_id: companyId } }),
    ]);
    if (!load) throw new NotFoundException('Load not found');
    if (!driver) throw new NotFoundException('Driver not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.load.update({
        where: { id },
        data: { assigned_driver_id: driverId, assigned_truck_id: driver.assigned_truck_id, status: 'ASSIGNED' },
      });
      await tx.loadEvent.create({
        data: {
          load_id: id,
          event_type: 'ASSIGNED',
          from_status: load.status,
          to_status: 'ASSIGNED',
          actor_type: 'user',
          actor_id: userId,
          metadata: { driver_name: driver.full_name },
        },
      });
    });

    await inngest.send({
      name: 'load/assigned',
      data: {
        loadId: id,
        companyId,
        driverId,
        truckId: driver.assigned_truck_id ?? '',
        assignedByUserId: userId,
      },
    });

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

    return this.prisma.load.findFirst({ where: { id, company_id: companyId }, select: { id: true, needs_review: true } });
  }
}
