import { createHmac, timingSafeEqual } from 'node:crypto';
import { AppError } from './errors.js';

export function verifySlackRequestSignature(
  signingSecret: string,
  signature: string | undefined,
  timestamp: string | undefined,
  rawBody: string,
): void {
  if (!signingSecret) {
    throw new AppError('Slack webhook verification is not configured', 503, 'WEBHOOK_NOT_CONFIGURED');
  }

  if (!signature || !timestamp) {
    throw new AppError('Missing Slack signature headers', 401, 'UNAUTHORIZED');
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 60 * 5) {
    throw new AppError('Slack request timestamp is too old', 401, 'UNAUTHORIZED');
  }

  const base = `v0:${timestamp}:${rawBody}`;
  const digest = `v0=${createHmac('sha256', signingSecret).update(base).digest('hex')}`;

  const expected = Buffer.from(digest);
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new AppError('Invalid Slack signature', 401, 'UNAUTHORIZED');
  }
}
