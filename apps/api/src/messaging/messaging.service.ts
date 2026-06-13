import { Injectable, Logger } from '@nestjs/common';
import twilio from 'twilio';
import { PrismaService } from '../prisma/prisma.service';
import { normalizePhone } from '../common/utils/phone.util';

type SendResult = { sid: string; channel: 'WHATSAPP' | 'SMS' };

interface MessageOpts {
  companyId: string;
  loadId?: string;
  driverId?: string;
}

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);
  private client: ReturnType<typeof twilio>;

  constructor(private readonly prisma: PrismaService) {
    const sid = process.env['TWILIO_ACCOUNT_SID'];
    const token = process.env['TWILIO_AUTH_TOKEN'];
    if (!sid || !token) {
      this.logger.warn('TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set — messaging is disabled');
    }
    // Lazy-safe: twilio() returns a client but won't fail until first API call
    this.client = twilio(sid ?? 'AC_PLACEHOLDER', token ?? 'placeholder');
  }

  async sendWhatsApp(to: string, body: string, opts: MessageOpts): Promise<SendResult> {
    const normalizedTo = normalizePhone(to);
    const from = process.env['TWILIO_WHATSAPP_FROM']; // e.g. 'whatsapp:+14155238886'

    if (!from) {
      this.logger.warn('TWILIO_WHATSAPP_FROM not set — falling back to SMS');
      return this.sendSMS(normalizedTo, body, opts);
    }

    try {
      const result = await this.client.messages.create({
        from,
        to: `whatsapp:${normalizedTo}`,
        body,
      });

      await this.saveMessage({
        ...opts,
        direction: 'OUTBOUND',
        channel: 'WHATSAPP',
        external_id: result.sid,
        from_number: from,
        to_number: normalizedTo,
        body,
      });

      this.logger.log(`WhatsApp sent to ${normalizedTo} — sid: ${result.sid}`);
      return { sid: result.sid, channel: 'WHATSAPP' };
    } catch (err) {
      this.logger.warn(
        `WhatsApp send failed for ${normalizedTo}, falling back to SMS: ${String(err)}`,
      );
      return this.sendSMS(normalizedTo, body, opts);
    }
  }

  async sendSMS(to: string, body: string, opts: MessageOpts): Promise<SendResult> {
    const normalizedTo = normalizePhone(to);
    const from = process.env['TWILIO_SMS_FROM'];

    if (!from) {
      throw new Error('TWILIO_SMS_FROM not set — cannot send SMS fallback');
    }

    const result = await this.client.messages.create({ from, to: normalizedTo, body });

    await this.saveMessage({
      ...opts,
      direction: 'OUTBOUND',
      channel: 'SMS',
      external_id: result.sid,
      from_number: from,
      to_number: normalizedTo,
      body,
    });

    this.logger.log(`SMS sent to ${normalizedTo} — sid: ${result.sid}`);
    return { sid: result.sid, channel: 'SMS' };
  }

  private async saveMessage(data: {
    companyId: string;
    loadId?: string;
    driverId?: string;
    direction: 'INBOUND' | 'OUTBOUND';
    channel: 'WHATSAPP' | 'SMS' | 'EMAIL';
    external_id?: string;
    from_number?: string;
    to_number?: string;
    wa_id?: string;
    body: string;
    status?: string;
  }) {
    return this.prisma.message.create({
      data: {
        company_id: data.companyId,
        load_id: data.loadId ?? null,
        driver_id: data.driverId ?? null,
        direction: data.direction,
        channel: data.channel,
        external_id: data.external_id ?? null,
        from_number: data.from_number ?? null,
        to_number: data.to_number ?? null,
        wa_id: data.wa_id ?? null,
        body: data.body,
        status: data.status ?? null,
      },
    });
  }
}
