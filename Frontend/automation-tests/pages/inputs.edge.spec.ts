import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';

test.describe('Inputs — Edge Cases', () => {
  test('rapid toggle clicks keep page stable', async ({ page }) => {
    await gotoAuthenticated(page, '/inputs');
    const toggle = page.getByRole('switch', { name: /toggle new message/i });
    await toggle.click();
    await toggle.click();
    await toggle.click();
    await expect(page.getByRole('heading', { name: /^inputs$/i })).toBeVisible();
  });
});
