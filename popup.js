// Popup script
document.addEventListener('DOMContentLoaded', function() {
  const splitAndTranslateButton = document.getElementById('splitAndTranslate');
  const targetLanguageSelect = document.getElementById('targetLanguage');
  const statusDiv = document.getElementById('status');

  // Initialize focus management
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

  // Add keyboard navigation support
  document.addEventListener('keydown', function(event) {
    // Handle Enter key on button
    if (event.key === 'Enter' && event.target === splitAndTranslateButton) {
      event.preventDefault();
      splitAndTranslateButton.click();
    }

    // Handle Escape key to close popup
    if (event.key === 'Escape') {
      window.close();
    }
  });

  // Split + Translate button click event
  splitAndTranslateButton.addEventListener('click', async function() {
    try {
      splitAndTranslateButton.disabled = true;
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
    }
  });

  // Helper function to update status with proper accessibility
  function updateStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;

    // Force screen reader announcement for important messages
    if (type === 'error' || type === 'success') {
      statusDiv.setAttribute('aria-live', 'assertive');
      setTimeout(() => {
        statusDiv.setAttribute('aria-live', 'polite');
      }, 100);
    }
  }

  // Helper function for accessible error messages
  function getAccessibleErrorMessage(errorMessage) {
    if (errorMessage.includes('minimum')) {
      return 'Window size is too small. Please maximize the browser and try again.';
    } else if (errorMessage.includes('not defined')) {
      return 'Failed to get screen information. Please reload the page and try again.';
    } else if (errorMessage.includes('cannot be translated')) {
      return 'This page type cannot be translated. Please try on a regular website.';
    } else {
      return errorMessage;
    }
  }

  // Initialize focus management
  function initializeFocusManagement() {
    // Set initial focus to the language select for better UX
    setTimeout(() => {
      targetLanguageSelect.focus();
    }, 100);

    // Manage focus trap within popup
    const focusableElements = document.querySelectorAll(
      'button, select, input, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    document.addEventListener('keydown', function(event) {
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
  }
});
