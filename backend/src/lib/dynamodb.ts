import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

let client: DynamoDBDocumentClient | null = null;

export function getDocClient(): DynamoDBDocumentClient {
  if (!client) {
    const base = new DynamoDBClient({});
    client = DynamoDBDocumentClient.from(base, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return client;
}

export function userPk(sub: string): string {
  return `USER#${sub}`;
}

export const SK = {
  profile: 'PROFILE',
  integration: (type: string) => `INTEGRATION#${type}`,
  signal: (id: string) => `SIGNAL#${id}`,
  output: (id: string) => `OUTPUT#${id}`,
  trigger: (id: string) => `TRIGGER#${id}`,
  agent: (id: string) => `AGENT#${id}`,
  matterConfig: 'CONFIG#matter',
} as const;
