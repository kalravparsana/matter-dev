import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { config } from '../lib/config.js';
import { requireAuth } from '../lib/auth.js';
import { AppError, handleError } from '../lib/errors.js';
import { jsonResponse, redirectResponse, parseBody, corsHeaders } from '../lib/response.js';
import {
  createStateToken,
  signState,
  verifySignedState,
  storeOAuthState,
  consumeOAuthState,
} from '../lib/oauth-state.js';
import {
  listIntegrations,
  upsertIntegration,
  deleteIntegration,
  validateGranolaApiKey,
} from '../services/integrations.js';
import {
  listSignals,
  listOutputs,
  listInputTriggers,
  listOutputAgents,
  getMetrics,
  getMatterConfig,
  updateMatterConfig,
  updateInputTrigger,
  updateOutputAgent,
  getUserProfile,
  upsertUserProfile,
} from '../services/data.js';

const granolaSchema = z.object({ apiKey: z.string().min(8) });
const matterPatchSchema = z.object({
  prompt: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  priorityThreshold: z.number().min(0).max(100).optional(),
  autoRoute: z.boolean().optional(),
});
const triggerPatchSchema = z.object({ enabled: z.boolean() });
const agentPatchSchema = z.object({
  status: z.enum(['ready', 'running', 'paused', 'error']).optional(),
});

function origin(event: APIGatewayProxyEventV2): string | undefined {
  return event.headers?.origin ?? event.headers?.Origin;
}

function path(event: APIGatewayProxyEventV2): string {
  return event.rawPath ?? event.requestContext?.http?.path ?? '/';
}

