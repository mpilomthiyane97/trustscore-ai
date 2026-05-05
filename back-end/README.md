# TrustScore Backend

Production-ready hackathon backend for telecom fraud risk simulation.

## Stack

- Node.js
- TypeScript
- Express
- Zod validation
- API key authentication
- Modular architecture

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Start dev server:

```bash
npm run dev
```

Server runs on `http://localhost:4000`.

## Build and Start

```bash
npm run build
npm start
```

## External Nokia/CAMARA Integration

The telecom service supports real external API calls for:

- SIM swap checks
- Number ownership verification
- Device status checks
- Location anomaly checks

Set these variables in `.env` to enable provider calls:

- `NOKIA_API_KEY`
- `NOKIA_CAMARA_BASE_URL`
- `NOKIA_SIM_SWAP_PATH`
- `NOKIA_NUMBER_VERIFY_PATH`
- `NOKIA_DEVICE_STATUS_PATH`
- `NOKIA_LOCATION_VERIFY_PATH`
- `NOKIA_RAPIDAPI_HOST` (optional, for RapidAPI)
- `NOKIA_API_TIMEOUT_MS` (optional, default `8000`)

If Nokia endpoints fail, are misconfigured, or return unusable data, the backend returns an upstream error instead of applying local fallback values.

### SIM Swap via Network as Code SDK

The backend tries SIM swap checks via the official `network-as-code` SDK first (using `verifySimSwap` and `getSimSwapDate`) and then uses Nokia HTTP provider paths when needed.

Required SDK env values:

- `NOKIA_USE_SDK=true`
- `NOKIA_APPLICATION_KEY=<your-network-as-code-application-key>`
- `NOKIA_SIM_SWAP_MAX_AGE_HOURS=240` (customize as needed)

Simulator numbers from Network as Code docs for SIM swap behavior:

- `+99999991000` => SIM swap has occurred
- `+99999991001` => SIM swap has not occurred

### Number Verification via Network as Code SDK

Number Verification is implemented with the SDK consent flow:

1. Request authorization link from backend.
2. Redirect end user on mobile network to the returned URL.
3. Handle callback at `/api/number-verification/callback` and extract `code` + `state`.
4. Submit those values with risk check request.

Environment values:

- `NOKIA_NUMBER_VERIFICATION_SCOPE` (default: `dpv:FraudPreventionAndDetection number-verification:verify`)
- `NOKIA_NUMBER_VERIFICATION_REDIRECT_URI` (default: `http://localhost:4000/api/number-verification/callback`)

Endpoints:

- `POST /api/number-verification/authorization-link` (requires `x-api-key`)
- `GET /api/number-verification/callback` (public redirect endpoint)

Request for authorization link:

```json
{
  "phoneNumber": "+99999991000"
}
```

Risk-check request can now include optional Number Verification auth data:

```json
{
  "phoneNumber": "+99999991000",
  "numberVerificationCode": "authorization-code-from-callback",
  "numberVerificationState": "state-from-callback"
}
```

Simulator numbers from Network as Code docs for Number Verification:

- `+99999991000` => verifies correctly
- `+99999991001` => not verified

### Location Verification via Network as Code SDK

The backend uses SDK `verifyLocation(latitude, longitude, radius, maxAgeSeconds)` for location anomaly detection before using provider HTTP when needed.

Environment defaults (used when not provided in request):

- `NOKIA_LOCATION_DEFAULT_LATITUDE` (default: `60.252`)
- `NOKIA_LOCATION_DEFAULT_LONGITUDE` (default: `25.227`)
- `NOKIA_LOCATION_DEFAULT_RADIUS_METERS` (default: `1000`)
- `NOKIA_LOCATION_DEFAULT_MAX_AGE_SECONDS` (default: `3600`)

`resultType` mapping to anomaly:

- `TRUE` => not anomalous
- `FALSE` => anomalous
- `PARTIAL` => anomalous
- `UNKNOWN` => fallback path applies

Optional location parameters for risk-check request:

```json
{
  "phoneNumber": "+99999991001",
  "locationLatitude": 60.252,
  "locationLongitude": 25.227,
  "locationRadiusMeters": 1000,
  "locationMaxAgeSeconds": 3600
}
```

Simulator numbers from Network as Code docs for Location Verification:

- `+99999991000` => device is not in the given area
- `+99999991001` => device is in the given area
- `+99999991002` => device is partially in the area
- `+99999991003` => device location is unknown

## API

### Health

- `GET /health`

Response:

```json
{ "status": "OK" }
```

### Check Number Risk

- `POST /api/check-number-risk`
- Header required: `x-api-key: trustscore-demo-key`

Request:

```json
{ "phoneNumber": "+27712345678" }
```

Response example:

```json
{
  "trustScore": 80,
  "riskLevel": "HIGH",
  "signals": [
    "SIM swap detected recently",
    "New device detected",
    "Unusual location"
  ],
  "breakdown": [
    {
      "name": "SIM Swap",
      "tells": "Was number recently reissued?",
      "finding": "SIM swap detected in the last 24 hours",
      "points": 40
    }
  ],
  "recommendedAction": "BLOCK",
  "phoneNumber": "+27712345678",
  "telecomInsights": {
    "simSwapRecent": {
      "value": true,
      "source": "sdk",
      "confidence": "HIGH"
    },
    "numberVerified": {
      "value": false,
      "source": "provider",
      "confidence": "MEDIUM"
    },
    "newDevice": {
      "value": true,
      "source": "provider",
      "confidence": "MEDIUM"
    },
    "locationAnomaly": {
      "value": false,
      "source": "provider",
      "confidence": "MEDIUM"
    },
    "registration": {
      "registeredTo": "Jane Doe",
      "firstName": "Jane",
      "lastName": "Doe",
      "fullName": "Jane Doe",
      "carrierName": "Example Telecom",
      "lineType": "mobile",
      "country": "ZA",
      "rawAvailable": true
    },
    "capabilitiesUsed": [
      "SIM swap check",
      "Number verification",
      "Device status",
      "Location verification",
      "Registration insight extraction"
    ]
  }
}
```

Notes:

- `telecomInsights.*.source` indicates whether each signal came from SDK or direct provider API.
- `telecomInsights.registration` is extracted from provider payload fields when available. If the upstream provider does not return owner/subscriber identity data, these fields will be `null`.

### Logs

- `GET /api/logs`
- Header required: `x-api-key: trustscore-demo-key`

Returns the last 20 risk checks.

## Quick cURL Test

```bash
curl -X POST http://localhost:4000/api/check-number-risk \
  -H "Content-Type: application/json" \
  -H "x-api-key: trustscore-demo-key" \
  -d '{"phoneNumber":"+27712345678"}'
```
