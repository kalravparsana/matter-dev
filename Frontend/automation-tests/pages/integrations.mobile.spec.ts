import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('Integrations — Mobile', () => {
  test('heading and connect button visible on mobile', async ({ page }) => {
    await gotoAuthenticated(page, '/integrations');
    await expect(page.getByRole('heading', { name: /^integrations$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /connect platform/i })).toBeVisible();
  });
});
