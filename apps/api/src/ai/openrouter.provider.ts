import { Logger } from '@nestjs/common';
import {
  type AiProvider,
  type ParseEmailResult,
  type RankDriversResult,
  type ScoreLoadResult,
  type AssignmentMessageContext,
  type ReplyClassificationContext,
  type ReplyClassification,
} from './ai-provider';

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

  async draftAssignmentMessage(context: AssignmentMessageContext): Promise<string> {
    const lines = [
      `Driver: ${context.driverName}`,
      `Load: ${context.originCity} ${context.originState} → ${context.destCity} ${context.destState}`,
      `Pickup: ${context.pickupDate}`,
      `Load type: ${context.loadType}`,
    ];
    if (context.weightLbs != null) lines.push(`Weight: ${context.weightLbs} lbs`);
    if (context.rateUsd != null) lines.push(`Rate: $${context.rateUsd.toLocaleString()}`);

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
        temperature: 0.3,
        max_tokens: 512,
        messages: [
          {
            role: 'system',
            content:
              'Write a WhatsApp load assignment message to a truck driver. ' +
              'Be brief (5 lines max), clear, and professional but friendly. ' +
              'Drivers read these on phones — no jargon, no internal notes. ' +
              'Include all provided details. Omit the rate line if no rate is given. ' +
              "End with exactly: 'Reply YES to accept or NO to decline.'",
          },
          { role: 'user', content: lines.join('\n') },
        ],
      }),
    });

    type SimpleResponse = { choices: Array<{ message: { content: string } }>; error?: { message: string } };
    const data = (await response.json()) as SimpleResponse;
    if (!response.ok || data.error) {
      throw new Error(`OpenRouter draftAssignmentMessage error: ${data.error?.message ?? response.statusText}`);
    }
    return data.choices[0]?.message?.content ?? '';
  }

  async classifyDriverReply(context: ReplyClassificationContext): Promise<ReplyClassification> {
    const userMessage =
      `Driver: ${context.driverName}\n` +
      `Load: ${context.loadOrigin} → ${context.loadDest}\n` +
      `Driver's reply: '${context.replyBody}'`;

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
        max_tokens: 256,
        messages: [
          {
            role: 'system',
            content:
              "You are classifying a truck driver's WhatsApp reply about a load assignment. " +
              'The driver was asked to reply YES to accept or NO to decline. ' +
              'Classify their intent. If the message could mean multiple things or is very short, use confidence < 0.6. ' +
              'Extract ETA or status info if present. Be conservative — prefer UNCLEAR over a wrong classification.',
          },
          { role: 'user', content: userMessage },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'classify_reply',
              description: "Classify a truck driver's reply",
              parameters: {
                type: 'object',
                required: ['intent', 'confidence', 'extracted_eta', 'extracted_status', 'reason'],
                properties: {
                  intent: {
                    type: 'string',
                    enum: ['ACCEPT', 'DECLINE', 'QUESTION', 'ETA_UPDATE', 'STATUS_UPDATE', 'UNCLEAR'],
                  },
                  confidence: { type: 'number', minimum: 0, maximum: 1 },
                  extracted_eta: { type: ['string', 'null'] },
                  extracted_status: { type: ['string', 'null'] },
                  reason: { type: 'string' },
                },
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'classify_reply' } },
      }),
    });

    const data = (await response.json()) as OpenRouterResponse;

    if (!response.ok || data.error) {
      // Fail-safe: return UNCLEAR so downstream never crashes on tool_choice issues
      logger.warn(`OpenRouter classifyDriverReply error: ${data.error?.message ?? response.statusText} — returning UNCLEAR`);
      return {
        intent: 'UNCLEAR',
        confidence: 0,
        extracted_eta: null,
        extracted_status: null,
        reason: 'OpenRouter tool_choice not supported',
      };
    }

    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return {
        intent: 'UNCLEAR',
        confidence: 0,
        extracted_eta: null,
        extracted_status: null,
        reason: 'OpenRouter tool_choice not supported',
      };
    }

    return JSON.parse(toolCall.function.arguments) as ReplyClassification;
  }

  async rankDrivers({
    system,
    userMessage,
  }: {
    system: string;
    userMessage: string;
  }): Promise<RankDriversResult> {
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
        max_tokens: 1024,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userMessage },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'rank_drivers',
              description: 'Rank available drivers for this load by suitability',
              parameters: {
                type: 'object',
                required: ['ranked_drivers', 'recommendation_summary'],
                properties: {
                  ranked_drivers: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['driver_id', 'rank', 'score', 'reason'],
                      properties: {
                        driver_id: { type: 'string' },
                        rank: { type: 'number' },
                        score: { type: 'number', minimum: 0, maximum: 100 },
                        reason: { type: 'string' },
                        deadhead_miles: { type: ['number', 'null'] },
                        eta_hours: { type: ['number', 'null'] },
                      },
                    },
                  },
                  recommendation_summary: { type: 'string' },
                },
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'rank_drivers' } },
      }),
    });

    const data = (await response.json()) as OpenRouterResponse;

    if (!response.ok || data.error) {
      throw new Error(`OpenRouter rankDrivers error: ${data.error?.message ?? response.statusText}`);
    }

    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('OpenRouter did not return a rank_drivers tool call');
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
