import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { mattarData } from '../fixtures/mock-data/mattar.data';

export async function mockMattarApis(page: Page): Promise<void> {
  await page.route('**/api/v1/integrations', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mattarData.api.integrations),
    }),
  );
  await page.route('**/api/v1/signals', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mattarData.api.signals),
    }),
  );
  await page.route('**/api/v1/outputs', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mattarData.api.outputs),
    }),
  );
  await page.route('**/api/v1/metrics/today', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mattarData.api.metrics),
    }),
  );
  await page.route('**/api/v1/input-triggers', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mattarData.api.triggers),
    }),
  );
  await page.route('**/api/v1/input-triggers/*', (route) => {
    if (route.request().method() === 'PATCH') {
      const body = route.request().postDataJSON() as { enabled?: boolean };
      const id = route.request().url().split('/').pop() ?? '';
      const trigger = mattarData.api.triggers.find((t) => t.id === id);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...trigger, enabled: body.enabled ?? trigger?.enabled }),
      });
    }
    return route.continue();
  });
  await page.route('**/api/v1/output-agents', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mattarData.api.agents),
    }),
  );
  await page.route('**/api/v1/matter-config', (route) => {
    if (route.request().method() === 'PATCH') {
      const patch = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...mattarData.api.matterConfig, ...patch }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mattarData.api.matterConfig),
    });
  });
  await page.route('**/api/v1/integrations/*/authorize', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: 'https://example.com/oauth', state: 'test-state' }),
    }),
  );
  await page.route('**/api/v1/integrations/granola/credentials', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mattarData.api.integrations[2]),
    }),
  );
}

export async function mockEmptyIntegrations(page: Page): Promise<void> {
  await page.route('**/api/v1/integrations', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mattarData.api.integrationsEmpty),
    }),
  );
}

/** Seed auth + API mocks, navigate to a protected route, and wait for the shell. */
export async function gotoAuthenticated(
  page: Page,
  path: string,
  options?: { mockApis?: boolean },
): Promise<void> {
  await seedAuthenticatedSession(page);
  if (options?.mockApis !== false) {
    await mockMattarApis(page);
  }
  await page.goto(path);
  await page.waitForURL(`**${path}`);
  const loading = page.getByRole('status', { name: /loading session/i });
  if (await loading.isVisible().catch(() => false)) {
    await loading.waitFor({ state: 'hidden', timeout: 15_000 });
  }
  await expect(page).not.toHaveURL(/\/login$/);
}
