import { test, expect } from '@playwright/test';

test.describe('Login — Error States', () => {
  test('shows error when authorize-url fails', async ({ page }) => {
    await page.route('**/api/v1/auth/authorize-url', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Sign-in is not set up yet' }),
      }),
    );
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('mattar_tokens', JSON.stringify({ idToken: 'x' }));
    });
    await page.getByRole('button', { name: /continue with google/i }).click();
    await expect(page.getByRole('alert')).toContainText(/sign-in/i);
  });
});
