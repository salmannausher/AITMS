import { Injectable, NotFoundException } from '@nestjs/common';
import { DriverStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

const DRIVER_INCLUDE = {
  truck: { select: { id: true, unit_number: true, type: true, status: true } },
} as const;

const DRIVER_DETAIL_INCLUDE = {
  truck: { select: { id: true, unit_number: true, type: true, status: true } },
  assigned_loads: {
    where: { deleted_at: null },
    orderBy: { pickup_date: 'asc' as const },
    take: 5,
    select: {
      id: true,
      status: true,
      origin_city: true,
      origin_state: true,
      dest_city: true,
      dest_state: true,
      pickup_date: true,
      rate: true,
    },
  },
} as const;

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, status?: string) {
    const where: Record<string, unknown> = { company_id: companyId, deleted_at: null };
    if (status) where['status'] = status;
    return this.prisma.driver.findMany({
      where,
      include: DRIVER_INCLUDE,
      orderBy: { full_name: 'asc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
      include: DRIVER_DETAIL_INCLUDE,
    });
    if (!driver) throw new NotFoundException('Driver not found');
    return driver;
  }

  async create(dto: CreateDriverDto, companyId: string) {
    return this.prisma.driver.create({
      data: {
        company_id: companyId,
        full_name: dto.full_name,
        phone: dto.phone,
        whatsapp_phone: dto.whatsapp_phone ?? null,
        cdl_class: dto.cdl_class,
        endorsements: dto.endorsements ?? [],
        home_city: dto.home_city,
        home_state: dto.home_state.toUpperCase(),
        hos_remaining_hours: dto.hos_remaining_hours ?? 70,
        hos_reset_at: dto.hos_reset_at ? new Date(dto.hos_reset_at) : null,
        status: dto.status ?? 'AVAILABLE',
        assigned_truck_id: dto.assigned_truck_id ?? null,
      },
      include: DRIVER_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateDriverDto, companyId: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
    });
    if (!driver) throw new NotFoundException('Driver not found');

    const prevTruckId = driver.assigned_truck_id;
    const newTruckId = dto.assigned_truck_id !== undefined ? dto.assigned_truck_id : prevTruckId;

    return this.prisma.$transaction(async (tx) => {
      // If truck assignment changed, update truck statuses
      if (newTruckId !== prevTruckId) {
        if (prevTruckId) {
          await tx.truck.update({ where: { id: prevTruckId }, data: { status: 'AVAILABLE' } });
        }
        if (newTruckId) {
          await tx.truck.update({ where: { id: newTruckId }, data: { status: 'IN_USE' } });
        }
      }

      return tx.driver.update({
        where: { id },
        data: {
          ...(dto.full_name !== undefined && { full_name: dto.full_name }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.whatsapp_phone !== undefined && { whatsapp_phone: dto.whatsapp_phone }),
          ...(dto.cdl_class !== undefined && { cdl_class: dto.cdl_class }),
          ...(dto.endorsements !== undefined && { endorsements: dto.endorsements }),
          ...(dto.home_city !== undefined && { home_city: dto.home_city }),
          ...(dto.home_state !== undefined && { home_state: dto.home_state.toUpperCase() }),
          ...(dto.hos_remaining_hours !== undefined && {
            hos_remaining_hours: dto.hos_remaining_hours,
          }),
          ...(dto.hos_reset_at !== undefined && {
            hos_reset_at: dto.hos_reset_at ? new Date(dto.hos_reset_at) : null,
          }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.assigned_truck_id !== undefined && { assigned_truck_id: dto.assigned_truck_id }),
        },
        include: DRIVER_INCLUDE,
      });
    });
  }

  async softDelete(id: string, companyId: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
    });
    if (!driver) throw new NotFoundException('Driver not found');
    return this.prisma.driver.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async updateStatus(id: string, companyId: string, status: DriverStatus) {
    const driver = await this.prisma.driver.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
    });
    if (!driver) throw new NotFoundException('Driver not found');
    return this.prisma.driver.update({
      where: { id },
      data: { status },
      include: DRIVER_INCLUDE,
    });
  }

  async updateHos(
    id: string,
    companyId: string,
    hos_remaining_hours: number,
    hos_reset_at?: string,
  ) {
    const driver = await this.prisma.driver.findFirst({
      where: { id, company_id: companyId, deleted_at: null },
    });
    if (!driver) throw new NotFoundException('Driver not found');
    return this.prisma.driver.update({
      where: { id },
      data: {
        hos_remaining_hours,
        ...(hos_reset_at !== undefined && { hos_reset_at: new Date(hos_reset_at) }),
      },
      include: DRIVER_INCLUDE,
    });
  }
}
