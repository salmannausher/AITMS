import Anthropic from '@anthropic-ai/sdk';
import { type AiProvider, type ParseEmailResult, type ScoreLoadResult } from './ai-provider';

// Tool schema shared between providers
export const CREATE_LOAD_TOOL = {
  name: 'create_load',
  description: 'Create a load record from the parsed document',
  input_schema: {
    type: 'object' as const,
    required: ['origin_city', 'origin_state', 'dest_city', 'dest_state', 'pickup_date'],
    properties: {
      origin_city: { type: 'string' as const },
      origin_state: { type: 'string' as const, description: '2-letter state code e.g. IL' },
      dest_city: { type: 'string' as const },
      dest_state: { type: 'string' as const, description: '2-letter state code e.g. TX' },
      pickup_date: { type: 'string' as const, description: 'ISO date YYYY-MM-DD' },
      delivery_date: { type: ['string', 'null'] as ['string', 'null'] },
      rate: { type: ['number', 'null'] as ['number', 'null'], description: 'Total load rate in USD' },
      reference_number: { type: ['string', 'null'] as ['string', 'null'] },
      broker_name: { type: ['string', 'null'] as ['string', 'null'] },
      broker_mc_number: { type: ['string', 'null'] as ['string', 'null'] },
      load_type: {
        type: ['string', 'null'] as ['string', 'null'],
        enum: ['DRY_VAN', 'REEFER', 'FLATBED', 'STEP_DECK', null],
      },
      weight: { type: ['number', 'null'] as ['number', 'null'] },
      confidence: {
        type: 'number' as const,
        minimum: 0,
        maximum: 1,
        description: 'Confidence in extraction accuracy (0-1)',
      },
    },
  },
};

const SCORE_LOAD_TOOL_ANTHROPIC = {
  name: 'score_load',
  description: 'Record the scoring decision for this load',
  input_schema: {
    type: 'object' as const,
    required: ['score', 'suggested_minimum_rate', 'counteroffer_rate', 'reason'],
    properties: {
      score: { type: 'string' as const, enum: ['GOOD', 'MARGINAL', 'AVOID'] },
      suggested_minimum_rate: { type: 'number' as const },
      counteroffer_rate: { type: ['number', 'null'] as unknown as 'number' },
      reason: { type: 'string' as const },
    },
  },
};

export class AnthropicProvider implements AiProvider {
  constructor(private readonly client: Anthropic) {}

  async parseEmail({
    system,
    userText,
    claudeDocuments = [],
  }: {
    system: string;
    userText: string;
    claudeDocuments?: Array<{ name: string; dataBase64: string }>;
  }): Promise<ParseEmailResult> {
    // claude-haiku-4-5 does not support PDF document blocks
    const model = claudeDocuments.length > 0 ? 'claude-sonnet-4-5' : 'claude-haiku-4-5';

    const userContent: Anthropic.MessageParam['content'] =
      claudeDocuments.length > 0
        ? [
            ...claudeDocuments.map((doc) => ({
              type: 'document' as const,
              source: {
                type: 'base64' as const,
                media_type: 'application/pdf' as const,
                data: doc.dataBase64,
              },
            })),
            { type: 'text' as const, text: userText },
          ]
        : userText;

    const response = await this.client.messages.create({
      model,
      max_tokens: 1024,
      temperature: 0,
      system,
      messages: [{ role: 'user', content: userContent }],
      tools: [CREATE_LOAD_TOOL],
      tool_choice: { type: 'tool', name: 'create_load' },
    });

    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      throw new Error('Anthropic did not return a tool call');
    }

    return {
      toolInput: toolUse.input as Record<string, unknown>,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      modelUsed: model,
    };
  }

  async scoreLoad({ system, userMessage }: { system: string; userMessage: string }): Promise<ScoreLoadResult> {
    const startMs = Date.now();

    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      temperature: 0,
      system,
      tools: [SCORE_LOAD_TOOL_ANTHROPIC],
      tool_choice: { type: 'tool', name: 'score_load' },
      messages: [{ role: 'user', content: userMessage }],
    });

    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      throw new Error('Anthropic did not return a score_load tool call');
    }

    return {
      toolInput: toolUse.input as Record<string, unknown>,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      modelUsed: response.model,
      latencyMs: Date.now() - startMs,
    };
  }
}
