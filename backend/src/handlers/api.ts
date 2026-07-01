import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { z } from 'zod';
import { loadConfig } from '../lib/config.js';
import {
  buildAuthorizeUrl,
  exchangeCodeForTokens,
  extractBearerToken,
  verifyCognitoToken,
} from '../lib/cognito.js';
import { AppError, toErrorResponse } from '../lib/errors.js';
import { corsHeaders, jsonResponse, noContentResponse, withCors } from '../lib/response.js';
import { verifySlackRequestSignature } from '../lib/slack.js';
import {
  ALLOWED_WORKSPACE_NAME,
  isAllowedWorkspaceEmail,
} from '../lib/workspace.js';
import {
  buildGmailAuthorizeUrl,
  buildSlackAuthorizeUrl,
  getMatterConfig,
  getMetrics,
  listAgents,
  listIntegrations,
  listOutputs,
  listSignals,
  listTriggers,
  patchMatterConfig,
  patchTrigger,
  storeGranolaApiKey,
  upsertSignalFromWebhook,
} from '../services/mattar.js';

function getOrigin(event: APIGatewayProxyEventV2): string | undefined {
  return event.headers?.origin ?? event.headers?.Origin;
}

function parseBody(event: APIGatewayProxyEventV2): unknown {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    throw new AppError('Invalid JSON body', 400, 'INVALID_JSON');
  }
}

async function requireUser(event: APIGatewayProxyEventV2, config: ReturnType<typeof loadConfig>) {
  const token = extractBearerToken(
    event.headers?.authorization ?? event.headers?.Authorization,
  );
  if (!token) {
    throw new AppError('Please sign in to continue', 401, 'UNAUTHORIZED');
  }
  return verifyCognitoToken(token, config);
}

function requireWebhookUserSub(userSub: string | undefined): string {
  const normalized = userSub?.trim();
  if (!normalized || normalized === 'demo-user') {
    throw new AppError('Authenticated user is required for webhooks', 401, 'UNAUTHORIZED');
  }
  return normalized;
}

function matchPath(method: string, path: string, pattern: string, httpMethod: string): boolean {
  if (method !== httpMethod) return false;
  const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
  return regex.test(path);
}

