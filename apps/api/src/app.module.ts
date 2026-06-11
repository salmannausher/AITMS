import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
  controllers: [AppController],
})
export class AppModule {}
