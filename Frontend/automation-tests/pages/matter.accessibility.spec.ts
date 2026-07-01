import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';

test.describe('Matter — Accessibility', () => {
  test('auto-route switch has role and aria-checked', async ({ page }) => {
    await gotoAuthenticated(page, '/matter');
    const toggle = page.getByRole('switch', { name: /auto-route outputs/i });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-checked', /.+/);
  });
});
