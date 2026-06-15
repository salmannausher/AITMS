import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../prisma/prisma.service';
import { inngest } from '../inngest/inngest.client';

// Mock inngest.send so we don't hit the real Inngest
jest.mock('../inngest/inngest.client', () => ({
  inngest: { send: jest.fn().mockResolvedValue(undefined) },
}));

const mockPrisma = {
  company: { findFirst: jest.fn() },
  broker: { findFirst: jest.fn(), create: jest.fn() },
  message: { create: jest.fn() },
};

const baseDto = {
  from: 'broker@echogloballogistics.com',
  to: 'info@devsphinx.dev',
  subject: 'Load Tender',
  text: 'Chicago to Dallas $2450',
  html: undefined,
  attachments: [],
};

const mockCompany = { id: 'company-1', name: 'Acme Trucking' };
const mockBroker = { id: 'broker-1', email_domains: ['echogloballogistics.com'] };
const mockMessage = { id: 'msg-1', company_id: 'company-1' };

describe('WebhooksService', () => {
  let service: WebhooksService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  describe('handleInboundEmail', () => {
    it('returns { ok: true } and does nothing when company not found', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(null);

      const result = await service.handleInboundEmail(baseDto);

      expect(result).toEqual({ ok: true });
      expect(mockPrisma.broker.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.message.create).not.toHaveBeenCalled();
      expect(inngest.send).not.toHaveBeenCalled();
    });

    it('creates broker when not found and fires Inngest event', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(mockCompany);
      mockPrisma.broker.findFirst.mockResolvedValue(null);
      mockPrisma.broker.create.mockResolvedValue(mockBroker);
      mockPrisma.message.create.mockResolvedValue(mockMessage);

      const result = await service.handleInboundEmail(baseDto);

      expect(result).toEqual({ ok: true });
      expect(mockPrisma.broker.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          company_id: 'company-1',
          email_domains: ['echogloballogistics.com'],
        }),
      });
      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          direction: 'INBOUND',
          channel: 'EMAIL',
          from_number: baseDto.from,
          to_number: baseDto.to,
        }),
      });
      expect(inngest.send).toHaveBeenCalledWith({
        name: 'load/email.received',
        data: expect.objectContaining({
          messageId: 'msg-1',
          companyId: 'company-1',
          fromEmail: baseDto.from,
          subject: baseDto.subject,
        }),
      });
    });

    it('reuses existing broker when domain already exists', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(mockCompany);
      mockPrisma.broker.findFirst.mockResolvedValue(mockBroker);
      mockPrisma.message.create.mockResolvedValue(mockMessage);

      await service.handleInboundEmail(baseDto);

      expect(mockPrisma.broker.create).not.toHaveBeenCalled();
    });

    it('uses empty string for body when text is undefined', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(mockCompany);
      mockPrisma.broker.findFirst.mockResolvedValue(mockBroker);
      mockPrisma.message.create.mockResolvedValue(mockMessage);

      await service.handleInboundEmail({ ...baseDto, text: undefined });

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ body: '' }),
      });
    });

    it('extracts sender domain correctly', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(mockCompany);
      mockPrisma.broker.findFirst.mockResolvedValue(null);
      mockPrisma.broker.create.mockResolvedValue(mockBroker);
      mockPrisma.message.create.mockResolvedValue(mockMessage);

      await service.handleInboundEmail({
        ...baseDto,
        from: 'ops@coyotemoves.com',
      });

      expect(mockPrisma.broker.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          email_domains: { has: 'coyotemoves.com' },
        }),
      });
    });
  });
});
