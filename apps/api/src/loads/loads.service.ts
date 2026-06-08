import { BadRequestException, Injectable } from '@nestjs/common';
import { inngest } from '../inngest/inngest.client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoadDto } from './dto/create-load.dto';

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
}
