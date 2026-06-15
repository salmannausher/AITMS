import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './cache/cache.module';
import { CompaniesModule } from './companies/companies.module';
import { InngestModule } from './inngest/inngest.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { MailModule } from './mail/mail.module';
import { IntakeModule } from './intake/intake.module';
import { LoadsModule } from './loads/loads.module';
import { BrokersModule } from './brokers/brokers.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DriversModule } from './drivers/drivers.module';
import { TrucksModule } from './trucks/trucks.module';
import { MessagingModule } from './messaging/messaging.module';
import { CommunicationModule } from './communication/communication.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers["x-twilio-signature"]',
            'body.phone',
            'body.whatsapp_phone',
            'body.textBody',
            'body.attachments',
            '*.phone',
            '*.whatsapp_phone',
          ],
          censor: '[REDACTED]',
        },
        serializers: {
          req(req: { method: string; url: string }) {
            return { method: req.method, url: req.url };
          },
        },
      },
    }),
    PrismaModule,
    CacheModule,
    CompaniesModule,
    InngestModule,
    WebhooksModule,
    MailModule,
    IntakeModule,
    LoadsModule,
    BrokersModule,
    NotificationsModule,
    DriversModule,
    TrucksModule,
    MessagingModule,
    CommunicationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
