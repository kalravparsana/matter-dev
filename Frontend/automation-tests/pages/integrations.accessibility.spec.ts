import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';

test.describe('Integrations — Accessibility', () => {
  test('connect modal has dialog label and labeled input', async ({ page }) => {
    await gotoAuthenticated(page, '/integrations');
    await page.getByRole('button', { name: /connect platform/i }).click();
    await expect(page.getByRole('dialog', { name: /connect platform/i })).toBeVisible();
    await expect(page.getByLabel(/granola api key/i)).toBeVisible();
  });
});
