import { env } from "../utils/env";
import { logInfo } from "../utils/logger";
import { randomUUID } from "node:crypto";
import { HttpError } from "../utils/httpError";
import {
  LocationVerificationInput,
  NumberVerificationAuthInput,
  PhoneRegistrationInsight,
  TelecomSignalInsight,
  TelecomSignalSource,
} from "../types/risk.types";

type SignalName = "simSwapRecent" | "numberVerified" | "newDevice" | "locationAnomaly";

interface NumberVerificationAuthorizationLinkInput {
  phoneNumber: string;
  redirectUri?: string;
  scope?: string;
}

interface NumberVerificationAuthorizationLinkResult {
  authorizationUrl: string;
  state: string;
  redirectUri: string;
  scope: string;
  phoneNumber: string;
}

interface TelecomSignalFetchResult {
  value: boolean | undefined;
  rawResponse: unknown;
}

const NOKIA_DOCS_URL = "https://networkascode.nokia.io/";

function buildUrl(path: string): string {
  const base = env.nokiaCamaraBaseUrl.trim();
  const normalizedPath = path.trim();

  if (!normalizedPath) {
    return "";
  }

  if (normalizedPath.startsWith("http://") || normalizedPath.startsWith("https://")) {
    return normalizedPath;
  }

  if (!base) {
    return "";
  }

  return `${base.replace(/\/$/, "")}/${normalizedPath.replace(/^\//, "")}`;
}

function extractBoolean(raw: unknown, signal: SignalName): boolean | undefined {
  if (typeof raw === "boolean") {
    return raw;
  }

  if (typeof raw !== "object" || raw === null) {
    return undefined;
  }

  const data = raw as Record<string, unknown>;

  if (signal === "locationAnomaly") {
    const locationResult =
      asStringOrNull(data.resultType) ??
      asStringOrNull(data.result_type) ??
      asStringOrNull(data.verificationResult) ??
      asStringOrNull(data.verification_result);

    if (locationResult) {
      const normalized = locationResult.toUpperCase();
      if (normalized === "TRUE") return false;
      if (normalized === "FALSE" || normalized === "PARTIAL") return true;
      if (normalized === "UNKNOWN") return undefined;
    }
  }

  const keyMap: Record<SignalName, string[]> = {
    simSwapRecent: ["simSwapRecent", "simSwap", "swappedRecently", "sim_swap_recent", "simSwapDetected", "swapped"],
    numberVerified: [
      "numberVerified",
      "verified",
      "ownershipVerified",
      "number_verified",
      "devicePhoneNumberVerified",
      "device_phone_number_verified",
    ],
    newDevice: ["newDevice", "isNewDevice", "new_device", "deviceNew", "swapped", "deviceSwapped", "device_swapped"],
    locationAnomaly: ["locationAnomaly", "locationMismatch", "location_anomaly", "anomaly"],
  };

  for (const key of keyMap[signal]) {
    if (typeof data[key] === "boolean") {
      return data[key] as boolean;
    }
  }

  return undefined;
}

function buildProviderRequestBody(signal: SignalName, phoneNumber: string): Record<string, unknown> {
  if (signal === "simSwapRecent") {
    return {
      phoneNumber,
      maxAge: env.nokiaSimSwapMaxAgeHours,
    };
  }

  if (signal === "newDevice") {
    return {
      phoneNumber,
      maxAge: 120,
    };
  }

  if (signal === "locationAnomaly") {
    return {
      device: { phoneNumber },
      area: {
        areaType: "CIRCLE",
        center: {
          latitude: env.nokiaLocationDefaultLatitude,
          longitude: env.nokiaLocationDefaultLongitude,
        },
        radius: env.nokiaLocationDefaultRadiusMeters,
      },
    };
  }

  return { phoneNumber };
}

function getSignalEndpointPath(signal: SignalName): string {
  if (signal === "simSwapRecent") return env.nokiaSimSwapPath;
  if (signal === "newDevice") return env.nokiaDeviceStatusPath;
  if (signal === "locationAnomaly") return env.nokiaLocationVerifyPath;
  return env.nokiaNumberVerifyPath;
}

