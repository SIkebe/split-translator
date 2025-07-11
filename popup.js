// Popup script
document.addEventListener('DOMContentLoaded', function() {
  const splitAndTranslateButton = document.getElementById('splitAndTranslate');
  const targetLanguageSelect = document.getElementById('targetLanguage');
  const statusDiv = document.getElementById('status');

  // Helper function to update status with proper accessibility
  function updateStatus(message, type = 'info') {
    let textNode = Array.from(statusDiv.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
    if (textNode) {
      textNode.nodeValue = message;
    } else {
      textNode = document.createTextNode(message);
      statusDiv.appendChild(textNode);
    }
    statusDiv.classList.remove('info', 'error', 'success');
    statusDiv.classList.add(type);

    // Force screen reader announcement for important messages
    if (type === 'error' || type === 'success') {
      statusDiv.setAttribute('aria-live', 'assertive');
      // The 100ms delay ensures screen readers announce the updated status message properly
      setTimeout(() => {
        statusDiv.setAttribute('aria-live', 'polite');
      }, 100);
    }
  }

  // Helper function for accessible error messages
  function getAccessibleErrorMessage(errorMessage) {
    const errorMessageMap = {
      'minimum': 'Window size is too small. Please maximize the browser and try again.',
      'not defined': 'Failed to get screen information. Please reload the page and try again.',
      'cannot be translated': 'This page type cannot be translated. Please try on a regular website.',
      'Invalid tab information': 'The tab information is invalid. Please check your browser settings or try again.'
    };

    for (const key in errorMessageMap) {
      if (errorMessage.includes(key)) {
        return errorMessageMap[key];
      }
    }

    return errorMessage;
  }

  // Initialize focus management
  function initializeFocusManagement() {
    // Set initial focus to the language select for better UX
    setTimeout(() => {
      targetLanguageSelect.focus();
    }, 100);
  }

  initializeFocusManagement();

  // Load saved language settings
  chrome.storage.sync.get(['targetLanguage'], function(result) {
    if (result.targetLanguage) {
      targetLanguageSelect.value = result.targetLanguage;
    }
  });

  // Save language selection
  targetLanguageSelect.addEventListener('change', function() {
    chrome.storage.sync.set({
      targetLanguage: targetLanguageSelect.value
    });

    // Announce language change to screen readers
    updateStatus(`Language selected: ${targetLanguageSelect.options[targetLanguageSelect.selectedIndex].text}`, 'info');
  });

  // Get focusable elements for focus management
  const focusableElements = document.querySelectorAll(
    'button, select, input, [tabindex]:not([tabindex="-1"])'
  );
  let firstFocusable = null;
  let lastFocusable = null;
  if (focusableElements.length > 0) {
    firstFocusable = focusableElements[0];
    lastFocusable = focusableElements[focusableElements.length - 1];
  }

  // Unified keyboard navigation support
  document.addEventListener('keydown', function(event) {
    // Handle Enter key on button
    if (event.key === 'Enter' && event.target === splitAndTranslateButton) {
      event.preventDefault();
      splitAndTranslateButton.click();
      return;
    }

    // Handle Escape key to close popup
    if (event.key === 'Escape') {
      window.close();
      return;
    }

    // Handle Tab key for focus management
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable.focus();
        }
      }
    }
  });

  // Split + Translate button click event
  splitAndTranslateButton.addEventListener('click', async function() {
    try {
      splitAndTranslateButton.disabled = true;
      splitAndTranslateButton.setAttribute('aria-disabled', 'true');
      splitAndTranslateButton.setAttribute('aria-busy', 'true');
      updateStatus('Getting current tab information...', 'info');

      // Get current tab information
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!currentTab) {
        throw new Error('Could not get current tab');
      }

      updateStatus('Executing split view + translation...', 'info');

      // Send split + translate instruction to background script
      const response = await chrome.runtime.sendMessage({
        action: 'splitAndTranslate',
        currentTab: currentTab,
        targetLanguage: targetLanguageSelect.value
      });

      if (response.success) {
        updateStatus('Split + translation completed successfully!', 'success');

        // Close popup after 1 second
        setTimeout(() => {
          window.close();
        }, 1000);
      } else {
        throw new Error(response.error || 'Failed to split + translate');
      }
    } catch (error) {
      console.error('Split + translation error:', error);

      // Display detailed error messages with better accessibility
      let errorMessage = getAccessibleErrorMessage(error.message);

      updateStatus(`Error: ${errorMessage}`, 'error');

      // Restore original status after 5 seconds
      setTimeout(() => {
        updateStatus('Select a language and click "Split + Translate"', 'info');
      }, 5000);
    } finally {
      splitAndTranslateButton.disabled = false;
      splitAndTranslateButton.removeAttribute('aria-busy');
      splitAndTranslateButton.removeAttribute('aria-disabled');
    }
  });
});
