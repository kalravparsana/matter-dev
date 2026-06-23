import { test, expect } from '@playwright/test';
import { gotoAuthenticated } from '../../../helpers/mattar.helper';

test.describe('Integrations — Error', () => {
  test('shows empty state when no integrations', async ({ page }) => {
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ integrations: [] }),
      }),
    );
    await gotoAuthenticated(page, '/integrations');
    await expect(page.getByText('No platforms connected')).toBeVisible();
  });

  test('network abort still shows page shell', async ({ page }) => {
    await page.route('**/api/v1/integrations', (route) => route.abort());
    await gotoAuthenticated(page, '/integrations');
    await expect(page.getByRole('heading', { name: 'Integrations' })).toBeVisible();
  });
});
