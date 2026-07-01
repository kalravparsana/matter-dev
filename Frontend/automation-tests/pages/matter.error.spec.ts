import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated } from '../helpers/mattar-api.helper';
import { mattarData } from '../fixtures/mock-data/mattar.data';

test.describe('Matter — Error States', () => {
  test('GET matter-config failure falls back to mock config', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await page.route('**/api/v1/signals', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.signals) }),
    );
    await page.route('**/api/v1/outputs', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.outputs) }),
    );
    await page.route('**/api/v1/metrics/today', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.metrics) }),
    );
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.integrations) }),
    );
    await page.route('**/api/v1/matter-config', (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: mattarData.api.errorMessage }) }),
    );
    await gotoAuthenticated(page, '/matter', { mockApis: false });
    await expect(page.getByLabel(/agent prompt/i)).not.toBeEmpty();
  });
});
