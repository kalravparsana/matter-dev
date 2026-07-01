import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated } from '../helpers/mattar-api.helper';
import { mattarData } from '../fixtures/mock-data/mattar.data';

test.describe('Integrations — Error States', () => {
  test('granola save API error surfaces alert', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.integrationsWithoutGranola) }),
    );
    await page.route('**/api/v1/integrations/granola/credentials', (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: mattarData.api.errorMessage }) }),
    );
    await gotoAuthenticated(page, '/integrations', { mockApis: false });
    await page.getByRole('button', { name: /connect platform/i }).click();
    await page.getByLabel(/granola api key/i).fill(mattarData.valid.granolaApiKey);
    await page.getByRole('button', { name: /save api key/i }).click();
    await expect(page.getByRole('alert')).toContainText(mattarData.api.errorMessage);
  });
});
