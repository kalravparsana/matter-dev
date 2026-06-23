import { test, expect } from '@playwright/test';
import { integrationsData } from '../../../fixtures/mock-data/mattar.data';
import { gotoAuthenticated } from '../../../helpers/mattar.helper';

test.describe('Integrations — UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ integrations: integrationsData.api.listSuccess }),
      }),
    );
    await gotoAuthenticated(page, '/integrations');
  });

  test('shows Slack CONNECTED badge', async ({ page }) => {
    await expect(page.getByText('CONNECTED').first()).toBeVisible();
  });

  test('shows Granola SYNCING badge', async ({ page }) => {
    await expect(page.getByText('SYNCING')).toBeVisible();
  });

  test('connected platform cards show signal counts', async ({ page }) => {
    await expect(page.getByText('signals today').first()).toBeVisible();
  });

  test('connect modal opens from header button', async ({ page }) => {
    await page.getByRole('button', { name: 'Connect platform' }).click();
    await expect(page.getByRole('dialog', { name: 'Connect platform' })).toBeVisible();
  });
});
