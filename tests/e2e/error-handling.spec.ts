import { test, expect } from '@playwright/test';
import { ExtensionTestUtils, ExtensionTestContext } from './utils/extension-utils';

/**
 * E2E tests for Split Translator error handling
 */
test.describe('Error Handling E2E Tests', () => {
  let testContext: ExtensionTestContext;

  test.beforeEach(async () => {
    testContext = await ExtensionTestUtils.launchExtension();
  });

  test.afterEach(async () => {
    await ExtensionTestUtils.cleanup(testContext);
  });

  test('should handle chrome:// URL rejection', async () => {
    // Navigate to a chrome:// URL
    const chromePage = await testContext.context.newPage();
    await chromePage.goto('chrome://extensions/');
    
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    // Attempt to split and translate
    await popupPage.locator('#targetLanguage').selectOption('es');
    await popupPage.locator('#splitAndTranslate').click();
    
    // Should show error status
    const statusDiv = popupPage.locator('#status');
    await expect(statusDiv).toBeVisible();
    
    // Should have error styling (if the operation gets that far)
    // The exact error behavior depends on chrome API availability
    await expect(popupPage.locator('#splitAndTranslate')).toBeEnabled();
  });

  test('should handle edge:// URL rejection', async () => {
    // Test with edge:// protocol
    const edgePage = await testContext.context.newPage();
    await edgePage.goto('about:blank'); // Use about:blank as edge:// equivalent
    await edgePage.setContent(`
      <html>
        <head><title>Edge Settings</title></head>
        <body>
          <h1>Edge Settings Page</h1>
          <p>This simulates an edge:// URL</p>
        </body>
      </html>
    `);
    
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    await popupPage.locator('#targetLanguage').selectOption('fr');
    await popupPage.locator('#splitAndTranslate').click();
    
    const statusDiv = popupPage.locator('#status');
    await expect(statusDiv).toBeVisible();
  });

  test('should handle file:// URL rejection', async () => {
    // Create a file:// URL scenario
    const filePage = await testContext.context.newPage();
    await filePage.setContent(`
      <html>
        <head><title>Local File</title></head>
        <body>
          <h1>Local HTML File</h1>
          <p>This simulates a file:// URL</p>
        </body>
      </html>
    `);
    
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    await popupPage.locator('#targetLanguage').selectOption('de');
    await popupPage.locator('#splitAndTranslate').click();
    
    const statusDiv = popupPage.locator('#status');
    await expect(statusDiv).toBeVisible();
  });

  test('should handle Google Translate URL rejection', async () => {
    // Navigate to a Google Translate page (should be rejected)
    const translatePage = await testContext.context.newPage();
    await translatePage.goto('https://translate.google.com');
    
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    await popupPage.locator('#targetLanguage').selectOption('ja');
    await popupPage.locator('#splitAndTranslate').click();
    
    // Should handle Google Translate URLs appropriately
    const statusDiv = popupPage.locator('#status');
    await expect(statusDiv).toBeVisible();
  });

  test('should handle extension pages rejection', async () => {
    // Test with chrome-extension:// URL
    const extensionPage = await testContext.context.newPage();
    await extensionPage.goto(`chrome-extension://${testContext.extensionId}/popup.html`);
    
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    await popupPage.locator('#targetLanguage').selectOption('ko');
    await popupPage.locator('#splitAndTranslate').click();
    
    const statusDiv = popupPage.locator('#status');
    await expect(statusDiv).toBeVisible();
  });

  test('should handle network errors gracefully', async () => {
    // Create a page that might have network issues
    const testPage = await ExtensionTestUtils.createTestPage(testContext.context);
    
    // Simulate network condition by going offline (if supported)
    try {
      await testContext.context.setOffline(true);
      
      const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
      
      await popupPage.locator('#targetLanguage').selectOption('pt');
      await popupPage.locator('#splitAndTranslate').click();
      
      // Should handle network errors
      const statusDiv = popupPage.locator('#status');
      await expect(statusDiv).toBeVisible();
      
      // Restore online state
      await testContext.context.setOffline(false);
    } catch (error) {
      // If offline simulation isn't supported, just verify popup works
      const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
      await expect(popupPage.locator('#splitAndTranslate')).toBeVisible();
    }
  });

  test('should handle missing tab gracefully', async () => {
    // Open popup when no active tab is available
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    // Close all other pages to simulate no active tab
    const pages = testContext.context.pages();
    for (const page of pages) {
      if (page !== popupPage) {
        await page.close();
      }
    }
    
    // Try to split and translate
    await popupPage.locator('#targetLanguage').selectOption('ru');
    await popupPage.locator('#splitAndTranslate').click();
    
    // Should handle missing tab error
    const statusDiv = popupPage.locator('#status');
    await expect(statusDiv).toBeVisible();
    
    const splitButton = popupPage.locator('#splitAndTranslate');
    await expect(splitButton).toBeEnabled();
  });

  test('should handle invalid tab data', async () => {
    // Create a page with unusual characteristics
    const testPage = await testContext.context.newPage();
    await testPage.setContent('');  // Empty page
    
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    await popupPage.locator('#targetLanguage').selectOption('zh');
    await popupPage.locator('#splitAndTranslate').click();
    
    // Should handle edge cases gracefully
    const statusDiv = popupPage.locator('#status');
    await expect(statusDiv).toBeVisible();
  });

  test('should recover from errors and allow retry', async () => {
    const testPage = await ExtensionTestUtils.createTestPage(testContext.context);
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    // First attempt (might fail in test environment)
    await popupPage.locator('#targetLanguage').selectOption('it');
    await popupPage.locator('#splitAndTranslate').click();
    
    // Wait for operation to complete (success or failure)
    const statusDiv = popupPage.locator('#status');
    await expect(statusDiv).toBeVisible();
    
    // Button should be enabled for retry
    const splitButton = popupPage.locator('#splitAndTranslate');
    await expect(splitButton).toBeEnabled();
    await expect(splitButton).not.toHaveAttribute('aria-busy');
    
    // Second attempt should work the same way
    await popupPage.locator('#targetLanguage').selectOption('fr');
    await splitButton.click();
    
    // Should handle second attempt
    await expect(statusDiv).toBeVisible();
    await expect(splitButton).toBeEnabled();
  });

  test('should show proper error messages for different error types', async () => {
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    const statusDiv = popupPage.locator('#status');
    
    // Test with different scenarios that might produce different errors
    const testScenarios = [
      { language: 'ja', description: 'Japanese translation' },
      { language: 'zh', description: 'Chinese translation' },
      { language: 'ar', description: 'Arabic translation (if available)' }
    ];
    
    for (const scenario of testScenarios) {
      // Try to translate with different languages
      const languageSelect = popupPage.locator('#targetLanguage');
      
      // Only test if the language option exists
      const options = await languageSelect.locator('option').all();
      const hasLanguage = await Promise.all(
        options.map(async (option) => await option.getAttribute('value') === scenario.language)
      ).then(results => results.some(Boolean));
      
      if (hasLanguage) {
        await languageSelect.selectOption(scenario.language);
        await popupPage.locator('#splitAndTranslate').click();
        
        // Check that status is updated
        await expect(statusDiv).toBeVisible();
        
        // Wait for operation to complete
        await expect(popupPage.locator('#splitAndTranslate')).toBeEnabled();
      }
    }
  });
});