import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;

  private getClient(): Resend | null {
    if (!process.env.RESEND_API_KEY) {
      this.logger.warn('RESEND_API_KEY not set — email sending is disabled');
      return null;
    }
    if (!this.resend) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
    return this.resend;
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const client = this.getClient();
    if (!client) return;
    try {
      await client.emails.send({
        from: 'Devsphinx AI Dispatch <noreply@devsphinx.com>',
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${String(err)}`);
    }
  }
}
