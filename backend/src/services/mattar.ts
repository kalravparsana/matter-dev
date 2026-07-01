import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
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

const DEFAULT_INTEGRATIONS: IntegrationRecord[] = [
  {
    id: 'int-1',
    name: 'Slack',
    type: 'slack',
    status: 'connected',
    lastSync: '2 min ago',
    signalsToday: 28,
    channel: 'York HQ workspace',
  },
  {
    id: 'int-2',
    name: 'Gmail',
    type: 'gmail',
    status: 'connected',
    lastSync: '4 min ago',
    signalsToday: 14,
    account: 'priya@york.ie',
  },
  {
    id: 'int-3',
    name: 'Granola',
    type: 'granola',
    status: 'syncing',
    lastSync: 'Syncing…',
    signalsToday: 5,
    account: 'Meeting notes',
  },
];

const DEFAULT_SIGNALS: InputSignal[] = [
  {
    id: 'sig-1',
    source: '#product-standup',
    integration: 'slack',
    preview: 'Blocked on API rate limits — need eng decision by noon',
    receivedAt: '8:14 AM',
    priority: 'hot',
    matterScore: 94,
  },
  {
    id: 'sig-2',
    source: 'sarah.chen@york.ie',
    integration: 'gmail',
    preview: 'Re: Q2 contract renewal — legal flagged clause 7.2',
    receivedAt: '7:52 AM',
    priority: 'hot',
    matterScore: 91,
  },
  {
    id: 'sig-3',
    source: 'Investor sync notes',
    integration: 'granola',
    preview: 'Action item: send updated cap table before Thursday call',
    receivedAt: '7:30 AM',
    priority: 'active',
    matterScore: 78,
  },
  {
    id: 'sig-4',
    source: '#customer-success',
    integration: 'slack',
    preview: 'Acme Corp escalation — churn risk, wants callback today',
    receivedAt: '7:18 AM',
    priority: 'hot',
    matterScore: 88,
  },
  {
    id: 'sig-5',
    source: 'partnerships@cloudstack.com',
    integration: 'gmail',
    preview: 'Partnership proposal follow-up — decision needed this week',
    receivedAt: '6:45 AM',
    priority: 'active',
    matterScore: 72,
  },
  {
    id: 'sig-6',
    source: 'Weekly planning',
    integration: 'granola',
    preview: 'Hiring: finalize offer for senior backend role',
    receivedAt: 'Yesterday',
    priority: 'queued',
    matterScore: 65,
  },
  {
    id: 'sig-7',
    source: '#eng-alerts',
    integration: 'slack',
    preview: 'Deploy pipeline failed on staging — non-blocking',
    receivedAt: 'Yesterday',
    priority: 'queued',
    matterScore: 41,
  },
];

const DEFAULT_OUTPUTS: OutputAction[] = [
  {
    id: 'out-1',
    name: 'Reply to Sarah — clause review',
    integration: 'gmail',
    kind: 'gmail-send-reply',
    lastRun: '8:31 AM',
    status: 'running',
    todayCount: 3,
  },
  {
    id: 'out-2',
    name: 'Alert #eng-leads — rate limit',
    integration: 'slack',
    kind: 'slack-post-alert',
    lastRun: '8:22 AM',
    status: 'ready',
    todayCount: 2,
  },
  {
    id: 'out-3',
    name: 'Cap table action item pushed',
    integration: 'granola',
    kind: 'granola-push-action-item',
    lastRun: '8:15 AM',
    status: 'ready',
    todayCount: 1,
  },
  {
    id: 'out-4',
    name: 'Cap table reminder',
    integration: 'gmail',
    kind: 'gmail-send-reply',
    lastRun: '7:45 AM',
    status: 'ready',
    todayCount: 2,
  },
];

const DEFAULT_TRIGGERS: InputTrigger[] = [
  {
    id: 'trg-1',
    integration: 'slack',
    kind: 'slack-new-message',
    label: 'New message',
    description: 'Any message in monitored channels',
    enabled: true,
    eventsToday: 18,
    lastEvent: '8:14 AM',
  },
  {
    id: 'trg-2',
    integration: 'slack',
    kind: 'slack-new-mention',
    label: 'New @mention',
    description: 'Direct @mentions in watched threads',
    enabled: true,
    eventsToday: 6,
    lastEvent: '7:48 AM',
  },
  {
    id: 'trg-3',
    integration: 'gmail',
    kind: 'gmail-new-email',
    label: 'New email',
    description: 'Inbound messages excluding promotions',
    enabled: true,
    eventsToday: 11,
    lastEvent: '7:52 AM',
  },
  {
    id: 'trg-4',
    integration: 'granola',
    kind: 'granola-new-meeting',
    label: 'New meeting notes',
    description: 'Notes synced after meetings',
    enabled: true,
    eventsToday: 3,
    lastEvent: '7:30 AM',
  },
];

const DEFAULT_AGENTS: OutputAgent[] = [
  {
    id: 'agent-1',
    integration: 'gmail',
    kind: 'gmail-send-reply',
    name: 'Email reply sent',
    description: 'Draft and send Gmail replies on routed signals',
    lastRun: '8:31 AM',
    status: 'running',
    todayCount: 5,
  },
  {
    id: 'agent-2',
    integration: 'slack',
    kind: 'slack-post-alert',
    name: 'Channel alert posted',
    description: 'Push priority alerts to channels',
    lastRun: '8:18 AM',
    status: 'running',
    todayCount: 2,
  },
];

const DEFAULT_MATTER: MatterConfig = {
  prompt: `You are the Matter agent for York's ops team. Surface only what needs human attention today.`,
  temperature: 0.3,
  priorityThreshold: 70,
  autoRoute: true,
  lastEdited: 'Jun 18, 2026',
  editedBy: 'Priya Natarajan',
};

export async function ensureUserSeed(config: AppConfig, userSub: string): Promise<void> {
  const doc = getDocClient();
  const pk = userPk(userSub);
  const existing = await doc.send(
    new GetCommand({ TableName: config.tableName, Key: { PK: pk, SK: SK.profile } }),
  );
  if (existing.Item) return;

  const writes = [
    { PK: pk, SK: SK.profile, entityType: 'profile', seeded: true },
    ...DEFAULT_INTEGRATIONS.map((i) => ({
      PK: pk,
      SK: SK.integration(i.type),
      entityType: 'integration',
      GSI1PK: pk,
      GSI1SK: SK.integration(i.type),
      ...i,
    })),
    ...DEFAULT_SIGNALS.map((s, idx) => ({
      PK: pk,
      SK: SK.signal(s.id),
      entityType: 'signal',
      GSI1PK: pk,
      GSI1SK: `SIGNAL#${String(idx).padStart(4, '0')}`,
      ...s,
    })),
    ...DEFAULT_OUTPUTS.map((o) => ({
      PK: pk,
      SK: SK.output(o.id),
      entityType: 'output',
      ...o,
    })),
    ...DEFAULT_TRIGGERS.map((t) => ({
      PK: pk,
      SK: SK.trigger(t.id),
      entityType: 'trigger',
      ...t,
    })),
    ...DEFAULT_AGENTS.map((a) => ({
      PK: pk,
      SK: SK.agent(a.id),
      entityType: 'agent',
      ...a,
    })),
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
    id: 'int-3',
    name: 'Granola',
    type: 'granola',
    status: 'syncing',
    lastSync: 'Syncing…',
    signalsToday: 5,
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
