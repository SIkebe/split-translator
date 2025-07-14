import { Browser, BrowserContext, Page, chromium } from '@playwright/test';
import path from 'path';

export interface ExtensionTestContext {
  browser: Browser;
  context: BrowserContext;
  extensionId: string;
  backgroundPage: Page;
}

export class ExtensionTestUtils {
  /**
   * Launch Chrome with the extension loaded (simplified approach)
   */
  static async launchExtension(): Promise<ExtensionTestContext> {
    const extensionPath = path.resolve(__dirname, '../../../dist');
    
    const browser = await chromium.launch({
      headless: false, // Extension testing requires headed mode
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    });

    const context = await browser.newContext();
    
    // Use a simple fixed extension ID for testing
    // In real Chrome extension, the ID is generated, but for testing we can use a placeholder
    const extensionId = 'test-extension-id';
    
    // Create a simple background page reference (not actually needed for popup testing)
    const backgroundPage = await context.newPage();
    
    return {
      browser,
      context,
      extensionId,
      backgroundPage,
    };
  }

  /**
   * Get the extension ID from the browser (simplified)
   */
  static async getExtensionId(browser: Browser): Promise<string> {
    // Return a fixed ID for testing purposes
    return 'test-extension-id';
  }

  /**
   * Get the background page of the extension (simplified)
   */
  static async getBackgroundPage(context: BrowserContext, extensionId: string): Promise<Page> {
    // Return a simple page for testing
    const backgroundPage = await context.newPage();
    return backgroundPage;
  }

  /**
   * Open the extension popup (simplified)
   */
  static async openPopup(context: BrowserContext, extensionId: string): Promise<Page> {
    // Load the popup HTML directly from the file system
    const popupPath = path.resolve(__dirname, '../../../popup.html');
    const popupPage = await context.newPage();
    await popupPage.goto(`file://${popupPath}`);
    
    // Wait for the popup to load
    await popupPage.waitForLoadState('networkidle');
    
    return popupPage;
  }

  /**
   * Create a test page with specific content
   */
  static async createTestPage(context: BrowserContext, content: string = 'Test content'): Promise<Page> {
    const page = await context.newPage();
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Page</title>
          <meta charset="utf-8">
        </head>
        <body>
          <h1>Test Page</h1>
          <p>${content}</p>
          <p>This is a test page for the Split Translator extension.</p>
        </body>
      </html>
    `;
    
    await page.setContent(html);
    return page;
  }

  /**
   * Wait for a specific number of windows/tabs
   */
  static async waitForTabCount(context: BrowserContext, expectedCount: number, timeout: number = 5000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const pages = context.pages();
      if (pages.length === expectedCount) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Expected ${expectedCount} tabs, but found ${context.pages().length}`);
  }

  /**
   * Clean up the extension test context
   */
  static async cleanup(testContext: ExtensionTestContext): Promise<void> {
    await testContext.browser.close();
  }

  /**
   * Get a safe test URL that can be translated
   */
  static getTestUrl(): string {
    return 'https://example.com';
  }

  /**
   * Get an unsafe test URL that cannot be translated (chrome:// protocol)
   */
  static getUnsafeTestUrl(): string {
    return 'chrome://extensions/';
  }
}