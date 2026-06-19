import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { RawBodyRequest } from '@nestjs/common';
import twilio from 'twilio';
import { PrismaService } from '../prisma/prisma.service';
import { inngest } from '../inngest/inngest.client';
import { WebhookEmailDto } from './webhook-email.dto';
import { normalizePhone } from '../common/utils/phone.util';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleInboundEmail(dto: WebhookEmailDto): Promise<{ ok: boolean }> {
    const { from, to, subject, text, html, attachments } = dto;

    const company = await this.prisma.company.findFirst({
      where: { inbound_email: to, deleted_at: null },
    });

    if (!company) {
      this.logger.log(`Unknown inbound address: ${to}`);
      return { ok: true };
    }

    const senderDomain = from.split('@')[1] ?? from;

    let broker = await this.prisma.broker.findFirst({
      where: {
        company_id: company.id,
        email_domains: { has: senderDomain },
      },
    });

    if (!broker) {
      broker = await this.prisma.broker.create({
        data: {
          company_id: company.id,
          name: senderDomain,
          email_domains: [senderDomain],
        },
      });
    }

    const message = await this.prisma.message.create({
      data: {
        company_id: company.id,
        direction: 'INBOUND',
        channel: 'EMAIL',
        from_number: from,
        to_number: to,
        body: text ?? '',
        status: 'RECEIVED',
      },
    });

    await inngest.send({
      name: 'load/email.received',
      data: {
        messageId: message.id,
        companyId: company.id,
        fromEmail: from,
        subject,
        textBody: text,
        htmlBody: html,
        attachments: attachments ?? [],
      },
    });

    return { ok: true };
  }

  // ---------------------------------------------------------------------------
  // Twilio inbound webhook
  // ---------------------------------------------------------------------------

  validateTwilioSignature(req: RawBodyRequest<Request>): boolean {
    const signature = req.headers['x-twilio-signature'] as string | undefined;
    if (!signature) return false;

    const authToken = process.env['TWILIO_AUTH_TOKEN'];
    const baseUrl = process.env['API_BASE_URL'];
    if (!authToken || !baseUrl) {
      this.logger.error(
        'TWILIO_AUTH_TOKEN or API_BASE_URL not set — rejecting Twilio request (fail closed)',
      );
      return false;
    }

    const url = `${baseUrl}/webhooks/twilio`;
    const params = req.body as Record<string, string>;

    return twilio.validateRequest(authToken, signature, url, params);
  }

  async handleTwilioWebhook(
    body: Record<string, string>,
  ): Promise<void> {
    const { From = '', To = '', Body: msgBody = '', MessageSid = '', WaId } = body;

    const isWhatsApp = From.toLowerCase().includes('whatsapp:');
    const channel = isWhatsApp ? 'WHATSAPP' : 'SMS';
    const normalizedFrom = normalizePhone(From);

    // Look up driver by normalised phone (whatsapp_phone preferred, phone fallback)
    const allDrivers = await this.prisma.driver.findMany({
      where: { deleted_at: null },
      include: {
        assigned_loads: {
          where: { status: 'ASSIGNED' },
          orderBy: { assigned_at: 'desc' },
          take: 1,
        },
      },
    });

    const driver = allDrivers.find(
      (d) =>
        (d.whatsapp_phone && normalizePhone(d.whatsapp_phone) === normalizedFrom) ||
        normalizePhone(d.phone) === normalizedFrom,
    );

    // Save inbound message record
    const message = await this.prisma.message.create({
      data: {
        company_id: driver?.company_id ?? 'UNKNOWN',
        driver_id: driver?.id ?? null,
        load_id: driver?.assigned_loads[0]?.id ?? null,
        direction: 'INBOUND',
        channel,
        body: msgBody,
        external_id: MessageSid || null,
        wa_id: WaId ?? null,
        from_number: normalizedFrom,
        to_number: To || null,
        status: 'RECEIVED',
      },
    });

    if (!driver) {
      this.logger.warn(`Twilio inbound from unknown number ${normalizedFrom}`);
      return;
    }

    const assignedLoad = driver.assigned_loads[0];
    if (!assignedLoad) {
      this.logger.log(
        `Driver ${driver.id} replied but has no ASSIGNED load — message ${message.id} saved`,
      );
      return;
    }

    // Fire Inngest event for the communication function to handle
    await inngest.send({
      name: 'driver/replied',
      data: {
        messageId: message.id,
        driverId: driver.id,
        loadId: assignedLoad.id,
        companyId: driver.company_id,
        body: msgBody,
      },
    });

    this.logger.log(
      `driver/replied event fired — driver ${driver.id}, load ${assignedLoad.id}`,
    );
  }
}
