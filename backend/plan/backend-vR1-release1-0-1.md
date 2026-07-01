# Backend Plan — R1 / Release 1.0.1

**Execution mode:** Serverless (AWS CloudFormation)  
**Integration UI root:** `Frontend/`  
**Release scope:** Patch release — verify Cognito auth, serverless API/DynamoDB stack, frontend S3+CloudFront hosting, deploy script, and complete Playwright coverage for all routes.

---

## Preview UI Logic Mapping

No preview UI logic notes for this release.

---

## API Contract

Unchanged from release 1.0.0. All endpoints use structured `/api/v1/<resource>[/:id]` paths.

### Auth (Cognito)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/auth/callback` | OAuth callback — exchange code for Cognito tokens |
| GET | `/api/v1/auth/session` | Return current user profile from verified Cognito JWT |
| GET | `/api/v1/auth/authorize-url` | Return Cognito Hosted UI URL with PKCE state |

### Integrations

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/integrations` | List connected integrations |
| POST | `/api/v1/integrations/:type/authorize` | Start OAuth for `slack` or `gmail` |
| PUT | `/api/v1/integrations/granola/credentials` | Store Granola API key `{ apiKey }` |

### Today / Radar

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/signals` | Input signals array |
| GET | `/api/v1/outputs` | Routed output actions |
| GET | `/api/v1/metrics/today` | Insight metrics |

### Configuration

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/input-triggers` | Input triggers list |
| PATCH | `/api/v1/input-triggers/:id` | Toggle `enabled` |
| GET | `/api/v1/output-agents` | Output agents list |
| GET | `/api/v1/matter-config` | Matter agent config |
| PATCH | `/api/v1/matter-config` | Update prompt, temperature, threshold, autoRoute |

### Webhooks

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/webhooks/slack` | Slack Events API (signature-verified) |
| POST | `/api/v1/webhooks/google` | Gmail push notifications |

---

## DynamoDB Single-Table Design

**Table:** `MattarTable` — PK `USER#<cognitoSub>`, SK patterns for profile, integrations, signals, outputs, triggers, agents, config. GSI1 for signals by time. DynamoDB Stream → `SignalStreamProcessor` Lambda.

---

## Shared Utility Layer

`backend/src/lib/` — config, cognito (JWKS verify), dynamodb client, errors, response helpers, logger, slack signature verification. `backend/src/services/mattar.ts` — domain logic.

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

Integration UI (`Frontend/`) already wires mock → live via `src/lib/api.ts`, `src/lib/cognitoAuth.ts`, and `src/hooks/useMattarData.ts`. Mock fallback when `VITE_API_BASE_URL` is unset.

---

## Unified Deploy Script

Root `deploy.sh`: Phase A Lambda zip → S3; Phase B backend CFN; Phase C frontend CFN (parallel); Phase D `publish_frontend_assets` (outputs → env → build → s3 sync → CloudFront invalidation).

Control env vars: `INFRA_STACK`, `DEPLOY_ENVIRONMENT`, `BACKEND_STACK_NAME`, `FRONTEND_STACK_NAME`.

Materialized files: `backend/parameters.json`, `Frontend/parameters.json`, `backend/.env`, `Frontend/.env`.

---

## Release 1.0.1 Changes

1. Add committed `.env.example` files for backend and Frontend.
2. Extend Playwright coverage to `/integrations`, `/inputs`, `/matter`, `/outputs` (8 spec files per route).
3. Verify `deploy.sh` Phase A–D contract against existing CloudFormation templates.

---

## Backend Components Coverage Report

| Component | Application (planned files) | Infrastructure (planned IaC resources) |
|-----------|---------------------------|----------------------------------------|
| Auth | `backend/src/lib/cognito.ts`, `backend/src/handlers/api.ts`, `Frontend/src/lib/cognitoAuth.ts` | `AWS::Cognito::UserPool`, `UserPoolClient`, `UserPoolIdentityProvider` (Google), `UserPoolDomain` |
| Network | `backend/src/lib/response.ts` (CORS), API Gateway throttling | `AWS::ApiGatewayV2::Api`, routes, CORS, stage throttling |
| Compute | `backend/src/handlers/api.ts`, `stream-processor.ts` | `AWS::Lambda::Function` (ApiHandler, StreamProcessor) |
| Storage | N/A — no file/image uploads in UI | N/A — no uploads |
| Database | `backend/src/lib/dynamodb.ts`, `backend/src/services/mattar.ts` | `AWS::DynamoDB::Table` with stream, GSI1 |
| Frontend Hosting | `Frontend/cloudformation-template.yaml`, build scripts | `AWS::S3::Bucket`, `AWS::CloudFront::Distribution`, OAC, bucket policy |
