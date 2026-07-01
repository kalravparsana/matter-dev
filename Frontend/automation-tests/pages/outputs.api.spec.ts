import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated } from '../helpers/mattar-api.helper';
import { mattarData } from '../fixtures/mock-data/mattar.data';

test.describe('Outputs — API', () => {
  test('output-agents 500 still renders page shell', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.integrations) }),
    );
    await page.route('**/api/v1/output-agents', (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: mattarData.api.errorMessage }) }),
    );
    await gotoAuthenticated(page, '/outputs', { mockApis: false });
    await expect(page.getByRole('heading', { name: /^outputs$/i })).toBeVisible();
  });

  test('empty integrations list shows empty state', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.integrationsEmpty) }),
    );
    await gotoAuthenticated(page, '/outputs', { mockApis: false });
    await expect(page.getByText(/connect a platform first/i)).toBeVisible();
  });
});
