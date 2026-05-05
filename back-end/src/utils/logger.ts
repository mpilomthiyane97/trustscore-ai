export function logInfo(message: string, payload?: unknown): void {
  if (payload === undefined) {
    console.log(`[TrustScore] ${message}`);
    return;
  }

  console.log(`[TrustScore] ${message}`, payload);
}
