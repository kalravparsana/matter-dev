import * as jose from 'jose';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { config, cognitoIssuer, cognitoJwksUrl } from './config.js';
import { AppError } from './errors.js';

let jwks: jose.JWTVerifyGetKey | null = null;

async function getJwks(): Promise<jose.JWTVerifyGetKey> {
  if (!jwks) {
    jwks = jose.createRemoteJWKSet(new URL(cognitoJwksUrl()));
  }
  return jwks;
}

export interface AuthContext {
  sub: string;
  email: string;
  name?: string;
}

export async function verifyCognitoToken(token: string): Promise<AuthContext> {
  if (!config.cognitoUserPoolId || !config.cognitoClientId) {
    throw new AppError(503, 'Sign-in is not set up yet', 'AUTH_NOT_CONFIGURED');
  }

  const keySet = await getJwks();
  const { payload } = await jose.jwtVerify(token, keySet, {
    issuer: cognitoIssuer(),
    audience: config.cognitoClientId,
  });

  const sub = payload.sub;
  const email = (payload.email as string) ?? '';
  if (!sub || !email) {
    throw new AppError(401, 'Invalid token', 'INVALID_TOKEN');
  }

  return { sub, email, name: payload.name as string | undefined };
}

export async function requireAuth(event: APIGatewayProxyEventV2): Promise<AuthContext> {
  const header = event.headers?.authorization ?? event.headers?.Authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
  }
  return verifyCognitoToken(header.slice(7));
}

export function getBearerToken(event: APIGatewayProxyEventV2): string | null {
  const header = event.headers?.authorization ?? event.headers?.Authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}
