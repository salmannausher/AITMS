import { NotFoundException } from '@nestjs/common';
import { LoadsService } from './loads.service';

// Minimal Prisma mock — only the methods LoadsService exercises
const makePrismaMock = () => ({
  load: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  driver: { count: jest.fn(), findFirst: jest.fn() },
  broker: { findFirst: jest.fn(), create: jest.fn() },
  loadEvent: { create: jest.fn() },
  $transaction: jest.fn(),
});

describe('LoadsService — cross-tenant isolation', () => {
  let service: LoadsService;
  let prisma: ReturnType<typeof makePrismaMock>;

  beforeEach(() => {
    prisma = makePrismaMock();
    service = new LoadsService(prisma as never);
  });

  it('throws NotFoundException when fetching another company\'s load by id', async () => {
    // findFirst returns null — the company_id in the WHERE clause excluded the row
    prisma.load.findFirst.mockResolvedValue(null);

    await expect(service.findOne('load-belonging-to-company-a', 'company-b')).rejects.toThrow(
      NotFoundException,
    );

    // Verify company_id was included in the query
    expect(prisma.load.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ company_id: 'company-b' }),
      }),
    );
  });

  it('returns the load when company_id matches', async () => {
    const mockLoad = {
      id: 'load-1',
      company_id: 'company-a',
      status: 'PENDING',
      origin_city: 'Chicago',
      origin_state: 'IL',
      dest_city: 'Dallas',
      dest_state: 'TX',
    };
    prisma.load.findFirst.mockResolvedValue(mockLoad);

    const result = await service.findOne('load-1', 'company-a');

    expect(result).toEqual(mockLoad);
    expect(prisma.load.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'load-1', company_id: 'company-a' }),
      }),
    );
  });

  it('throws NotFoundException when updating status for another company\'s load', async () => {
    prisma.load.findFirst.mockResolvedValue(null);

    await expect(
      service.updateStatus('load-belonging-to-company-a', 'company-b', 'user-1', 'ACCEPTED'),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.load.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ company_id: 'company-b' }),
      }),
    );
  });

  it('throws NotFoundException when assigning driver on another company\'s load', async () => {
    prisma.load.findFirst.mockResolvedValue(null);
    prisma.driver.findFirst.mockResolvedValue(null);

    await expect(
      service.assignDriver('load-x', 'company-b', 'user-1', 'driver-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when marking reviewed on another company\'s load', async () => {
    prisma.load.findFirst.mockResolvedValue(null);

    await expect(service.markReviewed('load-x', 'company-b', 'user-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
