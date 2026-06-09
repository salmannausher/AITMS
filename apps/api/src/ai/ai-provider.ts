// ---------------------------------------------------------------------------
// Shared interface — all AI providers must implement this.
// intake.functions.ts depends on this interface, not on any specific SDK.
// ---------------------------------------------------------------------------

export type ParseEmailResult = {
  toolInput: Record<string, unknown>;
  inputTokens: number;
  outputTokens: number;
  modelUsed: string;
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
}
