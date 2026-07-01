import { test, expect } from '@playwright/test';
import { gotoAuthenticated } from '../helpers/mattar-api.helper';
import { mattarData } from '../fixtures/mock-data/mattar.data';

test.describe('Outputs — UI Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/outputs');
    await expect(page.getByRole('heading', { name: /^outputs$/i })).toBeVisible();
  });

  test('output agent rows render', async ({ page }) => {
    await expect(page.getByText(mattarData.api.agents[0].name, { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(mattarData.api.agents[1].name, { exact: true })).toBeVisible();
  });

  test('status filter narrows visible agents', async ({ page }) => {
    await page.getByRole('button', { name: /^running$/i }).click();
    await expect(page.getByText(mattarData.api.agents[0].name, { exact: true })).toBeVisible();
  });
});
