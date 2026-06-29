import {
  apiFetch,
  getApiBaseUrl,
  persistSession,
  persistTokens,
  type AuthSession,
  type StoredTokens,
} from '@/lib/api';

function getCognitoDomain(): string | undefined {
  return import.meta.env.VITE_COGNITO_DOMAIN?.trim() || undefined;
}

function getCognitoClientId(): string | undefined {
  return import.meta.env.VITE_COGNITO_CLIENT_ID?.trim() || undefined;
}

function getOAuthRedirectUri(): string | undefined {
  return import.meta.env.VITE_OAUTH_REDIRECT_URI?.trim() || undefined;
}

export function isCognitoConfigured(): boolean {
  return Boolean(getCognitoDomain() && getCognitoClientId() && getOAuthRedirectUri());
}

export function isGoogleAuthConfigured(): boolean {
  return isCognitoConfigured() && Boolean(getApiBaseUrl());
}

type SignInResult =
  | { ok: true; session?: AuthSession; pending?: boolean }
  | { ok: false; error: string };

const AUTH_NOT_CONFIGURED_ERROR =
  'Sign-in is not configured. Set VITE_API_BASE_URL, VITE_COGNITO_DOMAIN, VITE_COGNITO_CLIENT_ID, and VITE_OAUTH_REDIRECT_URI.';

export async function signInWithGoogle(): Promise<SignInResult> {
  if (!isGoogleAuthConfigured()) {
    return { ok: false, error: AUTH_NOT_CONFIGURED_ERROR };
  }

  try {
    const { url } = await apiFetch<{ url: string; state: string }>(
      '/api/v1/auth/authorize-url',
    );
    sessionStorage.setItem('mattar_oauth_state', url);
    window.location.href = url;
    return { ok: true, pending: true };
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
