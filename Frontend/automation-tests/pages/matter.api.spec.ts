import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated } from '../helpers/mattar-api.helper';
import { mattarData } from '../fixtures/mock-data/mattar.data';

function mockMatterRoutes(page: import('@playwright/test').Page) {
  return Promise.all([
    page.route('**/api/v1/signals', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.signals) }),
    ),
    page.route('**/api/v1/outputs', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.outputs) }),
    ),
    page.route('**/api/v1/metrics/today', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.metrics) }),
    ),
    page.route('**/api/v1/integrations', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.integrations) }),
    ),
    page.route('**/api/v1/input-triggers', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.triggers) }),
    ),
    page.route('**/api/v1/output-agents', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.agents) }),
    ),
  ]);
}

test.describe('Matter — API', () => {
  test('PATCH matter-config sends prompt body', async ({ page }) => {
    await seedAuthenticatedSession(page);
    let patchBody: Record<string, unknown> | null = null;
    await mockMatterRoutes(page);
    await page.route('**/api/v1/matter-config', (route) => {
      if (route.request().method() === 'PATCH') {
        patchBody = route.request().postDataJSON() as Record<string, unknown>;
        return route.fulfill({
          status: 200,
          body: JSON.stringify({ ...mattarData.api.matterConfig, ...patchBody }),
        });
      }
      return route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.matterConfig) });
    });
    await gotoAuthenticated(page, '/matter', { mockApis: false });
    await page.getByLabel(/agent prompt/i).fill('API patch test prompt.');
    await page.getByRole('button', { name: /save prompt/i }).click();
    expect(patchBody).toMatchObject({ prompt: 'API patch test prompt.' });
  });

  test('matter-config 500 blocks save feedback', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await mockMatterRoutes(page);
    await page.route('**/api/v1/matter-config', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.matterConfig) });
      }
      return route.fulfill({ status: 500, body: JSON.stringify({ error: mattarData.api.errorMessage }) });
    });
    await gotoAuthenticated(page, '/matter', { mockApis: false });
    const prompt = page.getByLabel(/agent prompt/i);
    await expect(prompt).toHaveValue(mattarData.api.matterConfig.prompt, { timeout: 10_000 });
    await prompt.fill('Will fail to save.');
    await page.getByRole('button', { name: /save prompt/i }).click();
    await expect(page.getByText(/prompt saved/i)).not.toBeVisible();
  });
});
