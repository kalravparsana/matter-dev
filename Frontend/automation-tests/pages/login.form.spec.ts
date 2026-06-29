import { test, expect } from '@playwright/test';

test.describe('Login — Form / Interaction', () => {
  test('blocks demo sign-in when OAuth is not configured', async ({ page }) => {
    await page.goto('/login');
    const button = page.getByRole('button', { name: /continue with google/i });
    await expect(button).toBeDisabled();
    await expect(page.getByText(/sign-in requires cognito oauth/i)).toBeVisible();
  });

  test('redirects to Cognito when OAuth is configured and authorize-url succeeds', async ({
    page,
  }) => {
    test.skip(
      !process.env.VITE_API_BASE_URL ||
        !process.env.VITE_COGNITO_DOMAIN ||
        !process.env.VITE_COGNITO_CLIENT_ID ||
        !process.env.VITE_OAUTH_REDIRECT_URI,
      'Cognito OAuth env vars are not configured for this run',
    );

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
