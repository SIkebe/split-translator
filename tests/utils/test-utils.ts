// Common test utilities for Split Translator

import { ChromeApiMock, MockChromeTab, MockChromeWindow, MockDisplayInfo } from '../mocks/chrome-api.mock';

export class TestUtils {
  // Wait for promises to resolve (optimized for test environment)
  static async waitForPromises(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  // Wait for a specific condition with timeout
  static async waitFor(
    condition: () => boolean,
    timeout: number = 1000,
    interval: number = 10
  ): Promise<void> {
    const start = Date.now();
    while (!condition() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    if (!condition()) {
      throw new Error(`Condition not met within ${timeout}ms`);
    }
  }

  // Create a mock error
  static createMockError(message: string = 'Test error'): Error {
    return new Error(message);
  }

  // Create URL test cases
  static getUrlTestCases() {
    return {
      valid: [
        'https://example.com',
        'http://example.org',
        'https://www.google.com/search?q=test',
        'https://github.com/user/repo',
      ],
      unsupported: [
        'chrome://extensions/',
        'edge://settings/',
        'about:blank',
        'chrome-extension://abcd1234/popup.html',
        'edge-extension://efgh5678/options.html',
        'file:///C:/Users/test/file.html',
        'https://example-translate.goog/translated',
      ],
    };
  }

  // Create window dimension test cases
  static getWindowTestCases() {
    return {
      normal: { width: 1200, height: 800 },
      small: { width: 400, height: 300 },
      large: { width: 2560, height: 1440 },
      ultrawide: { width: 3440, height: 1440 },
      portrait: { width: 800, height: 1200 },
    };
  }

  // Create display configuration test cases
  static getDisplayTestCases(): Record<string, MockDisplayInfo[]> {
    return {
      singleDisplay: [
        ChromeApiMock.createMockDisplay({
          id: 'primary',
          workArea: { left: 0, top: 0, width: 1920, height: 1080 },
        }),
      ],
      dualDisplay: [
        ChromeApiMock.createMockDisplay({
          id: 'primary',
          workArea: { left: 0, top: 0, width: 1920, height: 1080 },
        }),
        ChromeApiMock.createMockDisplay({
          id: 'secondary',
          workArea: { left: 1920, top: 0, width: 1920, height: 1080 },
        }),
      ],
      mixedDisplays: [
        ChromeApiMock.createMockDisplay({
          id: 'primary',
          workArea: { left: 0, top: 0, width: 1920, height: 1080 },
        }),
        ChromeApiMock.createMockDisplay({
          id: 'secondary',
          workArea: { left: 1920, top: 0, width: 2560, height: 1440 },
        }),
      ],
    };
  }

  // Setup DOM environment for popup tests
  static setupPopupDOM(): {
    targetLanguageSelect: HTMLSelectElement;
    splitAndTranslateButton: HTMLButtonElement;
    statusDiv: HTMLDivElement;
  } {
    document.body.innerHTML = `
      <select id="targetLanguage">
        <option value="ja">🇯🇵 Japanese</option>
        <option value="en">🇺🇸 English</option>
        <option value="es">🇪🇸 Spanish</option>
        <option value="fr">🇫🇷 French</option>
      </select>
      <button id="splitAndTranslate">Split + Translate</button>
      <div id="status"></div>
    `;

    const targetLanguageSelect = document.getElementById('targetLanguage') as HTMLSelectElement;
    const splitAndTranslateButton = document.getElementById('splitAndTranslate') as HTMLButtonElement;
    const statusDiv = document.getElementById('status') as HTMLDivElement;

    return {
      targetLanguageSelect,
      splitAndTranslateButton,
      statusDiv,
    };
  }

  // Clean up DOM
  static cleanupDOM(): void {
    document.body.innerHTML = '';
  }

  // Mock setTimeout/setInterval for faster tests
  static mockTimers(): void {
    jest.useFakeTimers();
  }

  static restoreTimers(): void {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  }

  // Assert window position within tolerance
  static assertWindowPosition(
    actual: { left: number; top: number; width: number; height: number },
    expected: { left: number; top: number; width: number; height: number },
    tolerance: number = 5
  ): void {
    expect(actual.left).toBeCloseTo(expected.left, tolerance);
    expect(actual.top).toBeCloseTo(expected.top, tolerance);
    expect(actual.width).toBeCloseTo(expected.width, tolerance);
    expect(actual.height).toBeCloseTo(expected.height, tolerance);
  }

  // Create message event for testing
  static createMessageEvent<T>(data: T): MessageEvent<T> {
    return new MessageEvent('message', {
      data,
      origin: 'chrome-extension://test',
    });
  }

  // Mock console methods with spy capability
  static mockConsole(): {
    log: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
    info: jest.SpyInstance;
  } {
    return {
      log: jest.spyOn(console, 'log').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation(),
    };
  }

  // Restore console methods
  static restoreConsole(): void {
    jest.restoreAllMocks();
  }

  // Generate random test data
  static generateRandomString(length: number = 10): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static generateRandomNumber(min: number = 0, max: number = 1000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
