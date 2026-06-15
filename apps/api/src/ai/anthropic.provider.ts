import Anthropic from '@anthropic-ai/sdk';
import {
  type AiProvider,
  type ParseEmailResult,
  type RankDriversResult,
  type ScoreLoadResult,
  type AssignmentMessageContext,
  type ReplyClassificationContext,
  type ReplyClassification,
} from './ai-provider';

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
      rate: {
        type: ['number', 'null'] as ['number', 'null'],
        description: 'Total load rate in USD',
      },
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

const RANK_DRIVERS_TOOL_ANTHROPIC = {
  name: 'rank_drivers',
  description: 'Rank available drivers for this load by suitability',
  input_schema: {
    type: 'object' as const,
    required: ['ranked_drivers', 'recommendation_summary'],
    properties: {
      ranked_drivers: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          required: ['driver_id', 'rank', 'score', 'reason'],
          properties: {
            driver_id: { type: 'string' as const },
            rank: { type: 'number' as const },
            score: { type: 'number' as const, minimum: 0, maximum: 100 },
            reason: { type: 'string' as const },
            deadhead_miles: { type: ['number', 'null'] as unknown as 'number' },
            eta_hours: { type: ['number', 'null'] as unknown as 'number' },
          },
        },
      },
      recommendation_summary: { type: 'string' as const },
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

  async scoreLoad({
    system,
    userMessage,
  }: {
    system: string;
    userMessage: string;
  }): Promise<ScoreLoadResult> {
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

  async draftAssignmentMessage(context: AssignmentMessageContext): Promise<string> {
    const lines = [
      `Driver: ${context.driverName}`,
      `Load: ${context.originCity} ${context.originState} → ${context.destCity} ${context.destState}`,
      `Pickup: ${context.pickupDate}`,
      `Load type: ${context.loadType}`,
    ];
    if (context.weightLbs != null) lines.push(`Weight: ${context.weightLbs} lbs`);
    if (context.rateUsd != null) lines.push(`Rate: $${context.rateUsd.toLocaleString()}`);

    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      temperature: 0.3,
      system:
        'Write a WhatsApp load assignment message to a truck driver. ' +
        'Be brief (5 lines max), clear, and professional but friendly. ' +
        'Drivers read these on phones — no jargon, no internal notes. ' +
        'Include all provided details. Omit the rate line if no rate is given. ' +
        "End with exactly: 'Reply YES to accept or NO to decline.'",
      messages: [{ role: 'user', content: lines.join('\n') }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Anthropic did not return text for draftAssignmentMessage');
    }
    return textBlock.text;
  }

  async classifyDriverReply(context: ReplyClassificationContext): Promise<ReplyClassification> {
    const classifyTool: Anthropic.Tool = {
      name: 'classify_reply',
      description: "Classify a truck driver's reply to a load assignment",
      input_schema: {
        type: 'object' as const,
        required: ['intent', 'confidence', 'extracted_eta', 'extracted_status', 'reason'],
        properties: {
          intent: {
            type: 'string' as const,
            enum: ['ACCEPT', 'DECLINE', 'QUESTION', 'ETA_UPDATE', 'STATUS_UPDATE', 'UNCLEAR'],
          },
          confidence: { type: 'number' as const, minimum: 0, maximum: 1 },
          extracted_eta: { type: ['string', 'null'] as unknown as 'string' },
          extracted_status: { type: ['string', 'null'] as unknown as 'string' },
          reason: { type: 'string' as const },
        },
      },
    };

    const userMessage =
      `Driver: ${context.driverName}\n` +
      `Load: ${context.loadOrigin} → ${context.loadDest}\n` +
      `Driver's reply: '${context.replyBody}'`;

    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      temperature: 0,
      system:
        "You are classifying a truck driver's WhatsApp reply about a load assignment. " +
        'The driver was asked to reply YES to accept or NO to decline. ' +
        'Classify their intent. If the message could mean multiple things or is very short ' +
        "(e.g. 'k', 'ok', '👍'), use confidence < 0.6. " +
        'Extract ETA or status info if present. Be conservative — prefer UNCLEAR over a wrong ' +
        'classification that would auto-update load status.',
      tools: [classifyTool],
      tool_choice: { type: 'tool', name: 'classify_reply' },
      messages: [{ role: 'user', content: userMessage }],
    });

    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      throw new Error('Anthropic did not return a classify_reply tool call');
    }

    return toolUse.input as ReplyClassification;
  }

  async rankDrivers({
    system,
    userMessage,
  }: {
    system: string;
    userMessage: string;
  }): Promise<RankDriversResult> {
    const startMs = Date.now();

    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      temperature: 0,
      system,
      tools: [RANK_DRIVERS_TOOL_ANTHROPIC],
      tool_choice: { type: 'tool', name: 'rank_drivers' },
      messages: [{ role: 'user', content: userMessage }],
    });

    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      throw new Error('Anthropic did not return a rank_drivers tool call');
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
