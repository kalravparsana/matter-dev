import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated } from '../helpers/mattar-api.helper';
import { mattarData } from '../fixtures/mock-data/mattar.data';

test.describe('Today — Error States', () => {
  test('empty signals list still renders radar shell', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await page.route('**/api/v1/signals', (route) =>
      route.fulfill({ status: 200, body: '[]' }),
    );
    await page.route('**/api/v1/outputs', (route) => route.fulfill({ status: 200, body: '[]' }));
    await page.route('**/api/v1/metrics/today', (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({ ...mattarData.api.metrics, signalsIn: 0 }),
      }),
    );
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.integrations) }),
    );
    await gotoAuthenticated(page, '/today', { mockApis: false });
    await expect(page.getByLabel('Mattar radar — what matters today')).toBeVisible();
  });
});
