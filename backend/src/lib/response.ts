import type { APIGatewayProxyResultV2 } from 'aws-lambda';

export function jsonResponse(
  statusCode: number,
  body: unknown,
  extraHeaders: Record<string, string> = {},
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

export function corsHeaders(origin: string | undefined, allowed: string[]): Record<string, string> {
  const match =
    origin && allowed.includes(origin)
      ? origin
      : allowed[0] ?? '*';

  return {
    'Access-Control-Allow-Origin': match,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

export function withCors(
  result: APIGatewayProxyResultV2,
  origin: string | undefined,
  allowed: string[],
): APIGatewayProxyResultV2 {
  if (typeof result === 'string') {
    return result;
  }
  return {
    ...result,
    headers: {
      ...corsHeaders(origin, allowed),
      ...(result.headers ?? {}),
    },
  };
}

export function noContentResponse(
  origin: string | undefined,
  allowed: string[],
): APIGatewayProxyResultV2 {
  return {
    statusCode: 204,
    headers: corsHeaders(origin, allowed),
    body: '',
  };
}
