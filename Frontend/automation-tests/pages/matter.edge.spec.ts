import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from '../fixtures/authenticated-test';
import { gotoAuthenticated, mockMattarApis } from '../helpers/mattar-api.helper';
import { mattarData } from '../fixtures/mock-data/mattar.data';

test.describe('Matter — Edge Cases', () => {
  test('long prompt input accepted', async ({ page }) => {
    await gotoAuthenticated(page, '/matter');
    const prompt = page.getByLabel(/agent prompt/i);
    await expect(prompt).not.toBeEmpty({ timeout: 10_000 });
    await prompt.fill(mattarData.edge.longPrompt);
    await expect(page.getByRole('button', { name: /save prompt/i })).toBeEnabled();
  });

  test('navigating away with unsaved changes keeps page functional', async ({ page }) => {
    await gotoAuthenticated(page, '/matter');
    await page.getByLabel(/agent prompt/i).fill('Unsaved draft');
    await page.goto('/today');
    await page.goto('/matter');
    await expect(page.getByLabel(/agent prompt/i)).toBeVisible();
  });
});
