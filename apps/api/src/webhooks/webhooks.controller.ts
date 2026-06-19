// For local Twilio testing: expose localhost via ngrok or similar,
// set API_BASE_URL to the ngrok URL, and register that URL in the Twilio console.
// Twilio Sandbox: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn

import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  RawBodyRequest,
  Req,
  Res,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { Request, Response } from 'express';
import { WebhooksService } from './webhooks.service';
import { WebhookEmailDto } from './webhook-email.dto';

function safeSecretMatch(
  provided: string | undefined,
  expected: string | undefined,
): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('email')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async handleEmail(
    @Headers('x-webhook-secret') secret: string | undefined,
    @Body() dto: WebhookEmailDto,
  ): Promise<{ ok: boolean }> {
    if (!safeSecretMatch(secret, process.env['WEBHOOK_SECRET'])) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
    return this.webhooksService.handleInboundEmail(dto);
  }

  @Post('twilio')
  @HttpCode(200)
  async handleTwilioWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ): Promise<void> {
    if (!this.webhooksService.validateTwilioSignature(req)) {
      res.status(403).send('Forbidden');
      return;
    }

    await this.webhooksService.handleTwilioWebhook(
      req.body as Record<string, string>,
    );

    // Twilio requires a TwiML response — empty <Response/> means no reply message
    res.set('Content-Type', 'text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response/>');
  }
}
