// Background script (Service Worker)

import { SplitAndTranslateMessage, SplitViewData, WindowPosition, DisplayBounds } from './types.js';

// Constants
const OVERLAP_PIXELS = 8; // Compensate for window frame gaps
const MIN_WINDOW_WIDTH = 400; // Minimum window width in pixels
const MIN_WINDOW_HEIGHT = 300; // Minimum window height in pixels
const DEFAULT_WINDOW_WIDTH = 800; // Default window width when current window width is unavailable
const DEFAULT_WINDOW_HEIGHT = 600; // Default window height when current window height is unavailable

// Common error handler
function handleError(error: Error, context: string): { success: false; error: string } {
  console.error(`${context}:`, error);
  return {
    success: false,
    error: error.message || 'Unknown error'
  };
}

// Message listener
chrome.runtime.onMessage.addListener((request: SplitAndTranslateMessage, sender, sendResponse) => {
  if (request.action === 'splitAndTranslate') {
    handleSplitAndTranslate(request.currentTab, request.targetLanguage)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Split view handling
async function handleSplitView(currentTab: chrome.tabs.Tab, targetLanguage: string): Promise<{ success: true }> {
  try {
    console.log('Starting split view:', currentTab);

    // Validate current tab
    if (!currentTab || !currentTab.url || typeof currentTab.windowId !== 'number') {
      throw new Error('The tab information is invalid. Please check your browser settings or try again.');
    }

    // Check if URL can be translated
    const UNSUPPORTED_PREFIXES = [
      'chrome://',
      'edge://',
      'about:',
      'chrome-extension://',
      'edge-extension://',
      'file://',
    ];

    if (UNSUPPORTED_PREFIXES.some(prefix => currentTab.url!.startsWith(prefix)) ||
        currentTab.url!.includes('translate.goog')) {
      throw new Error('This page type cannot be translated. Please try on a regular website.');
    }

    // Get current window information
    const currentWindow = await chrome.windows.get(currentTab.windowId);

    // Get display information (if available)
    const displays = await getDisplayInfo();
    const displayBounds = getDisplayBounds(displays, currentWindow);

    console.log('Number of available displays:', displays.length);
    console.log('Selected display bounds:', displayBounds);

    // Use the entire display
    const displayLeft = displayBounds.left;
    const displayTop = displayBounds.top;
    const displayWidth = displayBounds.width;
    const displayHeight = displayBounds.height;

    // Calculate left and right widths precisely (no gaps, increase overlap)
    const halfWidth = Math.floor(displayWidth / 2);
    const leftWidth = halfWidth + OVERLAP_PIXELS;
    const rightWidth = halfWidth + OVERLAP_PIXELS;

    // Calculate positions (use entire display)
    const leftPosition: WindowPosition = {
      left: displayLeft,
      top: displayTop,
      width: leftWidth,
      height: displayHeight
    };

    const rightPosition: WindowPosition = {
      left: displayLeft + halfWidth - OVERLAP_PIXELS,
      top: displayTop,
      width: rightWidth,
      height: displayHeight
    };

    console.log('Left window position:', leftPosition);
    console.log('Right window position:', rightPosition);

    // Create right window
    const rightWindow = await chrome.windows.create({
      url: currentTab.url,
      ...rightPosition,
      type: 'normal',
      state: 'normal'
    });

    if (!rightWindow || !rightWindow.tabs || !rightWindow.tabs[0]?.id || !rightWindow.id) {
      throw new Error('Failed to create right window');
    }

    // Resize left window
    await chrome.windows.update(currentTab.windowId, {
      ...leftPosition,
      state: 'normal'
    });

    // Save data
    const splitViewData: SplitViewData = {
      originalTabId: currentTab.id!,
      duplicatedTabId: rightWindow.tabs[0].id,
      targetLanguage: targetLanguage,
      originalWindowId: currentTab.windowId,
      duplicatedWindowId: rightWindow.id
    };

    await chrome.storage.local.set({ splitViewData });
    console.log('Split view completed');

    return { success: true };
  } catch (error) {
    console.error('Split view error:', error);
    throw error;
  }
}

// Execute split view and translation at once
async function handleSplitAndTranslate(currentTab: chrome.tabs.Tab, targetLanguage: string): Promise<{ success: true }> {
  try {
    console.log('Starting split view + translation:', currentTab);

    // Prepare translation URL in advance (for parallel processing)
    const translateUrl = `https://translate.google.com/translate?sl=auto&tl=${targetLanguage}&u=${encodeURIComponent(currentTab.url!)}`;

    // 1. Execute split view
    await handleSplitView(currentTab, targetLanguage);

    // Get saved split data
    const result = await chrome.storage.local.get(['splitViewData']);
    if (!result.splitViewData || !result.splitViewData.duplicatedTabId) {
      throw new Error('Split view data not found');
    }

    const duplicatedTabId = result.splitViewData.duplicatedTabId;

    // Wait for right tab to finish loading
    await waitForTabReady(duplicatedTabId);

    // Check right tab URL
    const rightTab = await chrome.tabs.get(duplicatedTabId);
    const currentUrl = rightTab.url;

    // Do nothing if URL is already Google Translate page
    if (currentUrl && currentUrl.includes('translate.google.com')) {
      console.log('Right tab is already a Google Translate page');
      return { success: true };
    }

    // Navigate right tab to Google Translate page
    await chrome.tabs.update(duplicatedTabId, {
      url: translateUrl
    });

    // Wait for translation page to load
    await waitForTabReady(duplicatedTabId, 3000);

    // Activate right window
    await chrome.windows.update(result.splitViewData.duplicatedWindowId, {
      focused: true
    });

    console.log('Split view + translation completed');

    return { success: true };
  } catch (error) {
    console.error('Split view + translation error:', error);
    throw error;
  }
}

// Get display information (helper function)
async function getDisplayInfo(): Promise<chrome.system.display.DisplayInfo[]> {
  if (!chrome.system?.display) return [];

  return new Promise((resolve) => {
    chrome.system.display.getInfo((displays) => {
      if (chrome.runtime.lastError) {
        console.warn('Display info not available');
        resolve([]);
      } else {
        resolve(displays);
      }
    });
  });
}

// Wait for tab to finish loading (helper function)
async function waitForTabReady(tabId: number, maxWaitTime: number = 3000): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab.status === 'complete') return;
    } catch (e) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Helper function to enforce minimum dimensions
function enforceMinimumDimensions(bounds: DisplayBounds): DisplayBounds {
  return {
    ...bounds,
    width: Math.max(bounds.width, MIN_WINDOW_WIDTH),
    height: Math.max(bounds.height, MIN_WINDOW_HEIGHT)
  };
}

// Get display bounds (helper function)
function getDisplayBounds(displays: any[], currentWindow: chrome.windows.Window): DisplayBounds {
  let bounds: DisplayBounds;

  if (!displays || !displays.length) {
    console.warn('No display information available, using current window bounds');
    bounds = {
      left: currentWindow.left ?? 0, // Preserve current window position
      top: currentWindow.top ?? 0,  // Preserve current window position
      width: currentWindow.width ?? DEFAULT_WINDOW_WIDTH,
      height: currentWindow.height ?? DEFAULT_WINDOW_HEIGHT
    };
  } else {
    // Find the display to which the current window belongs
    // Use window center point for accurate detection
    const windowCenterX = (currentWindow.left ?? 0) + ((currentWindow.width ?? DEFAULT_WINDOW_WIDTH) / 2);
    const windowCenterY = (currentWindow.top ?? 0) + ((currentWindow.height ?? DEFAULT_WINDOW_HEIGHT) / 2);

    const display = displays.find(d =>
      windowCenterX >= d.workArea.left &&
      windowCenterX < d.workArea.left + d.workArea.width &&
      windowCenterY >= d.workArea.top &&
      windowCenterY < d.workArea.top + d.workArea.height
    ) || displays[0];

    console.log('Detected display:', display);

    // Use entire display bounds instead of work area
    bounds = {
      left: display.workArea.left,
      top: display.workArea.top,
      width: display.workArea.width,
      height: display.workArea.height
    };
  }

  return enforceMinimumDimensions(bounds);
}

// Extension installation handler
chrome.runtime.onInstalled.addListener(() => {
  console.log('Split Translator extension has been installed');
});