async function callTelecomSignal(
  signal: SignalName,
  phoneNumber: string,
  endpointPath: string
): Promise<boolean | undefined> {
  const result = await callTelecomSignalDetailed(signal, phoneNumber, endpointPath);
  return result.value;
}

async function callTelecomSignalDetailed(
  signal: SignalName,
  phoneNumber: string,
  endpointPath: string
): Promise<TelecomSignalFetchResult> {
  const url = buildUrl(endpointPath);
  const apiKey = env.nokiaApiKey.trim();

  if (!url || !apiKey) {
    throw new HttpError(500, "Nokia API is not configured.", {
      signal,
      missingBaseUrl: !env.nokiaCamaraBaseUrl.trim(),
      missingEndpointPath: !endpointPath.trim(),
      missingApiKey: !apiKey,
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.nokiaApiTimeoutMs);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const rapidApiHost = env.nokiaRapidApiHost.trim();
    if (rapidApiHost) {
      // RapidAPI expects its own key/host headers and may reject conflicting auth headers.
      headers["X-RapidAPI-Key"] = apiKey;
      headers["X-RapidAPI-Host"] = rapidApiHost;
    } else {
      headers["x-api-key"] = apiKey;
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(buildProviderRequestBody(signal, phoneNumber)),
      signal: controller.signal,
    });

    if (!response.ok) {
      const responseText = await response.text();
      logInfo("Telecom API non-200 response", {
        signal,
        status: response.status,
        body: responseText.slice(0, 300),
      });
      throw new HttpError(502, "Nokia API returned a non-success response.", {
        signal,
        status: response.status,
        body: responseText.slice(0, 300),
      });
    }

    const responseData = (await response.json()) as unknown;
    const value = extractBoolean(responseData, signal);
    if (typeof value === "boolean") {
      return { value, rawResponse: responseData };
    }

    logInfo("Telecom API response missing expected boolean flag", { signal });
    throw new HttpError(502, "Nokia API response did not include the expected signal field.", {
      signal,
      response: responseData,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    logInfo("Telecom API request failed", {
      signal,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new HttpError(502, "Nokia API request failed.", {
      signal,
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function createSignalInsight(
  value: boolean,
  source: TelecomSignalSource,
  signal: SignalName
): TelecomSignalInsight {
  const endpointUrl = source === "provider"
    ? buildUrl(getSignalEndpointPath(signal)) || undefined
    : undefined;

  if (source === "sdk") {
    return {
      value,
      source,
      confidence: "HIGH",
      providerName: "Nokia Network as Code SDK",
      docsUrl: NOKIA_DOCS_URL,
    };
  }

  return {
    value,
    source: "provider",
    confidence: "MEDIUM",
    providerName: "Nokia Network as Code API",
    docsUrl: NOKIA_DOCS_URL,
    endpointUrl,
  };
}

function resolveSignal(
  signal: SignalName,
  sdkValue: boolean | undefined,
  providerValue: boolean | undefined
): TelecomSignalInsight {
  if (typeof sdkValue === "boolean") {
    return createSignalInsight(sdkValue, "sdk", signal);
  }

  if (typeof providerValue === "boolean") {
    return createSignalInsight(providerValue, "provider", signal);
  }

  throw new HttpError(502, "Nokia API did not return a usable signal.", { signal });
}

function asStringOrNull(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function extractStringByKeys(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = asStringOrNull(source[key]);
    if (value) {
      return value;
    }
  }

  return null;
}

function extractRegistrationInsight(rawResponse: unknown): PhoneRegistrationInsight {
  const empty: PhoneRegistrationInsight = {
    registeredTo: null,
    firstName: null,
    lastName: null,
    fullName: null,
    carrierName: null,
    lineType: null,
    country: null,
    rawAvailable: false,
  };

  if (typeof rawResponse !== "object" || rawResponse === null) {
    return empty;
  }

  const payload = rawResponse as Record<string, unknown>;
  const fullName = extractStringByKeys(payload, [
    "fullName",
    "full_name",
    "ownerName",
    "owner_name",
    "subscriberName",
    "subscriber_name",
    "registeredTo",
    "registered_to",
  ]);
  const firstName = extractStringByKeys(payload, ["firstName", "first_name", "givenName"]);
  const lastName = extractStringByKeys(payload, ["lastName", "last_name", "familyName"]);
  const carrierName = extractStringByKeys(payload, [
    "carrierName",
    "carrier_name",
    "operatorName",
    "operator_name",
  ]);
  const lineType = extractStringByKeys(payload, ["lineType", "line_type", "numberType", "number_type"]);
  const country = extractStringByKeys(payload, ["country", "countryCode", "country_code"]);
  const registeredTo = fullName || [firstName, lastName].filter(Boolean).join(" ") || null;

  return {
    registeredTo,
    firstName,
    lastName,
    fullName,
    carrierName,
    lineType,
    country,
    rawAvailable: Boolean(
      registeredTo || firstName || lastName || fullName || carrierName || lineType || country
    ),
  };
}

let networkAsCodeClient: unknown;

type NetworkAsCodeClientLike = {
  devices?: {
    get?: (input: { phoneNumber: string }) => {
      verifySimSwap?: (...args: unknown[]) => Promise<unknown>;
      getSimSwapDate?: () => Promise<unknown>;
      verifyNumber?: (code: string, state: string) => Promise<unknown>;
      verifyLocation?: (
        latitude: number,
        longitude: number,
        radiusMeters: number,
        maxAgeSeconds?: number
      ) => Promise<unknown>;
      phoneNumber?: string;
    };
  };
  authorization?: {
    createAuthorizationLink?: (
      redirectUri: string,
      scope: string,
      loginHint: string,
      state: string
    ) => Promise<string>;
  };
};

async function getNetworkAsCodeClient(): Promise<unknown> {
  if (networkAsCodeClient) {
    return networkAsCodeClient;
  }

  if (!env.nokiaUseSdk || !env.nokiaApplicationKey.trim()) {
    return undefined;
  }

  try {
    const sdkModule = (await import("network-as-code")) as {
      NetworkAsCodeClient?: new (applicationKey: string) => NetworkAsCodeClientLike;
    };

    if (!sdkModule.NetworkAsCodeClient) {
      logInfo("Network as Code SDK did not export NetworkAsCodeClient");
      return undefined;
    }

    networkAsCodeClient = new sdkModule.NetworkAsCodeClient(env.nokiaApplicationKey.trim());
    return networkAsCodeClient;
  } catch (error) {
    logInfo("Failed to initialize Network as Code SDK", {
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}

async function checkSimSwapWithSdk(phoneNumber: string): Promise<boolean | undefined> {
  const client = await getNetworkAsCodeClient();
  if (!client) {
    return undefined;
  }

  try {
    const devicesApi = (client as NetworkAsCodeClientLike).devices;
    const getDevice = devicesApi?.get;
    if (typeof getDevice !== "function") {
      return undefined;
    }

    const device = getDevice({ phoneNumber });
    if (!device || typeof device !== "object") {
      return undefined;
    }

    const verifySimSwapFn = device.verifySimSwap;
    if (typeof verifySimSwapFn === "function") {
      const verifyResult = await verifySimSwapFn.call(device, env.nokiaSimSwapMaxAgeHours);
      if (typeof verifyResult === "boolean") {
        return verifyResult;
      }
    }

    const getSimSwapDateFn = device.getSimSwapDate;
    if (typeof getSimSwapDateFn === "function") {
      const simSwapDateRaw = await getSimSwapDateFn.call(device);
      if (!simSwapDateRaw) {
        return false;
      }

      const simSwapDate =
        simSwapDateRaw instanceof Date ? simSwapDateRaw : new Date(String(simSwapDateRaw));

      if (Number.isNaN(simSwapDate.getTime())) {
        return undefined;
      }

      const maxAgeMs = env.nokiaSimSwapMaxAgeHours * 60 * 60 * 1000;
      return Date.now() - simSwapDate.getTime() <= maxAgeMs;
    }

    return undefined;
  } catch (error) {
    logInfo("Network as Code SIM swap check failed", {
      phoneNumber,
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}

async function verifyNumberWithSdk(
  phoneNumber: string,
  authInput?: NumberVerificationAuthInput
): Promise<boolean | undefined> {
  if (!authInput?.code || !authInput?.state) {
    return undefined;
  }

  const client = await getNetworkAsCodeClient();
  if (!client) {
    return undefined;
  }

  try {
    const device = (client as NetworkAsCodeClientLike).devices?.get?.({ phoneNumber });
    if (!device?.verifyNumber) {
      return undefined;
    }

    const result = await device.verifyNumber(authInput.code, authInput.state);
    return typeof result === "boolean" ? result : undefined;
  } catch (error) {
    logInfo("Network as Code number verification failed", {
      phoneNumber,
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}

function mapLocationResultTypeToAnomaly(resultType: string): boolean | undefined {
  const normalized = resultType.trim().toUpperCase();
  if (normalized === "TRUE") {
    return false;
  }
  if (normalized === "FALSE" || normalized === "PARTIAL") {
    return true;
  }
  if (normalized === "UNKNOWN") {
    return undefined;
  }
  return undefined;
}

async function verifyLocationWithSdk(
  phoneNumber: string,
  locationInput?: LocationVerificationInput
): Promise<boolean | undefined> {
  const client = await getNetworkAsCodeClient();
  if (!client) {
    return undefined;
  }

  const latitude = locationInput?.latitude ?? env.nokiaLocationDefaultLatitude;
  const longitude = locationInput?.longitude ?? env.nokiaLocationDefaultLongitude;
  const radiusMeters =
    locationInput?.radiusMeters ?? env.nokiaLocationDefaultRadiusMeters;
  const maxAgeSeconds =
    locationInput?.maxAgeSeconds ?? env.nokiaLocationDefaultMaxAgeSeconds;

  try {
    const device = (client as NetworkAsCodeClientLike).devices?.get?.({ phoneNumber });
    if (!device?.verifyLocation) {
      return undefined;
    }

    const sdkResponse = await device.verifyLocation(
      latitude,
      longitude,
      radiusMeters,
      maxAgeSeconds
    );

    if (typeof sdkResponse === "boolean") {
      // Some SDK/runtime variants may return a direct boolean.
      return sdkResponse ? false : true;
    }

    if (typeof sdkResponse !== "object" || sdkResponse === null) {
      return undefined;
    }

    const responseObj = sdkResponse as {
      resultType?: string;
      result_type?: string;
      matchRate?: number;
      match_rate?: number;
    };

    const resultType = responseObj.resultType ?? responseObj.result_type;
    if (!resultType) {
      return undefined;
    }

    const mapped = mapLocationResultTypeToAnomaly(resultType);

    if (resultType.toUpperCase() === "PARTIAL") {
      const matchRate = responseObj.matchRate ?? responseObj.match_rate;
      logInfo("Location verification partial match", {
        phoneNumber,
        matchRate,
      });
    }

    return mapped;
  } catch (error) {
    logInfo("Network as Code location verification failed", {
      phoneNumber,
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}

export async function createNumberVerificationAuthorizationLink(
  input: NumberVerificationAuthorizationLinkInput
): Promise<NumberVerificationAuthorizationLinkResult> {
  const client = await getNetworkAsCodeClient();
  if (!client) {
    throw new Error("Network as Code SDK is not configured. Set NOKIA_APPLICATION_KEY and NOKIA_USE_SDK=true.");
  }

  const redirectUri =
    input.redirectUri?.trim() || env.nokiaNumberVerificationRedirectUri.trim();
  if (!redirectUri) {
    throw new Error(
      "Missing redirect URI. Provide redirectUri in request or configure NOKIA_NUMBER_VERIFICATION_REDIRECT_URI."
    );
  }

  const scope =
    input.scope?.trim() || env.nokiaNumberVerificationScope.trim();
  if (!scope) {
    throw new Error("Missing number verification scope.");
  }

  const state = randomUUID();
  const createLink = (client as NetworkAsCodeClientLike).authorization?.createAuthorizationLink;
  if (!createLink) {
    throw new Error("Network as Code SDK authorization API is unavailable.");
  }

  const authorizationUrl = await createLink(
    redirectUri,
    scope,
    input.phoneNumber,
    state
  );

  return {
    authorizationUrl,
    state,
    redirectUri,
    scope,
    phoneNumber: input.phoneNumber,
  };
}

export async function checkSimSwap(phoneNumber: string): Promise<boolean> {
  const sdkValue = await checkSimSwapWithSdk(phoneNumber);
  const providerValue =
    typeof sdkValue === "boolean"
      ? undefined
      : await callTelecomSignal("simSwapRecent", phoneNumber, env.nokiaSimSwapPath);
  return resolveSignal("simSwapRecent", sdkValue, providerValue).value;
}

export async function checkSimSwapDetailed(phoneNumber: string): Promise<TelecomSignalInsight> {
  const sdkValue = await checkSimSwapWithSdk(phoneNumber);
  const providerValue =
    typeof sdkValue === "boolean"
      ? undefined
      : await callTelecomSignal("simSwapRecent", phoneNumber, env.nokiaSimSwapPath);
  return resolveSignal("simSwapRecent", sdkValue, providerValue);
}

export async function verifyNumberOwnership(
  phoneNumber: string,
  authInput?: NumberVerificationAuthInput
): Promise<boolean> {
  const sdkValue = await verifyNumberWithSdk(phoneNumber, authInput);
  const providerValue =
    typeof sdkValue === "boolean"
      ? undefined
      : await callTelecomSignal("numberVerified", phoneNumber, env.nokiaNumberVerifyPath);
  return resolveSignal("numberVerified", sdkValue, providerValue).value;
}

export async function verifyNumberOwnershipDetailed(
  phoneNumber: string,
  authInput?: NumberVerificationAuthInput
): Promise<{ signal: TelecomSignalInsight; registration: PhoneRegistrationInsight }> {
  const sdkValue = await verifyNumberWithSdk(phoneNumber, authInput);
  const providerResult = await callTelecomSignalDetailed(
    "numberVerified",
    phoneNumber,
    env.nokiaNumberVerifyPath
  );
  const registration = extractRegistrationInsight(providerResult.rawResponse);

  return {
    signal: resolveSignal("numberVerified", sdkValue, providerResult.value),
    registration,
  };
}

export async function checkDeviceStatus(phoneNumber: string): Promise<boolean> {
  const providerValue = await callTelecomSignal("newDevice", phoneNumber, env.nokiaDeviceStatusPath);
  return resolveSignal("newDevice", undefined, providerValue).value;
}

export async function checkDeviceStatusDetailed(phoneNumber: string): Promise<TelecomSignalInsight> {
  const providerValue = await callTelecomSignal("newDevice", phoneNumber, env.nokiaDeviceStatusPath);
  return resolveSignal("newDevice", undefined, providerValue);
}

export async function verifyLocation(
  phoneNumber: string,
  locationInput?: LocationVerificationInput
): Promise<boolean> {
  const sdkValue = await verifyLocationWithSdk(phoneNumber, locationInput);
  const providerValue =
    typeof sdkValue === "boolean"
      ? undefined
      : await callTelecomSignal("locationAnomaly", phoneNumber, env.nokiaLocationVerifyPath);
  return resolveSignal("locationAnomaly", sdkValue, providerValue).value;
}

export async function verifyLocationDetailed(
  phoneNumber: string,
  locationInput?: LocationVerificationInput
): Promise<TelecomSignalInsight> {
  const sdkValue = await verifyLocationWithSdk(phoneNumber, locationInput);
  const providerValue =
    typeof sdkValue === "boolean"
      ? undefined
      : await callTelecomSignal("locationAnomaly", phoneNumber, env.nokiaLocationVerifyPath);
  return resolveSignal("locationAnomaly", sdkValue, providerValue);
}
