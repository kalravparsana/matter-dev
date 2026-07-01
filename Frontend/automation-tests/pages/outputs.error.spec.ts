import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { mattarData } from '../fixtures/mock-data/mattar.data';

test.describe('Outputs — Error States', () => {
  test('no agents match filter message', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.integrations) }),
    );
    await page.route('**/api/v1/output-agents', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.agents) }),
    );
    await page.goto('/outputs');
    await page.getByRole('button', { name: /^error$/i }).click();
    await expect(page.getByText(/no output agents match this filter/i)).toBeVisible();
  });
});
