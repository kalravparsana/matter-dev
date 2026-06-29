// Figma layer: Auth / Sign in — standalone layout (outside app shell)
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogoLockup } from '@/components/Logo';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { useAuth } from '@/context/AuthContext';
import { isGoogleAuthConfigured } from '@/lib/cognitoAuth';
import { workspaceUser } from '@/data/mattar';
import matterLens from '@/assets/illustrations/matter-lens.svg';

export default function LoginPage() {
  const { isAuthenticated, isLoading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from?.startsWith('/') === true
      ? (location.state as { from: string }).from
      : '/today';

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleGoogleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    const result = await loginWithGoogle();
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if ('pending' in result && result.pending) {
      return;
    }

    navigate(from, { replace: true });
  };

  const googleConfigured = isGoogleAuthConfigured();

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="relative hidden w-[42%] max-w-xl flex-col justify-between overflow-hidden border-r border-border bg-surface-raised p-10 lg:flex">
        <LogoLockup />
        <div className="flex flex-1 flex-col justify-center py-8">
          <img
            src={matterLens}
            alt=""
            aria-hidden="true"
            className="mx-auto w-full max-w-[280px]"
          />
          <p className="mt-8 max-w-sm font-display text-2xl font-semibold tracking-tight text-foreground">
            Seven signals need you before noon.
          </p>
          <p className="mt-3 max-w-sm font-sans text-sm leading-relaxed text-muted-foreground">
            Sign in with Google to open your workspace radar — route what matters from Slack,
            Gmail, and Granola through one agent.
          </p>
        </div>
        <p className="font-sans text-xs text-muted-foreground">
          Mattar · Signal layer for ops teams
        </p>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <LogoLockup />
          </div>

          <h1 className="font-display text-[28px] font-semibold tracking-tight text-foreground">
            Sign in
          </h1>
          <p className="mt-2 font-sans text-sm text-muted-foreground">
            Use your {workspaceUser.workspace} Google Workspace account — no password required.
          </p>

          <div className="mt-8 space-y-4">
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 font-sans text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <GoogleSignInButton
              onClick={handleGoogleSignIn}
              loading={submitting}
              disabled={isLoading}
            />

            <p className="font-sans text-xs leading-relaxed text-muted-foreground">
              {googleConfigured
                ? 'Only @meridian.io Google accounts can access this workspace.'
                : `Preview mode: Continue with Google signs you in as ${workspaceUser.fullName}. Set VITE_COGNITO_DOMAIN and VITE_API_BASE_URL for live Cognito OAuth.`}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
