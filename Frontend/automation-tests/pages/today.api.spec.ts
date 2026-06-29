import { test, expect } from '../fixtures/authenticated-test';
import { mattarData } from '../fixtures/mock-data/mattar.data';

test.describe('Today — API', () => {
  test('signals API 500 shows error banner', async ({ page }) => {
    await page.route('**/api/v1/signals', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: mattarData.api.errorMessage }),
      }),
    );
    await page.route('**/api/v1/outputs', (route) => route.fulfill({ status: 200, body: '[]' }));
    await page.route('**/api/v1/metrics/today', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.metrics) }),
    );
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.integrations) }),
    );
    await page.evaluate(() => {
      localStorage.setItem('mattar_tokens', JSON.stringify({ idToken: 'test' }));
    });
    await page.goto('/today');
    await expect(page.getByRole('alert')).toBeVisible();
  });
});
