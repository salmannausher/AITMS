export interface LoadEvent {
  id: string;
  load_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  actor_type: string;
  actor_id: string | null;
  actor_name: string | null;
  metadata: unknown;
  created_at: string;
}

export interface LoadMessage {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL';
  body: string;
  created_at: string;
}

export interface LoadDetail {
  id: string;
  company_id: string;
  origin_city: string;
  origin_state: string;
  dest_city: string;
  dest_state: string;
  pickup_date: string;
  delivery_date: string | null;
  load_type: string | null;
  weight: number | null;
  commodity: string | null;
  reference_number: string | null;
  rate: string | null;
  rpm: string | null;
  estimated_miles: number | null;
  status: string;
  needs_review: boolean;
  ai_score: 'GOOD' | 'MARGINAL' | 'AVOID' | null;
  ai_score_details: unknown;
  broker: { id: string; name: string } | null;
  assigned_driver: { id: string; full_name: string } | null;
  assigned_truck: { id: string; unit_number: string } | null;
  assigned_by_user_id: string | null;
  assigned_at: string | null;
  pod_document_url: string | null;
  events: LoadEvent[];
  messages: LoadMessage[];
}
