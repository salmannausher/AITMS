// Minimal Buffer declaration so postal-mime types compile in the Workers environment.
// Cloudflare Workers don't have Node's Buffer, but postal-mime's RawEmail type references it.
declare class Buffer extends Uint8Array {
  static from(
    data: string | ArrayBuffer | SharedArrayBuffer | Uint8Array,
    encoding?: string,
  ): Buffer;
  toString(encoding?: string): string;
}
