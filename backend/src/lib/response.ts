import type { APIGatewayProxyResultV2 } from 'aws-lambda';
import { config } from './config.js';

export function corsHeaders(origin?: string): Record<string, string> {
  const allowed = config.frontendOrigin;
  const requestOrigin = origin ?? allowed;
  const allowOrigin = requestOrigin === allowed ? allowed : allowed;
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Content-Type': 'application/json',
  };
}

export function jsonResponse(
  statusCode: number,
  body: unknown,
  origin?: string,
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: corsHeaders(origin),
    body: JSON.stringify(body),
  };
}

export function redirectResponse(location: string, origin?: string): APIGatewayProxyResultV2 {
  return {
    statusCode: 302,
    headers: { ...corsHeaders(origin), Location: location },
    body: '',
  };
}

export function parseBody<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
