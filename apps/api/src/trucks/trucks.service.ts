import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';

const TRUCK_INCLUDE = {
  driver: { select: { id: true, full_name: true, status: true } },
} as const;

@Injectable()
export class TrucksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, availableOnly?: boolean) {
    const where: Record<string, unknown> = { company_id: companyId, deleted_at: null };
    if (availableOnly) {
      where['driver'] = null;
      where['status'] = 'AVAILABLE';
    }
    return this.prisma.truck.findMany({
      where,
      include: TRUCK_INCLUDE,
      orderBy: { unit_number: 'asc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const truck = await this.prisma.truck.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
      include: TRUCK_INCLUDE,
    });
    if (!truck) throw new NotFoundException('Truck not found');
    return truck;
  }

  async create(dto: CreateTruckDto, companyId: string) {
    return this.prisma.truck.create({
      data: {
        company_id: companyId,
        unit_number: dto.unit_number,
        type: dto.type,
        year: dto.year ?? null,
        make: dto.make ?? null,
        model: dto.model ?? null,
        vin: dto.vin ?? null,
      },
      include: TRUCK_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateTruckDto, companyId: string) {
    const truck = await this.prisma.truck.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
    });
    if (!truck) throw new NotFoundException('Truck not found');
    return this.prisma.truck.update({
      where: { id },
      data: {
        ...(dto.unit_number !== undefined && { unit_number: dto.unit_number }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.year !== undefined && { year: dto.year }),
        ...(dto.make !== undefined && { make: dto.make }),
        ...(dto.model !== undefined && { model: dto.model }),
        ...(dto.vin !== undefined && { vin: dto.vin }),
      },
      include: TRUCK_INCLUDE,
    });
  }

  async softDelete(id: string, companyId: string) {
    const truck = await this.prisma.truck.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
    });
    if (!truck) throw new NotFoundException('Truck not found');
    return this.prisma.truck.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
