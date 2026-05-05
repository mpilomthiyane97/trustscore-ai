export interface SignalBreakdown {
  name: string;
  tells: string;
  finding: string;
  points: number;
}

export interface RiskResponse {
  trustScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  signals: string[];
  breakdown: SignalBreakdown[];
  recommendedAction: string;
  phoneNumber: string;
  telecomInsights: {
    simSwapRecent: {
      value: boolean;
      source: "sdk" | "provider";
      confidence: "HIGH" | "MEDIUM" | "LOW";
      providerName?: string;
      docsUrl?: string;
      endpointUrl?: string;
    };
    newDevice: {
      value: boolean;
      source: "sdk" | "provider";
      confidence: "HIGH" | "MEDIUM" | "LOW";
      providerName?: string;
      docsUrl?: string;
      endpointUrl?: string;
    };
    locationAnomaly: {
      value: boolean;
      source: "sdk" | "provider";
      confidence: "HIGH" | "MEDIUM" | "LOW";
      providerName?: string;
      docsUrl?: string;
      endpointUrl?: string;
    };
    registration?: {
      registeredTo: string | null;
      firstName: string | null;
      lastName: string | null;
      fullName: string | null;
      carrierName: string | null;
      lineType: string | null;
      country: string | null;
      rawAvailable: boolean;
    };
    capabilitiesUsed: string[];
  };
}

function formatSignalSource(source: string): string {
  if (source === "sdk") return "SDK";
  return "Provider API";
}

function buildSignalSourceLine(
  label: string,
  insight: {
    source: "sdk" | "provider";
    confidence: "HIGH" | "MEDIUM" | "LOW";
    providerName?: string;
    docsUrl?: string;
    endpointUrl?: string;
  }
): string {
  const provider = insight.providerName ?? "Nokia Network as Code API";
  const docs = insight.docsUrl ?? "https://networkascode.nokia.io/";
  const endpoint = insight.endpointUrl ?? "Endpoint not exposed";
  return `• ${label}: Provider: ${provider} | Docs: ${docs} | Endpoint: ${endpoint}`;
}

const API_BASE_URL =
  import.meta.env.VITE_TRUSTSCORE_API_BASE_URL ?? "http://localhost:4000";
const API_KEY = import.meta.env.VITE_TRUSTSCORE_API_KEY ?? "trustscore-demo-key";

export async function checkNumberRisk(phoneNumber: string): Promise<RiskResponse> {
  const response = await fetch(`${API_BASE_URL}/api/check-number-risk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ phoneNumber }),
  });

  if (!response.ok) {
    let errorMessage = "Failed to check number risk.";
    try {
      const errorBody = (await response.json()) as { error?: string; message?: string };
      errorMessage = errorBody.message ?? errorBody.error ?? errorMessage;
    } catch {
      // Keep default error message if body is not JSON.
    }
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as RiskResponse;
  return data;
}

export function extractPhoneNumber(text: string): string | null {
  const cleaned = text.replace(/[\s\-().]/g, "");
  const match = cleaned.match(/\+?\d{7,15}/);
  return match ? match[0] : null;
}

export function formatAssistantReply(r: RiskResponse): string {
  const emoji = r.riskLevel === "HIGH" ? "⚠️" : r.riskLevel === "MEDIUM" ? "🟡" : "✅";
  const rec =
    r.riskLevel === "HIGH"
      ? "Block sensitive actions like payments or password resets."
      : r.riskLevel === "MEDIUM"
      ? "Request step-up verification before allowing the action."
      : "Looks safe to proceed with normal verification.";

  const lines = r.breakdown.map((b) => {
    const sign = b.points > 0 ? `+${b.points}` : "0";
    return `• ${b.name} — ${b.finding} (${sign})`;
  });

  const calc = r.breakdown.map((b) => `+${b.points}`).join(" ");
  const rawTotal = r.breakdown.reduce((total, item) => total + Math.max(item.points, 0), 0);

  const signalSources = [
    buildSignalSourceLine("SIM Swap", r.telecomInsights.simSwapRecent),
    buildSignalSourceLine("Device Status", r.telecomInsights.newDevice),
    buildSignalSourceLine("Location Verification", r.telecomInsights.locationAnomaly),
  ];

  return [
    `${emoji} This number shows ${r.riskLevel} fraud risk.`,
    ``,
    `TrustScore: ${r.trustScore} / 100`,
    ``,
    `Signal breakdown:`,
    ...lines,
    ``,
    `Calculation: ${calc} = ${rawTotal} raw points → TrustScore ${r.trustScore}/100 → ${r.riskLevel} RISK`,
    ``,
    `Signal data sources:`,
    ...signalSources,
    ``,
    `Recommendation: ${rec}`,
  ].join("\n");
}

export function speakableReply(r: RiskResponse): string {
  return `This number shows ${r.riskLevel.toLowerCase()} fraud risk. Trust score ${r.trustScore} out of 100. ${r.signals.join(". ")}.`;
}
