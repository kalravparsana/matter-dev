import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated } from '../helpers/mattar-api.helper';
import { mattarData } from '../fixtures/mock-data/mattar.data';

test.describe('Integrations — Form', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedSession(page);
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify(mattarData.api.integrationsWithoutGranola),
      }),
    );
    await gotoAuthenticated(page, '/integrations', { mockApis: false });
    await page.getByRole('button', { name: /connect platform/i }).click();
  });

  test('granola API key rejects short input', async ({ page }) => {
    await page.getByLabel(/granola api key/i).fill(mattarData.invalid.granolaApiKey);
    await page.getByRole('button', { name: /^save api key$/i }).click();
    await expect(page.getByRole('alert')).toContainText(/at least 8 characters/i);
  });

  test('granola API key saves with valid input', async ({ page }) => {
    await page.route('**/api/v1/integrations/granola/credentials', (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify(mattarData.api.integrations[2]),
      }),
    );
    await page.getByLabel(/granola api key/i).fill(mattarData.valid.granolaApiKey);
    await page.getByRole('button', { name: /^save api key$/i }).click();
    await expect(page.getByRole('dialog', { name: /connect platform/i })).not.toBeVisible();
  });
});
