import { Logger, Module } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { InngestController } from './inngest.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { CacheModule } from '../cache/cache.module';
import { createParseEmailFunction } from '../intake/intake.functions';
import { createCleanCacheFunction } from '../cache/cache.functions';
import { createScoreLoadFunction } from '../rate-analysis/rate-analysis.functions';
import { EiaService } from '../rate-analysis/eia.service';
import { createRankDriversFunction } from '../dispatch/dispatch.functions';
import {
  createSendAssignmentFunction,
  createParseDriverReplyFunction,
} from '../communication/communication.functions';
import { AnthropicProvider } from '../ai/anthropic.provider';
import { OpenRouterProvider } from '../ai/openrouter.provider';
import { MessagingModule } from '../messaging/messaging.module';
import { MessagingService } from '../messaging/messaging.service';
import { INNGEST_FUNCTIONS } from './inngest.tokens';

const logger = new Logger('InngestModule');

@Module({
  imports: [CacheModule, MessagingModule],
  controllers: [InngestController],
  providers: [
    {
      provide: INNGEST_FUNCTIONS,
      useFactory: (prisma: PrismaService, cache: CacheService, messaging: MessagingService) => {
        const provider = process.env['AI_PROVIDER'];

        const aiProvider =
          provider === 'openrouter'
            ? (() => {
                const apiKey = process.env['OPENROUTER_API_KEY'];
                if (!apiKey)
                  throw new Error('OPENROUTER_API_KEY is required when AI_PROVIDER=openrouter');
                const model = process.env['OPENROUTER_MODEL'];
                logger.log(`AI provider: OpenRouter (model: ${model ?? 'default'})`);
                return new OpenRouterProvider(apiKey, model);
              })()
            : (() => {
                logger.log('AI provider: Anthropic');
                return new AnthropicProvider(
                  new Anthropic({ apiKey: process.env['ANTHROPIC_API_KEY'] }),
                );
              })();

        const eia = new EiaService();

        return [
          createParseEmailFunction(prisma, aiProvider),
          createCleanCacheFunction(prisma),
          createScoreLoadFunction(prisma, aiProvider, cache, eia),
          createRankDriversFunction(prisma, aiProvider),
          createSendAssignmentFunction(prisma, aiProvider, messaging),
          createParseDriverReplyFunction(prisma, aiProvider, messaging),
        ];
      },
      inject: [PrismaService, CacheService, MessagingService],
    },
  ],
})
export class InngestModule {}
