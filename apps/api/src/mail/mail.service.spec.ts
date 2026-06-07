import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';

const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

describe('MailService', () => {
  let service: MailService;
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('sendEmail', () => {
    it('does nothing when RESEND_API_KEY is not set', async () => {
      delete process.env.RESEND_API_KEY;

      await service.sendEmail('test@example.com', 'Subject', '<p>Hello</p>');

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('sends email when RESEND_API_KEY is set', async () => {
      process.env.RESEND_API_KEY = 're_test_key';
      mockSend.mockResolvedValueOnce({ id: 'email-123' });

      await service.sendEmail('dispatcher@acme.com', 'Alert', '<p>Load assigned</p>');

      expect(mockSend).toHaveBeenCalledWith({
        from: 'Devsphinx AI Dispatch <noreply@devsphinx.com>',
        to: 'dispatcher@acme.com',
        subject: 'Alert',
        html: '<p>Load assigned</p>',
      });
    });

    it('does not throw when Resend API returns an error', async () => {
      process.env.RESEND_API_KEY = 're_test_key';
      mockSend.mockRejectedValueOnce(new Error('Resend API error'));

      await expect(
        service.sendEmail('test@example.com', 'Subject', '<p>Hello</p>'),
      ).resolves.not.toThrow();
    });

    it('reuses the same Resend client across multiple calls', async () => {
      process.env.RESEND_API_KEY = 're_test_key';
      mockSend.mockResolvedValue({ id: 'email-id' });
      const { Resend } = require('resend');

      await service.sendEmail('a@example.com', 'S1', '<p>1</p>');
      await service.sendEmail('b@example.com', 'S2', '<p>2</p>');

      // Resend constructor called only once (lazy singleton)
      expect(Resend).toHaveBeenCalledTimes(1);
    });
  });
});
