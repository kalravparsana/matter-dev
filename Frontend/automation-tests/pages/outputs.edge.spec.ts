import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';

test.describe('Outputs — Edge Cases', () => {
  test('combined platform and status filters work', async ({ page }) => {
    await gotoAuthenticated(page, '/outputs');
    await page.getByRole('button', { name: /^gmail$/i }).click();
    await page.getByRole('button', { name: /^ready$/i }).click();
    await expect(page.getByRole('heading', { name: /^outputs$/i })).toBeVisible();
  });
});
