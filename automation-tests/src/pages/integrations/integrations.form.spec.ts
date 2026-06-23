import { test, expect } from '@playwright/test';
import { integrationsData } from '../../../fixtures/mock-data/mattar.data';
import { gotoAuthenticated } from '../../../helpers/mattar.helper';

test.describe('Integrations — Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ integrations: integrationsData.api.listSuccess }),
      }),
    );
    await gotoAuthenticated(page, '/integrations');
  });

  test('connect modal lists Slack Gmail Granola', async ({ page }) => {
    await page.getByRole('button', { name: 'Connect platform' }).click();
    await expect(page.getByText('Slack')).toBeVisible();
    await expect(page.getByText('Gmail')).toBeVisible();
    await expect(page.getByText('Granola')).toBeVisible();
  });

  test('already connected platforms are disabled in modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Connect platform' }).click();
    const slackBtn = page.getByRole('button', { name: /Slack/ });
    await expect(slackBtn).toBeDisabled();
  });

  test('cancel closes connect modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Connect platform' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog', { name: 'Connect platform' })).not.toBeVisible();
  });
});
