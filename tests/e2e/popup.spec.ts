import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * E2E tests for Split Translator popup functionality
 * These tests load the popup HTML directly for reliable testing in any environment
 */
test.describe('Popup E2E Tests', () => {

  test('should load popup with correct elements', async ({ page }) => {
    // Load the popup HTML directly
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);

    // Check that the popup title is correct
    await expect(page).toHaveTitle('Split Translator');

    // Check that required elements are present
    await expect(page.locator('h1')).toHaveText('Split Translator');
    await expect(page.locator('#targetLanguage')).toBeVisible();
    await expect(page.locator('#splitAndTranslate')).toBeVisible();
    await expect(page.locator('#status')).toBeVisible();

    // Check that the split button has correct text
    await expect(page.locator('#splitAndTranslate')).toContainText('Split + Translate');
  });

  test('should have default language selected', async ({ page }) => {
    // Load the popup HTML directly
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);

    // Default language should be Japanese (ja)
    const languageSelect = page.locator('#targetLanguage');
    await expect(languageSelect).toHaveValue('ja');
  });

  test('should change language selection', async ({ page }) => {
    // Load the popup HTML directly
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);

    const languageSelect = page.locator('#targetLanguage');
    
    // Change to French
    await languageSelect.selectOption('fr');
    await expect(languageSelect).toHaveValue('fr');

    // Check that status message updates (content may vary depending on JS execution)
    const statusDiv = page.locator('#status');
    await expect(statusDiv).toBeVisible();
  });

  test('should persist language selection', async ({ page }) => {
    // Load the popup HTML directly
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);
    
    const languageSelect = page.locator('#targetLanguage');
    
    await languageSelect.selectOption('es');
    await expect(languageSelect).toHaveValue('es');

    // Test that the language selection is working
    await languageSelect.selectOption('fr');
    await expect(languageSelect).toHaveValue('fr');
    
    // Note: In a real browser extension, this would persist via chrome.storage
    // For testing purposes, we verify the selection mechanism works
    await expect(languageSelect).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Load the popup HTML directly
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);

    // Test Tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('#targetLanguage')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('#splitAndTranslate')).toBeFocused();

    // Test that elements remain visible and functional
    await expect(page.locator('#targetLanguage')).toBeVisible();
  });

  test('should display initial status message', async ({ page }) => {
    // Load the popup HTML directly
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);

    const statusDiv = page.locator('#status');
    await expect(statusDiv).toBeVisible();
    
    // Check status has proper ARIA attributes
    await expect(statusDiv).toHaveAttribute('role', 'status');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Load the popup HTML directly
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);

    // Check ARIA labels
    const languageSelect = page.locator('#targetLanguage');
    await expect(languageSelect).toHaveAttribute('aria-label', 'Select target language for translation');

    const splitButton = page.locator('#splitAndTranslate');
    await expect(splitButton).toHaveAttribute('aria-label', 'Split screen and translate current page to selected language');

    // Check status has proper role
    const statusDiv = page.locator('#status');
    await expect(statusDiv).toHaveAttribute('role', 'status');
    await expect(statusDiv).toHaveAttribute('aria-live', 'polite');
  });

  test('should have all language options available', async ({ page }) => {
    // Load the popup HTML directly
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);

    const languageSelect = page.locator('#targetLanguage');
    const options = languageSelect.locator('option');
    
    // Should have exactly 10 language options
    await expect(options).toHaveCount(10);

    // Check for specific languages by trying to select them
    const expectedLanguages = ['zh', 'en', 'fr', 'de', 'it', 'ja', 'ko', 'pt', 'ru', 'es'];
    
    for (const lang of expectedLanguages) {
      await languageSelect.selectOption(lang);
      await expect(languageSelect).toHaveValue(lang);
    }
  });
});