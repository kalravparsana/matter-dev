import {
  createDemoGoogleSession,
  createSessionFromGoogleProfile,
  type AuthSession,
} from '@/lib/auth';

const GOOGLE_SCRIPT_ID = 'google-gsi-client';
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

type SignInResult = { ok: true; session: AuthSession } | { ok: false; error: string };

function getGoogleClientId(): string | undefined {
  const id = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  return id || undefined;
}

function loadGoogleScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Sign-In is only available in the browser'));
  }

  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Sign-In')), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
    document.head.appendChild(script);
  });
}

async function fetchGoogleProfile(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Could not load your Google profile');
  }

  const data = (await response.json()) as {
    email?: string;
    name?: string;
    given_name?: string;
  };

  if (!data.email || !data.name) {
    throw new Error('Google profile is missing required fields');
  }

  return {
    email: data.email,
    name: data.name,
    givenName: data.given_name,
  };
}

function signInWithGoogleOAuth(clientId: string): Promise<SignInResult> {
  return new Promise((resolve) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: async (tokenResponse) => {
        if (tokenResponse.error || !tokenResponse.access_token) {
          resolve({
            ok: false,
            error: tokenResponse.error_description ?? 'Google sign-in was cancelled',
          });
          return;
        }

        try {
          const profile = await fetchGoogleProfile(tokenResponse.access_token);
          resolve(createSessionFromGoogleProfile(profile));
        } catch (err) {
          resolve({
            ok: false,
            error: err instanceof Error ? err.message : 'Google sign-in failed',
          });
        }
      },
    });

    client.requestAccessToken({ prompt: 'select_account' });
  });
}

export async function signInWithGoogle(): Promise<SignInResult> {
  const clientId = getGoogleClientId();

  if (!clientId) {
    await new Promise((r) => setTimeout(r, 600));
    return { ok: true, session: createDemoGoogleSession() };
  }

  try {
    await loadGoogleScript();
    return await signInWithGoogleOAuth(clientId);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Google sign-in failed',
    };
  }
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(getGoogleClientId());
}