function method(event: APIGatewayProxyEventV2): string {
  return event.requestContext?.http?.method ?? 'GET';
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const reqOrigin = origin(event);
  const reqMethod = method(event);
  const reqPath = path(event);

  if (reqMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(reqOrigin) };
  }

  try {
    // Auth — Cognito
    if (reqPath === '/api/v1/auth/cognito/authorize' && reqMethod === 'GET') {
      if (!config.cognitoDomain || !config.cognitoClientId) {
        throw new AppError(503, 'Sign-in is not set up yet', 'AUTH_NOT_CONFIGURED');
      }
      const redirectUri = config.oauthRedirectUri;
      const state = signState(createStateToken());
      const params = new URLSearchParams({
        client_id: config.cognitoClientId,
        response_type: 'code',
        scope: 'openid email profile',
        redirect_uri: redirectUri,
        state,
        identity_provider: 'Google',
      });
      return redirectResponse(`https://${config.cognitoDomain}/oauth2/authorize?${params}`, reqOrigin);
    }

    if (reqPath === '/api/v1/auth/callback' && reqMethod === 'GET') {
      const code = event.queryStringParameters?.code;
      const state = event.queryStringParameters?.state;
      if (!code || !state) throw new AppError(400, 'Missing authorization code', 'INVALID_CALLBACK');

      const tokenRes = await fetch(`https://${config.cognitoDomain}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: config.cognitoClientId,
          code,
          redirect_uri: config.oauthRedirectUri,
        }),
      });

      if (!tokenRes.ok) {
        throw new AppError(401, 'Could not complete sign-in', 'TOKEN_EXCHANGE_FAILED');
      }

      const tokens = (await tokenRes.json()) as {
        id_token: string;
        access_token: string;
        refresh_token?: string;
      };

      const { verifyCognitoToken } = await import('../lib/auth.js');
      const auth = await verifyCognitoToken(tokens.id_token);

      const firstName = auth.name?.split(/\s+/)[0] ?? 'User';
      const initials = auth.name
        ? auth.name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()
        : '??';

      await upsertUserProfile(auth.sub, {
        email: auth.email,
        fullName: auth.name ?? auth.email,
        firstName,
        initials,
        workspace: 'Meridian',
        role: 'Owner',
      });

      const redirect = `${config.frontendOrigin}/auth/callback#` +
        new URLSearchParams({
          id_token: tokens.id_token,
          access_token: tokens.access_token,
          state,
        }).toString();
      return redirectResponse(redirect, reqOrigin);
    }

    if (reqPath === '/api/v1/auth/me' && reqMethod === 'GET') {
      const auth = await requireAuth(event);
      const profile = await getUserProfile(auth.sub);
      return jsonResponse(200, { user: profile ?? { email: auth.email } }, reqOrigin);
    }

    if (reqPath === '/api/v1/auth/logout' && reqMethod === 'POST') {
      return jsonResponse(200, { ok: true }, reqOrigin);
    }

    // Integrations — Slack OAuth
    if (reqPath === '/api/v1/integrations/slack/authorize' && reqMethod === 'POST') {
      const auth = await requireAuth(event);
      if (!config.slackClientId) {
        throw new AppError(503, 'Slack integration is not configured', 'SLACK_NOT_CONFIGURED');
      }
      const state = createStateToken();
      await storeOAuthState(state, {
        userId: auth.sub,
        provider: 'slack',
        redirectAfter: `${config.frontendOrigin}/integrations`,
      });
      const signed = signState(state);
      const params = new URLSearchParams({
        client_id: config.slackClientId,
        scope: 'channels:read,chat:write,users:read',
        redirect_uri: config.slackRedirectUri,
        state: signed,
      });
      return jsonResponse(200, { authorizeUrl: `https://slack.com/oauth/v2/authorize?${params}` }, reqOrigin);
    }

    if (reqPath === '/api/v1/integrations/slack/callback' && reqMethod === 'GET') {
      const code = event.queryStringParameters?.code;
      const signedState = event.queryStringParameters?.state ?? '';
      const state = verifySignedState(signedState);
      if (!code || !state) throw new AppError(400, 'Invalid Slack callback', 'INVALID_CALLBACK');

      const oauthRecord = await consumeOAuthState(state);
      if (!oauthRecord) throw new AppError(400, 'OAuth session expired', 'STATE_EXPIRED');

      const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: config.slackClientId,
          client_secret: config.slackClientSecret,
          code,
          redirect_uri: config.slackRedirectUri,
        }),
      });
      const tokenData = (await tokenRes.json()) as {
        ok: boolean;
        access_token?: string;
        team?: { name?: string };
      };
      if (!tokenData.ok || !tokenData.access_token) {
        throw new AppError(400, 'Slack authorization failed', 'SLACK_AUTH_FAILED');
      }

      await upsertIntegration(oauthRecord.userId, 'slack', {
        status: 'connected',
        channel: tokenData.team?.name ?? 'Slack workspace',
        accessToken: tokenData.access_token,
        signalsToday: 0,
        lastSync: 'Just now',
      });

      return redirectResponse(`${oauthRecord.redirectAfter}?connected=slack`, reqOrigin);
    }

    // Integrations — Gmail OAuth
    if (reqPath === '/api/v1/integrations/gmail/authorize' && reqMethod === 'POST') {
      const auth = await requireAuth(event);
      if (!config.googleClientId) {
        throw new AppError(503, 'Gmail integration is not configured', 'GMAIL_NOT_CONFIGURED');
      }
      const state = createStateToken();
      await storeOAuthState(state, {
        userId: auth.sub,
        provider: 'gmail',
        redirectAfter: `${config.frontendOrigin}/integrations`,
      });
      const signed = signState(state);
      const params = new URLSearchParams({
        client_id: config.googleClientId,
        redirect_uri: config.gmailRedirectUri,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/gmail.readonly email profile',
        access_type: 'offline',
        prompt: 'consent',
        state: signed,
      });
      return jsonResponse(
        200,
        { authorizeUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}` },
        reqOrigin,
      );
    }

    if (reqPath === '/api/v1/integrations/gmail/callback' && reqMethod === 'GET') {
      const code = event.queryStringParameters?.code;
      const signedState = event.queryStringParameters?.state ?? '';
      const state = verifySignedState(signedState);
      if (!code || !state) throw new AppError(400, 'Invalid Gmail callback', 'INVALID_CALLBACK');

      const oauthRecord = await consumeOAuthState(state);
      if (!oauthRecord) throw new AppError(400, 'OAuth session expired', 'STATE_EXPIRED');

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: config.googleClientId,
          client_secret: config.googleClientSecret,
          code,
          redirect_uri: config.gmailRedirectUri,
          grant_type: 'authorization_code',
        }),
      });
      const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
      if (!tokenData.access_token) {
        throw new AppError(400, 'Gmail authorization failed', 'GMAIL_AUTH_FAILED');
      }

      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile = (await profileRes.json()) as { email?: string };

      await upsertIntegration(oauthRecord.userId, 'gmail', {
        status: 'connected',
        account: profile.email ?? 'Gmail account',
        accessToken: tokenData.access_token,
        signalsToday: 0,
        lastSync: 'Just now',
      });

      return redirectResponse(`${oauthRecord.redirectAfter}?connected=gmail`, reqOrigin);
    }

    // Integrations — Granola API key
    if (reqPath === '/api/v1/integrations/granola' && reqMethod === 'POST') {
      const auth = await requireAuth(event);
      const body = parseBody<unknown>(event.body);
      const parsed = granolaSchema.safeParse(body);
      if (!parsed.success) {
        throw new AppError(400, 'A valid Granola API key is required', 'VALIDATION_ERROR');
      }
      const valid = await validateGranolaApiKey(parsed.data.apiKey);
      if (!valid) {
        throw new AppError(400, 'Granola API key is invalid', 'INVALID_API_KEY');
      }
      const integration = await upsertIntegration(auth.sub, 'granola', {
        status: 'syncing',
        account: 'Meeting notes',
        accessToken: parsed.data.apiKey,
        signalsToday: 0,
        lastSync: 'Syncing…',
      });
      return jsonResponse(201, { integration }, reqOrigin);
    }

    if (reqPath === '/api/v1/integrations' && reqMethod === 'GET') {
      const auth = await requireAuth(event);
      const items = await listIntegrations(auth.sub);
      return jsonResponse(200, { integrations: items }, reqOrigin);
    }

    if (reqPath === '/api/v1/integrations/catalog' && reqMethod === 'GET') {
      return jsonResponse(
        200,
        {
          catalog: [
            { type: 'slack', description: 'Channels, DMs, and thread mentions from your workspace' },
            { type: 'gmail', description: 'Inbox threads and replies' },
            { type: 'granola', description: 'Meeting notes and extracted action items' },
          ],
        },
        reqOrigin,
      );
    }

    const integrationDeleteMatch = reqPath.match(/^\/api\/v1\/integrations\/([^/]+)$/);
    if (integrationDeleteMatch && reqMethod === 'DELETE') {
      const auth = await requireAuth(event);
      await deleteIntegration(auth.sub, integrationDeleteMatch[1]);
      return jsonResponse(204, {}, reqOrigin);
    }

    // Domain resources
    if (reqPath === '/api/v1/signals' && reqMethod === 'GET') {
      const auth = await requireAuth(event);
      return jsonResponse(200, { signals: await listSignals(auth.sub) }, reqOrigin);
    }

    if (reqPath === '/api/v1/outputs' && reqMethod === 'GET') {
      const auth = await requireAuth(event);
      return jsonResponse(200, { outputs: await listOutputs(auth.sub) }, reqOrigin);
    }

    if (reqPath === '/api/v1/input-triggers' && reqMethod === 'GET') {
      const auth = await requireAuth(event);
      return jsonResponse(200, { triggers: await listInputTriggers(auth.sub) }, reqOrigin);
    }

    const triggerPatchMatch = reqPath.match(/^\/api\/v1\/input-triggers\/([^/]+)$/);
    if (triggerPatchMatch && reqMethod === 'PATCH') {
      const auth = await requireAuth(event);
      const body = parseBody<unknown>(event.body);
      const parsed = triggerPatchSchema.safeParse(body);
      if (!parsed.success) throw new AppError(400, 'Invalid trigger update', 'VALIDATION_ERROR');
      const trigger = await updateInputTrigger(auth.sub, triggerPatchMatch[1], parsed.data);
      return jsonResponse(200, { trigger }, reqOrigin);
    }

    if (reqPath === '/api/v1/output-agents' && reqMethod === 'GET') {
      const auth = await requireAuth(event);
      return jsonResponse(200, { agents: await listOutputAgents(auth.sub) }, reqOrigin);
    }

    const agentPatchMatch = reqPath.match(/^\/api\/v1\/output-agents\/([^/]+)$/);
    if (agentPatchMatch && reqMethod === 'PATCH') {
      const auth = await requireAuth(event);
      const body = parseBody<unknown>(event.body);
      const parsed = agentPatchSchema.safeParse(body);
      if (!parsed.success) throw new AppError(400, 'Invalid agent update', 'VALIDATION_ERROR');
      const agent = await updateOutputAgent(auth.sub, agentPatchMatch[1], parsed.data);
      return jsonResponse(200, { agent }, reqOrigin);
    }

    if (reqPath === '/api/v1/metrics' && reqMethod === 'GET') {
      const auth = await requireAuth(event);
      const metrics = await getMetrics(auth.sub);
      return jsonResponse(200, { metrics }, reqOrigin);
    }

    if (reqPath === '/api/v1/matter-config' && reqMethod === 'GET') {
      const auth = await requireAuth(event);
      const matterConfig = await getMatterConfig(auth.sub);
      return jsonResponse(200, { matterConfig }, reqOrigin);
    }

    if (reqPath === '/api/v1/matter-config' && reqMethod === 'PATCH') {
      const auth = await requireAuth(event);
      const body = parseBody<unknown>(event.body);
      const parsed = matterPatchSchema.safeParse(body);
      if (!parsed.success) throw new AppError(400, 'Invalid matter config', 'VALIDATION_ERROR');
      const profile = await getUserProfile(auth.sub);
      const matterConfig = await updateMatterConfig(auth.sub, {
        ...parsed.data,
        editedBy: profile?.fullName ?? auth.email,
      });
      return jsonResponse(200, { matterConfig }, reqOrigin);
    }

    return jsonResponse(404, { error: { code: 'NOT_FOUND', message: 'Route not found' } }, reqOrigin);
  } catch (err) {
    const { statusCode, body } = handleError(err);
    return jsonResponse(statusCode, body, reqOrigin);
  }
}
