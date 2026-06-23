# Backend Plan — Mattar R1 / Release 1.0.0

**Execution mode:** Serverless (AWS CloudFormation)  
**Integration UI root:** `Frontend/`  
**Release scope:** Initial release — Slack OAuth, Gmail OAuth (Cognito federation), Granola API key integrations

---

## Preview UI Logic Requirements

| Route | Element | Required behavior | API mapping |
|-------|---------|-------------------|-------------|
| `/integrations` | StatusBadge (Slack) | Slack OAuth connection | `POST /api/v1/integrations/slack/authorize` → Slack OAuth; callback stores tokens; status `connected` |
| `/integrations` | StatusBadge (Gmail) | Gmail OAuth connection | Cognito-federated Google OAuth with Gmail scopes via `POST /api/v1/integrations/gmail/authorize` |
| `/integrations` | ConnectedPlatformCard (Granola) | Granola API key | `POST /api/v1/integrations/granola` with `{ apiKey }`; validates key; status `syncing`/`connected` |

---

## Data Model (from UI)

Single DynamoDB table `MattarTable` (PK/SK):

| Entity | PK | SK | Fields (match `mattar.ts`) |
|--------|----|----|---------------------------|
| Profile | `USER#{sub}` | `PROFILE` | email, fullName, firstName, initials, workspace, role |
| Integration | `USER#{sub}` | `INTEGRATION#{type}` | id, name, type, status, lastSync, signalsToday, channel/account |
| InputSignal | `USER#{sub}` | `SIGNAL#{id}` | source, integration, preview, receivedAt, priority, matterScore |
| OutputAction | `USER#{sub}` | `OUTPUT#{id}` | name, integration, kind, lastRun, status, todayCount |
| InputTrigger | `USER#{sub}` | `TRIGGER#{id}` | integration, kind, label, description, enabled, eventsToday, lastEvent |
| OutputAgent | `USER#{sub}` | `AGENT#{id}` | integration, kind, name, description, status, lastRun, todayCount |
| MatterConfig | `USER#{sub}` | `CONFIG#matter` | prompt, temperature, priorityThreshold, autoRoute, lastEdited, editedBy |
| Metrics | `USER#{sub}` | `METRICS` | signalsIn, matterFiltered, actionsRouted, pendingReview, avgResponseMin |
| OAuthState | `OAUTH#{state}` | `STATE` | userId, provider, redirectUri, TTL |

Static catalog (`platformCatalog`, `integrationMeta`) remains frontend constants.

---

## API Contract (`/api/v1/...`)

### Auth (Cognito)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/auth/cognito/authorize` | Redirect to Cognito hosted UI (Google federation) |
| GET | `/api/v1/auth/callback` | Exchange code for tokens; verify JWT; return session |
| GET | `/api/v1/auth/me` | Current user profile (JWT required) |
| POST | `/api/v1/auth/logout` | Invalidate session (client clears storage) |

### Integrations

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/integrations` | List user integrations |
| GET | `/api/v1/integrations/catalog` | Available platforms (static) |
| POST | `/api/v1/integrations/slack/authorize` | Start Slack OAuth (signed state) |
| GET | `/api/v1/integrations/slack/callback` | Slack OAuth callback |
| POST | `/api/v1/integrations/gmail/authorize` | Start Gmail OAuth via Cognito/Google |
| GET | `/api/v1/integrations/gmail/callback` | Gmail OAuth callback |
| POST | `/api/v1/integrations/granola` | Connect Granola with API key body `{ apiKey }` |
| DELETE | `/api/v1/integrations/:id` | Disconnect integration |

### Domain resources

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/signals` | Input signals for radar |
| GET | `/api/v1/outputs` | Routed output actions |
| GET | `/api/v1/input-triggers` | List triggers |
| PATCH | `/api/v1/input-triggers/:id` | Toggle `enabled` |
| GET | `/api/v1/output-agents` | List output agents |
| PATCH | `/api/v1/output-agents/:id` | Update agent status |
| GET | `/api/v1/metrics` | Insight pipeline metrics |
| GET | `/api/v1/matter-config` | Matter agent config |
| PATCH | `/api/v1/matter-config` | Update prompt/settings |

