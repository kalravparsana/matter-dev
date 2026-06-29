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
  persistSession,
  readStoredSession,
  type AuthSession,
  type AuthUser,
} from '@/lib/api';
import { signInWithGoogle } from '@/lib/cognitoAuth';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<
    { ok: true } | { ok: false; error: string }
  >;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSession(readStoredSession());
    setIsLoading(false);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const result = await signInWithGoogle();
    if (!result.ok) {
      return result;
    }
    if ('pending' in result && result.pending) {
      return { ok: true as const };
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
