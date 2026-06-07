import { Module } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { InngestController } from './inngest.controller';
import { PrismaService } from '../prisma/prisma.service';
import { createParseEmailFunction } from '../intake/intake.functions';
import { INNGEST_FUNCTIONS } from './inngest.tokens';

@Module({
  controllers: [InngestController],
  providers: [
    {
      provide: INNGEST_FUNCTIONS,
      useFactory: (prisma: PrismaService) => {
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });
        return [createParseEmailFunction(prisma, anthropic)];
      },
      inject: [PrismaService],
    },
  ],
})
export class InngestModule {}
