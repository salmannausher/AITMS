// ---------------------------------------------------------------------------
// Shared interface — all AI providers must implement this.
// intake.functions.ts and rate-analysis depend on this, not on any specific SDK.
// ---------------------------------------------------------------------------
import type {
  AssignmentMessageContext,
  ReplyClassificationContext,
  ReplyClassification,
} from '../communication/communication.types';

export type ParseEmailResult = {
  toolInput: Record<string, unknown>;
  inputTokens: number;
  outputTokens: number;
  modelUsed: string;
};

export type ScoreLoadResult = {
  toolInput: Record<string, unknown>;
  inputTokens: number;
  outputTokens: number;
  modelUsed: string;
  latencyMs: number;
};

export type RankDriversResult = {
  toolInput: Record<string, unknown>;
  inputTokens: number;
  outputTokens: number;
  modelUsed: string;
  latencyMs: number;
};

export interface AiProvider {
  /**
   * Send an email/document to the AI and get back a structured tool call result.
   * claudeDocuments: optional native PDF attachments (Anthropic-only; ignored by OpenRouter).
   */
  parseEmail(params: {
    system: string;
    userText: string;
    claudeDocuments?: Array<{ name: string; dataBase64: string }>;
  }): Promise<ParseEmailResult>;

  /**
   * Score a load using the score_load tool. System prompt + JSON user message → GOOD/MARGINAL/AVOID.
   */
  scoreLoad(params: { system: string; userMessage: string }): Promise<ScoreLoadResult>;

  /**
   * Rank available drivers for a load using the rank_drivers tool.
   */
  rankDrivers(params: { system: string; userMessage: string }): Promise<RankDriversResult>;

  /**
   * Draft a WhatsApp assignment message for a driver. Returns free text.
   */
  draftAssignmentMessage(context: AssignmentMessageContext): Promise<string>;

  /**
   * Classify a driver's WhatsApp reply about a load assignment.
   */
  classifyDriverReply(context: ReplyClassificationContext): Promise<ReplyClassification>;
}

export type { AssignmentMessageContext, ReplyClassificationContext, ReplyClassification };
