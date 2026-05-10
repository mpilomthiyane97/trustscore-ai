# TrustScore AI - Africa Ignite Hackathon Presentation

## Slide 1 - Title

TrustScore AI: Telecom Fraud Risk Detection for Safer Digital Transactions

Team: [Your Team Name]
Hackathon: Africa Ignite Hackathon

Speaker note:
TrustScore AI is an explainable telecom fraud intelligence solution that helps digital platforms detect risky phone-number activity before approving sensitive actions.

---

## Slide 2 - Problem

### Fraud is rising while trust checks are too basic

- Many platforms rely heavily on OTP-only verification.
- OTP can be bypassed in account takeover scenarios.
- Fraud teams need stronger, real-time network-level signals.
- False positives also hurt user experience and conversion.

Speaker note:
The core issue is not just identity verification; it is risk verification at action time. A user can be legitimate at signup and still become high risk later because of SIM swap or suspicious device and location behavior.

---

## Slide 3 - Objective

### Build a practical fraud risk engine for mobile-first services

- Input: phone number
- Output: TrustScore, risk level, signal breakdown, recommended action
- Priorities:
  - Real telecom intelligence signals
  - Explainable decisions
  - Easy API integration into existing products

Speaker note:
Our objective was to create an implementation that is both technically strong and deployable in real operational workflows.

---

## Slide 4 - Solution Overview

### TrustScore AI in one flow

1. Client sends phone number to backend API.
2. Backend calls telecom intelligence providers for 3 signals.
3. Responses are normalized to deterministic booleans.
4. Weighted engine computes score out of 100.
5. API returns explainable risk decision with provenance metadata.

Signals used:
- SIM swap recency
- Device status (new/swapped device)
- Location verification anomaly

---

## Slide 5 - Architecture

### Tech stack and system design

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Validation: Zod
- External integration: Nokia Network as Code APIs
- Security controls: API key auth, rate limit, structured error handling

Backend layers:
- Routes
- Controllers
- Services (telecom integration + scoring)
- Middlewares

Speaker note:
The architecture is modular, making it easy to evolve scoring rules and add providers while preserving API stability.

---

## Slide 6 - Scoring Methodology

### Explainable weighted model

- SIM swap detected: +40
- Device risk signal detected: +20
- Location anomaly detected: +20

Formula:
TrustScore = min(100, sum(signal_points))

Risk mapping:
- LOW: 0 to 39
- MEDIUM: 40 to 69
- HIGH: 70 to 100

Recommended actions:
- LOW -> ALLOW
- MEDIUM -> STEP_UP_VERIFICATION
- HIGH -> BLOCK

Speaker note:
Every point in the score is traceable to a specific telecom signal and finding line, enabling auditability and easy judge verification.

---

## Slide 7 - Demo Output Example

### Example result for a high-risk number

- TrustScore: 80/100
- Risk Level: HIGH
- Breakdown:
  - SIM Swap -> detected (+40)
  - Device Status -> detected (+20)
  - Location Verification -> anomaly (+20)
- Recommended Action: BLOCK

Also returned:
- Signal source metadata
- Provider and endpoint transparency fields

---

## Slide 8 - Why This Matters in Africa

### Impact potential

- Reduces account takeover and transaction fraud risk
- Supports safer mobile money and fintech experiences
- Improves trust in digital onboarding and account recovery
- Helps teams make fast, explainable risk decisions

Target adopters:
- Fintech apps
- Wallet providers
- Lending platforms
- E-commerce and marketplaces

---

## Slide 9 - What We Built During Hackathon

- Working backend API with risk scoring and logs
- Working frontend chat-style interface
- Live telecom API integration for three fraud signals
- Documentation for architecture, scoring, and request flow
- Postman-testable endpoint for evaluation

Deliverables:
- Source code repository
- Demo video
- Presentation
- Screenshots and API evidence

---

## Slide 10 - Roadmap

### Next steps beyond hackathon

- Add tenant-specific scoring configuration
- Add fraud feedback loop for model tuning
- Build analyst dashboard for trend monitoring
- Add optional workflow integrations (KYC, payment gateways)
- Expand carrier/provider coverage

---

## Slide 11 - Live Demo Script (1 minute)

1. Enter a phone number in the app.
2. Trigger risk check.
3. Show trust score and risk level.
4. Walk through each signal and points.
5. Show recommendation (ALLOW / STEP_UP_VERIFICATION / BLOCK).
6. Show source metadata for transparency.

---

## Slide 12 - Closing

TrustScore AI delivers practical, explainable telecom fraud intelligence for safer digital services.

Thank you.

Contact:
- Team: Mpilo Mthiyane
-contacts: mpilomthiyane97@gmail.com

