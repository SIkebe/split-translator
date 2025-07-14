import { test, expect } from '@playwright/test';

/**
 * Basic integration tests that work in most environments
 * These tests verify the built extension files and basic browser functionality
 */
test.describe('Integration Tests', () => {
  test('should have built extension files with correct structure', async ({ page }) => {
    const fs = require('fs');
    const path = require('path');
    
    const distPath = path.resolve(__dirname, '../../dist');
    const manifestPath = path.resolve(__dirname, '../../manifest.json');
    const popupPath = path.resolve(__dirname, '../../popup.html');
    
    // Verify built JavaScript files
    expect(fs.existsSync(path.join(distPath, 'background.js'))).toBe(true);
    expect(fs.existsSync(path.join(distPath, 'popup.js'))).toBe(true);
    
    // Verify manifest and popup HTML
    expect(fs.existsSync(manifestPath)).toBe(true);
    expect(fs.existsSync(popupPath)).toBe(true);
    
    // Verify manifest structure
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.name).toBe('Split Translator');
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.action.default_popup).toBe('popup.html');
  });

  test('should load popup HTML with correct structure', async ({ page }) => {
    const fs = require('fs');
    const path = require('path');
    
    const popupPath = path.resolve(__dirname, '../../popup.html');
    const popupContent = fs.readFileSync(popupPath, 'utf8');
    
    // Load popup HTML as a regular page
    await page.setContent(popupContent);
    
    // Verify key elements exist
    await expect(page.locator('h1')).toHaveText('Split Translator');
    await expect(page.locator('#targetLanguage')).toBeVisible();
    await expect(page.locator('#splitAndTranslate')).toBeVisible();
    await expect(page.locator('#status')).toBeVisible();
    
    // Verify language options
    const languageSelect = page.locator('#targetLanguage');
    const options = languageSelect.locator('option');
    await expect(options).toHaveCount(10);
    
    // Verify default selection
    await expect(languageSelect).toHaveValue('ja');
  });

  test('should have popup with proper accessibility', async ({ page }) => {
    const fs = require('fs');
    const path = require('path');
    
    const popupPath = path.resolve(__dirname, '../../popup.html');
    const popupContent = fs.readFileSync(popupPath, 'utf8');
    
    await page.setContent(popupContent);
    
    // Check ARIA attributes
    const languageSelect = page.locator('#targetLanguage');
    await expect(languageSelect).toHaveAttribute('aria-label');
    
    const splitButton = page.locator('#splitAndTranslate');
    await expect(splitButton).toHaveAttribute('aria-label');
    
    const statusDiv = page.locator('#status');
    await expect(statusDiv).toHaveAttribute('role', 'status');
    await expect(statusDiv).toHaveAttribute('aria-live', 'polite');
    
    // Check for skip link
    const skipLink = page.locator('a[href="#main"]');
    await expect(skipLink).toBeVisible();
  });

  test('should handle language selection in popup', async ({ page }) => {
    const fs = require('fs');
    const path = require('path');
    
    const popupPath = path.resolve(__dirname, '../../popup.html');
    const popupContent = fs.readFileSync(popupPath, 'utf8');
    
    await page.setContent(popupContent);
    
    const languageSelect = page.locator('#targetLanguage');
    
    // Test changing language selection
    await languageSelect.selectOption('fr');
    await expect(languageSelect).toHaveValue('fr');
    
    await languageSelect.selectOption('es');
    await expect(languageSelect).toHaveValue('es');
    
    await languageSelect.selectOption('zh');
    await expect(languageSelect).toHaveValue('zh');
  });

  test('should have properly styled popup interface', async ({ page }) => {
    const fs = require('fs');
    const path = require('path');
    
    const popupPath = path.resolve(__dirname, '../../popup.html');
    const popupContent = fs.readFileSync(popupPath, 'utf8');
    
    await page.setContent(popupContent);
    
    // Check that styles are applied
    const body = page.locator('body');
    await expect(body).toHaveCSS('width', '300px');
    
    const splitButton = page.locator('#splitAndTranslate');
    await expect(splitButton).toHaveClass(/translate-button/);
    
    const statusDiv = page.locator('#status');
    await expect(statusDiv).toHaveClass(/status/);
  });

  test('should have consistent extension metadata', async ({ page }) => {
    const fs = require('fs');
    const path = require('path');
    
    // Read package.json and manifest.json
    const packagePath = path.resolve(__dirname, '../../package.json');
    const manifestPath = path.resolve(__dirname, '../../manifest.json');
    
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Verify version consistency
    expect(manifest.version).toBe(packageJson.version);
    
    // Verify name consistency
    expect(manifest.name).toBe('Split Translator');
    expect(packageJson.name).toBe('split-translator');
    
    // Verify description exists
    expect(manifest.description).toBeTruthy();
    expect(packageJson.description).toBeTruthy();
  });

  test('should validate required permissions in manifest', async ({ page }) => {
    const fs = require('fs');
    const path = require('path');
    
    const manifestPath = path.resolve(__dirname, '../../manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Check required permissions for split translator functionality
    expect(manifest.permissions).toContain('tabs');
    expect(manifest.permissions).toContain('storage');
    expect(manifest.permissions).toContain('system.display');
    
    // Check host permissions for Google Translate
    expect(manifest.host_permissions).toContain('https://translate.google.com/*');
    
    // Verify action configuration
    expect(manifest.action.default_popup).toBe('popup.html');
    expect(manifest.action.default_title).toBe('Split Translator');
    
    // Verify background script
    expect(manifest.background.service_worker).toBe('dist/background.js');
  });
});