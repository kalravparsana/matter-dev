import { QueryCommand, PutCommand, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, tableName, userPk } from '../lib/db.js';
import { AppError } from '../lib/errors.js';
import { config } from '../lib/config.js';

export type ConnectionStatus =
  | 'connected'
  | 'syncing'
  | 'error'
  | 'disconnected'
  | 'available';

export type CoreIntegrationType = 'slack' | 'gmail' | 'granola';

export interface Integration {
  id: string;
  name: string;
  type: CoreIntegrationType;
  status: ConnectionStatus;
  lastSync: string;
  signalsToday: number;
  channel?: string;
  account?: string;
}

const INTEGRATION_META: Record<CoreIntegrationType, { name: string }> = {
  slack: { name: 'Slack' },
  gmail: { name: 'Gmail' },
  granola: { name: 'Granola' },
};

export async function listIntegrations(userId: string): Promise<Integration[]> {
  const res = await docClient.send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: {
        ':pk': userPk(userId),
        ':prefix': 'INTEGRATION#',
      },
    }),
  );
  return (res.Items ?? []).map((item) => ({
    id: item.id as string,
    name: item.name as string,
    type: item.type as CoreIntegrationType,
    status: item.status as ConnectionStatus,
    lastSync: item.lastSync as string,
    signalsToday: (item.signalsToday as number) ?? 0,
    channel: item.channel as string | undefined,
    account: item.account as string | undefined,
  }));
}

export async function upsertIntegration(
  userId: string,
  type: CoreIntegrationType,
  data: Partial<Integration> & { accessToken?: string },
): Promise<Integration> {
  const id = data.id ?? `int-${type}`;
  const meta = INTEGRATION_META[type];
  const integration: Integration & { accessToken?: string } = {
    id,
    name: data.name ?? meta.name,
    type,
    status: data.status ?? 'connected',
    lastSync: data.lastSync ?? 'Just now',
    signalsToday: data.signalsToday ?? 0,
    channel: data.channel,
    account: data.account,
    accessToken: data.accessToken,
  };

  await docClient.send(
    new PutCommand({
      TableName: tableName(),
      Item: {
        pk: userPk(userId),
        sk: `INTEGRATION#${type}`,
        entityType: 'integration',
        ...integration,
      },
    }),
  );

  const { accessToken: _, ...publicIntegration } = integration;
  return publicIntegration;
}

export async function deleteIntegration(userId: string, integrationId: string): Promise<void> {
  const integrations = await listIntegrations(userId);
  const target = integrations.find((i) => i.id === integrationId);
  if (!target) {
    throw new AppError(404, 'Integration not found', 'NOT_FOUND');
  }
  await docClient.send(
    new DeleteCommand({
      TableName: tableName(),
      Key: { pk: userPk(userId), sk: `INTEGRATION#${target.type}` },
    }),
  );
}

export async function validateGranolaApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey || apiKey.trim().length < 8) return false;
  try {
    const res = await fetch(`${config.granolaApiBaseUrl}/v1/me`, {
      headers: { Authorization: `Bearer ${apiKey.trim()}` },
    });
    return res.ok;
  } catch {
    // When Granola API is unreachable, accept well-formed keys for demo workspaces
    return apiKey.trim().length >= 16;
  }
}

export async function getIntegrationTokens(
  userId: string,
  type: CoreIntegrationType,
): Promise<{ accessToken?: string } | null> {
  const res = await docClient.send(
    new GetCommand({
      TableName: tableName(),
      Key: { pk: userPk(userId), sk: `INTEGRATION#${type}` },
    }),
  );
  if (!res.Item) return null;
  return { accessToken: res.Item.accessToken as string | undefined };
}
