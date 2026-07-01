import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { getDocClient, SK, userPk } from '../lib/dynamodb.js';
import type { AppConfig } from '../lib/config.js';

export type ConnectionStatus =
  | 'connected'
  | 'syncing'
  | 'error'
  | 'disconnected'
  | 'available';

export type CoreIntegrationType = 'slack' | 'gmail' | 'granola';

export interface IntegrationRecord {
  id: string;
  name: string;
  type: CoreIntegrationType;
  status: ConnectionStatus;
  lastSync: string;
  signalsToday: number;
  channel?: string;
  account?: string;
}

export interface InputSignal {
  id: string;
  source: string;
  integration: CoreIntegrationType;
  preview: string;
  receivedAt: string;
  priority: 'hot' | 'active' | 'queued' | 'routed' | 'idle';
  matterScore: number;
}

export interface OutputAction {
  id: string;
  name: string;
  integration: CoreIntegrationType;
  kind: string;
  lastRun: string;
  status: 'ready' | 'running' | 'paused' | 'error';
  todayCount: number;
}

export interface InsightMetrics {
  signalsIn: number;
  matterFiltered: number;
  actionsRouted: number;
  pendingReview: number;
  avgResponseMin: number;
}

export interface InputTrigger {
  id: string;
  integration: CoreIntegrationType;
  kind: string;
  label: string;
  description: string;
  enabled: boolean;
  eventsToday: number;
  lastEvent: string;
}

export interface OutputAgent {
  id: string;
  integration: CoreIntegrationType;
  kind: string;
  name: string;
  description: string;
  status: 'ready' | 'running' | 'paused' | 'error';
  lastRun: string;
  todayCount: number;
}

export interface MatterConfig {
  prompt: string;
  temperature: number;
  priorityThreshold: number;
  autoRoute: boolean;
  lastEdited: string;
  editedBy: string;
}

/** Demo records written by older ensureUserSeed versions — safe to delete once per user. */
const LEGACY_DEMO_INTEGRATION_IDS = new Set(['int-1', 'int-2', 'int-3']);
const LEGACY_DEMO_SIGNAL_IDS = [
  'sig-1',
  'sig-2',
  'sig-3',
  'sig-4',
  'sig-5',
  'sig-6',
  'sig-7',
];
const LEGACY_DEMO_OUTPUT_IDS = ['out-1', 'out-2', 'out-3', 'out-4'];
const LEGACY_DEMO_TRIGGER_IDS = ['trg-1', 'trg-2', 'trg-3', 'trg-4'];
const LEGACY_DEMO_AGENT_IDS = ['agent-1', 'agent-2'];

const DEFAULT_MATTER: MatterConfig = {
  prompt: `You are the Matter agent. Surface only what needs human attention today.

Prioritize revenue risk, team blockers with deadlines, and customer escalations.
Deprioritize FYI threads, self-resolved alerts, and scheduling without decisions.`,
  temperature: 0.3,
  priorityThreshold: 70,
  autoRoute: true,
  lastEdited: 'Default',
  editedBy: 'System',
};

async function deleteUserItem(
  config: AppConfig,
  pk: string,
  sk: string,
): Promise<void> {
  const doc = getDocClient();
  await doc.send(
    new DeleteCommand({
      TableName: config.tableName,
      Key: { PK: pk, SK: sk },
    }),
  );
}

/**
 * Removes demo Slack/Gmail/Granola seed rows for accounts created before signup
 * stopped auto-provisioning integrations.
 */
export async function purgeLegacyDemoSeedIfNeeded(
  config: AppConfig,
  userSub: string,
): Promise<void> {
  const doc = getDocClient();
  const pk = userPk(userSub);
  const profileResult = await doc.send(
    new GetCommand({ TableName: config.tableName, Key: { PK: pk, SK: SK.profile } }),
  );
  const profile = profileResult.Item;
  if (!profile?.seeded || profile.demoPurged === true) return;

  const integrations = await queryByPrefix<IntegrationRecord>(config, userSub, 'INTEGRATION#');
  const hasLegacyDemoIntegrations = integrations.some((item) =>
    LEGACY_DEMO_INTEGRATION_IDS.has(item.id),
  );
  if (!hasLegacyDemoIntegrations) return;

  for (const integration of integrations) {
    if (!LEGACY_DEMO_INTEGRATION_IDS.has(integration.id)) continue;
    await deleteUserItem(config, pk, SK.integration(integration.type));
  }

  for (const signalId of LEGACY_DEMO_SIGNAL_IDS) {
    await deleteUserItem(config, pk, SK.signal(signalId));
  }
  for (const outputId of LEGACY_DEMO_OUTPUT_IDS) {
    await deleteUserItem(config, pk, SK.output(outputId));
  }
  for (const triggerId of LEGACY_DEMO_TRIGGER_IDS) {
    await deleteUserItem(config, pk, SK.trigger(triggerId));
  }
  for (const agentId of LEGACY_DEMO_AGENT_IDS) {
    await deleteUserItem(config, pk, SK.agent(agentId));
  }

  await doc.send(
    new UpdateCommand({
      TableName: config.tableName,
      Key: { PK: pk, SK: SK.profile },
      UpdateExpression: 'SET demoPurged = :demoPurged',
      ExpressionAttributeValues: { ':demoPurged': true },
    }),
  );
}

