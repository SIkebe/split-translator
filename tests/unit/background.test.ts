// Unit tests for background.ts

import { ChromeApiMock, MockChromeTab, MockChromeWindow } from '../mocks/chrome-api.mock';
import { TestUtils } from '../utils/test-utils';

// Mock the background script
const backgroundModule = require('../../src/background.ts');

describe('Background Script Unit Tests', () => {
  beforeEach(() => {
    ChromeApiMock.setupDefaultMocks();
    TestUtils.mockConsole();
  });

  afterEach(() => {
    jest.clearAllMocks();
    TestUtils.restoreConsole();
  });

  describe('Constants', () => {
    it('should have correct constant values', () => {
      expect(backgroundModule.OVERLAP_PIXELS).toBe(8);
      expect(backgroundModule.MIN_WINDOW_WIDTH).toBe(400);
      expect(backgroundModule.MIN_WINDOW_HEIGHT).toBe(300);
      expect(backgroundModule.DEFAULT_WINDOW_WIDTH).toBe(800);
      expect(backgroundModule.DEFAULT_WINDOW_HEIGHT).toBe(600);
    });
  });

  describe('handleError', () => {
    it('should return error object with message', () => {
      const error = new Error('Test error message');
      const context = 'Test context';
      
      const result = backgroundModule.handleError(error, context);
      
      expect(result).toEqual({
        success: false,
        error: 'Test error message'
      });
      expect(console.error).toHaveBeenCalledWith('Test context:', error);
    });

    it('should handle error without message', () => {
      const error = new Error();
      const context = 'Test context';
      
      const result = backgroundModule.handleError(error, context);
      
      expect(result).toEqual({
        success: false,
        error: 'Unknown error'
      });
    });
  });

  describe('enforceMinimumDimensions', () => {
    it('should return unchanged bounds when above minimum', () => {
      const bounds = {
        left: 100,
        top: 50,
        width: 800,
        height: 600
      };
      
      const result = backgroundModule.enforceMinimumDimensions(bounds);
      
      expect(result).toEqual(bounds);
    });

    it('should enforce minimum width', () => {
      const bounds = {
        left: 100,
        top: 50,
        width: 200, // Below minimum
        height: 600
      };
      
      const result = backgroundModule.enforceMinimumDimensions(bounds);
      
      expect(result).toEqual({
        left: 100,
        top: 50,
        width: 400, // Enforced minimum
        height: 600
      });
    });

    it('should enforce minimum height', () => {
      const bounds = {
        left: 100,
        top: 50,
        width: 800,
        height: 200 // Below minimum
      };
      
      const result = backgroundModule.enforceMinimumDimensions(bounds);
      
      expect(result).toEqual({
        left: 100,
        top: 50,
        width: 800,
        height: 300 // Enforced minimum
      });
    });

    it('should enforce both minimum width and height', () => {
      const bounds = {
        left: 100,
        top: 50,
        width: 200, // Below minimum
        height: 100 // Below minimum
      };
      
      const result = backgroundModule.enforceMinimumDimensions(bounds);
      
      expect(result).toEqual({
        left: 100,
        top: 50,
        width: 400, // Enforced minimum
        height: 300 // Enforced minimum
      });
    });
  });

  describe('waitForTabReady', () => {
    it('should resolve immediately when tab status is complete', async () => {
      const completeTab = ChromeApiMock.createMockTab({ status: 'complete' });
      chrome.tabs.get = jest.fn().mockResolvedValue(completeTab);

      await backgroundModule.waitForTabReady(1);

      expect(chrome.tabs.get).toHaveBeenCalledWith(1);
    });

    it('should handle tab get errors gracefully', async () => {
      chrome.tabs.get = jest.fn().mockRejectedValue(new Error('Tab not found'));

      await backgroundModule.waitForTabReady(999);

      expect(chrome.tabs.get).toHaveBeenCalledWith(999);
    });

    it('should wait for tab to become complete', async () => {
      // Mock tab.get to return loading first, then complete after a few calls
      let callCount = 0;
      (chrome.tabs.get as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount <= 2) { // Complete after 2 loading calls
          return Promise.resolve({ status: 'loading' });
        }
        return Promise.resolve({ status: 'complete' });
      });

      // Use a very short timeout for fast testing
      await backgroundModule.waitForTabReady(123, 300);
      
      expect(chrome.tabs.get).toHaveBeenCalledWith(123);
      expect(callCount).toBeGreaterThan(1);
    });

    it('should timeout after maxWaitTime', async () => {
      // Mock tab.get to always return loading status
      (chrome.tabs.get as jest.Mock).mockResolvedValue({ status: 'loading' });

      // Use a very short timeout (10ms) for fast testing
      await backgroundModule.waitForTabReady(123, 10);
      
      expect(chrome.tabs.get).toHaveBeenCalledWith(123);
    });
  });

  describe('getDisplayBounds', () => {
    it('should return display bounds when displays are available', () => {
      const displays = [ChromeApiMock.DEFAULT_DISPLAY];
      const currentWindow = ChromeApiMock.DEFAULT_WINDOW;
      
      const result = backgroundModule.getDisplayBounds(displays, currentWindow);
      
      expect(result).toEqual({
        left: 0,
        top: 0,
        width: 1920,
        height: 1080
      });
    });

    it('should return window bounds when no displays available', () => {
      const displays: any[] = [];
      const currentWindow = ChromeApiMock.createMockWindow({
        left: 100,
        top: 50,
        width: 1200,
        height: 800
      });
      
      const result = backgroundModule.getDisplayBounds(displays, currentWindow);
      
      expect(result).toEqual({
        left: 100,
        top: 50,
        width: 1200,
        height: 800
      });
    });

    it('should use defaults when window dimensions are undefined', () => {
      const displays: any[] = [];
      const currentWindow = ChromeApiMock.createMockWindow({
        left: undefined,
        top: undefined,
        width: undefined,
        height: undefined
      });
      
      const result = backgroundModule.getDisplayBounds(displays, currentWindow);
      
      expect(result).toEqual({
        left: 0,
        top: 0,
        width: 800, // DEFAULT_WINDOW_WIDTH
        height: 600 // DEFAULT_WINDOW_HEIGHT
      });
    });

    it('should find correct display for window center point', () => {
      const displays = [
        ChromeApiMock.createMockDisplay({
          id: 'primary',
          workArea: { left: 0, top: 0, width: 1920, height: 1080 }
        }),
        ChromeApiMock.createMockDisplay({
          id: 'secondary',
          workArea: { left: 1920, top: 0, width: 1920, height: 1080 }
        })
      ];
      
      // Window positioned on secondary display
      const currentWindow = ChromeApiMock.createMockWindow({
        left: 2400, // 1920 + 480 (center of secondary display)
        top: 300,
        width: 800,
        height: 600
      });
      
      const result = backgroundModule.getDisplayBounds(displays, currentWindow);
      
      // Should use secondary display bounds
      expect(result).toEqual({
        left: 1920,
        top: 0,
        width: 1920,
        height: 1080
      });
    });

    it('should enforce minimum dimensions on display bounds', () => {
      const displays = [
        ChromeApiMock.createMockDisplay({
          workArea: { left: 0, top: 0, width: 300, height: 200 } // Below minimums
        })
      ];
      const currentWindow = ChromeApiMock.DEFAULT_WINDOW;
      
      const result = backgroundModule.getDisplayBounds(displays, currentWindow);
      
      expect(result).toEqual({
        left: 0,
        top: 0,
        width: 400, // Enforced minimum
        height: 300 // Enforced minimum
      });
    });
  });

  describe('getDisplayInfo', () => {
    it('should return display info when available', async () => {
      const mockDisplays = [ChromeApiMock.DEFAULT_DISPLAY];
      chrome.system.display.getInfo = jest.fn().mockImplementation((callback) => {
        callback(mockDisplays);
      });

      const result = await backgroundModule.getDisplayInfo();

      expect(result).toEqual(mockDisplays);
      expect(chrome.system.display.getInfo).toHaveBeenCalled();
    });

    it('should return empty array when display API not available', async () => {
      // Simulate missing display API
      (chrome.system as any).display = undefined;

      const result = await backgroundModule.getDisplayInfo();

      expect(result).toEqual([]);
    });

    it('should handle chrome runtime errors', async () => {
      chrome.system.display.getInfo = jest.fn().mockImplementation((callback) => {
        Object.defineProperty(chrome.runtime, 'lastError', {
          value: { message: 'Display info not available' },
          writable: false,
          configurable: true
        });
        callback([]);
      });

      const result = await backgroundModule.getDisplayInfo();

      expect(result).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith('Display info not available');
    });
  });

  describe('URL validation', () => {
    const testCases = TestUtils.getUrlTestCases();

    describe('Supported URLs', () => {
      testCases.valid.forEach(url => {
        it(`should support ${url}`, async () => {
          const tab = ChromeApiMock.createMockTab({ url });
          
          try {
            await backgroundModule.handleSplitView(tab, 'ja');
            // If no error is thrown, the URL is supported
            expect(true).toBe(true);
          } catch (error) {
            // URL should be supported, so this shouldn't happen
            expect(error.message).not.toContain('cannot be translated');
          }
        });
      });
    });

    describe('Unsupported URLs', () => {
      testCases.unsupported.forEach(url => {
        it(`should reject ${url}`, async () => {
          const tab = ChromeApiMock.createMockTab({ url });
          
          await expect(backgroundModule.handleSplitView(tab, 'ja'))
            .rejects
            .toThrow('cannot be translated');
        });
      });
    });
  });

  describe('Tab validation', () => {
    it('should reject tab without URL', async () => {
      const tab = ChromeApiMock.createMockTab({ url: undefined });
      
      await expect(backgroundModule.handleSplitView(tab, 'ja'))
        .rejects
        .toThrow('tab information is invalid');
    });

    it('should reject tab without windowId', async () => {
      const tab = ChromeApiMock.createMockTab({ windowId: undefined });
      
      await expect(backgroundModule.handleSplitView(tab, 'ja'))
        .rejects
        .toThrow('tab information is invalid');
    });

    it('should reject null tab', async () => {
      await expect(backgroundModule.handleSplitView(null, 'ja'))
        .rejects
        .toThrow('tab information is invalid');
    });

    it('should reject undefined tab', async () => {
      await expect(backgroundModule.handleSplitView(undefined, 'ja'))
        .rejects
        .toThrow('tab information is invalid');
    });
  });
});
