import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { inngest } from '../inngest/inngest.client';
import { WebhookEmailDto } from './webhook-email.dto';

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
        from_contact: from,
        to_contact: to,
        body: text ?? '',
        load_id: null,
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
}
