import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';

test.describe('Matter — Form', () => {
  test('save prompt disabled until changes made', async ({ page }) => {
    await gotoAuthenticated(page, '/matter');
    await expect(page.getByRole('button', { name: /save prompt/i })).toBeDisabled();
  });

  test('valid prompt edit enables save and shows success', async ({ page }) => {
    await gotoAuthenticated(page, '/matter');
    await page.getByLabel(/agent prompt/i).fill('Updated matter rules for testing.');
    await page.getByRole('button', { name: /save prompt/i }).click();
    await expect(page.getByText(/prompt saved/i)).toBeVisible();
  });
});
