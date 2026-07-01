import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { completeOAuthCallback } from '@/lib/cognitoAuth';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setError('Sign-in was cancelled');
      return;
    }

    void completeOAuthCallback(code)
      .then((result) => {
        if (!result.ok) {
          setError(result.error);
          return;
        }
        navigate('/today', { replace: true });
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Sign-in failed');
      });
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <p className="font-sans text-sm text-destructive" role="alert">
            {error}
          </p>
          <a href="/login" className="mt-4 inline-block font-sans text-sm text-primary hover:underline">
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <p className="font-sans text-sm text-muted-foreground">Completing sign-in…</p>
    </div>
  );
}
