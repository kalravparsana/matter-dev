import { test, expect } from '../fixtures/authenticated-test';

test.describe('Today — Accessibility', () => {
  test('radar has accessible label', async ({ page }) => {
    await expect(page.getByLabel(/mattar radar/i)).toBeVisible();
  });

  test('input signals list is focusable', async ({ page }) => {
    const list = page.getByLabel(/input signals list/i);
    await expect(list).toBeVisible();
  });
});
