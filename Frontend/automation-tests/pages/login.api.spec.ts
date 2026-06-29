import { test, expect } from '@playwright/test';
import { mattarData } from '../fixtures/mock-data/mattar.data';

test.describe('Login — API', () => {
  test('session endpoint 401 without token', async ({ request }) => {
    const apiBase = process.env.VITE_API_BASE_URL;
    test.skip(!apiBase, 'API base URL not configured');
    const response = await request.get(`${apiBase}/api/v1/auth/session`);
    expect(response.status()).toBe(401);
  });

  test('authorize-url returns redirect when API mocked', async ({ page }) => {
    await page.route('**/api/v1/auth/authorize-url', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://example.com/oauth', state: 'test' }),
      }),
    );
    await page.goto('/login');
    await page.getByRole('button', { name: /continue with google/i }).click();
    await expect(page).toHaveURL(/example\.com\/oauth/);
  });
});
