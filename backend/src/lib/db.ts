import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { config } from './config.js';

const client = new DynamoDBClient({ region: config.cognitoRegion });
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export function tableName(): string {
  return config.tableName;
}

export function userPk(sub: string): string {
  return `USER#${sub}`;
}
