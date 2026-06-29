import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { AppError } from './errors.js';
import type { AppConfig } from './config.js';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(config: AppConfig) {
  if (!config.cognitoUserPoolId || !config.cognitoRegion) {
    throw new AppError('Sign-in is not set up yet', 503, 'AUTH_NOT_CONFIGURED');
  }
  if (!jwks) {
    const url = `https://cognito-idp.${config.cognitoRegion}.amazonaws.com/${config.cognitoUserPoolId}/.well-known/jwks.json`;
    jwks = createRemoteJWKSet(new URL(url));
  }
  return jwks;
}

export interface CognitoUser {
  sub: string;
  email: string;
  name: string;
  givenName?: string;
}

export async function verifyCognitoToken(
  token: string,
  config: AppConfig,
): Promise<CognitoUser> {
  if (!config.cognitoClientId) {
    throw new AppError('Sign-in is not set up yet', 503, 'AUTH_NOT_CONFIGURED');
  }

  const issuer = `https://cognito-idp.${config.cognitoRegion}.amazonaws.com/${config.cognitoUserPoolId}`;

  let payload: JWTPayload;
  try {
    const verified = await jwtVerify(token, getJwks(config), {
      issuer,
      audience: config.cognitoClientId,
    });
    payload = verified.payload;
  } catch {
    throw new AppError('Your session has expired. Please sign in again.', 401, 'INVALID_TOKEN');
  }

  const email = String(payload.email ?? '');
  const name = String(payload.name ?? payload['cognito:username'] ?? email);
  const sub = String(payload.sub ?? '');

  if (!sub || !email) {
    throw new AppError('Invalid sign-in token', 401, 'INVALID_TOKEN');
  }

  return {
    sub,
    email,
    name,
    givenName: payload.given_name ? String(payload.given_name) : undefined,
  };
}

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim() || null;
}

export function buildAuthorizeUrl(config: AppConfig, state: string): string {
  if (!config.cognitoDomain || !config.cognitoClientId || !config.oauthRedirectUri) {
    throw new AppError('Sign-in is not set up yet', 503, 'AUTH_NOT_CONFIGURED');
  }

  const params = new URLSearchParams({
    client_id: config.cognitoClientId,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: config.oauthRedirectUri,
    state,
    identity_provider: 'Google',
  });

  return `https://${config.cognitoDomain}/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  config: AppConfig,
): Promise<{ idToken: string; accessToken: string; refreshToken?: string }> {
  if (!config.cognitoDomain || !config.cognitoClientId || !config.oauthRedirectUri) {
    throw new AppError('Sign-in is not set up yet', 503, 'AUTH_NOT_CONFIGURED');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.cognitoClientId,
    code,
    redirect_uri: config.oauthRedirectUri,
  });

  const response = await fetch(`https://${config.cognitoDomain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    throw new AppError('Sign-in failed. Please try again.', 400, 'TOKEN_EXCHANGE_FAILED');
  }

  const data = (await response.json()) as {
    id_token?: string;
    access_token?: string;
    refresh_token?: string;
  };

  if (!data.id_token || !data.access_token) {
    throw new AppError('Sign-in failed. Please try again.', 400, 'TOKEN_EXCHANGE_FAILED');
  }

  return {
    idToken: data.id_token,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}
