// Background script (Service Worker)

// Constants
const OVERLAP_PIXELS = 8; // Compensate for window frame gaps
const MIN_WINDOW_WIDTH = 400; // Minimum window width in pixels
const MIN_WINDOW_HEIGHT = 300; // Minimum window height in pixels

// Common error handler
function handleError(error, context) {
  console.error(`${context}:`, error);
  return {
    success: false,
    error: error.message || 'Unknown error'
  };
}

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'splitAndTranslate') {
    handleSplitAndTranslate(request.currentTab, request.targetLanguage)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Split view handling
async function handleSplitView(currentTab, targetLanguage) {
  try {
    console.log('Starting split view:', currentTab);

    // Validate current tab
    if (!currentTab || !currentTab.url || typeof currentTab.windowId !== 'number') {
      throw new Error('Invalid tab information: Missing URL or windowId');
    }

    // Check if URL can be translated
    if (currentTab.url.startsWith('chrome://') ||
        currentTab.url.startsWith('edge://') ||
        currentTab.url.startsWith('about:') ||
        currentTab.url.startsWith('chrome-extension://') ||
        currentTab.url.startsWith('file://')) {
      throw new Error('This page cannot be translated');
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
    const leftPosition = {
      left: displayLeft,
      top: displayTop,
      width: leftWidth,
      height: displayHeight
    };

    const rightPosition = {
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

    // Resize left window
    await chrome.windows.update(currentTab.windowId, {
      ...leftPosition,
      state: 'normal'
    });

    // Save data
    const splitViewData = {
      originalTabId: currentTab.id,
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
async function handleSplitAndTranslate(currentTab, targetLanguage) {
  try {
    console.log('Starting split view + translation:', currentTab);

    // Prepare translation URL in advance (for parallel processing)
    const translateUrl = `https://translate.google.com/translate?sl=auto&tl=${targetLanguage}&u=${encodeURIComponent(currentTab.url)}`;

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
    if (currentUrl.includes('translate.google.com')) {
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
async function getDisplayInfo() {
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
async function waitForTabReady(tabId, maxWaitTime = 3000) {
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

// Get display bounds (helper function)
function getDisplayBounds(displays, currentWindow) {
  if (!displays || !displays.length) {
    console.warn('No display information available, using current window bounds');
    return {
      left: currentWindow.left, // Preserve current window position
      top: currentWindow.top,  // Preserve current window position
      width: Math.max(currentWindow.width, MIN_WINDOW_WIDTH), // Enforce minimum width
      height: Math.max(currentWindow.height, MIN_WINDOW_HEIGHT) // Enforce minimum height
    };
  }

  // Find the display to which the current window belongs
  // Use window center point for accurate detection
  const windowCenterX = currentWindow.left + (currentWindow.width / 2);
  const windowCenterY = currentWindow.top + (currentWindow.height / 2);

  const display = displays.find(d =>
    windowCenterX >= d.workArea.left &&
    windowCenterX < d.workArea.left + d.workArea.width &&
    windowCenterY >= d.workArea.top &&
    windowCenterY < d.workArea.top + d.workArea.height
  ) || displays[0];

  console.log('Detected display:', display);
  console.log('Current window position:', { left: currentWindow.left, top: currentWindow.top, width: currentWindow.width, height: currentWindow.height });

  // Use entire display bounds instead of work area, enforcing minimum dimensions
  return {
    left: display.workArea.left,
    top: display.workArea.top,
    width: display.workArea.width < MIN_WINDOW_WIDTH ? MIN_WINDOW_WIDTH : display.workArea.width,
    height: display.workArea.height < MIN_WINDOW_HEIGHT ? MIN_WINDOW_HEIGHT : display.workArea.height
  };
}

// Extension installation handler
chrome.runtime.onInstalled.addListener(() => {
  console.log('Split Translator extension has been installed');
});
