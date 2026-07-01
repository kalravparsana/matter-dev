import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';

test.use({ viewport: { width: 360, height: 800 } });

test.describe('Matter — Mobile', () => {
  test('prompt and save button usable on mobile', async ({ page }) => {
    await gotoAuthenticated(page, '/matter');
    await expect(page.getByLabel(/agent prompt/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /save prompt/i })).toBeVisible();
  });
});
