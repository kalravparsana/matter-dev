import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';

test.describe('Inputs — Form', () => {
  test('toggle switch changes aria-checked state', async ({ page }) => {
    await gotoAuthenticated(page, '/inputs');
    const toggle = page.getByRole('switch', { name: /toggle new message/i });
    const initial = await toggle.getAttribute('aria-checked');
    await toggle.click();
    await expect(toggle).not.toHaveAttribute('aria-checked', initial ?? '');
  });
});