function extractParam(path: string, pattern: string, name: string): string | null {
  const names: string[] = [];
  const regexStr = pattern.replace(/:([^/]+)/g, (_, n) => {
    names.push(n);
    return '([^/]+)';
  });
  const match = path.match(new RegExp('^' + regexStr + '$'));
  if (!match) return null;
  const idx = names.indexOf(name);
  return idx >= 0 ? match[idx + 1] : null;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyResultV2> => {
  const config = loadConfig();
  const origin = getOrigin(event);
  const method = event.requestContext.http.method;
  const path = event.rawPath;

  if (method === 'OPTIONS') {
    return noContentResponse(origin, config.allowedOrigins);
  }

  try {
    let result: APIGatewayProxyResultV2;

    if (matchPath(method, path, '/api/v1/auth/authorize-url', 'GET')) {
      const state = crypto.randomUUID();
      result = jsonResponse(200, { url: buildAuthorizeUrl(config, state), state });
    } else if (matchPath(method, path, '/api/v1/auth/callback', 'GET')) {
      const code = event.queryStringParameters?.code;
      if (!code) throw new AppError('Sign-in was cancelled', 400, 'MISSING_CODE');
      const tokens = await exchangeCodeForTokens(code, config);
      const user = await verifyCognitoToken(tokens.idToken, config);
      if (!isAllowedWorkspaceEmail(user.email)) {
        throw new AppError(
          `Sign in with your ${ALLOWED_WORKSPACE_NAME} Google Workspace account to continue`,
          403,
          'FORBIDDEN_DOMAIN',
        );
      }
      result = jsonResponse(200, tokens);
    } else if (matchPath(method, path, '/api/v1/auth/session', 'GET')) {
      const user = await requireUser(event, config);
      const email = user.email.trim().toLowerCase();
      if (!isAllowedWorkspaceEmail(email)) {
        throw new AppError(
          `Sign in with your ${ALLOWED_WORKSPACE_NAME} Google Workspace account to continue`,
          403,
          'FORBIDDEN_DOMAIN',
        );
      }
      const givenName = user.givenName ?? user.name.split(/\s+/)[0] ?? 'User';
      result = jsonResponse(200, {
        email: user.email,
        fullName: user.name,
        firstName: givenName,
        initials: givenName.slice(0, 2).toUpperCase(),
        workspace: ALLOWED_WORKSPACE_NAME,
        role: 'Owner',
        provider: 'google',
      });
    } else if (matchPath(method, path, '/api/v1/integrations', 'GET')) {
      const user = await requireUser(event, config);
      result = jsonResponse(200, await listIntegrations(config, user.sub));
    } else if (matchPath(method, path, '/api/v1/integrations/:type/authorize', 'POST')) {
      const user = await requireUser(event, config);
      const type = extractParam(path, '/api/v1/integrations/:type/authorize', 'type');
      const state = `${user.sub}:${type}:${crypto.randomUUID()}`;
      let url: string;
      if (type === 'slack') url = buildSlackAuthorizeUrl(config, state);
      else if (type === 'gmail') url = buildGmailAuthorizeUrl(config, state);
      else throw new AppError('Unsupported integration type', 400, 'INVALID_TYPE');
      result = jsonResponse(200, { url, state });
    } else if (matchPath(method, path, '/api/v1/integrations/granola/credentials', 'PUT')) {
      const user = await requireUser(event, config);
      const body = z.object({ apiKey: z.string().min(8) }).parse(parseBody(event));
      const integration = await storeGranolaApiKey(config, user.sub, body.apiKey);
      result = jsonResponse(200, integration);
    } else if (matchPath(method, path, '/api/v1/signals', 'GET')) {
      const user = await requireUser(event, config);
      result = jsonResponse(200, await listSignals(config, user.sub));
    } else if (matchPath(method, path, '/api/v1/outputs', 'GET')) {
      const user = await requireUser(event, config);
      result = jsonResponse(200, await listOutputs(config, user.sub));
    } else if (matchPath(method, path, '/api/v1/metrics/today', 'GET')) {
      const user = await requireUser(event, config);
      result = jsonResponse(200, await getMetrics(config, user.sub));
    } else if (matchPath(method, path, '/api/v1/input-triggers', 'GET')) {
      const user = await requireUser(event, config);
      result = jsonResponse(200, await listTriggers(config, user.sub));
    } else if (matchPath(method, path, '/api/v1/input-triggers/:id', 'PATCH')) {
      const user = await requireUser(event, config);
      const id = extractParam(path, '/api/v1/input-triggers/:id', 'id')!;
      const body = z.object({ enabled: z.boolean() }).parse(parseBody(event));
      const updated = await patchTrigger(config, user.sub, id, body.enabled);
      if (!updated) throw new AppError('Trigger not found', 404, 'NOT_FOUND');
      result = jsonResponse(200, updated);
    } else if (matchPath(method, path, '/api/v1/output-agents', 'GET')) {
      const user = await requireUser(event, config);
      result = jsonResponse(200, await listAgents(config, user.sub));
    } else if (matchPath(method, path, '/api/v1/matter-config', 'GET')) {
      const user = await requireUser(event, config);
      result = jsonResponse(200, await getMatterConfig(config, user.sub));
    } else if (matchPath(method, path, '/api/v1/matter-config', 'PATCH')) {
      const user = await requireUser(event, config);
      const body = z
        .object({
          prompt: z.string().optional(),
          temperature: z.number().min(0).max(1).optional(),
          priorityThreshold: z.number().min(0).max(100).optional(),
          autoRoute: z.boolean().optional(),
        })
        .parse(parseBody(event));
      result = jsonResponse(200, await patchMatterConfig(config, user.sub, body));
    } else if (matchPath(method, path, '/api/v1/webhooks/slack', 'POST')) {
      const rawBody = event.body ?? '';
      verifySlackRequestSignature(
        config.slackSigningSecret,
        event.headers?.['x-slack-signature'] ?? event.headers?.['X-Slack-Signature'],
        event.headers?.['x-slack-request-timestamp'] ??
          event.headers?.['X-Slack-Request-Timestamp'],
        rawBody,
      );
      const body = parseBody(event) as { userSub?: string; signal?: Record<string, unknown> };
      const userSub = requireWebhookUserSub(body.userSub);
      const signal = {
        id: `sig-${Date.now()}`,
        source: String(body.signal?.source ?? '#webhook'),
        integration: 'slack' as const,
        preview: String(body.signal?.preview ?? 'New Slack message'),
        receivedAt: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        priority: 'active' as const,
        matterScore: Number(body.signal?.matterScore ?? 75),
      };
      await upsertSignalFromWebhook(config, userSub, signal);
      result = jsonResponse(200, { ok: true, signal });
    } else if (matchPath(method, path, '/api/v1/webhooks/google', 'POST')) {
      const user = await requireUser(event, config);
      const body = parseBody(event) as { signal?: Record<string, unknown> };
      const userSub = user.sub;
      const signal = {
        id: `sig-${Date.now()}`,
        source: String(body.signal?.source ?? 'gmail@york.ie'),
        integration: 'gmail' as const,
        preview: String(body.signal?.preview ?? 'New Gmail message'),
        receivedAt: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        priority: 'active' as const,
        matterScore: Number(body.signal?.matterScore ?? 80),
      };
      await upsertSignalFromWebhook(config, userSub, signal);
      result = jsonResponse(200, { ok: true, signal });
    } else {
      result = jsonResponse(404, { error: 'Not found', code: 'NOT_FOUND' });
    }

    return withCors(result, origin, config.allowedOrigins);
  } catch (err) {
    const { statusCode, body } = toErrorResponse(err);
    return withCors(jsonResponse(statusCode, body), origin, config.allowedOrigins);
  }
};
