import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';

test.describe('Outputs — Accessibility', () => {
  test('add agent dialog is labeled', async ({ page }) => {
    await gotoAuthenticated(page, '/outputs');
    await page.getByRole('button', { name: /add output agent/i }).click();
    await expect(page.getByRole('dialog', { name: /add output agent/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /add output agent/i })).toBeVisible();
  });
});
