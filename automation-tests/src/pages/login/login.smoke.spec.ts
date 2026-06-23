import { test, expect } from '@playwright/test';
import { gotoAuthenticated } from '../../../helpers/mattar.helper';

test.describe('Login — Smoke', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /Google/i })).toBeVisible();
  });
});
