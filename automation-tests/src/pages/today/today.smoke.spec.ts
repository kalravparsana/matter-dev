import { test, expect } from '@playwright/test';
import { gotoAuthenticated } from '../../../helpers/mattar.helper';
import { todayData } from '../../../fixtures/mock-data/mattar.data';

test.describe('Today — Smoke', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/today');
  });

  test('Mattar Today heading visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: todayData.valid.heading })).toBeVisible();
  });

  test('radar section present', async ({ page }) => {
    await expect(page.getByLabel('Mattar radar — what matters today')).toBeVisible();
  });
});