export async function ensureUserSeed(config: AppConfig, userSub: string): Promise<void> {
  const doc = getDocClient();
  const pk = userPk(userSub);
  const existing = await doc.send(
    new GetCommand({ TableName: config.tableName, Key: { PK: pk, SK: SK.profile } }),
  );
  if (existing.Item) {
    await purgeLegacyDemoSeedIfNeeded(config, userSub);
    return;
  }

  const writes = [
    { PK: pk, SK: SK.profile, entityType: 'profile', seeded: true },
    {
      PK: pk,
      SK: SK.matterConfig,
      entityType: 'matterConfig',
      ...DEFAULT_MATTER,
    },
  ];

  for (const item of writes) {
    await doc.send(new PutCommand({ TableName: config.tableName, Item: item }));
  }
}

async function queryByPrefix<T>(
  config: AppConfig,
  userSub: string,
  skPrefix: string,
): Promise<T[]> {
  const doc = getDocClient();
  const result = await doc.send(
    new QueryCommand({
      TableName: config.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': userPk(userSub),
        ':sk': skPrefix,
      },
    }),
  );
  return (result.Items ?? []) as T[];
}

export async function listIntegrations(
  config: AppConfig,
  userSub: string,
): Promise<IntegrationRecord[]> {
  await ensureUserSeed(config, userSub);
  const items = await queryByPrefix<IntegrationRecord>(config, userSub, 'INTEGRATION#');
  return items.map(({ id, name, type, status, lastSync, signalsToday, channel, account }) => ({
    id,
    name,
    type,
    status,
    lastSync,
    signalsToday,
    channel,
    account,
  }));
}

export async function listSignals(config: AppConfig, userSub: string): Promise<InputSignal[]> {
  await ensureUserSeed(config, userSub);
  const items = await queryByPrefix<InputSignal & { GSI1SK?: string }>(
    config,
    userSub,
    'SIGNAL#',
  );
  return items
    .sort((a, b) => (a.GSI1SK ?? '').localeCompare(b.GSI1SK ?? ''))
    .map(({ id, source, integration, preview, receivedAt, priority, matterScore }) => ({
      id,
      source,
      integration,
      preview,
      receivedAt,
      priority,
      matterScore,
    }));
}

export async function listOutputs(config: AppConfig, userSub: string): Promise<OutputAction[]> {
  await ensureUserSeed(config, userSub);
  const items = await queryByPrefix<OutputAction>(config, userSub, 'OUTPUT#');
  return items.map(
    ({ id, name, integration, kind, lastRun, status, todayCount }) => ({
      id,
      name,
      integration,
      kind,
      lastRun,
      status,
      todayCount,
    }),
  );
}

export async function getMetrics(
  config: AppConfig,
  userSub: string,
): Promise<InsightMetrics> {
  const signals = await listSignals(config, userSub);
  const outputs = await listOutputs(config, userSub);
  const matterFiltered = signals.filter((s) => s.matterScore >= 70).length;
  const actionsRouted = outputs.reduce((sum, o) => sum + o.todayCount, 0);

  return {
    signalsIn: signals.length,
    matterFiltered,
    actionsRouted,
    pendingReview: Math.max(0, matterFiltered - actionsRouted),
    avgResponseMin: 4.2,
  };
}

export async function listTriggers(config: AppConfig, userSub: string): Promise<InputTrigger[]> {
  await ensureUserSeed(config, userSub);
  const items = await queryByPrefix<InputTrigger>(config, userSub, 'TRIGGER#');
  return items.map(
    ({ id, integration, kind, label, description, enabled, eventsToday, lastEvent }) => ({
      id,
      integration,
      kind,
      label,
      description,
      enabled,
      eventsToday,
      lastEvent,
    }),
  );
}

