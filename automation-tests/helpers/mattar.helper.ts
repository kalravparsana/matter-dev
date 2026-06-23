import type { Page } from '@playwright/test';

const AUTH_KEY = 'mattar_session';

export async function seedDemoSession(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const session = {
      email: 'priya@meridian.io',
      fullName: 'Priya Natarajan',
      firstName: 'Priya',
      initials: 'PN',
      workspace: 'Meridian',
      role: 'Owner',
      loggedInAt: new Date().toISOString(),
      provider: 'google',
    };
    localStorage.setItem('mattar_session', JSON.stringify(session));
  });
}

export async function gotoAuthenticated(page: Page, path: string): Promise<void> {
  await seedDemoSession(page);
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

export function mockIntegrationsApi(page: Page) {
  return page.route('**/api/v1/integrations', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        integrations: [
          { id: 'int-1', name: 'Slack', type: 'slack', status: 'connected', lastSync: '2 min ago', signalsToday: 28, channel: 'Meridian HQ workspace' },
          { id: 'int-2', name: 'Gmail', type: 'gmail', status: 'connected', lastSync: '4 min ago', signalsToday: 14, account: 'priya@meridian.io' },
          { id: 'int-3', name: 'Granola', type: 'granola', status: 'syncing', lastSync: 'Syncing…', signalsToday: 5, account: 'Meeting notes' },
        ],
      }),
    }),
  );
}
