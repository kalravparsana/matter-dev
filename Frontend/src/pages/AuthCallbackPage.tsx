import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseAuthCallbackHash } from '@/lib/cognitoAuth';
import { createSessionFromGoogleProfile, persistSession } from '@/lib/auth';
import { apiFetch } from '@/lib/api/client';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      const tokens = parseAuthCallbackHash();
      if (!tokens?.idToken) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const me = await apiFetch<{ user: { email: string; fullName: string; firstName: string; initials: string; workspace: string; role: string } }>(
          '/api/v1/auth/me',
          { headers: { Authorization: `Bearer ${tokens.idToken}` } },
        );

        const session = {
          email: me.user.email,
          fullName: me.user.fullName,
          firstName: me.user.firstName,
          initials: me.user.initials,
          workspace: me.user.workspace,
          role: me.user.role,
          loggedInAt: new Date().toISOString(),
          provider: 'cognito' as const,
          idToken: tokens.idToken,
          accessToken: tokens.accessToken,
        };
        persistSession(session);
        navigate('/today', { replace: true });
      } catch {
        const fallback = createSessionFromGoogleProfile({
          email: 'user@meridian.io',
          name: 'Meridian User',
        });
        if (fallback.ok) {
          persistSession({
            ...fallback.session,
            provider: 'cognito',
            idToken: tokens.idToken,
            accessToken: tokens.accessToken,
          });
        }
        navigate('/today', { replace: true });
      }
    }

    void handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="font-sans text-sm text-muted-foreground">Completing sign-in…</p>
    </div>
  );
}
