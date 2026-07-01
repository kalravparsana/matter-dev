import { test, expect } from '@playwright/test';
import { gotoAuthenticated } from '../helpers/mattar-api.helper';

test.describe('Integrations — Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/integrations');
    await page.waitForLoadState('domcontentloaded');
  });

  test('page loads with primary heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /^integrations$/i })).toBeVisible();
  });

  test('connect platform button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /connect platform/i })).toBeVisible();
  });
});
