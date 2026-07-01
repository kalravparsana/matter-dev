import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated } from '../helpers/mattar-api.helper';
import { mattarData } from '../fixtures/mock-data/mattar.data';

test.describe('Inputs — API', () => {
  test('PATCH trigger sends enabled flag', async ({ page }) => {
    await seedAuthenticatedSession(page);
    let patchBody: { enabled?: boolean } | null = null;
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.integrations) }),
    );
    await page.route('**/api/v1/input-triggers', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.triggers) }),
    );
    await page.route('**/api/v1/input-triggers/trg-1', (route) => {
      patchBody = route.request().postDataJSON() as { enabled?: boolean };
      return route.fulfill({
        status: 200,
        body: JSON.stringify({ ...mattarData.api.triggers[0], enabled: patchBody?.enabled }),
      });
    });
    await gotoAuthenticated(page, '/inputs', { mockApis: false });
    await page.getByRole('switch', { name: /toggle new message/i }).click();
    expect(patchBody).toEqual({ enabled: false });
  });

  test('triggers 500 still renders page shell', async ({ page }) => {
    await seedAuthenticatedSession(page);
    await page.route('**/api/v1/integrations', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify(mattarData.api.integrations) }),
    );
    await page.route('**/api/v1/input-triggers', (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: mattarData.api.errorMessage }) }),
    );
    await gotoAuthenticated(page, '/inputs', { mockApis: false });
    await expect(page.getByRole('heading', { name: /^inputs$/i })).toBeVisible();
  });
});
