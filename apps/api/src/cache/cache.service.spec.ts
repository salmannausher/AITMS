import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  cache: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const FUTURE = new Date(Date.now() + 60_000);  // 60s from now
const PAST   = new Date(Date.now() - 1_000);   // 1s ago

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  // ── get ────────────────────────────────────────────────────────────────────

  describe('get', () => {
    it('returns parsed value when key exists and is not expired', async () => {
      mockPrisma.cache.findUnique.mockResolvedValue({
        key: 'test',
        value: JSON.stringify({ price: 3.85 }),
        expires_at: FUTURE,
      });

      const result = await service.get<{ price: number }>('test');

      expect(result).toEqual({ price: 3.85 });
    });

    it('returns null when key does not exist', async () => {
      mockPrisma.cache.findUnique.mockResolvedValue(null);

      const result = await service.get('missing');

      expect(result).toBeNull();
    });

    it('returns null when row is expired', async () => {
      mockPrisma.cache.findUnique.mockResolvedValue({
        key: 'test',
        value: JSON.stringify({ price: 3.85 }),
        expires_at: PAST,
      });

      const result = await service.get('test');

      expect(result).toBeNull();
    });

    it('evicts the row and returns null on JSON parse error', async () => {
      mockPrisma.cache.findUnique.mockResolvedValue({
        key: 'bad',
        value: 'not-valid-json',
        expires_at: FUTURE,
      });
      mockPrisma.cache.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.get('bad');

      expect(result).toBeNull();
      expect(mockPrisma.cache.deleteMany).toHaveBeenCalledWith({
        where: { key: 'bad' },
      });
    });
  });

  // ── set ────────────────────────────────────────────────────────────────────

  describe('set', () => {
    it('upserts with JSON-serialised value and correct expires_at', async () => {
      mockPrisma.cache.upsert.mockResolvedValue(undefined);
      const before = Date.now();

      await service.set('eia:diesel_price', { price: 3.85 }, 86400);

      expect(mockPrisma.cache.upsert).toHaveBeenCalledTimes(1);
      const call = mockPrisma.cache.upsert.mock.calls[0][0];

      expect(call.where).toEqual({ key: 'eia:diesel_price' });
      expect(call.create.value).toBe(JSON.stringify({ price: 3.85 }));
      expect(call.update.value).toBe(JSON.stringify({ price: 3.85 }));

      // expires_at should be ~86400s in the future (allow 2s of test jitter)
      const expectedMs = before + 86400 * 1000;
      expect(call.create.expires_at.getTime()).toBeGreaterThanOrEqual(expectedMs - 2000);
      expect(call.create.expires_at.getTime()).toBeLessThanOrEqual(expectedMs + 2000);
    });
  });

  // ── del ────────────────────────────────────────────────────────────────────

  describe('del', () => {
    it('calls deleteMany with the given key', async () => {
      mockPrisma.cache.deleteMany.mockResolvedValue({ count: 1 });

      await service.del('company:abc:settings');

      expect(mockPrisma.cache.deleteMany).toHaveBeenCalledWith({
        where: { key: 'company:abc:settings' },
      });
    });

    it('does not throw when key does not exist (deleteMany is safe)', async () => {
      mockPrisma.cache.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.del('nonexistent')).resolves.not.toThrow();
    });
  });
});
