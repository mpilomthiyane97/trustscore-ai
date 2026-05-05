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
}

export async function checkNumberRisk(phoneNumber: string): Promise<RiskResponse> {
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));

  const simSwapRecent = Math.random() < 0.35;
  const newDevice = Math.random() < 0.45;
  const locationAnomaly = Math.random() < 0.4;
  const numberVerified = Math.random() < 0.7;

  const breakdown: SignalBreakdown[] = [
    {
      name: "SIM Swap",
      tells: "Was number recently reissued?",
      finding: simSwapRecent ? "SIM swapped 2 hours ago" : "No recent SIM swap",
      points: simSwapRecent ? 40 : 0,
    },
    {
      name: "Number Verification",
      tells: "Does SIM match device?",
      finding: numberVerified ? "Verified by carrier" : "Not verified",
      points: numberVerified ? 0 : 20,
    },
    {
      name: "Device Status",
      tells: "Is this a new phone?",
      finding: newDevice ? "New device detected" : "Known device",
      points: newDevice ? 20 : 0,
    },
    {
      name: "Location Verification",
      tells: "Is location unusual?",
      finding: locationAnomaly ? "Unusual location" : "Normal location",
      points: locationAnomaly ? 20 : 0,
    },
  ];

  const trustScore = Math.min(100, breakdown.reduce((s, b) => s + b.points, 0));
  const signals = breakdown.filter((b) => b.points > 0).map((b) => b.finding);
  if (signals.length === 0) signals.push("All telecom signals look normal");

  const riskLevel: RiskResponse["riskLevel"] =
    trustScore <= 39 ? "LOW" : trustScore <= 69 ? "MEDIUM" : "HIGH";

  const recommendedAction =
    riskLevel === "HIGH"
      ? "BLOCK TRANSACTION"
      : riskLevel === "MEDIUM"
      ? "REQUEST ADDITIONAL VERIFICATION"
      : "ALLOW";

  return { trustScore, riskLevel, signals, breakdown, recommendedAction, phoneNumber };
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

  return [
    `${emoji} This number shows ${r.riskLevel} fraud risk.`,
    ``,
    `TrustScore: ${r.trustScore} / 100`,
    ``,
    `Signal breakdown:`,
    ...lines,
    ``,
    `Calculation: ${calc} = ${r.trustScore} → ${r.riskLevel} RISK`,
    ``,
    `Recommendation: ${rec}`,
  ].join("\n");
}

export function speakableReply(r: RiskResponse): string {
  return `This number shows ${r.riskLevel.toLowerCase()} fraud risk. Trust score ${r.trustScore} out of 100. ${r.signals.join(". ")}.`;
}
