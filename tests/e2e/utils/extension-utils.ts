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
   * Launch Chrome with the extension loaded
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
    
    // Get the extension ID
    const extensionId = await ExtensionTestUtils.getExtensionId(browser);
    
    // Get the background page
    const backgroundPage = await ExtensionTestUtils.getBackgroundPage(context, extensionId);
    
    return {
      browser,
      context,
      extensionId,
      backgroundPage,
    };
  }

  /**
   * Get the extension ID from the browser
   */
  static async getExtensionId(browser: Browser): Promise<string> {
    const page = await browser.newPage();
    await page.goto('chrome://extensions/');
    
    // Enable developer mode if not already enabled
    const devModeToggle = page.locator('#devMode');
    if (!(await devModeToggle.isChecked())) {
      await devModeToggle.click();
    }
    
    // Find the Split Translator extension
    const extensionCards = page.locator('extensions-item');
    const count = await extensionCards.count();
    
    for (let i = 0; i < count; i++) {
      const card = extensionCards.nth(i);
      const nameElement = card.locator('#name');
      const name = await nameElement.textContent();
      
      if (name && name.includes('Split Translator')) {
        const idElement = card.locator('#extension-id');
        const extensionId = await idElement.textContent();
        await page.close();
        return extensionId!.trim();
      }
    }
    
    await page.close();
    throw new Error('Split Translator extension not found');
  }

  /**
   * Get the background page of the extension
   */
  static async getBackgroundPage(context: BrowserContext, extensionId: string): Promise<Page> {
    const backgroundPageUrl = `chrome-extension://${extensionId}/_generated_background_page.html`;
    const backgroundPage = await context.newPage();
    await backgroundPage.goto(backgroundPageUrl);
    return backgroundPage;
  }

  /**
   * Open the extension popup
   */
  static async openPopup(context: BrowserContext, extensionId: string): Promise<Page> {
    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    const popupPage = await context.newPage();
    await popupPage.goto(popupUrl);
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