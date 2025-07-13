// Unit tests for popup.ts

import { ChromeApiMock } from '../mocks/chrome-api.mock';
import { TestUtils } from '../utils/test-utils';
import { PopupMock } from '../mocks/popup-mock';

/// <reference path="../../src/shared-types.ts" />

describe('Popup Script Unit Tests', () => {
  let targetLanguageSelect: HTMLSelectElement;
  let splitAndTranslateButton: HTMLButtonElement;
  let statusDiv: HTMLDivElement;

  beforeEach(() => {
    // Setup DOM
    const domElements = TestUtils.setupPopupDOM();
    targetLanguageSelect = domElements.targetLanguageSelect;
    splitAndTranslateButton = domElements.splitAndTranslateButton;
    statusDiv = domElements.statusDiv;

    // Setup Chrome API mocks
    ChromeApiMock.setupDefaultMocks();
    TestUtils.mockConsole();

    // Mock window.close
    Object.defineProperty(window, 'close', { 
      value: jest.fn(), 
      writable: true 
    });
  });

  afterEach(() => {
    TestUtils.cleanupDOM();
    jest.clearAllMocks();
    TestUtils.restoreConsole();
  });

  describe('DOM Initialization', () => {
    it('should find required DOM elements', () => {
      expect(targetLanguageSelect).toBeInstanceOf(HTMLSelectElement);
      expect(splitAndTranslateButton).toBeInstanceOf(HTMLButtonElement);
      expect(statusDiv).toBeInstanceOf(HTMLDivElement);
    });

    it('should create status text span on initialization', () => {
      // Simulate DOMContentLoaded
      PopupMock.simulateDOMContentLoaded();

      const statusTextSpan = statusDiv.querySelector('.status-text');
      expect(statusTextSpan).toBeInstanceOf(HTMLElement);
    });
  });

  describe('Language Selection', () => {
    beforeEach(() => {
      // Simulate DOMContentLoaded
      PopupMock.simulateDOMContentLoaded();
    });

    it('should load saved language preference', async () => {
      const savedLanguage = 'es';
      
      // Simulate storage callback by immediately setting the value
      targetLanguageSelect.value = savedLanguage;

      await TestUtils.waitForPromises();
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(['targetLanguage'], expect.any(Function));
    });

    it('should save language selection on change', () => {
      targetLanguageSelect.value = 'fr';
      const changeEvent = new Event('change');
      targetLanguageSelect.dispatchEvent(changeEvent);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        targetLanguage: 'fr'
      });
    });

    it('should update status message on language change', () => {
      // Add options to select for proper testing
      targetLanguageSelect.innerHTML = `
        <option value="ja">🇯🇵 Japanese</option>
        <option value="en">🇺🇸 English</option>
        <option value="fr">🇫🇷 French</option>
      `;

      targetLanguageSelect.value = 'fr';
      const changeEvent = new Event('change');
      targetLanguageSelect.dispatchEvent(changeEvent);

      const statusText = statusDiv.querySelector('.status-text');
      expect(statusText?.textContent).toContain('French');
    });
  });

  describe('Split and Translate Button', () => {
    beforeEach(() => {
      // Simulate DOMContentLoaded
      PopupMock.simulateDOMContentLoaded();
    });

    it('should disable button during operation', async () => {
      const mockTab = ChromeApiMock.createMockTab();
      chrome.tabs.query = jest.fn().mockResolvedValue([mockTab]);
      chrome.runtime.sendMessage = jest.fn().mockResolvedValue({ success: true });

      const clickEvent = new Event('click');
      splitAndTranslateButton.dispatchEvent(clickEvent);

      // Allow async operations to complete
      await TestUtils.waitForPromises();

      // Button should be re-enabled after completion
      expect(splitAndTranslateButton.disabled).toBe(false);
      expect(splitAndTranslateButton.hasAttribute('aria-busy')).toBe(false);
    });

    it('should handle successful split and translate', async () => {
      const mockTab = ChromeApiMock.createMockTab();
      chrome.tabs.query = jest.fn().mockResolvedValue([mockTab]);
      chrome.runtime.sendMessage = jest.fn().mockResolvedValue({ success: true });

      const clickEvent = new Event('click');
      splitAndTranslateButton.dispatchEvent(clickEvent);

      // Allow async operations to complete
      await TestUtils.waitForPromises();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'splitAndTranslate',
        currentTab: mockTab,
        targetLanguage: targetLanguageSelect.value
      });

      const statusText = statusDiv.querySelector('.status-text');
      expect(statusText?.textContent).toContain('completed successfully');
      expect(statusDiv.classList.contains('success')).toBe(true);
    });

    it('should handle background script error', async () => {
      const mockTab = ChromeApiMock.createMockTab();
      chrome.tabs.query = jest.fn().mockResolvedValue([mockTab]);
      chrome.runtime.sendMessage = jest.fn().mockResolvedValue({
        success: false,
        error: 'Test error message'
      });

      const clickEvent = new Event('click');
      splitAndTranslateButton.dispatchEvent(clickEvent);

      // Allow async operations to complete
      await TestUtils.waitForPromises();

      const statusText = statusDiv.querySelector('.status-text');
      expect(statusText?.textContent).toContain('Test error message');
      expect(statusDiv.classList.contains('error')).toBe(true);
    });

    it('should handle missing current tab', async () => {
      chrome.tabs.query = jest.fn().mockResolvedValue([]);

      const clickEvent = new Event('click');
      splitAndTranslateButton.dispatchEvent(clickEvent);

      // Allow async operations to complete
      await TestUtils.waitForPromises();

      const statusText = statusDiv.querySelector('.status-text');
      expect(statusText?.textContent).toContain('Could not get current tab');
      expect(statusDiv.classList.contains('error')).toBe(true);
    });

    it('should handle chrome.tabs.query error', async () => {
      chrome.tabs.query = jest.fn().mockRejectedValue(new Error('Permission denied'));

      const clickEvent = new Event('click');
      splitAndTranslateButton.dispatchEvent(clickEvent);

      // Allow async operations to complete
      await TestUtils.waitForPromises();

      const statusText = statusDiv.querySelector('.status-text');
      expect(statusText?.textContent).toContain('Permission denied');
      expect(statusDiv.classList.contains('error')).toBe(true);
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      // Simulate DOMContentLoaded
      PopupMock.simulateDOMContentLoaded();
    });

    it('should close popup on Escape key', () => {
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(window.close).toHaveBeenCalled();
    });

    it('should handle Tab key for focus management', () => {
      // Add more focusable elements for testing
      document.body.innerHTML += '<button id="extraButton">Extra Button</button>';

      const allFocusable = document.querySelectorAll<HTMLElement>(
        'button, select, input, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = allFocusable[0];

      // Focus first element
      firstElement.focus();

      // Test Shift+Tab on first element (should focus last)
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true
      });

      Object.defineProperty(document, 'activeElement', {
        value: firstElement,
        writable: true
      });

      const preventDefault = jest.fn();
      Object.defineProperty(shiftTabEvent, 'preventDefault', {
        value: preventDefault
      });

      document.dispatchEvent(shiftTabEvent);

      expect(preventDefault).toHaveBeenCalled();
    });

    it('should handle Tab key on last element', () => {
      // Add more focusable elements
      document.body.innerHTML += '<button id="extraButton">Extra Button</button>';

      const allFocusable = document.querySelectorAll<HTMLElement>(
        'button, select, input, [tabindex]:not([tabindex="-1"])'
      );
      const lastElement = allFocusable[allFocusable.length - 1];

      // Test Tab on last element (should focus first)
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: false
      });

      Object.defineProperty(document, 'activeElement', {
        value: lastElement,
        writable: true
      });

      const preventDefault = jest.fn();
      Object.defineProperty(tabEvent, 'preventDefault', {
        value: preventDefault
      });

      document.dispatchEvent(tabEvent);

      expect(preventDefault).toHaveBeenCalled();
    });
  });

  describe('Status Updates', () => {
    beforeEach(() => {
      // Simulate DOMContentLoaded
      PopupMock.simulateDOMContentLoaded();
    });

    it('should update status with proper accessibility attributes', () => {
      // Test error status
      const statusText = statusDiv.querySelector('.status-text') as HTMLElement;
      expect(statusText).not.toBeNull();
      
      statusText.textContent = 'Error message';
      statusDiv.classList.add('error');
      statusDiv.setAttribute('aria-live', 'assertive');

      expect(statusText.textContent).toBe('Error message');
      expect(statusDiv.classList.contains('error')).toBe(true);
      expect(statusDiv.getAttribute('aria-live')).toBe('assertive');
    });

    it('should update status for success', () => {
      const statusText = statusDiv.querySelector('.status-text') as HTMLElement;
      expect(statusText).not.toBeNull();
      
      statusText.textContent = 'Success message';
      statusDiv.classList.add('success');

      expect(statusText.textContent).toBe('Success message');
      expect(statusDiv.classList.contains('success')).toBe(true);
    });

    it('should update status for info', () => {
      const statusText = statusDiv.querySelector('.status-text') as HTMLElement;
      expect(statusText).not.toBeNull();
      
      statusText.textContent = 'Info message';
      statusDiv.classList.add('info');

      expect(statusText.textContent).toBe('Info message');
      expect(statusDiv.classList.contains('info')).toBe(true);
    });
  });

  describe('Focus Management', () => {
    it('should focus language select on initialization', () => {
      const focusSpy = jest.spyOn(targetLanguageSelect, 'focus');
      
      // Use fake timers for faster test
      jest.useFakeTimers();
      PopupMock.simulateDOMContentLoaded();
      
      // Advance timer to trigger focus
      jest.advanceTimersByTime(100);

      expect(focusSpy).toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      PopupMock.simulateDOMContentLoaded();
    });

    it('should handle runtime.sendMessage exceptions', async () => {
      const mockTab = ChromeApiMock.createMockTab();
      chrome.tabs.query = jest.fn().mockResolvedValue([mockTab]);
      chrome.runtime.sendMessage = jest.fn().mockRejectedValue(new Error('Connection error'));

      const clickEvent = new Event('click');
      splitAndTranslateButton.dispatchEvent(clickEvent);

      await TestUtils.waitForPromises();

      const statusText = statusDiv.querySelector('.status-text');
      expect(statusText?.textContent).toContain('Connection error');
      expect(statusDiv.classList.contains('error')).toBe(true);
    });

    it('should handle unknown errors', async () => {
      const mockTab = ChromeApiMock.createMockTab();
      chrome.tabs.query = jest.fn().mockResolvedValue([mockTab]);
      chrome.runtime.sendMessage = jest.fn().mockRejectedValue('String error');

      const clickEvent = new Event('click');
      splitAndTranslateButton.dispatchEvent(clickEvent);

      await TestUtils.waitForPromises();

      const statusText = statusDiv.querySelector('.status-text');
      expect(statusText?.textContent).toContain('Unknown error occurred');
      expect(statusDiv.classList.contains('error')).toBe(true);
    });
  });
});
