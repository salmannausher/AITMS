import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhookEmailDto } from './webhook-email.dto';

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
    if (!secret || secret !== process.env.WEBHOOK_SECRET) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
    return this.webhooksService.handleInboundEmail(dto);
  }
}
