import { Logger } from '@nestjs/common';
import { type AiProvider, type ParseEmailResult, type ScoreLoadResult } from './ai-provider';

const logger = new Logger('OpenRouterProvider');

// Default model — free tier on OpenRouter, good enough for parsing tests.
// Override with OPENROUTER_MODEL env var.
const DEFAULT_MODEL = 'anthropic/claude-haiku-4-5';

type OpenRouterChoice = {
  message: {
    tool_calls?: Array<{
      function: {
        arguments: string;
      };
    }>;
  };
};

type OpenRouterResponse = {
  choices: OpenRouterChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
  model: string;
  error?: { message: string };
};

export class OpenRouterProvider implements AiProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model ?? DEFAULT_MODEL;
  }

  async parseEmail({
    system,
    userText,
    claudeDocuments = [],
  }: {
    system: string;
    userText: string;
    claudeDocuments?: Array<{ name: string; dataBase64: string }>;
  }): Promise<ParseEmailResult> {
    if (claudeDocuments.length > 0) {
      // Native PDF document blocks are Anthropic-only.
      // OpenRouter can handle PDFs for Claude models via base64 image blocks,
      // but for simplicity we fall back to text-only for testing.
      logger.warn(
        `OpenRouter provider: ${claudeDocuments.length} PDF document block(s) ignored — text-only mode`,
      );
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://devsphinx.dev',
        'X-Title': 'Devsphinx AI Dispatch',
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userText },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_load',
              description: 'Create a load record from the parsed document',
              parameters: {
                type: 'object',
                required: ['origin_city', 'origin_state', 'dest_city', 'dest_state', 'pickup_date'],
                properties: {
                  origin_city: { type: 'string' },
                  origin_state: { type: 'string', description: '2-letter state code e.g. IL' },
                  dest_city: { type: 'string' },
                  dest_state: { type: 'string', description: '2-letter state code e.g. TX' },
                  pickup_date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
                  delivery_date: { type: ['string', 'null'] },
                  rate: { type: ['number', 'null'], description: 'Total load rate in USD' },
                  reference_number: { type: ['string', 'null'] },
                  broker_name: { type: ['string', 'null'] },
                  broker_mc_number: { type: ['string', 'null'] },
                  load_type: {
                    type: ['string', 'null'],
                    enum: ['DRY_VAN', 'REEFER', 'FLATBED', 'STEP_DECK', null],
                  },
                  weight: { type: ['number', 'null'] },
                  confidence: { type: 'number', minimum: 0, maximum: 1 },
                },
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'create_load' } },
      }),
    });

    const data = (await response.json()) as OpenRouterResponse;

    if (!response.ok || data.error) {
      throw new Error(`OpenRouter error: ${data.error?.message ?? response.statusText}`);
    }

    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('OpenRouter did not return a tool call');
    }

    const toolInput = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;

    return {
      toolInput,
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      modelUsed: data.model ?? this.model,
    };
  }

  async scoreLoad({
    system,
    userMessage,
  }: {
    system: string;
    userMessage: string;
  }): Promise<ScoreLoadResult> {
    const startMs = Date.now();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://devsphinx.dev',
        'X-Title': 'Devsphinx AI Dispatch',
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0,
        max_tokens: 512,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userMessage },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'score_load',
              description: 'Record the scoring decision for this load',
              parameters: {
                type: 'object',
                required: ['score', 'suggested_minimum_rate', 'counteroffer_rate', 'reason'],
                properties: {
                  score: { type: 'string', enum: ['GOOD', 'MARGINAL', 'AVOID'] },
                  suggested_minimum_rate: { type: 'number' },
                  counteroffer_rate: { type: ['number', 'null'] },
                  reason: { type: 'string' },
                },
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'score_load' } },
      }),
    });

    const data = (await response.json()) as OpenRouterResponse;

    if (!response.ok || data.error) {
      throw new Error(`OpenRouter scoreLoad error: ${data.error?.message ?? response.statusText}`);
    }

    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('OpenRouter did not return a score_load tool call');
    }

    return {
      toolInput: JSON.parse(toolCall.function.arguments) as Record<string, unknown>,
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      modelUsed: data.model ?? this.model,
      latencyMs: Date.now() - startMs,
    };
  }
}
