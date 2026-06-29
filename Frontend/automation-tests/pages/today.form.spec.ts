import { test, expect } from '../fixtures/authenticated-test';

test.describe('Today — Form', () => {
  test('no form surfaces on today page', async ({ page }) => {
    await expect(page.locator('form')).toHaveCount(0);
  });
});
