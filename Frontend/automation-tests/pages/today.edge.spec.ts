import { test, expect } from '../fixtures/authenticated-test';

test.describe('Today — Edge Cases', () => {
  test('rapid navigation away and back preserves shell', async ({ page }) => {
    await page.goto('/integrations');
    await page.goto('/today');
    await expect(page.getByRole('heading', { name: /mattar today/i })).toBeVisible();
  });
});
