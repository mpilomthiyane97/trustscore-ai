# TrustScore AI: Project Overview and Nokia API Integration

## 1. What This Project Does

TrustScore AI is a telecom fraud intelligence demo that evaluates risk for a phone number and returns:

- Trust score
- Risk level (`LOW`, `MEDIUM`, `HIGH`)
- Signal-by-signal breakdown
- Recommended action (`ALLOW`, `STEP_UP_VERIFICATION`, `BLOCK`)
- Telecom signal insights with source metadata

The current scoring model focuses on 3 live telecom signals:

- SIM swap recency
- Device swap/new device status
- Location anomaly

## 2. High-Level Architecture

Repository structure:

- `back-end/`: Express + TypeScript API
- `front-end/`: Vite + React + TypeScript chat-style UI

Backend layers:

- Routes: define API endpoints
- Controllers: validate input, orchestrate services, shape responses
- Services:
	- `telecom.service.ts`: Nokia API integration
	- `riskEngine.service.ts`: scoring and risk mapping
- Middlewares: API key auth, rate limiting, logging, error handling

## 3. Main Backend Endpoints

- `GET /health`
- `POST /api/check-number-risk` (requires `x-api-key`)
- `GET /api/logs` (requires `x-api-key`)
- `POST /api/number-verification/authorization-link` (requires `x-api-key`)
- `GET /api/number-verification/callback`

Main production/demo flow uses:

- `POST /api/check-number-risk`

## 4. End-to-End Request Flow (`/api/check-number-risk`)

1. Request enters route and passes API key middleware.
2. Controller validates payload with Zod (`checkNumberRiskSchema`).
3. Controller calls telecom service in parallel for:
	 - SIM swap
	 - Device status
	 - Location verification
4. Each telecom call returns a normalized `TelecomSignalInsight`.
5. `riskEngine.calculateRisk(...)` computes score, level, breakdown, signals, action.
6. Controller enriches response with `telecomInsights` and writes a log entry.
7. API returns JSON response to frontend/Postman.

## 5. Current Scoring Logic

Scoring points:

- SIM Swap: +40 if recent swap detected, else +0
- Device Status: +20 if new/swapped device detected, else +0
- Location Verification: +20 if anomalous location, else +0

Trust score behavior:

- `trustScore = min(100, sum(points))`
- With current 3-signal model, max raw sum is 80, so max practical trustScore is 80.

Risk levels:

- `LOW` for `0..39`
- `MEDIUM` for `40..69`
- `HIGH` for `70..100`

Recommended action:

- `HIGH` -> `BLOCK`
- `MEDIUM` -> `STEP_UP_VERIFICATION`
- `LOW` -> `ALLOW`

## 6. How Nokia APIs Were Implemented

Integration is implemented in `back-end/src/services/telecom.service.ts`.

### 6.1 Auth Strategy

The service supports two auth modes automatically:

- RapidAPI mode (when `NOKIA_RAPIDAPI_HOST` is set):
	- `X-RapidAPI-Key`
	- `X-RapidAPI-Host`
- Direct provider mode (when RapidAPI host is empty):
	- `x-api-key`
	- `Authorization: Bearer <key>`

### 6.2 Endpoint URL Resolution

`buildUrl(...)` supports:

- Full absolute URLs in env variables
- Relative endpoint paths joined with `NOKIA_CAMARA_BASE_URL`

This allows easy switching between direct provider and RapidAPI-style endpoint definitions.

### 6.3 Signal Request Payload Mapping

For each signal, request body is adapted to Nokia endpoint expectation:

- `simSwapRecent`:
	- body includes `phoneNumber`, `maxAge`
- `newDevice`:
	- body includes `phoneNumber`, `maxAge`
- `locationAnomaly`:
	- body includes `device.phoneNumber` and `area` object (`CIRCLE`)

### 6.4 Response Normalization

Different endpoint response formats are normalized into booleans:

- SIM/device use keys like `swapped`, `deviceSwapped`, etc.
- Location maps:
	- `TRUE` -> not anomalous (`false`)
	- `FALSE` or `PARTIAL` -> anomalous (`true`)
	- `UNKNOWN` -> unresolved

### 6.5 Signal Insight Metadata

Each signal response includes metadata for transparency:

- `source` (`provider` or `sdk`)
- `confidence`
- `providerName`
- `docsUrl` (currently `https://networkascode.nokia.io/`)
- `endpointUrl` used for the request

This metadata is surfaced in the frontend "Signal data sources" section for demo clarity.

## 7. Environment Variables Used for Nokia Integration

Core variables:

- `NOKIA_API_KEY`
- `NOKIA_CAMARA_BASE_URL`
- `NOKIA_SIM_SWAP_PATH`
- `NOKIA_DEVICE_STATUS_PATH`
- `NOKIA_LOCATION_VERIFY_PATH`
- `NOKIA_RAPIDAPI_HOST`
- `NOKIA_API_TIMEOUT_MS`

Optional/auxiliary values in this repo:

- `NOKIA_USE_SDK`
- `NOKIA_APPLICATION_KEY`
- `NOKIA_NUMBER_VERIFY_PATH`
- `NOKIA_NUMBER_VERIFICATION_SCOPE`
- `NOKIA_NUMBER_VERIFICATION_REDIRECT_URI`

## 8. Number Verification Status in Current Demo

Number verification endpoints still exist, but the core risk scoring model currently does not use Number Verification points.

Why:

- The current demo focus is 3 stable Nokia telecom signals.
- Number verification often requires consent/callback flow and can be less deterministic for quick hackathon demos.

`telecomInsights.registration` is still returned with a null-safe object for response consistency.

## 9. Sandbox vs Real Numbers

Current environment is Nokia simulator/sandbox mode.

- Simulator numbers (for example `+99999991000`) return deterministic demo data.
- Real MSISDNs may fail with upstream errors (`500`, `404 unknown device`) until live network onboarding is enabled.

This is expected behavior for sandbox mode.

## 10. Frontend Rendering Logic

Frontend risk reply:

- Displays trust score and risk level
- Shows signal breakdown and arithmetic calculation
- Shows signal data source details including provider docs and endpoint URL
- Displays recommended action

Main frontend integration file:

- `front-end/src/lib/checkNumberRisk.ts`

## 11. Demo Narrative for Judges

Recommended framing:

1. Input a phone number.
2. Backend queries live Nokia sandbox telecom APIs.
3. Signals are normalized and scored.
4. User gets explainable, auditable risk output with source provenance.

This highlights technical integration, explainability, and fraud decision support.

