import type { DynamoDBStreamHandler } from 'aws-lambda';
import { logInfo } from '../lib/logger.js';

/** Processes DynamoDB stream events for signal inserts/updates (fan-out to SSE subscribers via polling). */
export const handler: DynamoDBStreamHandler = async (event) => {
  for (const record of event.Records) {
    if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
      const sk = record.dynamodb?.Keys?.SK?.S ?? '';
      if (sk.startsWith('SIGNAL#')) {
        logInfo('Signal stream event processed', {
          eventName: record.eventName,
          signalId: sk.replace('SIGNAL#', ''),
        });
      }
    }
  }
};
