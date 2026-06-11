import type { Load } from '@prisma/client';
import type { CarrierCostSettings } from '@aitms/shared';

export interface LoadCreatedEventData {
  loadId: string;
  companyId: string;
}

export interface LaneHistory {
  count: number;
  avgRpm: number | null;
  minRpm: number | null;
  maxRpm: number | null;
}

export interface ScoringContext {
  load: Load;
  costs: CarrierCostSettings;
  laneHistory: LaneHistory;
  dieselPricePerGallon: number;
  computed: {
    allInCostPerMile: number;
    breakEvenRpm: number;
    estimatedProfit: number | null;
    rpm: number | null;
  };
}

export interface LoadScoredEventData {
  loadId: string;
  companyId: string;
  score: string;
}
