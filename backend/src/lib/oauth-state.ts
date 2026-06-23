import { createHmac, randomBytes } from 'node:crypto';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { config } from './config.js';
import { docClient, tableName } from './db.js';

export interface OAuthStateRecord {
  userId: string;
  provider: 'slack' | 'gmail';
  redirectAfter: string;
}

export function createStateToken(): string {
  return randomBytes(24).toString('hex');
}

export function signState(state: string): string {
  const sig = createHmac('sha256', config.oauthStateSecret).update(state).digest('hex');
  return `${state}.${sig}`;
}

export function verifySignedState(signed: string): string | null {
  const [state, sig] = signed.split('.');
  if (!state || !sig) return null;
  const expected = createHmac('sha256', config.oauthStateSecret).update(state).digest('hex');
  if (sig !== expected) return null;
  return state;
}

export async function storeOAuthState(
  state: string,
  record: OAuthStateRecord,
): Promise<void> {
  const ttl = Math.floor(Date.now() / 1000) + 600;
  await docClient.send(
    new PutCommand({
      TableName: tableName(),
      Item: {
        pk: `OAUTH#${state}`,
        sk: 'STATE',
        ...record,
        ttl,
      },
    }),
  );
}

export async function consumeOAuthState(state: string): Promise<OAuthStateRecord | null> {
  const res = await docClient.send(
    new GetCommand({
      TableName: tableName(),
      Key: { pk: `OAUTH#${state}`, sk: 'STATE' },
    }),
  );
  if (!res.Item) return null;
  return {
    userId: res.Item.userId as string,
    provider: res.Item.provider as 'slack' | 'gmail',
    redirectAfter: res.Item.redirectAfter as string,
  };
}
