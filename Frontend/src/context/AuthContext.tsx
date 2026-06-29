import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  apiFetch,
  clearStoredSession,
  isApiConfigured,
  persistSession,
  readStoredSession,
  readStoredTokens,
  type AuthSession,
  type AuthUser,
} from '@/lib/api';
import { signInWithGoogle } from '@/lib/cognitoAuth';

type LoginResult =
  | { ok: true; pending?: boolean }
  | { ok: false; error: string };

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const stored = readStoredSession();
      if (stored) {
        if (!cancelled) setSession(stored);
        if (!cancelled) setIsLoading(false);
        return;
      }

      if (isApiConfigured() && readStoredTokens()?.idToken) {
        try {
          const profile = await apiFetch<
            Omit<AuthSession, 'loggedInAt' | 'provider'> & { provider?: string }
          >('/api/v1/auth/session');
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
          if (!cancelled) setSession(session);
        } catch {
          clearStoredSession();
        }
      }

      if (!cancelled) setIsLoading(false);
    };

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const result = await signInWithGoogle();
    if (!result.ok) {
      return result;
    }
    if ('pending' in result && result.pending) {
      return { ok: true as const, pending: true };
    }

    persistSession(result.session);
    setSession(result.session);
    return { ok: true as const };
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session,
      isAuthenticated: session !== null,
      isLoading,
      loginWithGoogle,
      logout,
    }),
    [session, isLoading, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
