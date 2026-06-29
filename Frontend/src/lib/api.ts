export const AUTH_STORAGE_KEY = 'mattar_session';
export const TOKEN_STORAGE_KEY = 'mattar_tokens';

export interface AuthUser {
  email: string;
  fullName: string;
  firstName: string;
  initials: string;
  workspace: string;
  role: string;
}

export interface AuthSession extends AuthUser {
  loggedInAt: string;
  provider: 'google';
}

export interface StoredTokens {
  idToken: string;
  accessToken: string;
  refreshToken?: string;
}

export function getApiBaseUrl(): string | undefined {
  const url = import.meta.env.VITE_API_BASE_URL?.trim();
  return url || undefined;
}

export function isApiConfigured(): boolean {
  return Boolean(getApiBaseUrl());
}

export function readStoredTokens(): StoredTokens | null {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredTokens;
    if (!parsed.idToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function persistTokens(tokens: StoredTokens): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

export function readStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed.email || !parsed.fullName || parsed.provider !== 'google') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function persistSession(session: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error('API is not configured');
  }

  const tokens = readStoredTokens();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (tokens?.idToken) {
    headers.Authorization = `Bearer ${tokens.idToken}`;
  }

  const response = await fetch(`${base.replace(/\/$/, '')}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
