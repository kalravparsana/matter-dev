import { test, expect } from '@playwright/test';
import { gotoAuthenticated, mockIntegrationsApi } from '../../../helpers/mattar.helper';

test.describe('Integrations — Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await mockIntegrationsApi(page);
    await gotoAuthenticated(page, '/integrations');
  });

  test('page has single h1', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });

  test('connect modal is a dialog with label', async ({ page }) => {
    await page.getByRole('button', { name: 'Connect platform' }).click();
    await expect(page.getByRole('dialog', { name: 'Connect platform' })).toBeVisible();
  });

  test('filter buttons are keyboard focusable', async ({ page }) => {
    await page.getByRole('button', { name: 'connected' }).focus();
    await expect(page.getByRole('button', { name: 'connected' })).toBeFocused();
  });
});
