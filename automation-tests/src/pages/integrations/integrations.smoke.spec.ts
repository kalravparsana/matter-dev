import { test, expect } from '@playwright/test';
import { gotoAuthenticated, mockIntegrationsApi } from '../../../helpers/mattar.helper';

test.describe('Integrations — Smoke', () => {
  test.beforeEach(async ({ page }) => {
    await mockIntegrationsApi(page);
    await gotoAuthenticated(page, '/integrations');
  });

  test('page loads with Integrations heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Integrations', level: 1 })).toBeVisible();
  });

  test('Connect platform button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Connect platform' })).toBeVisible();
  });

  test('status filters are visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'all' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'connected' })).toBeVisible();
  });
});
