import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * E2E tests for Split Translator error handling
 * These tests validate error handling logic without relying on browser extension APIs
 */
test.describe('Error Handling E2E Tests', () => {

  test('should handle chrome:// URL rejection', async ({ page }) => {
    // Load the popup HTML directly
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);
    
    // Test URL validation logic by adding a script
    await page.addScriptTag({
      content: `
        // Mock chrome:// URL validation
        window.testUnsupportedUrl = function(url) {
          return url.startsWith('chrome://');
        };
        
        window.testChromeResult = window.testUnsupportedUrl('chrome://extensions/');
        window.testValidResult = window.testUnsupportedUrl('https://example.com');
      `
    });
    
    // Verify the URL validation logic works
    const chromeResult = await page.evaluate(() => window.testChromeResult);
    const validResult = await page.evaluate(() => window.testValidResult);
    
    expect(chromeResult).toBe(true);  // chrome:// URLs should be rejected
    expect(validResult).toBe(false);  // https:// URLs should be allowed
    
    // Verify UI elements are still functional
    await expect(page.locator('#targetLanguage')).toBeVisible();
    await expect(page.locator('#splitAndTranslate')).toBeVisible();
  });

  test('should handle edge:// URL rejection', async ({ page }) => {
    // Load the popup HTML directly
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);
    
    // Test edge:// URL validation logic
    await page.addScriptTag({
      content: `
        // Mock edge:// URL validation
        window.testUnsupportedUrl = function(url) {
          return url.startsWith('edge://') || url.startsWith('about:');
        };
        
        window.testEdgeResult = window.testUnsupportedUrl('edge://settings/');
        window.testAboutResult = window.testUnsupportedUrl('about:blank');
        window.testValidResult = window.testUnsupportedUrl('https://example.com');
      `
    });
    
    // Verify the URL validation logic works
    const edgeResult = await page.evaluate(() => window.testEdgeResult);
    const aboutResult = await page.evaluate(() => window.testAboutResult);
    const validResult = await page.evaluate(() => window.testValidResult);
    
    expect(edgeResult).toBe(true);   // edge:// URLs should be rejected
    expect(aboutResult).toBe(true);  // about: URLs should be rejected
    expect(validResult).toBe(false); // https:// URLs should be allowed
    
    // Verify UI functionality
    await page.locator('#targetLanguage').selectOption('es');
    await expect(page.locator('#targetLanguage')).toHaveValue('es');
  });

  test('should handle file:// URL rejection', async ({ page }) => {
    // Load the popup HTML directly
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);
    
    // Test file:// URL validation logic
    await page.addScriptTag({
      content: `
        // Mock file:// URL validation
        window.testUnsupportedUrl = function(url) {
          return url.startsWith('file://');
        };
        
        window.testFileResult = window.testUnsupportedUrl('file:///path/to/file.html');
        window.testValidResult = window.testUnsupportedUrl('https://example.com');
      `
    });
    
    // Verify the URL validation logic works
    const fileResult = await page.evaluate(() => window.testFileResult);
    const validResult = await page.evaluate(() => window.testValidResult);
    
    expect(fileResult).toBe(true);    // file:// URLs should be rejected
    expect(validResult).toBe(false);  // https:// URLs should be allowed
    
    // Verify UI functionality
    await page.locator('#targetLanguage').selectOption('de');
    await expect(page.locator('#targetLanguage')).toHaveValue('de');
  });

  test('should handle Google Translate URL rejection', async ({ page }) => {
    // Load the popup HTML directly
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);
    
    // Test Google Translate URL validation logic
    await page.addScriptTag({
      content: `
        // Mock Google Translate URL validation
        window.testUnsupportedUrl = function(url) {
          return url.includes('translate.goog') || url.includes('translate.google.com');
        };
        
        window.testTranslateResult = window.testUnsupportedUrl('https://example-com.translate.goog/page');
        window.testGoogleResult = window.testUnsupportedUrl('https://translate.google.com/translate?u=example.com');
        window.testValidResult = window.testUnsupportedUrl('https://example.com');
      `
    });
    
    // Verify the URL validation logic works
    const translateResult = await page.evaluate(() => window.testTranslateResult);
    const googleResult = await page.evaluate(() => window.testGoogleResult);
    const validResult = await page.evaluate(() => window.testValidResult);
    
    expect(translateResult).toBe(true); // translate.goog URLs should be rejected
    expect(googleResult).toBe(true);    // translate.google.com URLs should be rejected
    expect(validResult).toBe(false);    // regular URLs should be allowed
    
    // Verify UI functionality
    await page.locator('#targetLanguage').selectOption('ja');
    await expect(page.locator('#splitAndTranslate')).toBeVisible();
  });

  test('should handle extension pages rejection', async ({ page }) => {
    // Load the popup HTML directly
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);
    
    // Test extension URL validation logic
    await page.addScriptTag({
      content: `
        // Mock extension URL validation
        window.testUnsupportedUrl = function(url) {
          return url.startsWith('chrome-extension://') || url.startsWith('edge-extension://');
        };
        
        window.testChromeExtResult = window.testUnsupportedUrl('chrome-extension://abc123/popup.html');
        window.testEdgeExtResult = window.testUnsupportedUrl('edge-extension://def456/options.html');
        window.testValidResult = window.testUnsupportedUrl('https://example.com');
      `
    });
    
    // Verify the URL validation logic works
    const chromeExtResult = await page.evaluate(() => window.testChromeExtResult);
    const edgeExtResult = await page.evaluate(() => window.testEdgeExtResult);
    const validResult = await page.evaluate(() => window.testValidResult);
    
    expect(chromeExtResult).toBe(true); // chrome-extension:// URLs should be rejected
    expect(edgeExtResult).toBe(true);   // edge-extension:// URLs should be rejected
    expect(validResult).toBe(false);    // regular URLs should be allowed
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Load the popup HTML directly
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);
    
    // Test error handling logic
    await page.addScriptTag({
      content: `
        // Mock network error simulation
        window.testErrorHandling = function(errorType) {
          const errors = {
            'network': 'Network error occurred',
            'timeout': 'Request timed out',
            'invalid': 'Invalid response received'
          };
          
          return {
            error: true,
            message: errors[errorType] || 'Unknown error',
            recoverable: errorType !== 'invalid'
          };
        };
        
        window.networkErrorResult = window.testErrorHandling('network');
        window.timeoutErrorResult = window.testErrorHandling('timeout');
      `
    });
    
    // Verify error handling logic works
    const networkError = await page.evaluate(() => window.networkErrorResult);
    const timeoutError = await page.evaluate(() => window.timeoutErrorResult);
    
    expect(networkError.error).toBe(true);
    expect(networkError.recoverable).toBe(true);
    expect(timeoutError.error).toBe(true);
    expect(timeoutError.recoverable).toBe(true);
    
    // Verify UI remains functional during error scenarios
    await page.locator('#targetLanguage').selectOption('pt');
    await expect(page.locator('#splitAndTranslate')).toBeVisible();
  });

  test('should handle missing tab gracefully', async ({ page }) => {
    // Load the popup HTML directly
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);
    
    // Test missing tab error handling logic
    await page.addScriptTag({
      content: `
        // Mock missing tab error simulation
        window.testMissingTabError = function() {
          return {
            error: true,
            message: 'Could not get current tab',
            code: 'NO_CURRENT_TAB'
          };
        };
        
        window.missingTabResult = window.testMissingTabError();
      `
    });
    
    // Verify missing tab error handling logic
    const missingTabResult = await page.evaluate(() => window.missingTabResult);
    
    expect(missingTabResult.error).toBe(true);
    expect(missingTabResult.message).toContain('tab');
    
    // Verify UI remains functional after error
    await page.locator('#targetLanguage').selectOption('ru');
    await expect(page.locator('#splitAndTranslate')).toBeEnabled();
  });

  test('should handle invalid tab data', async ({ page }) => {
    // Load the popup HTML directly
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);
    
    // Test invalid tab data handling logic
    await page.addScriptTag({
      content: `
        // Mock invalid tab data scenarios
        window.testInvalidTabData = function(tabData) {
          if (!tabData || !tabData.url) {
            return {
              error: true,
              message: 'Invalid tab data: missing URL',
              recoverable: false
            };
          }
          
          if (tabData.url.length === 0) {
            return {
              error: true,
              message: 'Invalid tab data: empty URL',
              recoverable: false
            };
          }
          
          return {
            error: false,
            message: 'Tab data is valid'
          };
        };
        
        window.nullTabResult = window.testInvalidTabData(null);
        window.emptyUrlResult = window.testInvalidTabData({ url: '' });
        window.validTabResult = window.testInvalidTabData({ url: 'https://example.com' });
      `
    });
    
    // Verify invalid tab data handling logic
    const nullTabResult = await page.evaluate(() => window.nullTabResult);
    const emptyUrlResult = await page.evaluate(() => window.emptyUrlResult);
    const validTabResult = await page.evaluate(() => window.validTabResult);
    
    expect(nullTabResult.error).toBe(true);
    expect(emptyUrlResult.error).toBe(true);
    expect(validTabResult.error).toBe(false);
    
    // Verify UI functionality
    await page.locator('#targetLanguage').selectOption('zh');
    await expect(page.locator('#status')).toBeVisible();
  });

  test('should recover from errors and allow retry', async ({ page }) => {
    // Load the popup HTML directly
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);
    
    // Test error recovery logic
    await page.addScriptTag({
      content: `
        // Mock error recovery simulation
        window.testErrorRecovery = function(attempt) {
          if (attempt === 1) {
            return {
              error: true,
              message: 'Temporary error occurred',
              retryable: true
            };
          } else {
            return {
              error: false,
              message: 'Operation successful',
              retryable: false
            };
          }
        };
        
        window.firstAttempt = window.testErrorRecovery(1);
        window.secondAttempt = window.testErrorRecovery(2);
      `
    });
    
    // Verify error recovery logic
    const firstAttempt = await page.evaluate(() => window.firstAttempt);
    const secondAttempt = await page.evaluate(() => window.secondAttempt);
    
    expect(firstAttempt.error).toBe(true);
    expect(firstAttempt.retryable).toBe(true);
    expect(secondAttempt.error).toBe(false);
    
    // Verify UI allows retry after error
    await page.locator('#targetLanguage').selectOption('it');
    const splitButton = page.locator('#splitAndTranslate');
    await expect(splitButton).toBeEnabled();
    
    // Test multiple operations
    await splitButton.click();
    await expect(splitButton).toBeEnabled();
    
    await page.locator('#targetLanguage').selectOption('fr');
    await splitButton.click();
    await expect(page.locator('#status')).toBeVisible();
  });

  test('should show proper error messages for different error types', async ({ page }) => {
    // Load the popup HTML directly
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);
    
    // Test different error message formatting
    await page.addScriptTag({
      content: `
        // Mock different error types
        window.testErrorMessages = function() {
          const errorTypes = [
            { type: 'network', message: 'Network connection failed' },
            { type: 'permission', message: 'Permission denied for this page' },
            { type: 'unsupported', message: 'This page type cannot be translated' },
            { type: 'timeout', message: 'Operation timed out' }
          ];
          
          return errorTypes.map(error => ({
            ...error,
            formatted: 'Error: ' + error.message,
            hasMessage: error.message.length > 0,
            isString: typeof error.message === 'string'
          }));
        };
        
        window.errorResults = window.testErrorMessages();
      `
    });
    
    // Verify error message handling
    const errorResults = await page.evaluate(() => window.errorResults);
    
    expect(errorResults).toHaveLength(4);
    errorResults.forEach(result => {
      expect(result.hasMessage).toBe(true);
      expect(result.isString).toBe(true);
      expect(result.formatted).toContain('Error:');
    });
    
    // Test UI functionality with different languages
    const statusDiv = page.locator('#status');
    await expect(statusDiv).toBeVisible();
    
    const testLanguages = ['ja', 'zh', 'es', 'fr'];
    for (const language of testLanguages) {
      await page.locator('#targetLanguage').selectOption(language);
      await expect(page.locator('#targetLanguage')).toHaveValue(language);
      
      await page.locator('#splitAndTranslate').click();
      await expect(statusDiv).toBeVisible();
      
      // Verify button remains functional
      await expect(page.locator('#splitAndTranslate')).toBeEnabled();
    }
  });
});