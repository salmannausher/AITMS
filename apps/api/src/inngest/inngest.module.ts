import { Logger, Module } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { InngestController } from './inngest.controller';
import { PrismaService } from '../prisma/prisma.service';
import { createParseEmailFunction } from '../intake/intake.functions';
import { createCleanCacheFunction } from '../cache/cache.functions';
import { AnthropicProvider } from '../ai/anthropic.provider';
import { OpenRouterProvider } from '../ai/openrouter.provider';
import { INNGEST_FUNCTIONS } from './inngest.tokens';

const logger = new Logger('InngestModule');

@Module({
  controllers: [InngestController],
  providers: [
    {
      provide: INNGEST_FUNCTIONS,
      useFactory: (prisma: PrismaService) => {
        const provider = process.env['AI_PROVIDER'];

        const aiProvider =
          provider === 'openrouter'
            ? (() => {
                const apiKey = process.env['OPENROUTER_API_KEY'];
                if (!apiKey) throw new Error('OPENROUTER_API_KEY is required when AI_PROVIDER=openrouter');
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

        return [
          createParseEmailFunction(prisma, aiProvider),
          createCleanCacheFunction(prisma),
        ];
      },
      inject: [PrismaService],
    },
  ],
})
export class InngestModule {}
