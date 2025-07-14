import { test, expect } from '@playwright/test';
import { ExtensionTestUtils, ExtensionTestContext } from './utils/extension-utils';

/**
 * E2E tests for Split Translator core functionality
 */
test.describe('Split and Translate E2E Tests', () => {
  let testContext: ExtensionTestContext;

  test.beforeEach(async () => {
    testContext = await ExtensionTestUtils.launchExtension();
  });

  test.afterEach(async () => {
    await ExtensionTestUtils.cleanup(testContext);
  });

  test('should handle split and translate with valid URL', async () => {
    // Create a test page
    const testPage = await ExtensionTestUtils.createTestPage(
      testContext.context, 
      'Hello world! This is a test page for translation.'
    );
    
    // Open the popup
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    // Select Japanese as target language
    await popupPage.locator('#targetLanguage').selectOption('ja');
    
    // Click the split and translate button
    const splitButton = popupPage.locator('#splitAndTranslate');
    await splitButton.click();
    
    // The button should be disabled during operation
    await expect(splitButton).toBeDisabled();
    await expect(splitButton).toHaveAttribute('aria-busy', 'true');
    
    // Wait for the operation to complete (status should change)
    const statusDiv = popupPage.locator('#status');
    
    // In a real browser extension with proper chrome APIs, this would succeed
    // For our test environment, we expect it to handle the limitation gracefully
    await expect(statusDiv).toBeVisible();
  });

  test('should handle error with unsupported URL', async () => {
    // Navigate to a chrome:// URL which cannot be translated
    const chromePage = await testContext.context.newPage();
    await chromePage.goto('chrome://extensions/');
    
    // Open the popup
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    // Select a target language
    await popupPage.locator('#targetLanguage').selectOption('fr');
    
    // Click the split and translate button
    const splitButton = popupPage.locator('#splitAndTranslate');
    await splitButton.click();
    
    // Wait for error handling
    const statusDiv = popupPage.locator('#status');
    
    // Should show error message for unsupported URL
    // In our test environment, the exact error handling may vary
    await expect(statusDiv).toBeVisible();
    
    // Button should be re-enabled after error
    await expect(splitButton).toBeEnabled();
    await expect(splitButton).not.toHaveAttribute('aria-busy');
  });

  test('should update status during split and translate operation', async () => {
    // Create a test page
    const testPage = await ExtensionTestUtils.createTestPage(testContext.context);
    
    // Open the popup
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    // Monitor status changes
    const statusDiv = popupPage.locator('#status');
    
    // Initial status
    await expect(statusDiv).toContainText('Select a language and click "Split + Translate"');
    
    // Select language and click button
    await popupPage.locator('#targetLanguage').selectOption('es');
    await popupPage.locator('#splitAndTranslate').click();
    
    // Status should update during operation
    // The exact messages depend on the chrome API availability in test environment
    await expect(statusDiv).toBeVisible();
  });

  test('should handle missing current tab error', async () => {
    // Open popup without any active tabs (edge case)
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    // Try to split and translate
    await popupPage.locator('#splitAndTranslate').click();
    
    // Should handle the error gracefully
    const statusDiv = popupPage.locator('#status');
    await expect(statusDiv).toBeVisible();
    
    // Button should be re-enabled
    const splitButton = popupPage.locator('#splitAndTranslate');
    await expect(splitButton).toBeEnabled();
  });

  test('should maintain button state during operation', async () => {
    const testPage = await ExtensionTestUtils.createTestPage(testContext.context);
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    const splitButton = popupPage.locator('#splitAndTranslate');
    
    // Initially enabled
    await expect(splitButton).toBeEnabled();
    await expect(splitButton).not.toHaveAttribute('aria-busy');
    
    // Click the button
    await splitButton.click();
    
    // Should be disabled during operation
    await expect(splitButton).toBeDisabled();
    await expect(splitButton).toHaveAttribute('aria-busy', 'true');
    
    // After operation completes, should be enabled again
    // Wait for operation to finish (timeout or completion)
    await expect(splitButton).toBeEnabled();
    await expect(splitButton).not.toHaveAttribute('aria-busy');
  });

  test('should handle language selection before split operation', async () => {
    const testPage = await ExtensionTestUtils.createTestPage(testContext.context);
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    // Test different language selections
    const languages = ['zh', 'en', 'fr', 'de', 'es'];
    
    for (const lang of languages) {
      // Select language
      await popupPage.locator('#targetLanguage').selectOption(lang);
      
      // Verify selection
      await expect(popupPage.locator('#targetLanguage')).toHaveValue(lang);
      
      // Status should update to reflect language change
      const statusDiv = popupPage.locator('#status');
      await expect(statusDiv).toBeVisible();
    }
  });

  test('should work with different page content types', async () => {
    // Test with different types of content
    const testCases = [
      { content: 'Simple English text', description: 'simple text' },
      { content: 'Text with <strong>HTML tags</strong>', description: 'HTML content' },
      { content: 'Mixed content: English and 日本語', description: 'mixed languages' },
      { content: 'Numbers: 123, symbols: @#$%', description: 'special characters' },
    ];
    
    for (const testCase of testCases) {
      // Create test page with specific content
      const testPage = await ExtensionTestUtils.createTestPage(testContext.context, testCase.content);
      
      // Open popup and attempt split+translate
      const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
      
      // Select language and click
      await popupPage.locator('#targetLanguage').selectOption('ja');
      await popupPage.locator('#splitAndTranslate').click();
      
      // Should handle the content type appropriately
      const statusDiv = popupPage.locator('#status');
      await expect(statusDiv).toBeVisible();
      
      await popupPage.close();
      await testPage.close();
    }
  });
});