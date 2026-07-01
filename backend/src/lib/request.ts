import type { APIGatewayProxyEventV2 } from 'aws-lambda';

/**
 * Resolves the HTTP path API Gateway forwards to Lambda.
 * Normalizes stage prefixes and trailing slashes so route matching is stable.
 */
export function getHttpPath(event: APIGatewayProxyEventV2): string {
  const raw =
    event.rawPath ??
    event.requestContext?.http?.path ??
  '';

  let path = raw.split('?')[0] || '/';
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  const stage = event.requestContext?.stage;
  if (stage && stage !== '$default' && path.startsWith(`/${stage}/`)) {
    path = path.slice(stage.length + 1) || '/';
  }

  return path;
}
