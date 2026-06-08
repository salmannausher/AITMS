import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BrokersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(companyId: string) {
    return this.prisma.broker.findMany({
      where: { company_id: companyId, blacklisted: false },
      select: { id: true, name: true, mc_number: true, email_domains: true },
      orderBy: { name: 'asc' },
    });
  }
}
