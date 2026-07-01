import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';

test.describe('Inputs — Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/inputs');
    await page.waitForLoadState('domcontentloaded');
  });

  test('page loads with primary heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /^inputs$/i })).toBeVisible();
  });

  test('trigger table renders when integrations exist', async ({ page }) => {
    await expect(page.getByText(/new message/i)).toBeVisible();
  });
});
