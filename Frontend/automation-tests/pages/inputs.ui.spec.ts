import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';
import { mattarData } from '../fixtures/mock-data/mattar.data';

test.describe('Inputs — UI Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/inputs');
  });

  test('platform filter shows slack triggers', async ({ page }) => {
    await page.getByRole('button', { name: /^slack$/i }).click();
    await expect(page.getByText(mattarData.api.triggers[0].label)).toBeVisible();
  });

  test('disabled trigger shows paused last event', async ({ page }) => {
    await expect(page.getByText('New email', { exact: true })).toBeVisible();
    await expect(page.getByText('Paused').first()).toBeVisible();
  });
});
