import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';

test.describe('Matter — Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/matter');
    await page.waitForLoadState('domcontentloaded');
  });

  test('page loads with primary heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /matter agent/i })).toBeVisible();
  });

  test('agent prompt textarea is visible', async ({ page }) => {
    await expect(page.getByLabel(/agent prompt/i)).toBeVisible();
  });
});
