import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';

test.use({ viewport: { width: 375, height: 812 } });

test.describe('Inputs — Mobile', () => {
  test('trigger list readable on small viewport', async ({ page }) => {
    await gotoAuthenticated(page, '/inputs');
    await expect(page.getByText(/new message/i)).toBeVisible();
  });
});
