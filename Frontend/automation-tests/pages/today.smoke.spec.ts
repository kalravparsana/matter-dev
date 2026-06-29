import { test, expect } from '../fixtures/authenticated-test';
import { mattarData } from '../fixtures/mock-data/mattar.data';

test.describe('Today — Smoke Tests', () => {
  test('Mattar Today heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /mattar today/i })).toBeVisible();
  });

  test('integration status badges render', async ({ page }) => {
    await expect(page.getByText(/slack/i).first()).toBeVisible();
    await expect(page.getByText(/gmail/i).first()).toBeVisible();
    await expect(page.getByText(/granola/i).first()).toBeVisible();
  });
});
