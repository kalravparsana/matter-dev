import { test, expect } from '../fixtures/authenticated-test';

test.use({ viewport: { width: 360, height: 800 } });

test.describe('Today — Mobile', () => {
  test('today page renders on small viewport', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /mattar today/i })).toBeVisible();
  });
});
