export interface ParseEmailEventData {
  messageId: string;
  companyId: string;
  fromEmail: string;
  subject: string;
  textBody: string;
  htmlBody: string | null;
  attachments: Array<{
    name: string;
    mimeType: string;
    data: string; // base64
  }>;
}

export interface ParsedLoad {
  origin_city: string;
  origin_state: string;
  dest_city: string;
  dest_state: string;
  pickup_date: string;
  delivery_date?: string | null;
  rate?: number | null;
  reference_number?: string | null;
  broker_name?: string | null;
  broker_mc_number?: string | null;
  load_type?: 'DRY_VAN' | 'REEFER' | 'FLATBED' | 'STEP_DECK' | null;
  weight?: number | null;
  confidence?: number;
}
