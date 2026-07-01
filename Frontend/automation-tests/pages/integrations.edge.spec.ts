import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';
import { mattarData } from '../fixtures/mock-data/mattar.data';

test.describe('Integrations — Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/integrations');
  });

  test('rapid filter toggling does not break layout', async ({ page }) => {
    const filters = ['connected', 'syncing', 'error', 'all'] as const;
    for (const f of filters) {
      await page.getByRole('button', { name: new RegExp(`^${f}$`, 'i') }).click();
    }
    await expect(page.getByRole('heading', { name: /^integrations$/i })).toBeVisible();
  });

  test('xss-like granola key is accepted by client validation', async ({ page }) => {
    await page.getByRole('button', { name: /connect platform/i }).click();
    await page.getByLabel(/granola api key/i).fill(mattarData.edge.xssLikeText.padEnd(8, 'x'));
    await expect(page.getByLabel(/granola api key/i)).toHaveValue(mattarData.edge.xssLikeText.padEnd(8, 'x'));
  });
});
