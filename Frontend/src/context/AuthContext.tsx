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
} from '@/lib/auth';
import { signInWithGoogle } from '@/lib/googleAuth';
import { isCognitoConfigured, startCognitoLogin } from '@/lib/cognitoAuth';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<{ ok: true } | { ok: false; error: string }>;
  loginWithCognito: () => void;
  isCognitoAuth: boolean;
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
    if (isCognitoConfigured()) {
      startCognitoLogin();
      return { ok: true as const };
    }
    const result = await signInWithGoogle();
    if (!result.ok) {
      return result;
    }

    persistSession(result.session);
    setSession(result.session);
    return { ok: true as const };
  }, []);

  const loginWithCognito = useCallback(() => {
    startCognitoLogin();
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
      loginWithCognito,
      isCognitoAuth: isCognitoConfigured(),
      logout,
    }),
    [session, isLoading, loginWithGoogle, loginWithCognito, logout],
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