All protected routes require `Authorization: Bearer <Cognito ID token>`.

---

## Shared Utility Layer (`backend/src/lib/`)

- `config.ts` — env loader (Cognito, DynamoDB, OAuth client IDs)
- `auth.ts` — JWKS JWT verification, API Gateway authorizer helper
- `errors.ts` — AppError + centralized handler
- `response.ts` — JSON helpers, CORS headers
- `db.ts` — DynamoDB DocumentClient accessor
- `logger.ts` — structured logging
- `oauth-state.ts` — signed state for Slack/Gmail OAuth
- `router.ts` — HTTP API route dispatch

---

## Auth Flow (Cognito + Google)

1. SPA redirects to `GET /api/v1/auth/cognito/authorize` with PKCE.
2. Backend redirects to Cognito hosted UI (`COGNITO_DOMAIN`) with Google IdP.
3. Callback `GET /api/v1/auth/callback?code=&state=` exchanges code at Cognito token endpoint.
4. Verify ID token (JWKS, iss, aud, exp).
5. Frontend stores tokens; sends Bearer on API calls.

Gmail **integration** uses separate Google OAuth scopes (Gmail API) with tokens stored encrypted in DynamoDB — initiated via integration authorize endpoint, not login bypass.

---

## Storage

**N/A — no uploads.** UI has no file/image upload surfaces.

---

## Environment Variables

### `backend/.env.example`

- `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_REGION`, `COGNITO_DOMAIN`
- `OAUTH_REDIRECT_URI`, `FRONTEND_ORIGIN`
- `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_REDIRECT_URI`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Gmail integration scopes)
- `GRANOLA_API_BASE_URL`
- `DYNAMODB_TABLE_NAME`
- `OAUTH_STATE_SECRET`

### `Frontend/.env.example`

- `VITE_API_BASE_URL`
- `VITE_COGNITO_DOMAIN`, `VITE_COGNITO_CLIENT_ID`, `VITE_COGNITO_REDIRECT_URI`
- `VITE_COGNITO_REGION`

---

## Unified Deploy Script (CloudFormation)

Root `deploy.sh`: Phase A Lambda zip → S3; Phase B backend CFN; Phase C frontend CFN (parallel); Phase D documented (build SPA, sync S3, invalidate CloudFront).

Control vars: `INFRA_STACK`, `DEPLOY_ENVIRONMENT`, `BACKEND_STACK_NAME`, `FRONTEND_STACK_NAME`.

---

## Frontend Wire-up

1. Add `src/lib/api/client.ts` — fetch wrapper with Bearer token.
2. Add `src/lib/api/*.ts` per resource.
3. Replace direct `mattar.ts` imports in pages with React hooks calling API.
4. Update `AuthContext` for Cognito tokens.
5. Wire `IntegrationsPage` connect modal to OAuth/API-key flows.

---

## Backend Components Coverage Report

| Component | Application (planned files) | Infrastructure (planned IaC) |
|-----------|----------------------------|------------------------------|
| Auth | `src/lib/auth.ts`, `src/handlers/auth.ts`, Cognito callback | `AWS::Cognito::UserPool`, `UserPoolClient`, `UserPoolIdentityProvider` (Google), `HttpApiAuthorizer` |
| Network | `src/lib/response.ts` (CORS), API Gateway throttling | `AWS::ApiGatewayV2::Api`, `Stage`, `Route`, CORS config |
| Compute | `src/handlers/router.ts`, resource handlers | `AWS::Lambda::Function`, `Permission`, IAM role |
| Storage | N/A — no uploads | N/A — no uploads (no file upload UI) |
| Database | `src/lib/db.ts`, `src/services/*.ts`, `src/seed/seed.ts` | `AWS::DynamoDB::Table` + GSI |
| Frontend Hosting | `Frontend` build + env | `Frontend/cloudformation-template.yaml`: S3, CloudFront OAC, bucket policy |
