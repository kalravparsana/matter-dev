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
  clearStoredSession,
  isApiConfigured,
  persistSession,
  readStoredSession,
  readStoredTokens,
  type AuthSession,
  type AuthUser,
} from '@/lib/api';
import { signInWithGoogle } from '@/lib/cognitoAuth';
import { buildAuthSessionFromIdToken } from '@/lib/idToken';

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
      if (!isApiConfigured()) {
        clearStoredSession();
        if (!cancelled) setIsLoading(false);
        return;
      }

      const tokens = readStoredTokens();
      if (!tokens?.idToken) {
        clearStoredSession();
        if (!cancelled) setIsLoading(false);
        return;
      }

      const sessionResult = buildAuthSessionFromIdToken(tokens.idToken);
      if (!sessionResult.ok) {
        clearStoredSession();
        if (!cancelled) setIsLoading(false);
        return;
      }

      const existing = readStoredSession();
      const session: AuthSession = {
        ...sessionResult.session,
        loggedInAt: existing?.loggedInAt ?? new Date().toISOString(),
      };
      persistSession(session);
      if (!cancelled) setSession(session);

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

    if (!result.session) {
      return { ok: false, error: 'Sign-in did not return a session' };
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
