import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';
import { mattarData } from '../fixtures/mock-data/mattar.data';

test.describe('Integrations — UI Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAuthenticated(page, '/integrations');
  });

  test('connected platform cards render', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Slack' })).toBeVisible();
    await expect(page.getByText(mattarData.api.integrations[1].account!)).toBeVisible();
  });

  test('status filter tabs are interactive', async ({ page }) => {
    await page.getByRole('button', { name: /^connected$/i }).click();
    await expect(page.getByRole('heading', { name: 'Slack' })).toBeVisible();
  });
});
