import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

export interface DriverNoReplyParams {
  companyId: string;
  loadId: string;
  driverId: string;
  driverName: string;
  origin: string;
  dest: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly config: ConfigService) {}

  async emitDriverNoReply(params: DriverNoReplyParams): Promise<void> {
    // TODO Week 7 Task 7.2: call emitDriverNoReply() from the Driver
    // Communication Agent after step.sleep('30m') — see communication.functions.ts
    try {
      const supabaseAdmin = createClient(
        this.config.getOrThrow<string>('SUPABASE_URL'),
        this.config.getOrThrow<string>('SUPABASE_SERVICE_KEY'),
      );

      await supabaseAdmin.channel(`alerts:company:${params.companyId}`).send({
        type: 'broadcast',
        event: 'driver_no_reply',
        payload: params,
      });

      this.logger.log(`driver_no_reply emitted for load ${params.loadId}`);
    } catch (err) {
      // Notification failure must never crash the driver communication flow
      this.logger.error(`Failed to emit driver_no_reply for load ${params.loadId}`, err);
    }
  }
}
