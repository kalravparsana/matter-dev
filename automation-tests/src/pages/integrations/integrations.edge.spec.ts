import { test, expect } from '@playwright/test';
import { integrationsData } from '../../../fixtures/mock-data/mattar.data';
import { gotoAuthenticated } from '../../../helpers/mattar.helper';

test.describe('Integrations — Edge', () => {
  test('rapid filter toggling does not break UI', async ({ page }) => {
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ integrations: integrationsData.api.listSuccess }),
      }),
    );
    await gotoAuthenticated(page, '/integrations');
    for (const f of ['connected', 'syncing', 'error', 'all']) {
      await page.getByRole('button', { name: f }).click();
    }
    await expect(page.getByRole('heading', { name: 'Integrations' })).toBeVisible();
  });

  test('double-click connect button opens single modal', async ({ page }) => {
    await gotoAuthenticated(page, '/integrations');
    const btn = page.getByRole('button', { name: 'Connect platform' });
    await btn.dblclick();
    await expect(page.getByRole('dialog', { name: 'Connect platform' })).toHaveCount(1);
  });
});
