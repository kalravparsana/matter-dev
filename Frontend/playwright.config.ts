import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.VITE_FRONTEND_URL ?? 'http://localhost:5173';
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './automation-tests',
  fullyParallel: isCI,
  forbidOnly: isCI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'], viewport: { width: 768, height: 1024 } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? baseURL,
      VITE_COGNITO_DOMAIN:
        process.env.VITE_COGNITO_DOMAIN ?? 'example.auth.us-east-1.amazoncognito.com',
      VITE_COGNITO_CLIENT_ID: process.env.VITE_COGNITO_CLIENT_ID ?? 'example-client-id',
      VITE_OAUTH_REDIRECT_URI:
        process.env.VITE_OAUTH_REDIRECT_URI ?? `${baseURL}/auth/callback`,
    },
  },
});