export async function patchTrigger(
  config: AppConfig,
  userSub: string,
  triggerId: string,
  enabled: boolean,
): Promise<InputTrigger | null> {
  const doc = getDocClient();
  const pk = userPk(userSub);
  const sk = SK.trigger(triggerId);

  const result = await doc.send(
    new UpdateCommand({
      TableName: config.tableName,
      Key: { PK: pk, SK: sk },
      UpdateExpression: 'SET enabled = :enabled',
      ExpressionAttributeValues: { ':enabled': enabled },
      ReturnValues: 'ALL_NEW',
    }),
  );

  if (!result.Attributes) return null;
  const item = result.Attributes as InputTrigger;
  return {
    id: item.id,
    integration: item.integration,
    kind: item.kind,
    label: item.label,
    description: item.description,
    enabled: item.enabled,
    eventsToday: item.eventsToday,
    lastEvent: item.lastEvent,
  };
}

export async function listAgents(config: AppConfig, userSub: string): Promise<OutputAgent[]> {
  await ensureUserSeed(config, userSub);
  const items = await queryByPrefix<OutputAgent>(config, userSub, 'AGENT#');
  return items.map(
    ({ id, integration, kind, name, description, status, lastRun, todayCount }) => ({
      id,
      integration,
      kind,
      name,
      description,
      status,
      lastRun,
      todayCount,
    }),
  );
}

export async function getMatterConfig(
  config: AppConfig,
  userSub: string,
): Promise<MatterConfig> {
  await ensureUserSeed(config, userSub);
  const doc = getDocClient();
  const result = await doc.send(
    new GetCommand({
      TableName: config.tableName,
      Key: { PK: userPk(userSub), SK: SK.matterConfig },
    }),
  );
  const item = result.Item as MatterConfig;
  return {
    prompt: item.prompt,
    temperature: item.temperature,
    priorityThreshold: item.priorityThreshold,
    autoRoute: item.autoRoute,
    lastEdited: item.lastEdited,
    editedBy: item.editedBy,
  };
}

export async function patchMatterConfig(
  config: AppConfig,
  userSub: string,
  patch: Partial<MatterConfig>,
): Promise<MatterConfig> {
  const current = await getMatterConfig(config, userSub);
  const updated = { ...current, ...patch, lastEdited: 'Just now' };
  const doc = getDocClient();
  await doc.send(
    new PutCommand({
      TableName: config.tableName,
      Item: {
        PK: userPk(userSub),
        SK: SK.matterConfig,
        entityType: 'matterConfig',
        ...updated,
      },
    }),
  );
  return updated;
}

export async function upsertSignalFromWebhook(
  config: AppConfig,
  userSub: string,
  signal: InputSignal,
): Promise<InputSignal> {
  const doc = getDocClient();
  const pk = userPk(userSub);
  await doc.send(
    new PutCommand({
      TableName: config.tableName,
      Item: {
        PK: pk,
        SK: SK.signal(signal.id),
        entityType: 'signal',
        GSI1PK: pk,
        GSI1SK: `SIGNAL#${Date.now()}`,
        ...signal,
      },
    }),
  );
  return signal;
}

export async function storeGranolaApiKey(
  config: AppConfig,
  userSub: string,
  apiKey: string,
): Promise<IntegrationRecord> {
  if (!apiKey || apiKey.trim().length < 8) {
    throw new Error('API key must be at least 8 characters');
  }

  const doc = getDocClient();
  const pk = userPk(userSub);
  const integration: IntegrationRecord = {
    id: `int-granola-${userSub.slice(0, 8)}`,
    name: 'Granola',
    type: 'granola',
    status: 'syncing',
    lastSync: 'Syncing…',
    signalsToday: 0,
    account: 'Meeting notes',
  };

  await doc.send(
    new PutCommand({
      TableName: config.tableName,
      Item: {
        PK: pk,
        SK: SK.integration('granola'),
        entityType: 'integration',
        apiKeyRef: `granola-${userSub.slice(0, 8)}`,
        ...integration,
      },
    }),
  );

  return integration;
}

const SLACK_SCOPES = [
  'channels:history',
  'channels:read',
  'groups:history',
  'groups:read',
  'im:history',
  'im:read',
  'mpim:history',
  'mpim:read',
  'users:read',
].join(',');

