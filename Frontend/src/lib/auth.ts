import { workspaceUser } from '@/data/mattar';
import { ALLOWED_WORKSPACE_DOMAIN, ALLOWED_WORKSPACE_NAME } from '@/lib/workspace';

export const AUTH_STORAGE_KEY = 'mattar_session';

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

export interface GoogleProfile {
  email: string;
  name: string;
  givenName?: string;
}

const workspaceAccounts: Record<string, Omit<AuthUser, 'email'>> = {
  [workspaceUser.email.toLowerCase()]: {
    fullName: workspaceUser.fullName,
    firstName: workspaceUser.firstName,
    initials: workspaceUser.initials,
    workspace: workspaceUser.workspace,
    role: workspaceUser.role,
  },
  'alex@york.ie': {
    fullName: 'Alex Chen',
    firstName: 'Alex',
    initials: 'AC',
    workspace: ALLOWED_WORKSPACE_NAME,
    role: 'Operator',
  },
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
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
}

export function createSessionFromGoogleProfile(
  profile: GoogleProfile,
): { ok: true; session: AuthSession } | { ok: false; error: string } {
  const email = profile.email.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Google did not return a valid email address' };
  }

  const domain = email.split('@')[1];
  if (domain !== ALLOWED_WORKSPACE_DOMAIN) {
    return {
      ok: false,
      error: `Sign in with your ${ALLOWED_WORKSPACE_NAME} Google Workspace account to continue`,
    };
  }

  const known = workspaceAccounts[email];
  const firstName = profile.givenName?.trim() || profile.name.split(/\s+/)[0] || 'User';
  const fullName = known?.fullName ?? profile.name.trim();
  const initials = known?.initials ?? initialsFromName(fullName);

  const session: AuthSession = {
    email,
    fullName,
    firstName: known?.firstName ?? firstName,
    initials,
    workspace: known?.workspace ?? ALLOWED_WORKSPACE_NAME,
    role: known?.role ?? 'Operator',
    loggedInAt: new Date().toISOString(),
    provider: 'google',
  };

  return { ok: true, session };
}
