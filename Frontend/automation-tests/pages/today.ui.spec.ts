import { test, expect } from '@playwright/test';
import { gotoAuthenticated } from '../helpers/mattar-api.helper';
import { mattarData } from '../fixtures/mock-data/mattar.data';

test.describe('Today — UI Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/today');
  });

  test('radar section and input signals list render', async ({ page }) => {
    await expect(page.getByLabel('Mattar radar — what matters today')).toBeVisible();
    await expect(page.getByLabel(/input signals list/i)).toBeVisible();
  });

  test('pipeline summary shows metrics', async ({ page }) => {
    await expect(
      page.getByText(String(mattarData.api.metrics.signalsIn), { exact: true }).first(),
    ).toBeVisible();
  });
});
