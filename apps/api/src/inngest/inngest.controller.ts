import { All, Controller, Inject, Req, Res } from '@nestjs/common';
import { serve } from 'inngest/express';
import { type Request, type Response } from 'express';
import { inngest } from './inngest.client';
import { INNGEST_FUNCTIONS } from './inngest.tokens';

/**
 * Exposes ALL /api/inngest for the Inngest Dev Server and production.
 * Not protected by CompanyGuard — Inngest calls this server-to-server.
 * Functions are injected via INNGEST_FUNCTIONS token from InngestModule.
 */
@Controller('api/inngest')
export class InngestController {
  private readonly handler: ReturnType<typeof serve>;

  constructor(
    @Inject(INNGEST_FUNCTIONS)
    functions: Parameters<typeof serve>[0]['functions'],
  ) {
    this.handler = serve({ client: inngest, functions });
  }

  @All()
  handle(@Req() req: Request, @Res() res: Response) {
    return this.handler(req, res);
  }
}
