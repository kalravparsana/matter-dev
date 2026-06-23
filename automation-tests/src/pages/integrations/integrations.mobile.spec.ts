import { test, expect } from '@playwright/test';
import { gotoAuthenticated, mockIntegrationsApi } from '../../../helpers/mattar.helper';

test.describe('Integrations — Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await mockIntegrationsApi(page);
    await gotoAuthenticated(page, '/integrations');
  });

  test('heading visible on mobile', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Integrations' })).toBeVisible();
  });

  test('connect button reachable on mobile', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Connect platform' })).toBeVisible();
  });
});

test.describe('Integrations — Mobile tablet', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('grid renders on tablet', async ({ page }) => {
    await mockIntegrationsApi(page);
    await gotoAuthenticated(page, '/integrations');
    await expect(page.getByText('signals today').first()).toBeVisible();
  });
});
