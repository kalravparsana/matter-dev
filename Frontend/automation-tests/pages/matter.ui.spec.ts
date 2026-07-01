import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';
import { mattarData } from '../fixtures/mock-data/mattar.data';

test.describe('Matter — UI Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/matter');
  });

  test('prompt prefilled from config', async ({ page }) => {
    await expect(page.getByLabel(/agent prompt/i)).toHaveValue(
      mattarData.api.matterConfig.prompt,
      { timeout: 10_000 },
    );
  });

  test('filter evaluation tabs show counts', async ({ page }) => {
    await expect(page.getByRole('button', { name: /on radar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /filtered out/i })).toBeVisible();
  });
});
