import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated } from '../helpers/mattar-api.helper';
import { mattarData } from '../fixtures/mock-data/mattar.data';

test.describe('Inputs — Error States', () => {
  test('empty integrations shows connect prompt', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.integrationsEmpty) }),
    );
    await gotoAuthenticated(page, '/inputs', { mockApis: false });
    await expect(page.getByText(/connect a platform first/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /go to integrations/i })).toBeVisible();
  });
});
