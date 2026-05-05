export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type RecommendedAction = "ALLOW" | "STEP_UP_VERIFICATION" | "BLOCK";

export interface TelecomSignals {
  simSwapRecent: boolean;
  newDevice: boolean;
  locationAnomaly: boolean;
}

export type TelecomSignalSource = "sdk" | "provider";

export interface TelecomSignalInsight {
  value: boolean;
  source: TelecomSignalSource;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  providerName?: string;
  docsUrl?: string;
  endpointUrl?: string;
}

export interface PhoneRegistrationInsight {
  registeredTo: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  carrierName: string | null;
  lineType: string | null;
  country: string | null;
  rawAvailable: boolean;
}

export interface TelecomInsights {
  simSwapRecent: TelecomSignalInsight;
  newDevice: TelecomSignalInsight;
  locationAnomaly: TelecomSignalInsight;
  registration: PhoneRegistrationInsight;
  capabilitiesUsed: string[];
}

export interface NumberVerificationAuthInput {
  code?: string;
  state?: string;
}

export interface LocationVerificationInput {
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  maxAgeSeconds?: number;
}

export interface SignalBreakdown {
  name: string;
  tells: string;
  finding: string;
  points: number;
}

export interface RiskCheckResponse {
  trustScore: number;
  riskLevel: RiskLevel;
  signals: string[];
  breakdown: SignalBreakdown[];
  recommendedAction: RecommendedAction;
  phoneNumber: string;
  telecomInsights: TelecomInsights;
}

export interface RiskLogEntry {
  timestamp: string;
  phoneNumber: string;
  trustScore: number;
  riskLevel: RiskLevel;
  recommendedAction: RecommendedAction;
}
