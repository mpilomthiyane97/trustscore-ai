export interface RiskResponse {
  trustScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  signals: string[];
  recommendedAction: string;
  phoneNumber: string;
}

export async function checkNumberRisk(phoneNumber: string): Promise<RiskResponse> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));

  const simSwapRecent = Math.random() < 0.35;
  const newDevice = Math.random() < 0.45;
  const locationAnomaly = Math.random() < 0.4;
  const numberVerified = Math.random() < 0.7;

  let score = 0;
  const signals: string[] = [];
  if (simSwapRecent) {
    score += 40;
    signals.push("SIM swap detected 2 hours ago");
  }
  if (newDevice) {
    score += 20;
    signals.push("New device detected");
  }
  if (locationAnomaly) {
    score += 20;
    signals.push("Unusual location");
  }
  if (!numberVerified) {
    score += 20;
    signals.push("Number not verified by carrier");
  }
  if (signals.length === 0) signals.push("All telecom signals look normal");

  const trustScore = Math.min(100, score);
  const riskLevel: RiskResponse["riskLevel"] =
    trustScore <= 39 ? "LOW" : trustScore <= 69 ? "MEDIUM" : "HIGH";

  const recommendedAction =
    riskLevel === "HIGH"
      ? "BLOCK TRANSACTION"
      : riskLevel === "MEDIUM"
      ? "REQUEST ADDITIONAL VERIFICATION"
      : "ALLOW";

  return { trustScore, riskLevel, signals, recommendedAction, phoneNumber };
}

export function extractPhoneNumber(text: string): string | null {
  // Strip spaces/dashes for matching
  const cleaned = text.replace(/[\s\-().]/g, "");
  const match = cleaned.match(/\+?\d{7,15}/);
  return match ? match[0] : null;
}

export function formatAssistantReply(r: RiskResponse): string {
  const emoji = r.riskLevel === "HIGH" ? "⚠️" : r.riskLevel === "MEDIUM" ? "🟡" : "✅";
  const bullets = r.signals.map((s) => `• ${s}`).join("\n");
  const rec =
    r.riskLevel === "HIGH"
      ? "Block sensitive actions like payments or password resets."
      : r.riskLevel === "MEDIUM"
      ? "Request step-up verification before allowing the action."
      : "Looks safe to proceed with normal verification.";
  return `${emoji} This number shows ${r.riskLevel} fraud risk.\n\nTrustScore: ${r.trustScore}\n\nWhat I found:\n${bullets}\n\nRecommendation: ${rec}`;
}

export function speakableReply(r: RiskResponse): string {
  return `This number shows ${r.riskLevel.toLowerCase()} fraud risk. Trust score ${r.trustScore}. ${r.signals.join(". ")}.`;
}
