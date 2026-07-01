import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';

test.describe('Outputs — Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/outputs');
    await page.waitForLoadState('domcontentloaded');
  });

  test('page loads with primary heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /^outputs$/i })).toBeVisible();
  });

  test('add output agent button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /add output agent/i })).toBeVisible();
  });
});
