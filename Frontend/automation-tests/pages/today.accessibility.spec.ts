import { test, expect } from '@playwright/test';
import { gotoAuthenticated } from '../helpers/mattar-api.helper';

test.describe('Today — Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/today');
  });

  test('radar has accessible label', async ({ page }) => {
    await expect(page.getByLabel('Mattar radar — what matters today')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('input signals list is focusable', async ({ page }) => {
    const list = page.getByLabel(/input signals list/i);
    await expect(list).toBeVisible();
  });
});
