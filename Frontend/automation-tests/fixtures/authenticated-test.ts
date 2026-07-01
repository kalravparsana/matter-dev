import { test as base, expect, type Page } from '@playwright/test';
import { mattarData } from './mock-data/mattar.data';

export async function seedAuthenticatedSession(page: Page): Promise<void> {
  await page.addInitScript((session) => {
    localStorage.setItem(
      'mattar_tokens',
      JSON.stringify({ idToken: 'playwright-test-token', accessToken: 'playwright-test-access' }),
    );
    localStorage.setItem('mattar_session', JSON.stringify(session));
  }, {
    email: mattarData.valid.email,
    fullName: mattarData.valid.fullName,
    firstName: 'Priya',
    initials: 'PN',
    workspace: 'Meridian',
    role: 'Owner',
    loggedInAt: new Date().toISOString(),
    provider: 'google',
  });

  await page.route('**/api/v1/auth/session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        email: mattarData.valid.email,
        fullName: mattarData.valid.fullName,
        firstName: 'Priya',
        initials: 'PN',
        workspace: 'Meridian',
        role: 'Owner',
        provider: 'google',
      }),
    }),
  );
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
