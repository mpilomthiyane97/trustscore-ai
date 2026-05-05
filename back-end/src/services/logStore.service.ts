import { RiskLogEntry } from "../types/risk.types";

const riskCheckLogs: RiskLogEntry[] = [];

export function addRiskLog(entry: RiskLogEntry): void {
  riskCheckLogs.push(entry);
}

export function getLastRiskLogs(limit = 20): RiskLogEntry[] {
  return riskCheckLogs.slice(-limit).reverse();
}
