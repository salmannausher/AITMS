import { All, Controller, Req, Res } from '@nestjs/common';
import { serve } from 'inngest/express';
import { type Request, type Response } from 'express';
import { inngest } from './inngest.client';

/**
 * Exposes POST /api/inngest for the Inngest Dev Server and production.
 * Not protected by CompanyGuard — Inngest calls this server-to-server.
 */
@Controller('api/inngest')
export class InngestController {
  private readonly handler = serve({
    client: inngest,
    functions: [],
    // Functions will be registered here as agents are built in Week 2
  });

  @All()
  handle(@Req() req: Request, @Res() res: Response) {
    return this.handler(req, res);
  }
}
