export interface LoadAcceptedEventData {
  loadId: string;
  companyId: string;
}

export interface DriverCandidate {
  id: string;
  full_name: string;
  status: string;
  home_city: string;
  home_state: string;
  hos_remaining_hours: number;
  cdl_class: string;
  endorsements: string[];
  assigned_truck_id: string | null;
  truck_type: string | null;
}

export interface RankedDriver {
  driver_id: string;
  driver_name: string; // enriched after Claude call — not from Claude output
  rank: number;
  score: number; // 0-100
  reason: string; // ≤12 words
  deadhead_miles: number | null;
  eta_hours: number | null;
}

export interface RankDriversToolOutput {
  ranked_drivers: RankedDriver[];
  recommendation_summary: string; // ≤20 words
}
