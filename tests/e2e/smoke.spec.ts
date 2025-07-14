import { test, expect } from '@playwright/test';

/**
 * Basic smoke test to verify E2E testing infrastructure
 */
test.describe('E2E Infrastructure Smoke Tests', () => {
  test('should be able to launch browser', async ({ page }) => {
    // Simple test to verify Playwright is working
    await page.goto('data:text/html,<h1>Test Page</h1>');
    await expect(page.locator('h1')).toHaveText('Test Page');
  });

  test('should be able to access extension files', async ({ page }) => {
    // Verify that extension files are built and accessible
    const fs = require('fs');
    const path = require('path');
    
    const distPath = path.resolve(__dirname, '../../dist');
    const backgroundExists = fs.existsSync(path.join(distPath, 'background.js'));
    const popupExists = fs.existsSync(path.join(distPath, 'popup.js'));
    
    expect(backgroundExists).toBe(true);
    expect(popupExists).toBe(true);
  });
});