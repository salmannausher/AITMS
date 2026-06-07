import PostalMime from 'postal-mime';

interface Attachment {
  name: string;
  mimeType: string;
  data: string; // base64
}

interface WebhookPayload {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments: Attachment[];
}

interface Env {
  WEBHOOK_URL: string;
  WEBHOOK_SECRET: string;
}

export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    try {
      // Response.arrayBuffer() returns ArrayBuffer (not ArrayBufferLike)
      const rawBuffer = await new Response(message.raw).arrayBuffer();
      const parsed = await new PostalMime().parse(rawBuffer);

      const attachments: Attachment[] = (parsed.attachments ?? []).map((a) => ({
        name: a.filename ?? 'attachment',
        mimeType: a.mimeType,
        data: arrayBufferToBase64(a.content as ArrayBuffer | Uint8Array | string),
      }));

      const payload: WebhookPayload = {
        from: message.from,
        to: message.to,
        subject: parsed.subject ?? '',
        text: parsed.text,
        html: parsed.html,
        attachments,
      };

      const response = await fetch(env.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': env.WEBHOOK_SECRET,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`Webhook returned ${response.status}: ${await response.text()}`);
      }
    } catch (err) {
      console.error('Email worker error:', err);
    }
  },
} satisfies ExportedHandler<Env>;

function arrayBufferToBase64(content: ArrayBuffer | Uint8Array | string): string {
  if (typeof content === 'string') return btoa(content);
  const bytes = content instanceof Uint8Array ? content : new Uint8Array(content);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
