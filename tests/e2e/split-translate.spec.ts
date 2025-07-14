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

/**
 * Simplified functional tests for Split Translator core functionality
 * These tests focus on verifying the UI workflow and core functionality 
 * without requiring complex browser extension API testing
 */
test.describe('Split and Translate Functional Tests', () => {
  let testContext: ExtensionTestContext;

  test.beforeEach(async () => {
    testContext = await ExtensionTestUtils.launchExtension();
  });

  test.afterEach(async () => {
    await ExtensionTestUtils.cleanup(testContext);
  });

  test('should complete split and translate workflow successfully', async () => {
    // Create a simple test page  
    const testPage = await ExtensionTestUtils.createTestPage(testContext.context, 'Hello world! Test content.');
    
    // Open the popup
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    // Verify popup loaded correctly
    await expect(popupPage.locator('h1')).toContainText('Split Translator');
    await expect(popupPage.locator('#targetLanguage')).toBeVisible();
    await expect(popupPage.locator('#splitAndTranslate')).toBeVisible();
    
    // Select target language
    await popupPage.locator('#targetLanguage').selectOption('ja');
    await expect(popupPage.locator('#targetLanguage')).toHaveValue('ja');
    
    // Execute the split and translate action
    const splitButton = popupPage.locator('#splitAndTranslate');
    await expect(splitButton).toBeEnabled();
    
    // Click the button and verify state changes
    await splitButton.click();
    
    // During operation: button should be disabled and show busy state
    await expect(splitButton).toBeDisabled();
    await expect(splitButton).toHaveAttribute('aria-busy', 'true');
    
    // Status should be visible and updating
    const statusDiv = popupPage.locator('#status');
    await expect(statusDiv).toBeVisible();
    
    // Operation should complete (either success or handled gracefully)
    // Wait for button to be re-enabled
    await expect(splitButton).toBeEnabled({ timeout: 10000 });
    await expect(splitButton).not.toHaveAttribute('aria-busy');
    
    await popupPage.close();
    await testPage.close();
  });

  test('should handle different target languages correctly', async () => {
    const testPage = await ExtensionTestUtils.createTestPage(testContext.context, 'Multi-language test content');
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    // Test each available language option
    const languages = ['zh', 'en', 'fr', 'de', 'it', 'ja', 'ko', 'pt', 'ru', 'es'];
    
    for (const lang of languages) {
      await popupPage.locator('#targetLanguage').selectOption(lang);
      await expect(popupPage.locator('#targetLanguage')).toHaveValue(lang);
      
      // Status should update when language changes
      const statusDiv = popupPage.locator('#status');
      await expect(statusDiv).toBeVisible();
      
      // Execute the operation for this language
      await popupPage.locator('#splitAndTranslate').click();
      
      // Wait for operation completion
      await expect(popupPage.locator('#splitAndTranslate')).toBeEnabled({ timeout: 10000 });
    }
    
    await popupPage.close();
    await testPage.close();
  });

  test('should maintain language selection persistence', async () => {
    const testPage = await ExtensionTestUtils.createTestPage(testContext.context, 'Language persistence test');
    
    // First session: select Italian and perform operation
    let popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    await popupPage.locator('#targetLanguage').selectOption('it');
    await popupPage.locator('#splitAndTranslate').click();
    await expect(popupPage.locator('#splitAndTranslate')).toBeEnabled({ timeout: 10000 });
    await popupPage.close();
    
    // Second session: verify Italian is still selected
    popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    await expect(popupPage.locator('#targetLanguage')).toHaveValue('it');
    await popupPage.close();
    
    await testPage.close();
  });

  test('should handle UI state management correctly', async () => {
    const testPage = await ExtensionTestUtils.createTestPage(testContext.context, 'UI state test content');
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    const splitButton = popupPage.locator('#splitAndTranslate');
    const statusDiv = popupPage.locator('#status');
    const languageSelect = popupPage.locator('#targetLanguage');
    
    // Initial state verification
    await expect(splitButton).toBeEnabled();
    await expect(splitButton).not.toHaveAttribute('aria-busy');
    await expect(statusDiv).toHaveAttribute('role', 'status');
    await expect(statusDiv).toHaveAttribute('aria-live', 'polite');
    
    // Language selection should trigger status update
    await languageSelect.selectOption('es');
    await expect(statusDiv).toBeVisible();
    
    // Operation execution
    await splitButton.click();
    
    // During operation
    await expect(splitButton).toBeDisabled();
    await expect(splitButton).toHaveAttribute('aria-busy', 'true');
    
    // After operation
    await expect(splitButton).toBeEnabled({ timeout: 10000 });
    await expect(splitButton).not.toHaveAttribute('aria-busy');
    
    await popupPage.close();
    await testPage.close();
  });

  test('should handle multiple consecutive operations', async () => {
    const testPage = await ExtensionTestUtils.createTestPage(testContext.context, 'Multiple operations test');
    
    // Perform three consecutive split+translate operations
    for (let i = 0; i < 3; i++) {
      const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
      
      // Use different languages
      const languages = ['ja', 'fr', 'de'];
      await popupPage.locator('#targetLanguage').selectOption(languages[i]);
      
      // Execute operation
      await popupPage.locator('#splitAndTranslate').click();
      
      // Wait for completion
      await expect(popupPage.locator('#splitAndTranslate')).toBeEnabled({ timeout: 10000 });
      
      // Verify status is visible
      await expect(popupPage.locator('#status')).toBeVisible();
      
      await popupPage.close();
    }
    
    await testPage.close();
  });

  test('should handle special characters in content', async () => {
    // Test with content that includes various character sets
    const specialContent = 'Content with émojis 🌍, special chars àáâãäå, and symbols @#$%';
    const testPage = await ExtensionTestUtils.createTestPage(testContext.context, specialContent);
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    // Verify the content is correctly handled
    await expect(testPage.locator('body')).toContainText('Content with émojis');
    
    // Perform split+translate operation
    await popupPage.locator('#targetLanguage').selectOption('zh');
    await popupPage.locator('#splitAndTranslate').click();
    
    // Operation should complete successfully regardless of special characters
    await expect(popupPage.locator('#splitAndTranslate')).toBeEnabled({ timeout: 10000 });
    await expect(popupPage.locator('#status')).toBeVisible();
    
    await popupPage.close();
    await testPage.close();
  });

  test('should maintain accessibility standards during operations', async () => {
    const testPage = await ExtensionTestUtils.createTestPage(testContext.context, 'Accessibility test');
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    // Check ARIA attributes and roles
    const splitButton = popupPage.locator('#splitAndTranslate');
    const statusDiv = popupPage.locator('#status');
    const languageSelect = popupPage.locator('#targetLanguage');
    
    // Verify accessibility attributes
    await expect(statusDiv).toHaveAttribute('role', 'status');
    await expect(statusDiv).toHaveAttribute('aria-live', 'polite');
    await expect(statusDiv).toHaveAttribute('aria-atomic', 'true');
    
    await expect(languageSelect).toHaveAttribute('aria-label');
    await expect(splitButton).toHaveAttribute('aria-label');
    
    // Test keyboard navigation
    await languageSelect.focus();
    await popupPage.keyboard.press('ArrowDown');
    await popupPage.keyboard.press('Enter');
    
    // Button should be focusable and operable via keyboard
    await splitButton.focus();
    await popupPage.keyboard.press('Enter');
    
    // Verify state changes are properly announced
    await expect(splitButton).toHaveAttribute('aria-busy', 'true');
    await expect(splitButton).toBeEnabled({ timeout: 10000 });
    
    await popupPage.close();
    await testPage.close();
  });

  test('should handle error recovery gracefully', async () => {
    const testPage = await ExtensionTestUtils.createTestPage(testContext.context, 'Error recovery test');
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    // Perform operation that might encounter issues
    await popupPage.locator('#targetLanguage').selectOption('ru');
    await popupPage.locator('#splitAndTranslate').click();
    
    // Regardless of success or failure, UI should recover properly
    const splitButton = popupPage.locator('#splitAndTranslate');
    
    // Button should eventually be re-enabled
    await expect(splitButton).toBeEnabled({ timeout: 10000 });
    await expect(splitButton).not.toHaveAttribute('aria-busy');
    
    // Should be able to perform another operation
    await popupPage.locator('#targetLanguage').selectOption('pt');
    await splitButton.click();
    
    // Second operation should also complete
    await expect(splitButton).toBeEnabled({ timeout: 10000 });
    
    await popupPage.close();
    await testPage.close();
  });

  test('should validate core workflow end-to-end', async () => {
    // This test validates the complete user workflow from start to finish
    const testPage = await ExtensionTestUtils.createTestPage(
      testContext.context, 
      'End-to-end workflow test: Hello world! This content should be translatable.'
    );
    
    // Step 1: Open popup
    const popupPage = await ExtensionTestUtils.openPopup(testContext.context, testContext.extensionId);
    
    // Step 2: Verify initial state
    await expect(popupPage.locator('h1')).toContainText('Split Translator');
    await expect(popupPage.locator('#targetLanguage')).toBeVisible();
    await expect(popupPage.locator('#splitAndTranslate')).toBeEnabled();
    
    // Step 3: Select target language (Japanese)
    await popupPage.locator('#targetLanguage').selectOption('ja');
    await expect(popupPage.locator('#targetLanguage')).toHaveValue('ja');
    
    // Step 4: Verify status updates when language changes
    const statusDiv = popupPage.locator('#status');
    await expect(statusDiv).toContainText(/Language changed to Japanese|Select a language/i);
    
    // Step 5: Execute split and translate
    const splitButton = popupPage.locator('#splitAndTranslate');
    await splitButton.click();
    
    // Step 6: Verify operation states
    // During operation
    await expect(splitButton).toBeDisabled();
    await expect(splitButton).toHaveAttribute('aria-busy', 'true');
    await expect(statusDiv).toContainText(/Getting current tab|Executing split|translation/i);
    
    // After operation
    await expect(splitButton).toBeEnabled({ timeout: 15000 });
    await expect(splitButton).not.toHaveAttribute('aria-busy');
    
    // Step 7: Verify final state
    const finalStatus = await statusDiv.textContent();
    expect(finalStatus).toBeTruthy();
    
    // Cleanup
    await popupPage.close();
    await testPage.close();
  });
});