import { test, expect } from '../fixtures/authenticated-test';
import { mattarData } from '../fixtures/mock-data/mattar.data';

test.describe('Today — UI Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/signals', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mattarData.api.signals),
      }),
    );
    await page.route('**/api/v1/outputs', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mattarData.api.outputs),
      }),
    );
    await page.route('**/api/v1/metrics/today', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mattarData.api.metrics),
      }),
    );
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mattarData.api.integrations),
      }),
    );
    await page.reload();
  });

  test('radar section and input signals list render', async ({ page }) => {
    await expect(page.getByLabel(/mattar radar/i)).toBeVisible();
    await expect(page.getByText(/input signals/i).first()).toBeVisible();
    await expect(page.getByText(mattarData.api.signals[0].source)).toBeVisible();
  });

  test('pipeline summary shows metrics', async ({ page }) => {
    await expect(page.getByText(String(mattarData.api.metrics.signalsIn))).toBeVisible();
  });
});