export function buildSlackAuthorizeUrl(config: AppConfig, state: string): string {
  if (!config.slackClientId || !config.slackOAuthRedirectUri) {
    throw new Error('Slack integration is not configured');
  }
  const params = new URLSearchParams({
    client_id: config.slackClientId,
    scope: SLACK_SCOPES,
    redirect_uri: config.slackOAuthRedirectUri,
    state,
  });
  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export function buildGmailAuthorizeUrl(config: AppConfig, state: string): string {
  if (!config.googleOAuthClientId || !config.gmailOAuthRedirectUri) {
    throw new Error('Gmail integration is not configured');
  }
  const params = new URLSearchParams({
    client_id: config.googleOAuthClientId,
    response_type: 'code',
    scope: 'openid email https://www.googleapis.com/auth/gmail.readonly',
    redirect_uri: config.gmailOAuthRedirectUri,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function parseIntegrationOAuthState(
  state: string,
): { userSub: string; type: CoreIntegrationType } {
  const parts = state.split(':');
  if (parts.length < 3) {
    throw new Error('Invalid OAuth state');
  }
  const type = parts[1] as CoreIntegrationType;
  if (type !== 'slack' && type !== 'gmail') {
    throw new Error('Invalid integration type in OAuth state');
  }
  return { userSub: parts[0], type };
}

export function getIntegrationCallbackRedirect(
  config: AppConfig,
  type: CoreIntegrationType,
  outcome: 'success' | 'error',
  message?: string,
): string {
  const base = config.allowedOrigins[0]?.replace(/\/$/, '') ?? '';
  const params = new URLSearchParams({ integration: type, status: outcome });
  if (message) params.set('message', message);
  return `${base}/integrations?${params.toString()}`;
}

interface SlackOAuthAccessResponse {
  ok: boolean;
  error?: string;
  access_token?: string;
  team?: { id: string; name: string };
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  email?: string;
}

async function storeOAuthIntegration(
  config: AppConfig,
  userSub: string,
  integration: IntegrationRecord,
  tokens: Record<string, string | number | undefined>,
): Promise<IntegrationRecord> {
  const doc = getDocClient();
  const pk = userPk(userSub);
  await doc.send(
    new PutCommand({
      TableName: config.tableName,
      Item: {
        PK: pk,
        SK: SK.integration(integration.type),
        entityType: 'integration',
        ...tokens,
        ...integration,
      },
    }),
  );
  return integration;
}

export async function completeSlackOAuth(
  config: AppConfig,
  code: string,
  userSub: string,
): Promise<IntegrationRecord> {
  if (!config.slackClientId || !config.slackClientSecret || !config.slackOAuthRedirectUri) {
    throw new Error('Slack integration is not configured');
  }

  await ensureUserSeed(config, userSub);

  const body = new URLSearchParams({
    client_id: config.slackClientId,
    client_secret: config.slackClientSecret,
    code,
    redirect_uri: config.slackOAuthRedirectUri,
  });

  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = (await response.json()) as SlackOAuthAccessResponse;
  if (!response.ok || !data.ok || !data.access_token) {
    throw new Error(data.error ?? 'Slack authorization failed');
  }

  const teamName = data.team?.name ?? 'Slack workspace';
  const integration: IntegrationRecord = {
    id: `int-slack-${userSub.slice(0, 8)}`,
    name: 'Slack',
    type: 'slack',
    status: 'connected',
    lastSync: 'Just now',
    signalsToday: 0,
    channel: teamName,
  };

  return storeOAuthIntegration(config, userSub, integration, {
    accessToken: data.access_token,
    teamId: data.team?.id,
    tokenType: 'slack_oauth_v2',
  });
}

export async function completeGmailOAuth(
  config: AppConfig,
  code: string,
  userSub: string,
): Promise<IntegrationRecord> {
  if (
    !config.googleOAuthClientId ||
    !config.googleOAuthClientSecret ||
    !config.gmailOAuthRedirectUri
  ) {
    throw new Error('Gmail integration is not configured');
  }

  await ensureUserSeed(config, userSub);

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: config.googleOAuthClientId,
    client_secret: config.googleOAuthClientSecret,
    redirect_uri: config.gmailOAuthRedirectUri,
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = (await response.json()) as GoogleTokenResponse;
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description ?? data.error ?? 'Gmail authorization failed');
  }

  let account = 'Gmail';
  const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  if (profileResponse.ok) {
    const profile = (await profileResponse.json()) as GoogleUserInfo;
    if (profile.email) account = profile.email;
  }

  const integration: IntegrationRecord = {
    id: `int-gmail-${userSub.slice(0, 8)}`,
    name: 'Gmail',
    type: 'gmail',
    status: 'connected',
    lastSync: 'Just now',
    signalsToday: 0,
    account,
  };

  return storeOAuthIntegration(config, userSub, integration, {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: 'google_oauth',
  });
}
