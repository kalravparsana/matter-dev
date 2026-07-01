import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated } from '../helpers/mattar-api.helper';
import { mattarData } from '../fixtures/mock-data/mattar.data';

test.describe('Integrations — API', () => {
  test('integrations list 500 shows error in connect modal', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: mattarData.api.errorMessage }) }),
    );
    await page.route('**/api/v1/integrations/slack/authorize', (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: mattarData.api.errorMessage }) }),
    );
    await gotoAuthenticated(page, '/integrations', { mockApis: false });
    await page.getByRole('button', { name: /connect platform/i }).click();
    const dialog = page.getByRole('dialog', { name: /connect platform/i });
    await dialog.getByRole('button', { name: /slack/i }).click();
    await expect(dialog.getByRole('alert')).toBeVisible();
  });

  test('authorize endpoint returns redirect URL', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.integrations) }),
    );
    await page.route('**/api/v1/integrations/slack/authorize', (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({ url: 'https://example.com/slack-oauth', state: 's1' }),
      }),
    );
    await gotoAuthenticated(page, '/integrations', { mockApis: false });
    await page.getByRole('button', { name: /connect platform/i }).click();
    await page
      .getByRole('dialog', { name: /connect platform/i })
      .getByRole('button', { name: /slack/i })
      .click();
    await expect(page).toHaveURL(/example\.com\/slack-oauth/);
  });
});
