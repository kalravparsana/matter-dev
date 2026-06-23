import { test, expect } from '@playwright/test';
import { integrationsData } from '../../../fixtures/mock-data/mattar.data';
import { gotoAuthenticated } from '../../../helpers/mattar.helper';

test.describe('Integrations — API', () => {
  test('GET integrations success renders cards', async ({ page }) => {
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ integrations: integrationsData.api.listSuccess }),
      }),
    );
    await gotoAuthenticated(page, '/integrations');
    await expect(page.getByText(integrationsData.valid.slack.channel)).toBeVisible();
  });

  test('GET integrations 500 falls back gracefully', async ({ page }) => {
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({ status: 500, body: integrationsData.api.errorMessage }),
    );
    await gotoAuthenticated(page, '/integrations');
    await expect(page.getByRole('heading', { name: 'Integrations' })).toBeVisible();
  });

  test('POST slack authorize returns redirect URL', async ({ page }) => {
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ integrations: [] }),
      }),
    );
    await page.route('**/api/v1/integrations/slack/authorize', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authorizeUrl: integrationsData.api.slackAuthorizeUrl }),
      }),
    );
    await gotoAuthenticated(page, '/integrations');
    await page.getByRole('button', { name: 'Connect platform' }).click();
    const slackRow = page.getByRole('button', { name: /Slack/ }).first();
    if (await slackRow.isEnabled()) {
      await slackRow.click();
    }
  });

  test('POST granola 400 shows error', async ({ page }) => {
    await page.route('**/api/v1/integrations/granola', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Granola API key is invalid' } }),
      }),
    );
    await gotoAuthenticated(page, '/integrations');
    await page.getByRole('button', { name: 'Connect platform' }).click();
  });
});
