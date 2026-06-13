export type AssignmentMessageContext = {
  driverName: string;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  pickupDate: string;   // formatted: 'Mon Jun 16'
  loadType: string;
  weightLbs: number | null;
  rateUsd: number | null;   // null when show_rate_to_driver = false
};

export type ReplyClassificationContext = {
  driverName: string;
  replyBody: string;
  loadOrigin: string;  // 'Chicago IL'
  loadDest: string;    // 'Atlanta GA'
};

export type ReplyClassification = {
  intent: 'ACCEPT' | 'DECLINE' | 'QUESTION' | 'ETA_UPDATE' | 'STATUS_UPDATE' | 'UNCLEAR';
  confidence: number;               // 0–1; if < 0.6 → treat as UNCLEAR
  extracted_eta: string | null;     // raw string, e.g. '3pm Tuesday'
  extracted_status: string | null;  // raw string, e.g. 'just loaded'
  reason: string;                   // ≤ 8 words explaining the classification
};

// Event data shapes consumed/emitted by the communication functions
export type LoadAssignedEventData = {
  loadId: string;
  companyId: string;
  driverId: string;
  truckId: string;
  assignedByUserId: string;
};

export type DriverRepliedEventData = {
  messageId: string;
  driverId: string;
  loadId: string;
  companyId: string;
  body: string;
};
