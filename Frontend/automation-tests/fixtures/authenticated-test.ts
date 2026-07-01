import { test as base, expect, type Page } from '@playwright/test';
import { mattarData } from './mock-data/mattar.data';

function encodeJwtPart(value: Record<string, string>): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function buildTestIdToken(email: string, name: string, givenName: string): string {
  const header = encodeJwtPart({ alg: 'none', typ: 'JWT' });
  const payload = encodeJwtPart({ email, name, given_name: givenName });
  return `${header}.${payload}.playwright-test-signature`;
}

export async function seedAuthenticatedSession(page: Page): Promise<void> {
  const idToken = buildTestIdToken(
    mattarData.valid.email,
    mattarData.valid.fullName,
    'Priya',
  );

  await page.addInitScript((session, token) => {
    localStorage.setItem(
      'mattar_tokens',
      JSON.stringify({ idToken: token, accessToken: 'playwright-test-access' }),
    );
    localStorage.setItem('mattar_session', JSON.stringify(session));
  }, {
    email: mattarData.valid.email,
    fullName: mattarData.valid.fullName,
    firstName: 'Priya',
    initials: 'PN',
    workspace: 'York',
    role: 'Owner',
    loggedInAt: new Date().toISOString(),
    provider: 'google',
  }, idToken);
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await seedAuthenticatedSession(page);
    await page.goto('/today');
    await page.waitForURL(/\/today/);
    await use(page);
  },
});

export { expect };
