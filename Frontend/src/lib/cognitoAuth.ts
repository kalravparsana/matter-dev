import {
  apiFetch,
  getApiBaseUrl,
  persistSession,
  persistTokens,
  readStoredSession,
  type AuthSession,
  type StoredTokens,
} from '@/lib/api';
import { createDemoGoogleSession } from '@/lib/auth';
import { getRuntimeConfig, isPreviewMode } from '@/lib/runtime';

function getCognitoDomain(): string | undefined {
  return getRuntimeConfig('COGNITO_DOMAIN');
}

function getCognitoClientId(): string | undefined {
  return getRuntimeConfig('COGNITO_CLIENT_ID');
}

function getOAuthRedirectUri(): string | undefined {
  return getRuntimeConfig('OAUTH_REDIRECT_URI');
}

export function isCognitoConfigured(): boolean {
  return Boolean(getCognitoDomain() && getCognitoClientId() && getOAuthRedirectUri());
}

export function isGoogleAuthConfigured(): boolean {
  return isCognitoConfigured() && Boolean(getApiBaseUrl());
}

type SignInResult =
  | { ok: true; session: AuthSession; pending?: boolean }
  | { ok: false; error: string };

export async function signInWithGoogle(): Promise<SignInResult> {
  if (!isGoogleAuthConfigured()) {
    if (!isPreviewMode()) {
      return {
        ok: false,
        error:
          'Sign-in is not configured yet. Redeploy the app after backend and Cognito are provisioned.',
      };
    }
    await new Promise((r) => setTimeout(r, 600));
    const session = createDemoGoogleSession();
    persistSession(session);
    return { ok: true, session };
  }

  try {
    const { url } = await apiFetch<{ url: string; state: string }>(
      '/api/v1/auth/authorize-url',
    );
    sessionStorage.setItem('mattar_oauth_state', url);
    window.location.href = url;
    return { ok: true, session: readStoredSession() ?? createDemoGoogleSession(), pending: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Sign-in failed',
    };
  }
}

export async function completeOAuthCallback(code: string): Promise<SignInResult> {
  const base = getApiBaseUrl();
  if (!base) {
    return { ok: false, error: 'API is not configured' };
  }

  const response = await fetch(
    `${base.replace(/\/$/, '')}/api/v1/auth/callback?code=${encodeURIComponent(code)}`,
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: body.error ?? 'Sign-in failed' };
  }

  const tokens = (await response.json()) as StoredTokens;
  persistTokens(tokens);

  const profile = await apiFetch<AuthSession & { provider?: string }>('/api/v1/auth/session');
  const session: AuthSession = {
    email: profile.email,
    fullName: profile.fullName,
    firstName: profile.firstName,
    initials: profile.initials,
    workspace: profile.workspace,
    role: profile.role,
    loggedInAt: new Date().toISOString(),
    provider: 'google',
  };
  persistSession(session);
  return { ok: true, session };
}

export async function startIntegrationOAuth(
  type: 'slack' | 'gmail',
): Promise<{ url: string } | { error: string }> {
  if (!getApiBaseUrl()) {
    return { error: 'Connect the API to authorize integrations' };
  }
  try {
    return await apiFetch<{ url: string }>(`/api/v1/integrations/${type}/authorize`, {
      method: 'POST',
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Authorization failed' };
  }
}

export async function saveGranolaApiKey(apiKey: string): Promise<{ ok: true } | { error: string }> {
  if (!getApiBaseUrl()) {
    return { error: 'Connect the API to save credentials' };
  }
  try {
    await apiFetch('/api/v1/integrations/granola/credentials', {
      method: 'PUT',
      body: JSON.stringify({ apiKey }),
    });
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save API key' };
  }
}
