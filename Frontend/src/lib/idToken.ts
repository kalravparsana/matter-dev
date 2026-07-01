import type { AuthSession } from '@/lib/api';
import { buildAuthSessionFromClaims, type GoogleProfile } from '@/lib/auth';

interface IdTokenClaims {
  email?: string;
  name?: string;
  given_name?: string;
}

function decodeIdTokenPayload(idToken: string): IdTokenClaims {
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid sign-in token');
  }

  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const payload = JSON.parse(atob(padded)) as IdTokenClaims;
  return payload;
}

export function buildAuthSessionFromIdToken(
  idToken: string,
): { ok: true; session: AuthSession } | { ok: false; error: string } {
  let claims: IdTokenClaims;
  try {
    claims = decodeIdTokenPayload(idToken);
  } catch {
    return { ok: false, error: 'Invalid sign-in token' };
  }

  if (!claims.email || !claims.name) {
    return { ok: false, error: 'Sign-in token is missing required profile fields' };
  }

  const profile: GoogleProfile = {
    email: claims.email,
    name: claims.name,
    givenName: claims.given_name,
  };

  return buildAuthSessionFromClaims(profile);
}
