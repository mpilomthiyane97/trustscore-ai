import {
  PhoneRegistrationInsight,
  RecommendedAction,
  RiskCheckResponse,
  RiskLevel,
  SignalBreakdown,
  TelecomInsights,
  TelecomSignals,
} from "../types/risk.types";

const emptyRegistrationInsight: PhoneRegistrationInsight = {
  registeredTo: null,
  firstName: null,
  lastName: null,
  fullName: null,
  carrierName: null,
  lineType: null,
  country: null,
  rawAvailable: false,
};

function buildDefaultTelecomInsights(telecomSignals: TelecomSignals): TelecomInsights {
  return {
    simSwapRecent: {
      value: telecomSignals.simSwapRecent,
      source: "provider",
      confidence: "LOW",
    },
    newDevice: {
      value: telecomSignals.newDevice,
      source: "provider",
      confidence: "LOW",
    },
    locationAnomaly: {
      value: telecomSignals.locationAnomaly,
      source: "provider",
      confidence: "LOW",
    },
    registration: emptyRegistrationInsight,
    capabilitiesUsed: [],
  };
}

function mapLevel(score: number): RiskLevel {
  if (score <= 39) return "LOW";
  if (score <= 69) return "MEDIUM";
  return "HIGH";
}

function mapAction(level: RiskLevel): RecommendedAction {
  if (level === "HIGH") return "BLOCK";
  if (level === "MEDIUM") return "STEP_UP_VERIFICATION";
  return "ALLOW";
}

export function calculateRisk(
  phoneNumber: string,
  telecomSignals: TelecomSignals
): RiskCheckResponse {
  const signalEntries: Array<SignalBreakdown & { maxPoints: number }> = [
    {
      name: "SIM Swap",
      tells: "Was number recently reissued?",
      finding: telecomSignals.simSwapRecent
        ? "SIM swap detected in the last 24 hours"
        : "No recent SIM swap detected",
      points: telecomSignals.simSwapRecent ? 40 : 0,
      maxPoints: 40,
    },
    {
      name: "Device Status",
      tells: "Is this a newly seen device?",
      finding: telecomSignals.newDevice
        ? "New device detected"
        : "Known trusted device",
      points: telecomSignals.newDevice ? 20 : 0,
      maxPoints: 20,
    },
    {
      name: "Location Verification",
      tells: "Is location behavior unusual?",
      finding: telecomSignals.locationAnomaly
        ? "Unusual location"
        : "Location behavior appears normal",
      points: telecomSignals.locationAnomaly ? 20 : 0,
      maxPoints: 20,
    },
  ];

  const breakdown: SignalBreakdown[] = signalEntries.map(({ maxPoints: _maxPoints, ...entry }) => entry);

  const rawScore = signalEntries.reduce((total, item) => total + item.points, 0);
  const trustScore = Math.min(100, rawScore);
  const riskLevel = mapLevel(trustScore);
  const recommendedAction = mapAction(riskLevel);

  const signals: string[] = breakdown
    .filter((entry) => entry.points > 0)
    .map((entry) => {
      if (entry.name === "SIM Swap") return "SIM swap detected recently";
      if (entry.name === "Device Status") return "New device detected";
      return "Unusual location";
    });

  if (signals.length === 0) {
    signals.push("All telecom signals look normal");
  }

  return {
    trustScore,
    riskLevel,
    signals,
    breakdown,
    recommendedAction,
    phoneNumber,
    telecomInsights: buildDefaultTelecomInsights(telecomSignals),
  };
}
