import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright configuration for E2E testing of Split Translator browser extension
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot only on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    // Smoke tests that work in any environment (can use headless mode)
    {
      name: 'smoke-tests',
      testMatch: ['**/smoke.spec.ts', '**/integration.spec.ts', '**/functional.spec.ts', '**/popup.spec.ts', '**/error-handling.spec.ts', '**/split-translate.spec.ts'],
      use: { 
        ...devices['Desktop Chrome'],
        // Smoke tests can run in headless mode as they don't use extension APIs
      },
    },
    
    // Full extension tests (require non-headless mode + display server)
    // Currently disabled as they require complex setup
    {
      name: 'chromium-extension',
      testIgnore: ['**/smoke.spec.ts', '**/integration.spec.ts', '**/functional.spec.ts', '**/popup.spec.ts', '**/error-handling.spec.ts', '**/split-translate.spec.ts'],
      use: { 
        ...devices['Desktop Chrome'],
        // Browser extension testing configuration
        launchOptions: {
          // Chrome extensions require non-headless mode, even in CI
          headless: false,
          args: [
            `--disable-extensions-except=${path.resolve(__dirname, './dist')}`,
            `--load-extension=${path.resolve(__dirname, './dist')}`,
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            // Additional flags for CI environments
            ...(process.env.CI ? [
              '--disable-gpu',
              '--disable-web-security',
              '--disable-features=VizDisplayCompositor',
            ] : []),
          ],
        },
      },
    },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});