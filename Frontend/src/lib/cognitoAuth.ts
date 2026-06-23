import { getApiBaseUrl } from '@/lib/api/client';

const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN?.trim();
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID?.trim();
const COGNITO_REDIRECT_URI = import.meta.env.VITE_COGNITO_REDIRECT_URI?.trim();

export function isCognitoConfigured(): boolean {
  return Boolean(COGNITO_DOMAIN && COGNITO_CLIENT_ID && COGNITO_REDIRECT_URI);
}

export function startCognitoLogin(): void {
  if (!isCognitoConfigured()) return;
  const apiBase = getApiBaseUrl();
  window.location.href = `${apiBase}/api/v1/auth/cognito/authorize`;
}

export function parseAuthCallbackHash(): {
  idToken?: string;
  accessToken?: string;
} | null {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const idToken = params.get('id_token') ?? undefined;
  const accessToken = params.get('access_token') ?? undefined;
  if (!idToken) return null;
  return { idToken, accessToken };
}
