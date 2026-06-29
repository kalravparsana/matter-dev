# Backend Plan — R1 / Release 1.0.0

**Execution mode:** Serverless (AWS CloudFormation)  
**Integration UI root:** `Frontend/`  
**Release scope:** Initial release — Mattar signal-radar platform with Cognito Google sign-in, Slack/Gmail/Granola integrations, and live input signals.

---

## Preview UI Logic Mapping

| Note | Route | Backend implementation |
|------|-------|------------------------|
| Google OAuth sign-in | `/login` | Amazon Cognito User Pool with Google IdP federation; Hosted UI authorize URL → `/api/v1/auth/callback` token exchange → Cognito JWT stored client-side |
| Slack OAuth (all read scope) | `/today` | `POST /api/v1/integrations/slack/authorize` → Slack OAuth v2 with `channels:history,channels:read,groups:history,groups:read,im:history,im:read,mpim:history,mpim:read,users:read` → callback stores tokens in DynamoDB |
| Gmail OAuth | `/today` | `POST /api/v1/integrations/gmail/authorize` → Google OAuth via Cognito/Google federation with Gmail scopes → tokens in DynamoDB |
| Granola API key | `/today` | `PUT /api/v1/integrations/granola/credentials` — validates and stores API key (SSM-encrypted reference in DynamoDB) |
| DynamoDB stream signals | `/today` MattarRadar | `GET /api/v1/signals` + `GET /api/v1/signals/stream` (SSE); `POST /api/v1/webhooks/slack` and `POST /api/v1/webhooks/google` ingest events → DynamoDB → stream processor updates signals one-by-one |

---

## API Contract

### Auth (Cognito)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/auth/callback` | OAuth callback — exchange code for Cognito tokens |
| GET | `/api/v1/auth/session` | Return current user profile from verified Cognito JWT |
| GET | `/api/v1/auth/authorize-url` | Return Cognito Hosted UI URL with PKCE state |

### Integrations

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/integrations` | List connected integrations (Slack, Gmail, Granola) |
| POST | `/api/v1/integrations/:type/authorize` | Start OAuth for `slack` or `gmail` |
| GET | `/api/v1/integrations/oauth/callback` | Complete integration OAuth |
| PUT | `/api/v1/integrations/granola/credentials` | Store Granola API key `{ apiKey }` |

### Today / Radar

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/signals` | Input signals array (matches `InputSignal[]`) |
| GET | `/api/v1/signals/stream` | SSE stream of signal updates (DynamoDB stream fan-out) |
| GET | `/api/v1/outputs` | Routed output actions (`OutputAction[]`) |
| GET | `/api/v1/metrics/today` | Insight metrics (`InsightMetrics`) |

### Configuration

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/input-triggers` | Input triggers list |
| PATCH | `/api/v1/input-triggers/:id` | Toggle `enabled` |
| GET | `/api/v1/output-agents` | Output agents list |
| GET | `/api/v1/matter-config` | Matter agent config |
| PATCH | `/api/v1/matter-config` | Update prompt, temperature, threshold, autoRoute |

### Webhooks (public, signature-verified)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/webhooks/slack` | Slack Events API — creates/updates signals |
| POST | `/api/v1/webhooks/google` | Gmail push notifications — creates/updates signals |

All protected routes require `Authorization: Bearer <Cognito ID token>`.

---

## DynamoDB Single-Table Design

**Table:** `MattarTable`  
**PK:** `USER#<cognitoSub>`  
**SK patterns:**

| SK | Entity |
|----|--------|
| `PROFILE` | User workspace profile |
| `INTEGRATION#slack` | Slack connection + tokens |
| `INTEGRATION#gmail` | Gmail connection + tokens |
| `INTEGRATION#granola` | Granola API key reference |
| `SIGNAL#<id>` | Input signal |
| `OUTPUT#<id>` | Output action |
| `TRIGGER#<id>` | Input trigger config |
| `AGENT#<id>` | Output agent config |
| `CONFIG#matter` | Matter agent config |

**GSI1:** `GSI1PK = USER#<sub>`, `GSI1SK = SIGNAL#<receivedAt>` — list signals by time.

DynamoDB Stream enabled → `SignalStreamProcessor` Lambda updates SSE subscribers.

---

## Shared Utility Layer

`backend/src/lib/` — config, cognito (JWKS verify), dynamodb client, errors, response helpers, logger, validation (zod).

---

## Environment Variables

### `backend/.env.example`

- `COGNITO_USER_POOL_ID`
- `COGNITO_CLIENT_ID`
- `COGNITO_REGION`
- `COGNITO_DOMAIN`
- `OAUTH_REDIRECT_URI`
- `SLACK_CLIENT_ID`
- `SLACK_CLIENT_SECRET`
- `SLACK_SIGNING_SECRET`
- `SLACK_OAUTH_REDIRECT_URI`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GMAIL_OAUTH_REDIRECT_URI`
- `MATTAR_TABLE_NAME`
- `ALLOWED_ORIGINS`

### `Frontend/.env.example`

- `VITE_API_BASE_URL`
- `VITE_COGNITO_USER_POOL_ID`
- `VITE_COGNITO_CLIENT_ID`
- `VITE_COGNITO_REGION`
- `VITE_COGNITO_DOMAIN`
- `VITE_OAUTH_REDIRECT_URI`

---

## Frontend Wire-Up

1. Add `src/lib/api.ts` — centralized fetch with Cognito bearer token.
2. Add `src/lib/cognitoAuth.ts` — Hosted UI redirect flow (replaces direct Google GSI).
3. Add `src/hooks/useMattarData.ts` — loads integrations, signals, outputs, metrics; polls/stream updates on `/today`.
4. Replace mock imports in `TodayPage`, `IntegrationsPage`, `InputsPage`, `MatterPage`, `OutputsPage` with hook/API calls; keep mock fallback when `VITE_API_BASE_URL` unset.

---

## Unified Deploy Script

Root `deploy.sh`: Phase A Lambda zip → S3; Phase B backend CFN; Phase C frontend CFN (parallel); Phase D documented (outputs → env → build → s3 sync → invalidation).

---

## Backend Components Coverage Report

| Component | Application (planned files) | Infrastructure (planned IaC resources) |
|-----------|---------------------------|----------------------------------------|
| Auth | `backend/src/lib/cognito.ts`, `backend/src/handlers/auth.ts`, `Frontend/src/lib/cognitoAuth.ts` | `AWS::Cognito::UserPool`, `UserPoolClient`, `UserPoolIdentityProvider` (Google), `UserPoolDomain` |
| Network | `backend/src/lib/response.ts` (CORS), API Gateway throttling | `AWS::ApiGatewayV2::Api`, routes, CORS, stage throttling |
| Compute | `backend/src/handlers/router.ts`, per-route handlers, `SignalStreamProcessor` | `AWS::Lambda::Function` (ApiHandler, StreamProcessor), `AWS::Lambda::LayerVersion` |
| Storage | N/A — no file/image uploads in UI | N/A — no uploads |
| Database | `backend/src/lib/dynamodb.ts`, `backend/src/services/*.ts` | `AWS::DynamoDB::Table` with stream, GSI1 |
| Frontend Hosting | `Frontend/cloudformation-template.yaml`, build scripts | `AWS::S3::Bucket`, `AWS::CloudFront::Distribution`, OAC, bucket policy |
The backend plan
