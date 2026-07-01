import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';

test.describe('Outputs — Form', () => {
  test('add agent modal opens and closes', async ({ page }) => {
    await gotoAuthenticated(page, '/outputs');
    await page.getByRole('button', { name: /add output agent/i }).click();
    await expect(page.getByRole('dialog', { name: /add output agent/i })).toBeVisible();
    await page.getByRole('button', { name: /^cancel$/i }).click();
    await expect(page.getByRole('dialog', { name: /add output agent/i })).not.toBeVisible();
  });
});
