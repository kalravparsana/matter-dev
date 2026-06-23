import { QueryCommand, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, tableName, userPk } from '../lib/db.js';

export interface InputSignal {
  id: string;
  source: string;
  integration: string;
  preview: string;
  receivedAt: string;
  priority: string;
  matterScore: number;
}

export interface OutputAction {
  id: string;
  name: string;
  integration: string;
  kind: string;
  lastRun: string;
  status: string;
  todayCount: number;
}

export interface InputTrigger {
  id: string;
  integration: string;
  kind: string;
  label: string;
  description: string;
  enabled: boolean;
  eventsToday: number;
  lastEvent: string;
}

export interface OutputAgent {
  id: string;
  integration: string;
  kind: string;
  name: string;
  description: string;
  status: string;
  lastRun: string;
  todayCount: number;
}

export interface InsightMetrics {
  signalsIn: number;
  matterFiltered: number;
  actionsRouted: number;
  pendingReview: number;
  avgResponseMin: number;
}

export interface MatterConfig {
  prompt: string;
  temperature: number;
  priorityThreshold: number;
  autoRoute: boolean;
  lastEdited: string;
  editedBy: string;
}

export interface UserProfile {
  email: string;
  fullName: string;
  firstName: string;
  initials: string;
  workspace: string;
  role: string;
}

async function queryByPrefix<T>(userId: string, prefix: string): Promise<T[]> {
  const res = await docClient.send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: {
        ':pk': userPk(userId),
        ':prefix': prefix,
      },
    }),
  );
  return (res.Items ?? []) as T[];
}

export async function listSignals(userId: string): Promise<InputSignal[]> {
  return queryByPrefix<InputSignal>(userId, 'SIGNAL#');
}

export async function listOutputs(userId: string): Promise<OutputAction[]> {
  return queryByPrefix<OutputAction>(userId, 'OUTPUT#');
}

export async function listInputTriggers(userId: string): Promise<InputTrigger[]> {
  return queryByPrefix<InputTrigger>(userId, 'TRIGGER#');
}

export async function listOutputAgents(userId: string): Promise<OutputAgent[]> {
  return queryByPrefix<OutputAgent>(userId, 'AGENT#');
}

export async function getMetrics(userId: string): Promise<InsightMetrics | null> {
  const res = await docClient.send(
    new GetCommand({
      TableName: tableName(),
      Key: { pk: userPk(userId), sk: 'METRICS' },
    }),
  );
  if (!res.Item) return null;
  return res.Item as InsightMetrics;
}

export async function getMatterConfig(userId: string): Promise<MatterConfig | null> {
  const res = await docClient.send(
    new GetCommand({
      TableName: tableName(),
      Key: { pk: userPk(userId), sk: 'CONFIG#matter' },
    }),
  );
  if (!res.Item) return null;
  return res.Item as MatterConfig;
}

export async function updateMatterConfig(
  userId: string,
  patch: Partial<MatterConfig>,
): Promise<MatterConfig> {
  const existing = (await getMatterConfig(userId)) ?? {
    prompt: '',
    temperature: 0.3,
    priorityThreshold: 70,
    autoRoute: true,
    lastEdited: 'Never',
    editedBy: 'System',
  };
  const updated = { ...existing, ...patch, lastEdited: 'Just now' };
  await docClient.send(
    new PutCommand({
      TableName: tableName(),
      Item: { pk: userPk(userId), sk: 'CONFIG#matter', entityType: 'matterConfig', ...updated },
    }),
  );
  return updated;
}

export async function updateInputTrigger(
  userId: string,
  triggerId: string,
  patch: Partial<InputTrigger>,
): Promise<InputTrigger> {
  const triggers = await listInputTriggers(userId);
  const existing = triggers.find((t) => t.id === triggerId);
  if (!existing) throw new Error('Trigger not found');
  const updated = { ...existing, ...patch };
  await docClient.send(
    new PutCommand({
      TableName: tableName(),
      Item: { pk: userPk(userId), sk: `TRIGGER#${triggerId}`, entityType: 'trigger', ...updated },
    }),
  );
  return updated;
}

export async function updateOutputAgent(
  userId: string,
  agentId: string,
  patch: Partial<OutputAgent>,
): Promise<OutputAgent> {
  const agents = await listOutputAgents(userId);
  const existing = agents.find((a) => a.id === agentId);
  if (!existing) throw new Error('Agent not found');
  const updated = { ...existing, ...patch };
  await docClient.send(
    new PutCommand({
      TableName: tableName(),
      Item: { pk: userPk(userId), sk: `AGENT#${agentId}`, entityType: 'agent', ...updated },
    }),
  );
  return updated;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const res = await docClient.send(
    new GetCommand({
      TableName: tableName(),
      Key: { pk: userPk(userId), sk: 'PROFILE' },
    }),
  );
  if (!res.Item) return null;
  return res.Item as UserProfile;
}

export async function upsertUserProfile(userId: string, profile: UserProfile): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: tableName(),
      Item: { pk: userPk(userId), sk: 'PROFILE', entityType: 'profile', ...profile },
    }),
  );
}
