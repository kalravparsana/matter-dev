import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';

test.use({ viewport: { width: 768, height: 1024 } });

test.describe('Outputs — Mobile', () => {
  test('agent table visible on tablet viewport', async ({ page }) => {
    await gotoAuthenticated(page, '/outputs');
    await expect(page.getByText(/email reply sent/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
