/**
 * Normalises any phone number string to E.164 format (+1XXXXXXXXXX for US).
 * Examples:
 *   '(555) 123-4567'      → '+15551234567'
 *   '+15551234567'        → '+15551234567'
 *   'whatsapp:+15551234567' → '+15551234567'  (strip prefix first)
 */
export function normalizePhone(raw: string): string {
  // Strip WhatsApp prefix
  const stripped = raw.replace(/^whatsapp:/i, '');
  // Keep only digits
  const digits = stripped.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  // Return as-is with '+' for non-US numbers or already-normalised values
  return `+${digits}`;
}
