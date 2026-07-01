import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';

test.describe('Inputs — Accessibility', () => {
  test('toggle switches have accessible labels', async ({ page }) => {
    await gotoAuthenticated(page, '/inputs');
    await expect(page.getByRole('switch', { name: /toggle new message/i })).toBeVisible();
    await expect(page.getByRole('switch', { name: /toggle new email/i })).toBeVisible();
  });
});
