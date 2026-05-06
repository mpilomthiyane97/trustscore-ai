import dotenv from "dotenv";

dotenv.config();

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: toNumber(process.env.PORT, 4000),
  apiKey: process.env.API_KEY ?? "trustscore-demo-key",
  nokiaApiKey: process.env.NOKIA_API_KEY ?? process.env.API_KEY ?? "",
  nokiaApplicationKey: process.env.NOKIA_APPLICATION_KEY ?? process.env.NOKIA_API_KEY ?? process.env.API_KEY ?? "",
  nokiaUseSdk: (process.env.NOKIA_USE_SDK ?? "true").toLowerCase() !== "false",
  nokiaSimSwapMaxAgeHours: toNumber(process.env.NOKIA_SIM_SWAP_MAX_AGE_HOURS, 240),
  nokiaLocationDefaultLatitude: toNumber(process.env.NOKIA_LOCATION_DEFAULT_LATITUDE, 60.252),
  nokiaLocationDefaultLongitude: toNumber(process.env.NOKIA_LOCATION_DEFAULT_LONGITUDE, 25.227),
  nokiaLocationDefaultRadiusMeters: toNumber(process.env.NOKIA_LOCATION_DEFAULT_RADIUS_METERS, 1_000),
  nokiaLocationDefaultMaxAgeSeconds: toNumber(process.env.NOKIA_LOCATION_DEFAULT_MAX_AGE_SECONDS, 3_600),
  nokiaCamaraBaseUrl: process.env.NOKIA_CAMARA_BASE_URL ?? "",
  nokiaSimSwapPath: process.env.NOKIA_SIM_SWAP_PATH ?? "",
  nokiaDeviceStatusPath: process.env.NOKIA_DEVICE_STATUS_PATH ?? "",
  nokiaLocationVerifyPath: process.env.NOKIA_LOCATION_VERIFY_PATH ?? "",
  nokiaRapidApiHost: process.env.NOKIA_RAPIDAPI_HOST ?? "",
  nokiaApiTimeoutMs: toNumber(process.env.NOKIA_API_TIMEOUT_MS, 8_000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:8080",
  rateLimitWindowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMaxRequests: toNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
};
